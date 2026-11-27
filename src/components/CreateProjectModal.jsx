import { useState, useEffect } from "react";
import { X, FolderKey, AlertCircle, Loader2, Check } from "lucide-react";
import toast from "react-hot-toast";
import { projectsAPI } from "../utils/api";
import Modal from "./Modal";
import { Button } from "@/components/ui/button";

const CreateProjectModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoGenerateSlug, setAutoGenerateSlug] = useState(true);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({ name: "", slug: "", description: "" });
      setErrors({});
      setAutoGenerateSlug(true);
    }
  }, [isOpen]);

  // Auto-generate slug from name
  useEffect(() => {
    if (autoGenerateSlug && formData.name) {
      const generatedSlug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setFormData((prev) => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.name, autoGenerateSlug]);

  const validateSlug = (slug) => {
    // Slug must be URL-safe: lowercase, alphanumeric, hyphens only
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(slug);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Project name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Project name must be at least 2 characters";
    } else if (formData.name.length > 100) {
      newErrors.name = "Project name must be less than 100 characters";
    }

    if (!formData.slug.trim()) {
      newErrors.slug = "Project slug is required";
    } else if (!validateSlug(formData.slug)) {
      newErrors.slug =
        "Slug must be URL-safe (lowercase, alphanumeric, hyphens only)";
    } else if (formData.slug.length < 2) {
      newErrors.slug = "Slug must be at least 2 characters";
    } else if (formData.slug.length > 50) {
      newErrors.slug = "Slug must be less than 50 characters";
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await projectsAPI.create({
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim(),
      });

      const newProject = response.data || response;
      onSuccess(newProject);
    } catch (error) {
      console.error("Error creating project:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to create project";

      if (errorMessage.toLowerCase().includes("slug")) {
        setErrors({ slug: errorMessage });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSlugChange = (e) => {
    setAutoGenerateSlug(false);
    setFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase() }));
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="sm"
      showCloseButton={false}
      srTitle="Create Project"
      className="p-0 gap-0 max-h-[90vh] flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="shrink-0 bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 shrink-0 bg-primary/10 rounded-xl flex items-center justify-center">
            <FolderKey className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
              Create Project
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              Container for secrets
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          disabled={isSubmitting}
          className="shrink-0 text-muted-foreground"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Form */}
      <form
        id="create-project-form"
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent"
      >
        {/* Project Name */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Project Name <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="My Application"
            className={`w-full px-3 py-2.5 text-sm bg-muted/50 dark:bg-background border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all text-foreground outline-none ${
              errors.name ? "border-destructive" : "border-border"
            }`}
            disabled={isSubmitting}
            maxLength={100}
          />
          {errors.name && (
            <p className="mt-1.5 text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.name}
            </p>
          )}
        </div>

        {/* Project Slug */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Project Slug <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.slug}
              onChange={handleSlugChange}
              placeholder="my-application"
              className={`w-full px-3 py-2.5 pr-9 text-sm bg-muted/50 dark:bg-background border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all text-foreground outline-none ${
                errors.slug
                  ? "border-destructive"
                  : formData.slug && validateSlug(formData.slug)
                  ? "border-success"
                  : "border-border"
              }`}
              disabled={isSubmitting}
              maxLength={50}
            />
            {formData.slug && validateSlug(formData.slug) && (
              <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-success" />
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            URL-safe (lowercase, alphanumeric, hyphens)
          </p>
          {errors.slug && (
            <p className="mt-1.5 text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.slug}
            </p>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-muted/50 dark:bg-background border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Note:</strong> Projects are
            containers for secrets. Add secrets and manage access via service
            accounts after creation.
          </p>
        </div>
      </form>

      {/* Footer */}
      <div className="shrink-0 flex flex-col sm:flex-row gap-2.5 p-4 sm:px-6 pt-3 border-t border-border bg-card">
        <Button
          type="button"
          variant="secondary"
          onClick={handleClose}
          disabled={isSubmitting}
          className="order-2 sm:order-1 flex-1 rounded-xl font-semibold"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="create-project-form"
          disabled={isSubmitting || !formData.name || !formData.slug}
          className="order-1 sm:order-2 flex-1 rounded-xl font-semibold"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <FolderKey />
              Create
            </>
          )}
        </Button>
      </div>
    </Modal>
  );
};

export default CreateProjectModal;
