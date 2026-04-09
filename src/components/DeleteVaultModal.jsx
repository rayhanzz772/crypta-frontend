import { useState, useEffect } from "react";
import { X, AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { getCategoryIcon, getCategoryGradient } from "../utils/categoryIcons";
import { useAuth } from "../contexts/AuthContext";

const DeleteVaultModal = ({
  isOpen,
  onClose,
  vaultItem,
  onDelete,
  isDeleting,
}) => {
  const { mek } = useAuth();
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setConfirmText("");
      setError("");
    }
  }, [isOpen]);

  const handleDelete = async () => {
    if (confirmText.toLowerCase() !== "delete") {
      setError('Please type "DELETE" to confirm');
      return;
    }

    setError("");
    const result = await onDelete(vaultItem, mek);

    if (result.success) {
      onClose();
    } else {
      setError(
        result.error || "Failed to delete. Please check your master password.",
      );
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleDelete();
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  if (!isOpen || !vaultItem) return null;

  const CategoryIcon = getCategoryIcon(
    vaultItem?.category || vaultItem?.category_name,
  );
  const categoryGradient = getCategoryGradient(
    vaultItem?.category || vaultItem?.category_name,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 sm:w-7 sm:h-7 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">
                  Delete Password
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isDeleting}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Vault Item Preview */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 sm:p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${categoryGradient} rounded-lg flex items-center justify-center flex-shrink-0`}
              >
                <CategoryIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                  {vaultItem.name}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate">
                  {vaultItem.username}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Warning Message */}
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-3 sm:p-4">
            <div className="flex gap-2 sm:gap-3">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm sm:text-base text-red-900 dark:text-red-100 mb-1">
                  Warning: Permanent Deletion
                </p>
                <p className="text-xs sm:text-sm text-red-800 dark:text-red-200">
                  This password will be permanently deleted and cannot be
                  recovered.
                </p>
              </div>
            </div>
          </div>

          {/* Confirmation Input */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Type{" "}
              <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded font-mono font-bold text-xs sm:text-sm">
                DELETE
              </span>{" "}
              to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value);
                setError("");
              }}
              onKeyPress={handleKeyPress}
              placeholder="Type DELETE"
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border-2 ${
                confirmText.toLowerCase() === "delete"
                  ? "border-green-500 focus:ring-green-500"
                  : "border-slate-300 dark:border-slate-600 focus:ring-blue-500"
              } bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:border-transparent transition-all outline-none`}
              disabled={isDeleting}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
            <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 text-center">
              Your master password from vault unlock will be used to authorize
              this deletion
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
            <button
              onClick={handleClose}
              disabled={isDeleting}
              className="w-full sm:flex-1 px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all disabled:opacity-50 order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={confirmText.toLowerCase() !== "delete" || isDeleting}
              className="w-full sm:flex-1 px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 order-1 sm:order-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  Delete Forever
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteVaultModal;
