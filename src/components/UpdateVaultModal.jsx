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

  // Get category icon and gradient
  const CategoryIcon = getCategoryIcon(
    formData.category || vaultItem?.category,
  );
  const categoryGradient = getCategoryGradient(
    formData.category || vaultItem?.category,
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col my-4 sm:my-8">
        {/* Header */}
        <div
          className={`bg-gradient-to-r ${categoryGradient} px-4 sm:px-6 py-3.5 sm:py-4 flex-shrink-0`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                <CategoryIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h2 className="text-base sm:text-xl font-bold text-white truncate">
                Update Password
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors flex-shrink-0 ml-2"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>{" "}
        {/* Form - Scrollable */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent"
        >
          {/* Name */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Name *
              </div>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Gmail Account"
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-slate-800 dark:text-white"
              required
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Username / Email *
              </div>
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="e.g., user@example.com"
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-slate-800 dark:text-white"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <KeyRound className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Password (leave empty to keep current)
              </div>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Leave empty to keep current password"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-20 sm:pr-24 text-sm sm:text-base bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-slate-800 dark:text-white"
              />
              <div className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 sm:gap-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 sm:p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 dark:text-slate-400" />
                  ) : (
                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 dark:text-slate-400" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={generatePassword}
                  className="p-1.5 sm:p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  title="Generate password"
                >
                  <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 dark:text-slate-400" />
                </button>
              </div>
            </div>
            {formData.password && (
              <PasswordStrengthIndicator password={formData.password} />
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Category
              </div>
            </label>
            <select
              name="category_name"
              value={formData.category_name}
              onChange={handleChange}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-slate-800 dark:text-white"
            >
              <option value="Work">Work</option>
              <option value="Game">Game</option>
              <option value="Finance">Finance</option>
              <option value="Social">Social</option>
            </select>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Note (Optional)
              </div>
            </label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              placeholder="Add any additional notes..."
              rows={3}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-slate-800 dark:text-white resize-none"
            />
          </div>

          {/* Master Password Warning */}
          <div className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-blue-800 dark:text-blue-200">
              <p className="font-semibold mb-0.5 sm:mb-1">
                End-to-End Encrypted
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                All fields are encrypted locally in your browser before being
                saved. The server never sees your data.
              </p>
            </div>
          </div>
        </form>
        {/* Buttons - Fixed at bottom */}
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 p-4 sm:p-6 pt-3 sm:pt-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="order-1 sm:order-2 flex-1 px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Updating..." : "Update Password"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="order-2 sm:order-1 flex-1 px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateVaultModal;
