import { useState, useEffect } from "react";
import {
  X,
  Key,
  Plus,
  History,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  Calendar,
  RefreshCw,
  Shield,
  Tag,
} from "lucide-react";
import toast from "react-hot-toast";
import { secretVersionsAPI } from "../utils/api";
import AddSecretValueModal from "./AddSecretValueModal";
import Portal from "./Portal";

const SecretVersionsModal = ({
  isOpen,
  onClose,
  onSuccess,
  secret,
  projectName,
}) => {
  const [versions, setVersions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(null);
  const [showAddValueModal, setShowAddValueModal] = useState(false);

  const fetchVersions = async () => {
    try {
      setIsLoading(true);
      const response = await secretVersionsAPI.getAll(secret.id);
      const versionList = response.data || response || [];
      setVersions(Array.isArray(versionList) ? versionList : []);
    } catch (error) {
      console.error("Error fetching versions:", error);
      toast.error("Failed to load versions");
      setVersions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch versions when modal opens
  useEffect(() => {
    if (isOpen && secret) {
      fetchVersions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, secret]);

  const handleVersionCreated = async (newVersion) => {
    setShowAddValueModal(false);
    toast.success("Secret value added successfully");

    // Refetch versions from server to get the latest data
    await fetchVersions();

    // Notify parent to refresh the secrets list
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleToggleStatus = async (versionId, currentStatus) => {
    const newStatus = currentStatus === "enabled" ? "disabled" : "enabled";

    // Confirm before enabling (which will disable others)
    if (newStatus === "enabled") {
      const confirmed = window.confirm(
        "Enabling this version will disable all other versions. Continue?"
      );
      if (!confirmed) return;
    }

    try {
      setIsUpdating(versionId);
      await secretVersionsAPI.updateStatus(versionId, newStatus);

      toast.success(`Version ${newStatus}`);

      // Refetch versions from server to get the latest data
      await fetchVersions();

      // Notify parent to refresh the secrets list
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error updating version status:", error);
      toast.error("Failed to update version status");
    } finally {
      setIsUpdating(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleClose = () => {
    if (!isUpdating) {
      onClose();
    }
  };

  if (!isOpen || !secret) return null;

  const enabledVersion = versions.find((v) => v.status === "enabled");

  return (
    <>
      <Portal>
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
                      {secret.name}
                    </h2>
                    <p className="text-white/80 text-xs">
                      {projectName} • {versions.length} version(s)
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={!!isUpdating}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto space-y-4">
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Secret Info */}
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <code className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded font-mono text-xs break-all">
                          {secret.name}
                        </code>
                        {enabledVersion && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium flex-shrink-0">
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </span>
                        )}
                      </div>
                      {secret.labels &&
                        Object.keys(secret.labels).length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(secret.labels).map(
                              ([key, value]) => (
                                <span
                                  key={key}
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs"
                                >
                                  <Tag className="w-2.5 h-2.5" />
                                  {key}: {value}
                                </span>
                              )
                            )}
                          </div>
                        )}
                    </div>
                    <button
                      onClick={() => setShowAddValueModal(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-all text-xs flex-shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Value
                    </button>
                  </div>
                </div>

                {/* Versions List */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <History className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <h3 className="font-semibold text-slate-800 dark:text-white text-sm">
                      Version History
                    </h3>
                    <button
                      onClick={fetchVersions}
                      disabled={isLoading}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors ml-auto"
                      title="Refresh"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 text-slate-500 ${
                          isLoading ? "animate-spin" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                    </div>
                  ) : versions.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 dark:bg-slate-900 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700">
                      <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Shield className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                      </div>
                      <h4 className="font-semibold text-slate-800 dark:text-white mb-1.5 text-sm">
                        No secret values yet
                      </h4>
                      <p className="text-slate-500 dark:text-slate-400 text-xs mb-3">
                        Add a secret value to start using this secret
                      </p>
                      <button
                        onClick={() => setShowAddValueModal(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-all text-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add First Value
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {versions.map((version, index) => (
                        <div
                          key={version.id}
                          className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                            version.status === "enabled"
                              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                              : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                                version.status === "enabled"
                                  ? "bg-green-500 text-white"
                                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                              }`}
                            >
                              v{version.version}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`font-medium text-xs ${
                                    version.status === "enabled"
                                      ? "text-green-800 dark:text-green-200"
                                      : "text-slate-700 dark:text-slate-300"
                                  }`}
                                >
                                  Version {version.version}
                                </span>
                                {version.status === "enabled" && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full text-xs font-medium">
                                    <CheckCircle className="w-2.5 h-2.5" />
                                    Active
                                  </span>
                                )}
                                {index === 0 && (
                                  <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
                                    Latest
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-0.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                <Calendar className="w-2.5 h-2.5" />
                                {formatDate(version.created_at)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Security Notice */}
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <div className="flex gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-900 dark:text-amber-100 text-xs mb-0.5">
                        Security Information
                      </p>
                      <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-0.5 leading-relaxed">
                        <li>• Secret values are encrypted and never exposed</li>
                        <li>
                          • Only active version is used by service accounts
                        </li>
                        <li>• All access is logged for compliance</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex-shrink-0">
                <button
                  onClick={handleClose}
                  disabled={!!isUpdating}
                  className="w-full px-3 py-2 text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all disabled:opacity-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </Portal>

      <AddSecretValueModal
        isOpen={showAddValueModal}
        onClose={() => setShowAddValueModal(false)}
        onSuccess={handleVersionCreated}
        secretId={secret.id}
        secretName={secret.name}
        hasExistingVersions={versions.length > 0}
      />
    </>
  );
};
export default SecretVersionsModal;
