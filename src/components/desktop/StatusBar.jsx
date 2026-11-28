import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getDesktopMeta, onIdleTick } from "@/utils/desktop";
import { cn } from "@/lib/utils";

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

const Cell = ({ children, className }) => (
  <span className={cn("flex items-center gap-1.5 px-2", className)}>{children}</span>
);

const StatusBar = ({ onUnlock, onLock }) => {
  const { mek } = useAuth();
  const isVaultUnlocked = !!mek;
  const [meta, setMeta] = useState(null);
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    let active = true;
    getDesktopMeta().then((result) => {
      if (!active) return;
      setMeta(result);
      setRemaining(result?.idleLockSeconds ?? null);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => onIdleTick(setRemaining), []);

  return (
    <footer className="flex h-6 shrink-0 items-center justify-between border-t border-border bg-muted/30 text-[11px] text-muted-foreground select-none">
      <div className="flex items-center divide-x divide-border">
        <button
          type="button"
          onClick={isVaultUnlocked ? onLock : onUnlock}
          className="flex items-center gap-1.5 px-2 hover:text-foreground"
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              isVaultUnlocked ? "bg-success" : "bg-warning",
            )}
          />
          {isVaultUnlocked ? "Vault unlocked" : "Vault locked"}
        </button>
        {meta?.apiBaseUrl && <Cell>{meta.apiBaseUrl}</Cell>}
      </div>

      <div className="flex items-center divide-x divide-border">
        {isVaultUnlocked && remaining != null && (
          <Cell>Auto-lock {formatDuration(remaining)}</Cell>
        )}
        {meta?.version && <Cell>v{meta.version}</Cell>}
        {meta?.electronVersion && <Cell className="hidden xl:flex">Electron {meta.electronVersion}</Cell>}
      </div>
    </footer>
  );
};

export default StatusBar;
