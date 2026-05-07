import axios from "axios";
import { sanitizeStringArray, sanitizeText } from "./sanitize";

const AUTH_REDIRECT_MESSAGE_KEY = "auth_redirect_message";
const PUBLIC_AUTH_ROUTES = [
  "/login",
  "/register",
  "/verify-email",
  "/recover-password",
];
const AUTH_FAILURE_DEBOUNCE_MS = 1500;

let authFailureHandler = null;
let lastAuthFailureAt = 0;

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 10000,
});

const clearStoredAuth = () => {
  // Legacy cleanup for projects that previously stored JWT in localStorage.
  localStorage.removeItem("jwt_token");
  localStorage.removeItem("jwt_token_timestamp");
};

const isPublicAuthRoute = (pathname = window.location.pathname) => {
  return PUBLIC_AUTH_ROUTES.some((route) => pathname.startsWith(route));
};

const getAuthFailureMessage = (error) => {
  const rawMessage =
    error.response?.data?.message || error.response?.data?.error || "";
  const normalizedMessage = rawMessage.toLowerCase();

  if (normalizedMessage.includes("session")) {
    return "Your session has expired. Please sign in again.";
  }

  if (
    normalizedMessage.includes("jwt") ||
    normalizedMessage.includes("token") ||
    error.response?.status === 401
  ) {
    return "Your session has ended. Please sign in again.";
  }

  return "Your session has ended. Please sign in again.";
};

const clearAuthAndRedirect = (error) => {
  clearStoredAuth();

  if (isPublicAuthRoute()) {
    return;
  }

  const now = Date.now();
  if (now - lastAuthFailureAt < AUTH_FAILURE_DEBOUNCE_MS) {
    return;
  }

  lastAuthFailureAt = now;

  const message = getAuthFailureMessage(error);
  sessionStorage.setItem(AUTH_REDIRECT_MESSAGE_KEY, message);

  if (typeof authFailureHandler === "function") {
    authFailureHandler({
      message,
      redirectTo: "/login",
    });
    return;
  }

  window.location.replace("/login");
};

export const registerAuthFailureHandler = (handler) => {
  authFailureHandler = handler;
};

export const consumeAuthRedirectMessage = () => {
  const message = sessionStorage.getItem(AUTH_REDIRECT_MESSAGE_KEY);

  if (message) {
    sessionStorage.removeItem(AUTH_REDIRECT_MESSAGE_KEY);
  }

  return message;
};

api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const authErrorText = (
      error.response?.data?.message || error.response?.data?.error || ""
    ).toLowerCase();

    if (
      authErrorText.includes("jwt") ||
      authErrorText.includes("token")
    ) {
      clearAuthAndRedirect(error);
    }

    if (error.response?.status === 401) {
      clearAuthAndRedirect(error);
    }

    return Promise.reject(error);
  },
);

