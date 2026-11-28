const path = require("node:path");

const APP_SCHEME = "app";
const APP_HOST = "crypta";
const APP_ORIGIN = `${APP_SCHEME}://${APP_HOST}`;
const DEV_APP_URL = "http://localhost:5173";

// Dev: read the same .env Vite uses, so the web and desktop builds cannot drift
// to different ports. Existing env vars win, and packaged builds have no .env
// beside these sources — both cases fall through to the fallback below.
try {
  process.loadEnvFile(path.join(__dirname, "..", ".env"));
} catch {
  /* no .env: packaged, or a clean checkout */
}

// Resolution order: per-run override, then the shared VITE_API_BASE_URL, then
// the build-time default. Edit the default here before building an installer.
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
};
