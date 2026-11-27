import { useState } from "react";
import { X, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { notesAPI } from "../utils/api";
import Modal from "./Modal";
import { Button } from "@/components/ui/button";

const DeleteNoteModal = ({ isOpen, onClose, note, onSuccess }) => {
  const { mek } = useAuth();
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText.toLowerCase() !== "delete") {
      toast.error("Please type DELETE to confirm");
      return;
    }

    try {
      setIsDeleting(true);
      await notesAPI.delete(note.id, mek);
      toast.success("Note deleted successfully");
      setConfirmText("");
      onSuccess();
    } catch (error) {
      toast.error("Failed to delete note");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmText("");
      onClose();
    }
  };

  if (!isOpen || !note) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="sm"
      srTitle="Delete Note?"
      className="p-0 gap-0"
    >
      {/* Header */}
      <div className="p-4 sm:p-6 pb-0 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 shrink-0 bg-destructive/10 rounded-xl flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-destructive" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
              Delete Note?
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              This action cannot be undone
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          disabled={isDeleting}
          className="shrink-0 text-muted-foreground"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-6 pt-4 sm:pt-5 space-y-3">
        {/* Note Preview */}
        <div className="bg-muted/50 dark:bg-background/60 rounded-lg border border-border p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 text-destructive" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm text-foreground truncate">
                {note.title}
              </h3>
              <p className="text-xs text-muted-foreground">
                Your note will be permanently deleted.
              </p>
            </div>
          </div>
        </div>

        {/* Warning Message */}
        <div className="bg-warning/10 border border-warning/25 rounded-lg p-3">
          <div className="flex gap-2.5">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-warning mb-0.5">
                Warning
              </p>
              <p className="text-xs text-warning/80">
                This note will be permanently deleted. You won't be able to
                recover it.
              </p>
            </div>
          </div>
        </div>

        {/* Confirmation Input */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Type{" "}
            <span className="px-1.5 py-0.5 bg-destructive/10 text-destructive rounded font-mono font-bold text-xs">
              DELETE
            </span>{" "}
            to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE"
            className={`w-full px-3 py-2.5 text-sm rounded-lg border bg-card text-foreground focus:ring-2 focus:border-transparent transition-all outline-none ${
              confirmText.toLowerCase() === "delete"
                ? "border-success focus:ring-success"
                : "border-input focus:ring-ring"
            }`}
            disabled={isDeleting}
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isDeleting}
            className="w-full sm:flex-1 sm:order-1 rounded-xl font-semibold"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={confirmText.toLowerCase() !== "delete" || isDeleting}
            className="w-full sm:flex-1 sm:order-2 rounded-xl font-semibold"
          >
            {isDeleting ? (
              <>
                <Loader2 className="animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 />
                Delete Forever
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteNoteModal;
