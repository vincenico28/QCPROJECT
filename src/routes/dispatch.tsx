import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Radio, Siren, CheckCircle2, Clock, MapPin } from "lucide-react";
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
  { key: "active", label: "Active" },
  { key: "queued", label: "Queued" },
  { key: "en_route", label: "En Route" },
  { key: "on_scene", label: "On Scene" },
  { key: "resolved", label: "Resolved" },
  { key: "all", label: "All" },
];

function DispatchBoard() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("active");
  const { data: dispatches = [], isLoading } = useDispatches(100);
  const update = useUpdateDispatchStatus();

  const rows = useMemo(() => {
    if (filter === "all") return dispatches;
    if (filter === "active")
      return dispatches.filter((d) => ["queued", "en_route", "on_scene"].includes(d.status));
    return dispatches.filter((d) => d.status === filter);
  }, [dispatches, filter]);

  const kpis = useMemo(
    () => ({
      queued: dispatches.filter((d) => d.status === "queued").length,
      field: dispatches.filter((d) => ["en_route", "on_scene"].includes(d.status)).length,
      resolved: dispatches.filter((d) => d.status === "resolved").length,
      critical: dispatches.filter((d) => d.priority === "critical" && d.status !== "resolved")
        .length,
    }),
    [dispatches],
  );

  async function setStatus(d: Dispatch, status: DispatchStatus) {
    try {
      await update.mutateAsync({ id: d.id, status });
      toast.success(`${d.reference} → ${DISPATCH_STATUS_LABEL[status]}`);
    } catch (err) {
      toast.error("Could not update dispatch", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Queued" value={kpis.queued} icon={Clock} tone="warning" />
        <Kpi label="In Field" value={kpis.field} icon={Radio} tone="primary" />
        <Kpi label="Critical Open" value={kpis.critical} icon={Siren} tone="danger" />
        <Kpi label="Resolved" value={kpis.resolved} icon={CheckCircle2} tone="success" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-panel p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-lg px-3 py-1.5 font-mono-tab text-[11px] font-bold uppercase tracking-widest transition-colors",
                filter === f.key
                  ? "bg-primary/15 text-primary"
                  : "text-subtle hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <DispatchDialog
            trigger={
              <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90">
                <Radio className="size-4" />
                New dispatch
              </button>
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {isLoading &&
          [0, 1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-panel-elevated" />
          ))}

        {!isLoading &&
          rows.map((d) => (
            <article key={d.id} className="panel flex flex-col gap-4 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-tab text-sm font-bold text-foreground">
                      {d.reference}
                    </span>
                    <PriorityPill priority={d.priority} />
                    <StatusPill status={d.status} />
                  </div>
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0 text-subtle" />
                    <span className="truncate">{d.location}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-subtle">
                    {d.officer_name
                      ? `${d.badge_number} · ${d.officer_name}`
                      : "Unassigned · nearest unit"}
                  </p>
                </div>
                <span className="shrink-0 font-mono-tab text-[10px] text-subtle">
                  {timeAgo(d.created_at)}
                </span>
              </div>

              {d.instructions && (
                <p className="rounded-lg border border-border bg-background/40 p-3 text-xs text-muted-foreground">
                  {d.instructions}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {(["en_route", "on_scene", "resolved", "cancelled"] as DispatchStatus[])
                  .filter((s) => s !== d.status)
                  .map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(d, s)}
                      disabled={update.isPending}
                      className={cn(
                        "rounded-md border border-border px-3 py-1.5 font-mono-tab text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50",
                        s === "resolved" && "text-success hover:text-success",
                        s === "cancelled" && "text-danger hover:text-danger",
                      )}
                    >
                      {DISPATCH_STATUS_LABEL[s]}
                    </button>
                  ))}
              </div>
            </article>
          ))}

        {!isLoading && rows.length === 0 && (
          <div className="panel col-span-full rounded-2xl p-10 text-center text-sm text-subtle">
            No dispatches in this view.
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
}: {
  label: string;
  value: number;
  icon: typeof Radio;
  tone: "primary" | "success" | "warning" | "danger";
}) {
  const toneClass = {
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  }[tone];
  return (
    <div className="panel rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <p className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
          {label}
        </p>
        <Icon className={cn("size-4", toneClass)} strokeWidth={1.75} />
      </div>
      <p className="mt-3 font-mono-tab text-4xl font-bold tracking-tighter text-foreground">
        {value}
      </p>
    </div>
  );
}

function PriorityPill({ priority }: { priority: Dispatch["priority"] }) {
  const tone = {
    low: "border-border text-subtle",
    medium: "border-primary/30 bg-primary/10 text-primary",
    high: "border-warning/30 bg-warning/10 text-warning",
    critical: "border-danger/30 bg-danger/10 text-danger",
  }[priority];
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 font-mono-tab text-[9px] font-bold uppercase tracking-widest",
        tone,
      )}
    >
      {priority}
    </span>
  );
}

function StatusPill({ status }: { status: DispatchStatus }) {
  const tone = {
    queued: "border-warning/30 bg-warning/10 text-warning",
    en_route: "border-primary/30 bg-primary/10 text-primary",
    on_scene: "border-primary/30 bg-primary/10 text-primary",
    resolved: "border-success/30 bg-success/10 text-success",
    cancelled: "border-border text-subtle",
  }[status];
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 font-mono-tab text-[9px] font-bold uppercase tracking-widest",
        tone,
      )}
    >
      {DISPATCH_STATUS_LABEL[status]}
    </span>
  );
}
