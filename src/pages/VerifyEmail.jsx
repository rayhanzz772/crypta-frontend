import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Mail,
  MailCheck,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { authAPI } from "../utils/api";

const CODE_LENGTH = 6;
const EMAIL_PATTERN = /\S+@\S+\.\S+/;

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inputRefs = useRef([]);

  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [codeDigits, setCodeDigits] = useState(Array(CODE_LENGTH).fill(""));
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const queryEmail = searchParams.get("email") || "";
    if (queryEmail) {
      setEmail(queryEmail);
    }
  }, [searchParams]);

  useEffect(() => {
    if (resendCooldown === 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setResendCooldown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const code = codeDigits.join("");

  const validateEmail = () => {
    if (!email) {
      return "Email is required";
    }

    if (!EMAIL_PATTERN.test(email)) {
      return "Email is invalid";
    }

    return "";
  };

  const validateCode = () => {
    if (code.length !== CODE_LENGTH || !/^\d{6}$/.test(code)) {
      return "Enter the 6-digit code from your email";
    }

    return "";
  };

  const updateDigitAtIndex = (index, value) => {
    setCodeDigits((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  };

  const fillDigits = (value, startIndex = 0) => {
    const digits = value.replace(/\D/g, "").slice(0, CODE_LENGTH - startIndex);

    if (!digits) {
      return;
    }

    setCodeDigits((current) => {
      const next = [...current];

      digits.split("").forEach((digit, offset) => {
        next[startIndex + offset] = digit;
      });

      return next;
    });

    const nextFocusIndex = Math.min(startIndex + digits.length, CODE_LENGTH - 1);
    inputRefs.current[nextFocusIndex]?.focus();
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
    if (errors.email) {
      setErrors((current) => ({ ...current, email: "" }));
    }
  };

  const handleDigitChange = (index, event) => {
    const sanitizedValue = event.target.value.replace(/\D/g, "");

    if (!sanitizedValue) {
      updateDigitAtIndex(index, "");
    } else if (sanitizedValue.length === 1) {
      updateDigitAtIndex(index, sanitizedValue);
      if (index < CODE_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    } else {
      fillDigits(sanitizedValue, index);
    }

    if (errors.code) {
      setErrors((current) => ({ ...current, code: "" }));
    }
  };

  const handleDigitKeyDown = (index, event) => {
    if (event.key === "Backspace" && !codeDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodePaste = (event) => {
    event.preventDefault();
    fillDigits(event.clipboardData.getData("text"));

    if (errors.code) {
      setErrors((current) => ({ ...current, code: "" }));
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();

    const nextErrors = {
      email: validateEmail(),
      code: validateCode(),
    };

    setErrors(nextErrors);

    if (nextErrors.email || nextErrors.code) {
      toast.error("Please enter a valid email and verification code");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await authAPI.verifyEmail(email.trim(), code);

      setIsVerified(true);
      toast.success(result?.message || "Email verified successfully.");

      window.setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Verification failed. Please check the code and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    const emailError = validateEmail();

    setErrors((current) => ({
      ...current,
      email: emailError,
    }));

    if (emailError) {
      toast.error("Enter the email address you registered with");
      return;
    }

    setIsResending(true);

    try {
      const result = await authAPI.resendVerification(email.trim());

      setResendCooldown(60);
      toast.success(result?.message || "A new verification code has been sent.");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to resend the code right now. Please try again.",
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] px-4 py-6 sm:py-12">
      <div className="w-full max-w-[520px] rounded-3xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900 sm:p-8 md:p-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white sm:text-sm"
          >
            <svg
              className="h-4 w-4"
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
            Back to Login
          </Link>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            {isVerified ? "Email Confirmed" : "Verify Your Email"}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 sm:text-base">
            {isVerified
              ? "Your email has been verified. Redirecting you to sign in..."
              : "Enter the 6-digit code from your inbox to activate your account."}
          </p>
        </div>

        {!isVerified && (
          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300 sm:text-sm"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 sm:h-5 sm:w-5" />
                <input
                  id="email"
                  type="email"
                  disabled
                  value={email}
                  onChange={handleEmailChange}
                  className={`w-full rounded-xl border bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition-all focus:border-transparent focus:ring-2 dark:bg-gray-700 dark:text-white sm:text-base ${
                    errors.email
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-primary-500 dark:border-gray-600"
                  } disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:border-gray-700 dark:disabled:bg-gray-800 dark:disabled:text-gray-400`}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-500 sm:text-sm">{errors.email}</p>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 sm:text-sm">
                  Verification Code
                </label>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 sm:text-xs">
                  Paste works too
                </span>
              </div>

              <div className="grid grid-cols-6 gap-2 sm:gap-3" onPaste={handleCodePaste}>
                {codeDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      inputRefs.current[index] = element;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={CODE_LENGTH}
                    value={digit}
                    onChange={(event) => handleDigitChange(index, event)}
                    onKeyDown={(event) => handleDigitKeyDown(index, event)}
                    className={`h-12 rounded-xl border bg-white text-center text-lg font-semibold tracking-[0.2em] text-gray-900 outline-none transition-all focus:border-transparent focus:ring-2 dark:bg-gray-700 dark:text-white sm:h-14 sm:text-xl ${
                      errors.code
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-primary-500 dark:border-gray-600"
                    }`}
                    aria-label={`Verification digit ${index + 1}`}
                  />
                ))}
              </div>
              {errors.code && (
                <p className="mt-1 text-xs text-red-500 sm:text-sm">{errors.code}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-shadow duration-200 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin sm:h-5 sm:w-5"></div>
                  Verifying...
                </>
              ) : (
                <>
                  Verify Email
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/70">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Didn&apos;t receive the code?
          </p>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
            Check your spam folder first, then request a fresh code if needed.
          </p>

          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || resendCooldown > 0 || isVerified}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <RefreshCw className={`h-4 w-4 ${isResending ? "animate-spin" : ""}`} />
            {isResending
              ? "Sending..."
              : resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : "Resend Code"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;