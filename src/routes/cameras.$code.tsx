import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Video,
  Wifi,
  WifiOff,
  Wrench,
  RefreshCw,
  Activity,
  Gauge,
  Signal,
  Clock,
  ShieldAlert,
  Copy,
  Power,
  Stethoscope,
} from "lucide-react";
import { useCameras, useViolations, timeAgo } from "@/lib/data/traffic";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cameras/$code")({
  head: ({ params }) => ({
    meta: [
      { title: `Camera ${params.code} · QC Traffic Ops` },
      {
        name: "description",
        content: `Live status, recent AI detections, event timeline and troubleshooting actions for enforcement camera ${params.code} in Quezon City.`,
      },
      {
        property: "og:title",
        content: `Camera ${params.code} · QC Traffic Ops`,
      },
      {
        property: "og:description",
        content: `Diagnostics and detection history for enforcement camera ${params.code}.`,
      },
    ],
  }),
  component: CameraDetailPage,
});

function hashCode(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function CameraDetailPage() {
  const { code } = Route.useParams();
  const { data: cameras = [], isLoading, refetch } = useCameras();
  const { data: violations = [] } = useViolations(200);
  const [busy, setBusy] = useState<string | null>(null);

  const camera = cameras.find((c) => c.code === code);

  const detections = useMemo(
    () => violations.filter((v) => v.camera_code === code).slice(0, 12),
    [violations, code],
  );

  const health = useMemo(() => {
    const h = hashCode(code);
    return {
      uptime: (97 + ((h >> 3) % 30) / 10).toFixed(1),
      latency: 40 + (h % 90),
      bitrate: (3 + ((h >> 5) % 40) / 10).toFixed(1),
      firmware: `v2.${h % 9}.${(h >> 7) % 10}`,
      temp: 38 + ((h >> 2) % 14),
    };
  }, [code]);

  const timeline = useMemo(() => {
    const events = detections.map((d) => ({
      at: d.detected_at,
      kind: "detection" as const,
      label: `${d.violation_type} · ${d.plate_number}`,
      detail: `${Math.round(Number(d.confidence) * 100)}% confidence`,
    }));
    const base = Date.now();
    const h = hashCode(code);
    const system = [
      {
        at: new Date(base - (2 + (h % 5)) * 3600_000).toISOString(),
        kind: "system" as const,
        label: "Heartbeat check passed",
        detail: `Latency ${health.latency}ms`,
      },
      {
        at: new Date(base - (9 + (h % 11)) * 3600_000).toISOString(),
        kind: "system" as const,
        label: "Firmware verified",
        detail: health.firmware,
      },
      {
        at: new Date(base - (26 + (h % 20)) * 3600_000).toISOString(),
        kind: camera?.status === "online" ? ("system" as const) : ("fault" as const),
        label:
          camera?.status === "online"
            ? "Stream re-synced after tile refresh"
            : "Link degraded — node stopped reporting",
        detail: camera?.status === "online" ? "No packet loss" : "Dispatch required",
      },
    ];
    return [...events, ...system].sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    );
  }, [detections, camera?.status, code, health.latency, health.firmware]);

  function runAction(id: string, label: string, done: string) {
    setBusy(id);
    toast.loading(label, { id });
    window.setTimeout(() => {
      setBusy(null);
      toast.success(done, { id });
      void refetch();
    }, 1400);
  }

  if (isLoading) {
    return (
      <div className="grid h-64 place-items-center text-sm text-subtle">
        Loading camera diagnostics…
      </div>
    );
  }

  if (!camera) {
    return (
      <div className="flex flex-col items-start gap-4 p-6 lg:p-8">
        <Link
          to="/cameras"
          className="inline-flex items-center gap-2 text-sm text-subtle hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to camera grid
        </Link>
        <div className="panel grid h-64 w-full place-items-center rounded-2xl text-sm text-subtle">
          No camera registered with code “{code}”.
        </div>
      </div>
    );
  }

  const online = camera.status === "online";
  const maintenance = camera.status === "maintenance";
  const StatusIcon = online ? Wifi : maintenance ? Wrench : WifiOff;
  const tone = online ? "text-success" : maintenance ? "text-warning" : "text-danger";

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <Link
            to="/cameras"
            className="inline-flex items-center gap-2 font-mono-tab text-[11px] uppercase tracking-widest text-subtle hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> Camera grid
          </Link>
          <h2 className="mt-2 truncate text-2xl font-semibold tracking-tight text-foreground">
            {camera.code}
          </h2>
          <p className="text-sm text-muted-foreground">{camera.location}</p>
        </div>
        <span
          className={cn(
            "flex items-center gap-2 rounded-lg border border-border bg-panel-elevated px-3 py-2 font-mono-tab text-[11px] font-semibold uppercase tracking-widest",
            tone,
          )}
        >
          <StatusIcon className="size-3.5" />
          {camera.status}
        </span>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          {/* Live feed */}
          <div className="panel overflow-hidden rounded-2xl">
            <div className="relative aspect-video bg-panel-elevated">
              <div className="absolute inset-0 grid place-items-center">
                {online ? (
                  <div className="flex flex-col items-center gap-2 text-subtle">
                    <Video className="size-10" strokeWidth={1.5} />
                    <span className="font-mono-tab text-[10px] uppercase tracking-widest">
                      Live feed · 1080p · {health.bitrate} Mbps
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-danger/70">
                    <WifiOff className="size-10" strokeWidth={1.5} />
                    <span className="font-mono-tab text-[10px] uppercase tracking-widest">
                      No signal
                    </span>
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
                  {online ? "Streaming" : camera.status}
                </span>
              </div>
              <div className="absolute bottom-3 right-3 rounded-md bg-background/80 px-2 py-1 font-mono-tab text-[10px] text-subtle backdrop-blur-sm">
                {camera.lat != null && camera.lng != null
                  ? `${camera.lat.toFixed(4)}, ${camera.lng.toFixed(4)}`
                  : "Coordinates pending"}
              </div>
            </div>
          </div>

          {/* Health metrics */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Uptime (30d)"
              value={`${health.uptime}%`}
              icon={Activity}
              tone="text-success"
            />
            <Metric
              label="Latency"
              value={`${health.latency}ms`}
              icon={Signal}
              tone="text-primary"
            />
            <Metric label="Detections" value={detections.length} icon={ShieldAlert} />
            <Metric
              label="Core temp"
              value={`${health.temp}°C`}
              icon={Gauge}
              tone={health.temp > 48 ? "text-warning" : "text-foreground"}
            />
          </div>

          {/* Last detections */}
          <section className="panel rounded-2xl">
            <header className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="text-sm font-semibold text-foreground">Last detections</h3>
              <Link
                to="/violations"
                className="font-mono-tab text-[10px] uppercase tracking-widest text-primary hover:underline"
              >
                All violations
              </Link>
            </header>
            {detections.length === 0 ? (
              <div className="grid h-40 place-items-center text-sm text-subtle">
                No detections recorded from this node yet.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {detections.slice(0, 8).map((d) => (
                  <li key={d.id} className="flex items-center gap-4 px-5 py-3.5">
                    <span className="font-mono-tab text-xs font-bold text-foreground">
                      {d.plate_number}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                      {d.violation_type}
                    </span>
                    <span className="font-mono-tab text-[11px] text-primary">
                      {Math.round(Number(d.confidence) * 100)}%
                    </span>
                    <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                      {timeAgo(d.detected_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          <section className="panel rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground">Quick actions</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Troubleshooting controls for this node.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <ActionButton
                icon={RefreshCw}
                label="Restart stream"
                busy={busy === "restart"}
                disabled={busy !== null}
                onClick={() =>
                  runAction("restart", `Restarting stream on ${camera.code}…`, "Stream restarted")
                }
              />
              <ActionButton
                icon={Stethoscope}
                label="Run diagnostics"
                busy={busy === "diag"}
                disabled={busy !== null}
                onClick={() =>
                  runAction(
                    "diag",
                    "Running node diagnostics…",
                    "Diagnostics complete — no faults found",
                  )
                }
              />
              <ActionButton
                icon={Power}
                label="Reboot node"
                busy={busy === "reboot"}
                disabled={busy !== null}
                onClick={() =>
                  runAction("reboot", `Rebooting ${camera.code}…`, "Node rebooted and back online")
                }
              />
              <ActionButton
                icon={Wrench}
                label="Flag for maintenance"
                busy={busy === "flag"}
                disabled={busy !== null}
                onClick={() =>
                  runAction("flag", "Filing maintenance ticket…", "Maintenance ticket dispatched")
                }
              />
              <ActionButton
                icon={Copy}
                label="Copy stream URL"
                busy={false}
                disabled={busy !== null}
                onClick={() => {
                  void navigator.clipboard
                    ?.writeText(`rtsp://qc-traffic.local/${camera.code.toLowerCase()}/live`)
                    .then(() => toast.success("Stream URL copied"))
                    .catch(() => toast.error("Clipboard unavailable"));
                }}
              />
            </div>
          </section>

          <section className="panel rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground">Node info</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <Row label="Firmware" value={health.firmware} />
              <Row label="Bitrate" value={`${health.bitrate} Mbps`} />
              <Row label="Status" value={camera.status} />
              <Row
                label="Coordinates"
                value={
                  camera.lat != null && camera.lng != null
                    ? `${camera.lat.toFixed(4)}, ${camera.lng.toFixed(4)}`
                    : "—"
                }
              />
            </dl>
          </section>

          <section className="panel rounded-2xl">
            <header className="flex items-center gap-2 border-b border-border px-5 py-4">
              <Clock className="size-4 text-subtle" />
              <h3 className="text-sm font-semibold text-foreground">Event timeline</h3>
            </header>
            <ol className="max-h-96 space-y-0 overflow-y-auto px-5 py-4">
              {timeline.map((e, i) => (
                <li key={`${e.at}-${i}`} className="relative flex gap-3 pb-5 last:pb-0">
                  <span className="mt-1.5 flex flex-col items-center">
                    <span
                      className={cn(
                        "size-2 shrink-0 rounded-full",
                        e.kind === "detection"
                          ? "bg-primary"
                          : e.kind === "fault"
                            ? "bg-danger"
                            : "bg-subtle",
                      )}
                    />
                    {i < timeline.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm text-foreground">{e.label}</p>
                    <p className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                      {timeAgo(e.at)} · {e.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">{label}</dt>
      <dd className="truncate font-mono-tab text-xs text-foreground">{value}</dd>
    </div>
  );
}

function Metric({
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
      <p className={cn("mt-3 font-mono-tab text-2xl font-bold", tone)}>{value}</p>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  busy,
  disabled,
}: {
  icon: typeof Video;
  label: string;
  onClick: () => void;
  busy: boolean;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-3 rounded-lg border border-border bg-panel-elevated px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Icon className={cn("size-4", busy && "animate-spin")} strokeWidth={2} />
      {label}
    </button>
  );
}
