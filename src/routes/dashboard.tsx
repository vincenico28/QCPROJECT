import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  useViolations,
  useCitations,
  useCameras,
  useCreateCitation,
  formatPeso,
  timeAgo,
  type Violation,
} from "@/lib/data/traffic";
import { cn } from "@/lib/utils";
import { ArrowUpRight, TrendingUp, Activity, Radio, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import qcMap from "@/assets/qc-map.jpg";
import cctv1 from "@/assets/cctv-1.jpg";
import cctv2 from "@/assets/cctv-2.jpg";
import cctv3 from "@/assets/cctv-3.jpg";
import violation1 from "@/assets/violation-1.jpg";
import violation2 from "@/assets/violation-2.jpg";
import violation3 from "@/assets/violation-3.jpg";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: ({ context }) => {
    // @ts-expect-error injected
    const role = context.role;
    if (role === "officer") {
      throw redirect({ to: "/officer/scan" });
    }
  },
  head: () => ({
    meta: [
      { title: "Command Dashboard · Culiat Traffic Ops" },
      {
        name: "description",
        content:
          "Real-time traffic violations, AI detections, live CCTV feeds and citation revenue for Barangay Culiat, Quezon City.",
      },
      { property: "og:title", content: "Command Dashboard · Culiat Traffic Ops" },
      {
        property: "og:description",
        content:
          "Live AI enforcement dashboard for the Barangay Culiat, Quezon City LGU: violations, citations, cameras, and revenue.",
      },
    ],
  }),
  component: CommandDashboard,
});

const CCTV_FEEDS = [
  {
    img: cctv1,
    code: "CAM-042",
    location: "COMMONWEALTH AVE",
    status: "detection",
    label: "DETECTION ACTIVE",
  },
  {
    img: cctv2,
    code: "CAM-108",
    location: "TOMAS MORATO",
    status: "alert",
    label: "ILLEGAL PARKING DETECTED",
  },
  {
    img: cctv3,
    code: "CAM-059",
    location: "EDSA-QUEZON AVE",
    status: "optimal",
    label: "FLOW OPTIMAL",
  },
];

const FEED_IMAGES = [violation1, violation2, violation3];