export const authAPI = {
  register: async (email, masterPassword) => {
    const response = await api.post("/auth/register", {
      email,
      master_password: masterPassword,
    });
    return response.data;
  },

  login: async (email, masterPassword) => {
    const response = await api.post("/auth/login", {
      email,
      master_password: masterPassword,
    });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  verifyRecoveryKey: async (email, recoveryKey) => {
    const response = await api.post("/auth/verify-recovery-key", {
      email,
      recovery_key: recoveryKey,
    });
    return response.data;
  },

  verifyEmail: async (email, code) => {
    const response = await api.post("/auth/verify-email", {
      email,
      code,
    });
    return response.data;
  },

  resendVerification: async (email) => {
    const response = await api.post("/auth/resend-verification", {
      email,
    });
    return response.data;
  },

  resetPassword: async (newPassword) => {
    const response = await api.post("/auth/reset-password", {
      new_password: newPassword,
    });
    return response.data;
  },

  logout: () => {
    clearStoredAuth();
  },
};

export const categoriesAPI = {
  getAll: async () => {
    const response = await api.get("/api/categories");
    return response.data;
  },
};

export const vaultAPI = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.category) {
      params.append("category", filters.category);
    }

    if (filters.search || filters.q) {
      params.append("q", filters.search || filters.q);
    }

    if (filters.favorites !== undefined) {
      params.append("favorites", filters.favorites ? "true" : "false");
    }

    // Add pagination parameters
    if (filters.page) {
      params.append("page", filters.page);
    }

    if (filters.per_page) {
      params.append("per_page", filters.per_page);
    }

    const queryString = params.toString();
    const url = queryString ? `/api/vault?${queryString}` : "/api/vault";

    const response = await api.get(url);
    return response.data;
  },

  exportCsv: async (mek, filters = {}) => {
    const params = new URLSearchParams();

    if (filters.category) {
      params.append("category", filters.category);
    }

    if (filters.search || filters.q) {
      params.append("q", filters.search || filters.q);
    }

    if (filters.favorites !== undefined) {
      params.append("favorites", filters.favorites ? "true" : "false");
    }

    const queryString = params.toString();
    const exportPaths = [
      queryString ? `/vault/export?${queryString}` : "/vault/export",
      queryString ? `/api/vault/export?${queryString}` : "/api/vault/export",
    ];

    const requestConfig = {
      responseType: "blob",
      timeout: 0,
      headers: {
        Accept: "text/csv",
      },
    };

    let lastError;

    for (const path of exportPaths) {
      // Prefer POST so we can pass MEK in body (avoid querystring secrets)
      try {
        return await api.post(path, { mek }, requestConfig);
      } catch (error) {
        lastError = error;
        const status = error?.response?.status;
        // If method not allowed, retry with GET.
        if (status === 405) {
          try {
            return await api.get(path, requestConfig);
          } catch (getError) {
            lastError = getError;
          }
        }

        // Try next path on 404; otherwise stop early.
        if (status !== 404) {
          break;
        }
      }
    }

    throw lastError;
  },

  create: async (vaultData, mek) => {
    const response = await api.post("/api/vault", {
      ...vaultData,
      mek,
    });
    return response.data;
  },

  decrypt: async (id, mek) => {
    const response = await api.post(`/api/vault/${id}/decrypt`, {
      mek,
    });
    return response.data;
  },

  update: async (id, vaultData, mek) => {
    const response = await api.put(`/api/vault/${id}/update`, {
      ...vaultData,
      mek,
    });
    return response.data;
  },

  delete: async (id, mek) => {
    const response = await api.delete(`/api/vault/${id}/delete`, {
      data: { mek },
    });
    return response.data;
  },

  toggleFavorite: async (targetId) => {
    const response = await api.post("/api/vault/favorite", {
      target_id: targetId,
      type: "password",
    });
    return response.data;
  },
};

// Logs API endpoints
export const logsAPI = {
  create: async (action) => {
    const response = await api.post("/api/activity/logs", {
      action: action,
    });
    return response.data;
  },

  getAll: async () => {
    const response = await api.get("/api/activity/logs");
    return response.data;
  },

  getSummary: async () => {
    const response = await api.get("/api/activity/recent-activity");
    return response.data;
  },
};

