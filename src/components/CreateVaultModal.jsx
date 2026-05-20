import { useState, useEffect, useCallback } from "react";
import {
  X,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Shield,
  AlertCircle,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { vaultAPI, categoriesAPI } from "../utils/api";
import { encryptField } from "../utils/crypto";
import {
  generatePassword,
  calculatePasswordStrength,
} from "../utils/passwordGenerator";
import { getCategoryIcon, getCategoryGradient } from "../utils/categoryIcons";
import { checkPasswordPwned, formatBreachCount } from "../utils/pwnedCheck";

// Debounce utility function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const CreateVaultModal = ({ isOpen, onClose, onSuccess }) => {
  const { mek } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    note: "",
    category_id: "",
  });

  const [categories, setCategories] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [breachWarning, setBreachWarning] = useState(null);
  const [isCheckingBreach, setIsCheckingBreach] = useState(false);
  const [breachInfo, setBreachInfo] = useState(null);
  const [errors, setErrors] = useState({});

  // Password generator state
  const [showGenerator, setShowGenerator] = useState(false);
  const [generatorOptions, setGeneratorOptions] = useState({
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });

  // Fetch categories on mount
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const data = await categoriesAPI.getAll();

      let categoryList = [];

      if (Array.isArray(data)) categoryList = data;
      else if (Array.isArray(data?.categories)) categoryList = data.categories;
      else if (Array.isArray(data?.data)) categoryList = data.data;
      else if (Array.isArray(data?.data?.categories))
        categoryList = data.data.categories;

      const excluded = ["medical", "ideas", "other"];
      const filtered = categoryList.filter(
        (c) => !excluded.includes(c.name?.toLowerCase()),
      );

      if (filtered.length > 0) {
        setCategories(filtered);
      } else {
        setCategories([
          { id: 1, name: "Work" },
          { id: 2, name: "Personal" },
          { id: 3, name: "Finance" },
          { id: 4, name: "Social" },
          { id: 5, name: "Game" },
        ]);
      }
    } catch (error) {
      setCategories([
        { id: 1, name: "Work" },
        { id: 2, name: "Personal" },
        { id: 3, name: "Finance" },
        { id: 4, name: "Social" },
        { id: 5, name: "Game" },
      ]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setBreachWarning(null);

    // Check for breaches when password changes
    if (name === "password") {
      debouncedBreachCheck(value);
    }
  };

  // Debounced breach check to avoid too many API calls
  const debouncedBreachCheck = useCallback(
    debounce(async (password) => {
      if (!password || password.length < 4) {
        setBreachInfo(null);
        return;
      }

      setIsCheckingBreach(true);
      setBreachInfo(null);

      try {
        const result = await checkPasswordPwned(password);

        if (result.error) {
          // Silent fail - don't show error to user
        } else if (result.isPwned) {
          setBreachInfo({
            isPwned: true,
            count: result.count,
            severity: result.severity,
            message: `This password has been exposed ${formatBreachCount(
              result.count,
            )} in data breaches!`,
          });
        } else {
          setBreachInfo({
            isPwned: false,
            message: "Password not found in known breaches ✓",
          });
        }
      } catch (error) {
        // Silent fail - don't show error to user
      } finally {
        setIsCheckingBreach(false);
      }
    }, 800),
    [],
  );

  const handleGeneratePassword = () => {
    const newPassword = generatePassword(generatorOptions);
    setFormData((prev) => ({ ...prev, password: newPassword }));
    toast.success("Password generated!");

    debouncedBreachCheck(newPassword);
  };

  const handleCopyPassword = () => {
    if (formData.password) {
      navigator.clipboard.writeText(formData.password);
      toast.success("Password copied!");
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    }
    if (!formData.category_id) {
      newErrors.category_id = "Please select a category";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!mek) {
      toast.error("Vault is locked. Please unlock your vault first.");
      return;
    }

    setIsLoading(true);
    setBreachWarning(null);

    try {
      // Encrypt sensitive fields client-side before sending to the server.
      const password_encrypted = await encryptField(formData.password, mek);
      const encryptedUsername = formData.username
        ? await encryptField(formData.username, mek)
        : formData.username;
      const encryptedNote = formData.note
        ? await encryptField(formData.note, mek)
        : formData.note;

      const result = await vaultAPI.create({
        name: formData.name,
        password_encrypted,
        username: encryptedUsername,
        note: encryptedNote,
        category_id: formData.category_id,
      });

      toast.success("Password saved successfully!");
      onSuccess?.();
      handleClose();
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "Failed to save password";

      // Check if error message contains breach warning
      if (errorMsg.includes("ditemukan")) {
        setBreachWarning(errorMsg);
        toast.warning("Password breach detected!");
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      username: "",
      password: "",
      note: "",
      category_id: "",
    });
    setErrors({});
    setBreachWarning(null);
    setShowGenerator(false);
    onClose();
  };

  const passwordStrength = calculatePasswordStrength(formData.password);

  // Get selected category for dynamic icon
  const selectedCategoryObj = categories.find(
    (cat) => cat.id === parseInt(formData.category_id),
  );
  const CategoryIcon = getCategoryIcon(selectedCategoryObj?.name || "");
  const categoryGradient = getCategoryGradient(selectedCategoryObj?.name || "");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto my-4 sm:my-8">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sm:p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div
              className={`w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br ${categoryGradient} rounded-xl flex items-center justify-center flex-shrink-0`}
            >
              <CategoryIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-xl font-bold text-slate-800 dark:text-white truncate">
                Add New Password
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate">
                Securely store your credentials
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0 ml-2"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
          </button>
        </div>

        {/* Breach Warning */}
        {breachWarning && (
          <div className="mx-4 sm:mx-6 mt-3 sm:mt-4 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2 sm:gap-3">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-sm sm:text-base text-red-800 dark:text-red-300 mb-0.5 sm:mb-1">
                ⚠️ Security Warning
              </h4>
              <p className="text-xs sm:text-sm text-red-700 dark:text-red-400">
                {breachWarning}
              </p>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 space-y-3 sm:space-y-5"
        >
          {/* Name Field */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Gmail Account"
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border ${
                errors.name
                  ? "border-red-500 focus:ring-red-500"
                  : "border-slate-300 dark:border-slate-600 focus:ring-primary-500"
              } bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:border-transparent transition-all outline-none`}
            />
            {errors.name && (
              <p className="mt-1 text-xs sm:text-sm text-red-500">
                {errors.name}
              </p>
            )}
          </div>

          {/* Username Field */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Username / Email <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="you@example.com"
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border ${
                errors.username
                  ? "border-red-500 focus:ring-red-500"
                  : "border-slate-300 dark:border-slate-600 focus:ring-primary-500"
              } bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:border-transparent transition-all outline-none`}
            />
            {errors.username && (
              <p className="mt-1 text-xs sm:text-sm text-red-500">
                {errors.username}
              </p>
            )}
          </div>

          {/* Password Field with Generator */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                Password <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowGenerator(!showGenerator)}
                className="text-xs sm:text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
              >
                {showGenerator ? "Hide Generator" : "Generate Password"}
              </button>
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter a strong password"
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-20 sm:pr-24 text-sm sm:text-base rounded-xl border ${
                  errors.password
                    ? "border-red-500 focus:ring-red-500"
                    : "border-slate-300 dark:border-slate-600 focus:ring-primary-500"
                } bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:border-transparent transition-all outline-none font-mono`}
              />
              <div className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 sm:gap-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
                  ) : (
                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
                </button>
              </div>
            </div>

            {errors.password && (
              <p className="mt-1 text-xs sm:text-sm text-red-500">
                {errors.password}
              </p>
            )}

            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    Strength:
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      passwordStrength.color === "red"
                        ? "text-red-600"
                        : passwordStrength.color === "orange"
                          ? "text-orange-600"
                          : passwordStrength.color === "yellow"
                            ? "text-yellow-600"
                            : "text-green-600"
                    }`}
                  >
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="w-full h-1.5 sm:h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      passwordStrength.color === "red"
                        ? "bg-red-500"
                        : passwordStrength.color === "orange"
                          ? "bg-orange-500"
                          : passwordStrength.color === "yellow"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                    }`}
                    style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Breach Check Notification */}
            {isCheckingBreach && formData.password && (
              <div className="mt-2 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-500 animate-spin" />
                <span>Checking password breach database...</span>
              </div>
            )}

            {breachInfo && !isCheckingBreach && formData.password && (
              <div
                className={`mt-2 p-2.5 sm:p-3 rounded-lg flex items-start gap-2 sm:gap-3 ${
                  breachInfo.isPwned
                    ? breachInfo.severity === "critical"
                      ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                      : breachInfo.severity === "high"
                        ? "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800"
                        : "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                    : "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                }`}
              >
                {breachInfo.isPwned ? (
                  <>
                    <AlertCircle
                      className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5 ${
                        breachInfo.severity === "critical"
                          ? "text-red-600 dark:text-red-400"
                          : breachInfo.severity === "high"
                            ? "text-orange-600 dark:text-orange-400"
                            : "text-yellow-600 dark:text-yellow-400"
                      }`}
                    />
                    <div className="flex-1">
                      <p
                        className={`text-xs sm:text-sm font-semibold ${
                          breachInfo.severity === "critical"
                            ? "text-red-800 dark:text-red-300"
                            : breachInfo.severity === "high"
                              ? "text-orange-800 dark:text-orange-300"
                              : "text-yellow-800 dark:text-yellow-300"
                        }`}
                      >
                        ⚠️ Password Found in Data Breaches
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          breachInfo.severity === "critical"
                            ? "text-red-700 dark:text-red-400"
                            : breachInfo.severity === "high"
                              ? "text-orange-700 dark:text-orange-400"
                              : "text-yellow-700 dark:text-yellow-400"
                        }`}
                      >
                        {breachInfo.message}
                        <br />
                        <span className="font-medium">
                          We recommend generating a new password.
                        </span>
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm font-semibold text-green-800 dark:text-green-300">
                        ✓ Password is Secure
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                        This password hasn't been found in any known data
                        breaches.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Password Generator */}
            {showGenerator && (
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="space-y-2.5 sm:space-y-3">
                  {/* Length Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                        Length
                      </label>
                      <span className="text-xs sm:text-sm font-semibold text-primary-600 dark:text-primary-400">
                        {generatorOptions.length}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="8"
                      max="32"
                      value={generatorOptions.length}
                      onChange={(e) =>
                        setGeneratorOptions((prev) => ({
                          ...prev,
                          length: parseInt(e.target.value),
                        }))
                      }
                      className="w-full"
                    />
                  </div>

                  {/* Options Checkboxes */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {[
                      { key: "uppercase", label: "Uppercase (A-Z)" },
                      { key: "lowercase", label: "Lowercase (a-z)" },
                      { key: "numbers", label: "Numbers (0-9)" },
                      { key: "symbols", label: "Symbols (!@#$)" },
                    ].map((option) => (
                      <label
                        key={option.key}
                        className="flex items-center gap-1.5 sm:gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={generatorOptions[option.key]}
                          onChange={(e) =>
                            setGeneratorOptions((prev) => ({
                              ...prev,
                              [option.key]: e.target.checked,
                            }))
                          }
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Generate Button */}
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="w-full flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Generate Password
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border ${
                errors.category_id
                  ? "border-red-500 focus:ring-red-500"
                  : "border-slate-300 dark:border-slate-600 focus:ring-primary-500"
              } bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:border-transparent transition-all outline-none`}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.category_id && (
              <p className="mt-1 text-xs sm:text-sm text-red-500">
                {errors.category_id}
              </p>
            )}
          </div>

          {/* Note Field */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Note <span className="text-slate-400">(Optional)</span>
            </label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              placeholder="Add any additional notes..."
              rows={3}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none resize-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 pt-3 sm:pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="order-1 sm:order-2 flex-1 px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 sm:gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  Save
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="order-2 sm:order-1 flex-1 px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateVaultModal;
