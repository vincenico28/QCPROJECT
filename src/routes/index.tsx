import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Camera, FileText, MapPin, ShieldCheck, Zap, ArrowRight } from "lucide-react";
import qcMap from "@/assets/qc-map.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QC Traffic Ops — AI Traffic Enforcement for Quezon City" },
      {
        name: "description",
        content:
          "AI-powered traffic violation detection, IoT camera monitoring, and digital citations for the Quezon City LGU enforcement teams.",
      },
      {
        property: "og:title",
        content: "QC Traffic Ops — AI Traffic Enforcement for Quezon City",
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
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-6">
          <span className="grid size-9 place-items-center rounded-xl bg-primary font-mono-tab text-sm font-bold tracking-tighter text-primary-foreground">
            QC
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">QC Traffic Ops</p>
            <p className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
              Quezon City LGU
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
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-panel px-3 py-1 font-mono-tab text-[10px] uppercase tracking-widest text-primary">
              <span className="size-1.5 animate-pulse rounded-full bg-success" />
              Live enforcement grid
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              AI traffic enforcement command for Quezon City
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
              One operations console for automated violation detection, IoT camera health, GIS
              hotspot analytics, and digital citation issuance — built for QC enforcement units.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90"
              >
                Open dashboard
                <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/cameras"
                className="inline-flex items-center gap-2 rounded-lg border border-border-strong bg-panel px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-panel-elevated"
              >
                <Camera className="size-4" />
                View camera grid
              </Link>
              <Link
                to="/lookup"
                className="inline-flex items-center gap-2 rounded-lg border border-border-strong bg-panel px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-panel-elevated"
              >
                <FileText className="size-4" />
                Check my citation
              </Link>
            </div>
            <dl className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.label}>
                  <dt className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                    {s.label}
                  </dt>
                  <dd className="mt-1 font-mono-tab text-2xl font-bold text-foreground">
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="panel overflow-hidden rounded-2xl">
            <img
              src={qcMap}
              alt="Quezon City traffic enforcement GIS map with violation hotspots"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        </section>

        <section className="border-t border-border bg-panel/40">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="text-2xl font-semibold tracking-tight">
              Built for the full enforcement workflow
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f) => (
                <article key={f.title} className="panel rounded-2xl p-5">
                  <f.icon className="size-5 text-primary" strokeWidth={2} />
                  <h3 className="mt-4 text-sm font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
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
            QC Traffic Ops · Quezon City Local Government Unit
          </p>
          <p className="font-mono-tab text-[10px] uppercase tracking-widest">
            Internal system · {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
