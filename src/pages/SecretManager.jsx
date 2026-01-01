import { useState, useEffect } from "react";
import {
  FolderKey,
  Plus,
  Key,
  Calendar,
  ArrowLeft,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Tag,
  Copy,
  ExternalLink,
  Loader2,
  AlertCircle,
  FolderOpen,
  Lock,
  History,
  Bot,
  Shield,
} from "lucide-react";
import toast from "react-hot-toast";
import { projectsAPI, secretsAPI, serviceAccountsAPI } from "../utils/api";
import CreateProjectModal from "../components/CreateProjectModal";
import CreateSecretModal from "../components/CreateSecretModal";
import SecretVersionsModal from "../components/SecretVersionsModal";
import CreateServiceAccountModal from "../components/CreateServiceAccountModal";
import ManageAccessModal from "../components/ManageAccessModal";

const SecretManager = () => {
  // State
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [secrets, setSecrets] = useState([]);
  const [serviceAccounts, setServiceAccounts] = useState([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingSecrets, setIsLoadingSecrets] = useState(false);
  const [isLoadingServiceAccounts, setIsLoadingServiceAccounts] =
    useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("secrets"); // 'secrets' | 'service-accounts'

  // Modal states
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showCreateSecretModal, setShowCreateSecretModal] = useState(false);
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [selectedSecret, setSelectedSecret] = useState(null);
  const [showCreateServiceAccountModal, setShowCreateServiceAccountModal] =
    useState(false);
  const [showManageAccessModal, setShowManageAccessModal] = useState(false);

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch data when project is selected
  useEffect(() => {
    if (selectedProject) {
      if (activeTab === "secrets") {
        fetchSecrets(selectedProject.id);
      } else if (activeTab === "service-accounts") {
        fetchServiceAccounts(selectedProject.id);
      }
    }
  }, [selectedProject, activeTab]);

  const fetchProjects = async () => {
    try {
      setIsLoadingProjects(true);
      const response = await projectsAPI.getAll();
      const projectList = response.data || response || [];
      setProjects(Array.isArray(projectList) ? projectList : []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to load projects");
      setProjects([]);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const fetchSecrets = async (projectId) => {
    try {
      setIsLoadingSecrets(true);
      const response = await secretsAPI.getAll(projectId);
      const secretList = response.data || response || [];
      setSecrets(Array.isArray(secretList) ? secretList : []);
    } catch (error) {
      console.error("Error fetching secrets:", error);
      toast.error("Failed to load secrets");
      setSecrets([]);
    } finally {
      setIsLoadingSecrets(false);
    }
  };

  const fetchServiceAccounts = async (projectId) => {
    try {
      setIsLoadingServiceAccounts(true);
      const response = await serviceAccountsAPI.getAll(projectId);
      const saList = response.data || response || [];
      setServiceAccounts(Array.isArray(saList) ? saList : []);
    } catch (error) {
      console.error("Error fetching service accounts:", error);
      toast.error("Failed to load service accounts");
      setServiceAccounts([]);
    } finally {
      setIsLoadingServiceAccounts(false);
    }
  };

  const handleProjectCreated = (newProject) => {
    setShowCreateProjectModal(false);
    toast.success("Project created successfully");
    // Refresh projects list to get latest data
    fetchProjects();
  };

  const handleSecretCreated = (newSecret) => {
    setShowCreateSecretModal(false);
    toast.success("Secret created successfully");
    // Refresh secrets list to get latest data
    if (selectedProject) {
      fetchSecrets(selectedProject.id);
    }
  };

  const handleDeleteProject = async (projectId) => {
    console.log("🗑️ Delete project called with ID:", projectId);

    if (!projectId) {
      console.error("❌ Project ID is undefined!");
      toast.error("Cannot delete project: Project ID is missing");
      return;
    }

    if (
      !confirm(
        "Are you sure you want to delete this project? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      console.log("📡 Calling projectsAPI.delete with ID:", projectId);
      await projectsAPI.delete(projectId);
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
        setSecrets([]);
        setServiceAccounts([]);
      }
      toast.success("Project deleted successfully");
      // Refresh projects list
      fetchProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error(error.response?.data?.message || "Failed to delete project");
    }
  };

  const handleDeleteSecret = async (secretId) => {
    if (
      !confirm(
        "Are you sure you want to delete this secret? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await secretsAPI.delete(secretId);
      toast.success("Secret deleted successfully");
      // Refresh secrets list
      if (selectedProject) {
        fetchSecrets(selectedProject.id);
      }
    } catch (error) {
      console.error("Error deleting secret:", error);
      toast.error(error.response?.data?.message || "Failed to delete secret");
    }
  };

  const handleSecretClick = (secret) => {
    setSelectedSecret(secret);
    setShowVersionsModal(true);
  };

  const handleServiceAccountCreated = (newServiceAccount) => {
    // Refresh service accounts list to get latest data
    if (selectedProject) {
      fetchServiceAccounts(selectedProject.id);
    }
  };

  const handleDeleteServiceAccount = async (serviceAccountId) => {
    if (
      !confirm(
        "Are you sure you want to delete this service account? Applications using this service account will lose access."
      )
    ) {
      return;
    }

    try {
      await serviceAccountsAPI.delete(serviceAccountId);
      toast.success("Service account deleted successfully");
      // Refresh service accounts list
      if (selectedProject) {
        fetchServiceAccounts(selectedProject.id);
      }
    } catch (error) {
      console.error("Error deleting service account:", error);
      toast.error(
        error.response?.data?.message || "Failed to delete service account"
      );
    }
  };

  const handleManageAccess = (secret) => {
    setSelectedSecret(secret);
    setShowManageAccessModal(true);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Filter projects based on search
  const filteredProjects = projects.filter(
    (project) =>
      project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter secrets based on search
  const filteredSecrets = secrets.filter((secret) =>
    secret.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          {selectedProject && (
            <button
              onClick={() => {
                setSelectedProject(null);
                setSecrets([]);
                setSearchQuery("");
              }}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
              <FolderKey className="w-7 h-7 sm:w-8 sm:h-8 text-primary-600 dark:text-primary-400" />
              {selectedProject ? selectedProject.name : "Secret Manager"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {selectedProject
                ? `Manage secrets for ${selectedProject.slug}`
                : "Manage your projects and secrets"}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (selectedProject) {
              if (activeTab === "secrets") {
                setShowCreateSecretModal(true);
              } else {
                setShowCreateServiceAccountModal(true);
              }
            } else {
              setShowCreateProjectModal(true);
            }
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-br from-blue-500 to-blue-600 hover:bg-primary-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-500/25"
        >
          <Plus className="w-5 h-5" />
          {selectedProject
            ? activeTab === "secrets"
              ? "Add Secret"
              : "Create Service Account"
            : "New Project"}
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder={
            selectedProject ? "Search secrets..." : "Search projects..."
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
        />
      </div>

      {/* Content */}
      {!selectedProject ? (
        // Projects List
        <div>
          {isLoadingProjects ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                {searchQuery ? "No projects found" : "No projects yet"}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                {searchQuery
                  ? "Try a different search term"
                  : "Create your first project to start managing secrets"}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowCreateProjectModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Create Project
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700 transition-all cursor-pointer"
                  onClick={() => setSelectedProject(project)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <FolderKey className="w-6 h-6 text-white" />
                    </div>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project.id);
                        }}
                        className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-semibold text-slate-800 dark:text-white mb-1 truncate">
                    {project.name}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1">
                    <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs">
                      {project.slug}
                    </code>
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(project.createdAt)}
                    </span>
                    <span className="flex items-center gap-1 text-primary-600 dark:text-primary-400 font-medium">
                      View secrets
                      <ExternalLink className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Project View with Tabs
        <div>
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab("secrets")}
              className={`px-4 py-3 font-semibold transition-all border-b-2 flex items-center gap-2 ${
                activeTab === "secrets"
                  ? "border-primary-500 text-primary-600 dark:text-primary-400"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Key className="w-4 h-4" />
              Secrets
            </button>
            <button
              onClick={() => setActiveTab("service-accounts")}
              className={`px-4 py-3 font-semibold transition-all border-b-2 flex items-center gap-2 ${
                activeTab === "service-accounts"
                  ? "border-primary-500 text-primary-600 dark:text-primary-400"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Bot className="w-4 h-4" />
              Service Accounts
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "secrets" ? (
            // Secrets Tab Content
            <div>
              {isLoadingSecrets ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                </div>
              ) : filteredSecrets.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Key className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                    {searchQuery ? "No secrets found" : "No secrets yet"}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-6">
                    {searchQuery
                      ? "Try a different search term"
                      : "Create your first secret to store sensitive data"}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={() => {
                        if (selectedProject) {
                          setShowCreateSecretModal(true);
                        } else {
                          toast.error("Please select a project first");
                        }
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-all"
                    >
                      <Plus className="w-5 h-5" />
                      Add Secret
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Secret Name
                          </th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">
                            Labels
                          </th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                            Status
                          </th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">
                            Created
                          </th>
                          <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredSecrets.map((secret) => (
                          <tr
                            key={secret.id}
                            onClick={() => handleSecretClick(secret)}
                            className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Key className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-800 dark:text-white">
                                    {secret.name}
                                  </p>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyToClipboard(secret.name);
                                    }}
                                    className="text-xs text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1"
                                  >
                                    <Copy className="w-3 h-3" />
                                    Copy name
                                  </button>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 hidden sm:table-cell">
                              <div className="flex flex-wrap gap-1.5">
                                {secret.labels &&
                                Object.keys(secret.labels).length > 0 ? (
                                  Object.entries(secret.labels)
                                    .slice(0, 3)
                                    .map(([key, value]) => (
                                      <span
                                        key={key}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md text-xs"
                                      >
                                        <Tag className="w-3 h-3" />
                                        {key}: {value}
                                      </span>
                                    ))
                                ) : (
                                  <span className="text-slate-400 text-sm">
                                    No labels
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 hidden lg:table-cell">
                              {secret.status === "active" ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full text-xs font-medium">
                                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                                  Disabled
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 hidden md:table-cell">
                              <span className="text-sm text-slate-600 dark:text-slate-400">
                                {formatDate(secret.created_at)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleManageAccess(secret);
                                  }}
                                  className="p-2 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                                  title="Manage access"
                                >
                                  <Shield className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSecret(secret.id);
                                  }}
                                  className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                  title="Delete secret"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Info Banner */}
              <div className="mt-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <div className="flex gap-3">
                  <History className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                      Secret Version Management
                    </p>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Click on any secret to manage its versions. Add new secret
                      values, enable/disable versions for rollback, and track
                      version history. Secret values are encrypted and never
                      exposed in the UI.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Service Accounts Tab Content
            <div>
              {isLoadingServiceAccounts ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                </div>
              ) : serviceAccounts.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                    No service accounts yet
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-6">
                    Create a service account to enable machine-to-machine access
                  </p>
                  <button
                    onClick={() => setShowCreateServiceAccountModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    Create Service Account
                  </button>
                </div>
              ) : (
                <div>
                  {/* Service Accounts Table */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-50 dark:bg-slate-900">
                        <tr>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Service Account
                          </th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">
                            Client ID
                          </th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                            Status
                          </th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">
                            Created
                          </th>
                          <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {serviceAccounts.map((sa) => (
                          <tr
                            key={sa.id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Bot className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-800 dark:text-white">
                                    {sa.name}
                                  </p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Machine Identity
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 hidden sm:table-cell">
                              <code className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded font-mono text-xs">
                                {sa.client_id}
                              </code>
                            </td>
                            <td className="px-6 py-4 hidden lg:table-cell">
                              {sa.status === "active" ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full text-xs font-medium">
                                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                                  Disabled
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 hidden md:table-cell">
                              <span className="text-sm text-slate-600 dark:text-slate-400">
                                {formatDate(sa.created_at)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => copyToClipboard(sa.client_id)}
                                  className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                  title="Copy client ID"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteServiceAccount(sa.id)
                                  }
                                  className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                  title="Delete service account"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Info Banner */}
                  <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <div className="flex gap-3">
                      <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                          Service Account Authentication
                        </p>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          Service accounts use RSA key pairs for authentication.
                          The private key is shown only once during creation.
                          Grant access to secrets via IAM bindings to allow
                          service accounts to read them programmatically.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateProjectModal}
        onClose={() => setShowCreateProjectModal(false)}
        onSuccess={handleProjectCreated}
      />

      {/* Create Secret Modal */}
      {selectedProject && (
        <CreateSecretModal
          isOpen={showCreateSecretModal}
          onClose={() => setShowCreateSecretModal(false)}
          onSuccess={handleSecretCreated}
          projectId={selectedProject.id}
          projectName={selectedProject.name}
        />
      )}

      {/* Secret Versions Modal */}
      {selectedSecret && (
        <SecretVersionsModal
          isOpen={showVersionsModal}
          onClose={() => {
            setShowVersionsModal(false);
            setSelectedSecret(null);
          }}
          onSuccess={() => {
            // Refresh secrets list to show updated version status
            if (selectedProject) {
              fetchSecrets(selectedProject.id);
            }
          }}
          secret={selectedSecret}
          projectName={selectedProject?.name}
        />
      )}

      {/* Create Service Account Modal */}
      {selectedProject && (
        <CreateServiceAccountModal
          isOpen={showCreateServiceAccountModal}
          onClose={() => setShowCreateServiceAccountModal(false)}
          onSuccess={handleServiceAccountCreated}
          projectId={selectedProject.id}
          projectName={selectedProject.name}
        />
      )}

      {/* Manage Access Modal */}
      {selectedSecret && selectedProject && (
        <ManageAccessModal
          isOpen={showManageAccessModal}
          onClose={() => {
            setShowManageAccessModal(false);
            setSelectedSecret(null);
          }}
          onSuccess={() => {
            // Refresh both secrets and service accounts to show updated access
            if (selectedProject) {
              fetchSecrets(selectedProject.id);
              fetchServiceAccounts(selectedProject.id);
            }
          }}
          secret={selectedSecret}
          projectId={selectedProject.id}
          projectName={selectedProject.name}
        />
      )}
    </div>
  );
};

export default SecretManager;
