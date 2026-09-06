import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  useInfrastructureHealth,
  useCreateInfrastructureAsset,
  useScheduleMaintenance,
  type InfrastructureNode,
} from "@/lib/data/infrastructure";
import {
  Loader2,
  Cpu,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  Calendar,
  Server,
  Plus,
  X,
  Search,
  Filter,
  ShieldCheck,
  Zap,
  Radio,
  Clock,
  RotateCw,
  HardDrive,
  Eye,
  Thermometer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/infrastructure")({
  head: () => ({
    meta: [{ title: "Predictive Infrastructure Health — QC Command Center" }],
  }),
  component: InfrastructureHealthPage,
});

export function InfrastructureHealthPage() {
  const { data: nodes = [], isLoading } = useInfrastructureHealth();
  const createAsset = useCreateInfrastructureAsset();
  const scheduleRepair = useScheduleMaintenance();

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<InfrastructureNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Form State
  const [name, setName] = useState("");
  const [assetType, setAssetType] = useState("AI Camera (ANPR)");
  const [location, setLocation] = useState("");

  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      if (statusFilter !== "all" && node.status !== statusFilter) return false;
      if (typeFilter !== "all" && node.type !== typeFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        node.id.toLowerCase().includes(q) ||
        node.location.toLowerCase().includes(q) ||
        node.type.toLowerCase().includes(q)
      );
    });
  }, [nodes, statusFilter, typeFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = nodes.length;
    const healthy = nodes.filter((n) => n.status === "Healthy").length;
    const degraded = nodes.filter((n) => n.status === "Degraded").length;
    const critical = nodes.filter((n) => n.status === "Critical").length;
    const avgHealth =
      total > 0
        ? Math.round(nodes.reduce((s, n) => s + n.healthPercent, 0) / total)
        : 100;
    return { total, healthy, degraded, critical, avgHealth };
  }, [nodes]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !location.trim()) return;

    createAsset.mutate(
      {
        name: name.trim(),
        assetType,
        location: location.trim(),
        status: "operational",
      },
      {
        onSuccess: () => {
          toast.success(`Asset "${name}" registered successfully!`, {
            description: "Telemetry node initialized & connected to health monitor.",
          });
          setCreateOpen(false);
          setName("");
          setLocation("");
        },
      }
    );
  };

  const handleScheduleRepair = (node: InfrastructureNode) => {
    scheduleRepair.mutate(
      { id: node.id, location: node.location },
      {
        onSuccess: () => {
          toast.success(`Work Order Dispatched for ${node.id}!`, {
            description: `Field technician dispatched to ${node.location}. Target resolution: 4 hours.`,
          });
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-purple-500/20 px-2 py-0.5 font-mono-tab text-[10px] font-bold text-purple-400 border border-purple-500/30">
              QC TELEMETRY & HARDWARE OPERATIONS
            </span>
            <span className="text-xs text-subtle">· IoT Predictive Maintenance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            <Cpu className="size-6 text-purple-400" />
            Predictive Infrastructure Health
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Real-time sensory health, MTBF failure forecasting, and autonomous work-order dispatching for city-wide hardware nodes.
          </p>
        </div>

        {/* Provision Asset Dialog */}
        <Dialog.Root open={createOpen} onOpenChange={setCreateOpen}>
          <Dialog.Trigger asChild>
            <button className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-600/25 transition-all hover:bg-purple-500 hover:scale-[1.02]">
              <Plus className="size-4" />
              Provision Telemetry Node
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md animate-in fade-in" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-panel p-6 sm:p-8 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="grid size-10 place-items-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    <Server className="size-5" />
                  </div>
                  <div>
                    <Dialog.Title className="text-base font-bold text-white">
                      Register Infrastructure Asset
                    </Dialog.Title>
                    <p className="text-xs text-muted-foreground">Attach new IoT edge sensor to QC grid</p>
                  </div>
                </div>
                <Dialog.Close asChild>
                  <button className="rounded-lg p-1 text-muted-foreground hover:bg-panel-elevated hover:text-white">
                    <X className="size-5" />
                  </button>
                </Dialog.Close>
              </div>

              <form onSubmit={handleCreate} className="mt-5 flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono-tab">
                    Asset / Device Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Quezon Ave Overpass ANPR 04"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-white placeholder:text-muted-foreground/50 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono-tab">
                      Asset Category
                    </label>
                    <select
                      value={assetType}
                      onChange={(e) => setAssetType(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                    >
                      <option value="AI Camera (ANPR)">AI Camera (ANPR)</option>
                      <option value="Signal Controller">Signal Controller</option>
                      <option value="Environmental Loop">Environmental Loop</option>
                      <option value="Edge AI Gateway">Edge AI Gateway</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono-tab">
                      Location Corridor *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Tandang Sora Underpass"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-white placeholder:text-muted-foreground/50 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-3 flex justify-end gap-3 border-t border-border/60 pt-4">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="rounded-xl px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-panel-elevated"
                    >
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    type="submit"
                    disabled={createAsset.isPending}
                    className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-purple-500 disabled:opacity-50"
                  >
                    {createAsset.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="size-4" />
                    )}
                    Register Asset
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="panel rounded-3xl border border-border bg-panel p-5 shadow-lg">
          <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle font-semibold">
            Monitored Nodes
          </span>
          <p className="mt-2 font-mono-tab text-3xl font-black text-white">{stats.total}</p>
          <span className="text-[10px] text-muted-foreground font-mono-tab block mt-1">
            {stats.healthy} Operational · 100% Mesh Ping
          </span>
        </div>

        <div className="panel rounded-3xl border border-emerald-500/30 bg-emerald-950/10 p-5 shadow-lg">
          <span className="font-mono-tab text-[10px] uppercase tracking-widest text-emerald-400 font-semibold">
            Fleet Health Index
          </span>
          <p className="mt-2 font-mono-tab text-3xl font-black text-emerald-300">
            {stats.avgHealth}%
          </p>
          <span className="text-[10px] text-emerald-400/80 font-mono-tab block mt-1">
            Optimal System Integrity
          </span>
        </div>

        <div className="panel rounded-3xl border border-amber-500/30 bg-amber-950/10 p-5 shadow-lg">
          <span className="font-mono-tab text-[10px] uppercase tracking-widest text-amber-400 font-semibold">
            Degraded Nodes
          </span>
          <p className="mt-2 font-mono-tab text-3xl font-black text-amber-300">
            {stats.degraded}
          </p>
          <span className="text-[10px] text-amber-400/80 font-mono-tab block mt-1">
            Preventive Service Queued
          </span>
        </div>

        <div className="panel rounded-3xl border border-red-500/30 bg-red-950/10 p-5 shadow-lg">
          <span className="font-mono-tab text-[10px] uppercase tracking-widest text-red-400 font-semibold">
            Critical Telemetry
          </span>
          <p className="mt-2 font-mono-tab text-3xl font-black text-red-400">
            {stats.critical}
          </p>
          <span className="text-[10px] text-red-400/80 font-mono-tab block mt-1">
            Urgent Dispatch Dispatched
          </span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="panel flex flex-col gap-4 rounded-3xl border border-border bg-panel p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
        {/* Status Tabs */}
        <div className="flex rounded-2xl border border-border bg-background p-1 overflow-x-auto">
          {["all", "Healthy", "Degraded", "Critical"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-xl px-3.5 py-1.5 font-mono-tab text-xs font-bold transition-colors whitespace-nowrap",
                statusFilter === s
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s === "all" ? "All Status" : s}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-purple-500 focus:outline-none"
          >
            <option value="all">All Node Types</option>
            <option value="AI Camera">AI Camera</option>
            <option value="Traffic Light">Traffic Light</option>
            <option value="Server Node">Server Node</option>
            <option value="Environmental Sensor">Environmental Sensor</option>
          </select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search node or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-xl border border-border bg-background pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-purple-500 focus:outline-none w-48 sm:w-60"
            />
          </div>
        </div>
      </div>

      {/* Node Cards Grid */}
      {isLoading ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="size-8 animate-spin text-purple-400" />
        </div>
      ) : filteredNodes.length === 0 ? (
        <div className="p-16 text-center text-sm text-muted-foreground panel rounded-3xl border border-border">
          <Server className="size-10 text-subtle mx-auto mb-3 opacity-40" />
          No infrastructure telemetry nodes match your filter criteria.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredNodes.map((node) => (
            <div
              key={node.id}
              className={cn(
                "panel flex flex-col justify-between gap-4 rounded-3xl border p-6 shadow-xl relative overflow-hidden transition-all hover:border-purple-500/40",
                node.status === "Critical"
                  ? "border-red-500/50 bg-gradient-to-br from-red-500/10 to-transparent"
                  : node.status === "Degraded"
                    ? "border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent"
                    : "border-border bg-panel",
              )}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "grid size-12 place-items-center rounded-2xl shadow-inner border",
                        node.status === "Healthy"
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : node.status === "Degraded"
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                            : "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse",
                      )}
                    >
                      <Server className="size-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base leading-tight font-mono-tab">
                        {node.id}
                      </h3>
                      <div className="flex items-center gap-1 mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {node.type}
                      </div>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border font-mono-tab",
                      node.status === "Healthy"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : node.status === "Degraded"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20",
                    )}
                  >
                    {node.status}
                  </span>
                </div>

                <p className="text-xs font-semibold text-white/80 border-b border-border/50 pb-3 mt-3 flex items-center gap-1.5">
                  <Activity className="size-3 text-purple-400" />
                  {node.location}
                </p>

                {/* Health Progress Bar */}
                <div className="flex flex-col gap-2 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-mono-tab">
                      Telemetry Health Score
                    </span>
                    <span
                      className={cn(
                        "text-xl font-black font-mono-tab",
                        node.healthPercent >= 90
                          ? "text-emerald-400"
                          : node.healthPercent >= 50
                            ? "text-amber-400"
                            : "text-red-500",
                      )}
                    >
                      {node.healthPercent}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-background overflow-hidden border border-border/50">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-1000",
                        node.healthPercent >= 90
                          ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                          : node.healthPercent >= 50
                            ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                            : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]",
                      )}
                      style={{ width: `${node.healthPercent}%` }}
                    />
                  </div>
                </div>

                {/* Diagnostic Details */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="flex flex-col gap-1 rounded-xl bg-background/50 p-2.5 border border-border/50">
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-muted-foreground font-mono-tab">
                      <Clock className="size-3" /> Predicted Failure
                    </span>
                    <span
                      className={cn(
                        "text-xs font-semibold font-mono-tab",
                        node.status === "Critical" ? "text-red-400 animate-pulse" : "text-white",
                      )}
                    >
                      {node.predictedFailure}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 rounded-xl bg-background/50 p-2.5 border border-border/50">
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-muted-foreground font-mono-tab">
                      <Calendar className="size-3" /> Last Maintenance
                    </span>
                    <span className="text-xs font-semibold text-white font-mono-tab">
                      {node.lastMaintenance}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-2 flex flex-col gap-2 border-t border-border/50 pt-4">
                <button
                  onClick={() => setSelectedNode(node)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-panel-elevated py-2 text-xs font-bold text-foreground hover:bg-panel transition-colors"
                >
                  <Eye className="size-3.5 text-purple-400" /> Inspect Deep Telemetry
                </button>

                {node.status !== "Healthy" && (
                  <button
                    onClick={() => handleScheduleRepair(node)}
                    disabled={scheduleRepair.isPending}
                    className={cn(
                      "flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold uppercase tracking-wider transition-colors border shadow-md",
                      node.status === "Critical"
                        ? "bg-red-600 hover:bg-red-500 text-white border-red-400 shadow-red-600/20"
                        : "bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border-amber-500/30",
                    )}
                  >
                    <Wrench className="size-3.5" /> Dispatch Work Order
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Deep Telemetry Diagnostics Modal */}
      {selectedNode && (
        <Dialog.Root open={!!selectedNode} onOpenChange={(o) => !o && setSelectedNode(null)}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md animate-in fade-in" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-panel p-6 sm:p-8 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-start justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-12 place-items-center rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    <Activity className="size-6" />
                  </div>
                  <div>
                    <Dialog.Title className="text-lg font-bold text-white font-mono-tab">
                      Telemetry Diagnostics · {selectedNode.id}
                    </Dialog.Title>
                    <p className="text-xs text-muted-foreground">{selectedNode.location}</p>
                  </div>
                </div>
                <Dialog.Close asChild>
                  <button className="rounded-lg p-1 text-muted-foreground hover:bg-panel-elevated hover:text-white">
                    <X className="size-5" />
                  </button>
                </Dialog.Close>
              </div>

              <div className="mt-5 flex flex-col gap-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-border bg-panel-elevated/60 p-3.5">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase font-mono-tab">
                      <Thermometer className="size-3 text-red-400" /> Internal Temperature
                    </span>
                    <p className="mt-1 font-mono-tab text-base font-bold text-white">41.8°C</p>
                    <span className="text-[10px] text-emerald-400 font-mono-tab">Thermal Optimal</span>
                  </div>

                  <div className="rounded-2xl border border-border bg-panel-elevated/60 p-3.5">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase font-mono-tab">
                      <Zap className="size-3 text-amber-400" /> Input Voltage
                    </span>
                    <p className="mt-1 font-mono-tab text-base font-bold text-white">220.4 V AC</p>
                    <span className="text-[10px] text-emerald-400 font-mono-tab">± 1.2% Stability</span>
                  </div>

                  <div className="rounded-2xl border border-border bg-panel-elevated/60 p-3.5">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase font-mono-tab">
                      <Eye className="size-3 text-purple-400" /> Optical MTF Clarity
                    </span>
                    <p className="mt-1 font-mono-tab text-base font-bold text-white">96.8%</p>
                    <span className="text-[10px] text-emerald-400 font-mono-tab">Lens Clean</span>
                  </div>

                  <div className="rounded-2xl border border-border bg-panel-elevated/60 p-3.5">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase font-mono-tab">
                      <Radio className="size-3 text-sky-400" /> Fiber Mesh Ping
                    </span>
                    <p className="mt-1 font-mono-tab text-base font-bold text-white">8.4 ms</p>
                    <span className="text-[10px] text-emerald-400 font-mono-tab">0% Packet Loss</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                  <p className="font-mono-tab text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                    Firmware & Hardware Signatures
                  </p>
                  <div className="mt-2 flex flex-col gap-1.5 font-mono-tab text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Firmware Build:</span>
                      <span className="text-white">v4.18.2-rt-patch</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">eMMC Flash Wear Level:</span>
                      <span className="text-emerald-400">97% Lifetime Remaining</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Watchdog Heartbeat:</span>
                      <span className="text-white">Active (Interval: 10s)</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-border/60 pt-4">
                  <button
                    onClick={() => {
                      toast.success(`Remote self-test command sent to ${selectedNode.id}`, {
                        description: "Running hardware loopback and optical sensor calibration...",
                      });
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel-elevated px-4 py-2 text-xs font-bold text-foreground hover:bg-panel transition-colors"
                  >
                    <RotateCw className="size-3.5" /> Trigger Remote Self-Test
                  </button>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white hover:bg-purple-500 transition-colors"
                  >
                    Done
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
