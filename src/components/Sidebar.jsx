import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  Briefcase,
  Wallet,
  Users,
  Activity,
  Gamepad2,
  Lock,
  LockOpen,
  FileText,
  FolderKey,
  FolderLock,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

const Sidebar = ({
  onNewPassword,
  selectedCategory,
  onCategoryChange,
  onUnlock,
  onNavigate,
}) => {
  const { mek, lockVault } = useAuth();
  const location = useLocation();
  const isVaultUnlocked = !!mek;
  const isPasswordsPage =
    location.pathname === "/app" || location.pathname === "/app/";
  const isLogsPage = location.pathname.includes("/logs");

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("sidebar_collapsed") === "true";
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar_collapsed", String(next));
      return next;
    });
  };

  const handleLockVault = async () => {
    try {
      await lockVault();
      toast.success("Vault Locked Successfully", {
        icon: "🔒",
        duration: 1500,
      });
    } catch (error) {
      toast.success("Vault Locked Successfully", {
        icon: "🔒",
        duration: 1500,
      });
    }
  };

  const categories = [
    { name: "All Vault", icon: LayoutGrid, value: "", count: 0 },
    { name: "Work", icon: Briefcase, value: "Work", count: 0 },
    { name: "Gaming", icon: Gamepad2, value: "Game", count: 0 },
    { name: "Finance", icon: Wallet, value: "Finance", count: 0 },
    { name: "Social", icon: Users, value: "Social", count: 0 },
  ];

  const handleCategoryClick = (categoryValue) => {
    if (onCategoryChange) {
      onCategoryChange(categoryValue);
    }
  };

  const secondaryLinks = [
    { name: "Secret Notes", icon: FileText, path: "/app/notes" },
    { name: "Secure Files", icon: FolderLock, path: "/app/files" },
    { name: "Secret Manager", icon: FolderKey, path: "/app/secret-manager" },
    { name: "Activity Logs", icon: Activity, path: "/app/logs" },
    { name: "Trash Bin", icon: Trash2, path: "/app/trash" },
  ];

  return (
    <aside
      className={`relative flex flex-col h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/70 dark:border-slate-800/70 transition-all duration-300 ease-in-out select-none ${isCollapsed ? "w-[72px]" : "w-60"
        }`}
    >
      {/* Header & Logo */}
      <div
        className={`h-16 px-3.5 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2 shrink-0 ${isCollapsed ? "justify-center" : "justify-between"
          }`}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <motion.div
              className="relative flex items-center justify-center shrink-0 w-9 h-9 rounded-xl p-0.5"
            >
              <img
                src="/logo_shield.png"
                alt="Crypta Logo"
                className="w-full h-full object-contain"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col whitespace-nowrap overflow-hidden"
            >
              <span className="text-lg bg-clip-text text-black-700 dark:text-indigo-300 leading-tight">
                Crypta
              </span>
            </motion.div>
          </div>
        )}

        {/* Collapse Toggle Button (Desktop) */}
        <button
          onClick={toggleCollapse}
          className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3.5 px-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
        {/* Categories Section */}
        <nav className="space-y-1">
          {!isCollapsed && (
            <p className="px-2 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase mb-1.5">
              Categories
            </p>
          )}
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive =
              isPasswordsPage && selectedCategory === category.value;
            return (
              <NavLink
                key={category.value}
                to="/app"
                onClick={() => handleCategoryClick(category.value)}
                title={isCollapsed ? category.name : undefined}
                className={`relative flex items-center ${isCollapsed ? "justify-center h-10 px-0" : "justify-between py-2 px-2.5"
                  } rounded-xl text-xs font-medium transition-all duration-200 group ${isActive
                    ? "bg-blue-50/90 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 dark:bg-blue-400 rounded-r-full" />
                )}
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${isActive
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                      }`}
                  />
                  {!isCollapsed && (
                    <span className="truncate">{category.name}</span>
                  )}
                </div>
                {!isCollapsed && category.count > 0 && (
                  <span
                    className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-md ${isActive
                      ? "bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      }`}
                  >
                    {category.count}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="border-t border-slate-200/60 dark:border-slate-800/60 my-2" />

        {/* Secondary Links */}
        <nav className="space-y-1">
          {!isCollapsed && (
            <p className="px-2 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase mb-1.5">
              Tools & Features
            </p>
          )}
          {secondaryLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                title={isCollapsed ? link.name : undefined}
                onClick={() => {
                  if (onNavigate) {
                    onNavigate();
                  }
                }}
                className={({ isActive }) =>
                  `relative flex items-center ${isCollapsed ? "justify-center h-10 px-0" : "py-2 px-2.5"
                  } rounded-xl text-xs font-medium transition-all duration-200 group ${isActive
                    ? "bg-blue-50/90 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 dark:bg-blue-400 rounded-r-full" />
                    )}
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${isActive
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                          }`}
                      />
                      {!isCollapsed && (
                        <span className="truncate">{link.name}</span>
                      )}
                    </div>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Vault Status - Hidden on Logs Page */}
      {!isLogsPage && (
        <div className="p-3 border-t border-slate-200/60 dark:border-slate-800/60 shrink-0">
          {!isCollapsed ? (
            <div
              className={`rounded-xl p-2.5 transition-all flex items-center justify-between border ${isVaultUnlocked
                ? "bg-emerald-500/10 border-emerald-500/20 dark:bg-emerald-950/20"
                : "bg-amber-500/10 border-amber-500/20 dark:bg-amber-950/20"
                }`}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isVaultUnlocked ? "bg-emerald-400" : "bg-amber-400"
                      }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${isVaultUnlocked ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                  />
                </span>
                <div className="flex flex-col truncate">
                  <span
                    className={`text-[11px] font-semibold leading-tight truncate ${isVaultUnlocked
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-amber-700 dark:text-amber-300"
                      }`}
                  >
                    {isVaultUnlocked ? "Vault Unlocked" : "Vault Locked"}
                  </span>
                  <span
                    className={`text-[10px] truncate ${isVaultUnlocked
                      ? "text-emerald-600/80 dark:text-emerald-400/80"
                      : "text-amber-600/80 dark:text-amber-400/80"
                      }`}
                  >
                    {isVaultUnlocked ? "Encrypted & active" : "Unlock required"}
                  </span>
                </div>
              </div>

              <button
                onClick={isVaultUnlocked ? handleLockVault : onUnlock}
                title={isVaultUnlocked ? "Lock Vault" : "Unlock Vault"}
                className={`p-1.5 rounded-lg transition-colors shrink-0 ${isVaultUnlocked
                  ? "hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                  : "hover:bg-amber-500/20 text-amber-700 dark:text-amber-300"
                  }`}
              >
                {isVaultUnlocked ? (
                  <Lock className="w-3.5 h-3.5" />
                ) : (
                  <LockOpen className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={isVaultUnlocked ? handleLockVault : onUnlock}
              title={isVaultUnlocked ? "Vault Unlocked (Click to Lock)" : "Vault Locked (Click to Unlock)"}
              className={`w-full h-9 rounded-xl flex items-center justify-center transition-all ${isVaultUnlocked
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                }`}
            >
              {isVaultUnlocked ? (
                <Lock className="w-4 h-4 text-emerald-500" />
              ) : (
                <LockOpen className="w-4 h-4 text-amber-500" />
              )}
            </button>
          )}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
