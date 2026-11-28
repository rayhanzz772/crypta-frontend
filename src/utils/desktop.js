const desktop = typeof window !== "undefined" ? window.cryptaDesktop : null;

export const isDesktop = Boolean(desktop?.isElectron);

export const copyText = async (text, { sensitive = false } = {}) => {
  if (sensitive && desktop) {
    return desktop.copySecret(text);
  }
  return navigator.clipboard.writeText(text);
};

export const onAutoLock = (handler) => {
  if (!desktop?.onAutoLock) return () => {};
  return desktop.onAutoLock(handler);
};

export const onIdleTick = (handler) => {
  if (!desktop?.onIdleTick) return () => {};
  return desktop.onIdleTick(handler);
};

export const setDesktopTitleBarTheme = (theme) => desktop?.setTitleBarTheme?.(theme);

export const desktopPlatform = desktop?.platform ?? null;

// Cached so every shell component can read it without repeating the IPC round-trip.
let metaPromise = null;
export const getDesktopMeta = () => {
  if (!desktop?.getMeta) return Promise.resolve(null);
  metaPromise ??= desktop.getMeta().catch(() => null);
  return metaPromise;
};
