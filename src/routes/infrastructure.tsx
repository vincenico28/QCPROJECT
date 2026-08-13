import { createFileRoute } from "@tanstack/react-router";
import { useInfrastructureHealth } from "@/lib/data/infrastructure";
import { Loader2, Cpu, Activity, AlertTriangle, CheckCircle2, Wrench, Calendar, Server } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/infrastructure")({
  head: () => ({
    meta: [{ title: "Predictive Infrastructure Health — QC Command Center" }],
  }),
  component: InfrastructureHealthPage,
});

function InfrastructureHealthPage() {
  const { data: nodes, isLoading } = useInfrastructureHealth();

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
                    <button className={cn(
                       "mt-2 flex w-full items-center justify-center gap-2 rounded p-2 text-xs font-bold uppercase tracking-wider transition-colors border",
                       node.status === "Critical" ? "bg-red-500 hover:bg-red-600 text-white border-red-400" : "bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border-amber-500/30"
                    )}>
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
