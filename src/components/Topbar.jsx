import { useState } from "react";
import {
  Search,
  Moon,
  Sun,
  Lock,
  LogOut,
  User,
  ChevronDown,
  Code,
  Menu,
  LockOpen,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import toast from "react-hot-toast";

const headerBtn = "h-11 flex items-center rounded-xl transition-all duration-300 hover:scale-105 active:scale-95";

const Topbar = ({
  searchQuery = "",
  onSearchChange,
  onMenuToggle,
  onUnlock,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, lockVault, mek } = useAuth();
  const isVaultUnlocked = !!mek;
  const { theme, toggleTheme } = useTheme();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

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
      toast.success("Vault Locked Successfully", {
        icon: "🔒",
        duration: 1500,
      });
    } catch (error) {
      // Still show success as the vault was locked locally
      toast.success("Vault Locked Successfully", {
        icon: "🔒",
        duration: 1500,
      });
    }
  };

  const handleLock = async () => {
    // Lock the vault (clear master password from memory but keep token)
    try {
      await lockVault();
      toast.success("Vault Locked Successfully", {
        icon: "🔒",
        duration: 1500,
      });
    } catch (error) {
      // Still show success as the vault was locked locally
      toast.success("Vault Locked Successfully", {
        icon: "🔒",
        duration: 1500,
      });
    }
  };

  const handleSearchChange = (e) => {
    if (onSearchChange) {
      onSearchChange(e.target.value);
    }
  };

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-800/50 sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Left: Hamburger Menu (mobile only) */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all hover:scale-105 active:scale-95"
          aria-label="Toggle menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Center: Search Bar */}
        <div className="flex-1 mr-4 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={getSearchPlaceholder()}
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all outline-none shadow-sm"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`${headerBtn} w-11 justify-center bg-slate-100 dark:bg-slate-800`}
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className={`${headerBtn} px-3 bg-slate-100 dark:bg-slate-800 gap-2`}
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 transition-transform ${
                  isUserMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsUserMenuOpen(false)}
                />

                {/* Menu */}
                <div className="absolute right-0 mt-2 w-56 glass-panel overflow-hidden z-40 origin-top-right animate-scale-up">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                      {user?.email}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Vault Manager
                    </p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <button
                      onClick={isVaultUnlocked ? handleLockVault : onUnlock}
                      className="w-full flex items-center gap-3 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      {isVaultUnlocked ? (
                        <>
                          <Lock className="text-xs w-4 h-4" />
                          <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                            Lock Vault
                          </p>
                        </>
                      ) : (
                        <>
                          <LockOpen className="text-xs w-4 h-4" />
                          <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                            Unlock Vault
                          </p>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        navigate("/app/secret-manager");
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Code className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Secret Manager
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        handleLogout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="px-4 pb-3 md:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={getSearchPlaceholder()}
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all outline-none shadow-sm"
            />
        </div>
      </div>
    </header>
  );
};

export default Topbar;
