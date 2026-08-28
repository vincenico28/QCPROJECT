import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Activity,
  Camera,
  FileText,
  MapPin,
  ShieldCheck,
  Zap,
  ArrowRight,
  User,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  CreditCard,
  Eye,
  Sparkles,
  QrCode,
  FileCheck2,
  Loader2,
} from "lucide-react";
import { formatPeso } from "@/lib/data/traffic";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "May Huli Ka — Culiat Traffic Ops (MMDA NCAP Online Verifier)" },
      {
        name: "description",
        content:
          "May Huli Ka? Instant MMDA No Contact Apprehension Policy (NCAP) license plate verification for Barangay Culiat, Quezon City. Check active Notices of Violation (NOV), LTO hold alarms, and settle fines online.",
      },
      {
        property: "og:title",
        content: "May Huli Ka · Culiat Traffic Ops MMDA NCAP Verifier",
      },
      {
        property: "og:description",
        content:
          "Check your vehicle plate for automated camera traffic violations, view CCTV evidence, and avoid LTO registration holds.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const FEATURES = [
  {
    icon: Zap,
    title: "AI NCAP Violation Detection",
    body: "Computer-vision models flag red-light running, yellow-box obstruction, and lane violations with confidence scoring on every event.",
  },
  {
    icon: Camera,
    title: "IoT High-Res Camera Grid",
    body: "Monitor uptime, health, and detection throughput of every ANPR camera node deployed along Commonwealth Ave and Tandang Sora.",
  },
  {
    icon: MapPin,
    title: "GIS Hotspot Analytics",
    body: "Interactive predictive heatmaps with time-range playback, congestion forecasting, and high-risk corridor analytics.",
  },
  {
    icon: FileText,
    title: "Digital Citations & LTO Clearance",
    body: "Automated Notice of Violation (NOV) generation, online GCash/Maya settlements, and instant LTO LTMS clearance.",
  },
];

const STATS = [
  { label: "Camera nodes", value: "120+" },
  { label: "Detection accuracy", value: "99.4%" },
  { label: "Avg. citation time", value: "42s" },
  { label: "Districts covered", value: "6" },
];

type SearchResult = {
  found: boolean;
  plateNumber: string;
  novNumber?: string;
  violation?: string;
  ordinance?: string;
  location?: string;
  amount?: number;
  dueDate?: string;
  ltoAlarmStatus?: "CLEARED" | "WARNING_DUE_SOON" | "LTO_ALARM_ACTIVE";
};

