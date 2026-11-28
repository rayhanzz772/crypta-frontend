import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { consumeAuthRedirectMessage } from "@/utils/api";
import { isDesktop } from "@/utils/desktop";

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-6 sm:py-12">
      <Card className="w-full max-w-[440px]">
        <CardContent className="pt-8 pb-8 px-6 sm:px-8">
          {!isDesktop && (
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Home
            </Link>
          )}

          <div className="text-center mb-8">
            <img
              src="/logo_shield.png"
              alt=""
              className="w-12 h-12 mx-auto mb-4 object-contain"
            />
            <h1 className="text-2xl font-bold mb-1">Welcome Back</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to access your vault
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
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="master_password" className="mb-2">
                Master Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type={showPassword ? "text" : "password"}
                  id="master_password"
                  name="master_password"
                  value={formData.master_password}
                  onChange={handleChange}
                  className={`pl-9 pr-10 h-11 ${errors.master_password ? "border-destructive focus:ring-destructive" : ""}`}
                  placeholder="••••••••"
                  autoComplete="current-password"
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
              {errors.master_password && (
                <p className="mt-1.5 text-xs text-destructive">
                  {errors.master_password}
                </p>
              )}

              <div className="flex justify-end mt-2">
                <Link
                  to="/recover-password"
                  className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Forgot Master Password?
                </Link>
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full h-11">
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" />
                  {isDerivingKeys ? "Deriving keys…" : "Signing in..."}
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight />
                </>
              )}
            </Button>
          </form>

          <Alert className="mt-6">
            <AlertDescription className="text-xs text-center">
              Your master password is never stored on our servers and only
              exists in your browser's memory during your session.
            </AlertDescription>
          </Alert>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
