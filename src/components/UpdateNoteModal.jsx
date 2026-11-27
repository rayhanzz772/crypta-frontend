import { useState, useEffect } from "react";
import { X, Save, AlertCircle, Loader2, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { notesAPI } from "../utils/api";
import { decryptField, encryptField } from "../utils/crypto";
import { getCategoryIcon } from "../utils/categoryIcons";
import Modal from "./Modal";
import { Button } from "@/components/ui/button";

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

      // Decrypt the note content client-side.
      let content = "";
      if (note.note && mek) {
        try {
          content = await decryptField(note.note, mek);
        } catch {
          // Note may still be plaintext on legacy items
          content = note.note;
        }
      }

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
        note: content,
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

      // Re-encrypt the note content before saving.
      const encryptedNote = await encryptField(formData.note.trim(), mek);

      await notesAPI.update(
        note.id,
        {
          title: formData.title.trim(),
          note: encryptedNote,
          category: formData.category,
          tags: tagsArray,
        },
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      srTitle="Edit Note"
      showCloseButton={false}
      className="p-0 max-h-[90vh] flex flex-col"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 shrink-0 bg-primary/10 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
              Edit Note
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              Changes are re-encrypted on save
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
        {isDecrypting ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        ) : (
          <>
            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className={`w-full px-3 py-2.5 text-sm bg-muted/50 dark:bg-background border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all text-foreground ${
                  errors.title ? "border-destructive" : "border-border"
                }`}
                disabled={isLoading}
              />
              {errors.title && (
                <p className="mt-1.5 text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.title}
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                      className={`p-2.5 rounded-lg border transition-all flex items-center gap-2 ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-medium truncate">
                        {category.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Note Content */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Note Content
              </label>
              <textarea
                value={formData.note}
                onChange={(e) =>
                  setFormData({ ...formData, note: e.target.value })
                }
                rows={8}
                className={`w-full px-3 py-2.5 text-sm bg-muted/50 dark:bg-background border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all text-foreground font-mono ${
                  errors.note ? "border-destructive" : "border-border"
                }`}
                disabled={isLoading}
              />
              {errors.note && (
                <p className="mt-1.5 text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.note}
                </p>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Tags
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                placeholder="work, important, ideas"
                className="w-full px-3 py-2.5 text-sm bg-muted/50 dark:bg-background border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all text-foreground"
                disabled={isLoading}
              />
            </div>
          </>
        )}
      </form>

      {/* Footer - sticky bottom bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 p-4 sm:px-6 pt-3 border-t border-border bg-card shrink-0">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={isLoading}
          className="order-2 sm:order-1 flex-1 rounded-xl font-semibold"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={isLoading || isDecrypting}
          className="order-1 sm:order-2 flex-1 rounded-xl font-semibold"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </Modal>
  );
};

export default UpdateNoteModal;
