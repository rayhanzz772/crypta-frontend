import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import PasswordWarningModal from "@/components/PasswordWarningModal";
import RecoveryKeyModal from "@/components/RecoveryKeyModal";
import {
  sha256Hex,
  deriveKEK,
  generateRandomHex,
  wrapMEK,
} from "@/utils/crypto";

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

    const { email, password } = pendingRegistration;

    setIsLoading(true);
    setShowWarningModal(false);

    try {
      // 1. Generate random material
      const kekSalt = generateRandomHex(16); // 16 bytes for Argon2 salt
      const rawMek = generateRandomHex(32); // 32-byte MEK
      const recoveryKey = generateRandomHex(32); // 32-byte Recovery Key

      // 2. Derive master_hash (used for server-side bcrypt)
      const masterHash = await sha256Hex(password);

      // 3. Derive KEK from the master password
      const kek = await deriveKEK(password, kekSalt);

      // 4. Wrap MEK with KEK
      const pwWrap = await wrapMEK(rawMek, kek);

      // 5. Wrap MEK with Recovery Key
      const rcWrap = await wrapMEK(rawMek, recoveryKey);

      // 6. Call register from context with the ZKE payload
      const result = await register(email, {
        master_hash: masterHash,
        kek_salt: kekSalt,
        encrypted_mek_by_password: pwWrap.encryptedMek,
        mek_pw_iv: pwWrap.iv,
        mek_pw_tag: pwWrap.tag,
        encrypted_mek_by_recovery: rcWrap.encryptedMek,
        mek_rc_iv: rcWrap.iv,
        mek_rc_tag: rcWrap.tag,
      });

      if (result.success) {
        setIsRegistered(true);
        setRegisteredEmail(email);
        toast.success("Account created. Check your email for the 6-digit code.");

        setRecoveryKey(recoveryKey);
        setShowRecoveryModal(true);
      } else if (result.errorCode === "UNVERIFIED_EMAIL") {
        const targetEmail = result.data?.email || email;
        toast("A new verification code has been sent to your inbox.", {
          icon: "📬",
          duration: 4000,
        });
        navigate(`/verify-email?email=${encodeURIComponent(targetEmail)}`);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("ZKE registration error:", error);
      toast.error("An error occurred during secure key generation.");
    } finally {
      setIsLoading(false);
      setPendingRegistration(null);
    }
  };

  const handleCancelRegistration = () => {
    setShowWarningModal(false);
    setPendingRegistration(null);
  };

  const handleCloseRecoveryModal = () => {
    setShowRecoveryModal(false);
    navigate(`/verify-email?email=${encodeURIComponent(registeredEmail)}`);
  };

  const requirements = [
    { ok: formData.password.length >= 8, label: "At least 8 characters" },
    { ok: /[A-Z]/.test(formData.password), label: "One uppercase letter" },
    { ok: /[a-z]/.test(formData.password), label: "One lowercase letter" },
    { ok: /\d/.test(formData.password), label: "One number" },
  ];

  // Show loading while checking auth status
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PasswordWarningModal
        isOpen={showWarningModal}
        onClose={handleCancelRegistration}
        onConfirm={handleConfirmRegistration}
      />

      <RecoveryKeyModal
        isOpen={showRecoveryModal}
        recoveryKey={recoveryKey}
        onClose={handleCloseRecoveryModal}
      />

      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-6 sm:py-12">
        <Card className="w-full max-w-[440px] sm:max-w-[480px]">
          <CardContent className="pt-8 pb-8 px-6 sm:px-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Home
            </Link>

            <div className="text-center mb-6 sm:mb-8">
              <img
                src="/logo_shield.png"
                alt=""
                className="w-12 h-12 mx-auto mb-4 object-contain"
              />
              <h1 className="text-2xl font-bold mb-1">Create Account</h1>
              <p className="text-sm text-muted-foreground">
                Start securing your passwords today
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="email" className="mb-2">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`pl-9 h-11 ${errors.email ? "border-destructive focus:ring-destructive" : ""}`}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password" className="mb-2">
                  Master Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`pl-9 pr-10 h-11 ${errors.password ? "border-destructive focus:ring-destructive" : ""}`}
                    placeholder="••••••••"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-destructive">
                    {errors.password}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="confirm_password" className="mb-2">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirm_password"
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    className={`pl-9 pr-10 h-11 ${errors.confirm_password ? "border-destructive focus:ring-destructive" : ""}`}
                    placeholder="••••••••"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {errors.confirm_password && (
                  <p className="mt-1.5 text-xs text-destructive">
                    {errors.confirm_password}
                  </p>
                )}
              </div>

              {/* Password Requirements */}
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-xs font-medium mb-2">
                  Password must contain:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {requirements.map((req) => (
                    <li key={req.label} className="flex items-center gap-2">
                      <span className={req.ok ? "text-success" : ""}>
                        {req.ok ? "✓" : "•"}
                      </span>
                      {req.label}
                    </li>
                  ))}
                </ul>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full h-11">
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Register;