function CommandDashboard() {
  const { data: violations = [], isLoading: vLoading } = useViolations(6);
  const { data: citations = [] } = useCitations(10);
  const { data: cameras = [] } = useCameras();

  const kpis = useMemo(() => {
    const revenue = citations
      .filter((c) => c.status === "paid")
      .reduce((sum, c) => sum + Number(c.amount), 0);
    const pending = citations.filter((c) => c.status === "pending").length;
    const activeCameras = cameras.filter((c) => c.status !== "offline").length;
    return {
      violations: violations.length > 0 ? 2842 : 0,
      officers: { current: 156, total: 200 },
      revenue: 428_000 + revenue,
      pending: 812 + pending,
      activeCameras,
      totalCameras: cameras.length,
    };
  }, [violations, citations, cameras]);

  return (
    <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-12 lg:p-8">
      {/* KPI ROW */}
      <KpiCard
        label="Daily Violations"
        value="2,842"
        delta="+14%"
        deltaKind="danger"
        icon={Activity}
      />
      <KpiCard
        label="Active Officers"
        value="156"
        secondary={`/ ${kpis.officers.total} Total`}
        deltaKind="muted"
      />
      <KpiCard
        label="Est. Revenue"
        value={formatPeso(kpis.revenue).replace("PHP", "₱")}
        delta="↑ Targeted"
        deltaKind="success"
        icon={TrendingUp}
      />
      <KpiCard
        label="Pending Payments"
        value={kpis.pending.toLocaleString()}
        delta="24h Overdue"
        deltaKind="warning"
      />

      {/* MAIN VISUAL AREA (map + cctv) */}
      <section className="flex flex-col gap-6 lg:col-span-8">
        {/* GIS MAP */}
        <div className="panel relative overflow-hidden rounded-3xl">
          <img
            src={qcMap}
            alt="Real-time GIS heatmap of Barangay Culiat, Quezon City traffic congestion"
            className="h-[420px] w-full object-cover opacity-70"
            width={1600}
            height={900}
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />

          <div className="absolute left-6 top-6 flex flex-col gap-2">
            <MapPill color="danger" label="Heavy Congestion: EDSA North" />
            <MapPill color="accent" label="Active Patrol: Fairview" />
            <MapPill color="warning" label="AI Alert: Commonwealth Ave" />
          </div>

          <div className="absolute right-6 top-6 rounded-xl border border-border bg-background/70 px-3 py-2 backdrop-blur-md">
            <p className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
              Live Cameras
            </p>
            <p className="font-mono-tab text-2xl font-semibold text-foreground">
              {kpis.activeCameras}
              <span className="text-base text-subtle">/{kpis.totalCameras}</span>
            </p>
          </div>

          {/* Fake pins */}
          <MapPin top="34%" left="42%" tone="danger" />
          <MapPin top="52%" left="55%" tone="warning" />
          <MapPin top="46%" left="30%" tone="accent" />
          <MapPin top="62%" left="48%" tone="success" />

          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Barangay Culiat, Quezon City · Live Traffic Heatmap
              </p>
              <p className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                Updated · {new Date().toLocaleTimeString("en-PH")}
              </p>
            </div>
            <Link
              to="/map"
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background/60 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur-md hover:bg-panel-elevated"
            >
              Open GIS View
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* CCTV GRID */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {CCTV_FEEDS.map((feed) => (
            <CctvTile key={feed.code} feed={feed} />
          ))}
        </div>

        {/* CITATIONS TABLE */}
        <div className="panel overflow-hidden rounded-3xl">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Recent Citations</h3>
              <p className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                Digital citations · QC LGU
              </p>
            </div>
            <Link
              to="/violations"
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-panel-elevated"
            >
              View all
              <ChevronRight className="size-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  {["Reference", "Plate", "Offense", "Officer", "Status", "Amount"].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {citations.slice(0, 6).map((c) => (
                  <tr key={c.id} className="text-sm transition-colors hover:bg-panel-elevated/50">
                    <td className="px-5 py-3 font-mono-tab text-foreground">
                      #{c.citation_number}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-mono-tab text-foreground">{c.plate_number}</div>
                      <div className="text-xs text-subtle">{c.vehicle_model}</div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{c.offense}</td>
                    <td className="px-5 py-3 text-muted-foreground">{c.officer_name}</td>
                    <td className="px-5 py-3">
                      <StatusPill status={c.status} />
                    </td>
                    <td className="px-5 py-3 text-right font-mono-tab font-medium text-foreground">
                      {formatPeso(Number(c.amount)).replace("PHP", "₱")}
                    </td>
                  </tr>
                ))}
                {citations.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-sm text-subtle">
                      No citations yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* LIVE VIOLATIONS FEED RAIL */}
      <aside className="panel flex flex-col overflow-hidden rounded-3xl lg:col-span-4">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div className="flex items-center gap-2">
            <Radio className="size-4 text-danger" />
            <h3 className="text-sm font-semibold text-foreground">LIVE VIOLATIONS FEED</h3>
          </div>
          <span className="rounded border border-danger/30 bg-danger/10 px-2 py-0.5 font-mono-tab text-[10px] font-medium text-danger">
            PRIORITY
          </span>
        </div>

        <div className="flex-1 divide-y divide-border overflow-y-auto">
          {vLoading && (
            <div className="space-y-4 p-5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-panel-elevated" />
              ))}
            </div>
          )}
          {!vLoading &&
            violations.map((v, i) => (
              <ViolationFeedItem
                key={v.id}
                violation={v}
                image={FEED_IMAGES[i % FEED_IMAGES.length]}
              />
            ))}
          {!vLoading && violations.length === 0 && (
            <div className="p-8 text-center text-sm text-subtle">No live detections</div>
          )}
        </div>
      </aside>
    </div>
  );
}

/* ---------- helpers ---------- */

function KpiCard({
  label,
  value,
  secondary,
  delta,
  deltaKind = "muted",
  icon: Icon,
}: {
  label: string;
  value: string;
  secondary?: string;
  delta?: string;
  deltaKind?: "success" | "warning" | "danger" | "muted";
  icon?: typeof Activity;
}) {
  const tone = {
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
    muted: "text-subtle",
  }[deltaKind];

  return (
    <div className="panel col-span-1 rounded-2xl p-6 lg:col-span-3">
      <div className="flex items-center justify-between">
        <p className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
          {label}
        </p>
        {Icon && <Icon className="size-4 text-subtle" strokeWidth={1.75} />}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-mono-tab text-4xl font-bold tracking-tighter text-foreground">
          {value}
        </span>
        {secondary && <span className="text-sm text-subtle">{secondary}</span>}
        {delta && <span className={cn("ml-auto text-xs font-medium", tone)}>{delta}</span>}
      </div>
    </div>
  );
}

function MapPill({
  color,
  label,
}: {
  color: "danger" | "warning" | "accent" | "success";
  label: string;
}) {
  const tone = {
    danger: "bg-danger shadow-[0_0_10px_oklch(from_var(--danger)_l_c_h_/_0.6)]",
    warning: "bg-warning shadow-[0_0_10px_oklch(from_var(--warning)_l_c_h_/_0.6)]",
    accent: "bg-primary shadow-[0_0_10px_oklch(from_var(--primary)_l_c_h_/_0.6)]",
    success: "bg-success shadow-[0_0_10px_oklch(from_var(--success)_l_c_h_/_0.6)]",
  }[color];
  return (
    <div className="flex items-center gap-3 rounded-full border border-border bg-background/70 px-4 py-2 backdrop-blur-md">
      <span className={cn("size-2 rounded-full", tone)} />
      <span className="text-xs font-medium text-foreground">{label}</span>
    </div>
  );
}

