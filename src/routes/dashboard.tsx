import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  useViolations,
  useCitations,
  useCameras,
  useCreateCitation,
  formatPeso,
  timeAgo,
  type Violation,
} from "@/lib/data/traffic";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  ArrowUpRight,
  TrendingUp,
  Activity,
  Radio,
  ChevronRight,
  ShieldCheck,
  User,
  ShieldAlert,
  Sparkles,
  Flame,
  Crown,
  DollarSign,
  Scale,
  Video,
  FileText,
  Car,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Eye,
  Sliders,
  Send,
  RefreshCw,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { type SystemRole } from "@/lib/rbac";
import { DispatchDialog } from "@/components/dispatch/dispatch-dialog";

import qcMap from "@/assets/qc-map.jpg";
import cctv1 from "@/assets/cctv-1.jpg";
import cctv2 from "@/assets/cctv-2.jpg";
import cctv3 from "@/assets/cctv-3.jpg";
import violation1 from "@/assets/violation-1.jpg";
import violation2 from "@/assets/violation-2.jpg";
import violation3 from "@/assets/violation-3.jpg";

export const Route = createFileRoute("/dashboard")({
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
    location: "COMMONWEALTH-TANDANG SORA",
    status: "detection",
    label: "DETECTION ACTIVE",
    fps: "30 FPS",
    res: "4K 60Hz",
  },
  {
    img: cctv2,
    code: "CAM-108",
    location: "TOMAS MORATO INTERSECT",
    status: "alert",
    label: "ILLEGAL PARKING DETECTED",
    fps: "28 FPS",
    res: "1080p",
  },
  {
    img: cctv3,
    code: "CAM-059",
    location: "EDSA-QUEZON AVE FLYOVER",
    status: "optimal",
    label: "FLOW OPTIMAL",
    fps: "30 FPS",
    res: "4K 60Hz",
  },
];

const FEED_IMAGES = [violation1, violation2, violation3];

const ROLE_INFO: Record<
  SystemRole,
  {
    label: string;
    clearance: string;
    badge: string;
    dot: string;
    icon: any;
  }
> = {
  super_admin: {
    label: "Super Administrator",
    clearance: "Level 5 · Executive Command & Root System Clearance",
    badge: "border-purple-500/40 bg-purple-500/10 text-purple-400",
    dot: "bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]",
    icon: Crown,
  },
  admin: {
    label: "Administrator",
    clearance: "Level 4 · Full System & Root Admin Clearance",
    badge: "border-primary/40 bg-primary/10 text-primary",
    dot: "bg-primary shadow-[0_0_8px_var(--color-primary)]",
    icon: ShieldCheck,
  },
  dispatcher: {
    label: "Central Dispatcher",
    clearance: "Level 3 · Tactical Dispatch & Unit Operations",
    badge: "border-warning/40 bg-warning/10 text-warning",
    dot: "bg-warning shadow-[0_0_8px_var(--color-warning)]",
    icon: Radio,
  },
  officer: {
    label: "Field Enforcement Officer",
    clearance: "Level 2 · Sector Patrol & Citation Issuance",
    badge: "border-success/40 bg-success/10 text-success",
    dot: "bg-success shadow-[0_0_8px_var(--color-success)]",
    icon: ShieldCheck,
  },
  finance: {
    label: "Treasury & Finance Officer",
    clearance: "Level 3 · Revenue, Cashier & Financial Reconciliation",
    badge: "border-amber-500/40 bg-amber-500/10 text-amber-400",
    dot: "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]",
    icon: DollarSign,
  },
  adjudicator: {
    label: "Hearing Adjudicator",
    clearance: "Level 3 · Legal Dispute Adjudication & Appeals",
    badge: "border-cyan-500/40 bg-cyan-500/10 text-cyan-400",
    dot: "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]",
    icon: Scale,
  },
  citizen: {
    label: "Citizen / Visitor",
    clearance: "Level 1 · Public Portal & Inquiry Clearance",
    badge: "border-border bg-panel-elevated text-subtle",
    dot: "bg-subtle",
    icon: User,
  },
};