// Notes API endpoints
export const notesAPI = {
  // Get all notes
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.category) {
      params.append("category", filters.category);
    }

    if (filters.search || filters.q) {
      params.append("q", filters.search || filters.q);
    }

    // Add pagination parameters
    if (filters.page) {
      params.append("page", filters.page);
    }

    if (filters.per_page) {
      params.append("per_page", filters.per_page);
    }

    const queryString = params.toString();
    const url = queryString ? `/api/notes?${queryString}` : "/api/notes";

    const response = await api.get(url);
    return response.data;
  },

  // Get single note by ID
  getById: async (id) => {
    const response = await api.get(`/api/notes/${id}`);
    return response.data;
  },

  // Create new note
  create: async (noteData, mek) => {
    const response = await api.post("/api/notes", {
      title: sanitizeText(noteData.title),
      note: sanitizeText(noteData.note),
      category_id: noteData.category,
      tags: sanitizeStringArray(noteData.tags),
      mek,
    });

    return response.data;
  },

  // Update existing note
  update: async (id, noteData, mek) => {
    const response = await api.put(`/api/notes/${id}/update`, {
      title: sanitizeText(noteData.title),
      note: sanitizeText(noteData.note),
      category_id: noteData.category,
      tags: sanitizeStringArray(noteData.tags),
      mek,
    });

    return response.data;
  },

  // Delete note
  delete: async (id, mek) => {
    const response = await api.delete(`/api/notes/${id}/delete`, {
      data: { mek },
    });
    return response.data;
  },

  // Decrypt note content
  decrypt: async (id, mek) => {
    const response = await api.post(`/api/notes/${id}/decrypt`, {
      mek,
    });
    return response.data;
  },

  toggleFavorite: async (targetId) => {
    const response = await api.post("/api/vault/favorite", {
      target_id: targetId,
      type: "note",
    });
    return response.data;
  },
};

