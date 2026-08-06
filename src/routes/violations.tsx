import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useViolations, timeAgo, type Violation } from "@/lib/data/traffic";
import { ViolationReviewDialog } from "@/components/violations/violation-review-dialog";
import { cn } from "@/lib/utils";
import { Filter, Search } from "lucide-react";

export const Route = createFileRoute("/violations")({
  head: () => ({
    meta: [
      { title: "Violations · Culiat Traffic Ops" },
      {
        name: "description",
        content:
          "AI-detected traffic violations across Barangay Culiat, Quezon City with confidence scores, evidence, and enforcement status.",
      },
      { property: "og:title", content: "Violations · Culiat Traffic Ops" },
      {
        property: "og:description",
        content: "Live AI-detected violations across Barangay Culiat, Quezon City with evidence and status.",
      },
    ],
  }),
  component: ViolationsPage,
});

const STATUSES = ["all", "pending", "confirmed", "dismissed"] as const;
type StatusFilter = (typeof STATUSES)[number];

function ViolationsPage() {
  const { data: violations = [], isLoading } = useViolations(100);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [q, setQ] = useState("");
  const [review, setReview] = useState<Violation | null>(null);

  const filtered = useMemo(() => {
    return violations.filter((v) => {
      if (status !== "all" && v.status !== status) return false;
      if (!q) return true;
      const needle = q.toLowerCase();
      return (
        v.plate_number.toLowerCase().includes(needle) ||
        v.violation_type.toLowerCase().includes(needle) ||
        v.location.toLowerCase().includes(needle)
      );
    });
  }, [violations, status, q]);

  const counts = useMemo(() => {
    return {
      all: violations.length,
      pending: violations.filter((v) => v.status === "pending").length,
      confirmed: violations.filter((v) => v.status === "confirmed").length,
      dismissed: violations.filter((v) => v.status === "dismissed").length,
    } as Record<StatusFilter, number>;
  }, [violations]);

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
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
                  {counts[s]}
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
              placeholder="Search plate, type, location…"
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-72"
            />
          </label>
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-panel px-3 py-2 text-sm font-medium text-foreground hover:bg-panel-elevated">
            <Filter className="size-4" /> Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="panel overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border">
                {["Detected", "Plate", "Violation", "Location", "Camera", "AI", "Status", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-5 py-3 font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-sm text-subtle">
                    Loading detections…
                  </td>
                </tr>
              )}
              {!isLoading &&
                filtered.map((v) => (
                  <ViolationRow key={v.id} v={v} onReview={() => setReview(v)} />
                ))}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-sm text-subtle">
                    No violations match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ViolationReviewDialog violation={review} onClose={() => setReview(null)} />
    </div>
  );
}

function ViolationRow({ v, onReview }: { v: Violation; onReview: () => void }) {
  const conf = Number(v.confidence);
  const confTone = conf >= 90 ? "text-success" : conf >= 80 ? "text-primary" : "text-warning";
  const statusTone =
    v.status === "confirmed"
      ? "bg-success/10 text-success border-success/30"
      : v.status === "dismissed"
        ? "bg-muted text-muted-foreground border-border"
        : "bg-warning/10 text-warning border-warning/30";

  return (
    <tr className="text-sm transition-colors hover:bg-panel-elevated/50">
      <td className="px-5 py-3">
        <div className="text-foreground">{timeAgo(v.detected_at)}</div>
        <div className="font-mono-tab text-[10px] text-subtle">
          {new Date(v.detected_at).toLocaleTimeString("en-PH")}
        </div>
      </td>
      <td className="px-5 py-3 font-mono-tab text-foreground">{v.plate_number}</td>
      <td className="px-5 py-3 text-foreground">{v.violation_type}</td>
      <td className="px-5 py-3 text-muted-foreground">{v.location}</td>
      <td className="px-5 py-3 font-mono-tab text-muted-foreground">{v.camera_code ?? "—"}</td>
      <td className="px-5 py-3">
        <span className={cn("font-mono-tab text-xs font-semibold", confTone)}>
          {conf.toFixed(1)}%
        </span>
      </td>
      <td className="px-5 py-3">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 font-mono-tab text-[10px] font-bold uppercase",
            statusTone,
          )}
        >
          {v.status}
        </span>
      </td>
      <td className="px-5 py-3 text-right">
        <button
          onClick={onReview}
          className="rounded-md border border-border px-3 py-1.5 font-mono-tab text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          Review
        </button>
      </td>
    </tr>
  );
}
