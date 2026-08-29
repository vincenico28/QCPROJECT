import { createFileRoute } from "@tanstack/react-router";
import { useIotNodes, useInferenceStream, useRebootNode } from "@/lib/data/iot";
import { Loader2, Server, Activity, Thermometer, Wifi, TerminalSquare, AlertTriangle, Eye, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/iot")({
  head: () => ({
    meta: [{ title: "IoT Device Management — Culiat Traffic Ops" }],
  }),
  component: IotManagementPage,
});

function IotManagementPage() {
  const { data: nodes, isLoading } = useIotNodes();
  const inferenceStream = useInferenceStream();
  const rebootNode = useRebootNode();

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">IoT Edge Nodes</h1>
          <p className="text-sm text-muted-foreground">Monitor camera health, AI model versions, and real-time inference telemetry.</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Node Health Grid */}
        <div className="xl:col-span-2 flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Server className="size-5 text-primary" />
            Active Deployments
          </h2>
          
          {isLoading || !nodes ? (
            <div className="grid h-64 place-items-center">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {nodes.map(node => (
                <div key={node.id} className="group relative overflow-hidden rounded-2xl border border-border/50 bg-panel p-5 shadow-lg transition-colors hover:bg-panel-elevated">
                   <div className="flex items-start justify-between">
                     <div>
                       <h3 className="font-semibold text-white">{node.name}</h3>
                       <p className="font-mono-tab text-xs text-muted-foreground">{node.id}</p>
                     </div>
                     <div className="flex items-center gap-2">
                       <span className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                          node.status === "Online" ? "bg-emerald-500/20 text-emerald-500" :
                          node.status === "Degraded" ? "bg-yellow-500/20 text-yellow-500" : "bg-red-500/20 text-red-500"
                        )}>
                          {node.status}
                        </span>
                        <button
                          onClick={() => {
                            rebootNode.mutate(
                              { id: node.id, name: node.name },
                              {
                                onSuccess: () => {
                                  toast.success(`Node ${node.id} remote reboot command sent!`, {
                                    description: "Watchdog timer restarted. Reconnecting in 5s...",
                                  });
                                },
                              }
                            );
                          }}
                          disabled={rebootNode.isPending}
                          className="rounded-lg p-1 text-muted-foreground hover:bg-white/10 hover:text-white transition-colors"
                          title="Remote Reboot Node"
                        >
                          <RotateCw className={cn("size-3.5", rebootNode.isPending && "animate-spin")} />
                        </button>
                     </div>
                   </div>
                   
                   <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Eye className="size-3" /> Model
                        </span>
                        <p className="font-mono-tab text-sm font-medium text-white">{node.aiVersion}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Activity className="size-3" /> Uptime
                        </span>
                        <p className="font-mono-tab text-sm font-medium text-white">{node.uptime}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Wifi className="size-3" /> Ping
                        </span>
                        <p className={cn(
                          "font-mono-tab text-sm font-medium",
                          node.latency < 50 ? "text-emerald-400" : node.latency < 100 ? "text-yellow-400" : "text-red-400"
                        )}>
                          {node.latency}ms
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Thermometer className="size-3" /> Temp
                        </span>
                        <p className={cn(
                          "font-mono-tab text-sm font-medium",
                          node.cpuTemp < 60 ? "text-emerald-400" : node.cpuTemp < 80 ? "text-yellow-400" : "text-red-400"
                        )}>
                          {node.cpuTemp}°C
                        </p>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Inference Feed */}
        <div className="xl:col-span-1 flex flex-col gap-4 rounded-2xl border border-border/50 bg-[#0a0a0b] p-0 shadow-lg overflow-hidden h-[600px]">
          <div className="flex items-center justify-between border-b border-border/50 p-4 bg-panel">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <TerminalSquare className="size-5 text-emerald-500" />
              Live Inference Logs
            </h2>
            <div className="flex size-2 items-center justify-center">
              <span className="absolute inline-flex size-2 animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500"></span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 font-mono-tab text-xs custom-scrollbar space-y-2">
             {inferenceStream.map((event) => (
               <div key={event.id} className="flex flex-col gap-1 rounded bg-black/40 p-2 text-muted-foreground">
                  <div className="flex justify-between text-[10px] opacity-50">
                    <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                    <span>{event.nodeId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-white">
                       DETECT [{event.objectType.toUpperCase()}]
                     </span>
                     <span className={cn(
                       event.flagged ? "text-red-400" : "text-emerald-400"
                     )}>
                       {(event.confidence * 100).toFixed(1)}%
                     </span>
                  </div>
                  {event.flagged && (
                     <div className="mt-1 flex items-center gap-1 text-red-500">
                        <AlertTriangle className="size-3" />
                        <span className="text-[10px] uppercase tracking-wider">Violation Flagged</span>
                     </div>
                  )}
               </div>
             ))}
             {inferenceStream.length === 0 && (
                <div className="text-center text-muted-foreground pt-10">Awaiting telemetry...</div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
