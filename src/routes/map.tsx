import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { useViolations, useCameras, timeAgo, type Violation } from "@/lib/data/traffic";
import {
  QC_CENTER,
  downloadCsv,
  geocodeViolations,
  roadSegments,
  toCsv,
  violationColor,
} from "@/lib/data/gis";
import { cn } from "@/lib/utils";
import { Download, Filter, Layers, MapPin, Pause, Play, Radio, RotateCcw } from "lucide-react";

const LeafletMap = lazy(() => import("@/components/map/leaflet-map"));

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "GIS Live Map · Culiat Traffic Ops" },
      {
        name: "description",
        content:
          "Interactive Leaflet GIS heatmap of Barangay Culiat, Quezon City traffic violations with road segment filters, time-range playback, and CSV export.",
      },
      { property: "og:title", content: "GIS Live Map · Culiat Traffic Ops" },
      {
        property: "og:description",
        content: "Interactive heatmap of AI-detected traffic violations across Barangay Culiat, Quezon City.",
      },
    ],
  }),
  component: GisMapPage,
});

const WINDOW_PRESETS = [
  { label: "1H", hours: 1 },
  { label: "6H", hours: 6 },
  { label: "24H", hours: 24 },
  { label: "7D", hours: 24 * 7 },
];

function GisMapPage() {
  const { data: violations = [] } = useViolations(500);
  const { data: cameras = [] } = useCameras();

  const segments = useMemo(() => roadSegments(cameras), [cameras]);
  const [selectedSegments, setSelectedSegments] = useState<Set<string>>(new Set());
  const [windowHours, setWindowHours] = useState(24);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showCameras, setShowCameras] = useState(true);

  // Time-range playback. sliderPct = 0..100 → cursor position across window.
  const [sliderPct, setSliderPct] = useState(100);
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = t - last;
      last = t;
      setSliderPct((p) => {
        const next = p + (dt / 12000) * 100; // full sweep ≈ 12s
        if (next >= 100) {
          setPlaying(false);
          return 100;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing]);

  const geo = useMemo(() => geocodeViolations(violations, cameras), [violations, cameras]);

  // Window bounds
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const now = useMemo(() => Date.now(), [violations]);
  const windowStart = now - windowHours * 3600 * 1000;
  const cursorTs = windowStart + ((now - windowStart) * sliderPct) / 100;

  const filtered = useMemo(() => {
    return geo.filter((v) => {
      const ts = new Date(v.detected_at).getTime();
      if (ts < windowStart || ts > cursorTs) return false;
      if (selectedSegments.size && !selectedSegments.has(v.location)) return false;
      return true;
    });
  }, [geo, windowStart, cursorTs, selectedSegments]);

  const analytics = useMemo(() => computeAnalytics(filtered), [filtered]);

  const toggleSegment = (s: string) => {
    setSelectedSegments((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const handleExport = () => {
    const csv = toCsv(filtered);
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadCsv(`qc-violations-${stamp}.csv`, csv);
  };

  return (
    <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-12 lg:p-8">
      {/* MAP */}
      <section className="lg:col-span-8">
        <div className="panel relative h-[720px] overflow-hidden rounded-3xl">
          <ClientOnly fallback={<MapSkeleton />}>
            <Suspense fallback={<MapSkeleton />}>
              <LeafletMap
                violations={filtered}
                cameras={cameras}
                center={QC_CENTER}
                showHeatmap={showHeatmap}
                showMarkers={showMarkers}
                showCameras={showCameras}
              />
            </Suspense>
          </ClientOnly>

          {/* Overlay header */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
            <div className="pointer-events-auto rounded-xl border border-border bg-background/80 px-3 py-2 backdrop-blur-md">
              <p className="font-mono text-[10px] uppercase tracking-widest text-subtle">
                Barangay Culiat, Quezon City · Live GIS
              </p>
              <p className="text-sm font-semibold text-foreground">
                {filtered.length.toLocaleString()} detections in view
              </p>
            </div>

            <div className="pointer-events-auto flex flex-wrap items-center gap-2">
              <LayerToggle
                icon={Layers}
                active={showHeatmap}
                onClick={() => setShowHeatmap((v) => !v)}
                label="Heatmap"
              />
              <LayerToggle
                icon={MapPin}
                active={showMarkers}
                onClick={() => setShowMarkers((v) => !v)}
                label="Markers"
              />
              <LayerToggle
                icon={Radio}
                active={showCameras}
                onClick={() => setShowCameras((v) => !v)}
                label="Cameras"
              />
            </div>
          </div>

          {/* Legend */}
          <div className="pointer-events-none absolute bottom-4 left-4 rounded-xl border border-border bg-background/80 p-3 backdrop-blur-md">
            <p className="mb-2 font-mono text-[9px] uppercase tracking-widest text-subtle">
              Heat intensity
            </p>
            <div className="h-2 w-40 rounded-full bg-gradient-to-r from-[#3b82f6] via-[#10b981] via-60% to-[#ef4444]" />
            <div className="mt-1 flex justify-between font-mono text-[9px] text-subtle">
              <span>low</span>
              <span>critical</span>
            </div>
          </div>
        </div>

        {/* PLAYBACK */}
        <div className="panel mt-6 rounded-3xl p-5">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                if (sliderPct >= 100) setSliderPct(0);
                setPlaying((p) => !p);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
              {playing ? "Pause" : "Play"}
            </button>
            <button
              onClick={() => {
                setPlaying(false);
                setSliderPct(100);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-panel-elevated px-3 py-2 text-xs font-medium text-foreground hover:bg-panel"
              title="Reset"
            >
              <RotateCcw className="size-3.5" />
              Reset
            </button>

            <div className="ml-auto flex items-center gap-1 rounded-lg border border-border bg-panel-elevated p-1">
              {WINDOW_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => {
                    setWindowHours(p.hours);
                    setSliderPct(100);
                  }}
                  className={cn(
                    "rounded-md px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest",
                    windowHours === p.hours
                      ? "bg-primary/20 text-primary"
                      : "text-subtle hover:text-foreground",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-panel-elevated px-3 py-2 text-xs font-medium text-foreground hover:bg-panel"
            >
              <Download className="size-3.5" />
              Export CSV
            </button>
          </div>

          <div className="mt-4">
            <input
              type="range"
              min={0}
              max={100}
              step={0.5}
              value={sliderPct}
              onChange={(e) => {
                setPlaying(false);
                setSliderPct(Number(e.target.value));
              }}
              className="w-full accent-primary"
              aria-label="Time cursor"
            />
            <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-widest text-subtle">
              <span>{new Date(windowStart).toLocaleString()}</span>
              <span className="text-primary">cursor · {new Date(cursorTs).toLocaleString()}</span>
              <span>{new Date(now).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </section>

      {/* SIDE PANEL */}
      <aside className="flex flex-col gap-6 lg:col-span-4">
        {/* Segment filter */}
        <div className="panel overflow-hidden rounded-3xl">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Road segments</h3>
            </div>
            {selectedSegments.size > 0 && (
              <button
                onClick={() => setSelectedSegments(new Set())}
                className="font-mono text-[10px] uppercase tracking-widest text-subtle hover:text-foreground"
              >
                Clear · {selectedSegments.size}
              </button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto p-3">
            {segments.length === 0 && (
              <p className="p-3 text-xs text-subtle">No segments available.</p>
            )}
            {segments.map((s) => {
              const active = selectedSegments.has(s);
              const count = analytics.perSegment.get(s) ?? 0;
              return (
                <button
                  key={s}
                  onClick={() => toggleSegment(s)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors",
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-panel-elevated hover:text-foreground",
                  )}
                >
                  <span className="truncate">{s}</span>
                  <span className="font-mono text-[10px] text-subtle">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Analytics */}
        <div className="panel rounded-3xl p-5">
          <h3 className="text-sm font-semibold text-foreground">Window analytics</h3>
          <p className="font-mono text-[10px] uppercase tracking-widest text-subtle">
            Data currently on the map
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat label="Detections" value={analytics.total.toLocaleString()} />
            <Stat label="Avg confidence" value={`${analytics.avgConfidence.toFixed(1)}%`} />
            <Stat label="Segments" value={String(analytics.perSegment.size)} />
            <Stat label="Types" value={String(analytics.perType.size)} />
          </div>

          <div className="mt-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-subtle">By type</p>
            <div className="mt-2 space-y-2">
              {[...analytics.perType.entries()]
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([type, count]) => {
                  const pct = analytics.total ? (count / analytics.total) * 100 : 0;
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="truncate text-foreground">{type}</span>
                        <span className="font-mono text-[10px] text-subtle">
                          {count} · {pct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-panel-elevated">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: violationColor(type),
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              {analytics.total === 0 && (
                <p className="text-xs text-subtle">No detections in current window.</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent in window */}
        <div className="panel overflow-hidden rounded-3xl">
          <div className="border-b border-border p-5">
            <h3 className="text-sm font-semibold text-foreground">Recent in window</h3>
          </div>
          <div className="max-h-72 divide-y divide-border overflow-y-auto">
            {filtered.slice(0, 12).map((v) => (
              <RowItem key={v.id} v={v} />
            ))}
            {filtered.length === 0 && (
              <div className="p-6 text-center text-xs text-subtle">No detections</div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

function MapSkeleton() {
  return (
    <div className="grid size-full place-items-center bg-panel-elevated">
      <div className="text-xs uppercase tracking-widest text-subtle">Loading GIS layers…</div>
    </div>
  );
}

function LayerToggle({
  icon: Icon,
  active,
  onClick,
  label,
}: {
  icon: typeof Layers;
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium backdrop-blur-md transition-colors",
        active
          ? "border-primary/50 bg-primary/20 text-primary"
          : "border-border bg-background/70 text-muted-foreground hover:text-foreground",
      )}
      aria-pressed={active}
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-panel-elevated p-3">
      <p className="font-mono text-[9px] uppercase tracking-widest text-subtle">{label}</p>
      <p className="mt-1 font-mono text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}

function RowItem({ v }: { v: Violation }) {
  return (
    <div className="flex items-center justify-between gap-3 p-3">
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold uppercase tracking-wide text-foreground">
          {v.violation_type}
        </p>
        <p className="truncate text-[11px] text-subtle">
          <span className="font-mono text-muted-foreground">{v.plate_number}</span>
          {" · "}
          {v.location}
        </p>
      </div>
      <span className="shrink-0 font-mono text-[10px] text-subtle">{timeAgo(v.detected_at)}</span>
    </div>
  );
}

function computeAnalytics(
  rows: { violation_type: string; location: string; confidence: number }[],
) {
  const perType = new Map<string, number>();
  const perSegment = new Map<string, number>();
  let confSum = 0;
  for (const r of rows) {
    perType.set(r.violation_type, (perType.get(r.violation_type) ?? 0) + 1);
    perSegment.set(r.location, (perSegment.get(r.location) ?? 0) + 1);
    confSum += Number(r.confidence) || 0;
  }
  return {
    total: rows.length,
    avgConfidence: rows.length ? confSum / rows.length : 0,
    perType,
    perSegment,
  };
}
