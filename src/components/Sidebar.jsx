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
  const { masterPassword, lockVault } = useAuth();
  const location = useLocation();
  const isVaultUnlocked = !!masterPassword;
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
    { name: "Secret Manager", icon: FolderKey, path: "/app/secret-manager" },
    { name: "Activity Logs", icon: Activity, path: "/app/logs" },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full">
      {/* Logo & Brand */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 justify-center">
        <img
          src="/logo_shield.png"
          alt="Crypta Logo"
          className="w-8 h-8 object-contain"
        />
        <p className="text-xl font-bold text-gray-900 dark:text-white">
          Crypta
        </p>
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
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all group ${
                  isActive
                    ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 ${
                      isActive
                        ? "text-primary-600 dark:text-primary-400"
                        : "text-slate-500 dark:text-slate-500"
                    }`}
                  />
                  <span className="font-medium text-sm">{category.name}</span>
                </div>
                {category.count > 0 && (
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      isActive
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
          {secondaryLinks.map((link) => {
            const Icon = link.icon;
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
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-5 h-5 ${
                        isActive
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
            className={`rounded-xl p-3 transition-all ${
              isVaultUnlocked
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
                className={`text-xs font-semibold ${
                  isVaultUnlocked
                    ? "text-green-700 dark:text-green-300"
                    : "text-blue-700 dark:text-blue-300"
                }`}
              >
                {isVaultUnlocked ? "Vault Unlocked" : "Vault Locked"}
              </span>
            </div>
            <p
              className={`text-xs ${
                isVaultUnlocked
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
