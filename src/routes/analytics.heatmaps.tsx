import { createFileRoute, Link, ClientOnly } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useHeatmapData, type HeatmapPoint } from "@/lib/data/heatmaps";
import { QC_CENTER } from "@/lib/data/gis";
import {
  Loader2,
  Flame,
  TrendingUp,
  Clock,
  AlertTriangle,
  ArrowLeft,
  ShieldAlert,
  Radio,
  Compass,
  Zap,
  Filter,
  Eye,
  CheckCircle2,
  Activity,
  MapPin,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Suspense, lazy } from "react";
import { DispatchDialog } from "@/components/dispatch/dispatch-dialog";
import { cn } from "@/lib/utils";

const PredictiveHeatmap = lazy(() => import("@/components/map/predictive-heatmap"));

export const Route = createFileRoute("/analytics/heatmaps")({
  head: () => ({
    meta: [{ title: "Predictive AI Heatmap & Telemetry — QC Flow Guardian" }],
  }),
  component: HeatmapsPage,
});

type SectorFocus = {
  id: string;
  name: string;
  badge: string;
  center: [number, number];
  zoom: number;
  corridor: string;
  hotspotNotes: string;
  predictedPrimaryOffense: string;
};

const SECTORS: SectorFocus[] = [
  {
    id: "all",
    name: "Quezon City Grid",
    badge: "Metro Wide",
    center: QC_CENTER,
    zoom: 13,
    corridor: "Full Citywide Telemetry Grid",
    hotspotNotes: "All 142 AI-calibrated intersections",
    predictedPrimaryOffense: "Citywide Distribution",
  },
  {
    id: "commonwealth",
    name: "Commonwealth Ave Corridor",
    badge: "18 Lanes",
    center: [14.685, 121.082],
    zoom: 15,
    corridor: "Commonwealth Ave (Batasan to Litex)",
    hotspotNotes: "Litex Market, Sandiganbayan, Doña Carmen",
    predictedPrimaryOffense: "Bus Lane Encroachment & Illegal Loading",
  },
  {
    id: "philcoa",
    name: "Philcoa & Elliptical Circle",
    badge: "Rotary Hub",
    center: [14.654, 121.052],
    zoom: 15,
    corridor: "Elliptical Rd & North Ave Connector",
    hotspotNotes: "Philcoa PUV Terminal, Agrifina Circle",
    predictedPrimaryOffense: "PUV Chokepoint & Yellow Box Obstruction",
  },
  {
    id: "tandangsora",
    name: "Tandang Sora Crossing",
    badge: "Intersection",
    center: [14.667, 121.045],
    zoom: 16,
    corridor: "Mindanao Ave x Tandang Sora",
    hotspotNotes: "St. James Flyover, Quirino Interchange",
    predictedPrimaryOffense: "Illegal Left Turns & Red Light Traversal",
  },
  {
    id: "katipunan",
    name: "Katipunan & C-5 Beltway",
    badge: "University Belt",
    center: [14.643, 121.074],
    zoom: 15,
    corridor: "Katipunan Ave (Ateneo / UP Gate)",
    hotspotNotes: "Miriam Overpass, Aurora Flyover Merge",
    predictedPrimaryOffense: "School Rush Double Parking & Overspeeding",
  },
  {
    id: "quirino",
    name: "Quirino Highway / Novaliches",
    badge: "Freight Arterial",
    center: [14.712, 121.037],
    zoom: 15,
    corridor: "Quirino Hwy (Novaliches Bayan)",
    hotspotNotes: "Mindanao Ave Ext, Jordan Plains",
    predictedPrimaryOffense: "Heavy Truck Stalling & Counterflow",
  },
];

type RiskFilter = "all" | "critical" | "warning";

