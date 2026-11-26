import { useState, useEffect } from "react";
import { X, AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { getCategoryIcon, getCategoryGradient } from "../utils/categoryIcons";
import { useAuth } from "../contexts/AuthContext";
import { safeDecryptField } from "../utils/crypto";
import Modal from "./Modal";

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
    >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-destructive/10 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 sm:w-7 sm:h-7 text-destructive" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground">
                  Delete Password
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isDeleting}
              className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Vault Item Preview */}
          <div className="bg-muted/50 dark:bg-background rounded-xl p-3 sm:p-4 border border-border">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${categoryGradient} rounded-lg flex items-center justify-center flex-shrink-0`}
              >
                <CategoryIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">
                  {vaultItem.name}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {decryptedUsername}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Warning Message */}
          <div className="bg-destructive/10 border-2 border-red-200 dark:border-red-800 rounded-xl p-3 sm:p-4">
            <div className="flex gap-2 sm:gap-3">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm sm:text-base text-red-900 dark:text-red-100 mb-1">
                  Warning: Permanent Deletion
                </p>
                <p className="text-xs sm:text-sm text-destructive">
                  This password will be permanently deleted and cannot be
                  recovered.
                </p>
              </div>
            </div>
          </div>

          {/* Confirmation Input */}
          <div>
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
              onChange={(e) => {
                setConfirmText(e.target.value);
                setError("");
              }}
              onKeyPress={handleKeyPress}
              placeholder="Type DELETE"
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border-2 ${
                confirmText.toLowerCase() === "delete"
                  ? "border-success focus:ring-green-500"
                  : "border-input focus:ring-ring"
              } bg-card text-foreground focus:ring-2 focus:border-transparent transition-all outline-none`}
              disabled={isDeleting}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-red-200 dark:border-red-800 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <p className="text-xs sm:text-sm text-destructive font-medium">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="bg-primary/10 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
            <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 text-center">
              Your master password from vault unlock will be used to authorize
              this deletion
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
            <button
              onClick={handleClose}
              disabled={isDeleting}
              className="w-full sm:flex-1 px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-muted text-foreground rounded-xl font-semibold hover:bg-muted transition-all disabled:opacity-50 order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={confirmText.toLowerCase() !== "delete" || isDeleting}
              className="w-full sm:flex-1 px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-destructive text-white rounded-xl font-semibold hover:bg-destructive/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 order-1 sm:order-2"
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

export default DeleteVaultModal;
