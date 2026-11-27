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
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";

// shadcn sidebar menu-button pattern: ghost base, accent fill when data-active.
const navButtonClass = (isCollapsed) =>
  cn(
    // flex, not inline-flex: collapsed <a> items must stack, not flow like text
    "flex w-full justify-start gap-2.5 h-9 px-2.5 text-muted-foreground",
    "hover:bg-accent hover:text-accent-foreground",
    "data-[active=true]:bg-accent data-[active=true]:font-medium data-[active=true]:text-accent-foreground",
    isCollapsed && "mx-auto h-9 w-9 justify-center px-0"
  );

const NavItem = ({ isCollapsed, label, to, onClick, active, icon: Icon, count }) => {
  const item = (
    <Button
      asChild
      variant="ghost"
      data-active={active || undefined}
      className={navButtonClass(isCollapsed)}
    >
      <NavLink to={to} onClick={onClick} aria-current={active ? "page" : undefined}>
        <Icon />
        {!isCollapsed && <span className="truncate">{label}</span>}
        {!isCollapsed && count > 0 && (
          <Badge
            variant="secondary"
            className="ml-auto rounded px-1.5 py-0 font-mono text-[10px]"
          >
            {count}
          </Badge>
        )}
      </NavLink>
    </Button>
  );

  if (!isCollapsed) return item;

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>{item}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
};

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
        "relative flex flex-col h-full bg-background/95 backdrop-blur-xl border-r border-border transition-all duration-300 ease-in-out select-none",
        isCollapsed ? "w-[72px]" : "w-60"
      )}
    >
      {/* Header & Logo */}
      <div
        className={cn(
          "h-16 px-3 border-b border-border flex items-center gap-2 shrink-0",
          isCollapsed ? "justify-center" : "justify-between"
        )}
      >
        {isCollapsed ? (
          // logo hidden in the 72px rail: header only fits the toggle
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="hidden lg:inline-flex size-7 text-muted-foreground"
            title="Expand Sidebar"
          >
            <PanelLeftOpen />
          </Button>
        ) : (
          <>
            <div className="flex items-center gap-2.5 overflow-hidden pl-1">
              <img
                src="/logo_shield.png"
                alt="Crypta Logo"
                className="w-9 h-9 object-contain"
              />
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-lg font-semibold tracking-tight whitespace-nowrap"
              >
                Crypta
              </motion.span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapse}
              className="hidden lg:inline-flex size-7 text-muted-foreground"
              title="Collapse Sidebar"
            >
              <PanelLeftClose />
            </Button>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-5 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
        <div className="space-y-1">
          {!isCollapsed && (
            <p className="px-2.5 mb-1.5 text-xs font-medium text-muted-foreground">
              Categories
            </p>
          )}
          {categories.map((category) => (
            <NavItem
              key={category.value}
              isCollapsed={isCollapsed}
              label={category.name}
              to="/app"
              active={isPasswordsPage && selectedCategory === category.value}
              onClick={() => onCategoryChange?.(category.value)}
              icon={category.icon}
              count={category.count}
            />
          ))}
        </div>

        <Separator />

        <div className="space-y-1">
          {!isCollapsed && (
            <p className="px-2.5 mb-1.5 text-xs font-medium text-muted-foreground">
              Tools &amp; Features
            </p>
          )}
          {secondaryLinks.map((link) => (
            <NavItem
              key={link.path}
              isCollapsed={isCollapsed}
              label={link.name}
              to={link.path}
              active={location.pathname.startsWith(link.path)}
              onClick={() => onNavigate?.()}
              icon={link.icon}
            />
          ))}
        </div>
      </nav>

      {/* Vault status */}
      {!isLogsPage && (
        <div className="p-3 border-t border-border shrink-0">
          {isCollapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={isVaultUnlocked ? handleLockVault : onUnlock}
                  className={cn(
                    "mx-auto h-9 w-9 justify-center border",
                    isVaultUnlocked
                      ? "bg-success/10 border-success/25 text-success hover:bg-success/15 hover:text-success"
                      : "bg-warning/10 border-warning/25 text-warning hover:bg-warning/15 hover:text-warning"
                  )}
                >
                  {isVaultUnlocked ? <Lock /> : <LockOpen />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {isVaultUnlocked
                  ? "Vault unlocked — click to lock"
                  : "Vault locked — click to unlock"}
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={isVaultUnlocked ? handleLockVault : onUnlock}
              className={cn(
                "w-full rounded-lg border flex items-center p-2.5 justify-between gap-2 transition-colors",
                isVaultUnlocked
                  ? "bg-success/10 border-success/25 text-success hover:bg-success/15"
                  : "bg-warning/10 border-warning/25 text-warning hover:bg-warning/15"
              )}
            >
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
            </button>
          )}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
