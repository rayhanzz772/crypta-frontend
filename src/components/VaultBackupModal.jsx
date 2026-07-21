import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  HardDriveDownload,
  HardDriveUpload,
  History,
  FileJson,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldAlert,
  Info,
  Lock,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { vaultBackupAPI } from "../utils/api";
import { decryptField } from "../utils/crypto";
import Pagination from "./Pagination";

const VaultBackupModal = ({ isOpen, onClose, onUnlock }) => {
  const { mek } = useAuth();
  const [activeTab, setActiveTab] = useState("export"); // export, import, history

  // Export State
  const [includeNotes, setIncludeNotes] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Import State
  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState(null);
  const fileInputRef = useRef(null);

  // History State
  const [history, setHistory] = useState([]);
  const [historyMetadata, setHistoryMetadata] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setActiveTab("export");
      setImportFile(null);
      setImportResult(null);
      setImportError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeTab === "history" && isOpen) {
      fetchHistory(1);
    }
  }, [activeTab, isOpen]);

  const fetchHistory = async (page) => {
    setIsLoadingHistory(true);
    try {
      const response = await vaultBackupAPI.getHistory(page, 10);
      if (response.success) {
        setHistory(response.data);
        setHistoryMetadata(response.metadata);
        setCurrentPage(page);
      }
    } catch (error) {
      toast.error("Failed to load backup history");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // axios response: { data: Blob, headers: {...} }
      const response = await vaultBackupAPI.exportBackup(includeNotes);

      // Extract filename from Content-Disposition header
      const disposition = response.headers["content-disposition"] || response.headers["Content-Disposition"] || "";
      let filename = "crypta-backup.json";
      if (disposition) {
        const match = disposition.match(/filename="(.+)"/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      const itemCount = response.headers["x-backup-item-count"] || response.headers["X-Backup-Item-Count"] || "";

      // Trigger download using the Blob in response.data
      const blob = response.data;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success(
        `Successfully exported ${itemCount || "items"} to ${filename}`
      );
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to export backup";
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/json" && !file.name.endsWith(".json")) {
        toast.error("Please select a JSON file");
        return;
      }
      setImportFile(file);
      setImportResult(null);
      setImportError(null);
    }
  };

  /**
   * Trial decryption test on a sample item to verify key match.
   */
  const verifyBackupEncryption = async (bundle, mekHex) => {
    if (!bundle || !Array.isArray(bundle.items) || bundle.items.length === 0) {
      return true;
    }

    const sampleItem = bundle.items.find(
      (item) => item.password_encrypted || item.note || item.username
    );

    if (!sampleItem) return true;

    const ciphertextToTest =
      sampleItem.password_encrypted || sampleItem.note || sampleItem.username;

    let parsed;
    try {
      parsed =
        typeof ciphertextToTest === "string"
          ? JSON.parse(ciphertextToTest)
          : ciphertextToTest;
    } catch {
      return true;
    }

    if (parsed && typeof parsed === "object" && parsed.ciphertext && parsed.iv && parsed.tag) {
      try {
        await decryptField(ciphertextToTest, mekHex);
        return true; // ✅ Decryption test succeeded
      } catch (err) {
        console.warn("Pre-import decryption test failed:", err);
        return false; // ❌ Key mismatch
      }
    }

    return true;
  };

  const handleImport = async () => {
    if (!importFile) return;

    setIsImporting(true);
    setImportResult(null);
    setImportError(null);
    try {
      // Read and validate file client-side before sending
      const text = await importFile.text();
      let bundle;
      try {
        bundle = JSON.parse(text);
      } catch (e) {
        throw new Error("Invalid JSON file");
      }

      // Basic validation
      if (bundle.app !== "crypta" || !bundle.zke || !Array.isArray(bundle.items)) {
        throw new Error("Invalid Crypta backup format");
      }

      // 🔍 Pre-Import Verification Test (Trial Decryption)
      if (mek) {
        const isKeyMatching = await verifyBackupEncryption(bundle, mek);
        if (!isKeyMatching) {
          const mismatchMsg =
            "Gagal Mengimpor: Berkas backup ini dienkripsi menggunakan Master Password atau Akun yang berbeda. Anda tidak akan dapat membaca password di dalam berkas ini.";
          setImportError(mismatchMsg);
          toast.error(mismatchMsg, { duration: 5000 });
          return;
        }
      }

      const result = await vaultBackupAPI.importBackup(bundle);
      setImportResult(result);
      toast.success("Backup imported successfully");

      // If we go to history next, it should show the new import
      setHistory([]);
    } catch (error) {
      toast.error(error.message || "Failed to import backup");
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  // Vault locked state — shown inside the modal
  const isVaultLocked = !mek;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                <HardDriveDownload className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                  Vault Backup & Restore
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Export or import your encrypted zero-knowledge vault
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs — hidden when vault is locked */}
          {!isVaultLocked && (
            <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 pt-4 gap-6 bg-slate-50/50 dark:bg-slate-800/50">
              {[
                { id: "export", label: "Export Vault", icon: HardDriveDownload },
                { id: "import", label: "Import Backup", icon: HardDriveUpload },
                { id: "history", label: "Backup History", icon: History },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-all ${isActive
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Vault Locked State */}
            {isVaultLocked ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex flex-col items-center justify-center py-10 px-4 text-center relative overflow-hidden rounded-2xl border border-slate-150/40 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/20 backdrop-blur-sm min-h-[350px]"
              >
                {/* Background glow elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-12 left-12 w-24 h-24 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

                {/* Animated Lock Shield */}
                <motion.div
                  animate={{ 
                    y: [0, -6, 0],
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="relative z-10 w-20 h-20 bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/20 dark:shadow-indigo-900/30"
                >
                  <motion.div
                    animate={{ 
                      scale: [1, 1.05, 1],
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                  >
                    <Lock className="w-9 h-9 text-white drop-shadow-md" />
                  </motion.div>

                  {/* Little pulsing indicator dot */}
                  <span className="absolute top-1 right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
                  </span>
                </motion.div>

                <h3 className="relative z-10 text-2xl font-bold text-slate-800 dark:text-white mb-2 tracking-tight">
                  Security Lock Active
                </h3>
                <p className="relative z-10 text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-8 leading-relaxed">
                  Your password vault is currently encrypted in memory. Please unlock your vault using your master password to export, import, or view backup logs.
                </p>

                <motion.button
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onClose();
                    if (onUnlock) onUnlock();
                  }}
                  className="relative z-10 flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300"
                >
                  <Lock className="w-4 h-4" />
                  Unlock My Vault
                </motion.button>
              </motion.div>
            ) : (
              <>
                {activeTab === "export" && (

                  <div className="space-y-6">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50 flex gap-4">
                      <ShieldAlert className="w-6 h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-1">Zero-Knowledge Export</h3>
                        <p className="text-sm text-indigo-700 dark:text-indigo-400/80">
                          Your exported backup remains fully encrypted with your master password (AES-256-GCM). The server never decrypts your data during export. You can only import this backup if you know the master password used to encrypt it.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <input
                          type="checkbox"
                          checked={includeNotes}
                          onChange={(e) => setIncludeNotes(e.target.checked)}
                          className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <div className="font-medium text-slate-800 dark:text-white">Include Secret Notes</div>
                          <div className="text-sm text-slate-500">Export your encrypted notes alongside passwords</div>
                        </div>
                      </label>
                    </div>

                    <div className="flex flex-col items-center justify-center py-8">
                      <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isExporting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Generating Backup...
                          </>
                        ) : (
                          <>
                            <HardDriveDownload className="w-5 h-5" />
                            Download Encrypted Backup
                          </>
                        )}
                      </button>
                      <p className="text-xs text-slate-500 mt-4">Rate limit: 5 exports per hour</p>
                    </div>
                  </div>
                )}

                {activeTab === "import" && (
                  <div className="space-y-6">

                    {importError && (
                      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-4 rounded-xl flex gap-3 items-start">
                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-red-800 dark:text-red-300 text-sm mb-0.5">
                            Enkripsi Tidak Cocok / Akun Berbeda
                          </h4>
                          <p className="text-xs text-red-700 dark:text-red-300/90 leading-relaxed">
                            {importError}
                          </p>
                        </div>
                      </div>
                    )}

                    {importResult ? (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <CheckCircle2 className="w-8 h-8 text-green-500" />
                          <h3 className="text-lg font-bold text-green-800 dark:text-green-400">Import Successful</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                            <div className="text-sm text-slate-500 mb-1">New Items Added</div>
                            <div className="text-2xl font-bold text-slate-800 dark:text-white">
                              {importResult.total_imported}
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                              ({importResult.imported_passwords} passwords, {importResult.imported_notes} notes)
                            </div>
                          </div>

                          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                            <div className="text-sm text-slate-500 mb-1">Duplicates Skipped</div>
                            <div className="text-2xl font-bold text-slate-800 dark:text-white">
                              {importResult.skipped_passwords + importResult.skipped_notes}
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                              Already exist in vault
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => { setImportResult(null); setImportFile(null); }}
                          className="mt-6 px-4 py-2 bg-green-100 dark:bg-green-800/50 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 font-medium transition-colors"
                        >
                          Import Another File
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800/50 flex gap-4">
                          <Info className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                          <div>
                            <h3 className="font-semibold text-amber-900 dark:text-amber-300 mb-1">Safe Import</h3>
                            <p className="text-sm text-amber-700 dark:text-amber-400/80">
                              Importing is idempotent. Existing items in your vault will not be overwritten or duplicated. Only new items from the backup will be added.
                            </p>
                          </div>
                        </div>

                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                        ${importFile
                              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10'
                              : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                        >
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".json"
                            className="hidden"
                          />

                          {importFile ? (
                            <div className="flex flex-col items-center">
                              <FileJson className="w-12 h-12 text-indigo-500 mb-3" />
                              <div className="font-semibold text-slate-800 dark:text-white">{importFile.name}</div>
                              <div className="text-sm text-slate-500 mt-1">
                                {(importFile.size / 1024).toFixed(2)} KB
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); setImportFile(null); }}
                                className="mt-4 text-sm text-red-500 hover:text-red-600"
                              >
                                Remove file
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <UploadCloud className="w-12 h-12 text-slate-400 mb-3" />
                              <div className="font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Click or drag file to upload
                              </div>
                              <div className="text-sm text-slate-500">
                                Select a Crypta JSON backup file
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-center pt-4">
                          <button
                            onClick={handleImport}
                            disabled={!importFile || isImporting}
                            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                          >
                            {isImporting ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Importing...
                              </>
                            ) : (
                              <>
                                <HardDriveUpload className="w-5 h-5" />
                                Import Backup
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activeTab === "history" && (
                  <div className="flex flex-col h-full min-h-[400px]">
                    {isLoadingHistory ? (
                      <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                      </div>
                    ) : history.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <History className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
                        <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">No Backup History</h3>
                        <p className="text-slate-500 dark:text-slate-400">You haven't exported or imported any backups yet.</p>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col">
                        <div className="flex-1 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                          <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                              <tr>
                                <th className="px-6 py-4 font-medium">Type</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Items</th>
                                <th className="px-6 py-4 font-medium">Date</th>
                                <th className="px-6 py-4 font-medium hidden sm:table-cell">Checksum</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                              {history.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                  <td className="px-6 py-4">
                                    {log.backup_type === "manual_export" ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                        <HardDriveDownload className="w-3.5 h-3.5" />
                                        Export
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                        <HardDriveUpload className="w-3.5 h-3.5" />
                                        Import
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${log.status === 'completed' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
                                      }`}>
                                      {log.status === 'completed' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                      {log.status}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                                    {log.item_count}
                                  </td>
                                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                    {new Date(log.created_at).toLocaleString()}
                                  </td>
                                  <td className="px-6 py-4 font-mono text-xs text-slate-400 dark:text-slate-500 hidden sm:table-cell">
                                    {log.checksum ? `${log.checksum.substring(0, 8)}...` : '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {/* Pagination - Reuse existing component */}
                        {historyMetadata && historyMetadata.total_page > 1 && (
                          <div className="mt-4">
                            <Pagination
                              metadata={historyMetadata}
                              currentPage={currentPage}
                              onPageChange={fetchHistory}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default VaultBackupModal;
