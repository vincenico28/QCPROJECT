import { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  Loader2,
  Lock,
  Mail,
  Info,
  KeyRound,
  ArrowLeft,
  RotateCw,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { serverDispatch2FAOtp, serverVerify2FAOtp } from "@/lib/server.functions";
import { toast } from "sonner";

interface SignInScreenProps {
  session?: any;
  isTwoFactorPending?: boolean;
  onVerified?: () => void;
}

export function SignInScreen({
  session,
  isTwoFactorPending = false,
  onVerified,
}: SignInScreenProps) {
  const initialEmail = session?.user?.email || "";
  const [step, setStep] = useState<"credentials" | "2fa">(
    isTwoFactorPending || (session && initialEmail) ? "2fa" : "credentials"
  );
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // 6-digit OTP input states
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const hasAutoDispatchedRef = useRef(false);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // If already logged in to Supabase but pending 2FA on page load, trigger OTP send once
  useEffect(() => {
    if (isTwoFactorPending && initialEmail && step === "2fa" && resendCooldown === 0) {
      if (!hasAutoDispatchedRef.current) {
        hasAutoDispatchedRef.current = true;
        handleDispatchOtp(initialEmail, false);
      }
    }
  }, [isTwoFactorPending, initialEmail, step, resendCooldown]);

  // Auto-focus first empty OTP input when entering 2FA step
  useEffect(() => {
    if (step === "2fa") {
      const firstEmpty = otpDigits.findIndex((d) => !d);
      const targetIndex = firstEmpty !== -1 ? firstEmpty : 0;
      inputRefs.current[targetIndex]?.focus();
    }
  }, [step]);

  // Dispatches 6-digit OTP via high-reliability direct SMTP gateway (prevents 504 Gateway Timeout)
  async function handleDispatchOtp(targetEmail: string, showToast = true) {
    const cleanTarget = targetEmail.trim();
    if (!cleanTarget) return;

    setBusy(true);
    setError(null);
    setInfo(null);

    let sent = false;

    // 1. Primary: Direct high-speed Server SMTP Gateway (uses verified Gmail App Password)
    try {
      const res = await serverDispatch2FAOtp({
        data: { email: cleanTarget },
      });
      if (res && res.success) {
        sent = true;
      }
    } catch (serverErr: any) {
      console.warn("[Server 2FA dispatch attempt]:", serverErr);
    }

    // 2. Fallback: Supabase Auth OTP (only if server direct dispatch failed)
    if (!sent) {
      try {
        const { error: sbErr } = await supabase.auth.signInWithOtp({
          email: cleanTarget,
          options: { shouldCreateUser: false },
        });
        if (sbErr) throw sbErr;
        sent = true;
      } catch (sbErr: any) {
        console.error("[Supabase 2FA fallback error]:", sbErr);
      }
    }

    setBusy(false);

    if (sent) {
      setResendCooldown(60);
      setInfo("A 6-digit security verification code has been dispatched to your official email.");
      if (showToast) {
        toast.success(`6-digit 2FA security code sent to ${cleanTarget}`);
      }
    } else {
      setError("Unable to dispatch 2FA OTP code. Please check your SMTP settings or try again.");
    }
  }

  // Handle Step 1 (Email & Password submission)
  async function onCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error("Invalid credentials or user account not found.");
      }

      // Credentials are valid! Trigger Step 2: 2FA OTP
      setStep("2fa");
      hasAutoDispatchedRef.current = true;
      await handleDispatchOtp(email.trim(), true);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  // Handle OTP digit input changes
  function handleDigitChange(index: number, value: string) {
    // If user pasted multiple characters
    if (value.length > 1) {
      const cleanPasted = value.replace(/\D/g, "").slice(0, 6);
      if (cleanPasted) {
        const nextDigits = [...otpDigits];
        for (let i = 0; i < cleanPasted.length; i++) {
          if (index + i < 6) nextDigits[index + i] = cleanPasted[i];
        }
        setOtpDigits(nextDigits);
        const nextFocus = Math.min(index + cleanPasted.length, 5);
        inputRefs.current[nextFocus]?.focus();

        if (nextDigits.every((d) => d !== "")) {
          verifyCompletedOtp(nextDigits.join(""));
        }
        return;
      }
    }

    const singleDigit = value.slice(-1).replace(/\D/g, "");
    const nextDigits = [...otpDigits];
    nextDigits[index] = singleDigit;
    setOtpDigits(nextDigits);

    // Auto-advance to next input
    if (singleDigit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are provided
    if (nextDigits.every((d) => d !== "")) {
      verifyCompletedOtp(nextDigits.join(""));
    }
  }

  // Handle backspace navigation
  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  // Verify the completed 6-digit OTP via server engine or Supabase Auth
  async function verifyCompletedOtp(code: string) {
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setBusy(true);
    setError(null);
    const targetEmail = email.trim() || session?.user?.email || "";

    try {
      let verified = false;

      // 1. Check direct server OTP verification
      try {
        const sRes = await serverVerify2FAOtp({
          data: { email: targetEmail, code },
        });
        if (sRes && sRes.success) {
          verified = true;
        }
      } catch (sErr) {
        console.warn("[Server OTP verification notice]:", sErr);
      }

      // 2. Check Supabase Auth OTP verification (if server verify did not match)
      if (!verified) {
        try {
          const { data, error: sbErr } = await supabase.auth.verifyOtp({
            email: targetEmail,
            token: code,
            type: "email",
          });
          if (!sbErr && (data?.session || data?.user)) {
            verified = true;
          }
        } catch (sbErr) {
          console.warn("[Supabase OTP verification notice]:", sbErr);
        }
      }

      if (verified) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("qc_2fa_session_verified", "true");
        }
        toast.success("2FA Clearance Verified. Welcome to Command Operations.");
        if (onVerified) {
          onVerified();
        } else {
          window.location.reload();
        }
      } else {
        throw new Error("Invalid or expired 6-digit security code. Please check your inbox or click Resend.");
      }
    } catch (err: any) {
      console.error("[2FA verification error]:", err);
      setError(err?.message || "Invalid or expired 6-digit security code. Please check your inbox or click Resend.");
      // Reset inputs on error
      setOtpDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setBusy(false);
    }
  }

  // Cancels 2FA and logs out/returns to credentials
  async function handleCancel2FA() {
    setBusy(true);
    try {
      await supabase.auth.signOut();
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("qc_2fa_session_verified");
      }
      hasAutoDispatchedRef.current = false;
      setStep("credentials");
      setPassword("");
      setOtpDigits(["", "", "", "", "", ""]);
      setError(null);
      setInfo(null);
    } catch {
      hasAutoDispatchedRef.current = false;
      setStep("credentials");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo & Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="grid size-12 place-items-center overflow-hidden rounded-2xl shadow-lg shadow-primary/30">
            <img src="/favico2.png" alt="QC Logo" className="size-full object-contain" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
            Culiat Traffic Operations
          </h1>
          <p className="mt-1 font-mono-tab text-[11px] uppercase tracking-widest text-subtle">
            {step === "credentials" ? "Restricted · Authorized Personnel Only" : "Two-Factor Authentication (2FA)"}
          </p>
        </div>

        {/* STEP 1: CREDENTIALS (Email & Password) */}
        {step === "credentials" ? (
          <form onSubmit={onCredentialsSubmit} className="panel rounded-2xl p-6 border border-border bg-panel shadow-xl">
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
              <Info className="size-4 shrink-0 text-primary mt-0.5" />
              <p className="leading-relaxed">
                Command Center access requires two-factor clearance. After password verification, a 6-digit OTP will be transmitted via SMTP to your official email.
              </p>
            </div>

            <label className="block">
              <span className="flex items-center gap-1.5 font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                <Mail className="size-3" /> Official email
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@quezoncity.gov.ph"
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>

            <label className="mt-4 block">
              <span className="flex items-center gap-1.5 font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                <Lock className="size-3" /> Password
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>

            {error && (
              <p className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              Verify Credentials & Send OTP
            </button>

            <div className="mt-6 text-center">
              <a href="/" className="text-xs text-subtle hover:text-foreground underline underline-offset-2 transition-colors">
                ← Return to public citizen portal
              </a>
            </div>
          </form>
        ) : (
          /* STEP 2: TWO-FACTOR AUTHENTICATION (6-DIGIT OTP) */
          <div className="panel rounded-2xl p-6 border border-border bg-panel shadow-xl">
            <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="grid size-8 place-items-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <KeyRound className="size-4" />
                </div>
                <div>
                  <span className="font-mono-tab text-xs font-bold text-foreground">
                    2FA Security Challenge
                  </span>
                  <p className="font-mono-tab text-[9px] uppercase tracking-wider text-emerald-400">
                    SMTP Verified
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono-tab text-[9px] font-bold text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ACTIVE
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              A 6-digit clearance code was sent to your official address:
              <br />
              <strong className="text-foreground font-mono-tab text-xs">{email || session?.user?.email}</strong>
            </p>

            {info && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-400">
                <CheckCircle2 className="size-3.5 shrink-0 mt-0.5" />
                <span>{info}</span>
              </div>
            )}

            {error && (
              <div className="mt-3 rounded-lg border border-danger/30 bg-danger/10 p-2.5 text-xs text-danger">
                {error}
              </div>
            )}

            {/* 6 Digit Inputs */}
            <div className="my-6">
              <div className="flex justify-between gap-1.5 sm:gap-2">
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      inputRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="size-11 sm:size-12 rounded-xl border border-border bg-background text-center font-mono-tab text-xl font-bold text-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none"
                  />
                ))}
              </div>
              <span className="block text-center mt-2 font-mono-tab text-[10px] text-muted-foreground uppercase tracking-wider">
                Code expires in 1 minute
              </span>
            </div>

            {/* Verify Button */}
            <button
              type="button"
              disabled={busy || otpDigits.some((d) => !d)}
              onClick={() => verifyCompletedOtp(otpDigits.join(""))}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              Verify 2FA Clearance Code
            </button>

            {/* Resend & Cancel Controls */}
            <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between text-xs">
              <button
                type="button"
                disabled={busy || resendCooldown > 0}
                onClick={() => handleDispatchOtp(email || session?.user?.email, true)}
                className="inline-flex items-center gap-1.5 text-primary hover:underline disabled:opacity-50 disabled:no-underline font-mono-tab text-[11px]"
              >
                <RotateCw className="size-3" />
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend 6-digit code via SMTP"}
              </button>

              <button
                type="button"
                onClick={handleCancel2FA}
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground font-mono-tab text-[11px]"
              >
                <ArrowLeft className="size-3" />
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
