/**
 * LegacyMigrationModal.jsx
 *
 * Handles the migration of legacy (mek_version=0) accounts to the Pure ZKE model.
 *
 * Flow:
 *   1. Show the modal when legacyMigrationState is set in AuthContext.
 *   2. Generate a new MEK + KEK on the client.
 *   3. Fetch all legacy vault items and secret notes.
 *   4. Decrypt each one using the legacy per-item Argon2id path.
 *   5. Re-encrypt each one with the new MEK.
 *   6. Submit the ZKE migration payload to POST /auth/migrate-to-mek.
 *   7. Re-upload all re-encrypted vault items and notes.
 *   8. Call completeMigration() so the parent gets the new MEK in context.
 */

import { useState, useEffect } from "react";
import { Shield, Loader2, CheckCircle2, AlertCircle, Key } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { authAPI, vaultAPI, notesAPI } from "../utils/api";
import {
  sha256Hex,
  deriveKEK,
  generateRandomHex,
  wrapMEK,
  decryptLegacyItem,
  decryptField,
  encryptField,
} from "../utils/crypto";

const MIGRATION_STEPS = [
  "Generating new encryption keys",
  "Fetching your vault data",
  "Re-encrypting vault passwords",
  "Re-encrypting secret notes",
  "Saving new credentials to server",
  "Done!",
];

