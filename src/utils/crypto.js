/**
 * crypto.js — Pure client-side Zero-Knowledge Encryption utilities.
 *
 * All cryptographic operations happen here. This module has NO React
 * dependencies and NEVER touches localStorage, sessionStorage, or cookies.
 *
 * Crypto stack:
 *   - SHA-256:    Web Crypto API
 *   - Argon2id:   hash-wasm (WASM, Vite-compatible)
 *   - AES-256-GCM: Web Crypto API
 *   - CSPRNG:     crypto.getRandomValues
 */

import { argon2id } from "hash-wasm";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a hex string to a Uint8Array */
const hexToBytes = (hex) => {
  if (!hex || hex.length % 2 !== 0) throw new Error("Invalid hex string");
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
};

/** Convert a Uint8Array to a lowercase hex string */
const bytesToHex = (bytes) =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

/** Convert a UTF-8 string to a Uint8Array */
const strToBytes = (str) => new TextEncoder().encode(str);

/** Convert a Uint8Array to a UTF-8 string */
const bytesToStr = (bytes) => new TextDecoder().decode(bytes);

// ---------------------------------------------------------------------------
// CSPRNG
// ---------------------------------------------------------------------------

/**
 * Generate cryptographically random bytes and return as a hex string.
 * @param {number} byteCount - Number of bytes to generate.
 * @returns {string} Hex-encoded random bytes.
 */
export const generateRandomHex = (byteCount = 32) => {
  const bytes = new Uint8Array(byteCount);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
};

// ---------------------------------------------------------------------------
// SHA-256
// ---------------------------------------------------------------------------

/**
 * Hash a plaintext string with SHA-256 and return the result as a hex string.
 * Used to produce `master_hash` before sending to the server.
 *
 * @param {string} plaintext
 * @returns {Promise<string>} Hex-encoded SHA-256 digest.
 */
export const sha256Hex = async (plaintext) => {
  const digest = await crypto.subtle.digest("SHA-256", strToBytes(plaintext));
  return bytesToHex(new Uint8Array(digest));
};

// ---------------------------------------------------------------------------
// Argon2id — KEK Derivation
// ---------------------------------------------------------------------------

/**
 * Derive a Key Encryption Key (KEK) using Argon2id.
 *
 * @param {string} masterPassword - The plaintext master password.
 * @param {string} kekSaltHex     - 16-byte salt as a hex string.
 * @returns {Promise<string>} 32-byte derived key as a hex string.
 */
export const deriveKEK = async (masterPassword, kekSaltHex) => {
  const saltBytes = hexToBytes(kekSaltHex);

  // hash-wasm returns a hex-encoded output when outputType is "hex".
  const hashHex = await argon2id({
    password: masterPassword,
    salt: saltBytes,
    // Params must match the backend KDF configuration.
    parallelism: 1,
    iterations: 2,       // time cost
    memorySize: 65536,   // 64 MiB
    hashLength: 32,      // 256-bit output
    outputType: "hex",
  });

  return hashHex;
};

// ---------------------------------------------------------------------------
// AES-256-GCM — Low-level encrypt/decrypt
// ---------------------------------------------------------------------------

/**
 * Import a raw 32-byte hex key as a CryptoKey for AES-256-GCM.
 * @param {string} keyHex - 32-byte key as hex.
 * @returns {Promise<CryptoKey>}
 */
const importAesKey = (keyHex) =>
  crypto.subtle.importKey(
    "raw",
    hexToBytes(keyHex),
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );

/**
 * AES-256-GCM encrypt.
 *
 * @param {string} keyHex       - 32-byte key as hex.
 * @param {Uint8Array} plaintext - Raw bytes to encrypt.
 * @returns {Promise<{ciphertext: string, iv: string, tag: string}>}
 *          All values are hex strings. The GCM authentication tag is the
 *          last 16 bytes of the ciphertext returned by SubtleCrypto.
 */
