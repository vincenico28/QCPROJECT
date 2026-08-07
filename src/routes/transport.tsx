import { createFileRoute } from "@tanstack/react-router";
import { useTerminals, useTransportRoutes } from "@/lib/data/transport";
import { Bus, CarFront, Loader2, MapPin, AlertTriangle, ShieldAlert, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { QC_CENTER } from "@/lib/data/gis";

export const Route = createFileRoute("/transport")({
  head: () => ({
    meta: [
      { title: "Public Transport Coordination — Culiat Traffic Ops" },
      {
        name: "description",
        content: "Monitor jeepneys, buses, and tricycle terminals for unauthorized dispatching and overcapacity.",
      },
    ],
  }),
  component: TransportPage,
});

function TransportPage() {
  const { data: routes, isLoading: loadingRoutes } = useTransportRoutes();
  const { data: terminals, isLoading: loadingTerminals } = useTerminals();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Public Transport Coordination</h1>
          <p className="text-sm text-muted-foreground">
            Monitor PUV route congestion, terminal capacity, and unauthorized stations.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Active Routes Panel */}
          <div className="panel flex flex-col gap-4 rounded-xl border border-border p-6">
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <h2 className="flex items-center gap-2 font-semibold text-white">
                <Bus className="size-5 text-primary" />
                Active PUV Routes
              </h2>
            </div>
            
            {loadingRoutes ? (
              <div className="grid h-40 place-items-center">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {routes?.map((route) => (
                  <div key={route.id} className="flex items-center justify-between rounded-lg border border-border bg-background/50 p-4 transition-colors hover:bg-background/80">
                    <div className="flex items-center gap-4">
                      <div className={cn("grid size-10 shrink-0 place-items-center rounded-full bg-white/5", 
                        route.type === "jeepney" && "text-blue-400",
                        route.type === "bus" && "text-emerald-400",
                        route.type === "tricycle" && "text-orange-400"
                      )}>
                        {route.type === "jeepney" ? <CarFront className="size-5" /> : route.type === "bus" ? <Bus className="size-5" /> : <Activity className="size-5" />}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{route.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{route.type} • {route.activeVehicles} active units</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
                        route.congestionLevel === "low" && "bg-emerald-500/10 text-emerald-500",
                        route.congestionLevel === "medium" && "bg-yellow-500/10 text-yellow-500",
                        route.congestionLevel === "high" && "bg-orange-500/10 text-orange-500",
                        route.congestionLevel === "critical" && "bg-red-500/10 text-red-500"
                      )}>
                        {route.congestionLevel} Congestion
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Terminals Panel */}
          <div className="panel flex flex-col gap-4 rounded-xl border border-border p-6 h-full">
             <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <h2 className="flex items-center gap-2 font-semibold text-white">
                <MapPin className="size-5 text-primary" />
                Terminal Status
              </h2>
            </div>

            {loadingTerminals ? (
              <div className="grid h-40 place-items-center">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {terminals?.map((term) => (
                  <div key={term.id} className="flex flex-col gap-3 rounded-lg border border-border bg-background/50 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-white text-sm">{term.name}</p>
                      {term.status === "unauthorized" && (
                        <ShieldAlert className="size-4 shrink-0 text-red-500" />
                      )}
                      {term.status === "over-capacity" && (
                        <AlertTriangle className="size-4 shrink-0 text-orange-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full transition-all duration-500", 
                            term.status === "normal" ? "bg-emerald-500" :
                            term.status === "crowded" ? "bg-yellow-500" : "bg-red-500"
                          )} 
                          style={{ width: `${Math.min(100, (term.currentOccupancy / term.capacity) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono-tab text-muted-foreground w-12 text-right">
                        {term.currentOccupancy}/{term.capacity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
