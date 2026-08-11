import { createFileRoute } from "@tanstack/react-router";
import { useParkingLots } from "@/lib/data/parking";
import { Loader2, Car, MapPin, Activity, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/smart-parking")({
  head: () => ({
    meta: [{ title: "Smart Parking Management — QC Command Center" }],
  }),
  component: SmartParkingPage,
});

function SmartParkingPage() {
  const { data: lots, isLoading } = useParkingLots();

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Car className="size-6 text-blue-500" />
            Smart Parking Management
          </h1>
          <p className="text-sm text-muted-foreground">Monitor real-time parking availability via ground IoT sensors.</p>
        </div>
      </div>

      {isLoading || !lots ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
           {lots.map(lot => {
              const occupancy = ((lot.totalSpots - lot.availableSpots) / lot.totalSpots) * 100;
              return (
                <div key={lot.id} className="panel flex flex-col gap-4 rounded-xl border border-border p-5 shadow-lg">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className={cn(
                           "grid size-10 place-items-center rounded-lg",
                           lot.status === "Available" ? "bg-blue-500/20 text-blue-500" :
                           lot.status === "Full" ? "bg-red-500/20 text-red-500" :
                           "bg-orange-500/20 text-orange-500"
                         )}>
                            <Car className="size-5" />
                         </div>
                         <div>
                            <h3 className="font-bold text-white leading-tight">{lot.name}</h3>
                            <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                               <MapPin className="size-3" />
                               {lot.location}
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="mt-2 grid grid-cols-2 gap-4">
                      <div>
                         <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Available Spots</p>
                         <p className={cn(
                           "text-3xl font-black mt-1",
                           lot.availableSpots > 20 ? "text-emerald-400" :
                           lot.availableSpots > 0 ? "text-orange-400" : "text-red-500"
                         )}>
                            {lot.availableSpots}
                         </p>
                      </div>
                      <div>
                         <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Spots</p>
                         <p className="text-3xl font-black text-white mt-1">{lot.totalSpots}</p>
                      </div>
                   </div>

                   <div className="mt-2 flex flex-col gap-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-white/50">
                         <span>Occupancy</span>
                         <span>{occupancy.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-border/50">
                         <div 
                           className={cn(
                              "h-full transition-all duration-1000",
                              occupancy > 90 ? "bg-red-500" :
                              occupancy > 70 ? "bg-orange-500" : "bg-emerald-500"
                           )}
                           style={{ width: `${occupancy}%` }}
                         />
                      </div>
                   </div>

                   <div className="mt-2 flex items-center justify-between border-t border-border pt-4">
                      <span className={cn(
                         "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wider",
                         lot.status === "Available" ? "text-emerald-500" :
                         lot.status === "Full" ? "text-red-500" : "text-orange-500"
                      )}>
                         {lot.status === "Available" ? <CheckCircle2 className="size-3" /> :
                          lot.status === "Full" ? <AlertCircle className="size-3" /> :
                          <AlertTriangle className="size-3" />}
                         {lot.status}
                      </span>
                      <span className="text-[10px] font-mono-tab text-muted-foreground">
                         Updated: Just now
                      </span>
                   </div>
                </div>
              );
           })}
        </div>
      )}
    </div>
  );
}
