import { useState, useEffect } from "react";
import { X, AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { getCategoryIcon, getCategoryGradient } from "../utils/categoryIcons";
import { useAuth } from "../contexts/AuthContext";
import { safeDecryptField } from "../utils/crypto";
import Modal from "./Modal";
import { Button } from "@/components/ui/button";

const DeleteVaultModal = ({
  isOpen,
  onClose,
  vaultItem,
  onDelete,
  isDeleting,
}) => {
  const { mek } = useAuth();
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");
  const [decryptedUsername, setDecryptedUsername] = useState("");

  useEffect(() => {
    const decryptDetails = async () => {
      if (vaultItem && mek) {
        try {
          const username = await safeDecryptField(vaultItem.username, mek);
          setDecryptedUsername(username);
        } catch (e) {
          setDecryptedUsername(vaultItem.username);
        }
      } else if (vaultItem) {
        setDecryptedUsername(vaultItem.username);
      }
    };
    decryptDetails();
  }, [vaultItem, mek]);

  useEffect(() => {
    if (isOpen) {
      setConfirmText("");
      setError("");
    }
  }, [isOpen]);

  const handleDelete = async () => {
    if (confirmText.toLowerCase() !== "delete") {
      setError('Please type "DELETE" to confirm');
      return;
    }

    setError("");
    const result = await onDelete(vaultItem, mek);

    if (result.success) {
      onClose();
    } else {
      setError(
        result.error || "Failed to delete. Please check your master password.",
      );
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleDelete();
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  if (!isOpen || !vaultItem) return null;

  const CategoryIcon = getCategoryIcon(
    vaultItem?.category || vaultItem?.category_name,
  );
  const categoryGradient = getCategoryGradient(
    vaultItem?.category || vaultItem?.category_name,
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="sm"
      showCloseButton={false}
      srTitle="Delete Password"
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
              Delete Password
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
        {/* Vault Item Preview */}
        <div className="bg-muted/50 dark:bg-background/60 rounded-lg border border-border p-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 bg-gradient-to-br ${categoryGradient} rounded-lg flex items-center justify-center shrink-0 shadow-sm`}
            >
              <CategoryIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-foreground truncate">
                {vaultItem.name}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {decryptedUsername}
              </p>
            </div>
          </div>
        </div>

        {/* Warning Message */}
        <div className="bg-destructive/10 border border-destructive/25 rounded-lg p-3">
          <div className="flex gap-2.5">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-destructive mb-0.5">
                Warning: Permanent Deletion
              </p>
              <p className="text-xs text-destructive/80">
                This password will be permanently deleted and cannot be
                recovered.
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
            onChange={(e) => {
              setConfirmText(e.target.value);
              setError("");
            }}
            onKeyDown={handleKeyPress}
            placeholder="Type DELETE"
            className={`w-full px-3 py-2.5 text-sm rounded-lg border bg-card text-foreground focus:ring-2 focus:border-transparent transition-all outline-none ${
              confirmText.toLowerCase() === "delete"
                ? "border-success focus:ring-success"
                : "border-input focus:ring-ring"
            }`}
            disabled={isDeleting}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/25 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
              <p className="text-xs text-destructive font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="bg-primary/10 border border-primary/25 rounded-lg p-3">
          <p className="text-xs text-primary/90 text-center">
            Your master password from vault unlock will be used to authorize
            this deletion
          </p>
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

export default DeleteVaultModal;
