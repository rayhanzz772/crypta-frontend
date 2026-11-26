import { useState, useEffect } from "react";
import { X, AlertTriangle, Trash2, Loader2, ShieldAlert } from "lucide-react";
import Modal from "./Modal";

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

  const handleClose = () => {
    if (!isClearing) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="sm"
      srTitle="Empty Trash Bin"
      showCloseButton={false}
      className="bg-card flex flex-col gap-0 p-0 rounded-3xl sm:rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-2xl overflow-hidden"
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
                  Empty Trash Bin
                </h3>
                <p className="text-xs text-muted-foreground">
                  Permanent deletion of {itemCount} {itemCount === 1 ? "item" : "items"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isClearing}
              className="p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 space-y-4">
            {/* Warning Callout Box */}
            <div className="bg-destructive/10 dark:bg-red-950/20 border border-destructive/25 p-4 rounded-2xl flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="text-xs text-destructive/90 leading-relaxed">
                <span className="font-bold block mb-0.5 text-destructive">
                  Irreversible Action Warning
                </span>
                All <span className="font-semibold">{itemCount} items</span> in your Trash Bin will be permanently purged from the server database. This data cannot be recovered.
              </div>
            </div>

            {/* Confirm Input Prompt */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-2">
                To confirm, type <span className="font-bold text-destructive">EMPTY</span> in the box below:
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
                className="w-full px-4 py-3 bg-muted/50/60 border border-border rounded-xl focus:ring-2 focus:ring-destructive/50 focus:border-destructive transition-all outline-none font-mono text-sm text-foreground placeholder:font-sans placeholder-slate-400"
              />
              {error && (
                <p className="text-xs text-destructive font-medium mt-1.5 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {error}
                </p>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 pt-2 bg-muted/50/50 dark:bg-background/50 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isClearing}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-foreground hover:bg-muted transition-all disabled:opacity-50"
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
    </Modal>
  );
};

export default EmptyTrashModal;
