const fs = require("node:fs");
const path = require("node:path");

const APP_SCHEME = "app";
const APP_HOST = "crypta";
const APP_ORIGIN = `${APP_SCHEME}://${APP_HOST}`;
const DEV_APP_URL = "http://localhost:5173";

// Electron's fs understands paths inside app.asar; process.loadEnvFile does not
// (it goes through Node's internal binding), so packaged builds would silently
// fall back. Hence the manual read + parse.
const ENV_LINE = /^\s*(?:export\s+)?([A-Za-z_]\w*)\s*=([\s\S]*)$/;

const applyEnvText = (text) => {
  for (const line of text.split(/\r?\n/)) {
    const match = ENV_LINE.exec(line);
    if (!match) continue;
    const [, key, raw] = match;
    // A real environment variable always beats the file.
    if (process.env[key] !== undefined) continue;
    process.env[key] = raw.trim().replace(/^(['"])(.*)\1$/, "$2");
  }
};

const readEnvFile = (file) => {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
};

// Dev and packaged both read the same .env: in dev it sits at the project root,
// in packaged builds electron-builder ships it into the asar.
applyEnvText(readEnvFile(path.join(__dirname, "..", ".env")));

// Resolution order: per-run environment override, then the value from .env.
// The hardcoded default only applies to a checkout with no .env at all.
const API_BASE_URL = (
  process.env.CRYPTA_API_BASE_URL || process.env.VITE_API_BASE_URL || "http://localhost:5000"
).replace(/\/+$/, "");

// The backend rejects cookie-authenticated writes that carry no Origin header
// (CSRF guard). A main-process fetch has no document to derive one from, so the
// transport supplies this instead. Defaults to the API's own origin, which the
// backend treats as same-site; app://crypta is not in its CORS allowlist.
const API_ORIGIN = (
  process.env.CRYPTA_API_ORIGIN || new URL(API_BASE_URL).origin
).replace(/\/+$/, "");

module.exports = {
  APP_SCHEME,
  APP_HOST,
  APP_ORIGIN,
  APP_CSP:
    "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'none'; frame-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
  API_BASE_URL,
  API_ORIGIN,
  DEV_APP_URL,
  applyEnvText,
};
