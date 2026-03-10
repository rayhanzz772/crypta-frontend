import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 10000,
});

const clearAuthAndRedirect = () => {
  localStorage.removeItem("jwt_token");
  const publicAuthRoutes = ["/login", "/register", "/verify-email"];

  if (
    !publicAuthRoutes.some((route) => window.location.pathname.includes(route))
  ) {
    window.location.href = "/login";
  }
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("jwt_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
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
    if (
      error.response?.data?.message?.includes("JWT") ||
      error.response?.data?.message?.includes("jwt") ||
      error.response?.data?.error?.includes("JWT") ||
      error.response?.data?.error?.includes("jwt")
    ) {
      clearAuthAndRedirect();
    }

    if (error.response?.status === 401) {
      clearAuthAndRedirect();
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
    localStorage.removeItem("jwt_token");
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
    const response = await api.post("/api/vault/logs", {
      action: action,
    });
    return response.data;
  },

  getAll: async () => {
    const response = await api.get("/api/vault/logs");
    return response.data;
  },

  getSummary: async () => {
    const response = await api.get("/api/vault/recent-activity");
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
      title: noteData.title,
      note: noteData.note,
      category_id: noteData.category,
      tags: noteData.tags || [],
      mek,
    });

    return response.data;
  },

  // Update existing note
  update: async (id, noteData, mek) => {
    const response = await api.put(`/api/notes/${id}/update`, {
      title: noteData.title,
      note: noteData.note,
      category_id: noteData.category,
      tags: noteData.tags || [],
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
      name: projectData.name,
      slug: projectData.slug,
      description: projectData.description || "",
    });
    return response.data;
  },

  update: async (id, projectData) => {
    const response = await api.put(`/client/project-secret/${id}/update`, {
      name: projectData.name,
      slug: projectData.slug,
      description: projectData.description || "",
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
    const payload = { name: secretData.name };

    // Only include labels if provided and not empty
    if (secretData.labels && secretData.labels.length > 0) {
      payload.labels = secretData.labels;
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
    const payload = { name: secretData.name };

    // Only include labels if provided and not empty
    if (secretData.labels && secretData.labels.length > 0) {
      payload.labels = secretData.labels;
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
        name,
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

export default api;
