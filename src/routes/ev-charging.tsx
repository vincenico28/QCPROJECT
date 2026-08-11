import { createFileRoute } from "@tanstack/react-router";
import { useEvStations } from "@/lib/data/ev-charging";
import { Loader2, Zap, MapPin, BatteryCharging, PowerOff, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ev-charging")({
  head: () => ({
    meta: [{ title: "EV Charging Network — QC Command Center" }],
  }),
  component: EvChargingPage,
});

function EvChargingPage() {
  const { data: stations, isLoading } = useEvStations();

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Zap className="size-6 text-yellow-400" />
            EV Charging Network
          </h1>
          <p className="text-sm text-muted-foreground">Monitor LGU-managed Electric Vehicle chargers and grid power draw.</p>
        </div>
      </div>

      {isLoading || !stations ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
           {stations.map(station => (
              <div key={station.id} className="panel flex flex-col gap-4 rounded-xl border border-border p-5 shadow-lg relative overflow-hidden">
                 {/* Decorative background glow if charging */}
                 {station.status === "Charging" && (
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 size-48 rounded-full bg-yellow-500/10 blur-3xl" />
                 )}

                 <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-center gap-3">
                       <div className={cn(
                         "grid size-12 place-items-center rounded-lg shadow-inner",
                         station.status === "Available" ? "bg-emerald-500/20 text-emerald-500" :
                         station.status === "Charging" ? "bg-yellow-500/20 text-yellow-400" :
                         "bg-red-500/20 text-red-500"
                       )}>
                          {station.status === "Charging" ? <BatteryCharging className="size-6 animate-pulse" /> :
                           station.status === "Available" ? <Zap className="size-6" /> : <PowerOff className="size-6" />}
                       </div>
                       <div>
                          <h3 className="font-bold text-white leading-tight">{station.name}</h3>
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                             <MapPin className="size-3" />
                             {station.location}
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="mt-2 flex items-center justify-between relative z-10">
                    <span className={cn(
                       "inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider border",
                       station.status === "Available" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                       station.status === "Charging" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                       "bg-red-500/10 text-red-500 border-red-500/20"
                    )}>
                      {station.status}
                    </span>
                    <span className="text-[10px] font-mono-tab text-muted-foreground">ID: {station.id}</span>
                 </div>

                 <div className="mt-4 grid grid-cols-2 gap-4 rounded-lg bg-background/50 p-4 border border-border/50 relative z-10">
                    <div>
                       <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Current Draw</p>
                       <p className={cn(
                         "text-2xl font-black mt-1 font-mono-tab",
                         station.currentDrawKw > 0 ? "text-yellow-400" : "text-white"
                       )}>
                          {station.currentDrawKw.toFixed(1)} <span className="text-sm">kW</span>
                       </p>
                    </div>
                    <div>
                       <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Session Total</p>
                       <p className="text-2xl font-black text-white mt-1 font-mono-tab">
                          {station.totalSessionKw.toFixed(1)} <span className="text-sm">kWh</span>
                       </p>
                    </div>
                 </div>

                 {station.status === "Charging" && station.user && (
                    <div className="mt-2 text-sm text-emerald-400 font-medium bg-emerald-500/10 rounded px-3 py-2 border border-emerald-500/20 flex items-center gap-2 relative z-10">
                       <CheckCircle2 className="size-4" />
                       Active: {station.user}
                    </div>
                 )}
              </div>
           ))}
        </div>
      )}
    </div>
  );
}
