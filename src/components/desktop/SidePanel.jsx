import { NavLink, useLocation } from "react-router-dom";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VAULT_CATEGORIES, SECONDARY_LINKS } from "@/utils/nav";
import { getSearchPlaceholder } from "@/utils/searchPlaceholder";
import { cn } from "@/lib/utils";

const rowClass = (active) =>
  cn(
    // justify-start overrides the Button base's justify-center, which would
    // otherwise float every row's icon+label to the middle of the panel.
    "flex h-7 w-full items-center justify-start gap-2 rounded px-2 text-xs text-muted-foreground",
    "hover:bg-accent hover:text-accent-foreground",
    "data-[active=true]:bg-accent data-[active=true]:font-medium data-[active=true]:text-accent-foreground",
  );

const SectionLabel = ({ children }) => (
  <p className="px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">
    {children}
  </p>
);

const SidePanel = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
}) => {
  const location = useLocation();
  const isPasswordsView = location.pathname === "/app" || location.pathname === "/app/";

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-muted/10 select-none">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-border px-2">
        <Search className="size-3.5 shrink-0 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder={getSearchPlaceholder(location.pathname)}
          className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
        />
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-3 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
        <SectionLabel>Vault</SectionLabel>
        <div className="space-y-0.5">
          {VAULT_CATEGORIES.map((category) => (
            <Button
              asChild
              key={category.value}
              variant="ghost"
              className={rowClass(isPasswordsView && selectedCategory === category.value)}
            >
              <NavLink
                to="/app"
                data-active={(isPasswordsView && selectedCategory === category.value) || undefined}
                onClick={() => onCategoryChange?.(category.value)}
              >
                <category.icon className="size-3.5 shrink-0" />
                <span className="truncate">{category.name}</span>
              </NavLink>
            </Button>
          ))}
        </div>

        <SectionLabel>Tools</SectionLabel>
        <div className="space-y-0.5">
          {SECONDARY_LINKS.map((link) => (
            <Button asChild key={link.path} variant="ghost" className={rowClass(false)}>
              <NavLink
                to={link.path}
                data-active={location.pathname.startsWith(link.path) || undefined}
              >
                <link.icon className="size-3.5 shrink-0" />
                <span className="truncate">{link.name}</span>
              </NavLink>
            </Button>
          ))}
        </div>
      </nav>
    </aside>
  );
};

export default SidePanel;