// Projects API endpoints (Secret Manager)
export const projectsAPI = {
  getAll: async (page = 1, per_page = 10) => {
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("per_page", per_page);
    const queryString = params.toString();
    const url = queryString
      ? `/client/project-secret?${queryString}`
      : "/client/project-secret";
    const response = await api.get(url);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/client/project-secret/${id}/show`);
    return response.data;
  },

  create: async (projectData) => {
    const response = await api.post("/client/project-secret/create", {
      name: sanitizeText(projectData.name),
      slug: sanitizeText(projectData.slug),
      description: sanitizeText(projectData.description || ""),
    });
    return response.data;
  },

  update: async (id, projectData) => {
    const response = await api.put(`/client/project-secret/${id}/update`, {
      name: sanitizeText(projectData.name),
      slug: sanitizeText(projectData.slug),
      description: sanitizeText(projectData.description || ""),
    });
    return response.data;
  },

  delete: async (id) => {
    console.log("📡 projectsAPI.delete called with ID:", id);
    if (!id) {
      console.error("❌ Project ID is undefined in API call!");
      throw new Error("Project ID is required for deletion");
    }
    const response = await api.delete(`/client/project-secret/${id}/delete`);
    return response.data;
  },
};

// Secrets API endpoints (Secret Manager)
export const secretsAPI = {
  // Get all secrets for a project
  getAll: async (projectId, page = 1, per_page = 10) => {
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("per_page", per_page);
    const queryString = params.toString();
    const url = queryString
      ? `/client/secret/${projectId}?${queryString}`
      : `/client/secret/${projectId}`;
    const response = await api.get(url);
    return response.data;
  },

  // Get single secret by ID
  getById: async (secretId) => {
    const response = await api.get(`/client/secret/${secretId}/show}`);
    return response.data;
  },

  // Create new secret
  create: async (projectId, secretData) => {
    const payload = { name: sanitizeText(secretData.name) };

    // Only include labels if provided and not empty
    if (secretData.labels && secretData.labels.length > 0) {
      payload.labels = sanitizeStringArray(secretData.labels);
    }

    console.log(
      "📡 API sending to POST /client/secret/" + projectId + "/create:",
      JSON.stringify(payload, null, 2),
    );

    const response = await api.post(
      `/client/secret/${projectId}/create`,
      payload,
    );
    return response.data;
  },

  // Update secret
  update: async (secretId, secretData) => {
    const payload = { name: sanitizeText(secretData.name) };

    // Only include labels if provided and not empty
    if (secretData.labels && secretData.labels.length > 0) {
      payload.labels = sanitizeStringArray(secretData.labels);
    }

    const response = await api.put(
      `/client/secret/${secretId}/update`,
      payload,
    );
    return response.data;
  },

  // Delete secret
  delete: async (secretId) => {
    const response = await api.delete(`/client/secret/${secretId}/delete`);
    return response.data;
  },
};

// Secret Versions API endpoints (Secret Manager - Phase 2)
export const secretVersionsAPI = {
  // Get all versions for a secret
  getAll: async (secretId) => {
    const response = await api.get(`/client/secret-version/${secretId}`);
    return response.data;
  },

  // Create new version (add secret value)
  create: async (secretId, plaintext) => {
    const response = await api.post(
      `/client/secret-version/${secretId}/create`,
      {
        plaintext: plaintext,
      },
    );
    return response.data;
  },

  // Enable/Disable a version
  updateStatus: async (versionId, status) => {
    const response = await api.patch(
      `/client/secret-version/${versionId}/update`,
      { status },
    );
    return response.data;
  },
};

// Service Accounts API endpoints (Secret Manager - Phase 3)
export const serviceAccountsAPI = {
  // Get all service accounts for a project
  getAll: async (projectId, page = 1, per_page = 10) => {
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("per_page", per_page);
    const queryString = params.toString();
    const url = queryString
      ? `/client/service-account/${projectId}?${queryString}`
      : `/client/service-account/${projectId}`;
    const response = await api.get(url);
    return response.data;
  },

  // Create new service account
  create: async (projectId, name) => {
    const response = await api.post(
      `/client/service-account/${projectId}/create`,
      {
        name: sanitizeText(name),
      },
    );
    return response.data;
  },

  // Delete service account
  delete: async (serviceAccountId) => {
    const response = await api.delete(
      `/client/service-account/${serviceAccountId}/delete`,
    );
    return response.data;
  },
};

// IAM Bindings API endpoints (Secret Manager - Phase 3)
export const iamBindingsAPI = {
  getByResourceId: async (resourceId) => {
    const response = await api.get(`/client/bindings`, {
      params: { resource_id: resourceId },
    });
    return response.data;
  },

  create: async (secretId, serviceAccountId) => {
    const response = await api.post(`/client/bindings/${secretId}/create`, {
      service_account_id: serviceAccountId,
    });
    return response.data;
  },

  delete: async (bindingId) => {
    const response = await api.delete(`/client/bindings/${bindingId}/delete`);
    return response.data;
  },
};

// Files Encrypted API endpoints (Secure Files)
export const filesAPI = {
  createFolder: async (name) => {
    const response = await api.post("/api/files/folders", {
      name: sanitizeText(name),
    });
    return response.data;
  },

  listFolders: async () => {
    const response = await api.get("/api/files/folders");
    return response.data;
  },

  openFolder: async (folderId) => {
    const response = await api.get(`/api/files/folders/${folderId}/files`);
    return response.data;
  },

  uploadFile: async (formData) => {
    const response = await api.post("/api/files/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 0, // No timeout for large uploads
    });
    return response.data;
  },

  listAllFiles: async (page = 1, per_page = 10, q = "") => {
    const params = new URLSearchParams();
    if (page) params.append("page", page);
    if (per_page) params.append("per_page", per_page);
    if (q) params.append("q", q);

    const queryString = params.toString();
    const url = queryString ? `/api/files?${queryString}` : "/api/files";
    
    const response = await api.get(url);
    return response.data;
  },

  downloadFile: async (id, mek) => {
    const response = await api.post(`/api/files/${id}/download`, { mek }, {
      responseType: 'blob',
      timeout: 0, // No timeout for large downloads
    });
    return response; // Return full response to access headers
  },

  downloadFolder: async (folderId, mek) => {
    const response = await api.post(`/api/files/folders/${folderId}/download`, { mek }, {
      responseType: 'blob',
      timeout: 0, // No timeout for large downloads
    });
    return response; // Return full response to access headers
  },

  deleteFile: async (id) => {
    const response = await api.delete(`/api/files/${id}/delete`);
    return response.data;
  },

  deleteFolder: async (folderId) => {
    const response = await api.delete(`/api/files/folders/${folderId}/delete`);
    return response.data;
  },
};

export default api;
