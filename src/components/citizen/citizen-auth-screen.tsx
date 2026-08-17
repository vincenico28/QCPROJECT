import { useState } from "react";
import { User, ShieldCheck, Loader2, Mail, Lock, Phone, MapPin, Car, ArrowRight, UserPlus, LogIn, CheckCircle2 } from "lucide-react";
import { useCitizenAuth } from "@/lib/data/citizen";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export function CitizenAuthScreen() {
  const { login, signup } = useCitizenAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail) return;
    setBusy(true);
    try {
      const citizen = await login(signInEmail);
      toast.success(`Welcome back, ${citizen.fullName}!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to sign in");
    } finally {
      setBusy(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !signUpEmail) {
      toast.error("Please fill in the required fields");
      return;
    }
    setBusy(true);
    try {
      const citizen = await signup({
        fullName,
        email: signUpEmail,
        password: signUpPassword,
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

  const handleQuickDemoLogin = (email: string) => {
    setSignInEmail(email);
    setSignInPassword("P@ssword123");
    setBusy(true);
    login(email)
      .then((c) => toast.success(`Signed in as ${c.fullName}`))
      .finally(() => setBusy(false));
  };

  return (
    <div className="min-h-dvh bg-[#0a0a0b] text-white flex flex-col justify-between selection:bg-[#0066cc]/30 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 right-1/4 -z-10 h-[500px] w-[500px] rounded-full bg-[#0066cc]/15 blur-[140px]" />
      <div className="absolute bottom-10 -left-20 -z-10 h-[450px] w-[450px] rounded-full bg-blue-900/10 blur-[130px]" />

      {/* Header Bar */}
      <header className="border-b border-white/10 bg-[#0a0a0b]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
            <img src="/favico2.png" alt="Culiat LGU" className="size-8" />
            <span className="font-semibold tracking-tight text-white">
              Citizen<span className="text-[#0066cc]">Portal</span>
            </span>
          </Link>
          <Link
            to="/"
            className="text-xs font-medium text-white/60 hover:text-white transition-colors"
          >
            ← Return to Landing Page
          </Link>
        </div>
      </header>

      {/* Main Auth Section */}
      <main className="mx-auto w-full max-w-lg px-6 py-10">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-[#0066cc]/20 text-[#0066cc] shadow-lg shadow-[#0066cc]/25">
            <User className="size-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {mode === "signin" ? "Sign in to Citizen Portal" : "Register Citizen Account"}
          </h1>
          <p className="mt-1 text-sm text-white/60">
            {mode === "signin"
              ? "Access your registered vehicles, view citations, and file official disputes."
              : "Create your verified motorist profile for Barangay Culiat, Quezon City."}
          </p>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="mb-6 flex rounded-xl border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-all",
              mode === "signin"
                ? "bg-[#0066cc] text-white shadow-md shadow-[#0066cc]/30"
                : "text-white/60 hover:text-white",
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
                ? "bg-[#0066cc] text-white shadow-md shadow-[#0066cc]/30"
                : "text-white/60 hover:text-white",
            )}
          >
            <UserPlus className="size-3.5" />
            Register
          </button>
        </div>

        {/* SIGN IN FORM */}
        {mode === "signin" ? (
          <form onSubmit={handleSignIn} className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="flex items-center gap-1.5 font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-white/60">
                <Mail className="size-3 text-[#0066cc]" /> Email Address
              </span>
              <input
                type="email"
                required
                placeholder="juan.delacruz@example.com"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                className="rounded-lg border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#0066cc] focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="flex items-center gap-1.5 font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-white/60">
                <Lock className="size-3 text-[#0066cc]" /> Password
              </span>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                className="rounded-lg border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#0066cc] focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20"
              />
            </label>

            <button
              type="submit"
              disabled={busy}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0066cc] py-3 text-sm font-semibold text-white shadow-lg shadow-[#0066cc]/30 hover:bg-[#0066cc]/90 transition-all disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
              Sign In to Portal
            </button>

            {/* Quick Demo Access Buttons */}
            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-white/40 text-center mb-2.5">
                Quick Demo Motorist Profiles
              </p>
              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin("juan.delacruz@example.com")}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white transition-all text-left"
                >
                  <span>
                    <strong>Juan Dela Cruz</strong> (ABC-1234 · 1 Unpaid Ticket)
                  </span>
                  <span className="text-[#0066cc] font-mono-tab text-[10px]">Select →</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin("maria.santos@example.com")}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white transition-all text-left"
                >
                  <span>
                    <strong>Maria Clara Santos</strong> (NDB-8921 · Red Light Ticket)
                  </span>
                  <span className="text-[#0066cc] font-mono-tab text-[10px]">Select →</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* SIGN UP FORM */
          <form onSubmit={handleSignUp} className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-white/60">
                  Full Name *
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Clara Santos"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="rounded-lg border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#0066cc] focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-white/60">
                  Email Address *
                </span>
                <input
                  type="email"
                  required
                  placeholder="maria@example.com"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  className="rounded-lg border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#0066cc] focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-white/60">
                  Password
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  className="rounded-lg border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#0066cc] focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-white/60">
                  Contact Number
                </span>
                <input
                  type="tel"
                  placeholder="0917-000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-lg border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#0066cc] focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-white/60">
                Residential Address
              </span>
              <input
                type="text"
                placeholder="Barangay Culiat, Quezon City"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="rounded-lg border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#0066cc] focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20"
              />
            </label>

            {/* Vehicle Registration Section */}
            <div className="rounded-xl border border-white/10 bg-black/20 p-4 flex flex-col gap-3">
              <p className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Car className="size-4 text-[#0066cc]" />
                Register Primary Vehicle (Optional)
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  type="text"
                  placeholder="Plate (e.g. NDB-1234)"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs uppercase text-white placeholder:text-white/30 focus:border-[#0066cc] focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Make & Model (e.g. Vios)"
                  value={makeModel}
                  onChange={(e) => setMakeModel(e.target.value)}
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-[#0066cc] focus:outline-none"
                />
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-[#0066cc] focus:outline-none"
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
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0066cc] py-3 text-sm font-semibold text-white shadow-lg shadow-[#0066cc]/30 hover:bg-[#0066cc]/90 transition-all disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              Create Citizen Account
            </button>
          </form>
        )}
      </main>

      {/* Footer info */}
      <footer className="border-t border-white/10 py-4 text-center text-xs text-white/40">
        Barangay Culiat Traffic Operations Portal · Official Motorist Gateway
      </footer>
    </div>
  );
}
