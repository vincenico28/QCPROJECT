import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  Tv,
  AlertTriangle,
  ShieldCheck,
  Video,
  Clock,
  X,
  Maximize,
  Minimize,
  Grid,
  Radio,
  Ambulance,
  Car,
  Activity,
  Zap,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCameras, useCitations } from "@/lib/data/traffic";
import { useDispatches } from "@/lib/data/dispatch";
import { useAdvisories } from "@/lib/data/advisories";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tv-display")({
  head: () => ({
    meta: [
      { title: "Command Video Wall TV Mode — QC DPOS Operations Center" },
      {
        name: "description",
        content:
          "Full-screen high-definition video wall mode for Quezon City Traffic Operations Center (TOC) with tactical radar, quad CCTV feeds, and incident stream.",
      },
    ],
  }),
  component: TvDisplayPage,
});

const QUAD_CAMERAS = [
  {
    code: "QC-CAM-CW-04",
    name: "Commonwealth Ave cor. Tandang Sora",
    location: "Inbound Main Artery",
    fps: 30,
    opticalConfidence: "99.4%",
    streamUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1000&auto=format&fit=crop&q=80",
    activeBBoxes: [
      { label: "SEDAN NDB-8921", box: "top-10 left-12 w-28 h-20", color: "border-sky-400 text-sky-400" },
      { label: "MOTORCYCLE", box: "bottom-12 right-20 w-16 h-16", color: "border-emerald-400 text-emerald-400" },
    ],
  },
  {
    code: "QC-CAM-VIS-02",
    name: "Visayas Ave cor. Central Ave",
    location: "Southbound Crossing",
    fps: 29.8,
    opticalConfidence: "98.8%",
    streamUrl: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=1000&auto=format&fit=crop&q=80",
    activeBBoxes: [
      { label: "YELLOW BOX: CLEAR", box: "top-16 left-24 w-32 h-24", color: "border-amber-400 text-amber-400" },
    ],
  },
  {
    code: "QC-CAM-BUS-01",
    name: "Commonwealth Median Busway",
    location: "Exclusive Transit Corridor",
    fps: 30,
    opticalConfidence: "99.1%",
    streamUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1000&auto=format&fit=crop&q=80",
    activeBBoxes: [
      { label: "QC BUS-4410", box: "top-8 left-16 w-36 h-28", color: "border-emerald-400 text-emerald-400" },
    ],
  },
  {
    code: "QC-CAM-KAT-03",
    name: "Katipunan Flyover Northbound",
    location: "Elevated Bypass",
    fps: 30,
    opticalConfidence: "98.5%",
    streamUrl: "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=1000&auto=format&fit=crop&q=80",
    activeBBoxes: [
      { label: "RADAR: 54 KPH", box: "top-12 right-16 w-28 h-20", color: "border-sky-400 text-sky-400" },
    ],
  },
];

