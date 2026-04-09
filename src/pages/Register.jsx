import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Shield, ArrowRight, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import PasswordWarningModal from "../components/PasswordWarningModal";
import RecoveryKeyModal from "../components/RecoveryKeyModal";

const Register = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated, isLoading: authLoading } = useAuth();

  const [isRegistered, setIsRegistered] = useState(false);

  // Redirect if already authenticated and not purely from just-completed registration
  useEffect(() => {
    if (isAuthenticated && !authLoading && !isRegistered) {
      navigate("/app", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, isRegistered]);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirm_password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [pendingRegistration, setPendingRegistration] = useState(null);

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Master password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        "Password must contain uppercase, lowercase, and number";
    }

    // Confirm password validation
    if (!formData.confirm_password) {
      newErrors.confirm_password = "Please confirm your password";
    } else if (formData.password !== formData.confirm_password) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    // Show warning modal before registration
    setPendingRegistration({
      email: formData.email,
      password: formData.password,
    });
    setShowWarningModal(true);
  };

  const handleConfirmRegistration = async () => {
    if (!pendingRegistration) return;

    const email = pendingRegistration.email;

    setIsLoading(true);
    setShowWarningModal(false);

    const result = await register(
      pendingRegistration.email,
      pendingRegistration.password,
    );

    if (result.success) {
      setIsRegistered(true);
      setRegisteredEmail(email);
      toast.success("Account created. Check your email for the 6-digit code.");

      // Extract recovery key from various possible response structures
      const key = result.data?.data?.recovery_key || result.data?.recovery_key;

      if (key) {
        setRecoveryKey(key);
        setShowRecoveryModal(true);
      } else {
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
      }
    } else {
      toast.error(result.error);
    }

    setIsLoading(false);
    setPendingRegistration(null);
  };

  const handleCancelRegistration = () => {
    setShowWarningModal(false);
    setPendingRegistration(null);
  };

  const handleCloseRecoveryModal = () => {
    setShowRecoveryModal(false);
    navigate(`/verify-email?email=${encodeURIComponent(registeredEmail)}`);
  };

  // Show loading while checking auth status
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Warning Modal */}
      <PasswordWarningModal
        isOpen={showWarningModal}
        onClose={handleCancelRegistration}
        onConfirm={handleConfirmRegistration}
      />

      {/* Recovery Key Modal */}
      <RecoveryKeyModal
        isOpen={showRecoveryModal}
        recoveryKey={recoveryKey}
        onClose={handleCloseRecoveryModal}
      />

      <div className="min-h-screen flex items-center justify-center absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] px-4 py-6 sm:py-12">
        {/* Card */}
        <div className="w-full max-w-[440px] sm:max-w-[480px]">
          {/* Card */}
          <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-xl shadow-lg sm:shadow-lg p-6 sm:p-8 md:p-10 border border-gray-200 dark:border-gray-700">
            <div className="mb-4 sm:mb-6">
              <Link
                to="/"
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
                Back to Home
              </Link>
            </div>
            {/* Logo & Title */}
            <div className="text-center mb-5 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                Create Account
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Start securing your passwords today
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    type="email"
                    id="email"
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

              {/* Master Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2"
                >
                  Master Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border ${
                      errors.password
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 dark:border-gray-600 focus:ring-primary-500"
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent transition-all outline-none`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs sm:text-sm text-red-500">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label
                  htmlFor="confirm_password"
                  className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirm_password"
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    className={`w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border ${
                      errors.confirm_password
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 dark:border-gray-600 focus:ring-primary-500"
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent transition-all outline-none`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>
                </div>
                {errors.confirm_password && (
                  <p className="mt-1 text-xs sm:text-sm text-red-500">
                    {errors.confirm_password}
                  </p>
                )}
              </div>

              {/* Password Requirements */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <p className="text-[10px] sm:text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                  Password must contain:
                </p>
                <ul className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 space-y-0.5 sm:space-y-1">
                  <li className="flex items-center gap-1.5 sm:gap-2">
                    <span
                      className={
                        formData.password.length >= 8 ? "text-green-500" : ""
                      }
                    >
                      {formData.password.length >= 8 ? "✓" : "•"}
                    </span>
                    At least 8 characters
                  </li>
                  <li className="flex items-center gap-1.5 sm:gap-2">
                    <span
                      className={
                        /[A-Z]/.test(formData.password) ? "text-green-500" : ""
                      }
                    >
                      {/[A-Z]/.test(formData.password) ? "✓" : "•"}
                    </span>
                    One uppercase letter
                  </li>
                  <li className="flex items-center gap-1.5 sm:gap-2">
                    <span
                      className={
                        /[a-z]/.test(formData.password) ? "text-green-500" : ""
                      }
                    >
                      {/[a-z]/.test(formData.password) ? "✓" : "•"}
                    </span>
                    One lowercase letter
                  </li>
                  <li className="flex items-center gap-1.5 sm:gap-2">
                    <span
                      className={
                        /\d/.test(formData.password) ? "text-green-500" : ""
                      }
                    >
                      {/\d/.test(formData.password) ? "✓" : "•"}
                    </span>
                    One number
                  </li>
                </ul>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 sm:py-3 px-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm sm:text-base rounded-lg sm:rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Login Link */}
            <p className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
