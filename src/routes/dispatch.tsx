import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Radio,
  Siren,
  CheckCircle2,
  Clock,
  MapPin,
  Search,
  Plus,
  Activity,
  AlertTriangle,
  User,
  ShieldAlert,
  ArrowRight,
  Send,
  Navigation,
} from "lucide-react";
import {
  useDispatches,
  useUpdateDispatchStatus,
  DISPATCH_STATUS_LABEL,
  type Dispatch,
  type DispatchStatus,
} from "@/lib/data/dispatch";
import { DispatchDialog } from "@/components/dispatch/dispatch-dialog";
import { timeAgo } from "@/lib/data/traffic";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dispatch")({
  head: () => ({
    meta: [
      { title: "Officer Dispatch Board · Culiat Traffic Ops" },
      {
        name: "description",
        content:
          "Assign Barangay Culiat, Quezon City enforcement officers to incidents and track dispatch status from queued to resolved.",
      },
      { property: "og:title", content: "Officer Dispatch Board · Culiat Traffic Ops" },
      {
        property: "og:description",
        content:
          "Live dispatch queue with priority routing, officer assignment and field status tracking.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DispatchBoard,
});

const FILTERS: { key: "active" | "all" | DispatchStatus; label: string }[] = [
  { key: "active", label: "Active Operations" },
  { key: "queued", label: "Queued" },
  { key: "en_route", label: "En Route" },
  { key: "on_scene", label: "On Scene" },
  { key: "resolved", label: "Resolved" },
  { key: "all", label: "All Records" },
];

function DispatchBoard() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const { data: dispatches = [], isLoading } = useDispatches(100);
  const update = useUpdateDispatchStatus();

  const filteredDispatches = useMemo(() => {
    let list = dispatches;
    if (filter === "active") {
      list = dispatches.filter((d) => ["queued", "en_route", "on_scene"].includes(d.status));
    } else if (filter !== "all") {
      list = dispatches.filter((d) => d.status === filter);
    }

    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (d) =>
        d.reference.toLowerCase().includes(q) ||
        d.location.toLowerCase().includes(q) ||
        (d.officer_name ?? "").toLowerCase().includes(q) ||
        (d.instructions ?? "").toLowerCase().includes(q)
    );
  }, [dispatches, filter, searchQuery]);

  const kpis = useMemo(
    () => ({
      queued: dispatches.filter((d) => d.status === "queued").length,
      field: dispatches.filter((d) => ["en_route", "on_scene"].includes(d.status)).length,
      resolved: dispatches.filter((d) => d.status === "resolved").length,
      critical: dispatches.filter((d) => d.priority === "critical" && d.status !== "resolved").length,
    }),
    [dispatches]
  );

  async function setStatus(d: Dispatch, status: DispatchStatus) {
    try {
      await update.mutateAsync({ id: d.id, status });
      toast.success(`${d.reference} status updated: ${DISPATCH_STATUS_LABEL[status]}`);
    } catch (err) {
      toast.error("Could not update dispatch", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-primary/20 px-2 py-0.5 font-mono-tab text-[10px] font-bold text-primary border border-primary/30">
              RAPID DISPATCH CONSOLE
            </span>
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-xs text-subtle">· 24/7 Patrol Grid</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            Officer Dispatch & Incident Response
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Assign on-duty traffic units to camera-detected bottlenecks, collisions, and obstruction incidents across Quezon City.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/officers/shifts"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-panel-elevated transition-colors"
          >
            <Navigation className="size-3.5 text-primary" />
            Live GPS Tracking
          </Link>

          <DispatchDialog
            trigger={
              <button className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all">
                <Radio className="size-3.5" />
                New Incident Dispatch
              </button>
            }
          />
        </div>
      </div>

      {/* KPI Ribbons */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Queued Orders" value={kpis.queued} icon={Clock} tone="warning" sub="Awaiting officer acceptance" />
        <Kpi label="In Field Active" value={kpis.field} icon={Radio} tone="primary" sub="En route or on scene" />
        <Kpi label="Critical Priority" value={kpis.critical} icon={Siren} tone="danger" sub="Severe congestion / hazard" />
        <Kpi label="Resolved Today" value={kpis.resolved} icon={CheckCircle2} tone="success" sub="Incidents cleared" />
      </div>

      {/* Filters Toolbar */}
      <div className="panel flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-background p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-lg px-3 py-1.5 font-mono-tab text-xs font-bold uppercase tracking-wider transition-colors",
                filter === f.key ? "bg-primary text-white shadow-sm" : "text-subtle hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dispatch ref, location, officer…"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none"
          />
        </div>
      </div>

      {/* Dispatch Cards Grid */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {isLoading &&
          [0, 1, 2, 3].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-panel-elevated" />
          ))}

        {!isLoading &&
          filteredDispatches.map((d) => (
            <article key={d.id} className="panel flex flex-col justify-between gap-4 rounded-2xl border border-border p-5 shadow-xl">
              <div>
                <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-tab text-sm font-bold text-white">
                        {d.reference}
                      </span>
                      <PriorityPill priority={d.priority} />
                      <StatusPill status={d.status} />
                    </div>
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-white font-medium">
                      <MapPin className="size-3.5 shrink-0 text-primary" />
                      <span className="truncate">{d.location}</span>
                    </p>
                  </div>
                  <span className="shrink-0 font-mono-tab text-[10px] text-subtle">
                    {timeAgo(d.created_at)}
                  </span>
                </div>

                {/* Assigned Unit */}
                <div className="mt-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <User className="size-3.5 text-subtle" />
                    <span>
                      {d.officer_name ? (
                        <strong className="text-white">{d.badge_number} · {d.officer_name}</strong>
                      ) : (
                        <span className="text-amber-400 font-semibold">Unassigned · Broadcast to nearest unit</span>
                      )}
                    </span>
                  </div>
                  {d.violation_id && (
                    <span className="font-mono-tab text-[10px] rounded bg-primary/20 px-1.5 py-0.2 text-primary font-bold">
                      Linked: {d.violation_id}
                    </span>
                  )}
                </div>

                {d.instructions && (
                  <div className="mt-3 rounded-xl border border-border bg-background/50 p-3 text-xs text-white/90 leading-relaxed">
                    <span className="text-[10px] font-mono-tab text-subtle uppercase block mb-0.5">Tactical Directives:</span>
                    {d.instructions}
                  </div>
                )}
              </div>

              {/* Status Action Workflow Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                <span className="text-[10px] font-mono-tab text-subtle uppercase">Update Stage:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(["en_route", "on_scene", "resolved", "cancelled"] as DispatchStatus[])
                    .filter((s) => s !== d.status)
                    .map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatus(d, s)}
                        disabled={update.isPending}
                        className={cn(
                          "rounded-lg border px-2.5 py-1 font-mono-tab text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50",
                          s === "resolved"
                            ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-600 hover:text-white"
                            : s === "cancelled"
                            ? "border-border bg-background text-muted-foreground hover:text-red-400"
                            : "border-primary/40 bg-primary/10 text-primary hover:bg-primary hover:text-white"
                        )}
                      >
                        {DISPATCH_STATUS_LABEL[s]}
                      </button>
                    ))}
                </div>
              </div>
            </article>
          ))}

        {!isLoading && filteredDispatches.length === 0 && (
          <div className="panel col-span-full rounded-2xl p-12 text-center text-sm text-subtle">
            No dispatches in this category.
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  icon: Icon,
  tone,
  sub,
}: {
  label: string;
  value: number;
  icon: typeof Radio;
  tone: "primary" | "success" | "warning" | "danger";
  sub?: string;
}) {
  const toneClass = {
    primary: "text-primary bg-primary/10 border-primary/30",
    success: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    warning: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    danger: "text-red-400 bg-red-500/10 border-red-500/30",
  }[tone];

  return (
    <div className="panel rounded-2xl p-5 border border-border">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
            {label}
          </span>
          <p className="mt-2 font-mono-tab text-3xl font-black text-white">{value}</p>
          {sub && <span className="text-[10px] text-muted-foreground mt-0.5 block">{sub}</span>}
        </div>
        <div className={cn("grid size-10 place-items-center rounded-xl border", toneClass)}>
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}

function PriorityPill({ priority }: { priority: Dispatch["priority"] }) {
  const tone = {
    low: "border-border text-subtle bg-white/5",
    medium: "border-primary/30 bg-primary/10 text-primary",
    high: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    critical: "border-red-500/40 bg-red-500/20 text-red-400 animate-pulse",
  }[priority];
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 font-mono-tab text-[9px] font-bold uppercase tracking-wider",
        tone
      )}
    >
      {priority}
    </span>
  );
}

function StatusPill({ status }: { status: DispatchStatus }) {
  const tone = {
    queued: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    en_route: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    on_scene: "border-primary/30 bg-primary/10 text-primary",
    resolved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    cancelled: "border-border text-subtle",
  }[status];
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 font-mono-tab text-[9px] font-bold uppercase tracking-wider",
        tone
      )}
    >
      {DISPATCH_STATUS_LABEL[status]}
    </span>
  );
}