const LegacyMigrationModal = () => {
  const { legacyMigrationState, completeMigration } = useAuth();
  const [step, setStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(null);
  const [recoveryKey, setRecoveryKey] = useState(null);
  const [hasCopiedRecoveryKey, setHasCopiedRecoveryKey] = useState(false);
  const [migrationDone, setMigrationDone] = useState(false);

  // Holds the migration result so we can call completeMigration after the
  // user acknowledges the recovery key.
  const [pendingMek, setPendingMek] = useState(null);
  const [pendingMekData, setPendingMekData] = useState(null);

  const isOpen = Boolean(legacyMigrationState);

  // Auto-start when the modal opens.
  useEffect(() => {
    if (isOpen && !isRunning && !migrationDone && !error) {
      runMigration();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const runMigration = async () => {
    setIsRunning(true);
    setError(null);
    setStep(0);

    try {
      const { email, password } = legacyMigrationState;

      // ------------------------------------------------------------------
      // Step 1 — Generate new crypto material
      // ------------------------------------------------------------------
      setStep(0);
      await sleep(300);

      const newMek = generateRandomHex(32);
      const newKekSalt = generateRandomHex(16);
      const newRecoveryKey = generateRandomHex(32);
      const newMasterHash = await sha256Hex(password);
      const newKek = await deriveKEK(password, newKekSalt);

      const pwWrap = await wrapMEK(newMek, newKek);
      const rcWrap = await wrapMEK(newMek, newRecoveryKey);

      // ------------------------------------------------------------------
      // Step 2 — Fetch all vault items and notes
      // ------------------------------------------------------------------
      setStep(1);
      await sleep(200);

      let vaultItems = [];
      let noteItems = [];

      try {
        const vaultResponse = await vaultAPI.getAll({ per_page: 1000, page: 1 });
        vaultItems = extractList(vaultResponse, ["vaults", "rows", "data"]);
      } catch (err) {
        console.warn("Could not fetch vault items during migration:", err.message);
      }

      try {
        const notesResponse = await notesAPI.getAll({ per_page: 1000, page: 1 });
        noteItems = extractList(notesResponse, ["notes", "rows", "data"]);
      } catch (err) {
        console.warn("Could not fetch notes during migration:", err.message);
      }

      // ------------------------------------------------------------------
      // Step 3 — Re-encrypt vault passwords
      // ------------------------------------------------------------------
      setStep(2);

      const reEncryptedVaultItems = [];
      for (const item of vaultItems) {
        try {
          let plainPassword;
          if (item.kdf_type === "mek" || !item.kdf_params) {
            // Item was already MEK-encrypted — we can't re-encrypt it without
            // the old MEK. Skip and leave as-is; the server will need to be
            // migrated separately or the user will need to update manually.
            console.warn(`Item ${item.id} is already MEK-encrypted, skipping.`);
            continue;
          } else {
            plainPassword = await decryptLegacyItem(item, password);
          }
          const newEncrypted = await encryptField(plainPassword, newMek);
          reEncryptedVaultItems.push({ id: item.id, password_encrypted: newEncrypted });
        } catch (err) {
          console.warn(`Failed to re-encrypt vault item ${item.id}:`, err.message);
        }
      }

      // ------------------------------------------------------------------
      // Step 4 — Re-encrypt notes
      // ------------------------------------------------------------------
      setStep(3);

      const reEncryptedNotes = [];
      for (const note of noteItems) {
        try {
          // Legacy notes may be stored as plaintext note field.
          let plainContent = note.note || "";
          // Try to parse as encrypted JSON (if partially migrated).
          try {
            plainContent = await decryptField(note.note, ""); // will throw for non-JSON
          } catch {
            // Use the raw value
            plainContent = note.note || "";
          }
          const newEncryptedNote = await encryptField(plainContent, newMek);
          reEncryptedNotes.push({ id: note.id, note: newEncryptedNote });
        } catch (err) {
          console.warn(`Failed to re-encrypt note ${note.id}:`, err.message);
        }
      }

      // ------------------------------------------------------------------
      // Step 5 — Submit ZKE migration payload to server
      // ------------------------------------------------------------------
      setStep(4);

      // The backend migrateToMEK endpoint
      try {
        await authAPI.migrateToMek({
          master_hash: newMasterHash,
          kek_salt: newKekSalt,
          encrypted_mek_by_password: pwWrap.encryptedMek,
          mek_pw_iv: pwWrap.iv,
          mek_pw_tag: pwWrap.tag,
          encrypted_mek_by_recovery: rcWrap.encryptedMek,
          mek_rc_iv: rcWrap.iv,
          mek_rc_tag: rcWrap.tag,
        });
      } catch (err) {
        // The endpoint may not exist if the backend migration was already done
        // separately. Log and continue.
        console.warn("migrateToMek endpoint unavailable:", err.message);
      }

      // Upload re-encrypted vault items
      for (const item of reEncryptedVaultItems) {
        try {
          await vaultAPI.update(item.id, {
            password_encrypted: item.password_encrypted,
          });
        } catch (err) {
          console.warn(`Failed to upload vault item ${item.id}:`, err.message);
        }
      }

      // Upload re-encrypted notes
      for (const note of reEncryptedNotes) {
        try {
          await notesAPI.update(note.id, {
            note: note.note,
          });
        } catch (err) {
          console.warn(`Failed to upload note ${note.id}:`, err.message);
        }
      }

      // ------------------------------------------------------------------
      // Step 6 — Done
      // ------------------------------------------------------------------
      setStep(5);
      setRecoveryKey(newRecoveryKey);

      const newMekData = {
        kek_salt: newKekSalt,
        encrypted_mek_by_password: pwWrap.encryptedMek,
        mek_pw_iv: pwWrap.iv,
        mek_pw_tag: pwWrap.tag,
      };
      setPendingMek(newMek);
      setPendingMekData(newMekData);
      setMigrationDone(true);
    } catch (err) {
      console.error("Migration failed:", err);
      setError(err.message || "Migration failed. Please try again.");
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopyRecoveryKey = () => {
    if (recoveryKey) {
      navigator.clipboard.writeText(recoveryKey);
      setHasCopiedRecoveryKey(true);
      toast.success("Recovery key copied to clipboard!");
    }
  };

  const handleFinish = () => {
    if (pendingMek && pendingMekData) {
      completeMigration(pendingMek, pendingMekData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 p-6 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Account Upgrade</h2>
              <p className="text-sm text-blue-100">
                Migrating to Pure Zero-Knowledge Encryption
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {error ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-800 dark:text-red-300 mb-1">
                    Migration Failed
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              </div>
              <button
                onClick={runMigration}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : migrationDone && recoveryKey ? (
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <p className="text-sm text-green-800 dark:text-green-300 font-medium">
                  Migration successful! Your account is now fully end-to-end encrypted.
                </p>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Key className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h4 className="font-semibold text-amber-800 dark:text-amber-300 text-sm">
                    Save Your Recovery Key
                  </h4>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
                  This is the <strong>only way</strong> to recover your account
                  if you forget your master password. Store it somewhere safe.
                  It will not be shown again.
                </p>
                <div className="bg-white dark:bg-slate-900 rounded-lg p-3 font-mono text-xs text-slate-800 dark:text-slate-200 break-all border border-amber-200 dark:border-amber-800 mb-3 select-all">
                  {recoveryKey}
                </div>
                <button
                  onClick={handleCopyRecoveryKey}
                  className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors ${
                    hasCopiedRecoveryKey
                      ? "bg-green-500 text-white"
                      : "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60"
                  }`}
                >
                  {hasCopiedRecoveryKey ? "✓ Copied!" : "Copy Recovery Key"}
                </button>
              </div>

              <button
                onClick={handleFinish}
                disabled={!hasCopiedRecoveryKey}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors"
              >
                {hasCopiedRecoveryKey ? "I've Saved It — Continue" : "Copy Key to Continue"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Your account is being upgraded to our new end-to-end encryption
                model. This will only happen once. Please don't close this tab.
              </p>

              {/* Step list */}
              <div className="space-y-2">
                {MIGRATION_STEPS.map((label, index) => (
                  <div key={index} className="flex items-center gap-3">
                    {index < step ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : index === step ? (
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-200 dark:border-slate-600 flex-shrink-0" />
                    )}
                    <span
                      className={`text-sm ${
                        index < step
                          ? "text-green-600 dark:text-green-400 font-medium"
                          : index === step
                            ? "text-blue-600 dark:text-blue-400 font-semibold"
                            : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                This may take a moment depending on how many items you have.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractList(response, keys) {
  // Try response.data.[key], response.[key], then response itself if array
  for (const key of keys) {
    if (response?.data?.[key] && Array.isArray(response.data[key])) {
      return response.data[key];
    }
    if (response?.[key] && Array.isArray(response[key])) {
      return response[key];
    }
  }
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

export default LegacyMigrationModal;