function HeatmapsPage() {
  const { data, isLoading } = useHeatmapData();
  const [activeSector, setActiveSector] = useState<SectorFocus>(SECTORS[0]);
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [selectedHotspot, setSelectedHotspot] = useState<HeatmapPoint | null>(null);

  // Filter points according to selected risk level
  const filteredPoints = useMemo(() => {
    if (!data?.points) return [];
    if (riskFilter === "critical") {
      return data.points.filter((p) => p.intensity >= 0.8);
    }
    if (riskFilter === "warning") {
      return data.points.filter((p) => p.intensity >= 0.5);
    }
    return data.points;
  }, [data?.points, riskFilter]);

  // Top 5 Highest Risk Hotspots
  const topRiskHotspots = useMemo(() => {
    if (!data?.points) return [];
    return [...data.points]
      .sort((a, b) => b.intensity - a.intensity || b.predictedViolations - a.predictedViolations)
      .slice(0, 5);
  }, [data?.points]);

  const criticalCount = data?.points.filter((p) => p.intensity >= 0.8).length || 0;
  const warningCount = data?.points.filter((p) => p.intensity >= 0.5 && p.intensity < 0.8).length || 0;

  function handleSelectSector(sector: SectorFocus) {
    setActiveSector(sector);
    setSelectedHotspot(null);
  }

  function handleHotspotFocus(point: HeatmapPoint) {
    setSelectedHotspot(point);
    setActiveSector((prev) => ({
      ...prev,
      center: [point.lat, point.lng],
      zoom: 16,
    }));
  }

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/analytics"
            className="inline-flex size-10 items-center justify-center rounded-xl bg-panel border border-border text-white hover:bg-panel-elevated transition-colors"
            title="Return to Analytics Overview"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <Flame className="size-6 text-orange-500 animate-pulse" />
                Predictive AI GIS Heatmap
              </h1>
              <span className="rounded-full bg-orange-500/10 border border-orange-500/30 px-2.5 py-0.5 text-[10px] font-mono-tab font-semibold text-orange-400">
                PROBABILISTIC v3.4
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Deep temporal-spatial modeling for proactive patrol deployment and congestion deterrence.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs text-emerald-400 font-mono-tab">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
            </span>
            Spatial ML Engine Online
          </div>

          <DispatchDialog
            defaultLocation="Philcoa cor. Commonwealth Ave"
            defaultPriority="high"
            defaultInstructions="Predictive surge deployment: High-density violation probability detected in the upcoming 120-minute window. Maintain high visual deterrence."
            trigger={
              <button className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors">
                <Radio className="size-3.5" />
                Quick Tactical Dispatch
              </button>
            }
          />
        </div>
      </div>

      {/* Telemetry KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border/50 bg-panel/60 p-4 backdrop-blur-md">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Clock className="size-4 text-orange-400" />
            <span className="font-mono-tab uppercase tracking-wider text-[11px]">Peak Surge Window</span>
          </div>
          <div className="text-xl font-bold text-white mt-1 font-mono-tab">17:00 – 19:30</div>
          <p className="text-[11px] text-orange-400/90 mt-0.5">+140% violation density spike</p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-panel/60 p-4 backdrop-blur-md">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <ShieldAlert className="size-4 text-red-400" />
            <span className="font-mono-tab uppercase tracking-wider text-[11px]">Critical Hotspots</span>
          </div>
          <div className="text-xl font-bold text-white mt-1 font-mono-tab">
            {criticalCount} <span className="text-xs font-normal text-subtle">of {data?.points.length || 0} nodes</span>
          </div>
          <p className="text-[11px] text-red-400/90 mt-0.5">&gt;90% probability threshold</p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-panel/60 p-4 backdrop-blur-md">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Zap className="size-4 text-primary" />
            <span className="font-mono-tab uppercase tracking-wider text-[11px]">Mitigation Potential</span>
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1 font-mono-tab">-34.8%</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Est. with pre-positioned patrol</p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-panel/60 p-4 backdrop-blur-md">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Sparkles className="size-4 text-blue-400" />
            <span className="font-mono-tab uppercase tracking-wider text-[11px]">Model Confidence</span>
          </div>
          <div className="text-xl font-bold text-white mt-1 font-mono-tab">94.6%</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">14-day Bayesian historical fit</p>
        </div>
      </div>

      {/* Sector Quick Focus & Risk Level Filter Chips */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-panel/40 border border-border/40 rounded-2xl p-3 backdrop-blur-md">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-xs font-mono-tab uppercase tracking-wider text-subtle px-2 flex items-center gap-1.5 shrink-0">
            <Compass className="size-3.5 text-primary" /> Sector Focus:
          </span>
          {SECTORS.map((sector) => {
            const isSelected = activeSector.id === sector.id;
            return (
              <button
                key={sector.id}
                onClick={() => handleSelectSector(sector)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 font-semibold"
                    : "bg-panel border border-border/50 text-subtle hover:text-white hover:border-border"
                )}
              >
                <span>{sector.name}</span>
                <span
                  className={cn(
                    "text-[9px] font-mono-tab px-1.5 py-0.2 rounded-full",
                    isSelected ? "bg-black/25 text-white" : "bg-border text-muted-foreground"
                  )}
                >
                  {sector.badge}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-border/40">
          <span className="text-xs font-mono-tab uppercase tracking-wider text-subtle px-1 flex items-center gap-1">
            <Filter className="size-3 text-muted-foreground" /> Filter:
          </span>
          <button
            onClick={() => setRiskFilter("all")}
            className={cn(
              "px-2.5 py-1 text-xs rounded-lg font-mono-tab transition-colors",
              riskFilter === "all"
                ? "bg-white/10 text-white font-semibold"
                : "text-muted-foreground hover:text-white"
            )}
          >
            All ({data?.points.length || 0})
          </button>
          <button
            onClick={() => setRiskFilter("critical")}
            className={cn(
              "px-2.5 py-1 text-xs rounded-lg font-mono-tab transition-colors flex items-center gap-1",
              riskFilter === "critical"
                ? "bg-red-500/20 text-red-400 border border-red-500/30 font-semibold"
                : "text-red-400/70 hover:text-red-300"
            )}
          >
            <span className="size-1.5 rounded-full bg-red-500"></span>
            Critical ({criticalCount})
          </button>
          <button
            onClick={() => setRiskFilter("warning")}
            className={cn(
              "px-2.5 py-1 text-xs rounded-lg font-mono-tab transition-colors flex items-center gap-1",
              riskFilter === "warning"
                ? "bg-orange-500/20 text-orange-400 border border-orange-500/30 font-semibold"
                : "text-orange-400/70 hover:text-orange-300"
            )}
          >
            <span className="size-1.5 rounded-full bg-orange-500"></span>
            Warning+ ({criticalCount + warningCount})
          </button>
        </div>
      </div>

      {isLoading || !data ? (
        <div className="grid h-96 place-items-center rounded-2xl border border-border/50 bg-panel/30">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-xs font-mono-tab text-subtle">Aggregating geospatial telemetry & calculating risk gradients…</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-6 xl:grid-cols-3">
            {/* Predictive Map Overlay */}
            <div className="panel xl:col-span-2 overflow-hidden rounded-2xl border border-border/50 relative z-0 h-[620px] shadow-2xl bg-black">
              {/* Floating Top Left Tactical HUD */}
              <div className="absolute top-4 left-4 z-10 max-w-xs bg-black/85 backdrop-blur-md border border-white/10 rounded-xl p-3.5 shadow-2xl">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Activity className="size-3.5 text-orange-500" />
                    Probabilistic Heat Matrix
                  </h3>
                  <span className="text-[10px] font-mono-tab text-muted-foreground">T+4h Horizon</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full bg-red-500"></span>
                      <span className="text-white/80">Critical Risk</span>
                    </div>
                    <span className="font-mono-tab text-[11px] text-red-400 font-semibold">&gt;80% (High Surge)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full bg-orange-500"></span>
                      <span className="text-white/80">Elevated Warning</span>
                    </div>
                    <span className="font-mono-tab text-[11px] text-orange-400 font-semibold">50% – 79%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full bg-yellow-500"></span>
                      <span className="text-white/80">Nominal Alert</span>
                    </div>
                    <span className="font-mono-tab text-[11px] text-yellow-400 font-semibold">&lt;50%</span>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-white/10 text-[10px] text-muted-foreground flex items-center justify-between">
                  <span>Displaying: <strong className="text-white">{filteredPoints.length}</strong> nodes</span>
                  <span className="font-mono-tab text-primary">{activeSector.name}</span>
                </div>
              </div>

              {/* Floating Bottom Right Sector Details Badge */}
              <div className="absolute bottom-4 right-4 z-10 bg-black/85 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl hidden sm:block">
                <div className="flex items-center gap-2">
                  <MapPin className="size-3.5 text-primary" />
                  <span className="font-semibold text-white">{activeSector.name}</span>
                  <span className="text-subtle font-mono-tab text-[10px]">
                    {activeSector.center[0].toFixed(3)}, {activeSector.center[1].toFixed(3)}
                  </span>
                </div>
              </div>

              <ClientOnly
                fallback={
                  <div className="grid h-full place-items-center bg-background">
                    <Loader2 className="size-8 animate-spin text-primary" />
                  </div>
                }
              >
                <Suspense
                  fallback={
                    <div className="grid h-full place-items-center bg-background">
                      <Loader2 className="size-8 animate-spin text-primary" />
                    </div>
                  }
                >
                  <PredictiveHeatmap
                    points={filteredPoints}
                    center={activeSector.center}
                    zoom={activeSector.zoom}
                  />
                </Suspense>
              </ClientOnly>
            </div>

            {/* Time Series Forecast Panel */}
            <div className="panel xl:col-span-1 flex flex-col gap-4 rounded-2xl border border-border/50 p-6 shadow-xl h-[620px] bg-panel/70 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
                    <TrendingUp className="size-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-white">24h Violation Volume Forecast</h2>
                    <p className="text-xs text-muted-foreground">Actual Recorded vs AI Projected Peak</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 w-full mt-2 -ml-3">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.predictions}>
                    <defs>
                      <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                    <XAxis
                      dataKey="time"
                      stroke="#888"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      interval={3}
                    />
                    <YAxis stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        borderColor: "#3f3f46",
                        borderRadius: "10px",
                        fontSize: "12px",
                      }}
                      itemStyle={{ color: "#fff" }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                    <Area
                      type="monotone"
                      dataKey="actual"
                      name="Actual Recorded"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorActual)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="predicted"
                      name="AI Predicted Curve"
                      stroke="#f97316"
                      fillOpacity={1}
                      fill="url(#colorPredicted)"
                      strokeDasharray="4 4"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Actionable Rush Hour Alert Card with 1-Click Tactical Dispatch */}
              <div className="rounded-xl bg-orange-500/10 border border-orange-500/25 p-4">
                <div className="flex items-start gap-3">
                  <div className="size-8 rounded-lg bg-orange-500/20 text-orange-400 grid place-items-center shrink-0">
                    <Clock className="size-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-orange-400">Evening Rush Surge Warning</h4>
                      <span className="text-[10px] font-mono-tab bg-orange-500/20 px-2 py-0.5 rounded text-orange-300">
                        17:00 EST
                      </span>
                    </div>
                    <p className="text-xs text-orange-300/80 mt-1 leading-relaxed">
                      AI model projects a 140% violation spike along Commonwealth & Philcoa. Recommend establishing high-visibility deterrent patrols.
                    </p>

                    <div className="mt-3">
                      <DispatchDialog
                        defaultLocation="Commonwealth Ave cor. Philcoa Rotary"
                        defaultPriority="high"
                        defaultInstructions="Rush Hour Deterrence: Deploy 2 motorcycle patrol units to Philcoa rotary to prevent yellow box blockages and PUV illegal staging."
                        trigger={
                          <button className="inline-flex items-center gap-2 rounded-lg bg-orange-500 hover:bg-orange-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md transition-colors">
                            <Radio className="size-3.5" />
                            Dispatch Units to Philcoa Sector
                          </button>
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* High-Risk Hotspot Intervention Dispatch Queue */}
          <div className="panel rounded-2xl border border-border/50 p-6 shadow-xl bg-panel/70 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/50 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="size-5 text-red-500" />
                  High-Risk Hotspot Tactical Intervention Queue
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Top 5 highest probability violation clusters ranked by predictive volume and severity.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono-tab text-subtle">Click a sector to inspect on GIS map</span>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/40 text-[11px] font-mono-tab uppercase tracking-wider text-muted-foreground">
                    <th className="py-3 px-3">Rank</th>
                    <th className="py-3 px-3">Hotspot Sector / Location</th>
                    <th className="py-3 px-3">Risk Probability</th>
                    <th className="py-3 px-3">Predicted Volume</th>
                    <th className="py-3 px-3">Primary Offense Risk</th>
                    <th className="py-3 px-3 text-right">Intervention Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {topRiskHotspots.map((point, index) => {
                    const isSelected = selectedHotspot?.id === point.id;
                    const riskPercent = Math.round(point.intensity * 100);
                    const isCritical = point.intensity >= 0.8;
                    const primaryOffenses = [
                      "Bus Lane Intrusion & Swerving",
                      "Yellow Box Blocking / PUV Staging",
                      "Red Light Traversal & Speeding",
                      "Counterflow Across Median",
                      "Illegal Loading / Obstruction",
                    ];
                    const predictedOffense = primaryOffenses[index % primaryOffenses.length];

                    return (
                      <tr
                        key={point.id}
                        className={cn(
                          "transition-colors hover:bg-white/[0.03]",
                          isSelected ? "bg-primary/10" : ""
                        )}
                      >
                        <td className="py-3 px-3 font-mono-tab font-bold">
                          <span
                            className={cn(
                              "inline-grid size-6 place-items-center rounded-lg text-xs",
                              index === 0
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : index === 1
                                ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                                : "bg-white/10 text-white border border-white/10"
                            )}
                          >
                            #{index + 1}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => handleHotspotFocus(point)}
                            className="text-left group flex flex-col"
                          >
                            <span className="font-semibold text-white group-hover:text-primary transition-colors flex items-center gap-1.5">
                              {point.label}
                              <ChevronRight className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                            </span>
                            <span className="font-mono-tab text-[10px] text-muted-foreground">
                              {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                            </span>
                          </button>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  isCritical ? "bg-red-500" : "bg-orange-500"
                                )}
                                style={{ width: `${riskPercent}%` }}
                              />
                            </div>
                            <span
                              className={cn(
                                "font-mono-tab text-xs font-semibold",
                                isCritical ? "text-red-400" : "text-orange-400"
                              )}
                            >
                              {riskPercent}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono-tab text-xs text-white">
                          <span className="font-bold text-orange-400">+{point.predictedViolations}</span> / 4hrs
                        </td>
                        <td className="py-3 px-3 text-xs text-subtle">
                          <div className="flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-orange-400"></span>
                            <span>{predictedOffense}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleHotspotFocus(point)}
                              className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-panel px-2.5 py-1.5 text-xs text-subtle hover:text-white hover:bg-panel-elevated transition-colors"
                              title="Zoom to hotspot on GIS map"
                            >
                              <Eye className="size-3.5" />
                              View
                            </button>

                            <DispatchDialog
                              defaultLocation={point.label}
                              defaultPriority={isCritical ? "critical" : "high"}
                              defaultInstructions={`Predictive AI Surge Response: Area flagged with ${riskPercent}% risk and +${point.predictedViolations} projected offenses (${predictedOffense}). Deploy patrol unit immediately to establish checkpoint.`}
                              trigger={
                                <button className="inline-flex items-center gap-1.5 rounded-lg bg-primary/20 border border-primary/40 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/30 transition-colors">
                                  <Radio className="size-3.5" />
                                  Deploy Patrol
                                </button>
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

