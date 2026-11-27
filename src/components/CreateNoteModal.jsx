import { useState } from "react";
import { X, FileText, Tag, Lock, Save, AlertCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { notesAPI } from "../utils/api";
import { encryptField } from "../utils/crypto";
import { getCategoryIcon } from "../utils/categoryIcons";
import Modal from "./Modal";
import { Button } from "@/components/ui/button";

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

      // Encrypt the note body client-side — title stays plaintext for search.
      const encryptedNote = await encryptField(formData.note.trim(), mek);

      const noteData = {
        title: formData.title.trim(),
        note: encryptedNote,
        category: formData.category,
        tags: tagsArray,
      };

      await notesAPI.create(noteData);

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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      showCloseButton={false}
      srTitle="Create New Note"
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
              Create New Note
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              Encrypted before it leaves your browser
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

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent"
      >
        {/* Security Notice */}
        <div className="flex items-start gap-2.5 p-3 bg-primary/10 border border-primary/25 rounded-lg">
          <Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="text-xs text-primary/90">
            <p className="font-semibold mb-0.5">End-to-End Encrypted</p>
            <p className="text-primary/70">
              Your note will be encrypted with your master password before being
              stored.
            </p>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Title
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
            className={`w-full px-3 py-2.5 text-sm bg-muted/50 dark:bg-background border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all text-foreground outline-none ${
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
          <p className="mt-1 text-xs text-muted-foreground">
            {formData.title.length}/200 characters
          </p>
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
                  } disabled:opacity-50`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-medium truncate">
                    {category.name}
                  </span>
                </button>
              );
            })}
          </div>
          {errors.category && (
            <p className="mt-1.5 text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.category}
            </p>
          )}
        </div>

        {/* Note Content */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Note Content
          </label>
          <textarea
            value={formData.note}
            onChange={(e) => {
              setFormData({ ...formData, note: e.target.value });
              setErrors({ ...errors, note: "" });
            }}
            placeholder="Write your secret note here..."
            rows={10}
            maxLength={50000}
            className={`w-full px-3 py-2.5 text-sm bg-muted/50 dark:bg-background border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all text-foreground outline-none resize-none font-mono ${
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
          <p className="mt-1 text-xs text-muted-foreground">
            {formData.note.length}/50,000 characters
          </p>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Tags <span className="font-normal">(optional)</span>
          </label>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={formData.tags}
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value })
              }
              placeholder="work, important, ideas"
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-muted/50 dark:bg-background border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all text-foreground outline-none"
              disabled={isLoading}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Separate multiple tags with commas
          </p>
        </div>
      </form>

      {/* Footer - sticky bottom bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 p-4 sm:px-6 pt-3 border-t border-border bg-card shrink-0">
        <Button
          type="button"
          variant="secondary"
          onClick={handleClose}
          disabled={isLoading}
          className="order-2 sm:order-1 flex-1 rounded-xl font-semibold"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={
            isLoading || !formData.title.trim() || !formData.note.trim()
          }
          className="order-1 sm:order-2 flex-1 rounded-xl font-semibold"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Save />
              Create Note
            </>
          )}
        </Button>
      </div>
    </Modal>
  );
};

export default CreateNoteModal;
