import { useState, useEffect } from "react";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Modal from "./Modal";

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

  const confirmMatch = confirmText.toLowerCase() === "delete";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm" srTitle={title || "Confirm Deletion"}>
      {/* Header & Icon */}
      <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-destructive/10 rounded-full mx-auto mb-3 sm:mb-4">
        <Trash2 className="w-7 h-7 sm:w-8 sm:h-8 text-destructive" />
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-center mb-2">
        {title || "Confirm Deletion"}
      </h2>
      <p className="text-sm sm:text-base text-muted-foreground text-center mb-4 sm:mb-6 px-2">
        Are you sure you want to delete "<strong>{itemName}</strong>"? This
        action cannot be undone.
      </p>

      {/* Warning Message */}
      <div className="p-3 sm:p-4 bg-warning/10 border border-warning/25 rounded-xl mb-4 sm:mb-6">
        <div className="flex gap-2 sm:gap-3">
          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-warning flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-warning leading-relaxed">
            <p className="font-semibold mb-1">Warning</p>
            <p>
              {warningText ||
                "This item will be permanently deleted and cannot be recovered."}
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Input */}
      <div className="mb-4 sm:mb-6">
        <Label className="mb-2">
          Type{" "}
          <span className="px-2 py-0.5 bg-destructive/10 text-destructive rounded font-mono font-bold">
            DELETE
          </span>{" "}
          to confirm
        </Label>
        <Input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="Type DELETE"
          className={`rounded-lg border-2 ${
            confirmMatch
              ? "border-success focus:ring-success/20"
              : "focus:ring-destructive/20"
          }`}
          disabled={isLoading}
          autoFocus
        />
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <Button
          variant="secondary"
          onClick={handleClose}
          disabled={isLoading}
          className="w-full sm:flex-1 order-2 sm:order-1"
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={!confirmMatch || isLoading}
          className="w-full sm:flex-1 order-1 sm:order-2"
        >
          {isLoading ? (
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
    </Modal>
  );
};

export default DeleteConfirmModal;
