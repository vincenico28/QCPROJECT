import { createFileRoute, Link } from "@tanstack/react-router";
import { useCitizenProfile } from "@/lib/data/citizen";
import { Loader2, Car, AlertTriangle, ShieldCheck, FileText, ChevronRight, CheckCircle2, User, LogOut } from "lucide-react";
import { formatPeso } from "@/lib/data/traffic";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/citizen")({
  head: () => ({
    meta: [{ title: "Citizen Portal — Culiat Traffic Ops" }],
  }),
  component: CitizenPortal,
});

function CitizenPortal() {
  const { data: profile, isLoading } = useCitizenProfile();

  if (isLoading || !profile) {
    return (
      <div className="grid min-h-dvh place-items-center bg-[#0a0a0b]">
        <Loader2 className="size-8 animate-spin text-[#0066cc]" />
      </div>
    );
  }

  const unpaidCitations = profile.citations.filter(c => c.status === "unpaid");
  const totalUnpaid = unpaidCitations.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="min-h-dvh bg-[#0a0a0b] text-white selection:bg-[#0066cc]/30">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0b]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <img src="/favico2.png" alt="Culiat LGU" className="size-8" />
            <span className="font-semibold tracking-tight text-white">Citizen<span className="text-[#0066cc]">Portal</span></span>
          </div>
          
          <div className="flex items-center gap-6">
            <nav className="hidden items-center gap-6 text-sm font-medium text-white/70 md:flex">
              <Link to="/citizen" className="text-white">Dashboard</Link>
              <Link to="/citizen" className="hover:text-white transition-colors">My Vehicles</Link>
              <Link to="/citizen" className="hover:text-white transition-colors">Appeals</Link>
            </nav>
            <div className="flex items-center gap-3 pl-6 border-l border-white/10">
              <div className="flex items-center gap-2">
                <div className="grid size-8 place-items-center rounded-full bg-[#0066cc]/20 text-[#0066cc]">
                  <User className="size-4" />
                </div>
                <div className="hidden flex-col md:flex">
                  <span className="text-sm font-medium leading-none text-white">{profile.fullName}</span>
                  <span className="text-xs text-white/50">{profile.id}</span>
                </div>
              </div>
              <button className="text-white/50 hover:text-white transition-colors">
                <LogOut className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {profile.fullName?.split(' ')[0] || "Citizen"}</h1>
          <p className="mt-2 text-white/60">Manage your registered vehicles and settle traffic citations.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content Column */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            
            {/* Alert Banner for Unpaid Citations */}
            {unpaidCitations.length > 0 && (
              <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-[#cc0000]/20 to-transparent border border-[#cc0000]/30 p-6">
                <div className="flex items-start gap-4">
                  <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#cc0000]/20 text-[#cc0000]">
                    <AlertTriangle className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Outstanding Citations Found</h3>
                    <p className="mt-1 text-sm text-white/70">
                      You have {unpaidCitations.length} unpaid citation(s) totaling <strong className="text-white font-mono-tab">{formatPeso(totalUnpaid)}</strong>. 
                      Please settle immediately to avoid late penalties.
                    </p>
                  </div>
                </div>
                <button className="shrink-0 rounded-lg bg-[#cc0000] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#cc0000]/25 hover:bg-[#cc0000]/90 transition-all">
                  Pay Now
                </button>
              </div>
            )}

            {/* My Vehicles */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                  <Car className="size-5 text-[#0066cc]" />
                  Registered Vehicles
                </h2>
                <button className="text-sm font-medium text-[#0066cc] hover:underline">+ Add Vehicle</button>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                {profile.vehicles.map(v => (
                  <div key={v.id} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 transition-all hover:bg-white/10 hover:border-white/20">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/80">
                          {v.type}
                        </div>
                        <h3 className="mt-3 font-mono-tab text-2xl font-bold tracking-wider text-white">{v.plateNumber}</h3>
                        <p className="mt-1 text-sm text-white/60">{v.makeModel}</p>
                      </div>
                      
                      {v.status === "verified" ? (
                        <div className="flex items-center gap-1.5 text-emerald-400">
                           <CheckCircle2 className="size-4" />
                           <span className="text-xs font-medium uppercase tracking-wider">Verified</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-yellow-500">
                           <AlertTriangle className="size-4" />
                           <span className="text-xs font-medium uppercase tracking-wider">Pending LTO</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar Column */}
          <div className="flex flex-col gap-6">
            
            <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6">
               <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                  <FileText className="size-5 text-[#0066cc]" />
                  Recent Citations
                </h2>
                
                <div className="flex flex-col gap-3">
                  {profile.citations.map(c => (
                    <div key={c.id} className="group flex flex-col gap-3 rounded-xl border border-white/10 bg-black/40 p-4 transition-colors hover:bg-white/5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-white">{c.violation}</p>
                          <p className="text-xs text-white/60">{new Date(c.date).toLocaleDateString()} • {c.plateNumber}</p>
                        </div>
                        <span className="font-mono-tab font-medium text-white">{formatPeso(c.amount)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between border-t border-white/10 pt-3">
                         <span className={cn(
                           "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                           c.status === "unpaid" ? "bg-[#cc0000]/20 text-[#cc0000]" : 
                           c.status === "settled" ? "bg-emerald-500/20 text-emerald-500" : "bg-orange-500/20 text-orange-500"
                         )}>
                           {c.status}
                         </span>
                         
                         <button className="flex items-center gap-1 text-xs font-medium text-[#0066cc] opacity-0 group-hover:opacity-100 transition-opacity">
                           View Details <ChevronRight className="size-3" />
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button className="mt-2 w-full rounded-lg border border-white/10 py-2 text-sm font-medium text-white/80 hover:bg-white/10 transition-colors">
                  View All History
                </button>
            </section>
            
             <section className="flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-[#0066cc]/20 to-[#0066cc]/5 border border-[#0066cc]/30 p-6">
                <div className="grid size-10 place-items-center rounded-full bg-[#0066cc]/20 text-[#0066cc]">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Dispute a Citation</h3>
                  <p className="mt-1 text-sm text-white/70 leading-relaxed">
                    Believe you were incorrectly ticketed? You can submit dashcam footage or documents to our adjudicators.
                  </p>
                </div>
                <button className="mt-2 rounded-lg bg-white/10 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors">
                  File an Appeal
                </button>
             </section>

          </div>
        </div>
      </main>
    </div>
  );
}
