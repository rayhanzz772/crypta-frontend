import { createContext, useContext, useState, useEffect } from "react";
import { authAPI, logsAPI } from "../utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [mek, setMek] = useState(null); // Master Encryption Key — in-memory only, never persisted
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

      // Store MEK in React state ONLY — never persisted to localStorage
      const receivedMek = data?.data?.mek || null;
      setMek(receivedMek);

      // Update auth state
      setUser(data?.data?.user || { email });
      setIsAuthenticated(true);

      return { success: true, data };
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

      // Registration does not return a MEK — user must log in to get one
      // Optionally auto-login after registration if a token is returned
      const token = data?.data?.token;
      if (token) {
        localStorage.setItem("jwt_token", token);
        localStorage.setItem("jwt_token_timestamp", Date.now().toString());
        setUser(data?.data?.user || { email });
        setIsAuthenticated(true);
        // MEK is not available at registration time — vault starts locked
      }

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
    setUser(null);
    setMek(null); // Clear MEK from memory
    setIsAuthenticated(false);
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("jwt_token_timestamp");
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
      const data = await authAPI.login(email, password);
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

  const value = {
    user,
    mek, // Master Encryption Key — in-memory only
    isAuthenticated,
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
