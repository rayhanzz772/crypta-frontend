import { useState, useEffect } from "react";
import {
  X,
  Key,
  Plus,
  History,
  CheckCircle,
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
import Modal from "./Modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        size="sm"
        srTitle={secret.name}
        showCloseButton={false}
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
                {secret.name}
              </h2>
              <p className="text-xs text-muted-foreground truncate">
                {projectName} • {versions.length} version(s)
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            disabled={!!isUpdating}
            className="shrink-0 text-muted-foreground"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
          {/* Secret Info */}
          <div className="bg-muted/50 dark:bg-background border border-border rounded-lg p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="px-2 py-0.5 bg-muted text-foreground rounded font-mono text-xs break-all">
                    {secret.name}
                  </code>
                  {enabledVersion && (
                    <Badge
                      variant="secondary"
                      className="gap-1 text-[10px] px-1.5 py-0 text-success bg-success/10 shrink-0"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Active
                    </Badge>
                  )}
                </div>
                {secret.labels && Object.keys(secret.labels).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(secret.labels).map(([key, value]) => (
                      <Badge
                        key={key}
                        variant="secondary"
                        className="gap-1 rounded-md font-normal text-[10px] px-1.5 py-0"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        {key}: {value}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => setShowAddValueModal(true)}
                className="shrink-0 rounded-lg"
              >
                <Plus />
                Add Value
              </Button>
            </div>
          </div>

          {/* Versions List */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <History className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-foreground text-sm">
                Version History
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchVersions}
                disabled={isLoading}
                className="ml-auto h-7 w-7 text-muted-foreground"
                title="Refresh"
              >
                <RefreshCw className={isLoading ? "animate-spin" : ""} />
              </Button>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground text-sm">
                  Loading versions...
                </p>
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-10 bg-muted/50 dark:bg-background rounded-lg border border-dashed border-border">
                <div className="w-14 h-14 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-7 h-7 text-warning" />
                </div>
                <h4 className="font-semibold text-foreground mb-1.5 text-sm">
                  No secret values yet
                </h4>
                <p className="text-muted-foreground text-xs mb-3">
                  Add a secret value to start using this secret
                </p>
                <Button
                  size="sm"
                  onClick={() => setShowAddValueModal(true)}
                  className="rounded-lg"
                >
                  <Plus />
                  Add First Value
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {versions.map((version, index) => (
                  <div
                    key={version.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      version.status === "enabled"
                        ? "bg-success/10 border-success/25"
                        : "bg-muted/50 dark:bg-background border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center font-bold text-xs ${
                          version.status === "enabled"
                            ? "bg-success text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        v{version.version}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-xs text-foreground">
                            Version {version.version}
                          </span>
                          {version.status === "enabled" && (
                            <Badge
                              variant="secondary"
                              className="gap-0.5 text-[10px] px-1.5 py-0 text-success bg-success/15 font-medium"
                            >
                              <CheckCircle className="w-2.5 h-2.5" />
                              Active
                            </Badge>
                          )}
                          {index === 0 && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 text-primary bg-primary/10 font-medium"
                            >
                              Latest
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Calendar className="w-3 h-3" />
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
          <div className="bg-warning/10 border border-warning/25 rounded-lg p-3">
            <div className="flex gap-2.5">
              <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-warning text-xs mb-0.5">
                  Security Information
                </p>
                <ul className="text-xs text-warning/90 space-y-0.5 leading-relaxed">
                  <li>• Secret values are encrypted and never exposed</li>
                  <li>• Only active version is used by service accounts</li>
                  <li>• All access is logged for compliance</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 p-4 sm:px-6 pt-3 border-t border-border bg-card">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={!!isUpdating}
            className="w-full rounded-xl font-semibold"
          >
            Close
          </Button>
        </div>
      </Modal>

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
