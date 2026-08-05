import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useViolations, useCitations, formatPeso, timeAgo } from "@/lib/data/traffic";
import { cn } from "@/lib/utils";
import { Search, Car, AlertTriangle, ShieldAlert, Ban } from "lucide-react";

export const Route = createFileRoute("/vehicles/")({
  head: () => ({
    meta: [
      { title: "Vehicles · QC Traffic Ops" },
      {
        name: "description",
        content:
          "Vehicle registry aggregated from AI detections and citations across Quezon City — offender history, outstanding balances, and watchlist flags.",
      },
      { property: "og:title", content: "Vehicles · QC Traffic Ops" },
      {
        property: "og:description",
        content:
          "Aggregated vehicle registry with offense history, outstanding fines, and watchlist status.",
      },
    ],
  }),
  component: VehiclesPage,
});

type VehicleRow = {
  plate: string;
  model: string | null;
  violations: number;
  citations: number;
  unpaid: number;
  outstanding: number;
  totalBilled: number;
  lastSeen: string;
  lastOffense: string;
  risk: "clean" | "watch" | "flagged" | "blocked";
};

const RISKS = ["all", "clean", "watch", "flagged", "blocked"] as const;
type RiskFilter = (typeof RISKS)[number];

function VehiclesPage() {
  const { data: violations = [], isLoading: vLoading } = useViolations(500);
  const { data: citations = [], isLoading: cLoading } = useCitations(500);
  const [risk, setRisk] = useState<RiskFilter>("all");
  const [q, setQ] = useState("");

  const vehicles = useMemo<VehicleRow[]>(() => {
    const map = new Map<string, VehicleRow>();

    for (const v of violations) {
      const row =
        map.get(v.plate_number) ??
        ({
          plate: v.plate_number,
          model: null,
          violations: 0,
          citations: 0,
          unpaid: 0,
          outstanding: 0,
          totalBilled: 0,
          lastSeen: v.detected_at,
          lastOffense: v.violation_type,
          risk: "clean",
        } as VehicleRow);
      row.violations += 1;
      if (new Date(v.detected_at) >= new Date(row.lastSeen)) {
        row.lastSeen = v.detected_at;
        row.lastOffense = v.violation_type;
      }
      map.set(v.plate_number, row);
    }

    for (const c of citations) {
      const row =
        map.get(c.plate_number) ??
        ({
          plate: c.plate_number,
          model: c.vehicle_model,
          violations: 0,
          citations: 0,
          unpaid: 0,
          outstanding: 0,
          totalBilled: 0,
          lastSeen: c.issued_at,
          lastOffense: c.offense,
          risk: "clean",
        } as VehicleRow);
      row.model = row.model ?? c.vehicle_model;
      row.citations += 1;
      row.totalBilled += Number(c.amount);
      if (c.status === "unpaid" || c.status === "overdue") {
        row.unpaid += 1;
        row.outstanding += Number(c.amount);
      }
      if (new Date(c.issued_at) >= new Date(row.lastSeen)) {
        row.lastSeen = c.issued_at;
        row.lastOffense = c.offense;
      }
      map.set(c.plate_number, row);
    }

    const rows = Array.from(map.values()).map((r) => {
      const total = r.violations + r.citations;
      let risk: VehicleRow["risk"] = "clean";
      if (r.outstanding >= 5000 || r.unpaid >= 3) risk = "blocked";
      else if (total >= 4 || r.outstanding > 0) risk = "flagged";
      else if (total >= 2) risk = "watch";
      return { ...r, risk };
    });

    rows.sort(
      (a, b) =>
        b.outstanding - a.outstanding || b.violations + b.citations - (a.violations + a.citations),
    );
    return rows;
  }, [violations, citations]);

  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      if (risk !== "all" && v.risk !== risk) return false;
      if (!q) return true;
      const n = q.toLowerCase();
      return (
        v.plate.toLowerCase().includes(n) ||
        (v.model ?? "").toLowerCase().includes(n) ||
        v.lastOffense.toLowerCase().includes(n)
      );
    });
  }, [vehicles, risk, q]);

  const counts = useMemo(() => {
    return {
      all: vehicles.length,
      clean: vehicles.filter((v) => v.risk === "clean").length,
      watch: vehicles.filter((v) => v.risk === "watch").length,
      flagged: vehicles.filter((v) => v.risk === "flagged").length,
      blocked: vehicles.filter((v) => v.risk === "blocked").length,
    } as Record<RiskFilter, number>;
  }, [vehicles]);

  const totalOutstanding = vehicles.reduce((s, v) => s + v.outstanding, 0);
  const isLoading = vLoading || cLoading;

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat
          icon={Car}
          label="Vehicles Tracked"
          value={counts.all.toLocaleString()}
          tone="primary"
        />
        <MiniStat
          icon={AlertTriangle}
          label="Flagged"
          value={counts.flagged.toLocaleString()}
          tone="warning"
        />
        <MiniStat
          icon={Ban}
          label="Blocked / Impound"
          value={counts.blocked.toLocaleString()}
          tone="danger"
        />
        <MiniStat
          icon={ShieldAlert}
          label="Outstanding Fines"
          value={formatPeso(totalOutstanding)}
          tone="warning"
        />
      </div>

      {/* Filter bar */}
      <div className="panel flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 overflow-x-auto">
          {RISKS.map((s) => {
            const active = risk === s;
            return (
              <button
                key={s}
                onClick={() => setRisk(s)}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-1.5 font-mono-tab text-[11px] font-semibold uppercase tracking-widest transition-colors",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-subtle hover:bg-panel-elevated hover:text-foreground",
                )}
              >
                {s}
                <span className="ml-2 rounded bg-panel-elevated px-1.5 py-0.5 text-[9px] text-muted-foreground">
                  {counts[s]}
                </span>
              </button>
            );
          })}
        </div>

        <label className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3 size-4 text-subtle" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search plate, model, offense…"
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-72"
          />
        </label>
      </div>

      {/* Table */}
      <div className="panel overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border">
                {[
                  "Plate",
                  "Vehicle",
                  "Violations",
                  "Citations",
                  "Outstanding",
                  "Last Offense",
                  "Last Seen",
                  "Risk",
                ].map((h) => (
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
              {isLoading && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-sm text-subtle">
                    Aggregating vehicle registry…
                  </td>
                </tr>
              )}
              {!isLoading && filtered.map((v) => <VehicleRow key={v.plate} v={v} />)}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-sm text-subtle">
                    No vehicles match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Car;
  label: string;
  value: string;
  tone: "primary" | "warning" | "danger";
}) {
  const toneCls =
    tone === "danger"
      ? "text-danger bg-danger/10"
      : tone === "warning"
        ? "text-warning bg-warning/10"
        : "text-primary bg-primary/10";
  return (
    <div className="panel rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
            {label}
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</div>
        </div>
        <div className={cn("grid size-9 place-items-center rounded-lg", toneCls)}>
          <Icon className="size-4" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}

function VehicleRow({ v }: { v: VehicleRow }) {
  const riskTone =
    v.risk === "clean"
      ? "bg-success/10 text-success border-success/30"
      : v.risk === "watch"
        ? "bg-primary/10 text-primary border-primary/30"
        : v.risk === "flagged"
          ? "bg-warning/10 text-warning border-warning/30"
          : "bg-danger/10 text-danger border-danger/30";

  return (
    <tr className="text-sm transition-colors hover:bg-panel-elevated/50">
      <td className="px-5 py-3">
        <Link
          to="/vehicles/$plate"
          params={{ plate: v.plate }}
          className="font-mono-tab font-semibold text-foreground transition-colors hover:text-primary"
        >
          {v.plate}
        </Link>
      </td>
      <td className="px-5 py-3 text-muted-foreground">{v.model ?? "—"}</td>
      <td className="px-5 py-3 font-mono-tab text-foreground">{v.violations}</td>
      <td className="px-5 py-3 font-mono-tab text-foreground">
        {v.citations}
        {v.unpaid > 0 && (
          <span className="ml-1 font-mono-tab text-[10px] text-warning">({v.unpaid} unpaid)</span>
        )}
      </td>
      <td className="px-5 py-3 font-mono-tab text-foreground">
        {v.outstanding > 0 ? (
          <span className="text-warning">{formatPeso(v.outstanding)}</span>
        ) : (
          <span className="text-subtle">—</span>
        )}
      </td>
      <td className="px-5 py-3 text-muted-foreground">{v.lastOffense}</td>
      <td className="px-5 py-3">
        <div className="text-foreground">{timeAgo(v.lastSeen)}</div>
        <div className="font-mono-tab text-[10px] text-subtle">
          {new Date(v.lastSeen).toLocaleDateString("en-PH")}
        </div>
      </td>
      <td className="px-5 py-3">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 font-mono-tab text-[10px] font-bold uppercase",
            riskTone,
          )}
        >
          {v.risk}
        </span>
      </td>
    </tr>
  );
}