function CommandDashboard() {
  const { user, role } = useAuth();
  const { data: violations = [], isLoading: vLoading } = useViolations(8);
  const { data: citations = [] } = useCitations(15);
  const { data: cameras = [] } = useCameras();

  const [citationFilter, setCitationFilter] = useState<string>("all");
  const [citationSearch, setCitationSearch] = useState<string>("");
  const [mapMode, setMapMode] = useState<"hotspots" | "anpr" | "patrols">("hotspots");

  const roleConfig = ROLE_INFO[role] || ROLE_INFO.admin;
  const RoleIcon = roleConfig.icon;

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
      totalCameras: cameras.length || 120,
    };
  }, [violations, citations, cameras]);

  const filteredCitations = useMemo(() => {
    return citations.filter((c) => {
      const matchFilter = citationFilter === "all" || c.status === citationFilter;
      const matchSearch =
        !citationSearch ||
        c.citation_number.toLowerCase().includes(citationSearch.toLowerCase()) ||
        c.plate_number.toLowerCase().includes(citationSearch.toLowerCase()) ||
        c.offense.toLowerCase().includes(citationSearch.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [citations, citationFilter, citationSearch]);

  return (
    <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-12 lg:p-8">
      {/* OPERATOR ROLE INDICATOR BANNER & TELEMETRY STRIP */}
      <div className="col-span-1 lg:col-span-12 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 rounded-3xl border border-border bg-panel p-5 shadow-xl">
        <div className="flex items-center gap-4">
          <div className={cn("grid size-12 place-items-center rounded-2xl border shrink-0", roleConfig.badge)}>
            <RoleIcon className="size-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-foreground text-sm">
                Active Console: <strong className="text-foreground">{user?.email || "Authorized Operator"}</strong>
              </span>
              <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono-tab text-[10px] font-bold uppercase tracking-wider", roleConfig.badge)}>
                <span className={cn("size-1.5 rounded-full", roleConfig.dot)} />
                {roleConfig.label}
              </span>
            </div>
            <p className="font-mono-tab text-xs text-muted-foreground mt-0.5">
              {roleConfig.clearance}
            </p>
          </div>
        </div>

        {/* Live Operational Status Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-2 rounded-xl bg-panel-elevated border border-border px-3 py-1.5 font-mono-tab text-[11px]">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-subtle">AI Inference:</span>
            <span className="font-bold text-foreground">18ms (YOLOv11)</span>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-panel-elevated border border-border px-3 py-1.5 font-mono-tab text-[11px]">
            <span className="size-2 rounded-full bg-primary" />
            <span className="text-subtle">ANPR Grid:</span>
            <span className="font-bold text-foreground">{kpis.activeCameras}/{kpis.totalCameras} Online</span>
          </div>

          <DispatchDialog
            trigger={
              <button className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all">
                <Radio className="size-3.5" /> Quick Dispatch
              </button>
            }
          />
        </div>
      </div>

      {/* KPI STATS ROW */}
      <KpiCard
        label="Daily Violations"
        value="2,842"
        delta="+14% Today"
        deltaKind="danger"
        icon={Activity}
        sub="Auto-captured by ANPR"
      />
      <KpiCard
        label="Active Enforcers"
        value="156"
        secondary={`/ ${kpis.officers.total} Shift`}
        delta="92% Coverage"
        deltaKind="success"
        icon={ShieldCheck}
        sub="Patrol sectors online"
      />
      <KpiCard
        label="Settlement Revenue"
        value={formatPeso(kpis.revenue).replace("PHP", "₱")}
        delta="↑ Targeted"
        deltaKind="success"
        icon={TrendingUp}
        sub="GCash, Maya & Landbank"
      />
      <KpiCard
        label="Pending Citations"
        value={kpis.pending.toLocaleString()}
        delta="24h Overdue"
        deltaKind="warning"
        icon={Clock}
        sub="Awaiting LTO Tagging"
      />

      {/* MAIN VISUAL AREA (GIS Map + CCTV Grid + Citations Table) */}
      <section className="flex flex-col gap-6 lg:col-span-8">
        {/* GIS MAP CARD */}
        <div className="panel relative overflow-hidden rounded-3xl border border-border bg-panel shadow-2xl">
          <img
            src={qcMap}
            alt="Real-time GIS heatmap of Barangay Culiat, Quezon City traffic congestion"
            className="h-[420px] w-full object-cover opacity-70"
            width={1600}
            height={900}
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

          {/* Top Map Pills */}
          <div className="absolute left-6 top-6 flex flex-wrap gap-2">
            <MapPill color="danger" label="Heavy Volume: EDSA Northbound" />
            <MapPill color="accent" label="Active Sector: Tandang Sora" />
            <MapPill color="warning" label="AI Alert: Commonwealth Overpass" />
          </div>

          {/* Mode Switcher */}
          <div className="absolute right-6 top-6 flex items-center gap-1 rounded-2xl border border-border bg-background/80 p-1 backdrop-blur-md">
            <button
              onClick={() => setMapMode("hotspots")}
              className={cn(
                "rounded-xl px-2.5 py-1 text-[11px] font-mono-tab font-bold transition-all",
                mapMode === "hotspots" ? "bg-primary text-primary-foreground shadow" : "text-subtle hover:text-foreground"
              )}
            >
              Hotspots
            </button>
            <button
              onClick={() => setMapMode("anpr")}
              className={cn(
                "rounded-xl px-2.5 py-1 text-[11px] font-mono-tab font-bold transition-all",
                mapMode === "anpr" ? "bg-primary text-primary-foreground shadow" : "text-subtle hover:text-foreground"
              )}
            >
              ANPR Grid
            </button>
            <button
              onClick={() => setMapMode("patrols")}
              className={cn(
                "rounded-xl px-2.5 py-1 text-[11px] font-mono-tab font-bold transition-all",
                mapMode === "patrols" ? "bg-primary text-primary-foreground shadow" : "text-subtle hover:text-foreground"
              )}
            >
              Patrol Units
            </button>
          </div>

          {/* Simulated Location Pins */}
          <MapPin top="34%" left="42%" tone="danger" label="EDSA Congestion" />
          <MapPin top="52%" left="55%" tone="warning" label="Commonwealth Cam #04" />
          <MapPin top="46%" left="30%" tone="accent" label="Patrol Unit #12" />
          <MapPin top="62%" left="48%" tone="success" label="Tandang Sora Flow" />

          {/* Map Footer Bar */}
          <div className="absolute bottom-4 left-6 right-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-foreground flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                Barangay Culiat, Quezon City · GIS Telemetry Heatmap
              </p>
              <p className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                Live Sensor Feed &bull; Refreshed {new Date().toLocaleTimeString("en-PH")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/analytics/heatmaps"
                className="inline-flex items-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 px-3.5 py-2 text-xs font-bold text-orange-400 backdrop-blur-md hover:bg-orange-500/20 transition-all shadow-sm"
              >
                <Flame className="size-3.5 text-orange-500" />
                AI Forecast
              </Link>
              <Link
                to="/map"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel-elevated px-3.5 py-2 text-xs font-bold text-foreground backdrop-blur-md hover:bg-panel transition-all shadow-sm"
              >
                Live GIS Map
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* CCTV MULTI-FEED GRID */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {CCTV_FEEDS.map((feed) => (
            <CctvTile key={feed.code} feed={feed} />
          ))}
        </div>

        {/* CITATIONS TABLE WITH INTEGRATED FILTER & SEARCH */}
        <div className="panel overflow-hidden rounded-3xl border border-border bg-panel shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border p-5">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                Recent Citations Ledger ({filteredCitations.length})
              </h3>
              <p className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                Digital Notice of Violation (NOV) Registry &bull; Quezon City LGU
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
                <input
                  type="text"
                  placeholder="Filter plate, ref, offense..."
                  value={citationSearch}
                  onChange={(e) => setCitationSearch(e.target.value)}
                  className="rounded-xl border border-border bg-panel-elevated pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-subtle focus:outline-none focus:border-primary w-44 sm:w-56"
                />
              </div>

              <select
                value={citationFilter}
                onChange={(e) => setCitationFilter(e.target.value)}
                className="rounded-xl border border-border bg-panel-elevated px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="paid">Settled / Paid</option>
                <option value="contested">Contested</option>
              </select>

              <Link
                to="/citations"
                className="inline-flex items-center gap-1 rounded-xl border border-border bg-panel-elevated px-3 py-1.5 text-xs font-bold text-foreground hover:bg-panel"
              >
                View all <ChevronRight className="size-3.5" />
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-panel-elevated/40">
                  {["Reference", "Plate & Model", "Offense", "Officer / Unit", "Status", "Amount"].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 font-mono-tab text-[10px] font-bold uppercase tracking-widest text-subtle"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCitations.slice(0, 6).map((c) => (
                  <tr key={c.id} className="text-sm transition-colors hover:bg-panel-elevated/50">
                    <td className="px-5 py-3 font-mono-tab font-bold text-foreground">
                      #{c.citation_number}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-mono-tab font-bold text-foreground">{c.plate_number}</div>
                      <div className="text-xs text-subtle">{c.vehicle_model}</div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{c.offense}</td>
                    <td className="px-5 py-3 text-muted-foreground">{c.officer_name}</td>
                    <td className="px-5 py-3">
                      <StatusPill status={c.status} />
                    </td>
                    <td className="px-5 py-3 text-right font-mono-tab font-bold text-foreground">
                      {formatPeso(Number(c.amount)).replace("PHP", "₱")}
                    </td>
                  </tr>
                ))}
                {filteredCitations.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-sm text-subtle">
                      No citations matching current filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* LIVE VIOLATIONS FEED RAIL */}
      <aside className="panel flex flex-col overflow-hidden rounded-3xl border border-border bg-panel shadow-2xl lg:col-span-4">
        <div className="flex items-center justify-between border-b border-border p-5 bg-panel-elevated/40">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-danger" />
            </span>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Live AI Detection Stream
            </h3>
          </div>
          <Link
            to="/violations"
            className="rounded-lg border border-danger/30 bg-danger/10 px-2 py-0.5 font-mono-tab text-[10px] font-bold text-danger hover:bg-danger/20 transition-colors"
          >
            REVIEW QUEUE
          </Link>
        </div>

        <div className="flex-1 divide-y divide-border overflow-y-auto custom-scrollbar max-h-[900px]">
          {vLoading && (
            <div className="space-y-4 p-5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-panel-elevated" />
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
            <div className="p-8 text-center text-sm text-subtle">No active AI detections</div>
          )}
        </div>
      </aside>
    </div>
  );
}

/* ---------- HELPER COMPONENTS ---------- */

function KpiCard({
  label,
  value,
  secondary,
  delta,
  deltaKind = "muted",
  icon: Icon,
  sub,
}: {
  label: string;
  value: string;
  secondary?: string;
  delta?: string;
  deltaKind?: "success" | "warning" | "danger" | "muted";
  icon?: any;
  sub?: string;
}) {
  const tone = {
    success: "text-success bg-success/10 border-success/30",
    warning: "text-warning bg-warning/10 border-warning/30",
    danger: "text-danger bg-danger/10 border-danger/30",
    muted: "text-subtle bg-panel-elevated border-border",
  }[deltaKind];

  return (
    <div className="panel col-span-1 rounded-3xl border border-border bg-panel p-6 shadow-xl lg:col-span-3 transition-all hover:border-primary/40 hover:shadow-2xl">
      <div className="flex items-center justify-between">
        <p className="font-mono-tab text-[10px] font-bold uppercase tracking-widest text-subtle">
          {label}
        </p>
        {Icon && (
          <div className="grid size-8 place-items-center rounded-xl bg-panel-elevated border border-border text-foreground">
            <Icon className="size-4 text-primary" strokeWidth={2} />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-mono-tab text-3xl sm:text-4xl font-extrabold tracking-tighter text-foreground">
          {value}
        </span>
        {secondary && <span className="text-xs text-subtle font-mono-tab">{secondary}</span>}
      </div>
      <div className="mt-2 flex items-center justify-between">
        {sub && <span className="text-[11px] text-muted-foreground">{sub}</span>}
        {delta && (
          <span className={cn("rounded-full border px-2 py-0.5 font-mono-tab text-[10px] font-bold", tone)}>
            {delta}
          </span>
        )}
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
    <div className="flex items-center gap-2 rounded-full border border-border bg-background/80 px-3.5 py-1.5 backdrop-blur-md shadow-sm">
      <span className={cn("size-2 rounded-full", tone)} />
      <span className="text-xs font-semibold text-foreground">{label}</span>
    </div>
  );
}

function MapPin({
  top,
  left,
  tone,
  label,
}: {
  top: string;
  left: string;
  tone: "danger" | "warning" | "accent" | "success";
  label?: string;
}) {
  const toneClass = {
    danger: "bg-danger",
    warning: "bg-warning",
    accent: "bg-primary",
    success: "bg-success",
  }[tone];
  return (
    <span className="pointer-events-none absolute group cursor-pointer" style={{ top, left }} aria-hidden>
      <span className="relative flex size-3.5">
        <span
          className={cn(
            "absolute inline-flex size-full animate-ping rounded-full opacity-75",
            toneClass,
          )}
        />
        <span
          className={cn(
            "relative inline-flex size-3.5 rounded-full ring-2 ring-background shadow-lg",
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
  feed: { img: string; code: string; location: string; status: string; label: string; fps: string; res: string };
}) {
  const badgeTone =
    feed.status === "alert"
      ? "text-warning"
      : feed.status === "detection"
        ? "text-emerald-400"
        : "text-emerald-400";
  const dot = feed.status === "alert" ? "bg-warning animate-pulse" : "bg-emerald-400";

  return (
    <div className="group relative aspect-video overflow-hidden rounded-3xl border border-border bg-panel shadow-xl">
      <img
        src={feed.img}
        alt={`CCTV feed from ${feed.location}`}
        className="size-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
        width={800}
        height={512}
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

      {/* Live badge & FPS */}
      <div className="absolute right-3 top-3 flex items-center gap-2">
        <span className="font-mono-tab text-[9px] font-bold text-white/70 bg-black/60 px-2 py-0.5 rounded backdrop-blur">
          {feed.fps} &bull; {feed.res}
        </span>
        <div className="flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-0.5 backdrop-blur border border-white/10">
          <span className="size-1.5 animate-pulse rounded-full bg-danger" />
          <span className="font-mono-tab text-[9px] font-bold uppercase tracking-widest text-white">
            LIVE
          </span>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-4">
        <p className="font-mono-tab text-[10px] font-bold text-white/70">
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
      <div className="relative mb-3 aspect-video overflow-hidden rounded-2xl border border-border">
        <img
          src={image}
          alt={`AI detection: ${violation.violation_type}`}
          className="size-full object-cover"
          width={600}
          height={512}
          loading="lazy"
        />
        <div className="absolute left-2.5 top-2.5 rounded-lg bg-danger/90 px-2 py-0.5 font-mono-tab text-[9px] font-bold uppercase tracking-wider text-white shadow">
          {violation.violation_type}
        </div>
        <div className="absolute bottom-2.5 right-2.5 rounded-lg bg-black/80 px-2 py-0.5 font-mono-tab text-[10px] font-bold text-primary backdrop-blur border border-white/10">
          {Math.round(Number(violation.confidence) > 1 ? Number(violation.confidence) : Number(violation.confidence) * 100)}% Confidence
        </div>
      </div>

      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-wide text-foreground">
            {violation.violation_type}
          </p>
          <p className="mt-0.5 text-xs text-subtle">
            Plate{" "}
            <span className="font-mono-tab font-bold text-foreground">{violation.plate_number}</span>
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
          onClick={() => toast.success("Violation dismissed from feed")}
          className="flex-1 rounded-xl border border-border bg-panel-elevated py-2 font-mono-tab text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
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
                amount: 2500,
                officer_name: "Auto-AI Dispatch",
              },
              {
                onSuccess: (data) => toast.success(`Citation #${data.citation_number} issued for ${data.plate_number}`),
                onError: (error) => toast.error(error.message),
              },
            );
          }}
          disabled={isPending}
          className="flex-1 rounded-xl bg-primary px-3 py-2 font-mono-tab text-[10px] font-bold uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all disabled:opacity-50"
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
        "inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono-tab text-[10px] font-bold uppercase",
        tone,
      )}
    >
      {status}
    </span>
  );
}
