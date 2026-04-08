import { useState } from "react";
import { X, Trash2, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { notesAPI } from "../utils/api";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto mb-3 sm:mb-4">
            <Trash2 className="w-7 h-7 sm:w-8 sm:h-8 text-red-600 dark:text-red-400" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white text-center mb-2">
            Delete Note?
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 text-center mb-4 sm:mb-6 px-2">
            Are you sure you want to delete "<strong>{note.title}</strong>"?
            This action cannot be undone.
          </p>

          <div className="p-3 sm:p-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl mb-4 sm:mb-6">
            <div className="flex gap-2 sm:gap-3">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-amber-800 dark:text-amber-200">
                <p className="font-semibold mb-1">Warning</p>
                <p>
                  This note will be permanently deleted. You won't be able to
                  recover it.
                </p>
              </div>
            </div>
          </div>

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
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              disabled={isDeleting}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={handleClose}
              disabled={isDeleting}
              className="w-full sm:flex-1 px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={confirmText.toLowerCase() !== "delete" || isDeleting}
              className="w-full sm:flex-1 px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2 order-1 sm:order-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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

export default DeleteNoteModal;
