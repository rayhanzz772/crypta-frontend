import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI, logsAPI, registerAuthFailureHandler } from "../utils/api";
import {
  sha256Hex,
  deriveKEK,
  generateRandomHex,
  wrapMEK,
  unwrapMEK,
} from "../utils/crypto";

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

  if (rawMessage.includes("getaddrinfo") && rawMessage.includes("ip-api.com")) {
    return "Your login was temporarily interrupted because the server location service was unavailable. Please try again later.";
  }

  return error?.response?.data?.message || fallbackMessage;
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Master Encryption Key — in-memory only, NEVER persisted.
  const [mek, setMek] = useState(null);

  // The mek_data blob from the login response (needed for vault unlock).
  // Stored in React state only — cleared on logout/lock.
  const [mekData, setMekData] = useState(null);

  // Stores email during legacy migration so the modal can use it.
  const [legacyMigrationState, setLegacyMigrationState] = useState(null);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

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
    if (!currentUser || typeof currentUser !== "object") return false;
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
    setMekData(null);
    setLegacyMigrationState(null);
    setIsAuthenticated(false);
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("jwt_token_timestamp");
    localStorage.removeItem(AUTH_EMAIL_STORAGE_KEY);
  };

  // -------------------------------------------------------------------------
  // Session initialisation — check cookie-backed session on mount.
  // NOTE: After a page refresh the MEK is gone. The vault will be locked
  // until the user explicitly unlocks it with their master password.
  // -------------------------------------------------------------------------

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

  // Ensure sensitive key material is cleared when the tab closes.
  useEffect(() => {
    const clearSensitiveMemory = () => {
      setMek(null);
      setMekData(null);
    };

    window.addEventListener("beforeunload", clearSensitiveMemory);
    window.addEventListener("pagehide", clearSensitiveMemory);

    return () => {
      window.removeEventListener("beforeunload", clearSensitiveMemory);
      window.removeEventListener("pagehide", clearSensitiveMemory);
    };
  }, []);

  // -------------------------------------------------------------------------
  // Register — full ZKE key generation client-side.
  // -------------------------------------------------------------------------

  const register = async (email, zkePayload) => {
    try {
      const data = await authAPI.register(email, zkePayload);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        errorCode: error.response?.data?.errorCode || null,
        error:
          error.response?.data?.message ||
          "Registration failed. Please try again.",
        data: error.response?.data?.data || null,
      };
    }
  };

  // -------------------------------------------------------------------------
  // Login — hash password client-side, then unwrap MEK locally.
  // -------------------------------------------------------------------------

  const login = async (email, password) => {
    try {
      // 1. Derive master_hash for the ZKE path
      const masterHash = await sha256Hex(password);

      let loginData;
      let isLegacy = false;

      try {
        loginData = await authAPI.login(email, masterHash);
      } catch (hashLoginError) {
        // If the hashed login fails with 401, try the legacy plaintext path.
        if (hashLoginError?.response?.status === 401) {
          try {
            loginData = await authAPI.login(email, password);
            isLegacy = true;
          } catch {
            // Both paths failed — re-throw the original hash-based error.
            throw hashLoginError;
          }
        } else {
          throw hashLoginError;
        }
      }

      // 2. Fetch full user profile
      let authMeData = null;
      try {
        authMeData = await authAPI.getMe();
      } catch {
        // Non-fatal — fall back to login response data
      }

      const currentUser = extractCurrentUser(authMeData || loginData, email);
      persistAuthEmail(currentUser?.email || email);

      setUser(currentUser);
      setIsAuthenticated(true);

      const mekVersion = loginData?.data?.user?.mek_version ?? (isLegacy ? 0 : 1);

      // 3. Legacy migration path (mek_version = 0)
      if (isLegacy || mekVersion === 0) {
        // Store state for the migration wizard — MEK will be set after migration.
        setLegacyMigrationState({
          email,
          password, // needed to decrypt per-item legacy keys
        });
        return { success: true, needsMigration: true, user: currentUser };
      }

      // 4. Normal ZKE path — unwrap MEK client-side
      const mekDataFromServer = loginData?.data?.mek_data;
      if (!mekDataFromServer) {
        throw new Error("Server did not return mek_data. Cannot unlock vault.");
      }

      const { kek_salt, encrypted_mek_by_password, mek_pw_iv, mek_pw_tag } =
        mekDataFromServer;

      if (!kek_salt || !encrypted_mek_by_password) {
        throw new Error("Incomplete mek_data from server.");
      }

      const kek = await deriveKEK(password, kek_salt);
      const unwrappedMek = await unwrapMEK(
        encrypted_mek_by_password,
        mek_pw_iv,
        mek_pw_tag,
        kek,
      );

      if (!isBlockedUser(currentUser)) {
        setMek(unwrappedMek);
        setMekData(mekDataFromServer);
      }

      return { success: true, data: loginData, user: currentUser };
    } catch (error) {
      return {
        success: false,
        error: getFriendlyAuthError(error, "Login failed. Please try again."),
      };
    }
  };

  // -------------------------------------------------------------------------
  // Logout
  // -------------------------------------------------------------------------

  const logout = () => {
    authAPI.logout();
    clearClientAuthState();
  };

  // -------------------------------------------------------------------------
  // Lock Vault — clears MEK from memory; session cookie stays valid.
  // -------------------------------------------------------------------------

  const lockVault = async () => {
    setMek(null);

    try {
      await logsAPI.create("Locked Vault");
    } catch {
      // Non-fatal
    }
  };

  // -------------------------------------------------------------------------
  // Unlock Vault — re-derive KEK and unwrap MEK locally.
  // No server round-trip needed beyond fetching the salt.
  // -------------------------------------------------------------------------

  const unlockVault = async (email, password) => {
    try {
      const persistedEmail = localStorage.getItem(AUTH_EMAIL_STORAGE_KEY);
      const resolvedEmail = (email || persistedEmail || "").trim();

      if (!resolvedEmail) {
        return { success: false, error: "Email is missing. Please sign in again." };
      }

      // Fetch the KEK salt for this account
      let saltResponse;
      try {
        saltResponse = await authAPI.getSalt(resolvedEmail);
      } catch {
        return {
          success: false,
          error: "Could not retrieve account salt. Please check your connection.",
        };
      }

      const kekSalt = saltResponse?.data?.kek_salt;
      if (!kekSalt) {
        return {
          success: false,
          error: "Account salt unavailable. Please sign in again.",
        };
      }

      // We need the mek_data blob to unwrap the MEK. If we don't have it in
      // memory (e.g. after a hard refresh), re-derive by logging in fully.
      let resolvedMekData = mekData;

      if (!resolvedMekData) {
        const masterHash = await sha256Hex(password);
        const loginResponse = await authAPI.login(resolvedEmail, masterHash);
        resolvedMekData = loginResponse?.data?.mek_data;
        if (resolvedMekData) {
          setMekData(resolvedMekData);
        }
      }

      if (!resolvedMekData) {
        return {
          success: false,
          error: "Encryption metadata unavailable. Please sign in again.",
        };
      }

      const { encrypted_mek_by_password, mek_pw_iv, mek_pw_tag } =
        resolvedMekData;

      const kek = await deriveKEK(password, kekSalt);
      const unwrappedMek = await unwrapMEK(
        encrypted_mek_by_password,
        mek_pw_iv,
        mek_pw_tag,
        kek,
      );

      setMek(unwrappedMek);

      try {
        await logsAPI.create("Unlocked Vault");
      } catch {
        // Non-fatal
      }

      return { success: true };
    } catch (error) {
      // Decryption error (wrong password) will be a generic DOMException.
      const isWrongPassword =
        error instanceof DOMException ||
        error?.message?.toLowerCase().includes("decrypt");

      return {
        success: false,
        error: isWrongPassword
          ? "Invalid password. Please try again."
          : getFriendlyAuthError(error, "Invalid password. Please try again."),
      };
    }
  };

  // -------------------------------------------------------------------------
  // completeMigration — called by the LegacyMigrationModal when done.
  // Receives the freshly generated MEK to set in context.
  // -------------------------------------------------------------------------

  const completeMigration = (newMek, newMekData) => {
    setMek(newMek);
    setMekData(newMekData);
    setLegacyMigrationState(null);
  };

  // -------------------------------------------------------------------------

  const isBlocked = isBlockedUser(user);

  const value = {
    user,
    mek,
    mekData,
    isAuthenticated,
    isBlocked,
    isLoading,
    legacyMigrationState,
    login,
    register,
    logout,
    lockVault,
    unlockVault,
    completeMigration,
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
