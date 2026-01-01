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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Manage Access</h2>
                <p className="text-white/80 text-sm">
                  {secret.name} • {projectName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Info Banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
                  IAM Access Control
                </p>
                <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
                  Grant service accounts read access to this secret. Service
                  accounts must have explicit permissions to access secrets.
                </p>
              </div>
            </div>
          </div>

          {/* Grant Access Button/Form */}
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              disabled={availableServiceAccounts.length === 0}
              className="w-full px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-400 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
              {availableServiceAccounts.length === 0
                ? "No Service Accounts Available"
                : "Grant Access to Service Account"}
            </button>
          ) : (
            <form
              onSubmit={handleGrantAccess}
              className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 space-y-4"
            >
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Select Service Account
                </label>
                <select
                  value={selectedServiceAccountId}
                  onChange={(e) => setSelectedServiceAccountId(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  disabled={isGranting}
                >
                  <option value="">-- Choose a service account --</option>
                  {availableServiceAccounts.map((sa) => (
                    <option key={sa.id} value={sa.id}>
                      {sa.name} ({sa.client_id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  <strong>Role:</strong> secret.accessor (read-only)
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setSelectedServiceAccountId("");
                  }}
                  disabled={isGranting}
                  className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGranting || !selectedServiceAccountId}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGranting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Granting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Grant Access
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Bindings List */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <h3 className="font-semibold text-slate-800 dark:text-white">
                Service Accounts with Access ({bindings.length})
              </h3>
            </div>

            {isLoadingBindings ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              </div>
            ) : bindings.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-slate-400" />
                </div>
                <h4 className="font-semibold text-slate-800 dark:text-white mb-2">
                  No Access Granted
                </h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Grant access to service accounts to allow them to read this
                  secret
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {bindings.map((binding) => (
                  <div
                    key={binding.id}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-purple-300 dark:hover:border-purple-700 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-white">
                          {getServiceAccountName(binding.subject_id)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs font-medium">
                            {binding.role}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Granted {formatDate(binding.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRevokeAccess(binding.id)}
                      disabled={revoking === binding.id}
                      className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                      title="Revoke access"
                    >
                      {revoking === binding.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageAccessModal;
