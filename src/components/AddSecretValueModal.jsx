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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {hasExistingVersions ? "Add New Version" : "Set Secret Value"}
                </h2>
                <p className="text-white/80 text-sm">{secretName}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Warning for existing versions */}
          {hasExistingVersions && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-amber-900 dark:text-amber-100 text-sm">
                    New Version Warning
                  </p>
                  <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">
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
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Secret Value
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                ref={inputRef}
                type={showValue ? "text" : "password"}
                value={secretValue}
                onChange={(e) => setSecretValue(e.target.value)}
                placeholder="Enter your secret value..."
                className="w-full pl-10 pr-12 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                disabled={isSubmitting}
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
              />
              <button
                type="button"
                onClick={() => setShowValue(!showValue)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                {showValue ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Your secret value will be encrypted and stored securely
            </p>
          </div>

          {/* Confirmation checkbox for existing versions */}
          {hasExistingVersions && (
            <label className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-green-500 focus:ring-green-500 mt-0.5"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                I understand this will create a new version and disable all
                previous versions
              </span>
            </label>
          )}

          {/* Security Features */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              <span className="text-xs text-slate-600 dark:text-slate-400">
                AES-256 Encrypted
              </span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
              <History className="w-5 h-5 text-blue-500" />
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Version History
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all disabled:opacity-50"
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
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  {hasExistingVersions ? "Add Version" : "Set Value"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSecretValueModal;
