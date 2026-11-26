import { useState } from "react";
import { X, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { notesAPI } from "../utils/api";
import Modal from "./Modal";

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
    >
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-destructive/10 rounded-full mx-auto mb-3 sm:mb-4">
            <Trash2 className="w-7 h-7 sm:w-8 sm:h-8 text-destructive" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center mb-2">
            Delete Note?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground text-center mb-4 sm:mb-6 px-2">
            Are you sure you want to delete "<strong>{note.title}</strong>"?
            This action cannot be undone.
          </p>

          <div className="p-3 sm:p-4 bg-warning/10 border-2 border-warning/25 rounded-xl mb-4 sm:mb-6">
            <div className="flex gap-2 sm:gap-3">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-warning">
                <p className="font-semibold mb-1">Warning</p>
                <p>
                  This note will be permanently deleted. You won't be able to
                  recover it.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-4 sm:mb-6">
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
              Type{" "}
              <span className="px-2 py-0.5 bg-destructive/10 text-destructive rounded font-mono font-bold text-xs sm:text-sm">
                DELETE
              </span>{" "}
              to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-muted/50 dark:bg-background border-2 border-border rounded-xl focus:ring-2 focus:ring-destructive focus:border-transparent outline-none"
              disabled={isDeleting}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={handleClose}
              disabled={isDeleting}
              className="w-full sm:flex-1 px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-muted text-foreground rounded-xl font-semibold hover:bg-muted transition-all order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={confirmText.toLowerCase() !== "delete" || isDeleting}
              className="w-full sm:flex-1 px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-destructive text-white rounded-xl font-semibold hover:bg-destructive/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 order-1 sm:order-2"
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
    </Modal>
  );
};

export default DeleteNoteModal;
