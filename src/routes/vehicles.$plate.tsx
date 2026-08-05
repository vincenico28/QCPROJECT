import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  ArrowLeft,
  Car,
  ShieldAlert,
  CreditCard,
  MapPin,
  Camera as CameraIcon,
  Radio,
  Ban,
} from "lucide-react";
import { useViolations, useCitations, formatPeso, timeAgo } from "@/lib/data/traffic";
import { DispatchDialog } from "@/components/dispatch/dispatch-dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/vehicles/$plate")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.plate} · Vehicle Record · QC Traffic Ops` },
      {
        name: "description",
        content: `Enforcement record for plate ${params.plate}: AI detections, issued citations, outstanding balance and watchlist risk level in Quezon City.`,
      },
      {
        property: "og:title",
        content: `${params.plate} · Vehicle Record · QC Traffic Ops`,
      },
      {
        property: "og:description",
        content:
          "Vehicle enforcement record: detections, citations, outstanding fines and risk level.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VehicleDetailPage,
});

function VehicleDetailPage() {
  const { plate } = useParams({ from: "/vehicles/$plate" });
  const { data: violations = [], isLoading: vLoading } = useViolations(500);
  const { data: citations = [], isLoading: cLoading } = useCitations(500);

  const own = useMemo(
    () => violations.filter((v) => v.plate_number === plate),
    [violations, plate],
  );
  const ownCitations = useMemo(
    () => citations.filter((c) => c.plate_number === plate),
    [citations, plate],
  );

  const outstanding = ownCitations
    .filter((c) => c.status === "unpaid" || c.status === "overdue")
    .reduce((s, c) => s + Number(c.amount), 0);
  const paid = ownCitations
    .filter((c) => c.status === "paid")
    .reduce((s, c) => s + Number(c.amount), 0);
  const totalRecords = own.length + ownCitations.length;
  const unpaidCount = ownCitations.filter(
    (c) => c.status === "unpaid" || c.status === "overdue",
  ).length;

  const risk: "clean" | "watch" | "flagged" | "blocked" =
    outstanding >= 5000 || unpaidCount >= 3
      ? "blocked"
      : totalRecords >= 4 || outstanding > 0
        ? "flagged"
        : totalRecords >= 2
          ? "watch"
          : "clean";

  const model = ownCitations.find((c) => c.vehicle_model)?.vehicle_model ?? null;

  const timeline = useMemo(() => {
    const items = [
      ...own.map((v) => ({
        kind: "detection" as const,
        at: v.detected_at,
        title: v.violation_type,
        location: v.location,
        meta: `${Math.round(Number(v.confidence) * (Number(v.confidence) <= 1 ? 100 : 1))}% AI · ${v.camera_code ?? "—"}`,
        status: v.status,
      })),
      ...ownCitations.map((c) => ({
        kind: "citation" as const,
        at: c.issued_at,
        title: `${c.citation_number} — ${c.offense}`,
        location: c.officer_name ?? "Unassigned officer",
        meta: formatPeso(Number(c.amount)),
        status: c.status,
      })),
    ];
    items.sort((a, b) => +new Date(b.at) - +new Date(a.at));
    return items;
  }, [own, ownCitations]);

  const lastSeen = timeline[0];
  const isLoading = vLoading || cLoading;

  if (isLoading) {
    return (
      <div className="grid h-64 place-items-center text-sm text-subtle">
        Loading vehicle record…
      </div>
    );
  }

  if (totalRecords === 0) {
    return (
      <div className="flex flex-col items-center gap-4 p-16 text-center">
        <p className="text-sm text-subtle">No enforcement record found for plate {plate}.</p>
        <Link
          to="/vehicles"
          className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-panel-elevated"
        >
          Back to registry
        </Link>
      </div>
    );
  }

  const riskTone =
    risk === "clean"
      ? "bg-success/10 text-success border-success/30"
      : risk === "watch"
        ? "bg-primary/10 text-primary border-primary/30"
        : risk === "flagged"
          ? "bg-warning/10 text-warning border-warning/30"
          : "bg-danger/10 text-danger border-danger/30";

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <Link
        to="/vehicles"
        className="inline-flex w-fit items-center gap-2 text-xs text-subtle transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Vehicle registry
      </Link>

      {/* Header */}
      <div className="panel flex flex-col gap-5 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid size-14 place-items-center rounded-xl bg-primary/10 text-primary">
            <Car className="size-6" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="font-mono-tab text-2xl font-semibold tracking-tight text-foreground">
              {plate}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{model ?? "Vehicle model unknown"}</span>
              <span className="text-subtle">·</span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 font-mono-tab text-[10px] font-bold uppercase",
                  riskTone,
                )}
              >
                {risk}
              </span>
              {lastSeen && (
                <>
                  <span className="text-subtle">·</span>
                  <span>Last seen {timeAgo(lastSeen.at)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <DispatchDialog
          trigger={
            <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
              <Radio className="size-4" /> Dispatch intercept
            </button>
          }
        />
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={ShieldAlert}
          label="AI Detections"
          value={own.length.toLocaleString()}
          tone="primary"
        />
        <Stat
          icon={CreditCard}
          label="Citations Issued"
          value={ownCitations.length.toLocaleString()}
          tone="primary"
        />
        <Stat
          icon={Ban}
          label="Outstanding"
          value={formatPeso(outstanding)}
          tone={outstanding > 0 ? "danger" : "success"}
        />
        <Stat icon={CreditCard} label="Settled" value={formatPeso(paid)} tone="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Timeline */}
        <div className="panel rounded-2xl p-6">
          <h2 className="font-mono-tab text-[11px] font-semibold uppercase tracking-widest text-subtle">
            Enforcement Timeline
          </h2>
          <ol className="mt-5 flex flex-col gap-4">
            {timeline.map((t, i) => (
              <li key={`${t.kind}-${i}`} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "mt-1 grid size-7 shrink-0 place-items-center rounded-lg",
                      t.kind === "citation"
                        ? "bg-warning/10 text-warning"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    {t.kind === "citation" ? (
                      <CreditCard className="size-3.5" />
                    ) : (
                      <CameraIcon className="size-3.5" />
                    )}
                  </span>
                  {i < timeline.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
                </div>
                <div className="flex-1 pb-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">{t.title}</span>
                    <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                      {timeAgo(t.at)}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="size-3 text-subtle" />
                    <span>{t.location}</span>
                    <span className="text-subtle">·</span>
                    <span className="font-mono-tab">{t.meta}</span>
                    <span className="text-subtle">·</span>
                    <span className="font-mono-tab uppercase">{t.status}</span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Citations ledger */}
        <div className="panel rounded-2xl p-6">
          <h2 className="font-mono-tab text-[11px] font-semibold uppercase tracking-widest text-subtle">
            Citation Ledger
          </h2>
          {ownCitations.length === 0 && (
            <p className="mt-5 text-sm text-subtle">No citations issued to this vehicle.</p>
          )}
          <div className="mt-5 flex flex-col gap-3">
            {ownCitations.map((c) => (
              <div key={c.id} className="rounded-xl border border-border bg-panel-elevated/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono-tab text-sm font-semibold text-foreground">
                    {c.citation_number}
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 font-mono-tab text-[10px] font-bold uppercase",
                      c.status === "paid"
                        ? "border-success/30 bg-success/10 text-success"
                        : c.status === "overdue"
                          ? "border-danger/30 bg-danger/10 text-danger"
                          : "border-warning/30 bg-warning/10 text-warning",
                    )}
                  >
                    {c.status}
                  </span>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">{c.offense}</div>
                <div className="mt-2 flex items-center justify-between text-xs text-subtle">
                  <span>{c.officer_name ?? "Unassigned"}</span>
                  <span className="font-mono-tab text-foreground">
                    {formatPeso(Number(c.amount))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Car;
  label: string;
  value: string;
  tone: "primary" | "warning" | "danger" | "success";
}) {
  const toneCls =
    tone === "danger"
      ? "text-danger bg-danger/10"
      : tone === "warning"
        ? "text-warning bg-warning/10"
        : tone === "success"
          ? "text-success bg-success/10"
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
