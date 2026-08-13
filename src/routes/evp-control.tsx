import { createFileRoute } from "@tanstack/react-router";
import { useEvpTracking } from "@/lib/data/evp";
import { Loader2, Siren, MapPin, Gauge, Radio, Clock, TrafficCone } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/evp-control")({
  head: () => ({
    meta: [{ title: "EVP Control — QC Command Center" }],
  }),
  component: EvpControlPage,
});

function EvpControlPage() {
  const { data: vehicles, isLoading } = useEvpTracking();

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Siren className="size-6 text-red-500 animate-pulse" />
            Emergency Vehicle Preemption (EVP)
          </h1>
          <p className="text-sm text-muted-foreground">Live tracking of emergency units with automated traffic light "Green Wave" synchronization.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
         {/* Live Map Placeholder */}
         <div className="lg:col-span-2 panel rounded-2xl border border-border p-0 overflow-hidden relative min-h-[500px]">
             <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-full bg-black/80 px-4 py-2 border border-border backdrop-blur">
               <span className="relative flex size-3">
                 <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"></span>
                 <span className="relative inline-flex size-3 rounded-full bg-red-600"></span>
               </span>
               <span className="text-sm font-bold uppercase tracking-wider text-white">Live Green Wave Map</span>
            </div>
            
            <div className="absolute inset-0 bg-[url('https://api.maptiler.com/maps/dataviz-dark/static/121.050,14.655,14/1200x800.png?key=get_your_own_OpIi9ZULNHzrESv6T2vL')] bg-cover bg-center opacity-80">
               {/* Traffic Lights (Green) */}
               <div className="absolute top-1/2 left-1/2 -translate-x-12 -translate-y-12">
                   <div className="grid size-4 place-items-center rounded-full bg-emerald-500 shadow-[0_0_15px_5px_rgba(16,185,129,0.8)] animate-pulse" />
               </div>
               <div className="absolute top-1/2 left-1/2 translate-x-12 -translate-y-4">
                   <div className="grid size-4 place-items-center rounded-full bg-emerald-500 shadow-[0_0_15px_5px_rgba(16,185,129,0.8)] animate-pulse" />
               </div>

               {/* Ambulance Icon */}
               <div className="absolute top-1/2 left-1/2 -translate-x-32 -translate-y-24 flex flex-col items-center gap-1">
                 <div className="grid size-10 place-items-center rounded-full bg-red-600 text-white shadow-[0_0_20px_8px_rgba(220,38,38,0.5)]">
                    <Siren className="size-5" />
                 </div>
                 <div className="rounded bg-black/80 px-2 py-1 text-[10px] font-bold text-white border border-red-500/50 shadow-xl">
                    MED-09 (65 km/h)
                 </div>
               </div>
            </div>
         </div>

         <div className="flex flex-col gap-4">
            <h2 className="font-bold tracking-tight text-white border-b border-border pb-2">Active Emergency Units</h2>
            
            {isLoading || !vehicles ? (
              <div className="grid h-64 place-items-center">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                 {vehicles.map(vehicle => (
                    <div key={vehicle.id} className={cn(
                       "panel rounded-xl border p-4 shadow-lg transition-all",
                       vehicle.status === "Active" ? "border-red-500/50 bg-gradient-to-br from-red-500/10 to-transparent" : "border-border"
                    )}>
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className={cn(
                               "grid size-10 place-items-center rounded-lg",
                               vehicle.status === "Active" ? "bg-red-500/20 text-red-500" :
                               vehicle.status === "Standby" ? "bg-amber-500/20 text-amber-500" :
                               "bg-emerald-500/20 text-emerald-500"
                             )}>
                                <Radio className="size-5" />
                             </div>
                             <div>
                                <h3 className="font-bold text-white leading-tight">{vehicle.id}</h3>
                                <p className={cn(
                                  "text-[10px] font-bold uppercase tracking-wider mt-0.5",
                                  vehicle.status === "Active" ? "text-red-400" : "text-muted-foreground"
                                )}>{vehicle.type}</p>
                             </div>
                          </div>
                          <span className={cn(
                             "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                             vehicle.status === "Active" ? "bg-red-500/20 text-red-500 border-red-500/30" :
                             vehicle.status === "Standby" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                             "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          )}>
                             {vehicle.status === "Active" && <span className="size-1.5 rounded-full bg-red-500 animate-pulse" />}
                             {vehicle.status}
                          </span>
                       </div>

                       <div className="mt-4 flex flex-col gap-2 rounded bg-background/50 p-3 border border-border/50">
                          <div className="flex items-start gap-2">
                             <MapPin className="size-3.5 text-muted-foreground mt-0.5" />
                             <div>
                               <p className="text-[10px] font-bold text-muted-foreground uppercase">Current Location</p>
                               <p className="text-xs font-semibold text-white">{vehicle.location}</p>
                             </div>
                          </div>
                          <div className="flex items-start gap-2 mt-1">
                             <TrafficCone className="size-3.5 text-muted-foreground mt-0.5" />
                             <div>
                               <p className="text-[10px] font-bold text-muted-foreground uppercase">Destination</p>
                               <p className="text-xs font-semibold text-white">{vehicle.destination}</p>
                             </div>
                          </div>
                       </div>

                       {vehicle.status === "Active" && (
                          <div className="mt-3 grid grid-cols-3 gap-2">
                             <div className="flex flex-col items-center justify-center gap-1 rounded bg-background/50 p-2 border border-border/50">
                                <Gauge className="size-3.5 text-blue-400" />
                                <span className="text-xs font-bold text-white">{vehicle.speed}</span>
                             </div>
                             <div className="flex flex-col items-center justify-center gap-1 rounded bg-background/50 p-2 border border-border/50">
                                <Clock className="size-3.5 text-amber-400" />
                                <span className="text-xs font-bold text-white">{vehicle.eta}</span>
                             </div>
                             <div className="flex flex-col items-center justify-center gap-1 rounded bg-emerald-500/10 p-2 border border-emerald-500/20">
                                <TrafficCone className="size-3.5 text-emerald-500" />
                                <span className="text-xs font-bold text-emerald-400">{vehicle.lightsControlled} Lights</span>
                             </div>
                          </div>
                       )}
                    </div>
                 ))}
              </div>
            )}
         </div>
      </div>
    </div>
  );
}
