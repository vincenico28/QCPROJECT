import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useHotlineCalls, useDispatchHotlineCall, type HotlineCall, type EmergencyLevel } from "@/lib/data/hotline";
import {
  Loader2,
  PhoneCall,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  PhoneForwarded,
  Clock,
  MapPin,
  Radio,
  User,
  Volume2,
  VolumeX,
  PhoneIncoming,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Play,
  Pause,
  Camera,
  Activity,
  Navigation,
  Headphones,
  Flame,
  AlertOctagon,
  LifeBuoy,
  Car,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DispatchDialog } from "@/components/dispatch/dispatch-dialog";
import { soundEffects } from "@/lib/sound-effects";

export const Route = createFileRoute("/dispatch-hotline")({
  head: () => ({
    meta: [
      { title: "Emergency Dispatch Hotline (911/122) · Culiat Traffic Ops" },
      {
        name: "description",
        content:
          "Live emergency distress call intake, rapid patrol unit routing, and citizen incident dispatch for Barangay Culiat, Quezon City.",
      },
    ],
  }),
  component: DispatchHotlinePage,
});

type TriageFilter = "ALL" | "CRITICAL" | "SEVERE" | "MODERATE";

export function DispatchHotlinePage() {
  const { data: calls = [], isLoading } = useHotlineCalls();
  const dispatchCall = useDispatchHotlineCall();

  // Local state for dynamic simulation
  const [activeCallList, setActiveCallList] = useState<HotlineCall[]>([]);
  const [resolvedCallList, setResolvedCallList] = useState<HotlineCall[]>([]);
  const [playingCallId, setPlayingCallId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const [triageFilter, setTriageFilter] = useState<TriageFilter>("ALL");
  const [soundMuted, setSoundMuted] = useState(false);
  const [selectedCallForModal, setSelectedCallForModal] = useState<HotlineCall | null>(null);

  // Sync calls from query
  useEffect(() => {
    if (calls.length > 0) {
      setActiveCallList(calls.filter((c) => c.status === "Active"));
      setResolvedCallList(calls.filter((c) => c.status === "Resolved"));
    }
  }, [calls]);

  // Simulated audio playback progression
  useEffect(() => {
    if (!playingCallId) return;
    const interval = setInterval(() => {
      setAudioProgress((prev) => {
        if (prev >= 100) {
          setPlayingCallId(null);
          return 0;
        }
        return prev + 6;
      });
    }, 250);
    return () => clearInterval(interval);
  }, [playingCallId]);

  const handleToggleAudio = (callId: string) => {
    if (playingCallId === callId) {
      setPlayingCallId(null);
      setAudioProgress(0);
    } else {
      soundEffects.playRadioChirp();
      setPlayingCallId(callId);
      setAudioProgress(0);
      toast.info("Streaming Live VoIP Caller Audio", {
        description: "24-bit encrypted voice telemetry stream connected to operator console.",
      });
    }
  };

  const handleDispatch = (call: HotlineCall) => {
    soundEffects.playDispatchTone();
    dispatchCall.mutate(call, {
      onSuccess: () => {
        toast.success(`Unit Dispatched for Call #${call.id}!`, {
          description: `Rapid response unit routed to ${call.location}. SLA Target: < 4 mins.`,
        });
        // Move call to resolved list locally for immediate feedback
        setActiveCallList((prev) => prev.filter((c) => c.id !== call.id));
        setResolvedCallList((prev) => [
          { ...call, status: "Resolved", timeReceived: new Date().toISOString() },
          ...prev,
        ]);
        if (playingCallId === call.id) {
          setPlayingCallId(null);
        }
      },
    });
  };

  const handleSimulateIncomingCall = () => {
    soundEffects.playEmergencyAlert();

    const presets = [
      {
        location: "Commonwealth Ave cor. Litex Market",
        issue: "Pedestrian knocked down on counterflow lane. Motorcycle fled northbound. Bystanders requesting immediate medic and intercept!",
        caller: "Kagawad Danilo Ramos",
        phoneNumber: "0919-441-2099",
        level: "Critical" as EmergencyLevel,
        triageCode: "Code 3 Casualty" as HotlineCall["triageCode"],
        audioDuration: "00:48",
        nearestCamera: { id: "CAM-055", name: "Litex Market North Pedestrian Bridge" },
        gpsCoords: [14.6854, 121.0821] as [number, number],
      },
      {
        location: "Mindanao Ave cor. Tandang Sora",
        issue: "Oil spill from blown diesel engine blocking 2 lanes. Multiple tricycles skidding.",
        caller: "Sgt. Mark Bautista",
        phoneNumber: "0928-112-9844",
        level: "Severe" as EmergencyLevel,
        triageCode: "Code 1 Stall" as HotlineCall["triageCode"],
        audioDuration: "00:32",
        nearestCamera: { id: "CAM-033", name: "Mindanao Tandang Sora Flyover Approach" },
        gpsCoords: [14.6712, 121.0398] as [number, number],
      },
    ];

    const pick = presets[Math.floor(Math.random() * presets.length)];
    const newCall: HotlineCall = {
      id: `CALL-${Math.floor(9030 + Math.random() * 60)}`,
      caller: pick.caller,
      phoneNumber: pick.phoneNumber,
      location: pick.location,
      issue: pick.issue,
      level: pick.level,
      timeReceived: new Date().toISOString(),
      status: "Active",
      triageCode: pick.triageCode,
      audioDuration: pick.audioDuration,
      audioWaveformData: [40, 65, 90, 100, 85, 60, 45, 80, 95, 70, 50, 85, 75, 40],
      nearestCamera: pick.nearestCamera,
      gpsCoords: pick.gpsCoords,
      holdTimeSec: 12,
    };

    setActiveCallList((prev) => [newCall, ...prev]);
    toast.error(`NEW 911 DISTRESS CALL: ${newCall.location}`, {
      description: `[${newCall.triageCode}] ${newCall.caller}: "${newCall.issue.slice(0, 70)}..."`,
      duration: 6000,
    });
  };

  const filteredActiveCalls = activeCallList.filter((call) => {
    if (triageFilter === "CRITICAL") return call.level === "Critical";
    if (triageFilter === "SEVERE") return call.level === "Severe";
    if (triageFilter === "MODERATE") return call.level === "Moderate" || call.level === "Low";
    return true;
  });

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-danger/20 px-2 py-0.5 font-mono-tab text-[10px] font-bold text-danger border border-danger/30">
              QC 122 / 911 INTAKE
            </span>
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-danger"></span>
            </span>
            <span className="text-xs text-subtle">· Live Citizen Distress VoIP Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight mt-1 flex items-center gap-2.5">
            <PhoneCall className="size-6 text-danger" />
            Emergency Dispatch Hotline
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Intake citizen 911 distress calls, triage collision severity, stream live caller audio, and dispatch rapid patrol intercept.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={() => {
              const enabled = soundEffects.toggleSound();
              setSoundMuted(!enabled);
              toast.info(enabled ? "Operational radio & dispatch tones enabled" : "Operational tones muted");
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-panel-elevated transition-colors"
            title={soundMuted ? "Unmute Dispatch Tones" : "Mute Dispatch Tones"}
          >
            {soundMuted ? <VolumeX className="size-3.5 text-danger" /> : <Volume2 className="size-3.5 text-emerald-400" />}
            <span className="hidden sm:inline">{soundMuted ? "Muted" : "Audio On"}</span>
          </button>

          {/* Test 911 Drill Simulation */}
          <button
            onClick={handleSimulateIncomingCall}
            className="inline-flex items-center gap-1.5 rounded-xl border border-danger/40 bg-danger/10 px-3.5 py-2 text-xs font-bold text-danger hover:bg-danger/20 transition-all shadow-sm active:scale-95"
          >
            <Sparkles className="size-3.5" />
            Simulate 911 Call
          </button>

          <Link
            to="/dispatch"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-panel-elevated transition-colors"
          >
            <Radio className="size-3.5 text-primary" />
            Patrol Queue
          </Link>
        </div>
      </div>

      {/* Operational Status Banner */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="panel rounded-2xl border border-danger/40 bg-gradient-to-br from-danger/10 via-panel to-panel p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="font-mono-tab text-[10px] font-bold uppercase tracking-wider text-danger">
              Active Distress Lines
            </span>
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75"></span>
              <span className="relative inline-flex size-2.5 rounded-full bg-danger"></span>
            </span>
          </div>
          <p className="mt-2 font-mono-tab text-3xl font-black text-danger">
            {activeCallList.length}
          </p>
          <span className="text-[10px] text-muted-foreground mt-0.5 block font-mono-tab">
            Average response time: 2.8 mins
          </span>
        </div>

        <div className="panel rounded-2xl border border-warning/30 bg-panel p-4 shadow-lg">
          <span className="font-mono-tab text-[10px] font-bold uppercase tracking-wider text-warning">
            Code Red Collisions
          </span>
          <p className="mt-2 font-mono-tab text-3xl font-black text-warning">
            {activeCallList.filter((c) => c.level === "Critical").length}
          </p>
          <span className="text-[10px] text-muted-foreground mt-0.5 block font-mono-tab">
            Multi-agency medical & tow required
          </span>
        </div>

        <div className="panel rounded-2xl border border-primary/30 bg-panel p-4 shadow-lg">
          <span className="font-mono-tab text-[10px] font-bold uppercase tracking-wider text-primary">
            VoIP Stream Uptime
          </span>
          <p className="mt-2 font-mono-tab text-3xl font-black text-primary">
            99.98%
          </p>
          <span className="text-[10px] text-muted-foreground mt-0.5 block font-mono-tab">
            Encrypted WebRTC Audio Channel
          </span>
        </div>

        <div className="panel rounded-2xl border border-emerald-500/30 bg-panel p-4 shadow-lg">
          <span className="font-mono-tab text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            Resolved Incidents
          </span>
          <p className="mt-2 font-mono-tab text-3xl font-black text-emerald-400">
            {resolvedCallList.length}
          </p>
          <span className="text-[10px] text-muted-foreground mt-0.5 block font-mono-tab">
            Today's cleared emergency events
          </span>
        </div>
      </div>

      {/* Main Grid: Active Calls Intake + History */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Active Incoming Calls */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <PhoneIncoming className="size-4 text-danger animate-bounce" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Distress Calls in Queue ({filteredActiveCalls.length})
              </h2>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 rounded-xl border border-border bg-background p-1 font-mono-tab text-[10px]">
              {(["ALL", "CRITICAL", "SEVERE", "MODERATE"] as TriageFilter[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTriageFilter(filter)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 font-bold uppercase transition-colors",
                    triageFilter === filter
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="grid h-64 place-items-center">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : filteredActiveCalls.length === 0 ? (
            <div className="panel flex flex-col items-center justify-center rounded-3xl border border-border p-12 text-center text-sm text-subtle shadow-xl">
              <CheckCircle2 className="size-10 text-emerald-400 mb-3 opacity-90" />
              <p className="font-bold text-foreground text-base">All 911 Emergency Lines Clear</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                No active citizen distress calls currently queued in this category. Use "Simulate 911 Call" to test incident intake.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredActiveCalls.map((call) => {
                const isCritical = call.level === "Critical";
                const isPlaying = playingCallId === call.id;

                return (
                  <div
                    key={call.id}
                    className={cn(
                      "panel rounded-3xl border p-5 sm:p-6 shadow-xl relative overflow-hidden transition-all",
                      isCritical
                        ? "border-danger/50 bg-gradient-to-r from-danger/10 via-panel to-panel shadow-danger/10"
                        : "border-warning/40 bg-gradient-to-r from-warning/10 via-panel to-panel shadow-warning/5"
                    )}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div
                          className={cn(
                            "grid size-12 shrink-0 place-items-center rounded-2xl shadow-lg border",
                            isCritical
                              ? "bg-danger/20 text-danger border-danger/40 shadow-danger/20"
                              : "bg-warning/20 text-warning border-warning/40 shadow-warning/20"
                          )}
                        >
                          {isCritical ? (
                            <ShieldAlert className="size-6" />
                          ) : (
                            <AlertTriangle className="size-6" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-foreground text-base sm:text-lg">
                              {call.caller}
                            </h3>
                            <span className="font-mono-tab text-xs text-muted-foreground bg-panel-elevated px-2.5 py-0.5 rounded-full border border-border">
                              {call.phoneNumber}
                            </span>
                            <span
                              className={cn(
                                "font-mono-tab text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border",
                                isCritical
                                  ? "bg-danger/20 text-danger border-danger/40 animate-pulse"
                                  : "bg-warning/20 text-warning border-warning/40"
                              )}
                            >
                              {call.level} Priority
                            </span>
                            {call.triageCode && (
                              <span className="font-mono-tab text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                                {call.triageCode}
                              </span>
                            )}
                          </div>

                          {/* Location & GPS Info */}
                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-foreground font-medium">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="size-3.5 text-primary shrink-0" />
                              <span className="font-semibold">{call.location}</span>
                            </div>
                            {call.gpsCoords && (
                              <span className="font-mono-tab text-[10px] text-muted-foreground bg-panel-elevated px-2 py-0.5 rounded border border-border">
                                GPS: {call.gpsCoords[0].toFixed(4)}° N, {call.gpsCoords[1].toFixed(4)}° E
                              </span>
                            )}
                            {call.nearestCamera && (
                              <span className="font-mono-tab text-[10px] text-primary/80 flex items-center gap-1">
                                <Camera className="size-3 text-primary" /> {call.nearestCamera.id}
                              </span>
                            )}
                          </div>

                          {/* Citizen Statement */}
                          <div className="mt-3 rounded-2xl border border-border bg-panel-elevated/70 p-3.5 text-xs text-foreground/90 leading-relaxed border-l-4 border-l-primary">
                            <span className="text-[9px] font-mono-tab text-subtle uppercase block mb-1">
                              Citizen Voice Intake Transcript:
                            </span>
                            "{call.issue}"
                          </div>

                          {/* Interactive VoIP Audio Stream Player */}
                          <div className="mt-3 rounded-2xl border border-border/80 bg-background/80 p-3 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() => handleToggleAudio(call.id)}
                                className={cn(
                                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all",
                                  isPlaying
                                    ? "bg-danger text-white shadow-md shadow-danger/25"
                                    : "bg-panel-elevated border border-border text-foreground hover:bg-panel hover:border-primary/40"
                                )}
                              >
                                {isPlaying ? (
                                  <>
                                    <Pause className="size-3" /> Stop Audio
                                  </>
                                ) : (
                                  <>
                                    <Play className="size-3 text-emerald-400" /> Listen to 911 Audio ({call.audioDuration || "00:35"})
                                  </>
                                )}
                              </button>

                              <div className="flex items-center gap-2 font-mono-tab text-[10px] text-muted-foreground">
                                <Headphones className="size-3 text-subtle" />
                                <span>{isPlaying ? "VOIP LIVE BUFFER" : "CH-1 CALL RECORDING"}</span>
                              </div>
                            </div>

                            {/* Waveform Visualizer */}
                            <div className="flex items-end gap-1 h-6 px-1">
                              {(call.audioWaveformData || [20, 35, 50, 75, 90, 60, 45, 80, 70, 50, 65, 85, 40, 25]).map(
                                (val, idx) => {
                                  const isActiveBar = isPlaying && idx <= Math.floor((audioProgress / 100) * 14);
                                  return (
                                    <span
                                      key={idx}
                                      className={cn(
                                        "w-full rounded-full transition-all duration-150",
                                        isActiveBar
                                          ? "bg-danger animate-pulse"
                                          : isPlaying
                                          ? "bg-primary/40"
                                          : "bg-muted/40"
                                      )}
                                      style={{ height: `${Math.max(15, isPlaying ? val : val * 0.5)}%` }}
                                    />
                                  );
                                }
                              )}
                            </div>

                            {isPlaying && (
                              <div className="w-full bg-border rounded-full h-1 overflow-hidden">
                                <div
                                  className="bg-danger h-full transition-all duration-200"
                                  style={{ width: `${audioProgress}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Action Column */}
                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 shrink-0 border-t md:border-t-0 border-border pt-3 md:pt-0">
                        <div className="text-left md:text-right">
                          <p className="text-[10px] font-mono-tab uppercase tracking-wider text-subtle">
                            Queue Hold Time
                          </p>
                          <p className="text-sm font-mono-tab font-bold text-danger mt-0.5 flex items-center md:justify-end gap-1">
                            <Clock className="size-3" /> 00:0{Math.floor((call.holdTimeSec || 45) / 60)}:
                            {((call.holdTimeSec || 45) % 60).toString().padStart(2, "0")}
                          </p>
                          <span className="text-[9px] font-mono-tab text-emerald-400 block mt-0.5">
                            Est. ETA: {isCritical ? "2-4 mins" : "4-7 mins"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDispatch(call)}
                            disabled={dispatchCall.isPending}
                            className="inline-flex items-center gap-2 justify-center rounded-xl bg-danger px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-danger/90 shadow-lg shadow-danger/25 active:scale-95 disabled:opacity-50"
                          >
                            {dispatchCall.isPending ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <PhoneForwarded className="size-3.5" />
                            )}
                            Dispatch Intercept
                          </button>

                          <DispatchDialog
                            defaultLocation={call.location}
                            defaultInstructions={`[911 Call #${call.id} - ${call.caller}]: ${call.issue}`}
                            defaultPriority={isCritical ? "critical" : "high"}
                            trigger={
                              <button
                                className="inline-flex items-center gap-1 rounded-xl border border-border bg-panel px-2.5 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-panel-elevated transition-colors"
                                title="Custom Officer Assignment Dialog"
                              >
                                <Radio className="size-3.5 text-primary" />
                              </button>
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recently Resolved Log */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-400" />
              Recently Resolved ({resolvedCallList.length})
            </h2>
            <span className="font-mono-tab text-[10px] text-emerald-400">Archived Dispatch</span>
          </div>

          <div className="flex flex-col gap-3">
            {resolvedCallList.map((call) => (
              <div
                key={call.id}
                className="panel rounded-2xl border border-border bg-panel-elevated/40 p-4 transition-all hover:bg-panel-elevated hover:border-border/80"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-emerald-400" />
                    {call.location}
                  </h4>
                  <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{call.issue}</p>
                <div className="mt-3 flex items-center justify-between font-mono-tab text-[10px] text-subtle pt-2 border-t border-border/50">
                  <span>Caller: {call.caller}</span>
                  <span className="text-emerald-400 font-bold">10-8 Cleared</span>
                  <span>{new Date(call.timeReceived).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
            ))}

            {resolvedCallList.length === 0 && (
              <div className="p-8 text-center text-xs text-subtle">
                No resolved incidents logged yet today.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