const aesGcmEncryptRaw = async (keyHex, plaintext) => {
  const key = await importAesKey(keyHex);
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);

  // SubtleCrypto appends the 16-byte auth tag to the ciphertext buffer.
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext),
  );

  // Split ciphertext and tag
  const ciphertext = encrypted.slice(0, encrypted.length - 16);
  const tag = encrypted.slice(encrypted.length - 16);

  return {
    ciphertext: bytesToHex(ciphertext),
    iv: bytesToHex(iv),
    tag: bytesToHex(tag),
  };
};

/**
 * AES-256-GCM decrypt.
 *
 * @param {string} keyHex        - 32-byte key as hex.
 * @param {string} ciphertextHex - Ciphertext as hex.
 * @param {string} ivHex         - 12-byte IV as hex.
 * @param {string} tagHex        - 16-byte auth tag as hex.
 * @returns {Promise<Uint8Array>} Decrypted raw bytes.
 */
const aesGcmDecryptRaw = async (keyHex, ciphertextHex, ivHex, tagHex) => {
  const key = await importAesKey(keyHex);
  const iv = hexToBytes(ivHex);

  // SubtleCrypto expects ciphertext + tag concatenated.
  const cipherBytes = hexToBytes(ciphertextHex);
  const tagBytes = hexToBytes(tagHex);
  const combined = new Uint8Array(cipherBytes.length + tagBytes.length);
  combined.set(cipherBytes);
  combined.set(tagBytes, cipherBytes.length);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    combined,
  );

  return new Uint8Array(decrypted);
};

// ---------------------------------------------------------------------------
// MEK Wrap / Unwrap
// ---------------------------------------------------------------------------

/**
 * Wrap (encrypt) the MEK using a wrap key (KEK or Recovery Key).
 *
 * @param {string} mekHex      - 32-byte MEK as hex.
 * @param {string} wrapKeyHex  - 32-byte wrap key as hex.
 * @returns {Promise<{encryptedMek: string, iv: string, tag: string}>}
 */
export const wrapMEK = async (mekHex, wrapKeyHex) => {
  const { ciphertext, iv, tag } = await aesGcmEncryptRaw(
    wrapKeyHex,
    hexToBytes(mekHex),
  );
  return { encryptedMek: ciphertext, iv, tag };
};

/**
 * Unwrap (decrypt) an encrypted MEK.
 *
 * @param {string} encryptedMekHex - Encrypted MEK as hex.
 * @param {string} ivHex           - 12-byte IV as hex.
 * @param {string} tagHex          - 16-byte auth tag as hex.
 * @param {string} wrapKeyHex      - 32-byte wrap key (KEK or Recovery Key) as hex.
 * @returns {Promise<string>} Unwrapped 32-byte MEK as hex.
 * @throws {Error} If authentication fails (wrong key or tampered data).
 */
export const unwrapMEK = async (
  encryptedMekHex,
  ivHex,
  tagHex,
  wrapKeyHex,
) => {
  const decrypted = await aesGcmDecryptRaw(
    wrapKeyHex,
    encryptedMekHex,
    ivHex,
    tagHex,
  );
  return bytesToHex(decrypted);
};

// ---------------------------------------------------------------------------
// Vault Field Encryption / Decryption
// ---------------------------------------------------------------------------

/**
 * Encrypt a plaintext string using the MEK.
 * Returns a JSON string suitable for sending to the server.
 *
 * @param {string} plaintext - The string to encrypt.
 * @param {string} mekHex    - 32-byte MEK as hex.
 * @returns {Promise<string>} JSON string: `{"ciphertext":"…","iv":"…","tag":"…"}`
 */
export const encryptField = async (plaintext, mekHex) => {
  const { ciphertext, iv, tag } = await aesGcmEncryptRaw(
    mekHex,
    strToBytes(plaintext),
  );
  return JSON.stringify({ ciphertext, iv, tag });
};

