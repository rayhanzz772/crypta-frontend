import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  authAPI,
  logsAPI,
  registerAuthFailureHandler,
} from "../utils/api";

const AuthContext = createContext();
const AUTH_EMAIL_STORAGE_KEY = "auth_email";

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
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("jwt_token_timestamp");
    localStorage.removeItem(AUTH_EMAIL_STORAGE_KEY);
  };

  // Check if user is authenticated on mount
  useEffect(() => {
    const token = localStorage.getItem("jwt_token");
    const tokenTimestamp = localStorage.getItem("jwt_token_timestamp");

    if (token && tokenTimestamp) {
      const now = Date.now();
      const tokenAge = now - parseInt(tokenTimestamp);
      const oneSecond = 1000; // 1 second in milliseconds

      // Check if token is older than 1 second since last page close
      if (tokenAge > oneSecond) {
        localStorage.removeItem("jwt_token");
        localStorage.removeItem("jwt_token_timestamp");
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(true);
        // You might want to fetch user details here
      }
    }
    setIsLoading(false);
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

  // Update timestamp when page becomes visible (page is opened/active)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isAuthenticated) {
        // Reset timestamp when page becomes visible again
        localStorage.setItem("jwt_token_timestamp", Date.now().toString());
      }
    };

    // Update timestamp before page closes/hides
    const handleBeforeUnload = () => {
      if (isAuthenticated) {
        localStorage.setItem("jwt_token_timestamp", Date.now().toString());
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isAuthenticated]);

  const login = async (email, password) => {
    try {
      const data = await authAPI.login(email, password);

      // Check all possible token field names
      const token = data?.data?.token;

      // Validate token exists
      if (!token) {
        return {
          success: false,
          error:
            "No authentication token received from server. Please check backend response format.",
        };
      }

      // Basic JWT format check (should have 3 parts separated by dots)
      const tokenParts = token.split(".");
      if (tokenParts.length !== 3) {
        return {
          success: false,
          error: "Invalid token format received from server",
        };
      }

      // Save JWT token to localStorage with timestamp
      localStorage.setItem("jwt_token", token);
      localStorage.setItem("jwt_token_timestamp", Date.now().toString());

      const authMeData = await authAPI.getMe();
      const currentUser = extractCurrentUser(authMeData, email);
      const normalizedEmail = (currentUser?.email || email || "").trim();

      if (normalizedEmail) {
        localStorage.setItem(AUTH_EMAIL_STORAGE_KEY, normalizedEmail);
      }

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
        error:
          error.response?.data?.message || "Login failed. Please try again.",
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
        error:
          error.response?.data?.message ||
          "Invalid password. Please try again.",
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
