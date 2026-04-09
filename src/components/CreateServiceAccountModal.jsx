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
import Portal from "./Portal";

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
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md max-h-[95vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div
            className={`px-4 py-3 flex-shrink-0 ${
              step === "input"
                ? "bg-gradient-to-r from-blue-500 to-indigo-600"
                : "bg-gradient-to-r from-amber-500 to-orange-600"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  {step === "input" ? (
                    <Bot className="w-5 h-5 text-white" />
                  ) : (
                    <Key className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    {step === "input"
                      ? "Create Service Account"
                      : "Save Private Key"}
                  </h2>
                  <p className="text-white/80 text-xs">{projectName}</p>
                </div>
              </div>
              <button
                onClick={handleCancel}
                disabled={isSubmitting || (step === "show-key" && !confirmed)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4">
            {step === "input" ? (
              // Step 1: Input service account name
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div className="flex gap-3">
                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
                        What is a Service Account?
                      </p>
                      <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
                        Service accounts represent machine identities (apps,
                        services) that need to access secrets programmatically.
                        Each service account has its own RSA key pair for
                        authentication.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Service Account Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., backend-app, api-service"
                      className="w-full px-3 text-sm py-2 border-2 border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      disabled={isSubmitting}
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    The client ID will be generated as:{" "}
                    <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">
                      {name || "name"}@{projectName}.crypta
                    </code>
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !name.trim()}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Bot className="w-5 h-5" />
                        Create
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              // Step 2: Show private key (one-time)
              <div className="space-y-4">
                {/* Service Account Info */}
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-2">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Service Account Name
                    </p>
                    <p className="font-semibold text-slate-800 dark:text-white">
                      {serviceAccount?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Client ID
                    </p>
                    <code className="text-sm font-mono text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      {serviceAccount?.client_id}
                    </code>
                  </div>
                </div>

                {/* Private Key Display */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Private Key (RSA)
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopyKey}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </button>
                      <button
                        onClick={handleDownloadKey}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                      >
                        <Download className="w-4 h-4" />
                        Download .pem
                      </button>
                    </div>
                  </div>

                  {/* Debug info */}
                  {!serviceAccount?.private_key && (
                    <div className="mb-2 p-2 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded text-xs">
                      <p className="text-yellow-900 dark:text-yellow-100">
                        Debug: private_key not found in response
                      </p>
                      <p className="text-yellow-800 dark:text-yellow-200 mt-1">
                        Available keys:{" "}
                        {Object.keys(serviceAccount || {}).join(", ")}
                      </p>
                    </div>
                  )}

                  <div className="relative">
                    <Code className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <pre className="w-full pl-10 pr-4 py-3 bg-slate-900 dark:bg-black text-green-400 font-mono text-xs rounded-xl overflow-auto border-2 border-slate-700 max-h-48">
                      {serviceAccount?.private_key ||
                        "Private key not available"}
                    </pre>
                  </div>
                </div>

                {/* Confirmation Checkbox */}
                <label className="flex items-start gap-2.5 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500 mt-0.5"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-amber-900 dark:text-amber-100 text-xs">
                      I confirm that I have saved the private key
                    </p>
                    <p className="text-xs text-amber-800 dark:text-amber-200 mt-0.5">
                      I understand this key will not be shown again and cannot
                      be recovered if lost
                    </p>
                  </div>
                </label>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={handleClose}
                    disabled={!confirmed}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {confirmed ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Done - Close Dialog
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-5 h-5" />
                        Please Confirm Above
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default CreateServiceAccountModal;
