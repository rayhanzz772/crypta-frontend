import { X, AlertTriangle, Trash2, Loader2, KeyRound, FileText } from "lucide-react";
import Modal from "./Modal";

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
    <Modal
      isOpen={isOpen}
      onClose={() => !isDeleting && onClose()}
      size="sm"
      showCloseButton={false}
      className="rounded-3xl overflow-hidden border border-slate-200/60 dark:border-slate-800 flex flex-col"
      srTitle="Delete Permanently"
    >
          {/* Top Danger Accent Bar */}
          <div className="h-2 bg-gradient-to-r from-red-500 via-rose-500 to-red-600" />

          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center border border-destructive/25 shadow-inner">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  Delete Permanently
                </h3>
                <p className="text-xs text-muted-foreground">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 space-y-4">
            {/* Target Item Card Preview */}
            <div className="p-4 bg-muted/50/60 border border-slate-200/60 dark:border-border/60 rounded-2xl flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${
                isPassword
                  ? "bg-primary/10 text-primary"
                  : "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
              }`}>
                {isPassword ? <KeyRound className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-foreground truncate">
                  {item.name}
                </div>
                <div className="text-xs text-muted-foreground capitalize">
                  {item.type} {item.category ? `• ${item.category}` : ""}
                </div>
              </div>
            </div>

            {/* Warning Callout Box */}
            <div className="bg-destructive/10 dark:bg-red-950/20 border border-destructive/25 p-4 rounded-2xl flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="text-xs text-destructive/90 leading-relaxed">
                Are you sure you want to permanently delete <span className="font-bold text-destructive">"{item.name}"</span>? It will be completely removed from the database and cannot be restored.
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 pt-2 bg-muted/50/50 dark:bg-background/50 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-foreground hover:bg-muted transition-all disabled:opacity-50"
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
    </Modal>
  );
};

export default DeleteTrashItemModal;
