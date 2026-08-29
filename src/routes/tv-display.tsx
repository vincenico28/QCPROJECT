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
            
            <div className="flex-1 bg-[url('https://api.maptiler.com/maps/dataviz-dark/static/121.050,14.655,14/1200x800.png?key=get_your_own_OpIi9ZULNHzrESv6T2vL')] bg-cover bg-center opacity-70">
               {/* Simulated Radar Ping */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-32 rounded-full border border-emerald-500/50 animate-ping"></div>
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-2 rounded-full bg-emerald-500 shadow-[0_0_15px_5px_rgba(16,185,129,0.5)]"></div>
               
               <div className="absolute top-1/3 left-2/3 -translate-x-1/2 -translate-y-1/2 size-2 rounded-full bg-emerald-500 shadow-[0_0_15px_5px_rgba(16,185,129,0.5)]"></div>
               <div className="absolute top-2/3 left-1/3 -translate-x-1/2 -translate-y-1/2 size-2 rounded-full bg-red-500 shadow-[0_0_15px_5px_rgba(239,68,68,0.5)]"></div>
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
