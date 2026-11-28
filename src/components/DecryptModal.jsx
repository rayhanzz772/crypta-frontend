import { useState, useEffect, useRef, useCallback } from "react";
import { copyText } from "@/utils/desktop";
import {
  X,
  Eye,
  EyeOff,
  Copy,
  Lock,
  Unlock,
  Clock,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { getCategoryIcon, getCategoryGradient } from "../utils/categoryIcons";
import { decryptField, safeDecryptField } from "../utils/crypto";
import Modal from "./Modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const DecryptModal = ({ isOpen, onClose, vaultItem }) => {
  const { mek } = useAuth();

  const [decryptedPassword, setDecryptedPassword] = useState("");
  const [decryptedUsername, setDecryptedUsername] = useState("");
  const [decryptedNote, setDecryptedNote] = useState("");
  const [hasDecryptedOnce, setHasDecryptedOnce] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const clearTimerRef = useRef(null);
  const vaultItemId = vaultItem?.id;

  // Pure client-side decryption — no server round-trip needed.
  const handleDecrypt = useCallback(async () => {
    if (!vaultItemId || !mek) return;

    setIsLoading(true);
    try {
      const pwd = await safeDecryptField(vaultItem.password_encrypted, mek);
      setDecryptedPassword(pwd);

      if (vaultItem.username) {
        const uname = await safeDecryptField(vaultItem.username, mek);
        setDecryptedUsername(uname);
      }

      if (vaultItem.note) {
        const note = await safeDecryptField(vaultItem.note, mek);
        setDecryptedNote(note);
      }

      setHasDecryptedOnce(true);
      toast.success("Password decrypted!");
    } catch (error) {
      toast.error("Failed to decrypt password. Is the vault unlocked?");
      console.error("Decryption error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [vaultItemId, mek, vaultItem]);

  // Auto-decrypt on open if MEK is available
  useEffect(() => {
    if (isOpen && vaultItem && vaultItemId && mek) {
      handleDecrypt();
    }
  }, [isOpen, vaultItem, vaultItemId, mek, handleDecrypt]);

  // Auto-clear after 30 seconds
  useEffect(() => {
    if (decryptedPassword && !clearTimerRef.current) {
      setTimeRemaining(30);
      clearTimerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleClearPassword();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (clearTimerRef.current) {
        clearInterval(clearTimerRef.current);
        clearTimerRef.current = null;
      }
    };
  }, [decryptedPassword]);

  const handleCopy = () => {
    if (decryptedPassword) {
      copyText(decryptedPassword, { sensitive: true });
      toast.success("Password copied to clipboard!");
    }
  };

  const handleClearPassword = () => {
    setDecryptedPassword("");
    setDecryptedUsername("");
    setDecryptedNote("");
    setTimeRemaining(30);
    setShowPassword(false);
    if (clearTimerRef.current) {
      clearInterval(clearTimerRef.current);
      clearTimerRef.current = null;
    }
  };

  const handleClose = () => {
    handleClearPassword();
    setShowPassword(false);
    setHasDecryptedOnce(false);
    onClose();
  };

  const resolvedCategory = vaultItem?.category || vaultItem?.category_name;
  const CategoryIcon = getCategoryIcon(resolvedCategory);
  const categoryGradient = getCategoryGradient(resolvedCategory);

  const isDecryptedLayout = Boolean(decryptedPassword) || hasDecryptedOnce;
  const isSensitiveBlurred = !decryptedPassword;

  if (!isOpen || !vaultItem) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      showCloseButton={false}
      srTitle={vaultItem?.name || "Decrypt Password"}
      className="p-0 max-h-[90vh] flex flex-col"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 shrink-0 bg-gradient-to-br ${categoryGradient} rounded-xl flex items-center justify-center shadow-sm`}
          >
            {isDecryptedLayout ? (
              decryptedPassword ? (
                <Unlock className="w-5 h-5 text-white" />
              ) : (
                <Lock className="w-5 h-5 text-white" />
              )
            ) : (
              <CategoryIcon className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
              {vaultItem.name}
            </h2>
            <Badge
              variant={decryptedPassword ? "default" : "outline"}
              className="mt-1 text-[10px] px-1.5 py-0 gap-1"
            >
              {decryptedPassword ? "Decrypted" : "Encrypted"}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="shrink-0 text-muted-foreground"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 space-y-4">
        {/* Username / Email */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Username / Email
          </label>
          <div className="relative">
            <div className="flex items-center rounded-lg border border-input bg-muted/50 dark:bg-background/60 px-3 py-2.5">
              <input
                type="text"
                value={
                  decryptedUsername ||
                  (vaultItem.username?.startsWith("{")
                    ? "••••••••"
                    : vaultItem.username || "")
                }
                readOnly
                className="w-full bg-transparent text-sm text-foreground truncate focus:outline-none"
              />
            </div>
            {!hasDecryptedOnce && (
              <div className="absolute inset-0 bg-muted/60 dark:bg-background/60 backdrop-blur-sm rounded-lg pointer-events-auto cursor-not-allowed" />
            )}
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Password
          </label>
          <div className="relative">
            <div className="flex items-center gap-1 rounded-lg border border-input bg-muted/50 dark:bg-background/60 pl-3 pr-1.5 py-1.5">
              <input
                type={showPassword && decryptedPassword ? "text" : "password"}
                value={decryptedPassword || "••••••••"}
                readOnly
                className="flex-1 min-w-0 bg-transparent py-1 text-sm sm:text-base rounded-md text-foreground font-mono focus:outline-none"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowPassword(!showPassword)}
                disabled={!decryptedPassword}
                className="size-8 shrink-0 text-muted-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                disabled={!decryptedPassword}
                className="size-8 shrink-0 text-muted-foreground"
                aria-label="Copy password"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            {isSensitiveBlurred && (
              <div className="absolute inset-0 bg-muted/60 dark:bg-background/60 backdrop-blur-sm rounded-lg pointer-events-none" />
            )}
          </div>
        </div>

        {/* Auto-clear Timer (only after decrypt at least once) */}
        {isDecryptedLayout && (
          <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-primary/10 border border-primary/25">
            <div className="flex items-center gap-2 min-w-0">
              <Clock className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs sm:text-sm text-primary truncate">
                {decryptedPassword
                  ? `Auto-clear in ${timeRemaining}s`
                  : "Password cleared"}
              </span>
            </div>
            {decryptedPassword && (
              <Button
                variant="link"
                onClick={handleClearPassword}
                className="h-auto p-0 text-xs sm:text-sm text-primary"
              >
                Clear Now
              </Button>
            )}
          </div>
        )}

        {/* Rate Limit Warning */}
        {isRateLimited && (
          <div className="px-3 py-3 rounded-lg bg-destructive/10 border border-destructive/25 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-destructive shrink-0 mt-0.5" />
            <div className="min-w-0">
              <h4 className="font-semibold text-sm text-destructive mb-0.5">
                Too Many Requests
              </h4>
              <p className="text-xs sm:text-sm text-destructive">
                Please wait {countdown} seconds before trying again.
              </p>
            </div>
          </div>
        )}

        {/* Note */}
        {(vaultItem.note || decryptedNote) && (
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Note
            </label>
            <div className="relative">
              <div className="px-3 py-2.5 rounded-lg border border-input bg-muted/50 dark:bg-background/60 max-h-40 sm:max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
                <p className="text-xs sm:text-sm text-foreground whitespace-pre-wrap break-words">
                  {decryptedNote || (hasDecryptedOnce ? "" : "••••••••")}
                </p>
              </div>
              {/* Scroll indicator - shows if content is scrollable */}
              {decryptedNote.length > 200 && (
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card dark:from-background to-transparent rounded-b-lg pointer-events-none"></div>
              )}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="pt-4 border-t border-border grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Category</p>
            <p className="text-sm font-medium text-foreground mt-0.5 truncate">
              {vaultItem.category_name ||
                vaultItem.category ||
                "Uncategorized"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Last Updated</p>
            <p className="text-sm font-medium text-foreground mt-0.5 truncate">
              {vaultItem.updated_at || "N/A"}
            </p>
          </div>
        </div>

        {/* Close */}
        <Button
          variant="secondary"
          onClick={handleClose}
          className="w-full rounded-xl font-semibold"
        >
          Close
        </Button>
      </div>
    </Modal>
  );
};

export default DecryptModal;
