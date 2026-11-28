import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Code,
  HardDriveDownload,
  Lock,
  LockOpen,
  LogOut,
  Moon,
  Search,
  Sun,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { getDesktopMeta, desktopPlatform } from "@/utils/desktop";
import { cn } from "@/lib/utils";

// shortcut: mirrors OVERLAY_WIDTH in electron/main.cjs; upgrade to reading it
// from desktop:meta alone once the first paint can wait for the IPC reply.
const FALLBACK_OVERLAY_WIDTH = desktopPlatform === "darwin" ? 0 : 138;

const TitleBar = ({ onUnlock, onLock, onBackup, onOpenPalette }) => {
  const navigate = useNavigate();
  const { user, mek, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isVaultUnlocked = !!mek;
  const [overlayWidth, setOverlayWidth] = useState(FALLBACK_OVERLAY_WIDTH);

  useEffect(() => {
    let active = true;
    getDesktopMeta().then((meta) => {
      if (active && meta?.overlayWidth != null) setOverlayWidth(meta.overlayWidth);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header
      className={cn(
        "app-drag relative flex shrink-0 items-center gap-3 border-b border-border bg-background",
        "h-[36px] px-3 select-none",
      )}
      style={{ paddingRight: overlayWidth }}
    >
      <div className="flex items-center gap-2">
        <img src="/logo_shield.png" alt="" className="size-4 object-contain" />
        <span className="text-xs font-semibold tracking-tight">Crypta</span>
      </div>

      <div className="flex-1 flex justify-center">
        <button
          type="button"
          onClick={onOpenPalette}
          className="app-no-drag flex h-6 w-full max-w-[420px] items-center gap-2 rounded border border-border bg-muted/50 px-2 text-xs text-muted-foreground hover:border-ring/50 hover:bg-muted"
        >
          <Search className="size-3" />
          <span className="truncate">Search vault, notes and commands…</span>
          <kbd className="ml-auto rounded border border-border bg-background px-1 font-mono text-[10px]">
            Ctrl K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="app-no-drag size-7 text-muted-foreground"
        >
          {theme === "light" ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Account"
              className="app-no-drag size-7 rounded-full bg-primary/15 text-primary"
            >
              <User className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium truncate">{user?.email}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Vault Manager</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={isVaultUnlocked ? onLock : onUnlock}>
              {isVaultUnlocked ? <Lock /> : <LockOpen />}
              {isVaultUnlocked ? "Lock Vault" : "Unlock Vault"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/app/secret-manager")}>
              <Code />
              Secret Manager
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onBackup?.()}>
              <HardDriveDownload />
              Vault Backup
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={handleLogout}
            >
              <LogOut />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default TitleBar;
