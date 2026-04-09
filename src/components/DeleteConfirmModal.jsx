import { useState, useEffect } from "react";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import Portal from "./Portal";

/**
 * A generic confirmation modal for deleting items.
 * Requires the user to type "DELETE" to enable the delete button.
 */
const DeleteConfirmModal = ({
  isOpen,
  onClose,
  title,
  itemName,
  warningText,
  onConfirm,
  isLoading,
}) => {
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    if (isOpen) {
      setConfirmText("");
    }
  }, [isOpen]);

  const handleDelete = () => {
    if (confirmText.toLowerCase() === "delete") {
      onConfirm();
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
          <div className="p-4 sm:p-6">
            {/* Header & Icon */}
            <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto mb-3 sm:mb-4">
              <Trash2 className="w-7 h-7 sm:w-8 sm:h-8 text-red-600 dark:text-red-400" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white text-center mb-2">
              {title || "Confirm Deletion"}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 text-center mb-4 sm:mb-6 px-2">
              Are you sure you want to delete "<strong>{itemName}</strong>"? This
              action cannot be undone.
            </p>

            {/* Warning Message */}
            <div className="p-3 sm:p-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl mb-4 sm:mb-6">
              <div className="flex gap-2 sm:gap-3">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                  <p className="font-semibold mb-1 text-amber-900 dark:text-amber-100">
                    Warning
                  </p>
                  <p>
                    {warningText ||
                      "This item will be permanently deleted and cannot be recovered."}
                  </p>
                </div>
              </div>
            </div>

            {/* Confirmation Input */}
            <div className="mb-4 sm:mb-6">
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
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-slate-50 dark:bg-slate-900 border-2 rounded-xl focus:ring-2 outline-none transition-all ${
                  confirmText.toLowerCase() === "delete"
                    ? "border-green-500 focus:ring-green-500/20 text-slate-900 dark:text-white"
                    : "border-slate-200 dark:border-slate-700 focus:ring-red-500/20 text-slate-900 dark:text-white"
                }`}
                disabled={isLoading}
                autoFocus
              />
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="w-full sm:flex-1 px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all order-2 sm:order-1 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={confirmText.toLowerCase() !== "delete" || isLoading}
                className="w-full sm:flex-1 px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2 order-1 sm:order-2"
              >
                {isLoading ? (
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
    </Portal>
  );
};

export default DeleteConfirmModal;
