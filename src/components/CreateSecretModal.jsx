import { useState, useEffect } from "react";
import {
  X,
  Key,
  AlertCircle,
  Loader2,
  Tag,
  Plus,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";
import { secretsAPI } from "../utils/api";
import Modal from "./Modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
      console.error("Project ID is undefined!");
      toast.error("Project ID is missing. Please select a project first.");
      return;
    }

    try {
      setIsSubmitting(true);

      // Prepare request payload
      const payload = {
        name: formData.name.trim(),
      };

      // Only include labels if there are any
      if (formData.labels.length > 0) {
        payload.labels = formData.labels;
      }

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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="sm"
      showCloseButton={false}
      srTitle="Create Secret"
      className="p-0 gap-0 max-h-[90vh] flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="shrink-0 bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 shrink-0 bg-primary/10 rounded-xl flex items-center justify-center">
            <Key className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
              Create Secret
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              In {projectName}
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
        id="create-secret-form"
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent"
      >
        {/* Secret Name */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Secret Name <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              placeholder="DB_PASSWORD"
              className={`w-full px-3 py-2.5 pr-9 text-sm bg-muted/50 dark:bg-background border rounded-lg font-mono focus:ring-2 focus:ring-ring focus:border-transparent transition-all text-foreground outline-none ${
                errors.name
                  ? "border-destructive"
                  : formData.name && validateSecretName(formData.name)
                  ? "border-success"
                  : "border-border"
              }`}
              disabled={isSubmitting}
              maxLength={100}
            />
            {formData.name && validateSecretName(formData.name) && (
              <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-success" />
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Uppercase with underscores (e.g., API_KEY)
          </p>
          {errors.name && (
            <p className="mt-1.5 text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.name}
            </p>
          )}
        </div>

        {/* Labels */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Labels <span className="font-normal">(optional)</span>
          </label>

          {/* Existing Labels */}
          {formData.labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {formData.labels.map(({ key, value }) => (
                <Badge
                  key={key}
                  variant="secondary"
                  className="gap-1 rounded-md font-normal"
                >
                  <Tag className="w-3 h-3" />
                  <span className="font-medium">{key}:</span> {value}
                  <button
                    type="button"
                    onClick={() => handleRemoveLabel(key)}
                    className="ml-0.5 p-0.5 hover:text-destructive rounded transition-colors"
                    aria-label={`Remove label ${key}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
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
              className="flex-1 min-w-0 px-3 py-2 text-sm rounded-lg border border-border bg-muted/50 dark:bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent transition-all outline-none"
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
              className="flex-1 min-w-0 px-3 py-2 text-sm rounded-lg border border-border bg-muted/50 dark:bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent transition-all outline-none"
              disabled={isSubmitting}
              maxLength={50}
            />
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={handleAddLabel}
              disabled={isSubmitting || !newLabel.key || !newLabel.value}
              aria-label="Add label"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Add metadata like env: production
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-warning/10 border border-warning/25 rounded-lg p-3">
          <div className="flex gap-2.5">
            <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-warning text-xs mb-0.5">
                Secret Container Only
              </p>
              <p className="text-xs text-warning leading-relaxed">
                Creates an empty secret. Add the actual value via Secret Versions
                for version control.
              </p>
            </div>
          </div>
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
          form="create-secret-form"
          disabled={isSubmitting || !formData.name}
          className="order-1 sm:order-2 flex-1 rounded-xl font-semibold"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Key />
              Create
            </>
          )}
        </Button>
      </div>
    </Modal>
  );
};

export default CreateSecretModal;
