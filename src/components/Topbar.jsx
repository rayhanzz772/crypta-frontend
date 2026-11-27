import {
  Search,
  Moon,
  Sun,
  Lock,
  LogOut,
  User,
  Code,
  Menu,
  LockOpen,
  HardDriveDownload,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import toast from "react-hot-toast";

const Topbar = ({
  searchQuery = "",
  onSearchChange,
  onMenuToggle,
  onUnlock,
  onBackup,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, lockVault, mek } = useAuth();
  const isVaultUnlocked = !!mek;
  const { theme, toggleTheme } = useTheme();

  // Dynamic placeholder based on current route
  const getSearchPlaceholder = () => {
    if (location.pathname.includes("/notes")) {
      return "Search notes by title, content, or tags...";
    }
    if (location.pathname.includes("/secret-manager")) {
      return "Search projects and secrets...";
    }
    if (location.pathname.includes("/files")) {
      return "Search Folder / file...";
    }
    if (location.pathname.includes("/trash")) {
      return "Search trash items...";
    }
    return "Search passwords...";
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const handleLockVault = async () => {
    try {
      await lockVault();
    } finally {
      // Local key material is cleared either way; the API call can fail offline.
      toast.success("Vault Locked Successfully", { icon: "🔒", duration: 1500 });
    }
  };

  const searchField = (className) => (
    // outer div may carry horizontal padding; the icon anchors to the unpadded inner box
    <div className={className}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder={getSearchPlaceholder()}
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="pl-9 rounded-lg bg-muted/50 border-border"
        />
      </div>
    </div>
  );

  return (
    <header className="bg-background/80 border-b border-border sticky top-0 z-40 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 h-16">
        <Button
          variant="secondary"
          size="icon"
          onClick={onMenuToggle}
          className="lg:hidden shrink-0"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {searchField("flex-1 hidden md:block mr-4")}

        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="secondary"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="gap-2 px-2.5 h-9">
                <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-primary-foreground" />
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium truncate">{user?.email}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Vault Manager</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={isVaultUnlocked ? handleLockVault : onUnlock}
              >
                {isVaultUnlocked ? (
                  <>
                    <Lock />
                    Lock Vault
                  </>
                ) : (
                  <>
                    <LockOpen />
                    Unlock Vault
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate("/app/secret-manager")}
              >
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
      </div>

      {searchField("px-4 pb-3 md:hidden")}
    </header>
  );
};

export default Topbar;
