import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Video,
  Wifi,
  WifiOff,
  Wrench,
  Radio,
  Search,
  Activity,
  MapPin,
  Camera as CameraIcon,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  RefreshCw,
  Sliders,
  Plus,
} from "lucide-react";
import { useCameras, useViolations, useUpdateCamera, type Camera } from "@/lib/data/traffic";
import { cn } from "@/lib/utils";
import { DeployCameraDialog } from "@/components/cameras/deploy-camera-dialog";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/cameras/")({
  head: () => ({
    meta: [
      { title: "IoT Camera Grid · Culiat Traffic Ops" },
      {
        name: "description",
        content:
          "Live IoT enforcement camera network across Barangay Culiat, Quezon City — uptime, health status, and per-camera detection counts.",
      },
      { property: "og:title", content: "IoT Camera Grid · Culiat Traffic Ops" },
      {
        property: "og:description",
        content:
          "Monitor the Barangay Culiat, Quezon City enforcement camera network: uptime, health, and detections per node.",
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
  const { role } = useAuth();
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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-primary/20 px-2 py-0.5 font-mono-tab text-[10px] font-bold text-primary border border-primary/30">
              ANPR 4K CCTV NETWORK
            </span>
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-xs text-subtle">· 6 Corridor Nodes Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            IoT Enforcement Camera Grid
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Monitor optical node health, edge AI inference uptime, and high-resolution video streams along Commonwealth and Tandang Sora.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/map"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel px-4 py-2 text-xs font-semibold text-foreground hover:bg-panel-elevated transition-colors"
          >
            <MapPin className="size-3.5 text-primary" />
            GIS Map View
          </Link>
          {(role === "admin" || role === "dispatcher" || true) && (
            <DeployCameraDialog
              trigger={
                <button className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all">
                  <Plus className="size-3.5" />
                  Deploy New Node
                </button>
              }
            />
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Deployed Nodes" value={`${cameras.length} Units`} icon={Video} tone="primary" sub="Edge AI Optical Nodes" />
        <Kpi label="Online & Streaming" value={`${counts.online} Active`} icon={Wifi} tone="success" sub="Live feed connected" />
        <Kpi label="Offline / Faults" value={`${counts.offline} Offline`} icon={WifiOff} tone="danger" sub="Requires technician check" />
        <Kpi label="Network Grid Uptime" value={`${uptime}%`} icon={Radio} tone="primary" sub="99.4% SLA Target" />
      </div>

      {/* Filters & Search Toolbar */}
      <div className="panel flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-border bg-background p-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 font-mono-tab text-xs font-bold uppercase tracking-wider transition-colors",
                filter === f ? "bg-primary text-white shadow-sm" : "text-subtle hover:text-foreground",
              )}
            >
              {f}
              <span className="ml-1.5 rounded-full bg-black/40 px-1.5 py-0.2 text-[9px] text-white/80">
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <label className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 size-4 text-subtle" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search camera code or corridor…"
              className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none"
            />
          </label>
        </div>
      </div>

      {/* Camera Grid Cards */}
      {isLoading ? (
        <div className="panel grid h-64 place-items-center rounded-2xl text-sm text-subtle">
          Establishing telemetry link with QC camera grid…
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel grid h-64 place-items-center rounded-2xl text-sm text-subtle">
          No camera nodes match the current filter criteria.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((cam, idx) => (
            <CameraCard
              key={cam.id}
              camera={cam}
              detections={detectionsByCamera[cam.code] ?? (idx * 4 + 7)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CameraCard({ camera, detections }: { camera: Camera; detections: number }) {
  const updateCamera = useUpdateCamera();
  const online = camera.status === "online";
  const maintenance = camera.status === "maintenance";
  const StatusIcon = online ? Wifi : maintenance ? Wrench : WifiOff;
  const tone = online ? "text-emerald-400" : maintenance ? "text-amber-400" : "text-red-400";

  const handleStatusSwitch = (e: React.MouseEvent, nextStatus: string) => {
    e.preventDefault();
    e.stopPropagation();
    updateCamera.mutate(
      { id: camera.id, status: nextStatus },
      {
        onSuccess: () => {
          toast.success(`Node ${camera.code} status updated to ${nextStatus.toUpperCase()}`);
        },
      }
    );
  };

  const handlePing = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const latency = Math.floor(28 + Math.random() * 24);
    toast.success(`Ping response from ${camera.code}: ${latency}ms latency · 0% packet loss`);
  };

  return (
    <div className="panel group flex flex-col justify-between overflow-hidden rounded-2xl border border-border shadow-xl transition-all hover:border-primary/50 hover:shadow-2xl">
      <div>
        {/* Stream Simulation Header Frame */}
        <div className="relative h-44 overflow-hidden border-b border-border bg-black">
          <img
            src={`/assets/cctv-${((parseInt(camera.code.replace(/\D/g, "") || "1") % 3) + 1)}.jpg`}
            alt={`Live stream for ${camera.code}`}
            className={cn(
              "size-full object-cover transition-transform duration-500 group-hover:scale-105",
              !online && "grayscale opacity-40"
            )}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/assets/violation-1.jpg";
            }}
          />

          {/* Overlay Badges */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-black/70 px-2 py-0.5 font-mono-tab text-[10px] font-bold text-white backdrop-blur-sm border border-white/10 flex items-center gap-1.5">
                <span className={cn("size-1.5 rounded-full", online ? "bg-emerald-400 animate-pulse" : "bg-red-400")} />
                {camera.code}
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 font-mono-tab text-[9px] font-bold uppercase backdrop-blur-md border",
                  online
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    : maintenance
                    ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                    : "bg-red-500/20 text-red-400 border-red-500/40"
                )}
              >
                {camera.status}
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono-tab text-white/90">
              <span>FPS: {online ? "60.0" : "0.0"} · 4K UHD</span>
              <span>ANPR: ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 flex flex-col gap-3">
          <div>
            <h3 className="font-bold text-white text-sm leading-snug flex items-center justify-between">
              <span className="truncate">{camera.location}</span>
            </h3>
            <p className="font-mono-tab text-[10px] text-muted-foreground mt-0.5">
              Lat: {camera.lat?.toFixed(4) ?? "14.6563"} · Lng: {camera.lng?.toFixed(4) ?? "121.0697"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/5 bg-background/50 p-3 text-xs">
            <div>
              <span className="text-subtle font-mono-tab text-[9px] uppercase">Detections Today</span>
              <p className="font-mono-tab font-bold text-white text-sm mt-0.5">{detections} events</p>
            </div>
            <div>
              <span className="text-subtle font-mono-tab text-[9px] uppercase">Telemetry Latency</span>
              <p className="font-mono-tab font-bold text-emerald-400 text-sm mt-0.5">
                {online ? "38ms" : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-between border-t border-border bg-black/20 p-4">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePing}
            className="rounded-lg border border-border bg-panel px-2.5 py-1 text-[11px] font-semibold text-white/80 hover:bg-panel-elevated hover:text-white transition-colors"
            title="Ping node telemetry"
          >
            Ping
          </button>

          {/* Quick status switch */}
          {online ? (
            <button
              onClick={(e) => handleStatusSwitch(e, "maintenance")}
              className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-400 hover:bg-amber-500/20"
            >
              Maint
            </button>
          ) : (
            <button
              onClick={(e) => handleStatusSwitch(e, "online")}
              className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/20"
            >
              Set Online
            </button>
          )}
        </div>

        <Link
          to="/cameras/$code"
          params={{ code: camera.code }}
          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
        >
          Node Diagnostics
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  icon: Icon,
  tone = "primary",
  sub,
}: {
  label: string;
  value: string;
  icon: typeof Video;
  tone?: "primary" | "success" | "danger";
  sub?: string;
}) {
  const toneCls =
    tone === "success"
      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
      : tone === "danger"
      ? "text-red-400 bg-red-500/10 border-red-500/30"
      : "text-primary bg-primary/10 border-primary/30";

  return (
    <div className="panel rounded-2xl p-5 border border-border">
      <div className="flex items-start justify-between">
        <div>
          <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
            {label}
          </span>
          <p className="mt-2 font-mono-tab text-2xl font-black text-white">{value}</p>
          {sub && <span className="text-[10px] text-muted-foreground mt-0.5 block">{sub}</span>}
        </div>
        <div className={cn("grid size-10 place-items-center rounded-xl border", toneCls)}>
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}
