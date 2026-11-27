import { useState } from "react";
import { X, FolderPlus, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { filesAPI } from "../utils/api";
import Modal from "./Modal";
import { Button } from "@/components/ui/button";

const CreateFolderModal = ({ isOpen, onClose, onSuccess }) => {
  const [folderName, setFolderName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!folderName.trim()) {
      toast.error("Folder name is required");
      return;
    }

    setLoading(true);
    try {
      await filesAPI.createFolder(folderName.trim());
      toast.success("Folder created successfully");
      setFolderName("");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create folder");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="sm"
      showCloseButton={false}
      srTitle="New Folder"
      className="p-0 gap-0 max-h-[90vh] flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="shrink-0 bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 shrink-0 bg-primary/10 rounded-xl flex items-center justify-center">
            <FolderPlus className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
              New Folder
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              Organize your secure files
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          disabled={loading}
          className="shrink-0 text-muted-foreground"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Form */}
      <form
        id="create-folder-form"
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent"
      >
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Folder Name
          </label>
          <input
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="e.g. Work Documents"
            className="w-full px-3 py-2.5 text-sm bg-muted/50 dark:bg-background border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all text-foreground outline-none"
            disabled={loading}
            autoFocus
          />
        </div>
      </form>

      {/* Footer */}
      <div className="shrink-0 flex flex-col sm:flex-row gap-2.5 p-4 sm:px-6 pt-3 border-t border-border bg-card">
        <Button
          type="button"
          variant="secondary"
          onClick={handleClose}
          disabled={loading}
          className="order-2 sm:order-1 flex-1 rounded-xl font-semibold"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="create-folder-form"
          disabled={loading || !folderName.trim()}
          className="order-1 sm:order-2 flex-1 rounded-xl font-semibold"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <FolderPlus />
              Create Folder
            </>
          )}
        </Button>
      </div>
    </Modal>
  );
};

export default CreateFolderModal;
