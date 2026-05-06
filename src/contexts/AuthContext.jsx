import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  authAPI,
  logsAPI,
  registerAuthFailureHandler,
} from "../utils/api";

const AuthContext = createContext();
const AUTH_EMAIL_STORAGE_KEY = "auth_email";

const persistAuthEmail = (email) => {
  const normalizedEmail = (email || "").trim();
  if (normalizedEmail) {
    localStorage.setItem(AUTH_EMAIL_STORAGE_KEY, normalizedEmail);
  }
};

const getFriendlyAuthError = (error, fallbackMessage) => {
  const rawMessage = (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    ""
  ).toLowerCase();

  if (
    rawMessage.includes("getaddrinfo") &&
    rawMessage.includes("ip-api.com")
  ) {
    return "Your login was temporarily interrupted because the server location service was unavailable. Please try again later.";
  }

  return error?.response?.data?.message || fallbackMessage;
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [mek, setMek] = useState(null); // Master Encryption Key — in-memory only, never persisted
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const extractCurrentUser = (authMeData, fallbackEmail) => {
    const authMePayload = authMeData?.data;

    if (authMePayload?.user && typeof authMePayload.user === "object") {
      return authMePayload.user;
    }

    if (authMeData?.user && typeof authMeData.user === "object") {
      return authMeData.user;
    }

    if (
      authMePayload &&
      typeof authMePayload === "object" &&
      !Array.isArray(authMePayload)
    ) {
      return authMePayload;
    }

    return { email: fallbackEmail };
  };

  const isBlockedUser = (currentUser) => {
    if (!currentUser || typeof currentUser !== "object") {
      return false;
    }

    return (
      currentUser.blocked === true ||
      currentUser.is_blocked === true ||
      currentUser.blocked_at != null ||
      currentUser.status === "blocked" ||
      currentUser.account_status === "blocked"
    );
  };

  const clearClientAuthState = () => {
    setUser(null);
    setMek(null);
    setIsAuthenticated(false);
    // Legacy cleanup for old localStorage token mode.
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("jwt_token_timestamp");
    localStorage.removeItem(AUTH_EMAIL_STORAGE_KEY);
  };

  // Check cookie-backed session on mount.
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const authMeData = await authAPI.getMe();
        const currentUser = extractCurrentUser(authMeData);

        setUser(currentUser);
        setIsAuthenticated(true);
        persistAuthEmail(currentUser?.email);
      } catch {
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();
  }, []);

  useEffect(() => {
    registerAuthFailureHandler(({ redirectTo }) => {
      clearClientAuthState();
      navigate(redirectTo, { replace: true });
    });

    return () => {
      registerAuthFailureHandler(null);
    };
  }, [navigate]);

  // Ensure sensitive key material is cleared from memory when tab/window closes.
  useEffect(() => {
    const clearSensitiveMemory = () => {
      setMek(null);
    };

    window.addEventListener("beforeunload", clearSensitiveMemory);
    window.addEventListener("pagehide", clearSensitiveMemory);

    return () => {
      window.removeEventListener("beforeunload", clearSensitiveMemory);
      window.removeEventListener("pagehide", clearSensitiveMemory);
    };
  }, []);

  const login = async (email, password) => {
    try {
      const data = await authAPI.login(email, password);

      let authMeData = null;
      try {
        authMeData = await authAPI.getMe();
      } catch {
        // Fallback to login response structure when /auth/me is temporarily unavailable.
      }

      const currentUser = extractCurrentUser(authMeData || data, email);
      persistAuthEmail(currentUser?.email || email);

      // Store MEK in React state ONLY — never persisted to localStorage
      const receivedMek = data?.data?.mek || null;
      if (!isBlockedUser(currentUser)) {
        setMek(receivedMek);
      }

      // Update auth state (blocked users can log in but see a blocked screen)
      setUser(currentUser);
      setIsAuthenticated(true);

      return { success: true, data, user: currentUser, authMe: authMeData };
    } catch (error) {
      return {
        success: false,
        error: getFriendlyAuthError(error, "Login failed. Please try again."),
      };
    }
  };

  const register = async (email, password) => {
    try {
      const data = await authAPI.register(email, password);

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          "Registration failed. Please try again.",
      };
    }
  };

  const logout = () => {
    authAPI.logout();
    clearClientAuthState();
  };

  const lockVault = async () => {
    // Lock vault by clearing MEK from memory — JWT token remains valid
    setMek(null);

    // Log the action to the backend
    try {
      await logsAPI.create("Locked Vault");
    } catch {
      // Don't throw error, locking should still work even if logging fails
    }
  };

  // Re-login to retrieve a fresh MEK from the server.
  // There is no way to reconstruct the MEK client-side — the server must derive it.
  const unlockVault = async (email, password) => {
    try {
      const persistedEmail = localStorage.getItem(AUTH_EMAIL_STORAGE_KEY);
      const resolvedEmail = (email || persistedEmail || "").trim();

      if (!resolvedEmail) {
        return {
          success: false,
          error: "Email is missing. Please sign in again.",
        };
      }

      const data = await authAPI.login(resolvedEmail, password);
      const freshMek = data?.data?.mek || null;

      if (!freshMek) {
        return {
          success: false,
          error: "Server did not return an encryption key.",
        };
      }

      setMek(freshMek);

      // Log the action to the backend
      try {
        await logsAPI.create("Unlocked Vault");
      } catch {
        // Don't throw error, unlocking should still work even if logging fails
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: getFriendlyAuthError(
          error,
          "Invalid password. Please try again.",
        ),
      };
    }
  };

  const isBlocked = isBlockedUser(user);

  const value = {
    user,
    mek, // Master Encryption Key — in-memory only
    isAuthenticated,
    isBlocked,
    isLoading,
    login,
    register,
    logout,
    lockVault,
    unlockVault,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
