import { useState, useEffect } from "react";
import {
  X,
  Key,
  AlertCircle,
  Loader2,
  Tag,
  Plus,
  Trash2,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";
import { secretsAPI } from "../utils/api";

const CreateSecretModal = ({
  isOpen,
  onClose,
  onSuccess,
  projectId,
  projectName,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    labels: [],
  });
  const [newLabel, setNewLabel] = useState({ key: "", value: "" });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({ name: "", labels: [] });
      setNewLabel({ key: "", value: "" });
      setErrors({});
    }
  }, [isOpen]);

  const validateSecretName = (name) => {
    // Secret name should be uppercase with underscores (like environment variables)
    const nameRegex = /^[A-Z][A-Z0-9_]*$/;
    return nameRegex.test(name);
  };

  const validateLabelKey = (key) => {
    // Label key should be lowercase, alphanumeric, underscores, hyphens
    const keyRegex = /^[a-z][a-z0-9_-]*$/;
    return keyRegex.test(key);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Secret name is required";
    } else if (!validateSecretName(formData.name)) {
      newErrors.name =
        "Name must be uppercase with underscores (e.g., DB_PASSWORD)";
    } else if (formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    } else if (formData.name.length > 100) {
      newErrors.name = "Name must be less than 100 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddLabel = () => {
    console.log("🔵 handleAddLabel called!");
    console.log("🔵 newLabel:", newLabel);

    if (!newLabel.key.trim() || !newLabel.value.trim()) {
      toast.error("Both key and value are required for a label");
      return;
    }

    if (!validateLabelKey(newLabel.key)) {
      toast.error("Label key must be lowercase (e.g., env, type)");
      return;
    }

    // Check for duplicate keys
    if (formData.labels.some((l) => l.key === newLabel.key.trim())) {
      toast.error("Label key already exists");
      return;
    }

    const updatedLabels = [
      ...formData.labels,
      { key: newLabel.key.trim(), value: newLabel.value.trim() },
    ];

    console.log("✅ Adding label:", {
      key: newLabel.key.trim(),
      value: newLabel.value.trim(),
    });
    console.log("📋 Updated labels array:", updatedLabels);

    setFormData((prev) => ({
      ...prev,
      labels: updatedLabels,
    }));
    setNewLabel({ key: "", value: "" });
  };

  const handleRemoveLabel = (keyToRemove) => {
    setFormData((prev) => ({
      ...prev,
      labels: prev.labels.filter((l) => l.key !== keyToRemove),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!projectId) {
      console.error("❌ Project ID is undefined!");
      toast.error("Project ID is missing. Please select a project first.");
      return;
    }

    console.log("✅ Project ID:", projectId);

    try {
      setIsSubmitting(true);

      // Prepare request payload
      const payload = {
        name: formData.name.trim(),
      };

      // Only include labels if there are any
      if (formData.labels.length > 0) {
        payload.labels = formData.labels;
        console.log("✅ Labels added to payload:", payload.labels);
      } else {
        console.log("⚠️ No labels to add (length is 0)");
      }

      console.log(
        "🚀 Creating secret with payload:",
        JSON.stringify(payload, null, 2)
      );

      const response = await secretsAPI.create(projectId, payload);

      const newSecret = response.data || response;
      onSuccess(newSecret);
    } catch (error) {
      console.error("Error creating secret:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to create secret";

      if (errorMessage.toLowerCase().includes("exists")) {
        setErrors({ name: errorMessage });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNameChange = (e) => {
    // Auto-uppercase the input
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_");
    setFormData((prev) => ({ ...prev, name: value }));
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
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <Key className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Create Secret
                </h2>
                <p className="text-white/80 text-xs">In {projectName}</p>
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
          {/* Secret Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Secret Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.name}
                onChange={handleNameChange}
                placeholder="DB_PASSWORD"
                className={`w-full px-3 py-2 text-sm rounded-lg border-2 font-mono ${
                  errors.name
                    ? "border-red-500 focus:ring-red-500"
                    : formData.name && validateSecretName(formData.name)
                    ? "border-green-500 focus:ring-green-500"
                    : "border-slate-200 dark:border-slate-700 focus:ring-primary-500"
                } bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:border-transparent transition-all outline-none`}
                disabled={isSubmitting}
                maxLength={100}
              />
              {formData.name && validateSecretName(formData.name) && (
                <Check className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Uppercase with underscores (e.g., API_KEY)
            </p>
            {errors.name && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Labels */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Labels{" "}
              <span className="text-slate-400 font-normal">(optional)</span>
            </label>

            {/* Existing Labels */}
            {formData.labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {formData.labels.map(({ key, value }) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs"
                  >
                    <Tag className="w-3 h-3" />
                    <span className="font-medium">{key}:</span> {value}
                    <button
                      type="button"
                      onClick={() => handleRemoveLabel(key)}
                      className="ml-0.5 p-0.5 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add Label Input */}
            <div className="flex gap-1.5">
              <input
                type="text"
                value={newLabel.key}
                onChange={(e) =>
                  setNewLabel((prev) => ({
                    ...prev,
                    key: e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9_-]/g, ""),
                  }))
                }
                placeholder="key"
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none text-xs"
                disabled={isSubmitting}
                maxLength={30}
              />
              <input
                type="text"
                value={newLabel.value}
                onChange={(e) =>
                  setNewLabel((prev) => ({ ...prev, value: e.target.value }))
                }
                placeholder="value"
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none text-xs"
                disabled={isSubmitting}
                maxLength={50}
              />
              <button
                type="button"
                onClick={handleAddLabel}
                disabled={isSubmitting || !newLabel.key || !newLabel.value}
                className="px-2 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Add metadata like env: production
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <div className="flex gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-100 text-xs mb-0.5">
                  Secret Container Only
                </p>
                <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                  Creates an empty secret. Add the actual value via Secret
                  Versions for version control.
                </p>
              </div>
            </div>
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
              disabled={isSubmitting || !formData.name}
              className="flex-1 px-3 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
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

export default CreateSecretModal;
