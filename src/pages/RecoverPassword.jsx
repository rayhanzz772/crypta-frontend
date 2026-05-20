import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { authAPI } from "../utils/api";
import {
  sha256Hex,
  deriveKEK,
  generateRandomHex,
  wrapMEK,
  unwrapMEK,
} from "../utils/crypto";

const RecoverPassword = () => {
  const navigate = useNavigate();

  // step 1: enter email + recovery key → client-side MEK unwrap
  // step 2: enter new password → re-wrap + submit
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    email: "",
    recovery_key: "",
    new_password: "",
    confirm_password: "",
  });

  // The MEK unwrapped in step 1 — kept in local state only, never persisted.
  const [unwrappedMek, setUnwrappedMek] = useState(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.recovery_key.trim()) {
      newErrors.recovery_key = "Recovery key is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.new_password) {
      newErrors.new_password = "New master password is required";
    } else if (formData.new_password.length < 8) {
      newErrors.new_password = "Password must be at least 8 characters";
    }
    if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // -------------------------------------------------------------------------
  // Step 1: Fetch the recovery-encrypted MEK from server, then unwrap locally.
  // -------------------------------------------------------------------------

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!validateStep1()) return;

    setIsLoading(true);
    try {
      // Fetch the encrypted MEK blob — server only requires email.
      const result = await authAPI.verifyRecovery(formData.email);

      if (!result.success) {
        toast.error(result.message || "Recovery is not available for this account");
        return;
      }

      const { encrypted_mek_by_recovery, mek_rc_iv, mek_rc_tag } =
        result.data ?? {};

      if (!encrypted_mek_by_recovery) {
        toast.error("Server did not return encrypted recovery data.");
        return;
      }

      // Unwrap the MEK using the recovery key entered by the user.
      // This is done entirely client-side — the recovery key is never sent to the server.
      const recoveryKeyHex = formData.recovery_key.trim().replace(/-/g, "");

      let mek;
      try {
        mek = await unwrapMEK(
          encrypted_mek_by_recovery,
          mek_rc_iv,
          mek_rc_tag,
          recoveryKeyHex,
        );
      } catch {
        toast.error(
          "Invalid recovery key. Please check that you have entered it correctly.",
        );
        return;
      }

      setUnwrappedMek(mek);
      setStep(2);
      toast.success("Recovery key verified! Please set your new master password.");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Verification failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Step 2: Re-wrap MEK with the new KEK and submit to server.
  // -------------------------------------------------------------------------

  const handleReset = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;
    if (!unwrappedMek) {
      toast.error("MEK is missing. Please restart the recovery process.");
      setStep(1);
      return;
    }

    setIsLoading(true);
    try {
      const newPassword = formData.new_password;

      // Generate new KEK material
      const newKekSalt = generateRandomHex(16);
      const newMasterHash = await sha256Hex(newPassword);
      const newKek = await deriveKEK(newPassword, newKekSalt);

      // Re-wrap the original MEK with the new KEK
      const pwWrap = await wrapMEK(unwrappedMek, newKek);

      // Submit to server
      const result = await authAPI.resetPassword({
        email: formData.email,
        new_master_hash: newMasterHash,
        new_kek_salt: newKekSalt,
        encrypted_mek_by_password: pwWrap.encryptedMek,
        mek_pw_iv: pwWrap.iv,
        mek_pw_tag: pwWrap.tag,
      });

      if (result.success) {
        setIsSuccess(true);
        // Clear the in-memory MEK now that it's been saved server-side.
        setUnwrappedMek(null);
        toast.success("Password reset successfully!");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        toast.error(result.message || "Failed to reset password");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Reset failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] px-4 py-6 sm:py-12">
      <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-lg p-6 sm:p-8 md:p-12 border border-gray-200 dark:border-gray-700 w-full max-w-[440px]">
        <div className="relative w-full">
          {/* Back Link */}
          <div className="mb-4 sm:mb-6">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
            >
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              {step === 1 ? "Back to Login" : "Cancel Reset"}
            </Link>
          </div>

          {/* Title */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
              {step === 1 ? "Recover Password" : "Reset Password"}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {step === 1
                ? "Verify your identity with your recovery key"
                : "Choose a new strong master password"}
            </p>
          </div>

          {!isSuccess ? (
            <form
              onSubmit={step === 1 ? handleVerify : handleReset}
              className="space-y-4 sm:space-y-5"
            >
              {step === 1 ? (
                <>
                  {/* Email Field */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border ${
                          errors.email
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 dark:border-gray-600 focus:ring-primary-500"
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent transition-all outline-none`}
                        placeholder="you@example.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-xs sm:text-sm text-red-500">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Recovery Key Field */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      Recovery Key
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      <input
                        type="text"
                        name="recovery_key"
                        value={formData.recovery_key}
                        onChange={handleChange}
                        className={`w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border ${
                          errors.recovery_key
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 dark:border-gray-600 focus:ring-primary-500"
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent transition-all outline-none font-mono text-[13px]`}
                        placeholder="Paste your 64-character recovery key"
                        autoComplete="off"
                      />
                    </div>
                    {errors.recovery_key && (
                      <p className="mt-1 text-xs sm:text-sm text-red-500">
                        {errors.recovery_key}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* New Password Field */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      New Master Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="new_password"
                        value={formData.new_password}
                        onChange={handleChange}
                        className={`w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border ${
                          errors.new_password
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 dark:border-gray-600 focus:ring-primary-500"
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent transition-all outline-none`}
                        placeholder="Min. 8 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {errors.new_password && (
                      <p className="mt-1 text-xs sm:text-sm text-red-500">
                        {errors.new_password}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      Confirm Master Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirm_password"
                        value={formData.confirm_password}
                        onChange={handleChange}
                        className={`w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border ${
                          errors.confirm_password
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 dark:border-gray-600 focus:ring-primary-500"
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent transition-all outline-none`}
                        placeholder="Confirm password"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {errors.confirm_password && (
                      <p className="mt-1 text-xs sm:text-sm text-red-500">
                        {errors.confirm_password}
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 sm:py-3 px-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm sm:text-base rounded-lg sm:rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {step === 1 ? "Verifying…" : "Resetting…"}
                    </>
                  ) : (
                    <>
                      {step === 1 ? "Verify Recovery Key" : "Reset Password"}
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </>
                  )}
                </button>

                {step === 1 && (
                  <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 transition-all">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        <KeyRound className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                          What is a Recovery Key?
                        </h4>
                        <p className="text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed">
                          A unique 64-character hex code generated when you
                          created your account. It is your only way to regain
                          access to your encrypted data if you forget your
                          master password. The server never sees this key.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </form>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Password Reset Successful
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your master password has been successfully reset.
              </p>
              <p className="text-sm text-gray-500">Redirecting to login…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecoverPassword;
