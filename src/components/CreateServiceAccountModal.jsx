import { useState } from "react";
import {
  X,
  Bot,
  Key,
  Download,
  Copy,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Shield,
  Code,
} from "lucide-react";
import toast from "react-hot-toast";
import { serviceAccountsAPI } from "../utils/api";
import Modal from "./Modal";
import { Button } from "@/components/ui/button";

const CreateServiceAccountModal = ({
  isOpen,
  onClose,
  onSuccess,
  projectId,
  projectName,
}) => {
  const [step, setStep] = useState("input"); // 'input' | 'show-key'
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serviceAccount, setServiceAccount] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a service account name");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await serviceAccountsAPI.create(projectId, name);
      const data = response.data || response;
      setServiceAccount(data);
      setStep("show-key");
      toast.success("Service account created successfully");
    } catch (error) {
      console.error("Error creating service account:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to create service account";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadKey = () => {
    if (!serviceAccount?.private_key) return;

    const blob = new Blob([serviceAccount.private_key], {
      type: "application/x-pem-file",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${serviceAccount.client_id}-private-key.pem`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Private key downloaded");
  };

  const handleCopyKey = () => {
    if (!serviceAccount?.private_key) return;

    navigator.clipboard.writeText(serviceAccount.private_key);
    toast.success("Private key copied to clipboard");
  };

  const handleClose = () => {
    if (step === "show-key" && !confirmed) {
      toast.error("Please confirm you have saved the private key");
      return;
    }

    // Reset state
    setStep("input");
    setName("");
    setServiceAccount(null);
    setConfirmed(false);

    // Call success callback if service account was created
    if (serviceAccount) {
      onSuccess(serviceAccount);
    }

    onClose();
  };

  const handleCancel = () => {
    if (step === "show-key") {
      // User is trying to close without confirming
      if (!confirmed) {
        toast.error("Please confirm you have saved the private key");
        return;
      }
    }

    // Reset state
    setStep("input");
    setName("");
    setServiceAccount(null);
    setConfirmed(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      size="sm"
      showCloseButton={false}
      srTitle={step === "input" ? "Create Service Account" : "Save Private Key"}
      className="p-0 gap-0 max-h-[90vh] flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="shrink-0 bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${
              step === "input" ? "bg-primary/10" : "bg-warning/10"
            }`}
          >
            {step === "input" ? (
              <Bot className="w-5 h-5 text-primary" />
            ) : (
              <Key className="w-5 h-5 text-warning" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
              {step === "input" ? "Create Service Account" : "Save Private Key"}
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              {projectName}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCancel}
          disabled={isSubmitting || (step === "show-key" && !confirmed)}
          className="shrink-0 text-muted-foreground"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
        {step === "input" ? (
          // Step 1: Input service account name
          <form
            id="create-service-account-form"
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="bg-primary/10 border border-primary/25 rounded-lg p-3">
              <div className="flex gap-2.5">
                <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-primary text-xs mb-0.5">
                    What is a Service Account?
                  </p>
                  <p className="text-xs text-primary/80 leading-relaxed">
                    Service accounts represent machine identities (apps,
                    services) that need to access secrets programmatically. Each
                    service account has its own RSA key pair for authentication.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Service Account Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., backend-app, api-service"
                className="w-full px-3 py-2.5 text-sm bg-muted/50 dark:bg-background border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all text-foreground outline-none"
                disabled={isSubmitting}
                autoFocus
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                The client ID will be generated as:{" "}
                <code className="px-1.5 py-0.5 bg-muted rounded font-mono">
                  {name || "name"}@{projectName}.crypta
                </code>
              </p>
            </div>
          </form>
        ) : (
          // Step 2: Show private key (one-time)
          <div className="space-y-4">
            {/* Service Account Info */}
            <div className="bg-muted/50 dark:bg-background border border-border rounded-lg p-3 space-y-2.5">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Service Account Name
                </p>
                <p className="text-sm font-semibold text-foreground break-words">
                  {serviceAccount?.name}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Client ID</p>
                <code className="text-xs font-mono text-foreground bg-muted px-2 py-1 rounded break-all">
                  {serviceAccount?.client_id}
                </code>
              </div>
            </div>

            {/* Private Key Display */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Private Key (RSA)
                </label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleCopyKey}
                    className="rounded-lg"
                  >
                    <Copy />
                    Copy
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleDownloadKey}
                    className="rounded-lg"
                  >
                    <Download />
                    Download .pem
                  </Button>
                </div>
              </div>

              {/* Debug info */}
              {!serviceAccount?.private_key && (
                <div className="mb-2 p-2.5 bg-warning/10 border border-warning/25 rounded-lg">
                  <p className="text-xs text-warning">
                    Debug: private_key not found in response
                  </p>
                  <p className="text-xs text-warning/80 mt-1 break-all">
                    Available keys:{" "}
                    {Object.keys(serviceAccount || {}).join(", ")}
                  </p>
                </div>
              )}

              <div className="relative">
                <Code className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <pre className="w-full pl-10 pr-4 py-3 bg-muted dark:bg-background text-foreground font-mono text-xs rounded-lg overflow-auto border border-border max-h-48">
                  {serviceAccount?.private_key || "Private key not available"}
                </pre>
              </div>
            </div>

            {/* Confirmation Checkbox */}
            <label className="flex items-start gap-2.5 p-3 bg-warning/10 border border-warning/25 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="w-4 h-4 rounded border-input accent-warning mt-0.5"
              />
              <div className="flex-1">
                <p className="font-semibold text-warning text-xs">
                  I confirm that I have saved the private key
                </p>
                <p className="text-xs text-warning/80 mt-0.5">
                  I understand this key will not be shown again and cannot be
                  recovered if lost
                </p>
              </div>
            </label>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 flex flex-col sm:flex-row gap-2.5 p-4 sm:px-6 pt-3 border-t border-border bg-card">
        {step === "input" ? (
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="order-2 sm:order-1 flex-1 rounded-xl font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-service-account-form"
              disabled={isSubmitting || !name.trim()}
              className="order-1 sm:order-2 flex-1 rounded-xl font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Bot />
                  Create
                </>
              )}
            </Button>
          </>
        ) : (
          <Button
            type="button"
            onClick={handleClose}
            disabled={!confirmed}
            className="w-full rounded-xl font-semibold"
          >
            {confirmed ? (
              <>
                <CheckCircle />
                Done - Close Dialog
              </>
            ) : (
              <>
                <AlertTriangle />
                Please Confirm Above
              </>
            )}
          </Button>
        )}
      </div>
    </Modal>
  );
};

export default CreateServiceAccountModal;
