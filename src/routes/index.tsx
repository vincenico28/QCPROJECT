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
  ArrowUpRight,
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
import { getPrimaryEvidenceUrl } from "@/lib/storage";
import { useRevealOnScroll } from "@/hooks/use-reveal";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";

import violation1 from "@/assets/violation-1.jpg";
import violation2 from "@/assets/violation-2.jpg";
import violation3 from "@/assets/violation-3.jpg";
import cctv1 from "@/assets/cctv-1.jpg";
import cctv2 from "@/assets/cctv-2.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "May Huli Ka — Culiat Public Safety & Traffic Ops" },
      {
        name: "description",
        content:
          "May Huli Ka? Instant MMDA No Contact Apprehension Policy (NCAP) license plate verification for Barangay Culiat, Quezon City. Check active Notices of Violation (NOV), LTO hold alarms, and settle fines online.",
      },
      {
        property: "og:title",
        content: "May Huli Ka · Culiat Public Safety NCAP Verifier",
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
  { name: "Commonwealth Ave", speed: "44 km/h", status: "Optimal Flow", tone: "text-primary border-primary/30 bg-primary/10" },
  { name: "Tandang Sora Intersect", speed: "18 km/h", status: "Heavy Volume", tone: "text-amber-500 border-amber-500/30 bg-amber-500/10" },
  { name: "Katipunan Ave Ext", speed: "38 km/h", status: "Moderate", tone: "text-primary border-primary/30 bg-primary/10" },
  { name: "EDSA - Cubao Corridor", speed: "12 km/h", status: "Congested", tone: "text-destructive border-destructive/30 bg-destructive/10" },
  { name: "Quezon Ave (Westbound)", speed: "40 km/h", status: "Optimal Flow", tone: "text-primary border-primary/30 bg-primary/10" },
];

const FEATURES = [
  {
    icon: Zap,
    eyebrow: "Neural Inference",
    title: "YOLOv11 AI Violation Detection",
    body: "Sub-second deep neural inference detects red-light running, yellow-box obstruction, motorcycle lane violations, and speeding with 99.4% verified accuracy.",
    badge: "Computer Vision",
  },
  {
    icon: Camera,
    eyebrow: "Optical Telemetry",
    title: "4K ANPR Sensor Grid",
    body: "Multi-lane high-resolution automated number plate recognition (ANPR) deployed across Commonwealth Avenue, Tandang Sora, and Central Culiat corridors.",
    badge: "IoT Edge Nodes",
  },
  {
    icon: MapPin,
    eyebrow: "Spatial Intelligence",
    title: "Predictive GIS Heatmaps",
    body: "Real-time congestion density forecasting, accident hotspot modeling, and automated dispatch routing for rapid response field enforcers.",
    badge: "Spatial Telemetry",
  },
  {
    icon: FileText,
    eyebrow: "Digital Enforcement",
    title: "Digital Notice of Violation",
    body: "Instant electronic citation generation, multi-channel payment settlements via GCash and Maya, and automated LTO LTMS registration clearance.",
    badge: "Automated Treasury",
  },
];

const CITIZEN_SERVICES = [
  {
    icon: Search,
    eyebrow: "Instant Verification",
    title: "May Huli Ka? Online Verifier",
    description: "Search your motor vehicle or motorcycle plate number for real-time camera apprehensions with high-resolution CCTV evidence frames.",
    linkText: "Check My Plate",
    to: "#may-huli-ka",
    badge: "Public Access",
  },
  {
    icon: FileCheck2,
    eyebrow: "Official Clearance",
    title: "Notice of Violation Lookup",
    description: "Retrieve complete citation details, ordinance violation breakdown, issued date, and official LTO clearance status.",
    linkText: "Search Notice",
    to: "/lookup",
    badge: "NOV Records",
  },
  {
    icon: Scale,
    eyebrow: "Due Process",
    title: "Traffic Adjudication Board",
    description: "Submit a formal online protest with supporting dashcam evidence to request board review for contested apprehensions.",
    linkText: "File Contest",
    to: "/citizen",
    badge: "TAB Appeals",
  },
  {
    icon: CreditCard,
    eyebrow: "Instant Treasury",
    title: "Instant Payment Settlement",
    description: "Settle notices online via GCash, Maya, Landbank, or Card to immediately lift LTO alarms with verified electronic receipt.",
    linkText: "Pay Citation",
    to: "/lookup",
    badge: "LTO LTMS Sync",
  },
];

