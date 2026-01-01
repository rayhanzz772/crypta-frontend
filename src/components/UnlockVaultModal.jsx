import { useState } from "react";
import {
  Lock,
  Eye,
  EyeOff,
  X,
  Shield,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { authAPI } from "../utils/api";
import { useNavigate } from "react-router-dom";

const UnlockVaultModal = ({ isOpen, onClose }) => {
  const { unlockVault, logout } = useAuth();
  const navigate = useNavigate();
  const [masterPassword, setMasterPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const validatePassword = (master_password) => {
    const errors = [];

    if (!master_password) {
      errors.push("Master password is required");
      return errors;
    }

    if (master_password.length < 8) {
      errors.push("Password must be at least 8 characters");
    }

    if (master_password.trim() !== master_password) {
      errors.push("Password cannot start or end with spaces");
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    const validationErrors = validatePassword(masterPassword);
    if (validationErrors.length > 0) {
      setError(validationErrors[0]);
      return;
    }

    try {
      setIsLoading(true);

      // Call the password validation endpoint
      const response = await authAPI.checkPassword(masterPassword);

      // Check if password is valid
      if (response.data && response.data.valid === true) {
        // Unlock the vault with the verified password
        await unlockVault(masterPassword);

        toast.success("Vault unlocked successfully!", {
          icon: "🔓",
          duration: 1500,
        });

        // Clear form and close modal
        setMasterPassword("");
        setShowPassword(false);
        onClose();
      } else {
        setError("Invalid master password. Please try again.");
        toast.error("Invalid master password", {
          icon: "🔒",
        });
      }
    } catch (error) {
      // Handle specific error cases
      if (error.response?.status === 401) {
        setError("Invalid master password. Please try again.");
        toast.error("Invalid master password");
      } else if (error.response?.status === 429) {
        setError("Too many attempts. Please try again later.");
        toast.error("Too many attempts. Please wait a moment.");
      } else if (
        error.code === "ECONNABORTED" ||
        error.code === "ERR_NETWORK"
      ) {
        setError("Network error. Please check your connection.");
        toast.error("Network error. Please try again.");
      } else {
        const errorMessage =
          error.response?.data?.message ||
          "Failed to verify password. Please try again.";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setMasterPassword("");
      setShowPassword(false);
      setError("");
      onClose();
    }
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setMasterPassword(newPassword);
    setError(""); // Clear error when user types
  };

  const handleLogout = () => {
    // Prevent logging out while verifying
    if (isLoading) return;
    logout();
    toast.success("Logged out successfully");
    onClose();
    navigate("/login");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 px-4 sm:px-6 py-6 sm:py-8 text-center">
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Lock className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            Unlock Your Vault
          </h2>
          <p className="text-white/80 text-xs sm:text-sm px-2">
            Enter your master password to access your encrypted passwords
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white/80 hover:text-white transition-colors"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 space-y-4 sm:space-y-6"
        >
          {/* Security Notice */}
          <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-primary-800 dark:text-primary-200">
              <p className="font-semibold mb-1">Secure Verification</p>
              <p className="text-primary-700 dark:text-primary-300">
                Your master password will be verified with the server to ensure
                it's correct before unlocking your vault.
              </p>
            </div>
          </div>

          {/* Master Password Field */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Master Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={masterPassword}
                onChange={handlePasswordChange}
                placeholder="Enter your master password"
                className={`w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-3 text-sm sm:text-base bg-slate-50 dark:bg-slate-900 border-2 ${
                  error
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-slate-200 dark:border-slate-700 focus:ring-primary-500 focus:border-primary-500"
                } rounded-xl focus:ring-2 transition-all text-slate-800 dark:text-white placeholder:text-slate-400 outline-none`}
                autoFocus
                autoComplete="current-password"
                disabled={isLoading}
                maxLength={128}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                disabled={isLoading}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-400" />
                ) : (
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-400" />
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-2 flex items-start gap-2 text-xs sm:text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2.5 sm:p-3">
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Password Requirements */}
            {!error &&
              masterPassword.length > 0 &&
              masterPassword.length < 8 && (
                <div className="mt-2 flex items-start gap-2 text-xs sm:text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5 sm:p-3">
                  <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
                  <span>Password must be at least 8 characters</span>
                </div>
              )}
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="w-full sm:flex-1 px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isLoading || !masterPassword.trim() || masterPassword.length < 8
              }
              className="w-full sm:flex-1 px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 order-1 sm:order-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Verifying...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                  Unlock Vault
                </>
              )}
            </button>
          </div>

          {/* Help Text */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-center text-slate-500 dark:text-slate-400">
              Forgot your master password? re-login to{" "}
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoading}
                className="text-blue-500 hover:underline disabled:opacity-50"
              >
                try
              </button>{" "}
              unlocking again.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UnlockVaultModal;
