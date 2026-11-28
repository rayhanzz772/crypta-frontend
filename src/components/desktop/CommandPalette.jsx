import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, KeyRound, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { vaultAPI, notesAPI } from "@/utils/api";
import { pickList, filterCommands } from "@/utils/palette";
import { cn } from "@/lib/utils";

const MIN_QUERY_LENGTH = 2;
const VAULT_RESULT_LIMIT = 5;

const CommandPalette = ({ open, onOpenChange, commands, onSearchChange }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [vaultHits, setVaultHits] = useState([]);
  const [noteHits, setNoteHits] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const trimmed = query.trim();

  useEffect(() => {
    if (!open) {
      setQuery("");
      setVaultHits([]);
      setNoteHits([]);
      setActiveIndex(0);
      return;
    }
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setVaultHits([]);
      setNoteHits([]);
      setIsSearching(false);
      return;
    }

    let active = true;
    setIsSearching(true);
    const timer = setTimeout(() => {
      // Names and titles are stored in plaintext, so no MEK is needed to search.
      Promise.allSettled([
        vaultAPI.getAll({ search: trimmed, per_page: VAULT_RESULT_LIMIT }),
        notesAPI.getAll({ search: trimmed, per_page: VAULT_RESULT_LIMIT }),
      ]).then(([vault, notes]) => {
        if (!active) return;
        setVaultHits(
          vault.status === "fulfilled"
            ? pickList(vault.value, "vaults").map((item) => ({
                id: `vault-${item.id}`,
                label: item.name || item.title || "Untitled",
                detail: item.category || item.category_name || "",
                group: "Passwords",
                icon: KeyRound,
              }))
            : [],
        );
        setNoteHits(
          notes.status === "fulfilled"
            ? pickList(notes.value, "notes").map((item) => ({
                id: `note-${item.id}`,
                label: item.title || "Untitled",
                detail: item.category_name || "",
                group: "Secret Notes",
                icon: FileText,
              }))
            : [],
        );
        setIsSearching(false);
      });
    }, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [open, trimmed]);

  const results = useMemo(() => {
    const hits = [...vaultHits, ...noteHits].map((hit) => ({
      ...hit,
      run: () => {
        const isNote = hit.group === "Secret Notes";
        navigate(isNote ? "/app/notes" : "/app");
        onSearchChange?.(hit.label);
      },
    }));
    return filterCommands(trimmed, [...hits, ...commands]);
  }, [vaultHits, noteHits, commands, trimmed, navigate, onSearchChange]);

  useEffect(() => setActiveIndex(0), [results.length]);

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % Math.max(results.length, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i - 1 + Math.max(results.length, 1)) % Math.max(results.length, 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const command = results[activeIndex];
      if (!command) return;
      onOpenChange(false);
      command.run();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTitle className="sr-only">Command palette</DialogTitle>
      <DialogContent
        showCloseButton={false}
        className="top-[8%] translate-y-0 gap-0 overflow-hidden p-0 sm:rounded-md w-full max-w-[560px] grid-rows-[auto_1fr]"
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search passwords, notes, or type a command…"
          className="h-11 w-full border-b border-border bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
        />

        <div className="max-h-[320px] overflow-y-auto p-1">
          {isSearching && (
            <p className="flex items-center gap-2 px-2 py-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" /> Searching vault…
            </p>
          )}

          {!isSearching && results.length === 0 && (
            <p className="px-2 py-3 text-xs text-muted-foreground">No matches.</p>
          )}

          {results.map((command, index) => (
            <button
              type="button"
              key={command.id || command.label}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => {
                onOpenChange(false);
                command.run();
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs",
                index === activeIndex ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              )}
            >
              {command.icon && <command.icon className="size-3.5 shrink-0" />}
              <span className="truncate font-medium text-foreground">{command.label}</span>
              {command.detail && (
                <span className="truncate text-muted-foreground">{command.detail}</span>
              )}
              <span className="ml-auto shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground/70">
                {command.group}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommandPalette;