function LandingPage() {
  const [searchPlate, setSearchPlate] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);

  const handleMayHuliKaSearch = async (e?: React.FormEvent, presetPlate?: string) => {
    if (e) e.preventDefault();
    const query = (presetPlate || searchPlate).trim().toUpperCase().replace(/\s+/g, "-");
    if (!query) return;

    setIsSearching(true);
    setSearchResult(null);

    const clean = query.replace(/[^A-Z0-9]/g, "");

    try {
      const { serverFetchCitations } = await import("@/lib/server.functions");
      const citations = await serverFetchCitations({ data: 100 });

      const foundCit = citations?.find(
        (c: any) =>
          c.plate_number.replace(/[^A-Z0-9]/g, "").toUpperCase() === clean
      );

      if (foundCit) {
        setSearchResult({
          found: true,
          plateNumber: query,
          novNumber: foundCit.citation_number,
          violation: foundCit.offense,
          ordinance: "MMDA Reg. No. 16-002 / QC Ord. SP-2938",
          location: "Commonwealth Ave — Tandang Sora Corridor",
          amount: Number(foundCit.amount),
          dueDate: "2026-09-15",
          ltoAlarmStatus: foundCit.status === "paid" ? "CLEARED" : "WARNING_DUE_SOON",
        });
        setIsSearching(false);
        return;
      }
    } catch {
      // fallback to mock check
    }

    setIsSearching(false);
    // Match known test plates or default
    if (clean.includes("NDB8921") || clean.includes("ABC1234") || clean.includes("8921")) {
      setSearchResult({
        found: true,
        plateNumber: query,
        novNumber: "NOV-2026-QC-09124",
        violation: "Disregarding Traffic Signs (Red Light / Beating the Light)",
        ordinance: "MMDA Reg. No. 16-002 / QC Ord. SP-2938",
        location: "Commonwealth Ave — Tandang Sora Intersection Cam #04",
        amount: 2000,
        dueDate: "2026-09-05",
        ltoAlarmStatus: "WARNING_DUE_SOON",
      });
    } else {
      setSearchResult({
        found: false,
        plateNumber: query,
        ltoAlarmStatus: "CLEARED",
      });
    }
  };

  return (
    <div className="min-h-dvh bg-background text-foreground relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute -top-40 right-0 -z-10 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute top-1/2 left-0 -z-10 h-[500px] w-[500px] rounded-full bg-blue-900/20 blur-[120px]" />

      <header className="sticky top-0 z-20 flex flex-col shadow-xl">
        {/* Main Navbar */}
        <div className="border-b border-border bg-background/95 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <div className="grid size-10 place-items-center overflow-hidden rounded-xl shadow-lg shadow-primary/30">
                <img src="/favico2.png" alt="QC Logo" className="size-full object-contain" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">Culiat Traffic Ops</p>
                <p className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                  Barangay Culiat, Quezon City LGU
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="#may-huli-ka"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <Search className="size-3.5" />
                May Huli Ka
              </a>
              <Link
                to="/citizen"
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3.5 py-1.5 text-xs font-bold text-blue-400 hover:bg-blue-500/20 transition-colors"
              >
                <User className="size-3.5" />
                Citizen Portal
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90"
              >
                Command Center
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Top Emergency Advisory Banner */}
        <div className="bg-[#cc0000] px-4 py-2 text-center text-xs font-semibold tracking-wide text-white shadow-md">
          <span className="flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            24/7 Traffic Emergency & Hotlines: 122 (QC LGU) • 911 (National)
          </span>
        </div>
      </header>

      <main>
        {/* HERO SECTION */}
        <section className="mx-auto grid max-w-6xl gap-10 px-6 py-14 lg:grid-cols-2 lg:items-center lg:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-panel px-3 py-1 font-mono-tab text-[10px] uppercase tracking-widest text-primary">
              <span className="size-1.5 animate-pulse rounded-full bg-success" />
              MMDA NCAP Active System
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
              AI traffic enforcement command for <span className="text-[#fcd116]">Barangay Culiat</span>, Quezon City
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
              Automated high-precision violation detection, ANPR camera network, GIS hotspot analytics, and seamless MMDA No Contact Apprehension (NCAP) citizen resolution.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#may-huli-ka"
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3.5 text-sm font-bold text-white shadow-[0_0_30px_-5px_rgba(204,0,0,0.5)] transition-all hover:scale-[1.02] hover:bg-red-500"
              >
                <Search className="size-5" />
                Check "May Huli Ka"
              </a>
              <Link
                to="/citizen"
                className="inline-flex items-center gap-2 rounded-xl border border-blue-500/40 bg-blue-600/10 px-6 py-3.5 text-sm font-bold text-blue-400 transition-all hover:bg-blue-600/20 hover:text-white"
              >
                <User className="size-5" />
                Citizen Portal
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-border-strong bg-panel px-6 py-3.5 text-sm font-bold text-foreground transition-all hover:bg-panel-elevated hover:text-white"
              >
                Staff Login
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <dl className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.label} className="flex flex-col justify-center rounded-2xl border border-border/50 bg-white/5 p-4 backdrop-blur-sm transition-colors hover:bg-white/10">
                  <dt className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                    {s.label}
                  </dt>
                  <dd className="mt-2 font-mono-tab text-2xl font-bold text-white">
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-border/50 bg-panel shadow-2xl lg:h-[540px]">
            <div className="absolute inset-0 z-10 bg-gradient-to-tr from-background/90 via-background/20 to-transparent"></div>
            <img
              src="/landingpage.webp"
              alt="Barangay Culiat, Quezon City traffic enforcement"
              className="h-full w-full object-cover opacity-80"
              loading="lazy"
            />
            <div className="absolute bottom-6 left-6 z-20 flex items-center gap-3 rounded-full border border-white/10 bg-black/50 px-4 py-2 backdrop-blur-md">
              <span className="relative flex size-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex size-3 rounded-full bg-primary"></span>
              </span>
              <span className="font-mono-tab text-xs font-medium text-white tracking-widest uppercase">Live CCTV Grid Online</span>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* "MAY HULI KA?" MMDA NCAP ONLINE VIOLATION CHECKER */}
        {/* ========================================================================= */}
        <section id="may-huli-ka" className="border-y border-red-500/20 bg-gradient-to-b from-red-950/20 via-black to-background py-16">
          <div className="mx-auto max-w-4xl px-6">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-red-400">
                <Search className="size-3.5" /> MMDA NCAP Plate Verifier
              </span>
              <h2 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight text-white">
                May Huli Ka Check Your Plate for Traffic Violations
              </h2>
              <p className="mt-2 text-sm text-white/70 max-w-xl mx-auto leading-relaxed">
                Enter your vehicle license plate or Notice of Violation (NOV) number to instantly verify CCTV apprehensions in Barangay Culiat and Quezon City arterial roads.
              </p>
            </div>

            {/* Search Form */}
            <form onSubmit={handleMayHuliKaSearch} className="mt-8">
              <div className="flex flex-col sm:flex-row gap-3 rounded-2xl border border-red-500/30 bg-black/60 p-2 shadow-2xl backdrop-blur-md">
                <div className="flex flex-1 items-center gap-3 px-4 py-2 sm:py-0">
                  <Search className="size-5 text-red-400 shrink-0" />
                  <input
                    type="text"
                    required
                    placeholder="Enter License Plate (e.g. NDB 8921 or ABC 1234)"
                    value={searchPlate}
                    onChange={(e) => setSearchPlate(e.target.value.toUpperCase())}
                    className="w-full bg-transparent font-mono-tab text-base sm:text-lg font-bold text-white uppercase placeholder:text-white/30 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching || !searchPlate}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-600/30 hover:bg-red-500 transition-all disabled:opacity-50"
                >
                  {isSearching ? <Loader2 className="size-5 animate-spin" /> : <Search className="size-5" />}
                  Check Plate
                </button>
              </div>

              {/* Sample Plate Quick Buttons */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-white/50">
                <span>Quick Test:</span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchPlate("NDB-8921");
                    handleMayHuliKaSearch(undefined, "NDB-8921");
                  }}
                  className="rounded bg-white/5 border border-white/10 px-2 py-0.5 font-mono-tab text-white/80 hover:bg-white/10 hover:text-white"
                >
                  NDB-8921 (Has Infraction)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchPlate("NBP-5412");
                    handleMayHuliKaSearch(undefined, "NBP-5412");
                  }}
                  className="rounded bg-white/5 border border-white/10 px-2 py-0.5 font-mono-tab text-white/80 hover:bg-white/10 hover:text-white"
                >
                  NBP-5412 (Clean Record)
                </button>
              </div>
            </form>

            {/* SEARCH RESULTS DISPLAY */}
            {searchResult && (
              <div className="mt-8 animate-in fade-in zoom-in-95 duration-300">
                {searchResult.found ? (
                  /* Case 1: May Huli */
                  <div className="rounded-3xl border border-red-500/40 bg-gradient-to-br from-red-950/40 via-[#120808] to-black p-6 sm:p-8 shadow-2xl">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-red-500/20 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="grid size-12 place-items-center rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30">
                          <AlertTriangle className="size-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-red-500/20 px-2.5 py-0.5 text-xs font-bold text-red-400 font-mono-tab">
                              MAY HULI! (1 Active Notice)
                            </span>
                            <span className="font-mono-tab text-sm font-bold text-white">{searchResult.plateNumber}</span>
                          </div>
                          <p className="text-xs text-white/60 mt-0.5 font-mono-tab">{searchResult.novNumber}</p>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="font-mono-tab text-2xl font-black text-white">{formatPeso(searchResult.amount || 2000)}</span>
                        <span className="text-[11px] font-semibold text-orange-400 flex items-center sm:justify-end gap-1 mt-0.5">
                          <Clock className="size-3" /> Due in 7 days before LTO Tagging
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2 text-xs">
                      <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                        <span className="text-white/40 uppercase font-mono-tab text-[10px]">Apprehension Offense</span>
                        <p className="text-sm font-bold text-white mt-1">{searchResult.violation}</p>
                        <p className="text-xs text-white/60 mt-0.5">{searchResult.ordinance}</p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                        <span className="text-white/40 uppercase font-mono-tab text-[10px]">Interception Location</span>
                        <p className="text-xs font-medium text-white mt-1 flex items-center gap-1.5">
                          <MapPin className="size-3.5 text-red-400 shrink-0" />
                          {searchResult.location}
                        </p>
                        <div className="mt-2 flex items-center gap-1.5 text-orange-400 font-semibold">
                          <ShieldAlert className="size-3.5" /> LTO Registration Hold Warning Pending
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-red-500/20 pt-4">
                      <p className="text-xs text-white/60">
                        Under MMDA NCAP, you have <strong>10 calendar days</strong> to contest or settle before registration alarms.
                      </p>
                      <div className="flex items-center gap-2">
                        <Link
                          to="/citizen"
                          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-blue-500 transition-all"
                        >
                          <Eye className="size-3.5" /> Inspect CCTV Evidence & Settle
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Case 2: Walang Huli */
                  <div className="rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/30 via-[#06140e] to-black p-6 sm:p-8 shadow-2xl text-center flex flex-col items-center">
                    <div className="grid size-14 place-items-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-4">
                      <CheckCircle2 className="size-7" />
                    </div>
                    <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono-tab">
                      WALANG HULI / CLEARED
                    </span>
                    <h3 className="text-2xl font-bold text-white mt-3 font-mono-tab">{searchResult.plateNumber}</h3>
                    <p className="text-xs text-white/70 max-w-md mt-2 leading-relaxed">
                      No outstanding MMDA NCAP violations or LTO alarms recorded for this license plate. Thank you for keeping Quezon City roads safe!
                    </p>
                    <Link
                      to="/citizen"
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-all"
                    >
                      <Sparkles className="size-4" /> Claim Safe Driver Eco-Rewards
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* FEATURES GRID */}
        <section className="border-t border-border bg-panel/40">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              Built for the full MMDA NCAP & LGU enforcement workflow
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f) => (
                <article key={f.title} className="panel group relative overflow-hidden rounded-[2rem] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_10px_40px_-15px_rgba(204,0,0,0.3)]">
                  <div className="absolute -right-10 -top-10 -z-10 size-40 rounded-full bg-primary/5 blur-3xl transition-all duration-300 group-hover:bg-primary/20"></div>
                  <div className="inline-flex rounded-xl bg-primary/10 p-3.5 transition-colors group-hover:bg-primary/20">
                    <f.icon className="size-6 text-primary" strokeWidth={2} />
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-white tracking-tight">{f.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* AUTHORIZED STAFF CTA */}
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="panel flex flex-col items-start gap-6 rounded-2xl p-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Authorized Operations Access</h2>
              <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                Command center access is restricted to verified Barangay Culiat and QC LGU traffic operators. Sign in to access real-time telemetry and dispatch controls.
              </p>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90"
            >
              <ShieldCheck className="size-4" />
              Staff Sign In
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-subtle sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2">
            <Activity className="size-4 text-primary" />
            Culiat Traffic Ops · Barangay Culiat, Quezon City Local Government Unit (MMDA NCAP Partner)
          </p>
          <p className="font-mono-tab text-[10px] uppercase tracking-widest">
            Internal & Public Portal · {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
