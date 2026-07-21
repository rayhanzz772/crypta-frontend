import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Trash2, Loader2, KeyRound, FileText } from "lucide-react";

const DeleteTrashItemModal = ({
  isOpen,
  onClose,
  onConfirm,
  item = null,
  isDeleting = false,
}) => {
  if (!isOpen || !item) return null;

  const isPassword = item.type === "password";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={isDeleting ? null : onClose}
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
                  Delete Permanently
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 space-y-4">
            {/* Target Item Card Preview */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${
                isPassword
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  : "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
              }`}>
                {isPassword ? <KeyRound className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-800 dark:text-white truncate">
                  {item.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                  {item.type} {item.category ? `• ${item.category}` : ""}
                </div>
              </div>
            </div>

            {/* Warning Callout Box */}
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-4 rounded-2xl flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-700 dark:text-red-300/90 leading-relaxed">
                Are you sure you want to permanently delete <span className="font-bold text-red-800 dark:text-red-200">"{item.name}"</span>? It will be completely removed from the database and cannot be restored.
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 pt-2 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30 transition-all disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Permanently
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DeleteTrashItemModal;
