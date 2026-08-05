import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Video, Wifi, WifiOff, Wrench, Radio, Search } from "lucide-react";
import { useCameras, useViolations, type Camera } from "@/lib/data/traffic";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cameras/")({
  head: () => ({
    meta: [
      { title: "IoT Cameras · QC Traffic Ops" },
      {
        name: "description",
        content:
          "Live IoT enforcement camera network across Quezon City — uptime, health status, and per-camera detection counts.",
      },
      { property: "og:title", content: "IoT Cameras · QC Traffic Ops" },
      {
        property: "og:description",
        content:
          "Monitor the Quezon City enforcement camera network: uptime, health, and detections per node.",
      },
    ],
  }),
  component: CamerasPage,
});

const FILTERS = ["all", "online", "offline", "maintenance"] as const;
type CamFilter = (typeof FILTERS)[number];

function CamerasPage() {
  const { data: cameras = [], isLoading } = useCameras();
  const { data: violations = [] } = useViolations(200);
  const [filter, setFilter] = useState<CamFilter>("all");
  const [q, setQ] = useState("");

  const detectionsByCamera = useMemo(() => {
    const map: Record<string, number> = {};
    for (const v of violations) {
      if (!v.camera_code) continue;
      map[v.camera_code] = (map[v.camera_code] ?? 0) + 1;
    }
    return map;
  }, [violations]);

  const counts = useMemo(
    () => ({
      all: cameras.length,
      online: cameras.filter((c) => c.status === "online").length,
      offline: cameras.filter((c) => c.status === "offline").length,
      maintenance: cameras.filter((c) => c.status === "maintenance").length,
    }),
    [cameras],
  ) as Record<CamFilter, number>;

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return cameras.filter((c) => {
      if (filter !== "all" && c.status !== filter) return false;
      if (!needle) return true;
      return c.code.toLowerCase().includes(needle) || c.location.toLowerCase().includes(needle);
    });
  }, [cameras, filter, q]);

  const uptime = cameras.length > 0 ? Math.round((counts.online / cameras.length) * 1000) / 10 : 0;

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Nodes deployed" value={cameras.length} icon={Video} />
        <Kpi label="Online" value={counts.online} icon={Wifi} tone="text-success" />
        <Kpi label="Offline" value={counts.offline} icon={WifiOff} tone="text-danger" />
        <Kpi label="Network uptime" value={`${uptime}%`} icon={Radio} tone="text-primary" />
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
              {f}
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
            placeholder="Search camera code or location…"
            className="w-full rounded-lg border border-border bg-panel py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-80"
          />
        </label>
      </div>

      {isLoading ? (
        <div className="panel grid h-64 place-items-center rounded-2xl text-sm text-subtle">
          Establishing link with camera network…
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel grid h-64 place-items-center rounded-2xl text-sm text-subtle">
          No cameras match the current filters.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((cam) => (
            <CameraCard key={cam.id} camera={cam} detections={detectionsByCamera[cam.code] ?? 0} />
          ))}
        </div>
      )}
    </div>
  );
}

function CameraCard({ camera, detections }: { camera: Camera; detections: number }) {
  const online = camera.status === "online";
  const maintenance = camera.status === "maintenance";
  const StatusIcon = online ? Wifi : maintenance ? Wrench : WifiOff;
  const tone = online ? "text-success" : maintenance ? "text-warning" : "text-danger";

  return (
    <Link
      to="/cameras/$code"
      params={{ code: camera.code }}
      className="panel block overflow-hidden rounded-2xl transition-colors hover:border-primary/40"
    >
      <div className="relative aspect-video bg-panel-elevated">
        <div className="absolute inset-0 grid place-items-center">
          {online ? (
            <div className="flex flex-col items-center gap-2 text-subtle">
              <Video className="size-8" strokeWidth={1.5} />
              <span className="font-mono-tab text-[10px] uppercase tracking-widest">
                Live feed · 1080p
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-danger/70">
              <WifiOff className="size-8" strokeWidth={1.5} />
              <span className="font-mono-tab text-[10px] uppercase tracking-widest">No signal</span>
            </div>
          )}
        </div>
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-md bg-background/80 px-2 py-1 backdrop-blur-sm">
          <span
            className={cn(
              "size-1.5 rounded-full",
              online ? "animate-pulse bg-success" : maintenance ? "bg-warning" : "bg-danger",
            )}
          />
          <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-foreground">
            {camera.code}
          </span>
        </div>
        <div className="absolute bottom-3 right-3 rounded-md bg-background/80 px-2 py-1 font-mono-tab text-[10px] text-subtle backdrop-blur-sm">
          {detections} detections
        </div>
      </div>

      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-foreground">{camera.location}</h3>
          <p className="mt-0.5 font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
            {camera.lat != null && camera.lng != null
              ? `${camera.lat.toFixed(4)}, ${camera.lng.toFixed(4)}`
              : "Coordinates pending"}
          </p>
        </div>
        <span
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-panel-elevated px-2 py-1 font-mono-tab text-[10px] font-semibold uppercase tracking-widest",
            tone,
          )}
        >
          <StatusIcon className="size-3" />
          {camera.status}
        </span>
      </div>
    </Link>
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
  icon: typeof Video;
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