function MapPin({
  top,
  left,
  tone,
}: {
  top: string;
  left: string;
  tone: "danger" | "warning" | "accent" | "success";
}) {
  const toneClass = {
    danger: "bg-danger",
    warning: "bg-warning",
    accent: "bg-primary",
    success: "bg-success",
  }[tone];
  return (
    <span className="pointer-events-none absolute" style={{ top, left }} aria-hidden>
      <span className="relative flex size-3">
        <span
          className={cn(
            "absolute inline-flex size-full animate-ping rounded-full opacity-60",
            toneClass,
          )}
        />
        <span
          className={cn(
            "relative inline-flex size-3 rounded-full ring-2 ring-background",
            toneClass,
          )}
        />
      </span>
    </span>
  );
}

function CctvTile({
  feed,
}: {
  feed: { img: string; code: string; location: string; status: string; label: string };
}) {
  const badgeTone =
    feed.status === "alert"
      ? "text-warning"
      : feed.status === "detection"
        ? "text-success"
        : "text-success";
  const dot = feed.status === "alert" ? "bg-warning animate-pulse" : "bg-success";

  return (
    <div className="group relative aspect-video overflow-hidden rounded-2xl border border-border bg-panel">
      <img
        src={feed.img}
        alt={`CCTV feed from ${feed.location}`}
        className="size-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
        width={800}
        height={512}
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Live badge */}
      <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-0.5 backdrop-blur">
        <span className="size-1.5 animate-pulse rounded-full bg-danger" />
        <span className="font-mono-tab text-[9px] font-bold uppercase tracking-widest text-white">
          LIVE
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-4">
        <p className="font-mono-tab text-[10px] text-white/70">
          {feed.code} | {feed.location}
        </p>
        <p className={cn("flex items-center gap-2 text-xs font-bold text-white", badgeTone)}>
          <span className={cn("size-1.5 rounded-full", dot)} />
          {feed.label}
        </p>
      </div>
    </div>
  );
}

function ViolationFeedItem({ violation, image }: { violation: Violation; image: string }) {
  const { mutate: createCitation, isPending } = useCreateCitation();

  return (
    <article className="p-5 transition-colors hover:bg-panel-elevated/50">
      <div className="relative mb-3 aspect-video overflow-hidden rounded-lg border border-border">
        <img
          src={image}
          alt={`AI detection: ${violation.violation_type}`}
          className="size-full object-cover"
          width={600}
          height={512}
          loading="lazy"
        />
        <div className="absolute left-2 top-2 rounded bg-danger/90 px-1.5 py-0.5 font-mono-tab text-[9px] font-bold uppercase tracking-wider text-white">
          {violation.violation_type}
        </div>
        <div className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 font-mono-tab text-[9px] font-bold text-primary backdrop-blur">
          {Number(violation.confidence).toFixed(1)}%
        </div>
      </div>

      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-wide text-foreground">
            {violation.violation_type}
          </p>
          <p className="mt-0.5 text-xs text-subtle">
            Plate{" "}
            <span className="font-mono-tab text-muted-foreground">{violation.plate_number}</span>
            {" · "}
            {violation.location}
          </p>
        </div>
        <span className="shrink-0 font-mono-tab text-[10px] text-subtle">
          {timeAgo(violation.detected_at)}
        </span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => toast.success("Violation dismissed")}
          className="flex-1 rounded-md border border-border bg-panel-elevated py-2 font-mono-tab text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
        >
          Dismiss
        </button>
        <button
          onClick={() => {
            createCitation(
              {
                violation_id: violation.id,
                plate_number: violation.plate_number,
                offense: violation.violation_type,
                amount: 2500, // mock fixed penalty
                officer_name: "Auto-AI Dispatch",
              },
              {
                onSuccess: (data) => toast.success(`Citation ${data.citation_number} issued`),
                onError: (error) => toast.error(error.message),
              },
            );
          }}
          disabled={isPending}
          className="flex-1 rounded-md bg-primary/20 py-2 font-mono-tab text-[10px] font-bold uppercase tracking-widest text-primary transition-colors hover:bg-primary/30 disabled:opacity-50"
        >
          {isPending ? "Issuing..." : "Issue Citation"}
        </button>
      </div>
    </article>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "paid"
      ? "bg-success/10 text-success border-success/30"
      : status === "contested"
        ? "bg-danger/10 text-danger border-danger/30"
        : "bg-warning/10 text-warning border-warning/30";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 font-mono-tab text-[10px] font-bold uppercase",
        tone,
      )}
    >
      {status}
    </span>
  );
}
