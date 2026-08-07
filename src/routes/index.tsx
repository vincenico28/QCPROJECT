import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Camera, FileText, MapPin, ShieldCheck, Zap, ArrowRight, User } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Culiat Traffic Ops — AI Traffic Enforcement for Barangay Culiat, Quezon City" },
      {
        name: "description",
        content:
          "AI-powered traffic violation detection, IoT camera monitoring, and digital citations for the Barangay Culiat, Quezon City LGU enforcement teams.",
      },
      {
        property: "og:title",
        content: "Culiat Traffic Ops — AI Traffic Enforcement for Barangay Culiat, Quezon City",
      },
      {
        property: "og:description",
        content:
          "Detect violations automatically, monitor the CCTV grid in real time, and issue digital citations from one command center.",
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
    title: "AI Violation Detection",
    body: "Computer-vision models flag red-light running, illegal parking, and lane violations with confidence scoring on every event.",
  },
  {
    icon: Camera,
    title: "IoT Camera Grid",
    body: "Monitor uptime, health, and detection throughput of every enforcement node deployed across the city.",
  },
  {
    icon: MapPin,
    title: "GIS Hotspot Analytics",
    body: "Interactive heatmaps with time-range playback, road-segment filters, and one-click CSV export.",
  },
  {
    icon: FileText,
    title: "Digital Citations",
    body: "Issue, track, and reconcile citations with live revenue, outstanding balances, and contest handling.",
  },
];

const STATS = [
  { label: "Camera nodes", value: "120+" },
  { label: "Detection accuracy", value: "94.6%" },
  { label: "Avg. citation time", value: "42s" },
  { label: "Districts covered", value: "6" },
];

function LandingPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute -top-40 right-0 -z-10 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute top-1/2 left-0 -z-10 h-[500px] w-[500px] rounded-full bg-blue-900/20 blur-[120px]" />
      <header className="sticky top-0 z-20 flex flex-col shadow-xl">
        {/* Main Navbar */}
        <div className="border-b border-border bg-background/95 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-6">
            <div className="grid size-10 place-items-center overflow-hidden rounded-xl shadow-lg shadow-primary/30">
              <img src="/favico2.png" alt="QC Logo" className="size-full object-contain" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">Culiat Traffic Ops</p>
              <p className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                Barangay Culiat, Quezon City LGU
              </p>
            </div>
            <Link
              to="/dashboard"
              className="ml-auto inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90"
            >
              Enter Command Center
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
        
        {/* Red Banner */}
        <div className="bg-[#cc0000] px-4 py-2 text-center text-xs font-semibold tracking-wide text-white shadow-md">
          <span className="flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            24/7 Traffic Emergency Hotline: 911
          </span>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-panel px-3 py-1 font-mono-tab text-[10px] uppercase tracking-widest text-primary">
              <span className="size-1.5 animate-pulse rounded-full bg-success" />
              Live enforcement grid
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
              AI traffic enforcement command for <span className="text-[#fcd116]">Barangay Culiat</span>, Quezon City
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
              One operations console for automated violation detection, IoT camera health, GIS
              hotspot analytics, and digital citation issuance — built for QC enforcement units.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-[0_0_30px_-5px_var(--color-primary)] transition-all hover:scale-[1.02] hover:bg-primary/90 hover:shadow-[0_0_40px_-5px_var(--color-primary)]"
              >
                Open dashboard
                <ArrowRight className="size-5" />
              </Link>
              <Link
                to="/cameras"
                className="inline-flex items-center gap-2 rounded-xl border border-border-strong bg-panel px-6 py-3.5 text-sm font-bold text-foreground transition-all hover:bg-panel-elevated hover:text-white"
              >
                <Camera className="size-5 text-muted-foreground transition-colors group-hover:text-white" />
                View camera grid
              </Link>
              <Link
                to="/citizen"
                className="inline-flex items-center gap-2 rounded-xl border border-border-strong bg-[#0066cc]/10 px-6 py-3.5 text-sm font-bold text-[#0066cc] transition-all hover:bg-[#0066cc]/20 hover:text-white"
              >
                <User className="size-5" />
                Citizen Portal
              </Link>
            </div>
            <dl className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.label} className="flex flex-col justify-center rounded-2xl border border-border/50 bg-white/5 p-5 backdrop-blur-sm transition-colors hover:bg-white/10">
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

          <div className="relative overflow-hidden rounded-[2rem] border border-border/50 bg-panel shadow-2xl lg:h-[600px]">
            <div className="absolute inset-0 z-10 bg-gradient-to-tr from-background/90 via-background/20 to-transparent"></div>
            <img
              src="/landingpage.webp"
              alt="Barangay Culiat, Quezon City traffic enforcement"
              className="h-full w-full object-cover opacity-80"
              loading="lazy"
            />
            {/* Decorative UI elements overlaid on map */}
            <div className="absolute bottom-6 left-6 z-20 flex items-center gap-3 rounded-full border border-white/10 bg-black/40 px-4 py-2 backdrop-blur-md">
              <span className="relative flex size-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex size-3 rounded-full bg-primary"></span>
              </span>
              <span className="font-mono-tab text-xs font-medium text-white tracking-widest uppercase">Live Link Active</span>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-panel/40">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="text-2xl font-semibold tracking-tight">
              Built for the full enforcement workflow
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

        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="panel flex flex-col items-start gap-6 rounded-2xl p-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Authorized personnel access</h2>
              <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                Operational data is restricted to signed-in QC enforcement staff. Sign in to reach
                live detections, camera diagnostics, and citation records.
              </p>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90"
            >
              <ShieldCheck className="size-4" />
              Staff sign in
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-subtle sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2">
            <Activity className="size-4 text-primary" />
            Culiat Traffic Ops · Barangay Culiat, Quezon City Local Government Unit
          </p>
          <p className="font-mono-tab text-[10px] uppercase tracking-widest">
            Internal system · {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
