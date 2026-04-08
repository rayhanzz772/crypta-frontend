import { useState, useEffect } from "react";
import { X, Save, Tag, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { notesAPI } from "../utils/api";
import { getCategoryIcon, getCategoryGradient } from "../utils/categoryIcons";

// Utility function to normalize tags (convert string to array)
const normalizeTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  }
  return [];
};

const UpdateNoteModal = ({ isOpen, onClose, note, onSuccess, categories }) => {
  const { mek } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    note: "",
    category: "personal",
    tags: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && note) {
      loadNoteData();
    }
  }, [isOpen, note]);

  const loadNoteData = async () => {
    try {
      setIsDecrypting(true);
      const response = await notesAPI.decrypt(note.id, mek);

      const content =
        response.data?.note ||
        response.data?.decrypted_content ||
        response.data?.content ||
        response.note ||
        response.decrypted_content ||
        response.content;

      const tagsArray = normalizeTags(note.tags);

      // Backend returns category_name, need to find the matching category ID
      let categoryId = note.category_id || note.category;
      if (!categoryId && note.category_name) {
        const matchedCategory = categories.find(
          (cat) => cat.name.toLowerCase() === note.category_name.toLowerCase(),
        );
        categoryId = matchedCategory?.id || "personal";
      }

      setFormData({
        title: note.title || "",
        note: content || "",
        category: categoryId || "personal",
        tags: tagsArray.join(", "),
      });
    } catch (error) {
      toast.error("Failed to load note content");
    } finally {
      setIsDecrypting(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.note.trim()) newErrors.note = "Note content is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const tagsArray = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      await notesAPI.update(
        note.id,
        {
          title: formData.title.trim(),
          note: formData.note.trim(),
          category: formData.category,
          tags: tagsArray,
        },
        mek,
      );

      toast.success("Note updated successfully!");
      onSuccess();
    } catch (error) {
      toast.error("Failed to update note");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !note) return null;

  const availableCategories = categories.filter((cat) => cat.id !== "all");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl my-4 sm:my-8">
        <div className="border-b border-slate-200 dark:border-slate-700 p-4 sm:p-6 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">
            Edit Note
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-h-[calc(100vh-8rem)] sm:max-h-[calc(100vh-12rem)] overflow-y-auto"
        >
          {isDecrypting ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-slate-50 dark:bg-slate-900 border-2 ${
                    errors.title
                      ? "border-red-500"
                      : "border-slate-200 dark:border-slate-700"
                  } rounded-xl focus:ring-2 focus:ring-primary-500 outline-none`}
                  disabled={isLoading}
                />
                {errors.title && (
                  <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    {errors.title}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Category *
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
                            : "border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-medium truncate">
                          {category.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Note Content *
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) =>
                    setFormData({ ...formData, note: e.target.value })
                  }
                  rows={8}
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-slate-50 dark:bg-slate-900 border-2 ${
                    errors.note
                      ? "border-red-500"
                      : "border-slate-200 dark:border-slate-700"
                  } rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-mono`}
                  disabled={isLoading}
                />
                {errors.note && (
                  <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    {errors.note}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  placeholder="work, important, ideas"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                  disabled={isLoading}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="w-full sm:flex-1 px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:flex-1 px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all order-1 sm:order-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default UpdateNoteModal;
