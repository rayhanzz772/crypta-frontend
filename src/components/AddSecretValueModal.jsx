import { useState, useRef, useEffect } from "react";
import {
  X,
  Key,
  AlertTriangle,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  History,
  Lock,
} from "lucide-react";
import toast from "react-hot-toast";
import { secretVersionsAPI } from "../utils/api";
import Modal from "./Modal";
import { Button } from "@/components/ui/button";

const AddSecretValueModal = ({
  isOpen,
  onClose,
  onSuccess,
  secretId,
  secretName,
  hasExistingVersions,
}) => {
  const [secretValue, setSecretValue] = useState("");
  const [showValue, setShowValue] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const inputRef = useRef(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSecretValue("");
      setShowValue(false);
      setConfirmed(false);
      // Focus input after modal animation
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!secretValue.trim()) {
      toast.error("Please enter a secret value");
      return;
    }

    if (hasExistingVersions && !confirmed) {
      toast.error(
        "Please confirm you understand this will create a new version"
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await secretVersionsAPI.create(secretId, secretValue);

      // Clear input immediately for security
      setSecretValue("");
      setShowValue(false);

      // Call success callback with new version data
      onSuccess(response.data || response);
    } catch (error) {
      console.error("Error creating secret version:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

      // Show more specific error message
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Failed to create secret version";

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSecretValue("");
      setShowValue(false);
      setConfirmed(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="sm"
      showCloseButton={false}
      srTitle={hasExistingVersions ? "Add New Version" : "Set Secret Value"}
      className="p-0 gap-0 max-h-[90vh] flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="shrink-0 bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 shrink-0 bg-primary/10 rounded-xl flex items-center justify-center">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
              {hasExistingVersions ? "Add New Version" : "Set Secret Value"}
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              {secretName}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          disabled={isSubmitting}
          className="shrink-0 text-muted-foreground"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      <form
        id="add-secret-value-form"
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent"
      >
        {/* Warning for existing versions */}
        {hasExistingVersions && (
          <div className="bg-warning/10 border border-warning/25 rounded-lg p-3">
            <div className="flex gap-2.5">
              <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-warning text-xs mb-0.5">
                  New Version Warning
                </p>
                <p className="text-xs text-warning/90 leading-relaxed">
                  This will create a new version and disable all previous
                  versions. The new version will become the active secret value.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Secret Value Input */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Secret Value
          </label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type={showValue ? "text" : "password"}
              value={secretValue}
              onChange={(e) => setSecretValue(e.target.value)}
              placeholder="Enter your secret value..."
              className="w-full pl-9 pr-11 py-2.5 text-sm bg-muted/50 dark:bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-ring focus:border-transparent transition-all outline-none font-mono"
              disabled={isSubmitting}
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
            />
            <button
              type="button"
              onClick={() => setShowValue(!showValue)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showValue ? "Hide value" : "Show value"}
            >
              {showValue ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Your secret value will be encrypted and stored securely
          </p>
        </div>

        {/* Confirmation checkbox for existing versions */}
        {hasExistingVersions && (
          <label className="flex items-start gap-2.5 p-3 bg-muted/50 dark:bg-background border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="w-4 h-4 rounded border-input accent-warning mt-0.5 shrink-0"
            />
            <span className="text-xs text-muted-foreground leading-relaxed">
              I understand this will create a new version and disable all
              previous versions
            </span>
          </label>
        )}

        {/* Security Features */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 p-2.5 bg-muted/50 dark:bg-background border border-border rounded-lg">
            <ShieldCheck className="w-4 h-4 text-success shrink-0" />
            <span className="text-xs text-muted-foreground">
              AES-256 Encrypted
            </span>
          </div>
          <div className="flex items-center gap-2 p-2.5 bg-muted/50 dark:bg-background border border-border rounded-lg">
            <History className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs text-muted-foreground">Version History</span>
          </div>
        </div>
      </form>

      {/* Footer */}
      <div className="shrink-0 flex flex-col sm:flex-row gap-2.5 p-4 sm:px-6 pt-3 border-t border-border bg-card">
        <Button
          type="button"
          variant="secondary"
          onClick={handleClose}
          disabled={isSubmitting}
          className="order-2 sm:order-1 flex-1 rounded-xl font-semibold"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="add-secret-value-form"
          disabled={
            isSubmitting || !secretValue.trim() || (hasExistingVersions && !confirmed)
          }
          className="order-1 sm:order-2 flex-1 rounded-xl font-semibold"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Lock />
              {hasExistingVersions ? "Add Version" : "Set Value"}
            </>
          )}
        </Button>
      </div>
    </Modal>
  );
};

export default AddSecretValueModal;
