import { NavLink, useLocation } from "react-router-dom";
import { KeyRound, Lock, LockOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SECONDARY_LINKS } from "@/utils/nav";
import { cn } from "@/lib/utils";

const PRIMARY_VIEW = { name: "Passwords", icon: KeyRound, path: "/app" };
const LOCK_ITEM = { name: "__lock", icon: null, path: "__lock" };

const isActive = (path, pathname) =>
  path === "/app" ? pathname === "/app" || pathname === "/app/" : pathname.startsWith(path);

const RailItem = ({ link, pathname, onUnlock, onLock, isVaultUnlocked }) => {
  const active = isActive(link.path, pathname);
  const isLockToggle = link.path === LOCK_ITEM.path;

  const classes = cn(
    "relative size-10 shrink-0 rounded-none text-muted-foreground",
    "hover:bg-accent hover:text-accent-foreground",
    active && "bg-accent text-accent-foreground",
    active &&
      "before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.5 before:bg-primary",
  );

  const icon = isLockToggle ? (
    isVaultUnlocked ? <Lock className="size-4" /> : <LockOpen className="size-4" />
  ) : (
    <link.icon className="size-4" />
  );

  const label = isLockToggle ? (isVaultUnlocked ? "Lock Vault" : "Unlock Vault") : link.name;

  const control = isLockToggle ? (
    <Button
      variant="ghost"
      size="icon"
      onClick={isVaultUnlocked ? onLock : onUnlock}
      aria-label={label}
      className={classes}
    >
      {icon}
    </Button>
  ) : (
    <Button asChild variant="ghost" size="icon" className={classes}>
      <NavLink to={link.path} aria-label={label} aria-current={active ? "page" : undefined}>
        {icon}
      </NavLink>
    </Button>
  );

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>{control}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
};

const ActivityRail = ({ onUnlock, onLock, isVaultUnlocked }) => {
  const pathname = useLocation().pathname;
  const items = [PRIMARY_VIEW, ...SECONDARY_LINKS, LOCK_ITEM];

  return (
    <nav className="flex w-10 shrink-0 flex-col items-center gap-1 border-r border-border bg-muted/30 py-1 select-none">
      {items.map((link) => (
        <RailItem
          key={link.path}
          link={link}
          pathname={pathname}
          onUnlock={onUnlock}
          onLock={onLock}
          isVaultUnlocked={isVaultUnlocked}
        />
      ))}
    </nav>
  );
};

export default ActivityRail;
