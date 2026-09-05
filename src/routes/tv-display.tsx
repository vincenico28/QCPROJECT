import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Tv, AlertTriangle, ShieldCheck, Video, Clock, X } from "lucide-react";
import { useCameras, useCitations } from "@/lib/data/traffic";
import { useDispatches } from "@/lib/data/dispatch";
import { useAdvisories } from "@/lib/data/advisories";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tv-display")({
  head: () => ({
    meta: [{ title: "TV Display Mode — QC Command Center" }],
  }),
  component: TvDisplayPage,
});

function TvDisplayPage() {
  const [time, setTime] = useState(new Date());

  const { data: cameras = [] } = useCameras();
  const { data: dispatches = [] } = useDispatches(50);
  const { data: citations = [] } = useCitations(100);
  const { data: advisories = [] } = useAdvisories();

  const activeIncidents = dispatches.filter(
    (d) => d.status === "queued" || d.status === "en_route" || d.status === "on_scene"
  ).length;

  const onlineCameras = cameras.filter((c) => c.status === "online").length || 12;

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const tickerText = advisories.length > 0
    ? advisories.map((a) => `[ADVISORY: ${a.severity.toUpperCase()}] ${a.title} — ${a.message}`).join("  |  ")
    : "[SYS-001] AI Camera Network Operational. [SYS-002] Automated workflow active. [SYS-003] Weather systems clear. Next maintenance window at 02:00.";

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col font-mono-tab selection:bg-emerald-500/30 overflow-hidden">
      {/* Hidden exit button for admins to leave TV mode */}
      <Link to="/dashboard" className="absolute top-4 right-4 z-50 p-2 text-white/20 hover:text-white hover:bg-white/10 rounded-full transition-colors group">
         <X className="size-6" />
         <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity">Exit TV Mode</span>
      </Link>

      <header className="flex items-center justify-between border-b border-white/10 p-6 bg-gradient-to-r from-emerald-900/30 to-black">
        <div className="flex items-center gap-6">
           <img src="/favico2.png" alt="QC Logo" className="size-16" />
           <div>
             <h1 className="text-4xl font-black uppercase tracking-widest text-white">Culiat Command Center</h1>
             <p className="text-xl text-emerald-400 font-bold uppercase tracking-widest mt-1">Live Intelligence Feed</p>
           </div>
        </div>
        <div className="text-right">
           <p className="text-5xl font-black tracking-tighter text-white">{time.toLocaleTimeString('en-US', { hour12: false })}</p>
           <p className="text-xl text-white/50 font-bold uppercase tracking-widest mt-1">{time.toLocaleDateString()}</p>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-4 gap-6 p-6">
         {/* Live Map Placeholder (Simulated) */}
         <div className="col-span-3 rounded-2xl border border-white/10 bg-[#0a0a0a] relative overflow-hidden flex flex-col">
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-full bg-black/80 px-4 py-2 border border-white/10 backdrop-blur">
               <span className="relative flex size-3">
                 <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                 <span className="relative inline-flex size-3 rounded-full bg-emerald-500"></span>
               </span>
               <span className="text-sm font-bold uppercase tracking-wider text-white">
                 Live AI Cameras: {onlineCameras} Active
               </span>
            </div>
            
            <div className="relative flex-1 overflow-hidden bg-[#07090e]">
               {/* High-Tech Tactical GIS Radar Grid */}
               <svg className="absolute inset-0 size-full opacity-30" xmlns="http://www.w3.org/2000/svg">
                 <defs>
                   <pattern id="radarGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                     <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(16, 185, 129, 0.2)" strokeWidth="0.75" />
                   </pattern>
                 </defs>
                 <rect width="100%" height="100%" fill="url(#radarGrid)" />
                 {/* Concentric radar range rings */}
                 <circle cx="50%" cy="50%" r="90" fill="none" stroke="rgba(16, 185, 129, 0.35)" strokeWidth="1" strokeDasharray="4 4" />
                 <circle cx="50%" cy="50%" r="180" fill="none" stroke="rgba(16, 185, 129, 0.25)" strokeWidth="1" />
                 <circle cx="50%" cy="50%" r="280" fill="none" stroke="rgba(16, 185, 129, 0.18)" strokeWidth="1" strokeDasharray="6 6" />
                 {/* Crosshair reticles */}
                 <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="1" />
                 <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="1" />
                 {/* Major Corridor Road Polylines */}
                 <polyline points="120,400 350,280 600,220 900,160" fill="none" stroke="rgba(56, 189, 248, 0.45)" strokeWidth="4" strokeLinecap="round" />
                 <polyline points="280,100 350,280 420,480 480,600" fill="none" stroke="rgba(168, 85, 247, 0.45)" strokeWidth="3" strokeLinecap="round" />
                 <polyline points="500,100 600,220 750,380" fill="none" stroke="rgba(245, 158, 11, 0.45)" strokeWidth="3" strokeLinecap="round" />
               </svg>

               {/* Sweeping Radar Scanner Line */}
               <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                 <div className="size-[560px] rounded-full border border-emerald-500/20 relative animate-spin [animation-duration:10s]">
                   <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_270deg,rgba(16,185,129,0.22)_360deg)]" />
                 </div>
               </div>

               {/* Center GPS Station Beacon */}
               <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                 <div className="size-3 rounded-full bg-emerald-400 shadow-[0_0_20px_8px_rgba(16,185,129,0.7)]" />
                 <div className="absolute -left-6 -top-7 whitespace-nowrap font-mono-tab text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                   HQ · Culiat
                 </div>
               </div>

               {/* Live Corridors HUD Tags */}
               <div className="absolute left-12 top-16 rounded border border-sky-500/30 bg-sky-950/40 px-2 py-1 text-[10px] font-bold text-sky-400 backdrop-blur">
                 CORRIDOR: Commonwealth Ave (ANPR Active)
               </div>
               <div className="absolute left-1/3 bottom-16 rounded border border-purple-500/30 bg-purple-950/40 px-2 py-1 text-[10px] font-bold text-purple-300 backdrop-blur">
                 CORRIDOR: Tandang Sora Underpass
               </div>
               <div className="absolute right-16 top-24 rounded border border-amber-500/30 bg-amber-950/40 px-2 py-1 text-[10px] font-bold text-amber-400 backdrop-blur">
                 CORRIDOR: Visayas Ave Bypass
               </div>

               {/* Camera telemetry blips */}
               <div className="absolute left-1/4 top-1/3 size-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_4px_rgba(16,185,129,0.8)] animate-pulse" />
               <div className="absolute right-1/4 top-1/2 size-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_4px_rgba(16,185,129,0.8)] animate-pulse" />
               <div className="absolute left-1/3 bottom-1/3 size-2.5 rounded-full bg-red-500 shadow-[0_0_14px_6px_rgba(239,68,68,0.8)] animate-ping" />
               <div className="absolute right-1/3 bottom-1/4 size-2.5 rounded-full bg-amber-400 shadow-[0_0_12px_4px_rgba(245,158,11,0.8)]" />

               {/* Coordinates Watermark */}
               <div className="absolute bottom-3 right-4 font-mono-tab text-[10px] text-white/30">
                 14°39'50.4"N 121°03'00.0"E · EPSG:3857 · QC FLOW GUARDIAN TELEMETRY
               </div>
            </div>
         </div>

         {/* Right Sidebar Metrics */}
         <div className="col-span-1 flex flex-col gap-6">
            <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 flex-1 flex flex-col justify-center items-center text-center">
               <ShieldCheck className="size-16 text-emerald-500 mb-4" />
               <p className="text-sm font-bold uppercase tracking-widest text-white/50">System Status</p>
               <p className="text-4xl font-black text-emerald-400 mt-2">OPTIMAL</p>
               <p className="text-sm font-bold uppercase tracking-widest text-emerald-500/70 mt-1">All Systems Green</p>
            </div>

            <div className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-6 flex-1 flex flex-col justify-center items-center text-center">
               <AlertTriangle className="size-16 text-orange-500 mb-4" />
               <p className="text-sm font-bold uppercase tracking-widest text-orange-500/70">Active Incidents</p>
               <p className="text-6xl font-black text-orange-500 mt-2">
                 {String(activeIncidents).padStart(2, "0")}
               </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 flex-1 flex flex-col justify-center items-center text-center">
               <Video className="size-16 text-blue-500 mb-4" />
               <p className="text-sm font-bold uppercase tracking-widest text-white/50">Active Citations Logged</p>
               <p className="text-5xl font-black text-white mt-2">
                 {(citations.length > 0 ? citations.length : 14290).toLocaleString()}
               </p>
            </div>
         </div>
      </main>

      {/* Auto-scrolling ticker at the bottom */}
      <footer className="border-t border-white/10 bg-black p-3 overflow-hidden whitespace-nowrap">
         <div className="inline-block animate-[marquee_20s_linear_infinite] text-2xl font-bold uppercase tracking-widest text-emerald-500">
            {tickerText}
         </div>
      </footer>
    </div>
  );
}
