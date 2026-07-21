import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Trash2, Loader2, ShieldAlert } from "lucide-react";

const EmptyTrashModal = ({
  isOpen,
  onClose,
  onConfirm,
  itemCount = 0,
  isClearing = false,
}) => {
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setConfirmText("");
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (confirmText.toUpperCase() !== "EMPTY") {
      setError('Please type "EMPTY" to confirm');
      return;
    }
    setError("");
    await onConfirm();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && confirmText.toUpperCase() === "EMPTY" && !isClearing) {
      handleConfirm();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={isClearing ? null : onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200/60 dark:border-slate-800 flex flex-col z-10"
        >
          {/* Top Danger Accent Bar */}
          <div className="h-2 bg-gradient-to-r from-red-500 via-rose-500 to-red-600" />

          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 dark:bg-red-500/20 text-red-500 flex items-center justify-center border border-red-200 dark:border-red-900/30 shadow-inner">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                  Empty Trash Bin
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Permanent deletion of {itemCount} {itemCount === 1 ? "item" : "items"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isClearing}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 space-y-4">
            {/* Warning Callout Box */}
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-4 rounded-2xl flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-700 dark:text-red-300/90 leading-relaxed">
                <span className="font-bold block mb-0.5 text-red-800 dark:text-red-200">
                  Irreversible Action Warning
                </span>
                All <span className="font-semibold">{itemCount} items</span> in your Trash Bin will be permanently purged from the server database. This data cannot be recovered.
              </div>
            </div>

            {/* Confirm Input Prompt */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                To confirm, type <span className="font-bold text-red-500">EMPTY</span> in the box below:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => {
                  setConfirmText(e.target.value);
                  if (error) setError("");
                }}
                onKeyDown={handleKeyDown}
                placeholder='Type "EMPTY" to confirm'
                disabled={isClearing}
                autoFocus
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all outline-none font-mono text-sm text-slate-800 dark:text-white placeholder:font-sans placeholder-slate-400"
              />
              {error && (
                <p className="text-xs text-red-500 font-medium mt-1.5 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {error}
                </p>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 pt-2 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isClearing}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirmText.toUpperCase() !== "EMPTY" || isClearing}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isClearing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Emptying Trash...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Empty Trash Permanently
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EmptyTrashModal;
