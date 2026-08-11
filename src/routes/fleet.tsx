import { createFileRoute } from "@tanstack/react-router";
import { useFleetAssets } from "@/lib/data/fleet";
import { Loader2, Crosshair, MapPin, Battery, Car, Truck, Plane, Settings2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/fleet")({
  head: () => ({
    meta: [{ title: "Fleet & Drone Management — QC Command Center" }],
  }),
  component: FleetPage,
});

function getAssetIcon(type: string) {
  switch (type) {
    case "Cruiser": return <Car className="size-5" />;
    case "Tow Truck": return <Truck className="size-5" />;
    case "Drone": return <Plane className="size-5" />;
    default: return <Car className="size-5" />;
  }
}

function FleetPage() {
  const { data: assets, isLoading } = useFleetAssets();

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Crosshair className="size-6 text-emerald-500" />
            Fleet & Drone Operations
          </h1>
          <p className="text-sm text-muted-foreground">Track physical response units and aerial surveillance drones in real-time.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500">
          <Plus className="size-4" />
          Dispatch Asset
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
         {/* Live Map Placeholder for Fleet */}
         <div className="lg:col-span-2 panel rounded-2xl border border-border p-0 overflow-hidden relative min-h-[400px]">
             <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-full bg-black/80 px-4 py-2 border border-border backdrop-blur">
               <span className="relative flex size-3">
                 <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                 <span className="relative inline-flex size-3 rounded-full bg-emerald-500"></span>
               </span>
               <span className="text-sm font-bold uppercase tracking-wider text-white">Live GPS Feed</span>
            </div>
            
            <div className="absolute inset-0 bg-[url('https://api.maptiler.com/maps/dataviz-dark/static/121.050,14.655,14/1200x800.png?key=get_your_own_OpIi9ZULNHzrESv6T2vL')] bg-cover bg-center opacity-80">
               {/* Drone Icon */}
               <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 group">
                 <div className="relative">
                    <div className="absolute -inset-2 rounded-full bg-blue-500/20 animate-pulse"></div>
                    <div className="grid size-8 place-items-center rounded-full bg-blue-500 text-white shadow-[0_0_15px_5px_rgba(59,130,246,0.5)]">
                       <Plane className="size-4" />
                    </div>
                 </div>
                 <span className="rounded bg-black/80 px-2 py-0.5 text-[10px] font-bold text-white border border-border">DRN-001 (Aerial)</span>
               </div>

               {/* Cruiser Icon */}
               <div className="absolute top-1/2 left-2/3 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
                 <div className="grid size-8 place-items-center rounded-full bg-emerald-500 text-white shadow-[0_0_15px_5px_rgba(16,185,129,0.5)]">
                    <Car className="size-4" />
                 </div>
                 <span className="rounded bg-black/80 px-2 py-0.5 text-[10px] font-bold text-white border border-border">UNIT-01 (Deployed)</span>
               </div>
            </div>
         </div>

         {/* Asset Roster */}
         <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
               Active Asset Roster
            </h2>
            
            {isLoading || !assets ? (
              <div className="grid h-64 place-items-center">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                 {assets.map(asset => (
                    <div key={asset.id} className="panel flex flex-col gap-3 rounded-xl border border-border p-4 shadow-lg hover:border-border/80 transition-colors cursor-pointer">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className={cn(
                               "grid size-10 place-items-center rounded-lg",
                               asset.type === "Drone" ? "bg-blue-500/20 text-blue-500" :
                               asset.type === "Tow Truck" ? "bg-orange-500/20 text-orange-500" :
                               "bg-emerald-500/20 text-emerald-500"
                             )}>
                               {getAssetIcon(asset.type)}
                             </div>
                             <div>
                               <h3 className="font-bold text-white leading-tight">{asset.name}</h3>
                               <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">{asset.id}</p>
                             </div>
                          </div>
                          <span className={cn(
                             "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                             asset.status === "Deployed" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                             asset.status === "Standby" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                             "bg-orange-500/10 text-orange-500 border-orange-500/20"
                          )}>
                            {asset.status}
                          </span>
                       </div>

                       <div className="grid grid-cols-2 gap-2 mt-2">
                          <div className="flex items-center gap-2 rounded bg-background/50 px-2 py-1.5 border border-border/50">
                             <MapPin className="size-3 text-muted-foreground" />
                             <span className="text-xs font-medium text-white truncate">{asset.location}</span>
                          </div>
                          <div className="flex items-center gap-2 rounded bg-background/50 px-2 py-1.5 border border-border/50">
                             <Battery className={cn("size-3", asset.fuelBatteryLevel > 50 ? "text-emerald-500" : "text-red-500")} />
                             <span className="text-xs font-medium text-white">{asset.fuelBatteryLevel}% {asset.type === "Drone" ? "Bat" : "Fuel"}</span>
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
