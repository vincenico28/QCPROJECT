import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Users, ShieldCheck, Activity, Search, Phone } from "lucide-react";
import { useOfficers, type Officer } from "@/lib/data/traffic";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/officers/")({
  head: () => ({
    meta: [
      { title: "Officers · Culiat Traffic Ops" },
      {
        name: "description",
        content:
          "Barangay Culiat, Quezon City traffic enforcement personnel roster with duty status, unit assignment, and citation output per officer.",
      },
      { property: "og:title", content: "Officers · Culiat Traffic Ops" },
      {
        property: "og:description",
        content: "Enforcement personnel roster: duty status, districts, units and citation output.",
      },
    ],
  }),
  component: OfficersPage,
});

const FILTERS = ["all", "on_duty", "active", "on_leave", "suspended"] as const;
type OfficerFilter = (typeof FILTERS)[number];

const LABELS: Record<OfficerFilter, string> = {
  all: "All",
  on_duty: "On duty",
  active: "Active",
  on_leave: "On leave",
  suspended: "Suspended",
};

function OfficersPage() {
  const { data: officers = [], isLoading } = useOfficers();
  const [filter, setFilter] = useState<OfficerFilter>("all");
  const [q, setQ] = useState("");

  const counts = useMemo(
    () =>
      ({
        all: officers.length,
        on_duty: officers.filter((o) => o.on_duty).length,
        active: officers.filter((o) => o.status === "active").length,
        on_leave: officers.filter((o) => o.status === "on_leave").length,
        suspended: officers.filter((o) => o.status === "suspended").length,
      }) as Record<OfficerFilter, number>,
    [officers],
  );

  const totalCitations = useMemo(
    () => officers.reduce((sum, o) => sum + o.citations_issued, 0),
    [officers],
  );

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return officers.filter((o) => {
      if (filter === "on_duty" && !o.on_duty) return false;
      if (filter !== "all" && filter !== "on_duty" && o.status !== filter) return false;
      if (!needle) return true;
      return (
        o.full_name.toLowerCase().includes(needle) ||
        o.badge_number.includes(needle) ||
        o.unit.toLowerCase().includes(needle) ||
        o.district.toLowerCase().includes(needle)
      );
    });
  }, [officers, filter, q]);

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Personnel" value={officers.length} icon={Users} />
        <Kpi label="On duty now" value={counts.on_duty} icon={Activity} tone="text-success" />
        <Kpi
          label="Citations issued"
          value={totalCitations}
          icon={ShieldCheck}
          tone="text-primary"
        />
        <Kpi
          label="Avg per officer"
          value={officers.length ? Math.round(totalCitations / officers.length) : 0}
          icon={Activity}
          tone="text-warning"
        />
      </div>

      <div className="panel flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 font-mono-tab text-[11px] font-semibold uppercase tracking-widest transition-colors",
                filter === f
                  ? "bg-primary/15 text-primary"
                  : "text-subtle hover:bg-panel-elevated hover:text-foreground",
              )}
            >
              {LABELS[f]}
              <span className="ml-2 rounded bg-panel-elevated px-1.5 py-0.5 text-[9px] text-muted-foreground">
                {counts[f]}
              </span>
            </button>
          ))}
        </div>
        <label className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3 size-4 text-subtle" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, badge, unit…"
            className="w-full rounded-lg border border-border bg-panel py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-80"
          />
        </label>
      </div>

      {isLoading ? (
        <div className="panel grid h-64 place-items-center rounded-2xl text-sm text-subtle">
          Loading personnel roster…
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel grid h-64 place-items-center rounded-2xl text-sm text-subtle">
          No officers match the current filters.
        </div>
      ) : (
        <div className="panel overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-border font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                  <th className="px-5 py-3 font-medium">Officer</th>
                  <th className="px-5 py-3 font-medium">Rank</th>
                  <th className="px-5 py-3 font-medium">Unit</th>
                  <th className="px-5 py-3 font-medium">District</th>
                  <th className="px-5 py-3 font-medium">Contact</th>
                  <th className="px-5 py-3 text-right font-medium">Citations</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <OfficerRow key={o.id} officer={o} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function OfficerRow({ officer }: { officer: Officer }) {
  const statusTone =
    officer.status === "active"
      ? "text-success border-success/30 bg-success/10"
      : officer.status === "on_leave"
        ? "text-warning border-warning/30 bg-warning/10"
        : "text-danger border-danger/30 bg-danger/10";

  return (
    <tr className="border-b border-border/60 transition-colors last:border-0 hover:bg-panel-elevated/60">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="relative grid size-9 shrink-0 place-items-center rounded-full bg-panel-elevated font-mono-tab text-[11px] font-bold text-foreground ring-1 ring-border">
            {initials(officer.full_name)}
            {officer.on_duty && (
              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-panel bg-success" />
            )}
          </div>
          <div className="min-w-0">
            <Link
              to="/officers/$badge"
              params={{ badge: officer.badge_number }}
              className="truncate font-medium text-foreground transition-colors hover:text-primary"
            >
              {officer.full_name}
            </Link>
            <p className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
              Badge #{officer.badge_number}
            </p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5 text-muted-foreground">{officer.rank}</td>
      <td className="px-5 py-3.5 text-muted-foreground">{officer.unit}</td>
      <td className="px-5 py-3.5 font-mono-tab text-xs text-muted-foreground">
        {officer.district}
      </td>
      <td className="px-5 py-3.5">
        {officer.contact_number ? (
          <span className="flex items-center gap-1.5 font-mono-tab text-xs text-muted-foreground">
            <Phone className="size-3 text-subtle" />
            {officer.contact_number}
          </span>
        ) : (
          <span className="text-subtle">—</span>
        )}
      </td>
      <td className="px-5 py-3.5 text-right font-mono-tab font-semibold text-foreground">
        {officer.citations_issued}
      </td>
      <td className="px-5 py-3.5">
        <div className="flex flex-col items-start gap-1">
          <span
            className={cn(
              "rounded-md border px-2 py-0.5 font-mono-tab text-[10px] font-semibold uppercase tracking-widest",
              statusTone,
            )}
          >
            {officer.status.replace("_", " ")}
          </span>
          {officer.on_duty && (
            <span className="font-mono-tab text-[9px] uppercase tracking-widest text-success">
              ● On duty
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}

function Kpi({
  label,
  value,
  icon: Icon,
  tone = "text-foreground",
}: {
  label: string;
  value: string | number;
  icon: typeof Users;
  tone?: string;
}) {
  return (
    <div className="panel rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
          {label}
        </span>
        <Icon className={cn("size-4", tone)} strokeWidth={2} />
      </div>
      <p className={cn("mt-3 font-mono-tab text-3xl font-bold", tone)}>{value}</p>
    </div>
  );
}
