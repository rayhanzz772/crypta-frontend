import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Mail, Loader2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { authAPI } from "@/utils/api";

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
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-6 sm:py-12">
      <Card className="w-full max-w-[520px]">
        <CardContent className="pt-8 pb-8 px-6 sm:px-8">
          <div className="mb-6 flex items-center justify-between gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground sm:text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold sm:text-3xl">
              {isVerified ? "Email Confirmed" : "Verify Your Email"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              {isVerified
                ? "Your email has been verified. Redirecting you to sign in..."
                : "Enter the 6-digit code from your inbox to activate your account."}
            </p>
          </div>

          {!isVerified && (
            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <Label htmlFor="email" className="mb-2">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    disabled
                    value={email}
                    onChange={handleEmailChange}
                    className={`pl-10 h-11 ${errors.email ? "border-destructive focus:ring-destructive" : ""}`}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-destructive sm:text-sm">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <Label className="cursor-default">Verification Code</Label>
                  <span className="text-[11px] text-muted-foreground sm:text-xs">
                    Paste works too
                  </span>
                </div>

                <div
                  className="grid grid-cols-6 gap-2 sm:gap-3"
                  onPaste={handleCodePaste}
                >
                  {codeDigits.map((digit, index) => (
                    <Input
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
                      className={`h-12 sm:h-14 rounded-xl text-center text-lg font-semibold tracking-[0.2em] sm:text-xl ${
                        errors.code
                          ? "border-destructive focus:ring-destructive"
                          : ""
                      }`}
                      aria-label={`Verification digit ${index + 1}`}
                    />
                  ))}
                </div>
                {errors.code && (
                  <p className="mt-1 text-xs text-destructive sm:text-sm">
                    {errors.code}
                  </p>
                )}
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full h-11">
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify Email
                    <ArrowRight />
                  </>
                )}
              </Button>
            </form>
          )}

          <Alert className="mt-6">
            <AlertTitle>Didn't receive the code?</AlertTitle>
            <AlertDescription>
              Check your spam folder first, then request a fresh code if needed.
            </AlertDescription>
            <div className="mt-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleResend}
                disabled={isResending || resendCooldown > 0 || isVerified}
              >
                <Loader2 className={isResending ? "animate-spin" : ""} />
                {isResending
                  ? "Sending..."
                  : resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : "Resend Code"}
              </Button>
            </div>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;
