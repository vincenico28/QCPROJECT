import { useState } from "react";
import { ShieldCheck, Loader2, Lock, Mail, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
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
            <img src="/favico2.png" alt="QC Logo" className="size-full object-contain" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
            Culiat Traffic Operations
          </h1>
          <p className="mt-1 font-mono-tab text-[11px] uppercase tracking-widest text-subtle">
            Restricted · Authorized personnel only
          </p>
        </div>

        <form onSubmit={onSubmit} className="panel rounded-2xl p-6 border border-border bg-panel shadow-xl">
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
            <Info className="size-4 shrink-0 text-primary mt-0.5" />
            <p className="leading-relaxed">
              Account provisioning is restricted. New employee accounts must be registered directly by a System Administrator in the Employees module.
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
            Sign in to Operations
          </button>

          <div className="mt-6 text-center">
            <a href="/" className="text-xs text-subtle hover:text-foreground underline underline-offset-2 transition-colors">
              ← Return to public citizen portal
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
