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
      console.log("Creating secret version with:", {
        secretId,
        secretValue,
      });
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
      className="overflow-hidden"
      srTitle={hasExistingVersions ? "Add New Version" : "Set Secret Value"}
    >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    {hasExistingVersions
                      ? "Add New Version"
                      : "Set Secret Value"}
                  </h2>
                  <p className="text-white/80 text-xs truncate max-w-[200px] sm:max-w-none">
                    {secretName}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Warning for existing versions */}
            {hasExistingVersions && (
              <div className="bg-warning/10 border border-warning/25 rounded-lg p-3">
                <div className="flex gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-warning text-xs">
                      New Version Warning
                    </p>
                    <p className="text-xs text-warning mt-1 leading-relaxed">
                      This will create a new version and disable all previous
                      versions. The new version will become the active secret
                      value.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Secret Value Input */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Secret Value
              </label>
              <div className="relative">
                <Key className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type={showValue ? "text" : "password"}
                  value={secretValue}
                  onChange={(e) => setSecretValue(e.target.value)}
                  placeholder="Enter your secret value..."
                  className="w-full pl-9 pr-11 py-2.5 text-sm border-2 border-slate-200 dark:border-slate-600 rounded-lg bg-card text-foreground focus:border-success focus:ring-2 focus:ring-green-500/20 transition-all outline-none"
                  disabled={isSubmitting}
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                />
                <button
                  type="button"
                  onClick={() => setShowValue(!showValue)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-slate-600 dark:hover:text-foreground transition-colors"
                >
                  {showValue ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Your secret value will be encrypted and stored securely
              </p>
            </div>

            {/* Confirmation checkbox for existing versions */}
            {hasExistingVersions && (
              <label className="flex items-start gap-2.5 p-2.5 bg-muted/50 dark:bg-background rounded-lg cursor-pointer hover:bg-muted transition-colors">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-success focus:ring-green-500 mt-0.5 flex-shrink-0"
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  I understand this will create a new version and disable all
                  previous versions
                </span>
              </label>
            )}

            {/* Security Features */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2.5 bg-muted/50 dark:bg-background rounded-lg">
                <ShieldCheck className="w-4 h-4 text-success flex-shrink-0" />
                <span className="text-xs text-muted-foreground">
                  AES-256 Encrypted
                </span>
              </div>
              <div className="flex items-center gap-2 p-2.5 bg-muted/50 dark:bg-background rounded-lg">
                <History className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-xs text-muted-foreground">
                  Version History
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-3 py-2 text-sm bg-muted text-foreground rounded-lg font-semibold hover:bg-muted transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  !secretValue.trim() ||
                  (hasExistingVersions && !confirmed)
                }
                className="flex-1 px-3 py-2 text-sm bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    {hasExistingVersions ? "Add Version" : "Set Value"}
                  </>
                )}
              </button>
            </div>
          </form>
    </Modal>
  );
};

export default AddSecretValueModal;