/**
 * Decrypt a JSON-encoded encrypted field using the MEK.
 *
 * @param {string} jsonString - JSON string: `{"ciphertext":"…","iv":"…","tag":"…"}`
 * @param {string} mekHex     - 32-byte MEK as hex.
 * @returns {Promise<string>} Decrypted plaintext string.
 * @throws {Error} If the JSON is malformed or decryption fails.
 */
export const decryptField = async (jsonString, mekHex) => {
  if (!jsonString) {
    throw new Error("Encrypted field is empty or missing");
  }

  let parsed;
  try {
    parsed =
      typeof jsonString === "string" ? JSON.parse(jsonString) : jsonString;
  } catch {
    throw new Error("Invalid encrypted field format — expected JSON string");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid encrypted field format — expected JSON object");
  }

  const { ciphertext, iv, tag } = parsed;
  if (!ciphertext || !iv || !tag) {
    throw new Error("Encrypted field is missing ciphertext, iv, or tag");
  }

  const decrypted = await aesGcmDecryptRaw(mekHex, ciphertext, iv, tag);
  return bytesToStr(decrypted);
};

/**
 * Safely attempt to decrypt a field, returning a fallback on failure.
 * Useful when a field may be plaintext (legacy) or encrypted JSON.
 *
 * @param {string|null|undefined} value   - Value from API.
 * @param {string} mekHex                 - MEK as hex.
 * @param {string} [fallback=""]          - Returned if decryption fails or value is falsy.
 * @returns {Promise<string>}
 */
export const safeDecryptField = async (value, mekHex, fallback = "") => {
  if (!value) return fallback;

  try {
    return await decryptField(value, mekHex);
  } catch {
    // Value is likely plaintext (legacy) or not encrypted — return as-is.
    return value;
  }
};

// ---------------------------------------------------------------------------
// Legacy Item Decryption (mek_version = 0)
// ---------------------------------------------------------------------------

/**
 * Derive a per-item encryption key using Argon2id for legacy vault items.
 * Legacy items store their KDF params in the `kdf_params` JSON column.
 *
 * @param {string} masterPassword - The plaintext master password.
 * @param {object} kdfParams      - The parsed kdf_params object from the item.
 *   Expected shape: { salt: string (hex), time: number, mem: number,
 *                     parallelism: number, hashLen: number }
 * @returns {Promise<string>} Derived 32-byte key as hex.
 */
export const legacyDeriveItemKey = async (masterPassword, kdfParams) => {
  const { salt, time = 2, mem = 65536, parallelism = 1, hashLen = 32 } =
    kdfParams;

  const hashHex = await argon2id({
    password: masterPassword,
    salt: hexToBytes(salt),
    parallelism,
    iterations: time,
    memorySize: mem,
    hashLength: hashLen,
    outputType: "hex",
  });

  return hashHex;
};

/**
 * Decrypt a legacy vault item's `password_encrypted` field.
 * Legacy items may use different ciphertext formats; this handles both the
 * old-style JSON blob and raw hex ciphertext with separate iv/tag fields.
 *
 * @param {object} item           - The raw vault item from the API.
 * @param {string} masterPassword - The plaintext master password.
 * @returns {Promise<string>} Decrypted password plaintext.
 */
export const decryptLegacyItem = async (item, masterPassword) => {
  let kdfParams;

  if (typeof item.kdf_params === "string") {
    try {
      kdfParams = JSON.parse(item.kdf_params);
    } catch {
      throw new Error(`Item ${item.id}: kdf_params is not valid JSON`);
    }
  } else if (item.kdf_params && typeof item.kdf_params === "object") {
    kdfParams = item.kdf_params;
  } else {
    throw new Error(`Item ${item.id}: missing kdf_params`);
  }

  const itemKey = await legacyDeriveItemKey(masterPassword, kdfParams);
  return decryptField(item.password_encrypted, itemKey);
};
