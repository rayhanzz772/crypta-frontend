import { useState, useEffect } from "react";
import { X, FolderKey, AlertCircle, Loader2, Check } from "lucide-react";
import toast from "react-hot-toast";
import { projectsAPI } from "../utils/api";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md">
      <div
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md max-h-[95vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-purple-600 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <FolderKey className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Create Project
                </h2>
                <p className="text-white/80 text-xs">Container for secrets</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {/* Project Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="My Application"
              className={`w-full px-3 py-2 text-sm rounded-lg border-2 ${
                errors.name
                  ? "border-red-500 focus:ring-red-500"
                  : "border-slate-200 dark:border-slate-700 focus:ring-primary-500"
              } bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:border-transparent transition-all outline-none`}
              disabled={isSubmitting}
              maxLength={100}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Project Slug */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Project Slug <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.slug}
                onChange={handleSlugChange}
                placeholder="my-application"
                className={`w-full px-3 py-2 text-sm rounded-lg border-2 ${
                  errors.slug
                    ? "border-red-500 focus:ring-red-500"
                    : formData.slug && validateSlug(formData.slug)
                    ? "border-green-500 focus:ring-green-500"
                    : "border-slate-200 dark:border-slate-700 focus:ring-primary-500"
                } bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:border-transparent transition-all outline-none`}
                disabled={isSubmitting}
                maxLength={50}
              />
              {formData.slug && validateSlug(formData.slug) && (
                <Check className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              URL-safe (lowercase, alphanumeric, hyphens)
            </p>
            {errors.slug && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.slug}
              </p>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <strong className="text-slate-800 dark:text-slate-200">
                Note:
              </strong>{" "}
              Projects are containers for secrets. Add secrets and manage access
              via service accounts after creation.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name || !formData.slug}
              className="flex-1 px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FolderKey className="w-4 h-4" />
                  Create
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
