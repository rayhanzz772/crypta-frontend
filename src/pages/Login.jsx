import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Shield, ArrowRight, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { consumeAuthRedirectMessage } from "../utils/api";

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate("/app", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    const message = consumeAuthRedirectMessage();

    if (message) {
      toast.error(message);
    }
  }, []);

  const [formData, setFormData] = useState({
    email: "",
    master_password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDerivingKeys, setIsDerivingKeys] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.master_password) {
      newErrors.master_password = "Master password is required";
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
      toast.error("Please fill in all fields correctly");
      return;
    }

    setIsLoading(true);
    setIsDerivingKeys(true);

    const result = await login(formData.email, formData.master_password);

    setIsDerivingKeys(false);

    if (result.success) {
      if (result.needsMigration) {
        // Legacy account — redirect to the migration wizard page.
        toast.success("Welcome back! Please complete your account upgrade.");
        setTimeout(() => navigate("/app"), 100);
      } else {
        toast.success("Welcome back!");
        setTimeout(() => navigate("/app"), 100);
      }
    } else {
      toast.error(result.error);
    }

    setIsLoading(false);
  };

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
    <div className="min-h-screen flex items-center justify-center absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] px-4 py-6 sm:py-12">
      {/* Card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-lg p-6 sm:p-8 md:p-12 border border-gray-200 dark:border-gray-700 w-full max-w-[440px]">
        <div className="relative w-full">
          {/* Back to Home - Top of Card */}
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
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
              Welcome Back
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Sign in to access your vault
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
                  autoComplete="email"
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
                htmlFor="master_password"
                className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2"
              >
                Master Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="master_password"
                  name="master_password"
                  value={formData.master_password}
                  onChange={handleChange}
                  className={`w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border ${
                    errors.master_password
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-600 focus:ring-primary-500"
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent transition-all outline-none`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
              {errors.master_password && (
                <p className="mt-1 text-xs sm:text-sm text-red-500">
                  {errors.master_password}
                </p>
              )}

              {/* Forgot Password Link */}
              <div className="flex justify-end mt-2">
                <Link
                  to="/recover-password"
                  className="text-xs sm:text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
                >
                  Forgot Master Password?
                </Link>
              </div>
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
                  {isDerivingKeys ? "Deriving keys…" : "Signing in..."}
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg sm:rounded-xl">
            <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 text-center">
              Your master password is never stored on our servers and only
              exists in your browser's memory during your session.
            </p>
          </div>

          {/* Register Link */}
          <p className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