const STATS = [
  { label: "Camera Nodes", value: "120+", sub: "Live 4K Optical Sensors" },
  { label: "Detection Accuracy", value: "99.4%", sub: "YOLOv11 AI Engine" },
  { label: "Avg. Response Time", value: "42s", sub: "Rapid Unit Dispatch" },
  { label: "Corridors Enforced", value: "6", sub: "Quezon City Corridors" },
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
  useRevealOnScroll();

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
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: citations, error } = await supabase
        .from("citations")
        .select("*, violations(evidence_url, location, camera_code)")
        .order("issued_at", { ascending: false })
        .limit(100);

      if (!error && citations && citations.length > 0) {
        const matching = citations.filter((c: any) => {
          const cClean = (c.plate_number || "").replace(/[^A-Z0-9]/g, "").toUpperCase();
          const citClean = (c.citation_number || "").replace(/[^A-Z0-9]/g, "").toUpperCase();
          return cClean.includes(clean) || clean.includes(cClean) || citClean.includes(clean);
        });

        if (matching.length > 0) {
          const activeUnpaid = matching.find((c: any) => c.status === "unpaid" || c.status === "issued") || matching[0];
          const isPaid = activeUnpaid.status === "paid" || activeUnpaid.status === "settled";
          const snapUrl = getPrimaryEvidenceUrl(activeUnpaid.evidence_url || activeUnpaid.violations?.evidence_url) || violation1;

          setSearchResult({
            found: !isPaid,
            plateNumber: activeUnpaid.plate_number || query,
            novNumber: activeUnpaid.citation_number,
            violation: activeUnpaid.offense,
            ordinance: "MMDA Reg. No. 16-002 / QC Ord. SP-2957",
            location: (activeUnpaid as any).violations?.location || (activeUnpaid as any).location || "Commonwealth Ave — Tandang Sora Corridor Cam #04",
            amount: Number(activeUnpaid.amount) || 1000,
            dueDate: new Date(new Date(activeUnpaid.issued_at || Date.now()).getTime() + 10 * 86400000).toISOString().slice(0, 10),
            cctvImage: snapUrl,
            ltoAlarmStatus: isPaid ? "CLEARED" : "LTO_ALARM_ACTIVE",
          });
          setIsSearching(false);
          return;
        }
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
    <div className="min-h-screen bg-background text-foreground">
      {/* STICKY HEADER (Culiat Public Safety Signature Lockup) */}
      <header className="fixed inset-x-0 top-0 z-50 h-20 lg:h-24 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-[100rem] items-center justify-between px-5 sm:px-8 lg:px-12">
          {/* Brand Seal + Two-line Lockup */}
          <Link to="/" className="flex items-center gap-3.5 group">
            <img
              src="/favico2.png"
              alt="Barangay Culiat Official Seal"
              className="size-11 sm:size-13 lg:size-14 object-contain transition-transform group-hover:scale-105"
            />
            <div className="min-w-0">
              <p className="font-display text-base sm:text-lg font-extrabold tracking-tight text-foreground leading-tight">
                Culiat Public Safety
              </p>
              <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-[0.16em] text-muted-foreground">
                Quezon City · Traffic Ops
              </p>
            </div>
          </Link>

          {/* Navigation Links & Action Controls */}
          <nav className="flex items-center gap-2 sm:gap-3">
            <a
              href="#may-huli-ka"
              className="hidden sm:inline-flex rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              May Huli Ka?
            </a>
            <Link
              to="/lookup"
              className="hidden md:inline-flex rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Notice Lookup
            </Link>
            <Link
              to="/citizen"
              className="hidden lg:inline-flex rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Citizen Portal
            </Link>

            <ThemeToggle />

            <Button asChild size="sm" variant="primary">
              <Link to="/dashboard">
                Command Center
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="pt-20 lg:pt-24">
        {/* HERO SECTION */}
        <section className="civic-grid relative overflow-hidden px-5 py-20 sm:px-8 lg:px-12 lg:py-28 scroll-mt-24">
          <div className="mx-auto grid max-w-[100rem] gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Hero Column */}
            <div className="animate-rise lg:col-span-7">
              <p className="section-label">
                MMDA NCAP ACTIVE SYSTEM · AI PRECISION ENFORCEMENT
              </p>

              <h1 className="mt-4 font-display text-5xl font-black leading-[1.02] text-foreground sm:text-6xl lg:text-7xl">
                AI Traffic Enforcement for <span className="text-primary">Barangay Culiat</span>, Quezon City
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                Automated high-precision violation detection, 4K ANPR camera networks, predictive GIS congestion heatmaps, and seamless MMDA No Contact Apprehension (NCAP) citizen resolution.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" variant="primary">
                  <a href="#may-huli-ka">
                    <Search className="size-4" />
                    Check "May Huli Ka?"
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/citizen">
                    <User className="size-4" />
                    Citizen Portal
                  </Link>
                </Button>
                <Button asChild size="lg" variant="ghost">
                  <Link to="/dashboard">
                    Staff Login
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>

              {/* KPI STATS ROW */}
              <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {STATS.map((s) => (
                  <div
                    key={s.label}
                    data-reveal
                    className="flex flex-col justify-center rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-md transition-all hover:border-primary/40"
                  >
                    <span className="font-display text-2xl lg:text-3xl font-black text-primary">
                      {s.value}
                    </span>
                    <span className="mt-1 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                      {s.label}
                    </span>
                    <span className="text-xs text-muted-foreground mt-0.5">
                      {s.sub}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Hero Column: Media Card with Floating Motion */}
            <div className="animate-float lg:col-span-5">
              <div className="relative overflow-hidden rounded-3xl border border-border bg-card/95 p-3 shadow-2xl backdrop-blur-xl">
                <div className="relative overflow-hidden rounded-2xl">
                  <img
                    src="/landingpage.webp"
                    alt="Barangay Culiat AI Traffic Command Center"
                    className="h-[400px] w-full object-cover"
                    loading="lazy"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  {/* Simulated AI Detection Overlays */}
                  <div className="absolute top-4 left-4 rounded-full border border-destructive/80 bg-destructive/90 px-3 py-1 text-xs font-bold text-destructive-foreground backdrop-blur-md shadow-lg flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-destructive-foreground animate-ping" />
                    RED LIGHT RUNNING 98.4%
                  </div>

                  <div className="absolute top-16 right-4 rounded-full border border-primary/80 bg-primary/90 px-3 py-1 text-xs font-bold text-primary-foreground backdrop-blur-md shadow-lg flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-primary-foreground" />
                    ANPR NDB-8921
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl border border-white/10 bg-black/70 p-3.5 backdrop-blur-md text-white">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex size-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
                      </span>
                      <div>
                        <span className="font-display text-xs font-extrabold block">
                          COMMONWEALTH-TANDANG SORA
                        </span>
                        <span className="text-[10px] text-zinc-300">
                          Node CAM-042 · 4K Optical Stream Active
                        </span>
                      </div>
                    </div>
                    <span className="rounded-full bg-primary/20 border border-primary/40 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                      ONLINE
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LIVE CORRIDOR VELOCITIES TICKER */}
        <section className="border-y border-border bg-muted/35 py-6">
          <div className="mx-auto max-w-[100rem] px-5 sm:px-8 lg:px-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="section-label flex items-center gap-2 shrink-0">
                <Activity className="size-4 text-primary" /> Live Corridor Speeds:
              </span>
              <div className="flex flex-wrap items-center gap-2.5 overflow-x-auto">
                {CORRIDORS.map((c) => (
                  <div
                    key={c.name}
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-semibold",
                      c.tone
                    )}
                  >
                    <span className="text-foreground">{c.name}:</span>
                    <span className="font-bold">{c.speed}</span>
                    <span className="text-[10px] opacity-75">({c.status})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* "MAY HULI KA?" CITIZEN PLATE VERIFIER */}
        <section id="may-huli-ka" className="px-5 py-20 sm:px-8 lg:px-12 lg:py-28 scroll-mt-24">
          <div className="mx-auto max-w-4xl">
            <div className="text-center max-w-xl mx-auto" data-reveal>
              <p className="section-label">MMDA NCAP CITIZEN VERIFIER</p>
              <h2 className="mt-2 font-display text-4xl font-black leading-tight sm:text-5xl text-foreground">
                May Huli Ka Ba?
              </h2>
              <p className="mt-3 text-base leading-7 text-muted-foreground">
                Enter your license plate number below to check active Notices of Violation, view CCTV camera capture frames, and avoid LTO LTMS registration hold alarms.
              </p>
            </div>

            <form
              onSubmit={handleMayHuliKaSearch}
              data-reveal
              className="mt-10 rounded-3xl border border-border bg-card/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchPlate}
                    onChange={(e) => setSearchPlate(e.target.value.toUpperCase())}
                    placeholder="ENTER PLATE (E.G. NBA-1121, NDB-8921)"
                    aria-label="Plate number"
                    className="w-full rounded-2xl border border-border bg-muted px-4 py-3.5 pl-12 text-base font-bold uppercase tracking-wider text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring/40"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  variant="primary"
                  disabled={isSearching}
                  className="sm:w-48 cursor-pointer"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Verifying...
                    </>
                  ) : (
                    <>
                      <Search className="size-4" /> Verify Plate
                    </>
                  )}
                </Button>
              </div>

              {/* Plate Presets */}
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-semibold">Test Presets:</span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchPlate("NBA-1121");
                    handleMayHuliKaSearch(undefined, "NBA-1121");
                  }}
                  className="rounded-full bg-destructive/15 border border-destructive/30 px-3 py-1 font-bold text-destructive hover:bg-destructive/25 transition-colors cursor-pointer"
                >
                  NBA-1121 (Ford Raptor AI)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchPlate("NDB-8921");
                    handleMayHuliKaSearch(undefined, "NDB-8921");
                  }}
                  className="rounded-full bg-secondary border border-border px-3 py-1 font-bold text-foreground hover:bg-accent transition-colors cursor-pointer"
                >
                  NDB-8921 (Red Light)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchPlate("CAS-3901");
                    handleMayHuliKaSearch(undefined, "CAS-3901");
                  }}
                  className="rounded-full bg-secondary border border-border px-3 py-1 font-bold text-foreground hover:bg-accent transition-colors cursor-pointer"
                >
                  CAS-3901 (Speeding)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchPlate("NBP-5412");
                    handleMayHuliKaSearch(undefined, "NBP-5412");
                  }}
                  className="rounded-full bg-primary/10 border border-primary/25 px-3 py-1 font-bold text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                >
                  NBP-5412 (Clean Record)
                </button>
              </div>
            </form>

            {/* SEARCH RESULTS */}
            {searchResult && (
              <div className="mt-8 animate-rise">
                {searchResult.found ? (
                  /* Case 1: May Huli */
                  <div className="rounded-3xl border border-destructive/40 bg-card/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
                      <div className="flex items-center gap-3">
                        <span className="grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20">
                          <AlertTriangle className="size-6" />
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-destructive/15 border border-destructive/30 px-3 py-0.5 text-xs font-bold text-destructive">
                              MAY HULI! (Active Notice)
                            </span>
                            <span className="font-display text-base font-extrabold text-foreground">
                              {searchResult.plateNumber}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{searchResult.novNumber}</p>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="font-display text-2xl font-black text-foreground">
                          {formatPeso(searchResult.amount || 2000)}
                        </span>
                        <span className="text-xs font-semibold text-amber-500 flex items-center sm:justify-end gap-1 mt-0.5">
                          <Clock className="size-3.5" /> Due in 7 days before LTO Tagging
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                      <div className="sm:col-span-2 rounded-2xl border border-border bg-muted/60 p-4 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary">
                            Apprehension Offense
                          </span>
                          <p className="text-sm font-bold text-foreground mt-1">{searchResult.violation}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{searchResult.ordinance}</p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-border flex flex-col gap-1.5">
                          <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                            <MapPin className="size-3.5 text-destructive shrink-0" />
                            {searchResult.location}
                          </p>
                          <div className="flex items-center gap-1.5 text-amber-500 font-semibold text-xs">
                            <ShieldAlert className="size-3.5" /> LTO LTMS Registration Alarm Hold Warning
                          </div>
                        </div>
                      </div>

                      {searchResult.cctvImage && (
                        <div className="rounded-2xl border border-border bg-muted/60 p-2 overflow-hidden flex flex-col justify-between">
                          <img
                            src={searchResult.cctvImage}
                            alt="CCTV Evidence Snapshot"
                            className="h-28 w-full object-cover rounded-xl border border-border"
                          />
                          <p className="text-[10px] text-muted-foreground text-center mt-2 font-semibold">
                            CCTV Evidence Snapshot #01
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                      <p className="text-xs text-muted-foreground">
                        Under MMDA NCAP, you have <strong>10 calendar days</strong> to contest or settle before registration holds.
                      </p>
                      <div className="flex items-center gap-2">
                        <Button asChild size="sm" variant="primary">
                          <Link
                            to="/portal/pay/$citationId"
                            params={{ citationId: searchResult.novNumber || "NOV-2026-QC-09124" }}
                          >
                            <CreditCard className="size-3.5" /> Pay Now Online
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link to="/citizen">
                            <Scale className="size-3.5" /> File TAB Protest
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Case 2: Walang Huli */
                  <div className="rounded-3xl border border-primary/40 bg-card/95 p-8 shadow-2xl backdrop-blur-xl text-center flex flex-col items-center">
                    <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 mb-4">
                      <CheckCircle2 className="size-7" />
                    </span>
                    <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary uppercase tracking-widest">
                      WALANG HULI / CLEARED
                    </span>
                    <h3 className="font-display text-3xl font-extrabold text-foreground mt-3">
                      {searchResult.plateNumber}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md mt-2 leading-relaxed">
                      No outstanding MMDA NCAP violations or LTO alarms recorded for this license plate. Thank you for keeping Quezon City roads safe!
                    </p>
                    <Button asChild size="default" variant="primary" className="mt-6">
                      <Link to="/citizen">
                        <Sparkles className="size-4" /> Claim Safe Driver Eco-Rewards
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* CITIZEN SELF-SERVICE SERVICES (Signature Card Recipe) */}
        <section className="border-y border-border bg-muted/35 px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-[100rem]">
            <div className="text-center max-w-2xl mx-auto" data-reveal>
              <p className="section-label">PUBLIC PORTAL SERVICES</p>
              <h2 className="mt-2 font-display text-4xl font-black leading-tight sm:text-5xl text-foreground">
                Citizen NCAP Services & Resolution Hub
              </h2>
              <p className="mt-3 text-base leading-7 text-muted-foreground">
                Access online municipal traffic services from any smartphone or computer without queuing at Quezon City Hall.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {CITIZEN_SERVICES.map((s) => {
                const Icon = s.icon;
                return (
                  <article
                    key={s.title}
                    data-reveal
                    className="system-card group flex min-h-80 flex-col rounded-3xl border border-border bg-card/95 p-6 shadow-2xl backdrop-blur-xl"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary transition-all duration-500 group-hover:rotate-3 group-hover:bg-primary group-hover:text-primary-foreground">
                        <Icon className="size-6" />
                      </span>
                      <ArrowUpRight className="size-5 text-muted-foreground transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-primary" />
                    </div>
                    <p className="mt-8 text-xs font-extrabold uppercase tracking-[0.16em] text-primary">
                      {s.eyebrow}
                    </p>
                    <h3 className="mt-2 font-display text-xl font-extrabold leading-snug">
                      {s.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {s.description}
                    </p>
                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4 text-xs font-semibold text-muted-foreground">
                      <span>{s.badge}</span>
                      <Button asChild size="sm" variant="outline">
                        <Link to={s.to}>{s.linkText}</Link>
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* CORE OPERATIONAL TECHNOLOGY */}
        <section className="px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-[100rem]">
            <div className="text-center max-w-2xl mx-auto" data-reveal>
              <p className="section-label">CIVIC TECHNOLOGY</p>
              <h2 className="mt-2 font-display text-4xl font-black leading-tight sm:text-5xl text-foreground">
                Engineered for the full MMDA NCAP & LGU Lifecycle
              </h2>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <article
                    key={f.title}
                    data-reveal
                    className="system-card group flex min-h-80 flex-col rounded-3xl border border-border bg-card/95 p-6 shadow-2xl backdrop-blur-xl"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary transition-all duration-500 group-hover:rotate-3 group-hover:bg-primary group-hover:text-primary-foreground">
                        <Icon className="size-6" />
                      </span>
                      <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                        {f.badge}
                      </span>
                    </div>
                    <p className="mt-8 text-xs font-extrabold uppercase tracking-[0.16em] text-primary">
                      {f.eyebrow}
                    </p>
                    <h3 className="mt-2 font-display text-xl font-extrabold leading-snug">
                      {f.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {f.body}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* FULL-BLEED BRAND GREEN BAND (Authorized Staff Callout) */}
        <section className="bg-brand-surface text-brand-surface-foreground px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-[100rem]">
            <div
              data-reveal
              className="rounded-3xl border border-brand-surface-foreground/20 bg-brand-surface-foreground/10 p-8 sm:p-12 backdrop-blur-sm flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-surface-foreground/80 flex items-center gap-2">
                  <ShieldCheck className="size-4" /> Restricted Command Console
                </p>
                <h2 className="font-display text-3xl sm:text-4xl font-black mt-2 text-brand-surface-foreground">
                  Authorized Operations Access
                </h2>
                <p className="mt-3 max-w-xl text-sm sm:text-base leading-relaxed text-brand-surface-foreground/90">
                  Command center access is restricted to verified Barangay Culiat and Quezon City LGU traffic dispatchers, field officers, and treasury cashiers.
                </p>
              </div>
              <Button
                asChild
                size="lg"
                className="bg-card text-foreground hover:bg-card/90 shadow-xl shrink-0 cursor-pointer"
              >
                <Link to="/dashboard">
                  <ShieldCheck className="size-4 text-primary" />
                  Staff Sign In
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER (Culiat Public Safety Official Design) */}
      <footer className="w-full bg-footer text-footer-foreground border-t border-border/20 py-16 px-5 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[100rem] flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          {/* Brand Seal + Wordmark Left */}
          <div className="flex items-center gap-4">
            <img
              src="/favico2.png"
              alt="Culiat Official Seal"
              className="size-12 object-contain"
            />
            <div>
              <p className="font-display text-base font-extrabold text-footer-foreground">
                Culiat Public Safety
              </p>
              <p className="text-xs text-footer-muted">
                Barangay Culiat · Quezon City Local Government Unit · MMDA NCAP Partner
              </p>
            </div>
          </div>

          {/* Meta Information Right */}
          <div className="flex flex-col sm:items-end text-xs text-footer-muted gap-1">
            <p className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary animate-pulse" />
              Traffic Operations Hotlines: 122 (QC LGU) · National 911
            </p>
            <p>
              QC Flow Guardian v2.4 · DILG Certified · © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
