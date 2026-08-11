import { createFileRoute } from "@tanstack/react-router";
import { useHotlineCalls } from "@/lib/data/hotline";
import { Loader2, PhoneCall, AlertTriangle, ShieldAlert, CheckCircle2, PhoneForwarded, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dispatch-hotline")({
  head: () => ({
    meta: [{ title: "Emergency Dispatch Hotline — QC Command Center" }],
  }),
  component: DispatchHotlinePage,
});

function DispatchHotlinePage() {
  const { data: calls, isLoading } = useHotlineCalls();

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <PhoneCall className="size-6 text-red-500" />
            Emergency Dispatch Hotline
          </h1>
          <p className="text-sm text-muted-foreground">Receive and route active citizen distress calls to fleet units.</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-sm font-semibold text-red-500 animate-pulse">
              <span className="relative flex size-2">
                 <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                 <span className="relative inline-flex size-2 rounded-full bg-red-500"></span>
              </span>
              2 Active Lines
           </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
         {/* Active Call Intake */}
         <div className="lg:col-span-2 flex flex-col gap-4">
            <h2 className="font-bold tracking-tight text-white flex items-center gap-2 border-b border-border pb-2">
               Active Incoming Calls
            </h2>
            {isLoading || !calls ? (
              <div className="grid h-64 place-items-center">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid gap-4">
                 {calls.filter(c => c.status === "Active").map(call => (
                    <div key={call.id} className={cn(
                       "panel rounded-2xl border p-5 shadow-lg relative overflow-hidden transition-all",
                       call.level === "Critical" ? "border-red-500/50 bg-gradient-to-r from-red-500/10 to-transparent" :
                       "border-orange-500/30 bg-gradient-to-r from-orange-500/5 to-transparent"
                    )}>
                       <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                             <div className={cn(
                               "grid size-12 shrink-0 place-items-center rounded-full shadow-lg",
                               call.level === "Critical" ? "bg-red-500/20 text-red-500 shadow-red-500/20" : "bg-orange-500/20 text-orange-500 shadow-orange-500/20"
                             )}>
                               {call.level === "Critical" ? <ShieldAlert className="size-6" /> : <AlertTriangle className="size-6" />}
                             </div>
                             <div>
                               <div className="flex items-center gap-2">
                                  <h3 className="font-bold text-white text-lg">{call.caller}</h3>
                                  <span className="text-xs text-muted-foreground font-mono-tab bg-background/50 px-2 py-0.5 rounded border border-border/50">{call.phoneNumber}</span>
                               </div>
                               
                               <div className="flex items-center gap-2 mt-1">
                                  <MapPin className="size-3 text-muted-foreground" />
                                  <span className="text-sm font-semibold text-white">{call.location}</span>
                               </div>

                               <p className="mt-3 text-sm text-white/80 leading-relaxed border-l-2 border-white/20 pl-3 italic">
                                  "{call.issue}"
                               </p>
                             </div>
                          </div>

                          <div className="flex flex-col gap-3 shrink-0">
                             <div className="text-right">
                               <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Wait Time</p>
                               <p className="text-sm font-mono-tab font-bold text-red-400 mt-0.5 flex items-center justify-end gap-1">
                                 <Clock className="size-3" /> 00:02:14
                               </p>
                             </div>
                             <button className="inline-flex items-center gap-2 justify-center rounded-lg bg-red-600 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-500 shadow-lg shadow-red-500/20">
                                <PhoneForwarded className="size-4" />
                                Dispatch Unit
                             </button>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
            )}
         </div>

         {/* Call History / Resolved */}
         <div className="flex flex-col gap-4">
            <h2 className="font-bold tracking-tight text-white flex items-center gap-2 border-b border-border pb-2">
               Recently Resolved
            </h2>
            <div className="flex flex-col gap-3">
               {calls?.filter(c => c.status === "Resolved").map(call => (
                  <div key={call.id} className="panel rounded-xl border border-border bg-background/50 p-4 opacity-70 hover:opacity-100 transition-opacity">
                     <div className="flex items-center justify-between">
                        <h4 className="font-bold text-white">{call.location}</h4>
                        <CheckCircle2 className="size-4 text-emerald-500" />
                     </div>
                     <p className="text-xs text-muted-foreground mt-1 truncate">{call.issue}</p>
                     <p className="text-[10px] font-mono-tab text-muted-foreground mt-3">Resolved: {new Date(call.timeReceived).toLocaleTimeString()}</p>
                  </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}
