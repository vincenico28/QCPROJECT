import { createFileRoute } from "@tanstack/react-router";
import { useTransitBuses } from "@/lib/data/transit";
import { Loader2, Bus, MapPin, Clock, Users, AlertTriangle, CheckCircle2, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/transit")({
  head: () => ({
    meta: [{ title: "Public Transit Tracking — QC Command Center" }],
  }),
  component: TransitPage,
});

function TransitPage() {
  const { data: buses, isLoading } = useTransitBuses();

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Bus className="size-6 text-indigo-400" />
            Public Transit Tracking
          </h1>
          <p className="text-sm text-muted-foreground">Live GPS monitoring and delay prediction for QCity Bus routes.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
         {/* Live Map Placeholder */}
         <div className="lg:col-span-2 panel rounded-2xl border border-border p-0 overflow-hidden relative min-h-[400px]">
             <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-full bg-black/80 px-4 py-2 border border-border backdrop-blur">
               <span className="relative flex size-3">
                 <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                 <span className="relative inline-flex size-3 rounded-full bg-indigo-500"></span>
               </span>
               <span className="text-sm font-bold uppercase tracking-wider text-white">Live Transit Map</span>
            </div>
            
            <div className="absolute inset-0 bg-[url('https://api.maptiler.com/maps/dataviz-dark/static/121.050,14.655,14/1200x800.png?key=get_your_own_OpIi9ZULNHzrESv6T2vL')] bg-cover bg-center opacity-80">
               {/* Bus 1 Icon */}
               <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
                 <div className="grid size-8 place-items-center rounded-full bg-orange-500 text-white shadow-[0_0_15px_5px_rgba(249,115,22,0.5)]">
                    <Bus className="size-4" />
                 </div>
                 <span className="rounded bg-black/80 px-2 py-0.5 text-[10px] font-bold text-white border border-border">QCB-101 (Delayed)</span>
               </div>

               {/* Bus 2 Icon */}
               <div className="absolute top-2/3 left-2/3 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
                 <div className="grid size-8 place-items-center rounded-full bg-emerald-500 text-white shadow-[0_0_15px_5px_rgba(16,185,129,0.5)]">
                    <Bus className="size-4" />
                 </div>
                 <span className="rounded bg-black/80 px-2 py-0.5 text-[10px] font-bold text-white border border-border">QCB-102 (On Time)</span>
               </div>
            </div>
         </div>

         <div className="flex flex-col gap-4">
            <h2 className="font-bold tracking-tight text-white border-b border-border pb-2">Active Fleet Status</h2>
            
            {isLoading || !buses ? (
              <div className="grid h-64 place-items-center">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                 {buses.map(bus => (
                    <div key={bus.id} className="panel rounded-xl border border-border p-4 shadow-lg">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className={cn(
                               "grid size-10 place-items-center rounded-lg",
                               bus.status === "On Time" ? "bg-emerald-500/20 text-emerald-500" :
                               bus.status === "Delayed" ? "bg-orange-500/20 text-orange-500" :
                               "bg-red-500/20 text-red-500"
                             )}>
                                <Bus className="size-5" />
                             </div>
                             <div>
                                <h3 className="font-bold text-white leading-tight">{bus.id}</h3>
                                <p className="text-[10px] font-bold text-indigo-400 mt-0.5">{bus.route}</p>
                             </div>
                          </div>
                          <span className={cn(
                             "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                             bus.status === "On Time" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                             bus.status === "Delayed" ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                             "bg-red-500/10 text-red-500 border-red-500/20"
                          )}>
                             {bus.status === "On Time" && <CheckCircle2 className="size-3" />}
                             {bus.status === "Delayed" && <AlertTriangle className="size-3" />}
                             {bus.status}
                          </span>
                       </div>

                       <div className="mt-4 grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-1 rounded bg-background/50 p-2 border border-border/50">
                             <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-muted-foreground">
                                <MapPin className="size-3" /> Current
                             </span>
                             <span className="text-xs font-semibold text-white truncate">{bus.currentStop}</span>
                          </div>
                          <div className="flex flex-col gap-1 rounded bg-background/50 p-2 border border-border/50">
                             <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-muted-foreground">
                                <Navigation className="size-3" /> Next
                             </span>
                             <span className="text-xs font-semibold text-white truncate">{bus.nextStop}</span>
                          </div>
                       </div>

                       <div className="mt-2 grid grid-cols-2 gap-2">
                          <div className="flex items-center justify-between rounded bg-background/50 px-2 py-1.5 border border-border/50">
                             <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-muted-foreground">
                                <Clock className="size-3" /> Delay
                             </span>
                             <span className={cn("text-xs font-bold", bus.delayMinutes > 0 ? "text-orange-400" : "text-emerald-400")}>
                                {bus.delayMinutes} min
                             </span>
                          </div>
                          <div className="flex items-center justify-between rounded bg-background/50 px-2 py-1.5 border border-border/50">
                             <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-muted-foreground">
                                <Users className="size-3" /> Load
                             </span>
                             <span className={cn("text-xs font-bold text-white")}>
                                {bus.occupancyPercent}%
                             </span>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
            )}
         </div>
      </div>
    </div>
  );
}
