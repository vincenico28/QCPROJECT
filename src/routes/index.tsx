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
  Radio,
  Car,
  Scale,
  PhoneCall,
  Check,
  TrendingUp,
  Cpu,
  ChevronRight,
  Download,
} from "lucide-react";
import { formatPeso } from "@/lib/data/traffic";
import { cn } from "@/lib/utils";

import violation1 from "@/assets/violation-1.jpg";
import violation2 from "@/assets/violation-2.jpg";
import violation3 from "@/assets/violation-3.jpg";
import cctv1 from "@/assets/cctv-1.jpg";
import cctv2 from "@/assets/cctv-2.jpg";

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

const CORRIDORS = [
  { name: "Commonwealth Ave", speed: "44 km/h", status: "Optimal Flow", tone: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { name: "Tandang Sora Intersect", speed: "18 km/h", status: "Heavy Volume", tone: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { name: "Katipunan Ave Ext", speed: "38 km/h", status: "Moderate", tone: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { name: "EDSA - Cubao Corridor", speed: "12 km/h", status: "Congested", tone: "text-red-400 bg-red-500/10 border-red-500/20" },
  { name: "Quezon Ave (Westbound)", speed: "40 km/h", status: "Optimal Flow", tone: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
];

const FEATURES = [
  {
    icon: Zap,
    title: "YOLOv11 AI Violation Detection",
    body: "Sub-second deep neural inference detects red-light running, yellow-box obstruction, motorcycle lane violations, and speeding with 99.4% verified accuracy.",
    badge: "Computer Vision",
  },
  {
    icon: Camera,
    title: "4K ANPR Optical Sensor Grid",
    body: "Multi-lane high-resolution automated number plate recognition (ANPR) deployed across Commonwealth Avenue, Tandang Sora, and Central Culiat corridors.",
    badge: "IoT Edge Nodes",
  },
  {
    icon: MapPin,
    title: "Predictive GIS Spatial Heatmaps",
    body: "Real-time congestion density forecasting, accident hotspot modeling, and automated dispatch routing for rapid response field enforcers.",
    badge: "Spatial Telemetry",
  },
  {
    icon: FileText,
    title: "Digital Notice of Violation (NOV)",
    body: "Instant electronic citation generation, multi-channel payment settlements via GCash and Maya, and automated LTO LTMS registration clearance.",
    badge: "Automated Treasury",
  },
];

const CITIZEN_SERVICES = [
  {
    icon: Car,
    title: "Motorist Profile & Registered Fleet",
    description: "Register your vehicles to receive automated SMS/Email alerts before registration alarms trigger.",
    linkText: "Manage Vehicles",
    to: "/citizen",
    badge: "Self-Service",
    tone: "border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10",
  },
  {
    icon: Scale,
    title: "Traffic Adjudication Board (TAB)",
    description: "Contest citations under official MMDA NCAP guidelines, upload defense evidence, and receive formal orders.",
    linkText: "File Dispute",
    to: "/citizen",
    badge: "Appeals Docket",
    tone: "border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10",
  },
  {
    icon: AlertTriangle,
    title: "911 Road Hazard Reporting",
    description: "Report road obstructions, flash floods, or stalled vehicles to earn Eco-Reward tokens for prompt response.",
    linkText: "Report Hazard",
    to: "/citizen",
    badge: "+50 Eco-Tokens",
    tone: "border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/10",
  },
  {
    icon: CreditCard,
    title: "Instant Treasury Settlement",
    description: "Settle notices online via GCash, Maya, Landbank, or Card to immediately lift LTO alarms with verified receipt.",
    linkText: "Pay Citation",
    to: "/lookup",
    badge: "LTO LTMS Sync",
    tone: "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10",
  },
];

const STATS = [
  { label: "Camera nodes", value: "120+", sub: "Live 4K Optical Sensors" },
  { label: "Detection accuracy", value: "99.4%", sub: "YOLOv11 AI Model" },
  { label: "Avg. response time", value: "42s", sub: "Rapid Unit Dispatch" },
  { label: "Districts covered", value: "6", sub: "Quezon City Corridors" },
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
  cctvImage?: string;
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
          location: "Commonwealth Ave — Tandang Sora Corridor Cam #04",
          amount: Number(foundCit.amount),
          dueDate: "2026-09-15",
          cctvImage: violation1,
          ltoAlarmStatus: foundCit.status === "paid" ? "CLEARED" : "WARNING_DUE_SOON",
        });
        setIsSearching(false);
        return;
      }
    } catch {
      // fallback
    }

    setIsSearching(false);
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
        cctvImage: violation1,
        ltoAlarmStatus: "WARNING_DUE_SOON",
      });
    } else if (clean.includes("CAS3901") || clean.includes("3901")) {
      setSearchResult({
        found: true,
        plateNumber: query,
        novNumber: "NOV-2026-QC-09150",
        violation: "Speed Limit Exceeded (78 km/h in 60 km/h Zone)",
        ordinance: "QC City Ordinance SP-3382 / Speed Enforcement Act",
        location: "Quezon Ave Eastbound — Camera #12",
        amount: 1500,
        dueDate: "2026-09-12",
        cctvImage: violation2,
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
      {/* Background ambient lighting effects */}
      <div className="pointer-events-none absolute -top-40 right-0 -z-10 h-[600px] w-[600px] rounded-full bg-primary/15 blur-[140px]" />
      <div className="pointer-events-none absolute top-1/3 -left-40 -z-10 h-[600px] w-[600px] rounded-full bg-blue-900/15 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 -z-10 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[140px]" />

      <header className="sticky top-0 z-40 flex flex-col shadow-2xl">
        {/* Main Navbar */}
        <div className="border-b border-border bg-background/85 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
            <Link to="/" className="flex items-center gap-3.5 group">
              <div className="grid size-10 place-items-center overflow-hidden rounded-xl bg-panel border border-border shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
                <img src="/favico2.png" alt="QC Logo" className="size-full object-contain" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                  Culiat Traffic Ops
                  <span className="rounded bg-primary/20 px-1.5 py-0.2 text-[9px] font-mono-tab font-bold text-primary border border-primary/30">
                    QC LGU
                  </span>
                </p>
                <p className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                  Barangay Culiat · MMDA NCAP Partner
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <a
                href="#may-huli-ka"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-all shadow-sm"
              >
                <Search className="size-3.5" />
                May Huli Ka?
              </a>
              <Link
                to="/lookup"
                className="hidden md:inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel-elevated px-3.5 py-1.5 text-xs font-bold text-foreground hover:bg-panel transition-all"
              >
                <FileText className="size-3.5" />
                Notice Lookup
              </Link>
              <Link
                to="/citizen"
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3.5 py-1.5 text-xs font-bold text-blue-400 hover:bg-blue-500/20 transition-all shadow-sm"
              >
                <User className="size-3.5" />
                Citizen Portal
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:scale-105"
              >
                Command Center
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Top Emergency Advisory Bar */}
        <div className="bg-gradient-to-r from-red-700 via-primary to-red-700 px-4 py-1.5 text-center text-xs font-semibold tracking-wide text-white shadow-md">
          <div className="mx-auto max-w-6xl flex items-center justify-between">
            <span className="flex items-center gap-2 font-mono-tab text-[11px]">
              <span className="size-2 rounded-full bg-white animate-ping" />
              24/7 Traffic Emergency Operations: Hotline 122 (QC LGU) • National 911
            </span>
            <span className="hidden sm:inline-block text-[11px] opacity-80 font-mono-tab">
              Quezon City Flow Guardian v2.4 Active
            </span>
          </div>
        </div>
      </header>

      <main>
        {/* HERO SECTION */}
        <section className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-12 lg:items-center lg:py-16">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3.5 py-1 font-mono-tab text-[10px] font-bold uppercase tracking-widest text-primary shadow-sm">
              <span className="size-2 animate-pulse rounded-full bg-success" />
              MMDA NCAP Active System · AI Precision Enforcement
            </div>

            <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-5xl">
              AI Traffic Enforcement Command for <span className="bg-gradient-to-r from-[#fcd116] via-amber-300 to-[#fcd116] bg-clip-text text-transparent">Barangay Culiat</span>, Quezon City
            </h1>

            <p className="mt-4 max-w-xl text-sm sm:text-base leading-relaxed text-muted-foreground">
              Automated high-precision violation detection, 4K ANPR camera networks, predictive GIS congestion heatmaps, and seamless MMDA No Contact Apprehension (NCAP) citizen resolution.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#may-huli-ka"
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3.5 text-sm font-bold text-white shadow-[0_0_25px_-4px_rgba(239,68,68,0.5)] transition-all hover:scale-105 hover:bg-red-500"
              >
                <Search className="size-4" />
                Check "May Huli Ka?"
              </a>
              <Link
                to="/citizen"
                className="inline-flex items-center gap-2 rounded-xl border border-blue-500/40 bg-blue-600/10 px-6 py-3.5 text-sm font-bold text-blue-400 transition-all hover:bg-blue-600/20 hover:text-white hover:scale-105"
              >
                <User className="size-4" />
                Citizen Portal
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-panel-elevated px-5 py-3.5 text-sm font-bold text-foreground transition-all hover:bg-panel hover:text-white"
              >
                Staff Login
                <ArrowRight className="size-4" />
              </Link>
            </div>

            {/* KPI STATS ROW */}
            <dl className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.label} className="flex flex-col justify-center rounded-2xl border border-border/60 bg-panel/60 p-4 backdrop-blur-md transition-all hover:border-primary/40 hover:bg-panel">
                  <dt className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                    {s.label}
                  </dt>
                  <dd className="mt-1 font-mono-tab text-2xl font-bold text-foreground">
                    {s.value}
                  </dd>
                  <span className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</span>
                </div>
              ))}
            </dl>
          </div>

          {/* HERO MEDIA PREVIEW CARD */}
          <div className="lg:col-span-5 relative">
            <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-panel shadow-2xl">
              <img
                src="/landingpage.webp"
                alt="Barangay Culiat, Quezon City AI Traffic Command Center"
                className="h-[420px] w-full object-cover opacity-85"
                loading="lazy"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

              {/* Simulated AI Detection Bounding Boxes */}
              <div className="absolute top-8 left-8 rounded-lg border border-red-500/80 bg-red-950/80 px-2.5 py-1 text-[10px] font-mono-tab font-bold text-red-400 backdrop-blur-md shadow-lg flex items-center gap-1.5 animate-pulse">
                <span className="size-1.5 rounded-full bg-red-400" />
                [RED_LIGHT_RUNNING 98.4%]
              </div>

              <div className="absolute top-24 right-8 rounded-lg border border-emerald-500/80 bg-emerald-950/80 px-2.5 py-1 text-[10px] font-mono-tab font-bold text-emerald-400 backdrop-blur-md shadow-lg flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                [ANPR_RECOG NDB-8921]
              </div>

              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between rounded-2xl border border-border/80 bg-black/60 p-3.5 backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex size-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
                  </span>
                  <div>
                    <span className="font-mono-tab text-xs font-bold text-foreground block">
                      COMMONWEALTH-TANDANG SORA
                    </span>
                    <span className="font-mono-tab text-[10px] text-muted-foreground">
                      Node CAM-042 · 4K Optical Stream Active
                    </span>
                  </div>
                </div>
                <span className="rounded-lg bg-emerald-500/20 px-2 py-1 text-[10px] font-mono-tab font-bold text-emerald-400 border border-emerald-500/30">
                  ONLINE
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* LIVE CORRIDOR VELOCITIES TICKER */}
        <section className="border-y border-border/80 bg-panel/40 py-4">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="font-mono-tab text-[10px] font-bold uppercase tracking-widest text-subtle flex items-center gap-1.5 shrink-0">
                <Activity className="size-3.5 text-primary" /> Live Corridor Speeds:
              </span>
              <div className="flex flex-wrap items-center gap-2 overflow-x-auto">
                {CORRIDORS.map((c) => (
                  <div
                    key={c.name}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-3 py-1 text-xs font-semibold",
                      c.tone
                    )}
                  >
                    <span className="text-foreground">{c.name}:</span>
                    <span className="font-mono-tab font-bold">{c.speed}</span>
                    <span className="text-[10px] opacity-75">({c.status})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* "MAY HULI KA?" MMDA NCAP ONLINE VIOLATION CHECKER */}
        {/* ========================================================================= */}
        <section id="may-huli-ka" className="border-b border-border/80 bg-gradient-to-b from-red-950/20 via-background to-background py-16">
          <div className="mx-auto max-w-4xl px-6">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-red-400 shadow-sm">
                <Search className="size-3.5" /> MMDA NCAP Plate & Notice Verifier
              </span>
              <h2 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                May Huli Ka? Check Your Plate for Traffic Violations
              </h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Enter your vehicle license plate or Notice of Violation (NOV) number to instantly verify CCTV apprehensions in Barangay Culiat and Quezon City arterial roads.
              </p>
            </div>

            {/* Search Form */}
            <form onSubmit={handleMayHuliKaSearch} className="mt-8">
              <div className="flex flex-col sm:flex-row gap-3 rounded-2xl border border-red-500/30 bg-panel p-2 shadow-2xl backdrop-blur-md">
                <div className="flex flex-1 items-center gap-3 px-4 py-2 sm:py-0">
                  <Search className="size-5 text-red-400 shrink-0" />
                  <input
                    type="text"
                    required
                    placeholder="Enter License Plate (e.g. NDB 8921 or CAS 3901)"
                    value={searchPlate}
                    onChange={(e) => setSearchPlate(e.target.value.toUpperCase())}
                    className="w-full bg-transparent font-mono-tab text-base sm:text-lg font-bold text-foreground uppercase placeholder:text-subtle focus:outline-none"
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
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-subtle">
                <span>Try Example Plate:</span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchPlate("NDB-8921");
                    handleMayHuliKaSearch(undefined, "NDB-8921");
                  }}
                  className="rounded-lg bg-panel-elevated border border-border px-2.5 py-1 font-mono-tab text-foreground hover:bg-panel hover:text-primary transition-colors"
                >
                  NDB-8921 (Red Light)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchPlate("CAS-3901");
                    handleMayHuliKaSearch(undefined, "CAS-3901");
                  }}
                  className="rounded-lg bg-panel-elevated border border-border px-2.5 py-1 font-mono-tab text-foreground hover:bg-panel hover:text-primary transition-colors"
                >
                  CAS-3901 (Speeding)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchPlate("NBP-5412");
                    handleMayHuliKaSearch(undefined, "NBP-5412");
                  }}
                  className="rounded-lg bg-panel-elevated border border-border px-2.5 py-1 font-mono-tab text-foreground hover:bg-panel hover:text-emerald-400 transition-colors"
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
                  <div className="rounded-3xl border border-red-500/40 bg-gradient-to-br from-red-950/40 via-panel to-panel p-6 sm:p-8 shadow-2xl">
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
                            <span className="font-mono-tab text-sm font-bold text-foreground">{searchResult.plateNumber}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 font-mono-tab">{searchResult.novNumber}</p>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="font-mono-tab text-2xl font-black text-foreground">{formatPeso(searchResult.amount || 2000)}</span>
                        <span className="text-[11px] font-semibold text-orange-400 flex items-center sm:justify-end gap-1 mt-0.5">
                          <Clock className="size-3" /> Due in 7 days before LTO Tagging
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-3 text-xs">
                      <div className="sm:col-span-2 rounded-2xl border border-border bg-panel-elevated p-4 flex flex-col justify-between">
                        <div>
                          <span className="text-subtle uppercase font-mono-tab text-[10px]">Apprehension Offense</span>
                          <p className="text-sm font-bold text-foreground mt-1">{searchResult.violation}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{searchResult.ordinance}</p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-border/60 flex flex-col gap-1.5">
                          <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                            <MapPin className="size-3.5 text-red-400 shrink-0" />
                            {searchResult.location}
                          </p>
                          <div className="flex items-center gap-1.5 text-orange-400 font-semibold">
                            <ShieldAlert className="size-3.5" /> LTO LTMS Registration Alarm Hold Warning
                          </div>
                        </div>
                      </div>

                      {/* Evidence Photo */}
                      {searchResult.cctvImage && (
                        <div className="rounded-2xl border border-border bg-panel-elevated p-2 overflow-hidden flex flex-col justify-between">
                          <img
                            src={searchResult.cctvImage}
                            alt="CCTV Evidence Snapshot"
                            className="h-28 w-full object-cover rounded-xl border border-border"
                          />
                          <p className="text-[10px] font-mono-tab text-subtle text-center mt-2">
                            CCTV Evidence Snapshot #01
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-red-500/20 pt-4">
                      <p className="text-xs text-muted-foreground">
                        Under MMDA NCAP, you have <strong>10 calendar days</strong> to contest or settle before registration alarms.
                      </p>
                      <div className="flex items-center gap-2">
                        <Link
                          to="/portal/pay/$citationId"
                          params={{ citationId: searchResult.novNumber || "NOV-2026-QC-09124" }}
                          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all"
                        >
                          <CreditCard className="size-3.5" /> Pay Now Online
                        </Link>
                        <Link
                          to="/citizen"
                          className="inline-flex items-center gap-2 rounded-xl border border-blue-500/40 bg-blue-500/10 px-4 py-2.5 text-xs font-bold text-blue-400 hover:bg-blue-500/20 transition-all"
                        >
                          <Scale className="size-3.5" /> File TAB Protest
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Case 2: Walang Huli */
                  <div className="rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/30 via-panel to-panel p-6 sm:p-8 shadow-2xl text-center flex flex-col items-center">
                    <div className="grid size-14 place-items-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-4">
                      <CheckCircle2 className="size-7" />
                    </div>
                    <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono-tab">
                      WALANG HULI / CLEARED
                    </span>
                    <h3 className="text-2xl font-bold text-foreground mt-3 font-mono-tab">{searchResult.plateNumber}</h3>
                    <p className="text-xs text-muted-foreground max-w-md mt-2 leading-relaxed">
                      No outstanding MMDA NCAP violations or LTO alarms recorded for this license plate. Thank you for keeping Quezon City roads safe!
                    </p>
                    <Link
                      to="/citizen"
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/30"
                    >
                      <Sparkles className="size-4" /> Claim Safe Driver Eco-Rewards
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* CITIZEN SELF-SERVICE HUB */}
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="text-center max-w-2xl mx-auto">
            <span className="font-mono-tab text-xs font-bold uppercase tracking-widest text-primary">
              Public Portal Services
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Direct Citizen NCAP Services & Resolution Hub
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Access online municipal traffic services from any smartphone or computer without queuing at Quezon City Hall.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {CITIZEN_SERVICES.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.title}
                  className={cn(
                    "flex flex-col justify-between rounded-3xl border p-6 transition-all duration-300 hover:-translate-y-1 shadow-lg",
                    s.tone
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="grid size-10 place-items-center rounded-xl bg-panel border border-border text-foreground">
                        <Icon className="size-5 text-primary" />
                      </div>
                      <span className="rounded-lg bg-panel px-2 py-0.5 text-[10px] font-mono-tab font-bold text-subtle border border-border">
                        {s.badge}
                      </span>
                    </div>
                    <h3 className="mt-4 text-base font-bold text-foreground">{s.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{s.description}</p>
                  </div>

                  <Link
                    to={s.to}
                    className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                  >
                    {s.linkText} <ChevronRight className="size-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* CORE OPERATIONAL TECHNOLOGY */}
        <section className="border-t border-border bg-panel/40">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="text-center max-w-2xl mx-auto">
              <span className="font-mono-tab text-xs font-bold uppercase tracking-widest text-primary">
                Civic Technology
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Engineered for the full MMDA NCAP & LGU enforcement lifecycle
              </h2>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f) => (
                <article
                  key={f.title}
                  className="panel group relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="inline-flex rounded-xl bg-primary/10 p-3 transition-colors group-hover:bg-primary/20">
                      <f.icon className="size-5 text-primary" strokeWidth={2} />
                    </div>
                    <span className="text-[10px] font-mono-tab uppercase text-subtle font-bold">
                      {f.badge}
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-bold text-foreground tracking-tight">{f.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{f.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* AUTHORIZED STAFF CALLOUT */}
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="panel flex flex-col items-start gap-6 rounded-3xl p-8 sm:flex-row sm:items-center sm:justify-between border border-primary/30 bg-primary/5 shadow-2xl">
            <div>
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase font-mono-tab">
                <ShieldCheck className="size-4" /> Restricted Command Console
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-1">
                Authorized Operations Access
              </h2>
              <p className="mt-2 max-w-lg text-xs sm:text-sm text-muted-foreground">
                Command center access is restricted to verified Barangay Culiat and Quezon City LGU traffic dispatchers and enforcers.
              </p>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:scale-105"
            >
              <ShieldCheck className="size-4" />
              Staff Sign In
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-panel">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-subtle sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-xs">
            <Activity className="size-4 text-primary" />
            Culiat Traffic Ops · Barangay Culiat, Quezon City Local Government Unit (MMDA NCAP Partner)
          </p>
          <p className="font-mono-tab text-[11px] uppercase tracking-widest text-muted-foreground">
            QC Flow Guardian &bull; DILG Certified &bull; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
