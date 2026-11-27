import { useState, useEffect } from "react";
import {
  X,
  Shield,
  Plus,
  Trash2,
  Loader2,
  Bot,
  CheckCircle,
  AlertCircle,
  Users,
  Lock,
} from "lucide-react";
import toast from "react-hot-toast";
import { iamBindingsAPI, serviceAccountsAPI } from "../utils/api";
import Modal from "./Modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ManageAccessModal = ({
  isOpen,
  onClose,
  onSuccess,
  secret,
  projectId,
  projectName,
}) => {
  const [bindings, setBindings] = useState([]);
  const [serviceAccounts, setServiceAccounts] = useState([]);
  const [isLoadingBindings, setIsLoadingBindings] = useState(true);
  const [isLoadingServiceAccounts, setIsLoadingServiceAccounts] =
    useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedServiceAccountId, setSelectedServiceAccountId] = useState("");
  const [isGranting, setIsGranting] = useState(false);
  const [revoking, setRevoking] = useState(null);

  useEffect(() => {
    if (isOpen && secret) {
      fetchBindings();
      fetchServiceAccounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, secret]);

  const fetchBindings = async () => {
    try {
      setIsLoadingBindings(true);
      const response = await iamBindingsAPI.getByResourceId(secret.id);
      const bindingList = response.data || response || [];
      setBindings(Array.isArray(bindingList) ? bindingList : []);
    } catch (error) {
      console.error("Error fetching bindings:", error);
      toast.error("Failed to load access bindings");
      setBindings([]);
    } finally {
      setIsLoadingBindings(false);
    }
  };

  const fetchServiceAccounts = async () => {
    try {
      setIsLoadingServiceAccounts(true);
      const response = await serviceAccountsAPI.getAll(projectId);
      const saList = response.data || response || [];
      setServiceAccounts(Array.isArray(saList) ? saList : []);
    } catch (error) {
      console.error("Error fetching service accounts:", error);
      setServiceAccounts([]);
    } finally {
      setIsLoadingServiceAccounts(false);
    }
  };

  const handleGrantAccess = async (e) => {
    e.preventDefault();

    if (!selectedServiceAccountId) {
      toast.error("Please select a service account");
      return;
    }

    try {
      setIsGranting(true);
      await iamBindingsAPI.create(secret.id, selectedServiceAccountId);

      setSelectedServiceAccountId("");
      setShowAddForm(false);
      toast.success("Access granted successfully");

      // Refetch bindings to show the latest data
      await fetchBindings();

      // Notify parent to refresh
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error granting access:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to grant access";
      toast.error(errorMessage);
    } finally {
      setIsGranting(false);
    }
  };

  const handleRevokeAccess = async (bindingId) => {
    if (!confirm("Are you sure you want to revoke this access?")) {
      return;
    }

    try {
      setRevoking(bindingId);
      await iamBindingsAPI.delete(bindingId);
      toast.success("Access revoked successfully");

      // Refetch bindings to show the latest data
      await fetchBindings();

      // Notify parent to refresh
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error revoking access:", error);
      toast.error("Failed to revoke access");
    } finally {
      setRevoking(null);
    }
  };

  const getServiceAccountName = (subjectId) => {
    const sa = serviceAccounts.find((s) => s.id === subjectId);
    return sa?.name || sa?.client_id || subjectId;
  };

  const availableServiceAccounts = serviceAccounts.filter(
    (sa) => !bindings.some((b) => b.subject_id === sa.id)
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen || !secret) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      srTitle="Manage Access"
      showCloseButton={false}
      className="p-0 gap-0 max-h-[90vh] flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="shrink-0 bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 shrink-0 bg-primary/10 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
              Manage Access
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              {secret.name} • {projectName}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="shrink-0 text-muted-foreground"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
        {/* Info Banner */}
        <div className="bg-primary/10 border border-primary/25 rounded-lg p-3">
          <div className="flex gap-2.5">
            <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-primary text-xs mb-0.5">
                IAM Access Control
              </p>
              <p className="text-xs text-primary/80 leading-relaxed">
                Grant service accounts read access to this secret. Service
                accounts must have explicit permissions to access secrets.
              </p>
            </div>
          </div>
        </div>

        {/* Grant Access Button/Form */}
        {!showAddForm ? (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            disabled={availableServiceAccounts.length === 0}
            className="w-full px-3 py-2.5 text-sm border border-dashed border-border rounded-lg text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:text-muted-foreground disabled:hover:bg-transparent"
          >
            <Plus className="w-4 h-4" />
            {availableServiceAccounts.length === 0
              ? "No Service Accounts Available"
              : "Grant Access to Service Account"}
          </button>
        ) : (
          <form
            onSubmit={handleGrantAccess}
            className="bg-muted/50 dark:bg-background border border-border rounded-lg p-3 space-y-3"
          >
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Select Service Account
              </label>
              <Select
                value={selectedServiceAccountId || undefined}
                onValueChange={setSelectedServiceAccountId}
                disabled={isGranting || isLoadingServiceAccounts}
              >
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="Select a service account" />
                </SelectTrigger>
                <SelectContent>
                  {availableServiceAccounts.map((sa) => (
                    <SelectItem key={sa.id} value={sa.id}>
                      {sa.name} ({sa.client_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-muted rounded-lg p-2.5">
              <p className="text-xs text-muted-foreground">
                <strong>Role:</strong> secret.accessor (read-only)
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowAddForm(false);
                  setSelectedServiceAccountId("");
                }}
                disabled={isGranting}
                className="flex-1 rounded-lg font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isGranting || !selectedServiceAccountId}
                className="flex-1 rounded-lg font-semibold"
              >
                {isGranting ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Granting...
                  </>
                ) : (
                  <>
                    <CheckCircle />
                    Grant Access
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Bindings List */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground text-sm">
              Service Accounts with Access ({bindings.length})
            </h3>
          </div>

          {isLoadingBindings ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">
                Loading access data...
              </p>
            </div>
          ) : bindings.length === 0 ? (
            <div className="text-center py-10 bg-muted/50 dark:bg-background rounded-lg border border-dashed border-border">
              <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                <Lock className="w-7 h-7 text-muted-foreground" />
              </div>
              <h4 className="font-semibold text-foreground mb-1.5 text-sm">
                No Access Granted
              </h4>
              <p className="text-muted-foreground text-xs">
                Grant access to service accounts to allow them to read this
                secret
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {bindings.map((binding) => (
                <div
                  key={binding.id}
                  className="flex items-center justify-between p-3 bg-muted/50 dark:bg-background border border-border rounded-lg hover:border-primary/40 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">
                        {getServiceAccountName(binding.subject_id)}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 rounded-full font-medium"
                        >
                          {binding.role}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(binding.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRevokeAccess(binding.id)}
                    disabled={revoking === binding.id}
                    className="shrink-0 ml-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Revoke access"
                  >
                    {revoking === binding.id ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Trash2 />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 p-4 sm:px-6 pt-3 border-t border-border bg-card">
        <Button
          variant="secondary"
          onClick={onClose}
          className="w-full rounded-xl font-semibold"
        >
          Close
        </Button>
      </div>
    </Modal>
  );
};

export default ManageAccessModal;
