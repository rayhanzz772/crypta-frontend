import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Eye,
  EyeOff,
  Copy,
  Lock,
  Unlock,
  Clock,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { vaultAPI } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import { getCategoryIcon, getCategoryGradient } from "../utils/categoryIcons";

const DecryptModal = ({ isOpen, onClose, vaultItem }) => {
  const { mek } = useAuth();

  const [decryptedPassword, setDecryptedPassword] = useState("");
  const [decryptedVaultItem, setDecryptedVaultItem] = useState(null);
  const [hasDecryptedOnce, setHasDecryptedOnce] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [inputMasterPassword, setInputMasterPassword] = useState("");
  const [showMasterPasswordInput, setShowMasterPasswordInput] = useState(false);

  const countdownRef = useRef(null);
  const clearTimerRef = useRef(null);

  const vaultItemId = vaultItem?.id;

  const handleDecrypt = useCallback(
    async (password) => {
      if (!vaultItemId) return;

      setIsLoading(true);

      try {
        const result = await vaultAPI.decrypt(vaultItemId, password);

        const resolvedVaultItem =
          result?.data?.data || result?.data || result?.vault || null;
        if (resolvedVaultItem) {
          setDecryptedVaultItem(resolvedVaultItem);
        }

        const decrypted =
          result?.decrypted_password ??
          result?.password ??
          result?.data?.decrypted_password ??
          result?.data?.password ??
          result?.data?.data?.decrypted_password ??
          result?.data?.data?.password ??
          resolvedVaultItem?.decrypted_password ??
          resolvedVaultItem?.password ??
          null;

        if (!decrypted) {
          toast.error("Failed to extract decrypted password from response");
          return;
        }

        setDecryptedPassword(decrypted);
        setHasDecryptedOnce(true);
        toast.success("Password decrypted!");
      } catch (error) {
        if (error.response?.status === 429) {
          const retryAfter = error.response?.data?.retry_after || 60;
          setIsRateLimited(true);
          setCountdown(retryAfter);
          toast.error(`Too many requests. Please wait ${retryAfter} seconds.`);
        } else {
          const errorMsg =
            error.response?.data?.message || "Failed to decrypt password";
          toast.error(errorMsg);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [vaultItemId],
  );

  // Check if master password is available
  useEffect(() => {
    if (isOpen && !mek) {
      setShowMasterPasswordInput(true);
    } else {
      setShowMasterPasswordInput(false);
      setInputMasterPassword("");
    }
  }, [isOpen, mek]);

  // Auto-decrypt on open if mek is available
  useEffect(() => {
    if (isOpen && vaultItem && vaultItemId && mek) {
      handleDecrypt(mek);
    }
  }, [isOpen, vaultItem, vaultItemId, mek, handleDecrypt]);

  // Auto-clear after 30 seconds
  useEffect(() => {
    if (decryptedPassword && !clearTimerRef.current) {
      setTimeRemaining(30);
      clearTimerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleClearPassword();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (clearTimerRef.current) {
        clearInterval(clearTimerRef.current);
        clearTimerRef.current = null;
      }
    };
  }, [decryptedPassword]);

  // Rate limit countdown
  useEffect(() => {
    if (isRateLimited && countdown > 0) {
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setIsRateLimited(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [isRateLimited, countdown]);

  const handleSubmitMasterPassword = (e) => {
    e.preventDefault();
    if (inputMasterPassword) {
      handleDecrypt(inputMasterPassword);
      setShowMasterPasswordInput(false);
    }
  };

  const handleCopy = () => {
    if (decryptedPassword) {
      navigator.clipboard.writeText(decryptedPassword);
      toast.success("Password copied to clipboard!");
    }
  };

  const handleClearPassword = () => {
    setDecryptedPassword("");
    setDecryptedVaultItem(null);
    setTimeRemaining(30);
    setShowPassword(false);
    if (clearTimerRef.current) {
      clearInterval(clearTimerRef.current);
      clearTimerRef.current = null;
    }
  };

  const handleClose = () => {
    handleClearPassword();
    setShowPassword(false);
    setHasDecryptedOnce(false);
    setIsRateLimited(false);
    setCountdown(0);
    setInputMasterPassword("");
    setShowMasterPasswordInput(false);
    onClose();
  };

  // Get category icon and gradient
  const resolvedCategory =
    decryptedVaultItem?.category ||
    decryptedVaultItem?.category_name ||
    vaultItem?.category ||
    vaultItem?.category_name;
  const CategoryIcon = getCategoryIcon(resolvedCategory);
  const categoryGradient = getCategoryGradient(resolvedCategory);

  const isDecryptedLayout = Boolean(decryptedPassword) || hasDecryptedOnce;
  const isSensitiveBlurred = !decryptedPassword;

  if (!isOpen || !vaultItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg my-4 sm:my-8">
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-700 p-4 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className={`w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br ${categoryGradient} rounded-xl flex items-center justify-center`}
            >
              {isDecryptedLayout ? (
                decryptedPassword ? (
                  <Unlock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                ) : (
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                )
              ) : (
                <CategoryIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white truncate max-w-[200px] sm:max-w-none">
                {vaultItem.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                {isDecryptedLayout ? "Password Decrypted" : "Decrypt Password"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 max-h-[calc(100vh-8rem)] sm:max-h-[calc(100vh-12rem)] overflow-y-auto">
          {/* Username/Email */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Username / Email
            </label>
            <div className="relative overflow-hidden px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
              <input
                type="text"
                value={decryptedVaultItem?.username || vaultItem.username || "Username"}
                readOnly
                tabIndex={isSensitiveBlurred ? -1 : 0}
                className="w-full bg-transparent text-sm sm:text-base text-slate-900 dark:text-white truncate focus:outline-none"
              />
              {isSensitiveBlurred && (
                <div className="absolute inset-0 bg-slate-50/60 dark:bg-slate-900/60 backdrop-blur-sm pointer-events-auto cursor-not-allowed" />
              )}
            </div>
          </div>

          {/* Master Password Input (if not in memory) */}
          {showMasterPasswordInput && !decryptedPassword && !hasDecryptedOnce && (
            <form
              onSubmit={handleSubmitMasterPassword}
              className="space-y-3 sm:space-y-4"
            >
              <div className="p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl flex items-start gap-2 sm:gap-3">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-300">
                  Master password is not in memory. Please re-enter it to
                  decrypt.
                </p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Master Password
                </label>
                <input
                  type="password"
                  value={inputMasterPassword}
                  onChange={(e) => setInputMasterPassword(e.target.value)}
                  placeholder="Enter your master password"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={!inputMasterPassword || isLoading}
                className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Decrypting..." : "Decrypt Password"}
              </button>
            </form>
          )}

          {/* Password Field (always visible) */}
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword && decryptedPassword ? "text" : "password"}
                  value={decryptedPassword || "••••••••"}
                  readOnly
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-20 sm:pr-24 text-sm sm:text-base rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none"
                />
                <div className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 sm:gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={!decryptedPassword}
                    className="p-1.5 sm:p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
                    ) : (
                      <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    disabled={!decryptedPassword}
                    className="p-1.5 sm:p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
                  </button>
                </div>

                {isSensitiveBlurred && (
                  <div className="absolute inset-0 bg-slate-50/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-xl pointer-events-none" />
                )}
              </div>
            </div>

            {/* Auto-clear Timer (only after decrypt at least once) */}
            {isDecryptedLayout && (
              <div className="flex items-center justify-between p-2.5 sm:p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs sm:text-sm text-blue-800 dark:text-blue-300">
                    {decryptedPassword
                      ? `Auto-clear in ${timeRemaining}s`
                      : "Password cleared"}
                  </span>
                </div>
                {decryptedPassword ? (
                  <button
                    onClick={handleClearPassword}
                    className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                  >
                    Clear Now
                  </button>
                ) : (
                  <span className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium">
                    Cleared
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Rate Limit Warning */}
          {isRateLimited && (
            <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2 sm:gap-3">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-sm sm:text-base text-red-800 dark:text-red-300 mb-1">
                  Too Many Requests
                </h4>
                <p className="text-xs sm:text-sm text-red-700 dark:text-red-400">
                  Please wait {countdown} seconds before trying again.
                </p>
              </div>
            </div>
          )}

          {/* Note */}
          {vaultItem.note && (
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Note
              </label>
              <div className="relative">
                <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 max-h-40 sm:max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
                    {vaultItem.note}
                  </p>
                </div>
                {/* Scroll indicator - shows if content is scrollable */}
                {vaultItem.note.length > 200 && (
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-50 dark:from-slate-900 to-transparent rounded-b-xl pointer-events-none"></div>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-3 sm:pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div>
                <p className="text-slate-500 dark:text-slate-400">Category</p>
                <p className="font-medium text-slate-800 dark:text-white mt-0.5">
                  {(
                    decryptedVaultItem?.category_name ||
                    decryptedVaultItem?.category ||
                    vaultItem.category_name ||
                    vaultItem.category ||
                    "Uncategorized"
                  )}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">
                  Last Updated
                </p>
                <p className="font-medium text-slate-800 dark:text-white mt-0.5 truncate">
                  {decryptedVaultItem?.updated_at || vaultItem.updated_at || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DecryptModal;
