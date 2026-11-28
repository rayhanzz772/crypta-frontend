const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("cryptaDesktop", {
  isElectron: true,
  platform: process.platform,
  electronVersion: process.versions.electron,
  request: (options) => ipcRenderer.invoke("desktop:request", options),
  copySecret: (text) => ipcRenderer.invoke("desktop:copy-secret", text),
  logout: () => ipcRenderer.invoke("desktop:logout"),
  setContentProtection: (enabled) =>
    ipcRenderer.invoke("desktop:set-content-protection", enabled),
  getMeta: () => ipcRenderer.invoke("desktop:meta"),
  setTitleBarTheme: (theme) => ipcRenderer.invoke("desktop:set-titlebar-theme", theme),
  onAutoLock: (callback) => {
    const handler = () => callback();
    ipcRenderer.on("crypta:auto-lock", handler);
    return () => ipcRenderer.removeListener("crypta:auto-lock", handler);
  },
  onIdleTick: (callback) => {
    const handler = (_event, remaining) => callback(remaining);
    ipcRenderer.on("crypta:idle-tick", handler);
    return () => ipcRenderer.removeListener("crypta:idle-tick", handler);
  },
});
