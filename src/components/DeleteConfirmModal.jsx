import { useState, useEffect } from "react";
import { Trash2, AlertTriangle, Loader2, X } from "lucide-react";
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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="sm"
      srTitle={title || "Confirm Deletion"}
      showCloseButton={false}
      className="p-0 gap-0"
    >
      {/* Header */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 shrink-0 bg-destructive/10 rounded-xl flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-destructive" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
              {title || "Confirm Deletion"}
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
          disabled={isLoading}
          className="shrink-0 text-muted-foreground"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-6 pt-4 sm:pt-5 space-y-3">
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete "<strong className="text-foreground">{itemName}</strong>"?
          This action cannot be undone.
        </p>

        {/* Warning Message */}
        <div className="bg-warning/10 border border-warning/25 rounded-lg p-3">
          <div className="flex gap-2.5">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <div className="text-xs text-warning">
              <p className="font-semibold mb-0.5">Warning</p>
              <p className="leading-relaxed">
                {warningText ||
                  "This item will be permanently deleted and cannot be recovered."}
              </p>
            </div>
          </div>
        </div>

        {/* Confirmation Input */}
        <div>
          <Label className="mb-1.5">
            Type{" "}
            <span className="px-1.5 py-0.5 bg-destructive/10 text-destructive rounded font-mono font-bold text-xs">
              DELETE
            </span>{" "}
            to confirm
          </Label>
          <Input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE"
            className={`rounded-lg ${
              confirmMatch
                ? "border-success focus-visible:ring-success/20"
                : ""
            }`}
            disabled={isLoading}
            autoFocus
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
            className="order-2 sm:order-1 flex-1 rounded-xl font-semibold"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!confirmMatch || isLoading}
            className="order-1 sm:order-2 flex-1 rounded-xl font-semibold"
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
      </div>
    </Modal>
  );
};

export default DeleteConfirmModal;
