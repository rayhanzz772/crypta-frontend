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

  const categories = [
    { name: "All", icon: LayoutGrid, value: "", count: 0 },
    { name: "Work", icon: Briefcase, value: "Work", count: 0 },
    { name: "Game", icon: Gamepad2, value: "Game", count: 0 },
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
  ];

  return (
    <aside className="w-64 glass-panel border-r-0 lg:border-r border-slate-200/50 dark:border-slate-800/50 flex flex-col h-full rounded-none">
      {/* Logo & Brand */}
      <div className="p-4 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center gap-3 justify-center mt-2">
        <motion.img
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          src="/logo_shield.png"
          alt="Crypta Logo"
          className="w-10 h-10 object-contain drop-shadow-md"
        />
        <motion.p
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-primary-500 dark:from-blue-400 dark:to-primary-300"
        >
          Crypta
        </motion.p>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          <p className="px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Categories
          </p>
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive =
              isPasswordsPage && selectedCategory === category.value;
            return (
              <NavLink
                key={category.value}
                to="/app"
                onClick={() => handleCategoryClick(category.value)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group hover:scale-[1.02] active:scale-[0.98] ${isActive
                    ? "bg-gradient-to-r from-primary-500/10 to-blue-500/10 dark:from-primary-900/30 dark:to-blue-900/30 text-primary-700 dark:text-primary-300 shadow-sm border border-primary-100/50 dark:border-primary-800/30"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 border border-transparent"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 ${isActive
                        ? "text-primary-600 dark:text-primary-400"
                        : "text-slate-500 dark:text-slate-500"
                      }`}
                  />
                  <span className="font-medium text-sm">{category.name}</span>
                </div>
                {category.count > 0 && (
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isActive
                        ? "bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
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
        <div className="my-4 mx-3 border-t border-slate-200 dark:border-slate-800"></div>

        {/* Secondary Links */}
        <nav className="space-y-1 px-3">
          <p className="px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Other
          </p>
          {secondaryLinks.map((link, idx) => {
            const Icon = link.icon;

            if (link.action === "open_backup_modal") {
              return (
                <button
                  key={`action-${idx}`}
                  onClick={(e) => {
                    e.preventDefault();
                    if (onNavigate) {
                      onNavigate(link.action);
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 border border-transparent"
                >
                  <Icon className="w-5 h-5 text-slate-500 dark:text-slate-500" />
                  <span className="font-medium text-sm">{link.name}</span>
                </button>
              );
            }

            return (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => {
                  if (onNavigate) {
                    onNavigate();
                  }
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${isActive
                    ? "bg-gradient-to-r from-primary-500/10 to-blue-500/10 dark:from-primary-900/30 dark:to-blue-900/30 text-primary-700 dark:text-primary-300 shadow-sm border border-primary-100/50 dark:border-primary-800/30"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 border border-transparent"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-5 h-5 ${isActive
                          ? "text-primary-600 dark:text-primary-400"
                          : "text-slate-500 dark:text-slate-500"
                        }`}
                    />
                    <span className="font-medium text-sm">{link.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info - Hidden on Logs Page */}
      {!isLogsPage && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <motion.div
            animate={{
              scale: isVaultUnlocked ? 1 : [1, 1.02, 1],
            }}
            transition={{
              duration: 2,
              repeat: isVaultUnlocked ? 0 : Infinity,
              repeatDelay: 1,
            }}
            className={`rounded-xl p-3 transition-all ${isVaultUnlocked
                ? "bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800"
                : "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800"
              }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: isVaultUnlocked ? 0 : [0, -10, 10, -10, 0],
                }}
                transition={{
                  duration: isVaultUnlocked ? 2 : 1,
                  repeat: Infinity,
                  repeatDelay: isVaultUnlocked ? 2 : 1,
                }}
              >
                {isVaultUnlocked ? (
                  <LockOpen className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : (
                  <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                )}
              </motion.div>
              <span
                className={`text-xs font-semibold ${isVaultUnlocked
                    ? "text-green-700 dark:text-green-300"
                    : "text-blue-700 dark:text-blue-300"
                  }`}
              >
                {isVaultUnlocked ? "Vault Unlocked" : "Vault Locked"}
              </span>
            </div>
            <p
              className={`text-xs ${isVaultUnlocked
                  ? "text-green-600 dark:text-green-400"
                  : "text-blue-600 dark:text-blue-400"
                }`}
            >
              {isVaultUnlocked
                ? "All passwords encrypted"
                : "Master password required"}
            </p>
          </motion.div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
