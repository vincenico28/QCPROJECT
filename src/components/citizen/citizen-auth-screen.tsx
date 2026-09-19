import { useState, useEffect, useRef } from "react";
import { User, Loader2, Mail, Lock, Phone, MapPin, Car, ArrowRight, UserPlus, LogIn, CheckCircle2, KeyRound, ArrowLeft, RotateCw, ShieldCheck } from "lucide-react";
import { useCitizenAuth } from "@/lib/data/citizen";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export function CitizenAuthScreen() {
  const { login, signup, sendPasswordResetOtp, resetPasswordWithOtp } = useCitizenAuth();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [busy, setBusy] = useState(false);

  // Sign In State
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Sign Up State
  const [fullName, setFullName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [makeModel, setMakeModel] = useState("");
  const [vehicleType, setVehicleType] = useState("Sedan");

  // Reset Password State
  const [resetEmail, setResetEmail] = useState("");
  const [resetStep, setResetStep] = useState<"request" | "verify">("request");
  const [resetOtpDigits, setResetOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [resetCooldown, setResetCooldown] = useState(0);
  const resetInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resetCooldown <= 0) return;
    const timer = setInterval(() => {
      setResetCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resetCooldown]);

  // Focus first empty OTP box when entering verify step
  useEffect(() => {
    if (mode === "reset" && resetStep === "verify") {
      const firstEmpty = resetOtpDigits.findIndex((d) => !d);
      const targetIndex = firstEmpty !== -1 ? firstEmpty : 0;
      resetInputRefs.current[targetIndex]?.focus();
    }
  }, [mode, resetStep]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = signInEmail.trim();
    const cleanPassword = signInPassword.trim();
    if (!cleanEmail || !cleanPassword) {
      toast.error("Please enter both your email address and password.");
      return;
    }
    setBusy(true);
    try {
      const citizen = await login(cleanEmail, cleanPassword);
      toast.success(`Welcome back, ${citizen.fullName}!`);
    } catch (err: any) {
      toast.error(err.message || "Invalid password or email address.");
    } finally {
      setBusy(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = signUpEmail.trim();
    const cleanPassword = signUpPassword.trim();
    if (!fullName.trim() || !cleanEmail || !cleanPassword) {
      toast.error("Please fill in all required fields including password.");
      return;
    }
    if (cleanPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    setBusy(true);
    try {
      const citizen = await signup({
        fullName: fullName.trim(),
        email: cleanEmail,
        password: cleanPassword,
        phone,
        address,
        plateNumber,
        makeModel,
        vehicleType,
      });
      toast.success(`Account created! Welcome to Citizen Portal, ${citizen.fullName}.`);
    } catch (err: any) {
      toast.error(err.message || "Failed to register account");
    } finally {
      setBusy(false);
    }
  };

  const handleSendResetOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = resetEmail.trim();
    if (!cleanEmail) {
      toast.error("Please enter your registered email address.");
      return;
    }
    setBusy(true);
    try {
      await sendPasswordResetOtp(cleanEmail);
      setResetStep("verify");
      setResetCooldown(60);
      toast.success(`6-digit code dispatched to ${cleanEmail}. Please check your inbox.`);
    } catch (err: any) {
      toast.error(err.message || "Failed to dispatch verification code.");
    } finally {
      setBusy(false);
    }
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    // Handle pasting 6-digit code
    if (value.length > 1) {
      const cleanPasted = value.replace(/\D/g, "").slice(0, 6);
      if (cleanPasted) {
        const nextDigits = [...resetOtpDigits];
        for (let i = 0; i < cleanPasted.length; i++) {
          if (index + i < 6) nextDigits[index + i] = cleanPasted[i];
        }
        setResetOtpDigits(nextDigits);
        const nextFocus = Math.min(index + cleanPasted.length, 5);
        resetInputRefs.current[nextFocus]?.focus();
        return;
      }
    }

    const singleDigit = value.slice(-1).replace(/\D/g, "");
    const nextDigits = [...resetOtpDigits];
    nextDigits[index] = singleDigit;
    setResetOtpDigits(nextDigits);

    if (singleDigit && index < 5) {
      resetInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !resetOtpDigits[index] && index > 0) {
      resetInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyAndResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = resetEmail.trim();
    const code = resetOtpDigits.join("").trim();
    const cleanPassword = newPassword.trim();

    if (!cleanEmail) {
      toast.error("Email address is missing.");
      return;
    }
    if (code.length !== 6) {
      toast.error("Please enter the complete 6-digit verification code sent to your email.");
      return;
    }
    if (!cleanPassword || cleanPassword.length < 6) {
      toast.error("New password must be at least 6 characters long.");
      return;
    }
    if (cleanPassword !== confirmNewPassword.trim()) {
      toast.error("Passwords do not match. Please verify.");
      return;
    }

    setBusy(true);
    try {
      await resetPasswordWithOtp(cleanEmail, code, cleanPassword);
      toast.success("Password updated successfully! You can now sign in.");
      setSignInEmail(cleanEmail);
      setSignInPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setResetOtpDigits(["", "", "", "", "", ""]);
      setResetStep("request");
      setMode("signin");
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password. Please check your 6-digit code.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col justify-between selection:bg-primary/30 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 right-1/4 -z-10 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[140px]" />
      <div className="absolute bottom-10 -left-20 -z-10 h-[450px] w-[450px] rounded-full bg-blue-900/10 blur-[130px]" />

      {/* Header Bar */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
            <img src="/favico2.png" alt="Culiat LGU" className="size-8" />
            <span className="font-semibold tracking-tight text-foreground">
              Citizen<span className="text-primary">Portal</span>
            </span>
          </Link>
          <Link
            to="/"
            className="text-xs font-medium text-subtle hover:text-foreground transition-colors"
          >
            ← Return to Landing Page
          </Link>
        </div>
      </header>

      {/* Main Auth Section */}
      <main className="mx-auto w-full max-w-lg px-6 py-10">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-primary/20 text-primary shadow-lg shadow-primary/25">
            <User className="size-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {mode === "signin"
              ? "Sign in to Citizen Portal"
              : mode === "signup"
              ? "Register Citizen Account"
              : "Reset Account Password"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Access your registered vehicles, view citations, and file official disputes."
              : mode === "signup"
              ? "Create your verified motorist profile for Barangay Culiat, Quezon City."
              : "Enter your registered email address and choose a new secure password."}
          </p>
        </div>

        {/* Mode Toggle Tabs */}
        {mode !== "reset" ? (
          <div className="mb-6 flex rounded-xl border border-border bg-panel-elevated p-1">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-all",
                mode === "signin"
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LogIn className="size-3.5" />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-all",
                mode === "signup"
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <UserPlus className="size-3.5" />
              Register
            </button>
          </div>
        ) : (
          <div className="mb-6 flex items-center justify-start">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-subtle hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-3.5" /> Back to Sign In
            </button>
          </div>
        )}

        {/* SIGN IN FORM */}
        {mode === "signin" ? (
          <form onSubmit={handleSignIn} className="rounded-2xl border border-border bg-panel p-6 shadow-xl flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="flex items-center gap-1.5 font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                <Mail className="size-3 text-primary" /> Email Address
              </span>
              <input
                type="email"
                required
                placeholder="your.email@example.com"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                  <Lock className="size-3 text-primary" /> Password
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(signInEmail);
                    setResetStep("request");
                    setResetOtpDigits(["", "", "", "", "", ""]);
                    setMode("reset");
                  }}
                  className="text-[11px] font-medium text-primary hover:underline"
                >
                  Forgot or need to set password?
                </button>
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>

            <button
              type="submit"
              disabled={busy}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
              Sign In to Portal
            </button>
          </form>
        ) : mode === "signup" ? (
          /* SIGN UP FORM */
          <form onSubmit={handleSignUp} className="rounded-2xl border border-border bg-panel p-6 shadow-xl flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                  Full Name *
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Clara Santos"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                  Email Address *
                </span>
                <input
                  type="email"
                  required
                  placeholder="maria@example.com"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                  Password * (Min. 6 chars)
                </span>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                  Contact Number
                </span>
                <input
                  type="tel"
                  placeholder="0917-000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                Residential Address
              </span>
              <input
                type="text"
                placeholder="Barangay Culiat, Quezon City"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>

            {/* Vehicle Registration Section */}
            <div className="rounded-xl border border-border bg-panel-elevated p-4 flex flex-col gap-3">
              <p className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Car className="size-4 text-primary" />
                Register Primary Vehicle (Optional)
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  type="text"
                  placeholder="Plate (e.g. NDB-1234)"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-xs uppercase text-foreground placeholder:text-subtle focus:border-primary focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Make & Model (e.g. Vios)"
                  value={makeModel}
                  onChange={(e) => setMakeModel(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-subtle focus:border-primary focus:outline-none"
                />
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Motorcycle">Motorcycle</option>
                  <option value="Van">Van / MPV</option>
                  <option value="Truck">Truck</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              Create Citizen Account
            </button>
          </form>
        ) : resetStep === "request" ? (
          /* RESET PASSWORD STEP 1: REQUEST 6-DIGIT OTP */
          <form onSubmit={handleSendResetOtp} className="rounded-2xl border border-border bg-panel p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b border-border pb-3">
              <KeyRound className="size-4 text-primary" />
              Reset Account Password via 6-Digit OTP
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Enter the email address registered with your citizen motorist account. We will dispatch a secure 6-digit verification code directly to your email.
            </p>

            <label className="flex flex-col gap-1.5">
              <span className="flex items-center gap-1.5 font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                <Mail className="size-3 text-primary" /> Registered Email Address
              </span>
              <input
                type="email"
                required
                placeholder="your.email@example.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>

            <button
              type="submit"
              disabled={busy || !resetEmail.trim()}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              Send 6-Digit Verification Code
            </button>
          </form>
        ) : (
          /* RESET PASSWORD STEP 2: VERIFY 6-DIGIT OTP & SET NEW PASSWORD */
          <form onSubmit={handleVerifyAndResetPassword} className="rounded-2xl border border-border bg-panel p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <KeyRound className="size-4 text-primary" />
                Verify 6-Digit OTP & Set Password
              </div>
              <button
                type="button"
                onClick={() => setResetStep("request")}
                className="text-[11px] font-medium text-primary hover:underline"
              >
                Change Email
              </button>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground leading-relaxed">
              A 6-digit verification code has been dispatched via SMTP to <strong className="text-foreground font-mono-tab">{resetEmail}</strong>. Valid for 10 minutes.
            </div>

            {/* 6-Digit OTP Boxes */}
            <div>
              <span className="flex items-center gap-1.5 font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle mb-2">
                <KeyRound className="size-3 text-primary" /> 6-Digit Verification Code
              </span>
              <div className="flex justify-between gap-1.5 sm:gap-2">
                {resetOtpDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      resetInputRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="size-11 sm:size-12 rounded-xl border border-border bg-background text-center font-mono-tab text-xl font-bold text-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none"
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="flex items-center gap-1.5 font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                  <Lock className="size-3 text-primary" /> New Password (Min. 6)
                </span>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="flex items-center gap-1.5 font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                  <Lock className="size-3 text-primary" /> Confirm Password
                </span>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={busy || resetOtpDigits.some((d) => !d) || !newPassword || !confirmNewPassword}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              Verify Code & Update Password
            </button>

            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <button
                type="button"
                disabled={busy || resetCooldown > 0}
                onClick={() => handleSendResetOtp()}
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline disabled:opacity-50 disabled:no-underline font-mono-tab text-[11px]"
              >
                <RotateCw className="size-3" />
                {resetCooldown > 0 ? `Resend code in ${resetCooldown}s` : "Resend 6-digit code"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setResetStep("request");
                  setMode("signin");
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors font-mono-tab text-[11px]"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </main>

      {/* Footer info */}
      <footer className="border-t border-border py-4 text-center text-xs text-subtle">
        Barangay Culiat Traffic Operations Portal · Official Motorist Gateway
      </footer>
    </div>
  );
}