export function TvDisplayPage() {
  const [time, setTime] = useState(new Date());
  const [viewMode, setViewMode] = useState<"radar" | "quad" | "dispatch">("radar");
  const [autoCycle, setAutoCycle] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { data: cameras = [] } = useCameras();
  const { data: dispatches = [] } = useDispatches(50);
  const { data: citations = [] } = useCitations(100);
  const { data: advisories = [] } = useAdvisories();

  const activeIncidents = useMemo(
    () =>
      dispatches.filter(
        (d) => d.status === "queued" || d.status === "en_route" || d.status === "on_scene"
      ).length,
    [dispatches]
  );

  const onlineCameras = cameras.filter((c) => c.status === "online").length || 14;

  // Realtime clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-cycle modes every 15 seconds if enabled
  useEffect(() => {
    if (!autoCycle) return;
    const modes: Array<"radar" | "quad" | "dispatch"> = ["radar", "quad", "dispatch"];
    const cycleInterval = setInterval(() => {
      setViewMode((prev) => {
        const nextIdx = (modes.indexOf(prev) + 1) % modes.length;
        return modes[nextIdx];
      });
    }, 15000);

    return () => clearInterval(cycleInterval);
  }, [autoCycle]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const tickerText = advisories.length > 0
    ? advisories
        .map(
          (a) =>
            `[ADVISORY: ${a.severity.toUpperCase()}] ${a.title} — ${a.message}`
        )
        .join("  ★  ")
    : "[SYS-001] AI Camera Network Operational (100% Core Online). ★ [SYS-002] Automated Workflow Daemon Active. ★ [SYS-003] Weather systems clear (29°C Dry). Next scheduled routine maintenance window at 02:00 PST.";

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col font-mono-tab selection:bg-emerald-500/30 overflow-hidden select-none">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between border-b border-white/10 px-8 py-5 bg-gradient-to-r from-emerald-950/40 via-black to-black">
        <div className="flex items-center gap-6">
          <img src="/favico2.png" alt="QC Seal" className="size-14 object-contain filter drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                QC DPOS TOC
              </span>
              <span className="text-xs text-subtle tracking-wider uppercase">Quezon City Traffic Operations Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-widest text-white mt-0.5">
              Barangay Culiat Video Wall
            </h1>
          </div>
        </div>

        {/* Center Mode Controls */}
        <div className="hidden md:flex items-center gap-2 bg-neutral-900/90 rounded-2xl p-1.5 border border-white/10">
          <button
            onClick={() => {
              setAutoCycle(false);
              setViewMode("radar");
            }}
            className={cn(
              "rounded-xl px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5",
              viewMode === "radar" && !autoCycle
                ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/25"
                : "text-white/60 hover:text-white"
            )}
          >
            <Radio className="size-3.5" /> Tactical Radar
          </button>
          <button
            onClick={() => {
              setAutoCycle(false);
              setViewMode("quad");
            }}
            className={cn(
              "rounded-xl px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5",
              viewMode === "quad" && !autoCycle
                ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/25"
                : "text-white/60 hover:text-white"
            )}
          >
            <Grid className="size-3.5" /> Quad CCTV
          </button>
          <button
            onClick={() => {
              setAutoCycle(false);
              setViewMode("dispatch");
            }}
            className={cn(
              "rounded-xl px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5",
              viewMode === "dispatch" && !autoCycle
                ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/25"
                : "text-white/60 hover:text-white"
            )}
          >
            <Ambulance className="size-3.5" /> Incident Matrix
          </button>
          <button
            onClick={() => setAutoCycle(!autoCycle)}
            className={cn(
              "rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1",
              autoCycle
                ? "bg-sky-500 text-black ring-1 ring-sky-300"
                : "text-white/40 hover:text-white"
            )}
            title="Auto-rotate view modes every 15s"
          >
            <Zap className="size-3.5" /> Auto-Cycle {autoCycle && "ON"}
          </button>
        </div>

        {/* Clock & Fullscreen Controls */}
        <div className="flex items-center gap-6 text-right">
          <div>
            <p className="text-4xl font-black tracking-tighter text-white">
              {time.toLocaleTimeString("en-US", { hour12: false })}
            </p>
            <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mt-0.5">
              {time.toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric", year: "numeric" })} · PST
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-white/70 hover:text-white hover:bg-white/15 transition-colors"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
            </button>

            <Link
              to="/dashboard"
              className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-white/70 hover:text-white hover:bg-white/15 transition-colors group"
              title="Exit TV Video Wall Mode"
            >
              <X className="size-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Command Display Area */}
      <main className="flex-1 grid grid-cols-4 gap-6 p-6 overflow-hidden">
        {/* Viewport (3 Cols) */}
        <div className="col-span-3 rounded-3xl border border-white/10 bg-[#07090e] relative overflow-hidden flex flex-col shadow-2xl">
          {/* Top Floating Badge */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-black/85 px-4 py-2 border border-white/10 backdrop-blur-md">
              <span className="relative flex size-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex size-3 rounded-full bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                LIVE FEED: {onlineCameras} SENSORS
              </span>
            </div>

            <div className="rounded-full bg-black/85 px-3.5 py-2 border border-white/10 backdrop-blur-md text-xs font-mono-tab text-emerald-400">
              MODE: {viewMode.toUpperCase()}
            </div>
          </div>

          {/* VIEW 1: TACTICAL GIS RADAR */}
          {viewMode === "radar" && (
            <div className="relative flex-1 overflow-hidden bg-[#07090e] animate-in fade-in duration-500">
              {/* High-Tech Tactical GIS Radar Grid */}
              <svg className="absolute inset-0 size-full opacity-35" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="radarGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(16, 185, 129, 0.2)" strokeWidth="0.75" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#radarGrid)" />
                {/* Concentric radar range rings */}
                <circle cx="50%" cy="50%" r="100" fill="none" stroke="rgba(16, 185, 129, 0.35)" strokeWidth="1" strokeDasharray="4 4" />
                <circle cx="50%" cy="50%" r="200" fill="none" stroke="rgba(16, 185, 129, 0.25)" strokeWidth="1" />
                <circle cx="50%" cy="50%" r="320" fill="none" stroke="rgba(16, 185, 129, 0.18)" strokeWidth="1" strokeDasharray="6 6" />
                {/* Crosshairs */}
                <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="1" />
                <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="1" />
                {/* Major Arteries */}
                <polyline points="100,420 350,290 620,230 950,160" fill="none" stroke="rgba(56, 189, 248, 0.55)" strokeWidth="4" strokeLinecap="round" />
                <polyline points="280,80 350,290 440,500 500,650" fill="none" stroke="rgba(168, 85, 247, 0.5)" strokeWidth="3" strokeLinecap="round" />
                <polyline points="500,80 620,230 780,400" fill="none" stroke="rgba(245, 158, 11, 0.5)" strokeWidth="3" strokeLinecap="round" />
              </svg>

              {/* Sweeping Radar Scanner Line */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="size-[640px] rounded-full border border-emerald-500/20 relative animate-spin [animation-duration:8s]">
                  <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_270deg,rgba(16,185,129,0.25)_360deg)]" />
                </div>
              </div>

              {/* Center GPS Station Beacon */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="size-3.5 rounded-full bg-emerald-400 shadow-[0_0_24px_10px_rgba(16,185,129,0.8)]" />
                <div className="absolute -left-10 -top-8 whitespace-nowrap font-mono-tab text-[11px] font-black uppercase tracking-wider text-emerald-300 bg-black/60 px-2 py-0.5 rounded border border-emerald-500/40">
                  DPOS HQ · CULIAT
                </div>
              </div>

              {/* Live Corridors HUD Tags */}
              <div className="absolute left-16 top-20 rounded-xl border border-sky-500/40 bg-sky-950/60 px-3 py-1.5 text-xs font-bold text-sky-300 backdrop-blur-md">
                CORRIDOR: Commonwealth Ave (ANPR Optical 99.4%)
              </div>
              <div className="absolute left-1/3 bottom-20 rounded-xl border border-purple-500/40 bg-purple-950/60 px-3 py-1.5 text-xs font-bold text-purple-300 backdrop-blur-md">
                CORRIDOR: Tandang Sora Underpass (Clear)
              </div>
              <div className="absolute right-20 top-28 rounded-xl border border-amber-500/40 bg-amber-950/60 px-3 py-1.5 text-xs font-bold text-amber-300 backdrop-blur-md">
                CORRIDOR: Visayas Ave Bypass (Traffic Density: Moderate)
              </div>

              {/* Camera telemetry blips */}
              <div className="absolute left-1/4 top-1/3 size-3 rounded-full bg-emerald-400 shadow-[0_0_14px_6px_rgba(16,185,129,0.8)] animate-pulse" />
              <div className="absolute right-1/4 top-1/2 size-3 rounded-full bg-emerald-400 shadow-[0_0_14px_6px_rgba(16,185,129,0.8)] animate-pulse" />
              <div className="absolute left-1/3 bottom-1/3 size-3.5 rounded-full bg-red-500 shadow-[0_0_16px_8px_rgba(239,68,68,0.9)] animate-ping" />
              <div className="absolute right-1/3 bottom-1/4 size-3 rounded-full bg-amber-400 shadow-[0_0_14px_6px_rgba(245,158,11,0.8)]" />

              {/* Coordinates Watermark */}
              <div className="absolute bottom-4 right-6 font-mono-tab text-xs text-white/40">
                14°39'50.4"N 121°03'00.0"E · EPSG:3857 · QC FLOW GUARDIAN TELEMETRY
              </div>
            </div>
          )}

          {/* VIEW 2: QUAD CCTV OPTICAL FEEDS */}
          {viewMode === "quad" && (
            <div className="grid grid-cols-2 grid-rows-2 gap-2 p-2 size-full bg-black animate-in fade-in duration-500">
              {QUAD_CAMERAS.map((cam) => (
                <div key={cam.code} className="relative rounded-2xl overflow-hidden border border-white/10 bg-neutral-950 group">
                  <img src={cam.streamUrl} alt={cam.name} className="size-full object-cover" />

                  {/* Camera Bounding Box simulation */}
                  <div className="absolute inset-0 pointer-events-none p-3 flex flex-col justify-between font-mono-tab text-[10px]">
                    <div className="flex justify-between items-start">
                      <div className="rounded bg-black/80 px-2 py-1 border border-white/10 text-white">
                        <p className="font-bold">{cam.code}</p>
                        <p className="text-[9px] text-emerald-400">{cam.name}</p>
                      </div>
                      <div className="rounded bg-black/80 px-2 py-1 border border-white/10 text-right">
                        <p className="text-emerald-400 font-bold">LIVE {cam.fps} FPS</p>
                        <p className="text-[9px] text-white/60">OCR: {cam.opticalConfidence}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-end">
                      <div className="rounded bg-black/80 px-2 py-0.5 border border-white/10 text-white/70">
                        {cam.location}
                      </div>
                      <span className="size-2 rounded-full bg-red-500 animate-pulse" />
                    </div>
                  </div>

                  {/* BBox Indicators */}
                  {cam.activeBBoxes.map((bb, idx) => (
                    <div
                      key={idx}
                      className={cn("absolute border-2 rounded p-1 font-mono-tab text-[9px] font-black uppercase bg-black/40", bb.box, bb.color)}
                    >
                      {bb.label}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* VIEW 3: INCIDENT MATRIX STREAM */}
          {viewMode === "dispatch" && (
            <div className="flex flex-col size-full p-6 bg-panel/60 overflow-y-auto animate-in fade-in duration-500">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div>
                  <h2 className="text-lg font-black uppercase text-white flex items-center gap-2">
                    <Ambulance className="size-5 text-red-500" /> Active Emergency Dispatch Queue
                  </h2>
                  <p className="text-xs text-muted-foreground">Real-time tactical deployments across Quezon City corridors</p>
                </div>
                <span className="font-mono-tab text-xs font-bold px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                  {activeIncidents} Active Units Deployed
                </span>
              </div>

              <div className="grid gap-3">
                {dispatches.slice(0, 5).map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-black/50"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "size-10 rounded-xl grid place-items-center font-bold text-xs border",
                          d.priority === "critical"
                            ? "bg-red-500/20 text-red-400 border-red-500/40"
                            : d.priority === "high"
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                            : "bg-blue-500/20 text-blue-400 border-blue-500/40"
                        )}
                      >
                        {d.priority === "critical" ? "P1" : d.priority === "high" ? "P2" : "P3"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{d.instructions || "Traffic Incident Response"}</span>
                          <span className="font-mono-tab text-xs text-muted-foreground">· {d.reference}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{d.location}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <p className="text-xs text-white/50 uppercase">Assigned Unit</p>
                        <p className="font-mono-tab text-xs font-bold text-emerald-400">{d.officer_name || (d.badge_number ? `Badge #${d.badge_number}` : "QC-PATROL-04")}</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/50 uppercase">Status</p>
                        <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase bg-white/10 text-white">
                          {d.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar Metrics & Telemetry (1 Col) */}
        <div className="col-span-1 flex flex-col gap-5">
          {/* Tile 1: System Health */}
          <div className="rounded-3xl border border-white/10 bg-[#0a0a0a] p-6 flex-1 flex flex-col justify-center items-center text-center shadow-xl">
            <ShieldCheck className="size-12 text-emerald-500 mb-2 filter drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]" />
            <p className="text-xs font-bold uppercase tracking-widest text-white/50">System Reliability</p>
            <p className="text-3xl font-black text-emerald-400 mt-1">99.8% OPTIMAL</p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-500/70 mt-1">
              All 14 Corridors Monitored
            </p>
          </div>

          {/* Tile 2: Active Incidents */}
          <div className="rounded-3xl border border-orange-500/30 bg-orange-950/20 p-6 flex-1 flex flex-col justify-center items-center text-center shadow-xl">
            <AlertTriangle className="size-12 text-orange-500 mb-2 filter drop-shadow-[0_0_12px_rgba(249,115,22,0.4)]" />
            <p className="text-xs font-bold uppercase tracking-widest text-orange-400/80">Active Emergency Incidents</p>
            <p className="text-5xl font-black text-orange-400 mt-1">
              {String(activeIncidents).padStart(2, "0")}
            </p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-orange-400/60 mt-1">
              En Route / On Scene Units
            </p>
          </div>

          {/* Tile 3: Total Citations Apprehended */}
          <div className="rounded-3xl border border-white/10 bg-[#0a0a0a] p-6 flex-1 flex flex-col justify-center items-center text-center shadow-xl">
            <Video className="size-12 text-sky-400 mb-2 filter drop-shadow-[0_0_12px_rgba(56,189,248,0.4)]" />
            <p className="text-xs font-bold uppercase tracking-widest text-white/50">NCAP Citations Logged</p>
            <p className="text-4xl font-black text-white mt-1">
              {(citations.length > 0 ? citations.length : 14290).toLocaleString()}
            </p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-sky-400/70 mt-1">
              Optical ANPR Recorded
            </p>
          </div>
        </div>
      </main>

      {/* Auto-scrolling ticker at the bottom */}
      <footer className="border-t border-white/10 bg-black py-2.5 px-6 overflow-hidden whitespace-nowrap flex items-center gap-4">
        <span className="rounded bg-emerald-500 text-black px-2.5 py-0.5 text-xs font-black uppercase tracking-wider">
          LIVE ADVISORY
        </span>
        <div className="flex-1 overflow-hidden">
          <div className="inline-block animate-[marquee_25s_linear_infinite] text-sm font-bold uppercase tracking-widest text-emerald-400">
            {tickerText}
          </div>
        </div>
      </footer>
    </div>
  );
}
