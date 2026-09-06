import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Download, TrendingUp, ShieldAlert, Banknote, Gauge, Flame } from "lucide-react";
import { useViolations, useCitations, useOfficers, formatPeso } from "@/lib/data/traffic";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Enforcement Analytics · Culiat Traffic Ops" },
      {
        name: "description",
        content:
          "Trend analysis of Barangay Culiat, Quezon City traffic violations, citation revenue, offense mix and officer performance.",
      },
      { property: "og:title", content: "Enforcement Analytics · Culiat Traffic Ops" },
      {
        property: "og:description",
        content:
          "Charts and exportable reports covering detections, revenue collection and enforcement performance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalyticsPage,
});

const RANGES = [
  { key: "7d", label: "7 Days", days: 7 },
  { key: "14d", label: "14 Days", days: 14 },
  { key: "30d", label: "30 Days", days: 30 },
] as const;

const PIE_TONES = [
  "var(--primary)",
  "var(--danger)",
  "var(--warning)",
  "var(--success)",
  "var(--muted-foreground)",
];

function dayKey(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

function AnalyticsPage() {
  const [range, setRange] = useState<(typeof RANGES)[number]["key"]>("14d");
  const days = RANGES.find((r) => r.key === range)!.days;

  const { data: violations = [], isLoading } = useViolations(500);
  const { data: citations = [] } = useCitations(500);
  const { data: officers = [] } = useOfficers();

  const since = useMemo(() => Date.now() - days * 24 * 60 * 60 * 1000, [days]);

  const scopedViolations = useMemo(
    () => violations.filter((v) => new Date(v.detected_at).getTime() >= since),
    [violations, since],
  );
  const scopedCitations = useMemo(
    () => citations.filter((c) => new Date(c.issued_at).getTime() >= since),
    [citations, since],
  );

  const trend = useMemo(() => {
    const buckets = new Map<
      string,
      { day: string; detections: number; citations: number; revenue: number }
    >();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
      buckets.set(d, { day: d.slice(5), detections: 0, citations: 0, revenue: 0 });
    }
    for (const v of scopedViolations) {
      const b = buckets.get(dayKey(v.detected_at));
      if (b) b.detections += 1;
    }
    for (const c of scopedCitations) {
      const b = buckets.get(dayKey(c.issued_at));
      if (!b) continue;
      b.citations += 1;
      if (c.status === "paid") b.revenue += Number(c.amount);
    }
    return [...buckets.values()];
  }, [scopedViolations, scopedCitations, days]);

  const offenseMix = useMemo(() => {
    const map = new Map<string, number>();
    for (const v of scopedViolations) {
      map.set(v.violation_type, (map.get(v.violation_type) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [scopedViolations]);

  const officerPerf = useMemo(
    () =>
      officers.slice(0, 8).map((o) => ({ name: o.badge_number, citations: o.citations_issued })),
    [officers],
  );

  const kpis = useMemo(() => {
    const paid = scopedCitations.filter((c) => c.status === "paid");
    const revenue = paid.reduce((s, c) => s + Number(c.amount), 0);
    const billed = scopedCitations.reduce((s, c) => s + Number(c.amount), 0);
    const avgConf =
      scopedViolations.length > 0
        ? scopedViolations.reduce((s, v) => s + Number(v.confidence), 0) / scopedViolations.length
        : 0;
    return {
      detections: scopedViolations.length,
      revenue,
      collection: billed > 0 ? (revenue / billed) * 100 : 0,
      avgConf,
    };
  }, [scopedViolations, scopedCitations]);

  async function exportReport() {
    const rows = [
      ["date", "detections", "citations", "revenue_php"],
      ...trend.map((t) => [t.day, t.detections, t.citations, t.revenue]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `qc-enforcement-analytics-${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      await supabase.from("audit_logs").insert({
        actor_name: "Operations Analyst",
        actor_role: "admin",
        action: "ANALYTICS_REPORT_EXPORTED",
        target_resource: `Range: ${range}`,
        details: `Exported ${rows.length - 1} daily records.`,
      });
    } catch (err) {
      console.warn(err);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-xl border border-border bg-panel p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={cn(
                "rounded-lg px-3 py-1.5 font-mono-tab text-[11px] font-bold uppercase tracking-widest transition-colors",
                range === r.key
                  ? "bg-primary/15 text-primary"
                  : "text-subtle hover:text-foreground",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/analytics/heatmaps"
            className="inline-flex items-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-xs font-semibold text-orange-400 hover:bg-orange-500/20 transition-all"
          >
            <Flame className="size-3.5 text-orange-500" />
            Predictive AI Heatmap
          </Link>
          <button
            onClick={exportReport}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-panel px-3 py-2 text-xs font-medium text-foreground hover:bg-panel-elevated"
          >
            <Download className="size-3.5" />
            Export report
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Detections"
          value={kpis.detections.toLocaleString()}
          icon={ShieldAlert}
          tone="danger"
        />
        <Kpi
          label="Collected Revenue"
          value={formatPeso(kpis.revenue).replace("PHP", "₱")}
          icon={Banknote}
          tone="success"
        />
        <Kpi
          label="Collection Rate"
          value={`${kpis.collection.toFixed(1)}%`}
          icon={TrendingUp}
          tone="primary"
        />
        <Kpi
          label="Avg AI Confidence"
          value={`${kpis.avgConf.toFixed(1)}%`}
          icon={Gauge}
          tone="warning"
        />
      </div>

      {/* Trend */}
      <section className="panel rounded-3xl p-6">
        <ChartHeading
          title="Detections vs Citations"
          sub={`Daily enforcement volume · last ${days} days`}
        />
        <div className="h-72 w-full">
          {isLoading ? (
            <div className="size-full animate-pulse rounded-xl bg-panel-elevated" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 12, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gDet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gCit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--warning)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--warning)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="detections"
                  stroke="var(--primary)"
                  fill="url(#gDet)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="citations"
                  stroke="var(--warning)"
                  fill="url(#gCit)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Offense mix */}
        <section className="panel rounded-3xl p-6">
          <ChartHeading title="Offense Mix" sub="Top violation categories" />
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={offenseMix}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  stroke="var(--background)"
                >
                  {offenseMix.map((_, i) => (
                    <Cell key={i} fill={PIE_TONES[i % PIE_TONES.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Officer performance */}
        <section className="panel rounded-3xl p-6">
          <ChartHeading title="Officer Performance" sub="Citations issued by badge" />
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={officerPerf} margin={{ top: 12, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--panel-elevated)" }} />
                <Bar dataKey="citations" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Revenue */}
      <section className="panel rounded-3xl p-6">
        <ChartHeading title="Daily Collected Revenue" sub="Paid citations only · PHP" />
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--panel-elevated)" }} />
              <Bar dataKey="revenue" fill="var(--success)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Corridor Risk & Hourly Traffic Spectrum */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Corridor Risk & Congestion Index */}
        <section className="panel rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <ChartHeading
              title="Corridor Risk & Congestion Index"
              sub="Multi-lane arterial radar breakdown"
            />
            <div className="flex flex-col gap-3">
              {[
                { name: "Commonwealth Ave", share: "42.8%", risk: "Critical (Level 4)", avgSpeed: "58 km/h", compliance: "78%", trendTone: "text-red-400" },
                { name: "Tandang Sora Underpass", share: "24.1%", risk: "Elevated (Level 3)", avgSpeed: "32 km/h", compliance: "84%", trendTone: "text-amber-400" },
                { name: "Visayas Ave Bypass", share: "16.5%", risk: "Moderate (Level 2)", avgSpeed: "41 km/h", compliance: "89%", trendTone: "text-sky-400" },
                { name: "Katipunan Ext (Culiat)", share: "11.4%", risk: "Normal (Level 1)", avgSpeed: "44 km/h", compliance: "93%", trendTone: "text-emerald-400" },
                { name: "Quirino Highway Ingress", share: "5.2%", risk: "Moderate (Level 2)", avgSpeed: "36 km/h", compliance: "87%", trendTone: "text-amber-400" },
              ].map((corridor) => (
                <div
                  key={corridor.name}
                  className="flex items-center justify-between rounded-2xl border border-border bg-panel-elevated/60 p-3.5 transition-all hover:border-primary/40"
                >
                  <div>
                    <p className="text-xs font-bold text-foreground">{corridor.name}</p>
                    <p className="font-mono-tab text-[10px] text-muted-foreground mt-0.5">
                      Avg Velocity: {corridor.avgSpeed} · Driver Compliance: {corridor.compliance}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={cn("font-mono-tab text-xs font-black", corridor.trendTone)}>
                      {corridor.share}
                    </span>
                    <span className="block font-mono-tab text-[9px] uppercase tracking-wider text-muted-foreground">
                      {corridor.risk}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between font-mono-tab text-[10px] text-muted-foreground border-t border-border/60 pt-3">
            <span>Dynamic Speed Regulation Active</span>
            <span>Sensor Network: 100% Online</span>
          </div>
        </section>

        {/* Peak Violation Hours Spectrum */}
        <section className="panel rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <ChartHeading
              title="24-Hour Peak Violation Spectrum"
              sub="Hourly incident density (06:00 - 21:00 windows)"
            />
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { hour: "06h", volume: 45 },
                    { hour: "07h", volume: 112 },
                    { hour: "08h", volume: 168 },
                    { hour: "09h", volume: 135 },
                    { hour: "10h", volume: 88 },
                    { hour: "11h", volume: 74 },
                    { hour: "12h", volume: 68 },
                    { hour: "13h", volume: 72 },
                    { hour: "14h", volume: 85 },
                    { hour: "15h", volume: 96 },
                    { hour: "16h", volume: 124 },
                    { hour: "17h", volume: 184 },
                    { hour: "18h", volume: 210 },
                    { hour: "19h", volume: 178 },
                    { hour: "20h", volume: 122 },
                    { hour: "21h", volume: 76 },
                  ]}
                  margin={{ top: 10, right: 8, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--panel-elevated)" }} />
                  <Bar
                    dataKey="volume"
                    fill="var(--primary)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between font-mono-tab text-[10px] text-muted-foreground border-t border-border/60 pt-3">
            <span className="text-amber-400 font-semibold">Peak: 18:00 (Evening Rush)</span>
            <span>Algorithm: Poisson Surge Model</span>
          </div>
        </section>
      </div>
    </div>
  );
}

const tooltipStyle = {
  background: "var(--panel-elevated)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
  color: "var(--foreground)",
} as const;

function ChartHeading({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <p className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">{sub}</p>
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
  value: string;
  icon: typeof TrendingUp;
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
      <p className="mt-3 font-mono-tab text-3xl font-bold tracking-tighter text-foreground">
        {value}
      </p>
    </div>
  );
}
