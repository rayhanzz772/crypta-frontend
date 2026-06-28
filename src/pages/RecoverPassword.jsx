import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  ShieldCheck,
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

const STEP_LABELS = ["Email", "Verify", "Reset"];

const RecoverPassword = () => {
  const navigate = useNavigate();

  // step 1 → email, step 2 → recovery key + OTP, step 3 → new password
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const [recoveryKey, setRecoveryKey] = useState("");
  const [recoveryKeyError, setRecoveryKeyError] = useState("");

  // 6-digit OTP input — one box per digit
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const otpRefs = useRef([]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Sensitive data held only in memory, never persisted
  const [mekData, setMekData] = useState(null);       // encrypted MEK blobs from server
  const [unwrappedMek, setUnwrappedMek] = useState(null); // raw MEK after client-side unwrap
  const [otpToken, setOtpToken] = useState(null);     // short-lived JWT from step 2

  // -----------------------------------------------------------------------
  // Step 1 — fetch encrypted MEK from server (triggers OTP email send)
  // -----------------------------------------------------------------------
  const handleStep1 = async (e) => {
    e.preventDefault();
    setEmailError("");

    if (!email) {
      setEmailError("Email is required");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Email is invalid");
      return;
    }

    setIsLoading(true);
    try {
      const result = await authAPI.verifyRecovery(email);

      if (!result.success) {
        toast.error(result.message || "Recovery is not available for this account");
        return;
      }

      const { encrypted_mek_by_recovery, mek_rc_iv, mek_rc_tag } = result.data ?? {};

      if (!encrypted_mek_by_recovery) {
        toast.error("Server did not return encrypted recovery data.");
        return;
      }

      setMekData({ encrypted_mek_by_recovery, mek_rc_iv, mek_rc_tag });
      setStep(2);
      toast("A 6-digit OTP has been sent to your inbox.", { icon: "📬", duration: 4000 });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Verification failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // -----------------------------------------------------------------------
  // Step 2 — client-side MEK decrypt + verify OTP with server
  // -----------------------------------------------------------------------
  const handleStep2 = async (e) => {
    e.preventDefault();
    setRecoveryKeyError("");
    setOtpError("");

    let valid = true;
    if (!recoveryKey.trim()) {
      setRecoveryKeyError("Recovery key is required");
      valid = false;
    }
    const otpValue = otp.join("");
    if (otpValue.length < 6) {
      setOtpError("Please enter the complete 6-digit code");
      valid = false;
    }
    if (!valid) return;

    setIsLoading(true);
    try {
      // 1. Decrypt MEK client-side — recovery key never leaves the browser
      const recoveryKeyHex = recoveryKey.trim().replace(/-/g, "");
      let mek;
      try {
        mek = await unwrapMEK(
          mekData.encrypted_mek_by_recovery,
          mekData.mek_rc_iv,
          mekData.mek_rc_tag,
          recoveryKeyHex
        );
      } catch {
        toast.error("Invalid recovery key. Please check that you entered it correctly.");
        setRecoveryKeyError("Recovery key is incorrect");
        return;
      }

      // 2. Verify OTP with server — get back a short-lived otp_token
      const result = await authAPI.verifyRecoveryOtp(email, otpValue);

      if (!result.success) {
        toast.error(result.message || "OTP verification failed");
        setOtpError(result.message || "Invalid or expired OTP");
        return;
      }

      setUnwrappedMek(mek);
      setOtpToken(result.data?.otp_token);
      setStep(3);
      toast.success("Verified! Please set your new master password.");
    } catch (error) {
      const msg = error.response?.data?.message || "Verification failed. Please try again.";
      toast.error(msg);
      if (error.response?.status === 400) {
        setOtpError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // -----------------------------------------------------------------------
  // Step 3 — re-wrap MEK with new KEK + submit reset
  // -----------------------------------------------------------------------
  const handleStep3 = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setConfirmPasswordError("");

    let valid = true;
    if (!newPassword) {
      setPasswordError("New master password is required");
      valid = false;
    } else if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      valid = false;
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      setPasswordError("Password must contain uppercase, lowercase, and number");
      valid = false;
    }
    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password");
      valid = false;
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      valid = false;
    }
    if (!valid) return;

    if (!unwrappedMek || !otpToken) {
      toast.error("Session data missing. Please restart the recovery process.");
      setStep(1);
      return;
    }

    setIsLoading(true);
    try {
      const newKekSalt = generateRandomHex(16);
      const newMasterHash = await sha256Hex(newPassword);
      const newKek = await deriveKEK(newPassword, newKekSalt);
      const pwWrap = await wrapMEK(unwrappedMek, newKek);

      const result = await authAPI.resetPassword({
        email,
        otp_token: otpToken,
        new_master_hash: newMasterHash,
        new_kek_salt: newKekSalt,
        encrypted_mek_by_password: pwWrap.encryptedMek,
        mek_pw_iv: pwWrap.iv,
        mek_pw_tag: pwWrap.tag,
      });

      if (result.success) {
        // Clear sensitive in-memory data
        setUnwrappedMek(null);
        setOtpToken(null);
        setIsSuccess(true);
        toast.success("Password reset successfully!");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        toast.error(result.message || "Failed to reset password");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || "Reset failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // -----------------------------------------------------------------------
  // OTP box helpers
  // -----------------------------------------------------------------------
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // digits only
    const next = [...otp];
    next[index] = value.slice(-1); // keep last char
    setOtp(next);
    setOtpError("");
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    const next = [...otp];
    text.split("").forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    otpRefs.current[Math.min(text.length, 5)]?.focus();
  };

  // -----------------------------------------------------------------------
  // Step config
  // -----------------------------------------------------------------------
  const stepConfig = {
    1: {
      title: "Recover Password",
      subtitle: "Enter your email to begin account recovery",
      onSubmit: handleStep1,
      submitLabel: "Send Recovery Code",
      loadingLabel: "Sending…",
    },
    2: {
      title: "Verify Identity",
      subtitle: "Enter your recovery key and the OTP sent to your email",
      onSubmit: handleStep2,
      submitLabel: "Verify & Continue",
      loadingLabel: "Verifying…",
    },
    3: {
      title: "Reset Password",
      subtitle: "Choose a new strong master password",
      onSubmit: handleStep3,
      submitLabel: "Reset Password",
      loadingLabel: "Resetting…",
    },
  };

  const current = stepConfig[step];

  // -----------------------------------------------------------------------
  // Shared input classes
  // -----------------------------------------------------------------------
  const inputBase =
    "w-full py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent transition-all outline-none";
  const inputError = "border-red-500 focus:ring-red-500";
  const inputNormal = "border-gray-300 dark:border-gray-600 focus:ring-primary-500";

  return (
    <div className="min-h-screen flex items-center justify-center absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] px-4 py-6 sm:py-12">
      <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 md:p-10 border border-gray-200 dark:border-gray-700 w-full max-w-[440px]">

        {/* Back link */}
        <div className="mb-4 sm:mb-5">
          <Link
            to={step === 1 ? "/login" : "#"}
            onClick={step > 1 ? () => setStep(step - 1) : undefined}
            className="inline-flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
          >
            <svg
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {step === 1 ? "Back to Login" : "Back"}
          </Link>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 mb-6 sm:mb-8">
          {STEP_LABELS.map((label, i) => {
            const num = i + 1;
            const active = num === step;
            const done = num < step;
            return (
              <div key={num} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      done
                        ? "bg-green-500 text-white"
                        : active
                        ? "bg-blue-500 text-white ring-4 ring-blue-200 dark:ring-blue-900"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600"
                    }`}
                  >
                    {done ? (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : num}
                  </div>
                  <span className={`text-[10px] font-medium ${active ? "text-blue-500" : "text-gray-400 dark:text-gray-600"}`}>
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div className={`h-0.5 w-12 mx-1 mb-4 rounded transition-all duration-300 ${done ? "bg-green-400" : "bg-gray-200 dark:bg-gray-700"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Title */}
        <div className="text-center mb-5 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
            {current.title}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {current.subtitle}
          </p>
        </div>

        {!isSuccess ? (
          <form onSubmit={current.onSubmit} className="space-y-4 sm:space-y-5">

            {/* ---- STEP 1: Email ---- */}
            {step === 1 && (
              <>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                      className={`${inputBase} pl-9 sm:pl-10 pr-4 ${emailError ? inputError : inputNormal}`}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </div>
                  {emailError && <p className="mt-1 text-xs sm:text-sm text-red-500">{emailError}</p>}
                </div>

                {/* Info box */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                  <div className="flex gap-3">
                    <KeyRound className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                        What happens next?
                      </h4>
                      <p className="text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed">
                        We'll send a 6-digit OTP to your email. You'll also need your
                        64-character Recovery Key to complete the process. The server
                        never receives your recovery key.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ---- STEP 2: Recovery Key + OTP ---- */}
            {step === 2 && (
              <>
                {/* Recovery Key */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    Recovery Key
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <input
                      type="text"
                      value={recoveryKey}
                      onChange={(e) => { setRecoveryKey(e.target.value); setRecoveryKeyError(""); }}
                      className={`${inputBase} pl-9 sm:pl-10 pr-4 font-mono text-[13px] ${recoveryKeyError ? inputError : inputNormal}`}
                      placeholder="Paste your 64-character recovery key"
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>
                  {recoveryKeyError && <p className="mt-1 text-xs sm:text-sm text-red-500">{recoveryKeyError}</p>}
                </div>

                {/* OTP boxes */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    6-Digit OTP <span className="font-normal text-gray-500">(sent to {email})</span>
                  </label>
                  <div className="flex gap-2 justify-between" onPaste={handleOtpPaste}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => (otpRefs.current[i] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className={`w-full aspect-square text-center text-lg font-bold rounded-xl border-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none transition-all ${
                          digit
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : otpError
                            ? "border-red-400 focus:border-red-500"
                            : "border-gray-300 dark:border-gray-600 focus:border-blue-500"
                        }`}
                      />
                    ))}
                  </div>
                  {otpError && <p className="mt-1.5 text-xs sm:text-sm text-red-500">{otpError}</p>}
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Didn't receive a code?{" "}
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await authAPI.verifyRecovery(email);
                        toast("A new OTP has been sent to your inbox.", { icon: "📬" });
                      } catch {
                        toast.error("Failed to resend. Please try again.");
                      }
                    }}
                    className="text-blue-500 hover:text-blue-700 font-medium underline underline-offset-2"
                  >
                    Resend
                  </button>
                </p>
              </>
            )}

            {/* ---- STEP 3: New Password ---- */}
            {step === 3 && (
              <>
                {/* Verified banner */}
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 mb-1">
                  <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                    Identity verified — you can now reset your master password
                  </p>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    New Master Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setPasswordError(""); }}
                      className={`${inputBase} pl-9 sm:pl-10 pr-10 sm:pr-12 ${passwordError ? inputError : inputNormal}`}
                      placeholder="Min. 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordError && <p className="mt-1 text-xs sm:text-sm text-red-500">{passwordError}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setConfirmPasswordError(""); }}
                      className={`${inputBase} pl-9 sm:pl-10 pr-10 sm:pr-12 ${confirmPasswordError ? inputError : inputNormal}`}
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPasswordError && <p className="mt-1 text-xs sm:text-sm text-red-500">{confirmPasswordError}</p>}
                </div>

                {/* Password requirements */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 sm:p-4">
                  <p className="text-[10px] sm:text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Password must contain:
                  </p>
                  <ul className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                    {[
                      [newPassword.length >= 8, "At least 8 characters"],
                      [/[A-Z]/.test(newPassword), "One uppercase letter"],
                      [/[a-z]/.test(newPassword), "One lowercase letter"],
                      [/\d/.test(newPassword), "One number"],
                    ].map(([met, label]) => (
                      <li key={label} className="flex items-center gap-1.5">
                        <span className={met ? "text-green-500" : ""}>{met ? "✓" : "•"}</span>
                        {label}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* Submit button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 sm:py-3 px-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm sm:text-base rounded-lg sm:rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {current.loadingLabel}
                  </>
                ) : (
                  <>
                    {current.submitLabel}
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Success state */
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
  );
};

export default RecoverPassword;
