const { app, BrowserWindow, Menu, clipboard, ipcMain, powerMonitor, protocol, session, shell } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const config = require("./config.cjs");
const net = require("./net.cjs");

const isDev = !app.isPackaged;
const useBundle = app.isPackaged || process.env.CRYPTA_USE_BUNDLE === "1";
const rendererUrl = useBundle ? `${config.APP_ORIGIN}/` : config.DEV_APP_URL;
const distDir = path.join(app.getAppPath(), "dist");
const CLIPBOARD_CLEAR_MS = 30000;
const IDLE_LOCK_SECONDS = 300;
// Portfolio/demo builds: CRYPTA_ALLOW_SCREENSHOT=1 lifts the capture block.
// Unset in production, so the shipped installer stays protected.
const ALLOW_SCREENSHOT = process.env.CRYPTA_ALLOW_SCREENSHOT === "1";
const IDLE_TICK_MS = 10000;
// Space reserved on the right of the custom title bar for the native overlay buttons.
const OVERLAY_WIDTH = 138;
const TITLEBAR_HEIGHT = 36;

const MIME_TYPES = {
  ".css": "text/css",
  ".gif": "image/gif",
  ".html": "text/html",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript",
  ".json": "application/json",
  ".map": "application/json",
  ".mjs": "text/javascript",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".txt": "text/plain",
  ".wasm": "application/wasm",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

let mainWindow = null;

const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
}

app.enableSandbox();

protocol.registerSchemesAsPrivileged([
  {
    scheme: config.APP_SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

const isAllowedNavigation = (target) => {
  try {
    const url = new URL(target);
    if (url.protocol === "app:") return url.host === config.APP_HOST;
    if (isDev) return url.origin === new URL(config.DEV_APP_URL).origin;
    return false;
  } catch {
    return false;
  }
};

const openExternal = (target) => {
  try {
    const { protocol: scheme } = new URL(target);
    if (scheme === "https:" || scheme === "http:") shell.openExternal(target);
  } catch {
    // Ignore malformed URLs.
  }
};

const serveFile = async (request) => {
  const url = new URL(request.url);

  if (url.host !== config.APP_HOST) {
    return new Response("Not found", { status: 404 });
  }

  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";

  let filePath = path.normalize(path.join(distDir, pathname));
  const insideDist = filePath === distDir || filePath.startsWith(distDir + path.sep);

  if (!insideDist) {
    return new Response("Not found", { status: 404 });
  }

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    // SPA fallback for client-side routes; missing assets still 404.
    if (path.extname(pathname)) {
      return new Response("Not found", { status: 404 });
    }
    filePath = path.join(distDir, "index.html");
  }

  const body = await fs.promises.readFile(filePath);
  const headers = new Headers();
  const mime = MIME_TYPES[path.extname(filePath).toLowerCase()];

  headers.set("Content-Type", mime || "application/octet-stream");
  headers.set("Content-Security-Policy", config.APP_CSP);

  return new Response(body, { status: 200, headers });
};

const buildMenu = () => {
  if (process.platform !== "darwin") {
    Menu.setApplicationMenu(null);
    return;
  }

  Menu.setApplicationMenu(
    Menu.buildFromTemplate([{ role: "appMenu" }, { role: "editMenu" }, { role: "viewMenu" }]),
  );
};

const sendAutoLock = () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("crypta:auto-lock");
  }
};

const sendIdleTick = (remaining) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("crypta:idle-tick", remaining);
  }
};

const titleBarOverlay = (theme = "dark") =>
  theme === "light"
    ? { color: "#ffffff", symbolColor: "#334155", height: TITLEBAR_HEIGHT }
    : { color: "#0b0d14", symbolColor: "#cbd5e1", height: TITLEBAR_HEIGHT };

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#0b0d14",
    show: true,
    autoHideMenuBar: true,
    // Frameless with native caption buttons: the renderer draws its own title bar.
    ...(process.platform === "darwin"
      ? { titleBarStyle: "hidden", trafficLightPosition: { x: 12, y: 11 } }
      : { titleBarStyle: "hidden", titleBarOverlay: titleBarOverlay() }),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      backgroundThrottling: false,
      spellcheck: false,
      devTools: isDev,
    },
  });

  mainWindow.setContentProtection(!ALLOW_SCREENSHOT);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (isAllowedNavigation(url)) return;
    event.preventDefault();
    openExternal(url);
  });

  mainWindow.webContents.on("preload-error", (_event, preloadPath, error) => {
    console.error("Preload failed", preloadPath, error.message);
  });

  mainWindow.loadURL(rendererUrl);
};

app.on("second-instance", () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
});

app.on("web-contents-created", (_event, contents) => {
  contents.on("will-attach-webview", (event) => event.preventDefault());
});

app.whenReady().then(async () => {
  if (!hasSingleInstanceLock) return;

  protocol.handle(config.APP_SCHEME, serveFile);

  session.defaultSession.setPermissionRequestHandler((_contents, permission, callback) => {
    callback(permission === "clipboard-sanitized-write");
  });
  session.defaultSession.setPermissionCheckHandler(
    (_contents, permission) => permission === "clipboard-sanitized-write",
  );

  ipcMain.handle("desktop:request", (_event, options) => net.request(options));

  ipcMain.handle("desktop:logout", async () => {
    clipboard.clear();
    return net.logout();
  });

  ipcMain.handle("desktop:copy-secret", (_event, text) => {
    if (typeof text !== "string" || text.length > 100000) return false;
    clipboard.writeText(text);
    setTimeout(() => {
      if (clipboard.readText() === text) clipboard.clear();
    }, CLIPBOARD_CLEAR_MS);
    return true;
  });

  ipcMain.handle("desktop:set-content-protection", (_event, enabled) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setContentProtection(Boolean(enabled));
    }
    return true;
  });

  ipcMain.handle("desktop:meta", () => ({
    version: app.getVersion(),
    platform: process.platform,
    electronVersion: process.versions.electron,
    apiBaseUrl: config.API_BASE_URL,
    idleLockSeconds: IDLE_LOCK_SECONDS,
    overlayWidth: process.platform === "darwin" ? 0 : OVERLAY_WIDTH,
  }));

  ipcMain.handle("desktop:set-titlebar-theme", (_event, theme) => {
    // macOS has no overlay caption buttons to recolour.
    if (process.platform === "darwin") return false;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setTitleBarOverlay(titleBarOverlay(theme));
    }
    return true;
  });

  buildMenu();
  createWindow();

  powerMonitor.on("lock-screen", sendAutoLock);
  powerMonitor.on("suspend", sendAutoLock);

  // shortcut: idle lock uses system-wide idle time; add per-window blur if needed.
  setInterval(() => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (!mainWindow.isFocused()) {
      sendIdleTick(IDLE_LOCK_SECONDS);
      return;
    }
    const idle = powerMonitor.getSystemIdleTime();
    if (idle >= IDLE_LOCK_SECONDS) sendAutoLock();
    sendIdleTick(Math.max(IDLE_LOCK_SECONDS - idle, 0));
  }, IDLE_TICK_MS);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
