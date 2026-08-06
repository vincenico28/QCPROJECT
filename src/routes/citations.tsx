import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCitations, formatPeso, timeAgo, type Citation } from "@/lib/data/traffic";
import { cn } from "@/lib/utils";
import { Search, Download, Receipt, CheckCircle2, Clock, XCircle, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/citations")({
  head: () => ({
    meta: [
      { title: "Citations · Culiat Traffic Ops" },
      {
        name: "description",
        content:
          "Digital traffic citations issued across Barangay Culiat, Quezon City with payment status, officer attribution, and revenue analytics.",
      },
      { property: "og:title", content: "Citations · Culiat Traffic Ops" },
      {
        property: "og:description",
        content:
          "Digital citations ledger with payment tracking and revenue analytics for Barangay Culiat, Quezon City enforcement.",
      },
    ],
  }),
  component: CitationsPage,
});

const STATUSES = ["all", "unpaid", "paid", "contested", "overdue"] as const;
type StatusFilter = (typeof STATUSES)[number];

function CitationsPage() {
  const { data: citations = [], isLoading } = useCitations(200);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return citations.filter((c) => {
      if (status !== "all" && c.status !== status) return false;
      if (!q) return true;
      const n = q.toLowerCase();
      return (
        c.citation_number.toLowerCase().includes(n) ||
        c.plate_number.toLowerCase().includes(n) ||
        c.offense.toLowerCase().includes(n) ||
        (c.officer_name ?? "").toLowerCase().includes(n)
      );
    });
  }, [citations, status, q]);

  const stats = useMemo(() => {
    const total = citations.reduce((s, c) => s + Number(c.amount), 0);
    const paid = citations.filter((c) => c.status === "paid");
    const paidSum = paid.reduce((s, c) => s + Number(c.amount), 0);
    const unpaidSum = citations
      .filter((c) => c.status === "unpaid" || c.status === "overdue")
      .reduce((s, c) => s + Number(c.amount), 0);
    const collectionRate = total > 0 ? (paidSum / total) * 100 : 0;
    return {
      issued: citations.length,
      total,
      paidSum,
      unpaidSum,
      collectionRate,
      counts: {
        all: citations.length,
        unpaid: citations.filter((c) => c.status === "unpaid").length,
        paid: paid.length,
        contested: citations.filter((c) => c.status === "contested").length,
        overdue: citations.filter((c) => c.status === "overdue").length,
      } as Record<StatusFilter, number>,
    };
  }, [citations]);

  function exportCsv() {
    const rows = [
      ["Citation", "Plate", "Vehicle", "Offense", "Amount", "Status", "Officer", "Issued"],
      ...filtered.map((c) => [
        c.citation_number,
        c.plate_number,
        c.vehicle_model ?? "",
        c.offense,
        String(c.amount),
        c.status,
        c.officer_name ?? "",
        new Date(c.issued_at).toISOString(),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `citations-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Citations Issued"
          value={stats.issued.toLocaleString()}
          icon={Receipt}
          tone="primary"
        />
        <KpiCard
          label="Revenue Collected"
          value={formatPeso(stats.paidSum)}
          icon={CheckCircle2}
          tone="success"
          sub={`${stats.collectionRate.toFixed(1)}% collection rate`}
        />
        <KpiCard
          label="Outstanding"
          value={formatPeso(stats.unpaidSum)}
          icon={Clock}
          tone="warning"
          sub={`${stats.counts.unpaid + stats.counts.overdue} tickets`}
        />
        <KpiCard
          label="Total Billed"
          value={formatPeso(stats.total)}
          icon={TrendingUp}
          tone="primary"
        />
      </div>

      {/* Filter bar */}
      <div className="panel flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 overflow-x-auto">
          {STATUSES.map((s) => {
            const active = status === s;
            return (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-1.5 font-mono-tab text-[11px] font-semibold uppercase tracking-widest transition-colors",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-subtle hover:bg-panel-elevated hover:text-foreground",
                )}
              >
                {s}
                <span className="ml-2 rounded bg-panel-elevated px-1.5 py-0.5 text-[9px] text-muted-foreground">
                  {stats.counts[s]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <label className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 size-4 text-subtle" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search citation, plate, officer…"
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-72"
            />
          </label>
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-panel px-3 py-2 text-sm font-medium text-foreground hover:bg-panel-elevated"
          >
            <Download className="size-4" /> Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="panel overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border">
                {[
                  "Citation #",
                  "Plate",
                  "Vehicle",
                  "Offense",
                  "Amount",
                  "Officer",
                  "Issued",
                  "Status",
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
                    Loading citations…
                  </td>
                </tr>
              )}
              {!isLoading && filtered.map((c) => <CitationRow key={c.id} c={c} />)}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-sm text-subtle">
                    No citations match your filters.
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

function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
  sub,
}: {
  label: string;
  value: string;
  icon: typeof Receipt;
  tone: "primary" | "success" | "warning";
  sub?: string;
}) {
  const toneCls =
    tone === "success"
      ? "text-success bg-success/10"
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
          {sub && <div className="mt-1 font-mono-tab text-[11px] text-muted-foreground">{sub}</div>}
        </div>
        <div className={cn("grid size-9 place-items-center rounded-lg", toneCls)}>
          <Icon className="size-4" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}

function CitationRow({ c }: { c: Citation }) {
  const statusTone =
    c.status === "paid"
      ? "bg-success/10 text-success border-success/30"
      : c.status === "contested"
        ? "bg-primary/10 text-primary border-primary/30"
        : c.status === "overdue"
          ? "bg-danger/10 text-danger border-danger/30"
          : "bg-warning/10 text-warning border-warning/30";
  const StatusIcon = c.status === "paid" ? CheckCircle2 : c.status === "overdue" ? XCircle : Clock;

  return (
    <tr className="text-sm transition-colors hover:bg-panel-elevated/50">
      <td className="px-5 py-3 font-mono-tab text-foreground">{c.citation_number}</td>
      <td className="px-5 py-3 font-mono-tab text-foreground">{c.plate_number}</td>
      <td className="px-5 py-3 text-muted-foreground">{c.vehicle_model ?? "—"}</td>
      <td className="px-5 py-3 text-foreground">{c.offense}</td>
      <td className="px-5 py-3 font-mono-tab text-foreground">{formatPeso(Number(c.amount))}</td>
      <td className="px-5 py-3 text-muted-foreground">{c.officer_name ?? "—"}</td>
      <td className="px-5 py-3">
        <div className="text-foreground">{timeAgo(c.issued_at)}</div>
        <div className="font-mono-tab text-[10px] text-subtle">
          {new Date(c.issued_at).toLocaleDateString("en-PH")}
        </div>
      </td>
      <td className="px-5 py-3">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono-tab text-[10px] font-bold uppercase",
            statusTone,
          )}
        >
          <StatusIcon className="size-3" />
          {c.status}
        </span>
      </td>
    </tr>
  );
}
