import { createFileRoute } from "@tanstack/react-router";
import { useCrowdsourceReports } from "@/lib/data/crowdsource";
import { Loader2, Video, CheckCircle2, AlertTriangle, AlertCircle, PlaySquare, ShieldCheck, MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/crowdsource")({
  head: () => ({
    meta: [{ title: "Crowdsource Review — QC Command Center" }],
  }),
  component: CrowdsourcePage,
});

function CrowdsourcePage() {
  const { data: reports, isLoading } = useCrowdsourceReports();

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Video className="size-6 text-indigo-400" />
            Citizen Dashcam Verification
          </h1>
          <p className="text-sm text-muted-foreground">Command Center queue for reviewing AI-prefiltered citizen dashcam submissions.</p>
        </div>
        <div className="flex items-center gap-2">
           <div className="relative">
             <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
             <input type="text" placeholder="Search report ID..." className="h-9 w-64 rounded-md border border-border bg-background/50 pl-9 pr-4 text-sm outline-none focus:border-primary" />
           </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
         {/* Featured Review Panel */}
         <div className="lg:col-span-2 flex flex-col gap-4">
            <h2 className="font-bold tracking-tight text-white border-b border-border pb-2">Active Review Workspace</h2>
            
            <div className="panel rounded-xl border border-border p-5 shadow-lg flex flex-col gap-4">
               {/* Video Player Placeholder */}
               <div className="relative w-full rounded-lg bg-black aspect-video flex items-center justify-center border border-border/50 group overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center opacity-50 blur-[2px] transition-all group-hover:blur-none" />
                  <div className="absolute inset-0 bg-black/40" />
                  
                  {/* AI Bounding Box Overlay Simulation */}
                  <div className="absolute top-1/4 left-1/3 w-32 h-24 border-2 border-red-500 rounded shadow-[0_0_10px_2px_rgba(239,68,68,0.5)]">
                     <div className="absolute -top-6 left-0 bg-red-500 text-white text-[10px] font-bold px-1 py-0.5 rounded-sm">
                        Plt: ABC-1234 (98%)
                     </div>
                  </div>

                  <div className="z-10 grid size-16 place-items-center rounded-full bg-primary/80 text-white backdrop-blur cursor-pointer hover:bg-primary transition-colors shadow-xl">
                     <PlaySquare className="size-6 ml-1" />
                  </div>

                  <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 rounded bg-black/80 px-3 py-1.5 border border-border/50 backdrop-blur">
                     <span className="relative flex size-2">
                       <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                       <span className="relative inline-flex size-2 rounded-full bg-red-500"></span>
                     </span>
                     <span className="text-xs font-bold text-white uppercase tracking-wider">AI Filter: Reckless Driving Detected</span>
                  </div>
               </div>

               <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div>
                     <h3 className="text-lg font-bold text-white">Report ID: REP-24-001</h3>
                     <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="size-4" /> Katipunan Ave (Dashcam front-view)
                     </p>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                     <button className="flex-1 sm:flex-none rounded-md bg-red-500/10 px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-colors">
                        Reject
                     </button>
                     <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                        <ShieldCheck className="size-4" /> Verify & Issue Citation
                     </button>
                  </div>
               </div>
            </div>
         </div>

         {/* Submission Queue */}
         <div className="flex flex-col gap-4">
            <h2 className="font-bold tracking-tight text-white border-b border-border pb-2">Incoming Queue</h2>
            
            {isLoading || !reports ? (
              <div className="grid h-64 place-items-center">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                 {reports.map(report => (
                    <div key={report.id} className={cn(
                       "panel rounded-xl border p-4 transition-all cursor-pointer hover:border-primary/50",
                       report.status === "Pending Review" ? "border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 to-transparent" : "border-border opacity-60"
                    )}>
                       <div className="flex items-start justify-between">
                          <div>
                             <h3 className="font-bold text-white leading-tight">{report.id}</h3>
                             <p className="text-[10px] text-muted-foreground mt-0.5">{report.submitter}</p>
                          </div>
                          <span className={cn(
                             "inline-flex rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border",
                             report.status === "Pending Review" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                             report.status === "Verified - Citation Issued" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                             "bg-red-500/10 text-red-400 border-red-500/20"
                          )}>
                             {report.status}
                          </span>
                       </div>

                       <div className="mt-3 flex items-center justify-between text-xs">
                          <span className="font-semibold text-white">{report.violationType}</span>
                          <span className={cn(
                             "font-bold",
                             report.confidenceScore >= 85 ? "text-emerald-400" :
                             report.confidenceScore >= 50 ? "text-amber-400" : "text-red-400"
                          )}>
                             {report.confidenceScore}% AI Match
                          </span>
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
