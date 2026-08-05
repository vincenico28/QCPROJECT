import { useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export function SignInScreen() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          setMessage("Account created. Check your email to confirm access.");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="grid size-12 place-items-center overflow-hidden rounded-2xl shadow-lg shadow-primary/30">
            <img src="/qc-favicon.webp" alt="QC Logo" className="size-full object-contain" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
            QC Traffic Operations
          </h1>
          <p className="mt-1 font-mono-tab text-[11px] uppercase tracking-widest text-subtle">
            Restricted · Authorized personnel only
          </p>
        </div>

        <form onSubmit={onSubmit} className="panel rounded-2xl p-6">
          <div className="mb-5 flex rounded-lg border border-border bg-panel p-1">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 font-mono-tab text-[11px] font-semibold uppercase tracking-widest transition-colors",
                  mode === m ? "bg-primary/15 text-primary" : "text-subtle hover:text-foreground",
                )}
              >
                {m === "signin" ? "Sign in" : "Register"}
              </button>
            ))}
          </div>

          <label className="block">
            <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
              Official email
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="officer@quezoncity.gov.ph"
              className="mt-1.5 w-full rounded-lg border border-border bg-panel px-3 py-2.5 text-sm text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label className="mt-4 block">
            <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
              Password
            </span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-lg border border-border bg-panel px-3 py-2.5 text-sm text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>

          {error && (
            <p className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
              {error}
            </p>
          )}
          {message && (
            <p className="mt-4 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {mode === "signin" ? "Access command center" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
