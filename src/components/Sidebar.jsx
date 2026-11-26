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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";

const navItemClass = (isActive, isCollapsed) =>
  cn(
    "relative flex items-center gap-2.5 rounded-lg text-sm font-medium transition-colors",
    isCollapsed ? "justify-center h-10 w-10 mx-auto" : "py-2 px-2.5",
    isActive
      ? "bg-primary/10 text-primary font-semibold"
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
  );

const ActiveBar = () => (
  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary" />
);

const LabeledNavItem = ({ show, label, children }) =>
  show ? (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  ) : (
    children
  );

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
    } finally {
      // Local key material is cleared either way; the API call can fail offline.
      toast.success("Vault Locked Successfully", { icon: "🔒", duration: 1500 });
    }
  };

  const categories = [
    { name: "All Vault", icon: LayoutGrid, value: "", count: 0 },
    { name: "Work", icon: Briefcase, value: "Work", count: 0 },
    { name: "Gaming", icon: Gamepad2, value: "Game", count: 0 },
    { name: "Finance", icon: Wallet, value: "Finance", count: 0 },
    { name: "Social", icon: Users, value: "Social", count: 0 },
  ];

  const secondaryLinks = [
    { name: "Secret Notes", icon: FileText, path: "/app/notes" },
    { name: "Secure Files", icon: FolderLock, path: "/app/files" },
    { name: "Secret Manager", icon: FolderKey, path: "/app/secret-manager" },
    { name: "Activity Logs", icon: Activity, path: "/app/logs" },
    { name: "Trash Bin", icon: Trash2, path: "/app/trash" },
  ];

  return (
    <aside
      className={cn(
        "relative flex flex-col h-full bg-background/80 backdrop-blur-xl border-r border-border transition-all duration-300 ease-in-out select-none",
        isCollapsed ? "w-[72px]" : "w-60"
      )}
    >
      {/* Header & Logo */}
      <div
        className={cn(
          "h-16 px-3.5 border-b border-border flex items-center gap-2 shrink-0",
          isCollapsed ? "justify-center" : "justify-between"
        )}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex items-center justify-center shrink-0 w-9 h-9 rounded-lg p-0.5">
              <img
                src="/logo_shield.png"
                alt="Crypta Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-lg font-semibold tracking-tight whitespace-nowrap"
            >
              Crypta
            </motion.span>
          </div>
        )}

        <button
          onClick={toggleCollapse}
          className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3.5 px-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
        <nav className="space-y-1">
          {!isCollapsed && (
            <p className="px-2.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-1.5">
              Categories
            </p>
          )}
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = isPasswordsPage && selectedCategory === category.value;
            return (
              <LabeledNavItem key={category.value} show={isCollapsed} label={category.name}>
                <NavLink
                  to="/app"
                  onClick={() => onCategoryChange?.(category.value)}
                  className={navItemClass(isActive, isCollapsed)}
                >
                  {isActive && !isCollapsed && <ActiveBar />}
                  <Icon className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span className="truncate">{category.name}</span>}
                  {!isCollapsed && category.count > 0 && (
                    <span className="ml-auto text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {category.count}
                    </span>
                  )}
                </NavLink>
              </LabeledNavItem>
            );
          })}
        </nav>

        <div className="border-t border-border my-2" />

        <nav className="space-y-1">
          {!isCollapsed && (
            <p className="px-2.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-1.5">
              Tools & Features
            </p>
          )}
          {secondaryLinks.map((link) => {
            const Icon = link.icon;
            return (
              <LabeledNavItem key={link.path} show={isCollapsed} label={link.name}>
                <NavLink
                  to={link.path}
                  onClick={() => onNavigate?.()}
                  className={({ isActive }) => navItemClass(isActive, isCollapsed)}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && !isCollapsed && <ActiveBar />}
                      <Icon className="w-4 h-4 shrink-0" />
                      {!isCollapsed && <span className="truncate">{link.name}</span>}
                    </>
                  )}
                </NavLink>
              </LabeledNavItem>
            );
          })}
        </nav>
      </div>

      {/* Vault status */}
      {!isLogsPage && (
        <div className="p-3 border-t border-border shrink-0">
          <LabeledNavItem
            show={isCollapsed}
            label={isVaultUnlocked ? "Vault unlocked — click to lock" : "Vault locked — click to unlock"}
          >
            <button
              onClick={isVaultUnlocked ? handleLockVault : onUnlock}
              className={cn(
                "w-full rounded-lg border flex items-center transition-colors",
                isCollapsed ? "h-10 justify-center" : "p-2.5 justify-between gap-2",
                isVaultUnlocked
                  ? "bg-success/10 border-success/25 text-success hover:bg-success/15"
                  : "bg-warning/10 border-warning/25 text-warning hover:bg-warning/15"
              )}
            >
              {isCollapsed ? (
                isVaultUnlocked ? (
                  <Lock className="w-4 h-4" />
                ) : (
                  <LockOpen className="w-4 h-4" />
                )
              ) : (
                <>
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
                  </span>
                  <span className="flex flex-col truncate text-left">
                    <span className="text-[11px] font-semibold leading-tight truncate">
                      {isVaultUnlocked ? "Vault Unlocked" : "Vault Locked"}
                    </span>
                    <span className="text-[10px] opacity-75 truncate">
                      {isVaultUnlocked ? "Encrypted & active" : "Unlock required"}
                    </span>
                  </span>
                  {isVaultUnlocked ? (
                    <Lock className="w-3.5 h-3.5 shrink-0 ml-auto" />
                  ) : (
                    <LockOpen className="w-3.5 h-3.5 shrink-0 ml-auto" />
                  )}
                </>
              )}
            </button>
          </LabeledNavItem>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
