import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowLeft, Phone, ShieldCheck, Radio, CreditCard, MapPin, Activity } from "lucide-react";
import { useOfficers, useCitations, formatPeso, timeAgo, type Officer } from "@/lib/data/traffic";
import { useDispatches, DISPATCH_STATUS_LABEL } from "@/lib/data/dispatch";
import { DispatchDialog } from "@/components/dispatch/dispatch-dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/officers/$badge")({
  head: ({ params }) => ({
    meta: [
      { title: `Officer #${params.badge} · QC Traffic Ops` },
      {
        name: "description",
        content: `Service record for Quezon City traffic enforcer badge #${params.badge}: duty status, citations issued, revenue collected and dispatch history.`,
      },
      {
        property: "og:title",
        content: `Officer #${params.badge} · QC Traffic Ops`,
      },
      {
        property: "og:description",
        content:
          "Officer service record: duty status, citation output, collections and dispatch assignments.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OfficerDetailPage,
});

function OfficerDetailPage() {
  const { badge } = useParams({ from: "/officers/$badge" });
  const { data: officers = [], isLoading } = useOfficers();
  const { data: citations = [] } = useCitations(200);
  const { data: dispatches = [] } = useDispatches(200);

  const officer = officers.find((o) => o.badge_number === badge);

  const own = useMemo(
    () => (officer ? citations.filter((c) => c.officer_name === officer.full_name) : []),
    [citations, officer],
  );

  const ownDispatches = useMemo(
    () => dispatches.filter((d) => d.badge_number === badge),
    [dispatches, badge],
  );

  const collected = own
    .filter((c) => c.status === "paid")
    .reduce((s, c) => s + Number(c.amount), 0);
  const outstanding = own
    .filter((c) => c.status !== "paid" && c.status !== "dismissed")
    .reduce((s, c) => s + Number(c.amount), 0);

  if (isLoading) {
    return (
      <div className="grid h-64 place-items-center text-sm text-subtle">
        Loading officer record…
      </div>
    );
  }

  if (!officer) {
    return (
      <div className="flex flex-col items-center gap-4 p-16 text-center">
        <p className="text-sm text-subtle">No officer found for badge #{badge}.</p>
        <Link
          to="/officers"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Back to roster
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <Link
        to="/officers"
        className="flex w-fit items-center gap-2 font-mono-tab text-[11px] uppercase tracking-widest text-subtle transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Roster
      </Link>

      <ProfileHeader officer={officer} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Citations issued"
          value={officer.citations_issued}
          icon={ShieldCheck}
          tone="text-primary"
        />
        <Kpi
          label="Collected"
          value={formatPeso(collected)}
          icon={CreditCard}
          tone="text-success"
        />
        <Kpi
          label="Outstanding"
          value={formatPeso(outstanding)}
          icon={CreditCard}
          tone="text-warning"
        />
        <Kpi
          label="Dispatch orders"
          value={ownDispatches.length}
          icon={Radio}
          tone="text-foreground"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="panel overflow-hidden rounded-2xl">
          <header className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">Citations issued</h2>
            <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
              {own.length} records
            </span>
          </header>
          {own.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-subtle">
              No citations recorded for this officer yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                    <th className="px-5 py-3 font-medium">Reference</th>
                    <th className="px-5 py-3 font-medium">Plate</th>
                    <th className="px-5 py-3 font-medium">Offense</th>
                    <th className="px-5 py-3 text-right font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {own.slice(0, 25).map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-border/60 last:border-0 hover:bg-panel-elevated/60"
                    >
                      <td className="px-5 py-3 font-mono-tab text-xs text-primary">
                        {c.citation_number}
                      </td>
                      <td className="px-5 py-3 font-mono-tab text-xs font-semibold text-foreground">
                        {c.plate_number}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{c.offense}</td>
                      <td className="px-5 py-3 text-right font-mono-tab text-foreground">
                        {formatPeso(Number(c.amount))}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            "rounded-md border px-2 py-0.5 font-mono-tab text-[10px] font-semibold uppercase tracking-widest",
                            c.status === "paid"
                              ? "border-success/30 bg-success/10 text-success"
                              : c.status === "contested"
                                ? "border-warning/30 bg-warning/10 text-warning"
                                : "border-border bg-panel-elevated text-muted-foreground",
                          )}
                        >
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel flex flex-col rounded-2xl">
          <header className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">Dispatch history</h2>
            <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
              {ownDispatches.length}
            </span>
          </header>
          <div className="flex flex-col gap-3 p-5">
            {ownDispatches.length === 0 ? (
              <p className="py-8 text-center text-sm text-subtle">No dispatch orders assigned.</p>
            ) : (
              ownDispatches.slice(0, 12).map((d) => (
                <div
                  key={d.id}
                  className="rounded-xl border border-border bg-panel-elevated/50 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono-tab text-[10px] uppercase tracking-widest text-primary">
                      {d.reference}
                    </span>
                    <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                      {DISPATCH_STATUS_LABEL[d.status]}
                    </span>
                  </div>
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm text-foreground">
                    <MapPin className="size-3.5 text-subtle" />
                    {d.location}
                  </p>
                  <p className="mt-1 font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                    {d.priority} · {timeAgo(d.created_at)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function ProfileHeader({ officer }: { officer: Officer }) {
  return (
    <div className="panel flex flex-col gap-5 rounded-2xl p-6 sm:flex-row sm:items-center">
      <div className="relative grid size-16 shrink-0 place-items-center rounded-2xl bg-panel-elevated font-mono-tab text-lg font-bold text-foreground ring-1 ring-border">
        {officer.full_name
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((p) => p[0]?.toUpperCase())
          .join("")}
        {officer.on_duty && (
          <span className="absolute -bottom-1 -right-1 size-4 rounded-full border-2 border-panel bg-success" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">
          {officer.full_name}
        </h1>
        <p className="font-mono-tab text-[11px] uppercase tracking-widest text-subtle">
          Badge #{officer.badge_number} · {officer.rank} · {officer.unit} · {officer.district}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-md border px-2 py-0.5 font-mono-tab text-[10px] font-semibold uppercase tracking-widest",
              officer.status === "active"
                ? "border-success/30 bg-success/10 text-success"
                : officer.status === "on_leave"
                  ? "border-warning/30 bg-warning/10 text-warning"
                  : "border-danger/30 bg-danger/10 text-danger",
            )}
          >
            {officer.status.replace("_", " ")}
          </span>
          <span className="flex items-center gap-1.5 font-mono-tab text-[11px] text-muted-foreground">
            <Activity className="size-3.5 text-subtle" />
            {officer.on_duty ? "On duty" : "Off duty"}
          </span>
          {officer.contact_number && (
            <span className="flex items-center gap-1.5 font-mono-tab text-[11px] text-muted-foreground">
              <Phone className="size-3.5 text-subtle" />
              {officer.contact_number}
            </span>
          )}
        </div>
      </div>
      <DispatchDialog
        trigger={
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90">
            <Radio className="size-4" /> Dispatch this officer
          </button>
        }
      />
    </div>
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
  icon: typeof Radio;
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
      <p className={cn("mt-3 font-mono-tab text-2xl font-bold", tone)}>{value}</p>
    </div>
  );
}
