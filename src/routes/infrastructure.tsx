import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useInfrastructureHealth, useCreateInfrastructureAsset, useScheduleMaintenance } from "@/lib/data/infrastructure";
import { Loader2, Cpu, Activity, AlertTriangle, CheckCircle2, Wrench, Calendar, Server, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/infrastructure")({
  head: () => ({
    meta: [{ title: "Predictive Infrastructure Health — QC Command Center" }],
  }),
  component: InfrastructureHealthPage,
});

function InfrastructureHealthPage() {
  const { data: nodes, isLoading } = useInfrastructureHealth();
  const createAsset = useCreateInfrastructureAsset();
  const scheduleRepair = useScheduleMaintenance();

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [assetType, setAssetType] = useState("AI Camera (ANPR)");
  const [location, setLocation] = useState("");

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

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Cpu className="size-6 text-purple-400" />
            Predictive Infrastructure Health
          </h1>
          <p className="text-sm text-muted-foreground">AI-driven predictive maintenance for city-wide hardware and network nodes.</p>
        </div>

        <Dialog.Root open={createOpen} onOpenChange={setCreateOpen}>
          <Dialog.Trigger asChild>
            <button className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-500">
              <Plus className="size-4" />
              Provision Asset
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-panel p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <div className="grid size-8 place-items-center rounded-lg bg-purple-500/20 text-purple-400">
                    <Server className="size-4" />
                  </div>
                  <Dialog.Title className="text-lg font-bold text-white">Register Infrastructure Asset</Dialog.Title>
                </div>
                <Dialog.Close asChild>
                  <button className="rounded-lg p-1 text-muted-foreground hover:bg-panel-elevated hover:text-white">
                    <X className="size-5" />
                  </button>
                </Dialog.Close>
              </div>

              <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Asset / Device Name</label>
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
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Asset Category</label>
                    <select
                      value={assetType}
                      onChange={(e) => setAssetType(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                    >
                      <option value="AI Camera (ANPR)">AI Camera (ANPR)</option>
                      <option value="Signal Controller">Signal Controller</option>
                      <option value="Environmental Loop">Environmental Loop</option>
                      <option value="Edge AI Gateway">Edge AI Gateway</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Location</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Commonwealth / Tandang Sora"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-white placeholder:text-muted-foreground/50 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-2 flex justify-end gap-3 border-t border-border pt-4">
                  <Dialog.Close asChild>
                    <button type="button" className="rounded-lg px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-panel-elevated">
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    type="submit"
                    disabled={createAsset.isPending}
                    className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 disabled:opacity-50"
                  >
                    {createAsset.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                    Register Asset
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {isLoading || !nodes ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
           {nodes.map(node => (
              <div key={node.id} className={cn(
                 "panel flex flex-col gap-4 rounded-xl border p-5 shadow-lg relative overflow-hidden transition-all",
                 node.status === "Critical" ? "border-red-500/50 bg-gradient-to-br from-red-500/10 to-transparent" :
                 node.status === "Degraded" ? "border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent" : "border-border"
              )}>
                 <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                       <div className={cn(
                         "grid size-12 place-items-center rounded-lg shadow-inner",
                         node.status === "Healthy" ? "bg-emerald-500/20 text-emerald-400" :
                         node.status === "Degraded" ? "bg-amber-500/20 text-amber-400" :
                         "bg-red-500/20 text-red-500 animate-pulse"
                       )}>
                          <Server className="size-6" />
                       </div>
                       <div>
                          <h3 className="font-bold text-white leading-tight">{node.id}</h3>
                          <div className="flex items-center gap-1 mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                             {node.type}
                          </div>
                       </div>
                    </div>
                    <span className={cn(
                       "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                       node.status === "Healthy" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                       node.status === "Degraded" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                       "bg-red-500/10 text-red-500 border-red-500/20"
                    )}>
                      {node.status}
                    </span>
                 </div>

                 <p className="text-xs font-semibold text-white/80 border-b border-border/50 pb-2">{node.location}</p>

                 <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                       <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Health Score</span>
                       <span className={cn(
                         "text-xl font-black font-mono-tab",
                         node.healthPercent >= 90 ? "text-emerald-400" :
                         node.healthPercent >= 50 ? "text-amber-400" : "text-red-500"
                       )}>{node.healthPercent}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-background overflow-hidden border border-border/50">
                       <div 
                         className={cn(
                           "h-full rounded-full transition-all duration-1000",
                           node.healthPercent >= 90 ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" :
                           node.healthPercent >= 50 ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" : 
                           "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                         )}
                         style={{ width: `${node.healthPercent}%` }}
                       />
                    </div>
                 </div>

                 <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1 rounded bg-background/50 p-2 border border-border/50">
                       <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-muted-foreground">
                          <Activity className="size-3" /> Predicted Failure
                       </span>
                       <span className={cn(
                          "text-xs font-semibold",
                          node.status === "Critical" ? "text-red-400 animate-pulse" : "text-white"
                       )}>{node.predictedFailure}</span>
                    </div>
                    <div className="flex flex-col gap-1 rounded bg-background/50 p-2 border border-border/50">
                       <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-muted-foreground">
                          <Calendar className="size-3" /> Last Maintenance
                       </span>
                       <span className="text-xs font-semibold text-white">{node.lastMaintenance}</span>
                    </div>
                 </div>
                 
                 {node.status !== "Healthy" && (
                    <button
                      onClick={() => {
                        scheduleRepair.mutate(
                          { id: node.id, location: node.location },
                          {
                            onSuccess: () => {
                              toast.success(`Work Order Dispatched for ${node.id}!`, {
                                description: `Field engineers alerted for ${node.location}.`,
                              });
                            },
                          }
                        );
                      }}
                      disabled={scheduleRepair.isPending}
                      className={cn(
                        "mt-2 flex w-full items-center justify-center gap-2 rounded p-2 text-xs font-bold uppercase tracking-wider transition-colors border",
                        node.status === "Critical" ? "bg-red-500 hover:bg-red-600 text-white border-red-400" : "bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border-amber-500/30"
                      )}
                    >
                       <Wrench className="size-3.5" /> Schedule Immediate Repair
                    </button>
                 )}
              </div>
           ))}
        </div>
      )}
    </div>
  );
}
