import { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import {
  FolderKey,
  Plus,
  Key,
  Calendar,
  ArrowLeft,
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
import { useAuth } from "../contexts/AuthContext";
import { projectsAPI, secretsAPI, serviceAccountsAPI } from "../utils/api";
import CreateProjectModal from "../components/CreateProjectModal";
import CreateSecretModal from "../components/CreateSecretModal";
import SecretVersionsModal from "../components/SecretVersionsModal";
import CreateServiceAccountModal from "../components/CreateServiceAccountModal";
import ManageAccessModal from "../components/ManageAccessModal";
import Pagination from "../components/Pagination";

const SecretManager = () => {
  // Get search query from layout context
  const { searchQuery = "" } = useOutletContext();
  const { masterPassword } = useAuth();

  const isVaultLocked = !masterPassword;

  // State
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [secrets, setSecrets] = useState([]);
  const [serviceAccounts, setServiceAccounts] = useState([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingSecrets, setIsLoadingSecrets] = useState(false);
  const [isLoadingServiceAccounts, setIsLoadingServiceAccounts] =
    useState(false);
  const [activeTab, setActiveTab] = useState("secrets"); // 'secrets' | 'service-accounts'

  // Pagination state
  const [projectsPage, setProjectsPage] = useState(1);
  const [projectsPerPage, setProjectsPerPage] = useState(10);
  const [projectsMetadata, setProjectsMetadata] = useState(null);

  const [secretsPage, setSecretsPage] = useState(1);
  const [secretsPerPage, setSecretsPerPage] = useState(10);
  const [secretsMetadata, setSecretsMetadata] = useState(null);

  const [serviceAccountsPage, setServiceAccountsPage] = useState(1);
  const [serviceAccountsPerPage, setServiceAccountsPerPage] = useState(10);
  const [serviceAccountsMetadata, setServiceAccountsMetadata] = useState(null);

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
    if (!isVaultLocked) {
      fetchProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectsPage, projectsPerPage, isVaultLocked]);

  // Fetch data when project is selected
  useEffect(() => {
    if (selectedProject) {
      if (activeTab === "secrets") {
        fetchSecrets(selectedProject.id);
      } else if (activeTab === "service-accounts") {
        fetchServiceAccounts(selectedProject.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedProject,
    activeTab,
    secretsPage,
    secretsPerPage,
    serviceAccountsPage,
    serviceAccountsPerPage,
  ]);

  const fetchProjects = async () => {
    try {
      setIsLoadingProjects(true);
      const response = await projectsAPI.getAll(projectsPage, projectsPerPage);
      // Handle response with metadata
      if (response.success && response.metadata) {
        setProjectsMetadata(response.metadata);
        setProjects(Array.isArray(response.data) ? response.data : []);
      } else {
        // Fallback for responses without metadata
        const projectList = response.data || response || [];
        setProjects(Array.isArray(projectList) ? projectList : []);
      }
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
      const response = await secretsAPI.getAll(
        projectId,
        secretsPage,
        secretsPerPage
      );
      // Handle response with metadata
      if (response.success && response.metadata) {
        setSecretsMetadata(response.metadata);
        setSecrets(Array.isArray(response.data) ? response.data : []);
      } else {
        // Fallback for responses without metadata
        const secretList = response.data || response || [];
        setSecrets(Array.isArray(secretList) ? secretList : []);
      }
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
      const response = await serviceAccountsAPI.getAll(
        projectId,
        serviceAccountsPage,
        serviceAccountsPerPage
      );
      // Handle response with metadata
      if (response.success && response.metadata) {
        setServiceAccountsMetadata(response.metadata);
        setServiceAccounts(Array.isArray(response.data) ? response.data : []);
      } else {
        // Fallback for responses without metadata
        const saList = response.data || response || [];
        setServiceAccounts(Array.isArray(saList) ? saList : []);
      }
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

  // Filter service accounts based on search
  const filteredServiceAccounts = serviceAccounts.filter(
    (sa) =>
      sa.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sa.client_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show locked screen if vault is locked
  if (isVaultLocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <FolderKey className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 bg-amber-500 rounded-full flex items-center justify-center">
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-3">
              Secret Manager Locked
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mb-2">
              Your projects and secrets are protected
            </p>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-500">
              Unlock your vault with your master password to access your
              encrypted secrets
            </p>
          </div>

          {/* Info Cards */}
          <div className="space-y-3 mb-6 sm:mb-8">
            <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 sm:p-4 flex items-start gap-3">
              <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white mb-1">
                  End-to-End Encrypted
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  All secrets are encrypted with AES-256 encryption
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 sm:p-4 flex items-start gap-3">
              <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white mb-1">
                  Zero-Knowledge Security
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Your secrets are never stored in plain text
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 sm:p-4 flex items-start gap-3">
              <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                <Key className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white mb-1">
                  Version Control
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Track and rollback secret versions with full history
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 sm:p-4 flex items-start gap-3">
              <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white mb-1">
                  Service Account Access
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Grant programmatic access with IAM permissions
                </p>
              </div>
            </div>
          </div>

          {/* Security Note */}
          <div className="bg-gradient-to-br from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 border-2 border-primary-200 dark:border-primary-800 rounded-xl p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-primary-800 dark:text-primary-200 mb-1">
                  Security First
                </h3>
                <p className="text-xs text-primary-700 dark:text-primary-300">
                  Your master password is never sent to our servers. All
                  encryption and decryption happens locally in your browser.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                setServiceAccounts([]);
                // Reset pagination for secrets and service accounts
                setSecretsPage(1);
                setServiceAccountsPage(1);
              }}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
              <FolderKey className="w-7 h-7 sm:w-8 sm:h-8 text-white-600 dark:text-white-400" />
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
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-br from-blue-500 to-blue-600 hover:bg-primary-600 text-white font-semibold rounded-xl transition-all"
        >
          <Plus className="w-5 h-5" />
          {selectedProject
            ? activeTab === "secrets"
              ? "Add Secret"
              : "Create Service Account"
            : "New Project"}
        </button>
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
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all"
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
                  onClick={() => {
                    setSelectedProject(project);
                    // Reset pagination when selecting a project
                    setSecretsPage(1);
                    setServiceAccountsPage(1);
                  }}
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

          {/* Projects Pagination */}
          {!selectedProject && filteredProjects.length > 0 && (
            <div className="mt-6">
              <Pagination
                metadata={projectsMetadata}
                currentPage={projectsPage}
                onPageChange={setProjectsPage}
              />
            </div>
          )}
        </div>
      ) : (
        // Project View with Tabs
        <div>
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={() => {
                setActiveTab("secrets");
                setSecretsPage(1);
              }}
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
              onClick={() => {
                setActiveTab("service-accounts");
                setServiceAccountsPage(1);
              }}
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

              {/* Secrets Pagination */}
              {filteredSecrets.length > 0 && (
                <div className="mt-6">
                  <Pagination
                    metadata={secretsMetadata}
                    currentPage={secretsPage}
                    onPageChange={setSecretsPage}
                  />
                </div>
              )}

              {/* Info Banner */}
            </div>
          ) : (
            // Service Accounts Tab Content
            <div>
              {isLoadingServiceAccounts ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                </div>
              ) : filteredServiceAccounts.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                    {searchQuery
                      ? "No service accounts found"
                      : "No service accounts yet"}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-6">
                    {searchQuery
                      ? "Try a different search term"
                      : "Create a service account to enable machine-to-machine access"}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={() => setShowCreateServiceAccountModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl transition-all"
                    >
                      <Plus className="w-5 h-5" />
                      Create Service Account
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  {/* Service Accounts Table */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    {/* Mobile Card View */}
                    <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-700">
                      {filteredServiceAccounts.map((sa) => (
                        <div
                          key={sa.id}
                          className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-800 dark:text-white mb-1 truncate">
                                {sa.name}
                              </p>
                              <code className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded font-mono break-all">
                                {sa.client_id}
                              </code>
                            </div>
                            {sa.status === "active" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium flex-shrink-0">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full text-xs font-medium flex-shrink-0">
                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                                Disabled
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {formatDate(sa.created_at)}
                            </span>
                            <div className="flex items-center gap-1">
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
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <table className="w-full hidden sm:table">
                      <thead className="bg-slate-50 dark:bg-slate-900">
                        <tr>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
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
                        {filteredServiceAccounts.map((sa) => (
                          <tr
                            key={sa.id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                          >
                            <td className="px-6 py-4">
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

                  {/* Service Accounts Pagination */}
                  {filteredServiceAccounts.length > 0 && (
                    <div className="mt-6">
                      <Pagination
                        metadata={serviceAccountsMetadata}
                        currentPage={serviceAccountsPage}
                        onPageChange={setServiceAccountsPage}
                      />
                    </div>
                  )}
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
