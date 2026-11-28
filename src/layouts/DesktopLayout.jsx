import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HardDriveDownload,
  KeyRound,
  Lock,
  LockOpen,
  LogOut,
  Moon,
  Plus,
  Sun,
} from "lucide-react";
import TitleBar from "@/components/desktop/TitleBar";
import ActivityRail from "@/components/desktop/ActivityRail";
import SidePanel from "@/components/desktop/SidePanel";
import StatusBar from "@/components/desktop/StatusBar";
import CommandPalette from "@/components/desktop/CommandPalette";
import { SECONDARY_LINKS } from "@/utils/nav";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

const DesktopLayout = ({
  children,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  onUnlock,
  onLock,
  onNewPassword,
  onBackup,
}) => {
  const navigate = useNavigate();
  const { mek, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isVaultUnlocked = !!mek;
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const commands = useMemo(
    () => [
      {
        id: "go-passwords",
        label: "Passwords",
        detail: "Vault items",
        group: "Go",
        icon: KeyRound,
        run: () => navigate("/app"),
      },
      ...SECONDARY_LINKS.map((link) => ({
        id: `go-${link.path}`,
        label: link.name,
        detail: "",
        group: "Go",
        icon: link.icon,
        run: () => navigate(link.path),
      })),
      {
        id: "new-password",
        label: "New Password",
        detail: "Create a vault item",
        group: "Vault",
        icon: Plus,
        run: () => {
          navigate("/app");
          onNewPassword?.();
        },
      },
      {
        id: "vault-state",
        label: isVaultUnlocked ? "Lock Vault" : "Unlock Vault",
        detail: isVaultUnlocked ? "Clear the MEK from memory" : "Derive the MEK",
        group: "Vault",
        icon: isVaultUnlocked ? Lock : LockOpen,
        run: () => (isVaultUnlocked ? onLock?.() : onUnlock?.()),
      },
      {
        id: "backup",
        label: "Vault Backup",
        detail: "Export or import encrypted data",
        group: "Vault",
        icon: HardDriveDownload,
        run: () => onBackup?.(),
      },
      {
        id: "theme",
        label: `Switch to ${theme === "light" ? "dark" : "light"} theme`,
        detail: "",
        group: "Account",
        icon: theme === "light" ? Moon : Sun,
        run: () => toggleTheme(),
      },
      {
        id: "logout",
        label: "Logout",
        detail: "End this session",
        group: "Account",
        icon: LogOut,
        run: () => {
          logout();
          navigate("/login");
        },
      },
    ],
    [navigate, isVaultUnlocked, theme, toggleTheme, logout, onNewPassword, onLock, onUnlock, onBackup],
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TitleBar
        onUnlock={onUnlock}
        onLock={onLock}
        onBackup={onBackup}
        onOpenPalette={() => setIsPaletteOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <ActivityRail onUnlock={onUnlock} onLock={onLock} isVaultUnlocked={isVaultUnlocked} />
        <SidePanel
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          selectedCategory={selectedCategory}
          onCategoryChange={onCategoryChange}
        />
        <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
          {/* No max-width: pages fill the pane like a desktop app, not a web article. */}
          <div className="p-4">{children}</div>
        </main>
      </div>

      <StatusBar onUnlock={onUnlock} onLock={onLock} />

      <CommandPalette
        open={isPaletteOpen}
        onOpenChange={setIsPaletteOpen}
        commands={commands}
        onSearchChange={onSearchChange}
      />
    </div>
  );
};

export default DesktopLayout;
