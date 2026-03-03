import { useState } from "react";
import { X, FileText, Tag, Lock, Save, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { notesAPI } from "../utils/api";
import { getCategoryIcon } from "../utils/categoryIcons";

const CreateNoteModal = ({ isOpen, onClose, onSuccess, categories }) => {
  const { mek } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    note: "",
    category: "personal",
    tags: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length > 200) {
      newErrors.title = "Title must be less than 200 characters";
    }

    if (!formData.note.trim()) {
      newErrors.note = "Note content is required";
    } else if (formData.note.length > 50000) {
      newErrors.note = "Note content must be less than 50,000 characters";
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    if (!mek) {
      toast.error("Vault is locked. Please unlock your vault first.");
      return;
    }

    try {
      setIsLoading(true);

      // Parse tags
      const tagsArray = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const noteData = {
        title: formData.title.trim(),
        note: formData.note.trim(),
        category: formData.category,
        tags: tagsArray,
      };

      await notesAPI.create(noteData, mek);

      toast.success("Note created successfully!", {
        icon: "📝",
      });

      // Reset form
      setFormData({
        title: "",
        note: "",
        category: "personal",
        tags: "",
      });
      setErrors({});

      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create note");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        title: "",
        note: "",
        category: "personal",
        tags: "",
      });
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  // Get available categories (exclude 'all')
  const availableCategories = categories.filter((cat) => cat.id !== "all");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl my-4 sm:my-8">
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-700 p-4 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">
                Create New Note
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Create an encrypted note
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-h-[calc(100vh-8rem)] sm:max-h-[calc(100vh-12rem)] overflow-y-auto"
        >
          {/* Security Notice */}
          <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl">
            <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-primary-800 dark:text-primary-200">
              <p className="font-semibold mb-1">End-to-End Encrypted</p>
              <p className="text-primary-700 dark:text-primary-300">
                Your note will be encrypted with your master password before
                being stored.
              </p>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                setErrors({ ...errors, title: "" });
              }}
              placeholder="Enter note title..."
              maxLength={200}
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-slate-50 dark:bg-slate-900 border-2 ${
                errors.title
                  ? "border-red-500 focus:ring-red-500"
                  : "border-slate-200 dark:border-slate-700 focus:ring-primary-500"
              } rounded-xl focus:ring-2 focus:border-transparent transition-all text-slate-800 dark:text-white outline-none`}
              disabled={isLoading}
            />
            {errors.title && (
              <p className="mt-2 text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                {errors.title}
              </p>
            )}
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {formData.title.length}/200 characters
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {availableCategories.map((category) => {
                const Icon = getCategoryIcon(category.name);
                const isSelected = formData.category === category.id;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, category: category.id })
                    }
                    disabled={isLoading}
                    className={`p-2.5 sm:p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${
                      isSelected
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                    } disabled:opacity-50`}
                  >
                    <Icon
                      className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${
                        isSelected
                          ? "text-primary-600 dark:text-primary-400"
                          : "text-slate-500"
                      }`}
                    />
                    <span
                      className={`text-xs sm:text-sm font-medium truncate ${
                        isSelected
                          ? "text-primary-700 dark:text-primary-300"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {category.name}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.category && (
              <p className="mt-2 text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                {errors.category}
              </p>
            )}
          </div>

          {/* Note Content */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Note Content <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => {
                setFormData({ ...formData, note: e.target.value });
                setErrors({ ...errors, note: "" });
              }}
              placeholder="Write your secret note here..."
              rows={8}
              maxLength={50000}
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-slate-50 dark:bg-slate-900 border-2 ${
                errors.note
                  ? "border-red-500 focus:ring-red-500"
                  : "border-slate-200 dark:border-slate-700 focus:ring-primary-500"
              } rounded-xl focus:ring-2 focus:border-transparent transition-all text-slate-800 dark:text-white outline-none resize-none font-mono`}
              disabled={isLoading}
            />
            {errors.note && (
              <p className="mt-2 text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                {errors.note}
              </p>
            )}
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {formData.note.length}/50,000 characters
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Tags <span className="text-slate-500">(optional)</span>
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              <input
                type="text"
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                placeholder="work, important, ideas"
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-slate-800 dark:text-white outline-none"
                disabled={isLoading}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Separate multiple tags with commas
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="submit"
              disabled={
                isLoading || !formData.title.trim() || !formData.note.trim()
              }
              className="w-full sm:flex-1 px-4 py-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 order-1"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Create Note
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="w-full sm:flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed order-2"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateNoteModal;
