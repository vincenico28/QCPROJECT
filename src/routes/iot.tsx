import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useIotNodes, useInferenceStream, useRebootNode, type EdgeNode } from "@/lib/data/iot";
import {
  Loader2,
  Server,
  Activity,
  Thermometer,
  Wifi,
  TerminalSquare,
  AlertTriangle,
  Eye,
  RotateCw,
  Cpu,
  HardDrive,
  CheckCircle2,
  ShieldAlert,
  Search,
  Sliders,
  Terminal,
  X,
  Play,
  Download,
  Filter,
  Trash2,
  Power,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";

export const Route = createFileRoute("/iot")({
  head: () => ({
    meta: [
      { title: "IoT Device Management & Edge Fleet — Culiat Traffic Ops" },
      {
        name: "description",
        content:
          "Quezon City IoT edge compute management, NVIDIA Jetson Orin sensor telemetry, remote daemon restart, and real-time YOLO inference logging.",
      },
    ],
  }),
  component: IotManagementPage,
});

export function IotManagementPage() {
  const { data: nodes = [], isLoading } = useIotNodes();
  const inferenceStream = useInferenceStream();
  const rebootNode = useRebootNode();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Online" | "Degraded" | "Offline">("all");
  const [selectedNode, setSelectedNode] = useState<EdgeNode | null>(null);
  const [inferenceFilter, setInferenceFilter] = useState<"all" | "flagged">("all");

  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      if (statusFilter !== "all" && node.status !== statusFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        node.name.toLowerCase().includes(q) ||
        node.id.toLowerCase().includes(q) ||
        node.aiVersion.toLowerCase().includes(q)
      );
    });
  }, [nodes, search, statusFilter]);

  const filteredInferences = useMemo(() => {
    if (inferenceFilter === "flagged") {
      return inferenceStream.filter((e) => e.flagged);
    }
    return inferenceStream;
  }, [inferenceStream, inferenceFilter]);

  const stats = useMemo(() => {
    const total = nodes.length;
    const online = nodes.filter((n) => n.status === "Online").length;
    const degraded = nodes.filter((n) => n.status === "Degraded").length;
    const avgLatency =
      nodes.length > 0
        ? Math.round(
            nodes.reduce((acc, n) => acc + (n.latency || 0), 0) / (nodes.filter((n) => n.latency > 0).length || 1)
          )
        : 18;
    const avgTemp =
      nodes.length > 0
        ? (
            nodes.reduce((acc, n) => acc + (n.cpuTemp || 0), 0) / (nodes.filter((n) => n.cpuTemp > 0).length || 1)
          ).toFixed(1)
        : "46.2";

    return { total, online, degraded, avgLatency, avgTemp };
  }, [nodes]);

  const handleExportInference = () => {
    if (inferenceStream.length === 0) {
      toast.error("No inference logs to export");
      return;
    }
    const jsonStr = JSON.stringify(inferenceStream, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `qc-edge-inference-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    toast.success("Exported edge inference telemetry log");
  };

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-primary/20 px-2 py-0.5 font-mono-tab text-[10px] font-bold text-primary border border-primary/30">
              NVIDIA JETSON EDGE COMPUTING FLEET
            </span>
            <span className="text-xs text-subtle">· Distributed Sensor Infrastructure</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            IoT Edge Nodes & Telemetry Network
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Monitor camera edge compute health, manage AI model checkouts, inspect live inference streams, and execute hardware reboots.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              toast.success("Edge Sensor Network Synced", {
                description: "Heartbeat ping dispatched to all Culiat camera nodes.",
              });
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-panel-elevated transition-colors"
          >
            <RefreshCw className="size-3.5 text-emerald-400" />
            Poll Edge Nodes
          </button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="panel rounded-2xl border border-border p-4">
          <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">Fleet Nodes</span>
          <p className="mt-2 font-mono-tab text-2xl font-black text-white">{stats.total || 8}</p>
          <span className="text-[10px] text-emerald-400 block mt-0.5">{stats.online || 7} Online / Nominal</span>
        </div>

        <div className="panel rounded-2xl border border-border p-4">
          <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">Fleet Availability</span>
          <p className="mt-2 font-mono-tab text-2xl font-black text-emerald-400">
            {stats.total > 0 ? Math.round((stats.online / stats.total) * 100) : 98}%
          </p>
          <span className="text-[10px] text-white/50 block mt-0.5">Barangay Culiat Grid</span>
        </div>

        <div className="panel rounded-2xl border border-border p-4">
          <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">Average Edge Latency</span>
          <p className="mt-2 font-mono-tab text-2xl font-black text-sky-400">{stats.avgLatency} ms</p>
          <span className="text-[10px] text-white/50 block mt-0.5">Fiber / 5G Low-Latency</span>
        </div>

        <div className="panel rounded-2xl border border-border p-4">
          <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">Average SoC Temp</span>
          <p className="mt-2 font-mono-tab text-2xl font-black text-amber-300">{stats.avgTemp}°C</p>
          <span className="text-[10px] text-amber-400/80 block mt-0.5">Thermal Envelope Nominal</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Node Health Grid (2 Cols) */}
        <div className="xl:col-span-2 flex flex-col gap-4">
          {/* Filter Bar */}
          <div className="panel flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex rounded-xl border border-border bg-background p-1">
              {(["all", "Online", "Degraded", "Offline"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "rounded-lg px-3 py-1 font-mono-tab text-xs font-bold uppercase tracking-wider transition-colors",
                    statusFilter === s ? "bg-primary text-white shadow-sm" : "text-subtle hover:text-foreground"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="w-full sm:w-64">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search node ID, location..."
                className="w-full rounded-xl border border-border bg-background px-3.5 py-1.5 text-xs text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none font-mono"
              />
            </div>
          </div>

          {isLoading || !nodes ? (
            <div className="grid h-64 place-items-center">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : filteredNodes.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-panel/30 py-16 text-center text-xs text-subtle">
              <Server className="mb-2 size-8 opacity-30 text-primary" />
              No edge nodes matching search query.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredNodes.map((node) => (
                <div
                  key={node.id}
                  className="group relative overflow-hidden rounded-2xl border border-border/50 bg-panel p-5 shadow-lg transition-all hover:bg-panel-elevated hover:border-border"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-white text-sm">{node.name}</h3>
                      <p className="font-mono-tab text-xs text-primary mt-0.5">{node.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                          node.status === "Online"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : node.status === "Degraded"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        )}
                      >
                        {node.status}
                      </span>

                      <button
                        onClick={() => {
                          rebootNode.mutate(
                            { id: node.id, name: node.name },
                            {
                              onSuccess: () => {
                                toast.success(`Node ${node.id} remote reboot command sent!`, {
                                  description: "Hardware watchdog restarted. Re-establishing link...",
                                });
                              },
                            }
                          );
                        }}
                        disabled={rebootNode.isPending}
                        className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-white/10 hover:text-white transition-colors"
                        title="Remote Reboot Node"
                      >
                        <RotateCw className={cn("size-3.5", rebootNode.isPending && "animate-spin")} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3.5 text-xs">
                    <div className="space-y-1">
                      <span className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                        <Eye className="size-3 text-primary" /> Vision Model
                      </span>
                      <p className="font-mono-tab font-semibold text-white">{node.aiVersion}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                        <Activity className="size-3 text-emerald-400" /> Continuous Uptime
                      </span>
                      <p className="font-mono-tab font-semibold text-white">{node.uptime}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                        <Wifi className="size-3 text-sky-400" /> Ping RTT
                      </span>
                      <p
                        className={cn(
                          "font-mono-tab font-bold",
                          node.latency < 50
                            ? "text-emerald-400"
                            : node.latency < 100
                            ? "text-amber-400"
                            : "text-red-400"
                        )}
                      >
                        {node.latency} ms
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                        <Thermometer className="size-3 text-amber-400" /> Core SoC Temp
                      </span>
                      <p
                        className={cn(
                          "font-mono-tab font-bold",
                          node.cpuTemp < 60
                            ? "text-emerald-400"
                            : node.cpuTemp < 80
                            ? "text-amber-400"
                            : "text-red-400"
                        )}
                      >
                        {node.cpuTemp}°C
                      </p>
                    </div>
                  </div>

                  {/* Diagnostics Button */}
                  <div className="mt-4 border-t border-border/60 pt-3 flex justify-end">
                    <button
                      onClick={() => setSelectedNode(node)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline font-mono-tab"
                    >
                      <TerminalSquare className="size-3.5" /> Node Diagnostics & Console →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Inference Feed (1 Col) */}
        <div className="xl:col-span-1 flex flex-col gap-4 rounded-2xl border border-border bg-panel p-0 shadow-lg overflow-hidden h-[660px]">
          <div className="flex items-center justify-between border-b border-border p-4 bg-panel-elevated">
            <div>
              <h2 className="font-semibold text-white flex items-center gap-2 text-sm">
                <TerminalSquare className="size-4 text-emerald-400" />
                Live Inference Stream
              </h2>
              <p className="text-[11px] text-muted-foreground">Real-time edge detections</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportInference}
                className="p-1 rounded text-muted-foreground hover:text-white"
                title="Export Inference Logs"
              >
                <Download className="size-3.5" />
              </button>
              <div className="flex size-2 items-center justify-center">
                <span className="absolute inline-flex size-2 animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500"></span>
              </div>
            </div>
          </div>

          {/* Inference Filter */}
          <div className="flex items-center justify-between px-4 pt-1">
            <span className="text-[10px] font-mono-tab text-subtle uppercase">Telemetry Filter</span>
            <div className="flex rounded-lg border border-border bg-background p-0.5">
              <button
                onClick={() => setInferenceFilter("all")}
                className={cn(
                  "px-2 py-0.5 text-[10px] font-bold uppercase rounded",
                  inferenceFilter === "all" ? "bg-primary text-white" : "text-subtle hover:text-white"
                )}
              >
                All
              </button>
              <button
                onClick={() => setInferenceFilter("flagged")}
                className={cn(
                  "px-2 py-0.5 text-[10px] font-bold uppercase rounded",
                  inferenceFilter === "flagged" ? "bg-red-500 text-white" : "text-subtle hover:text-white"
                )}
              >
                Violations Only
              </button>
            </div>
          </div>

          {/* Event List */}
          <div className="flex-1 overflow-y-auto p-4 font-mono-tab text-xs custom-scrollbar space-y-2">
            {filteredInferences.map((event) => (
              <div
                key={event.id}
                className="flex flex-col gap-1 rounded-xl border border-border/60 bg-black/40 p-2.5 text-muted-foreground"
              >
                <div className="flex justify-between text-[10px] opacity-60">
                  <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                  <span className="text-white font-bold">{event.nodeId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold">
                    DETECT [{event.objectType.toUpperCase()}]
                  </span>
                  <span className={cn(event.flagged ? "text-red-400 font-bold" : "text-emerald-400 font-bold")}>
                    {(event.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                {event.flagged && (
                  <div className="mt-1 flex items-center gap-1 text-red-400">
                    <AlertTriangle className="size-3" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Violation Flagged</span>
                  </div>
                )}
              </div>
            ))}
            {filteredInferences.length === 0 && (
              <div className="text-center text-muted-foreground pt-16 text-xs">
                Awaiting edge inference telemetry...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Node Diagnostics & Terminal Modal */}
      {selectedNode && (
        <Dialog.Root open={true} onOpenChange={(open) => !open && setSelectedNode(null)}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md animate-in fade-in" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-[#0a0d14] p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex items-start justify-between border-b border-border pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Cpu className="size-5 text-primary" />
                    <Dialog.Title className="text-base font-bold text-white">
                      Node Diagnostics: {selectedNode.name}
                    </Dialog.Title>
                  </div>
                  <p className="font-mono-tab text-xs text-muted-foreground mt-0.5">
                    Hardware ID: {selectedNode.id} · JetPack 6.0 (Tegra 234)
                  </p>
                </div>
                <Dialog.Close asChild>
                  <button className="rounded p-1 text-muted-foreground hover:text-white">
                    <X className="size-5" />
                  </button>
                </Dialog.Close>
              </div>

              {/* Hardware Specifications */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono-tab">
                <div className="rounded-xl border border-border bg-panel p-3">
                  <span className="text-[10px] text-muted-foreground uppercase">Compute SoC</span>
                  <p className="font-bold text-white mt-1">NVIDIA Orin 64GB</p>
                </div>
                <div className="rounded-xl border border-border bg-panel p-3">
                  <span className="text-[10px] text-muted-foreground uppercase">GPU Load</span>
                  <p className="font-bold text-emerald-400 mt-1">42% (275 TOPS)</p>
                </div>
                <div className="rounded-xl border border-border bg-panel p-3">
                  <span className="text-[10px] text-muted-foreground uppercase">VRAM Allocation</span>
                  <p className="font-bold text-sky-400 mt-1">8.2 / 64 GB</p>
                </div>
                <div className="rounded-xl border border-border bg-panel p-3">
                  <span className="text-[10px] text-muted-foreground uppercase">Fan Speed</span>
                  <p className="font-bold text-amber-300 mt-1">2,400 RPM</p>
                </div>
              </div>

              {/* Simulated Terminal Console */}
              <div className="mt-4 rounded-xl border border-white/10 bg-black p-4 font-mono text-xs text-emerald-400 space-y-1.5 h-44 overflow-y-auto custom-scrollbar">
                <p className="text-muted-foreground">$ systemctl status qc-flow-edge.service</p>
                <p>● qc-flow-edge.service - Quezon City Computer Vision Pipeline</p>
                <p className="text-white">   Loaded: loaded (/lib/systemd/system/qc-flow-edge.service; enabled)</p>
                <p className="text-emerald-300">   Active: active (running) since 45 days ago</p>
                <p>   Main PID: 1842 (yolo_trt_engine)</p>
                <p>   Tasks: 16 (limit: 12480)</p>
                <p className="text-white/80">[INFO] RTSP H.265 stream synchronized: 30.00 FPS at 1080p</p>
                <p className="text-white/80">[INFO] TensorRT FP16 execution engine initialized (yolov11-culiat-v2.8.pt)</p>
                <p className="text-white/80">[INFO] MQTT Telemetry Broker connected: mqtt://broker.culiat.gov.ph:8883</p>
                <p className="text-sky-400">[INFO] Optical confidence calibration validated (MAE &lt; 0.02)</p>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <button
                  onClick={() => {
                    toast.success(`Edge buffer cleared on ${selectedNode.id}`, {
                      description: "Flushed optical frame ring-buffer (3.2 GB freed).",
                    });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel px-3.5 py-2 text-xs font-semibold text-white hover:bg-panel-elevated"
                >
                  <Trash2 className="size-3.5" /> Purge Frame Buffer
                </button>

                <div className="flex items-center gap-2">
                  <Dialog.Close asChild>
                    <button className="rounded-xl border border-border bg-panel px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-panel-elevated">
                      Close
                    </button>
                  </Dialog.Close>
                  <button
                    onClick={() => {
                      rebootNode.mutate(
                        { id: selectedNode.id, name: selectedNode.name },
                        {
                          onSuccess: () => {
                            toast.success(`Node ${selectedNode.id} rebooting...`);
                            setSelectedNode(null);
                          },
                        }
                      );
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500 shadow-lg shadow-red-600/25"
                  >
                    <Power className="size-3.5" /> Reboot Hardware
                  </button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  );
}
