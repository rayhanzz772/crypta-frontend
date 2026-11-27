import { useState, useEffect } from "react";
import {
  X,
  Eye,
  EyeOff,
  RefreshCw,
  Lock,
  User,
  KeyRound,
  FileText,
  Tag,
} from "lucide-react";
import toast from "react-hot-toast";
import { vaultAPI } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import { encryptField, safeDecryptField } from "../utils/crypto";
import PasswordStrengthIndicator from "./PasswordStrengthIndicator";
import { getCategoryIcon, getCategoryGradient } from "../utils/categoryIcons";
import Modal from "./Modal";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const UpdateVaultModal = ({ isOpen, onClose, vaultItem, onSuccess }) => {
  const { mek } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    note: "",
    category_name: "Work",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const decryptData = async () => {
      if (vaultItem && mek) {
        try {
          const decryptedUsername = await safeDecryptField(vaultItem.username, mek);
          const decryptedNote = await safeDecryptField(vaultItem.note, mek);

          setFormData({
            name: vaultItem.name || "",
            username: decryptedUsername || "",
            password: "",
            note: decryptedNote || "",
            category_name: vaultItem.category_name || "Work",
          });
        } catch (error) {
          console.error("Failed to decrypt item details:", error);
          setFormData({
            name: vaultItem.name || "",
            username: vaultItem.username || "",
            password: "",
            note: vaultItem.note || "",
            category_name: vaultItem.category_name || "Work",
          });
        }
      } else if (vaultItem) {
        setFormData({
          name: vaultItem.name || "",
          username: vaultItem.username || "",
          password: "",
          note: vaultItem.note || "",
          category_name: vaultItem.category_name || "Work",
        });
      }
    };
    decryptData();
  }, [vaultItem, mek]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const generatePassword = () => {
    const length = 16;
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
    let password = "";

    // Ensure at least one of each type
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
    password += "0123456789"[Math.floor(Math.random() * 10)];
    password += "!@#$%^&*()_+-="[Math.floor(Math.random() * 14)];

    // Fill the rest
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle
    password = password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");

    setFormData((prev) => ({ ...prev, password }));
    toast.success("Strong password generated!");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!mek) {
      toast.error("Vault is locked. Please unlock your vault first.");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!formData.username.trim()) {
      toast.error("Username is required");
      return;
    }

    try {
      setIsLoading(true);

      const updateData = {
        name: formData.name.trim(),
        category: formData.category_name.trim(),
      };

      // Encrypt username (always re-encrypt on update)
      if (formData.username.trim()) {
        updateData.username = await encryptField(formData.username.trim(), mek);
      }

      // Only include password if it was changed
      if (formData.password.trim()) {
        updateData.password_encrypted = await encryptField(
          formData.password.trim(),
          mek,
        );
      }

      // Only include note if provided
      if (formData.note.trim()) {
        updateData.note = await encryptField(formData.note.trim(), mek);
      } else {
        updateData.note = formData.note.trim();
      }

      await vaultAPI.update(vaultItem.id, updateData);

      toast.success("Password updated successfully!");

      // Reset form
      setFormData({
        name: "",
        username: "",
        password: "",
        note: "",
        category_name: "Work",
      });

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to update password";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Category icon tracks the currently selected category
  const CategoryIcon = getCategoryIcon(formData.category_name);
  const categoryGradient = getCategoryGradient(formData.category_name);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      srTitle="Update Password"
      showCloseButton={false}
      className="p-0 max-h-[90vh] flex flex-col"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 shrink-0 bg-gradient-to-br ${categoryGradient} rounded-xl flex items-center justify-center shadow-sm`}
          >
            <CategoryIcon className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
              Update Password
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              Edit your saved credentials
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          disabled={isLoading}
          className="shrink-0 text-muted-foreground"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent"
      >
        {/* Name */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
            <Tag className="w-3.5 h-3.5" />
            Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Gmail Account"
            className="w-full px-3 py-2.5 text-sm bg-muted/50 dark:bg-background border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all text-foreground outline-none"
            required
          />
        </div>

        {/* Username */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
            <User className="w-3.5 h-3.5" />
            Username / Email
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="e.g., user@example.com"
            className="w-full px-3 py-2.5 text-sm bg-muted/50 dark:bg-background border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all text-foreground outline-none"
            required
          />
        </div>

        {/* Password */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
            <KeyRound className="w-3.5 h-3.5" />
            Password
            <span className="font-normal">
              (leave empty to keep current)
            </span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Leave empty to keep current password"
              className="w-full px-3 py-2.5 pr-20 text-sm bg-muted/50 dark:bg-background border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all text-foreground outline-none"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowPassword(!showPassword)}
                className="size-7 rounded-md text-muted-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={generatePassword}
                className="size-7 rounded-md text-muted-foreground"
                title="Generate password"
                aria-label="Generate password"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          {formData.password && (
            <PasswordStrengthIndicator password={formData.password} />
          )}
        </div>

        {/* Category */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
            <Tag className="w-3.5 h-3.5" />
            Category
          </label>
          <Select
            name="category_name"
            value={formData.category_name}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, category_name: value }))
            }
          >
            <SelectTrigger className="w-full h-10 text-sm bg-muted/50 dark:bg-background rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Work">Work</SelectItem>
              <SelectItem value="Game">Game</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="Social">Social</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Note */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
            <FileText className="w-3.5 h-3.5" />
            Note
            <span className="font-normal">(Optional)</span>
          </label>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleChange}
            placeholder="Add any additional notes..."
            rows={3}
            className="w-full px-3 py-2.5 text-sm bg-muted/50 dark:bg-background border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all text-foreground outline-none resize-none"
          />
        </div>

        {/* Encryption Info */}
        <div className="flex items-start gap-2.5 p-3 bg-primary/10 border border-primary/25 rounded-lg">
          <Lock className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-xs text-primary/90">
            <p className="font-semibold mb-0.5">End-to-End Encrypted</p>
            <p className="text-primary/70">
              All fields are encrypted locally in your browser before being
              saved. The server never sees your data.
            </p>
          </div>
        </div>
      </form>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row gap-2.5 p-4 sm:px-6 pt-3 border-t border-border bg-card shrink-0">
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={isLoading}
          className="order-1 sm:order-2 flex-1 rounded-xl font-semibold"
        >
          {isLoading ? "Updating..." : "Update Password"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={isLoading}
          className="order-2 sm:order-1 flex-1 rounded-xl font-semibold"
        >
          Cancel
        </Button>
      </div>
    </Modal>
  );
};

export default UpdateVaultModal;
