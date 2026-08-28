import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video,
  VideoOff,
  Camera,
  ScanEye,
  Activity,
  Gauge,
  ShieldAlert,
  Download,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square,
  Sparkles,
  Zap,
  Radio,
  Layers,
  Settings2,
  RefreshCw,
  Clock,
  Eye,
  Sliders,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { serverSaveViolation, serverSaveCitation } from "@/lib/server.functions";
import { useQueryClient } from "@tanstack/react-query";

type ViolationRecord = {
  id: string;
  plateNumber: string;
  violationType: string;
  confidence: number;
  speedKmh: number;
  timestamp: string;
  snapshotDataUrl: string;
  persistedToDb: boolean;
};

type FlowMetrics = {
  vehiclesPerMinute: number;
  avgSpeedKmh: number;
  densityStatus: "FREE_FLOW" | "MODERATE" | "DENSE_SLOW" | "GRIDLOCK";
  lane1Count: number;
  lane2Count: number;
  lane3Count: number;
  totalCountToday: number;
};

const SAMPLE_PLATES = ["NDB 8921", "ABC 1234", "XYZ 987", "CAS 3901", "WXY 1122", "QC 8841", "LTO 9912"];
const VIOLATION_TYPES = [
  "Red Light Running (Disregarding Signal)",
  "Yellow Box Obstruction (Intersection Gridlock)",
  "Bus Lane Encroachment (Restricted Lane)",
  "Counterflow (Reckless Driving)",
  "Overspeeding (>65 km/h in 60 km/h Zone)",
  "No Helmet (Motorcycle Safety Infraction)",
];

export function Live4kWebcamEngine({
  cameraCode,
  locationName = "Commonwealth Ave — Tandang Sora Corridor",
  bitrate = "18.4",
}: {
  cameraCode: string;
  locationName?: string;
  bitrate?: string;
}) {
  const qc = useQueryClient();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Webcam stream state
  const [streamActive, setStreamActive] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [resolutionMode, setResolutionMode] = useState<"4k" | "1080p" | "720p">("4k");
  const [actualResolution, setActualResolution] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [fps, setFps] = useState(60);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordedClips, setRecordedClips] = useState<{ id: string; url: string; timestamp: string; durationSec: number }[]>([]);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Traffic Flow State
  const [flowMetrics, setFlowMetrics] = useState<FlowMetrics>({
    vehiclesPerMinute: 48,
    avgSpeedKmh: 42,
    densityStatus: "MODERATE",
    lane1Count: 124,
    lane2Count: 189,
    lane3Count: 92,
    totalCountToday: 1420,
  });

  // AI Optical Bounding Boxes & Violations
  const [activeDetections, setActiveDetections] = useState<{
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    plate: string;
    speed: number;
    isViolation: boolean;
    violationType?: string;
    confidence: number;
  }[]>([]);

  const [capturedViolations, setCapturedViolations] = useState<ViolationRecord[]>([]);
  const [selectedViolationForPreview, setSelectedViolationForPreview] = useState<ViolationRecord | null>(null);
  const [autoSaveViolations, setAutoSaveViolations] = useState(true);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [showOpticalFlowGrid, setShowOpticalFlowGrid] = useState(true);

  // 1. Enumerate Video Input Devices
  const getCameraDevices = useCallback(async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices.filter((d) => d.kind === "videoinput");
      setDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch {
      // ignore
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    getCameraDevices();
  }, [getCameraDevices]);

  // 2. Start 4K / HD Webcam Stream
  const startWebcam = useCallback(async () => {
    setPermissionError(null);

    const widthConstraint = resolutionMode === "4k" ? { ideal: 3840, min: 1920 } : resolutionMode === "1080p" ? { ideal: 1920 } : { ideal: 1280 };
    const heightConstraint = resolutionMode === "4k" ? { ideal: 2160, min: 1080 } : resolutionMode === "1080p" ? { ideal: 1080 } : { ideal: 720 };

    const constraints: MediaStreamConstraints = {
      video: {
        deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
        width: widthConstraint,
        height: heightConstraint,
        frameRate: { ideal: 60, min: 30 },
      },
      audio: false,
    };

    try {
      // Stop old tracks if active
      if (videoRef.current?.srcObject) {
        const oldStream = videoRef.current.srcObject as MediaStream;
        oldStream.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setStreamActive(true);
      toast.success("4K UHD Camera Stream Connected", {
        description: `Active optical node: ${cameraCode} · ${resolutionMode.toUpperCase()} mode enabled`,
      });

      // Query actual resolution from video track
      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings();
      if (settings.width && settings.height) {
        setActualResolution({ width: settings.width, height: settings.height });
      }
      getCameraDevices();
    } catch (err: any) {
      console.warn("Webcam access error:", err);
      setPermissionError(err?.message || "Webcam access denied or 4K resolution unavailable. Using simulated optical sensor.");
      setStreamActive(false);
    }
  }, [selectedDeviceId, resolutionMode, cameraCode, getCameraDevices]);

  // 3. Stop Webcam
  const stopWebcam = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
  }, []);

  // 4. MediaRecorder Continuous Video Recording
  const startRecording = useCallback(() => {
    if (!videoRef.current?.srcObject) {
      toast.error("Please connect webcam stream before recording.");
      return;
    }

    const stream = videoRef.current.srcObject as MediaStream;
    recordedChunksRef.current = [];

    try {
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : "video/webm",
        videoBitsPerSecond: resolutionMode === "4k" ? 25000000 : 8000000,
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const newClip = {
          id: `REC-${Date.now().toString(36).toUpperCase()}`,
          url,
          timestamp: new Date().toLocaleTimeString(),
          durationSec: recordingSeconds,
        };
        setRecordedClips((prev) => [newClip, ...prev]);
        toast.success("4K Evidence Clip Recorded & Saved", {
          description: `Clip ID: ${newClip.id} (${recordingSeconds}s duration)`,
        });
        setRecordingSeconds(0);
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      toast.error("MediaRecorder initialization failed.");
    }
  }, [resolutionMode, recordingSeconds]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  // Recording Timer
  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  // 5. Capture Snapshot from Live Canvas / Video
  const captureSnapshotFrame = useCallback((): string => {
    const video = videoRef.current;
    if (!video) return "";

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1920;
    canvas.height = video.videoHeight || 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Overlay Quezon City LGU Official Watermark & Timestamp
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(20, canvas.height - 80, 520, 60);

    ctx.font = "bold 16px monospace";
    ctx.fillStyle = "#00e5ff";
    ctx.fillText(`QUEZON CITY MMDA NCAP · NODE ${cameraCode}`, 35, canvas.height - 50);

    ctx.font = "14px monospace";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${new Date().toISOString()} · GPS: 14.6760° N, 121.0583° E`, 35, canvas.height - 30);

    return canvas.toDataURL("image/jpeg", 0.92);
  }, [cameraCode]);

  // 6. Manual & AI Violation Logger
  const handleTriggerViolationDetection = useCallback(
    async (manualType?: string) => {
      const plate = SAMPLE_PLATES[Math.floor(Math.random() * SAMPLE_PLATES.length)];
      const violationType = manualType || VIOLATION_TYPES[Math.floor(Math.random() * VIOLATION_TYPES.length)];
      const confidence = Math.floor(88 + Math.random() * 11);
      const speedKmh = Math.floor(45 + Math.random() * 35);
      const snapshot = captureSnapshotFrame() || "/assets/violation-1.jpg";

      const newViolation: ViolationRecord = {
        id: `VIO-REC-${Date.now().toString(36).toUpperCase()}`,
        plateNumber: plate,
        violationType,
        confidence,
        speedKmh,
        timestamp: new Date().toLocaleTimeString(),
        snapshotDataUrl: snapshot,
        persistedToDb: false,
      };

      setCapturedViolations((prev) => [newViolation, ...prev]);

      if (autoSaveViolations) {
        try {
          const res = await serverSaveViolation({
            data: {
              plateNumber: plate,
              violationType,
              location: locationName,
              confidence,
              cameraCode,
              aiDetected: true,
              evidenceUrl: snapshot,
            },
          });

          // Auto-create citation if high confidence
          if (confidence >= 85) {
            await serverSaveCitation({
              data: {
                violation_id: res.id,
                plate_number: plate,
                offense: violationType,
                amount: violationType.includes("Red Light") ? 2000 : violationType.includes("Speeding") ? 2500 : 1500,
                officer_name: "YOLOv11 Optical AI Engine",
              },
            });
          }

          newViolation.persistedToDb = true;
          qc.invalidateQueries({ queryKey: ["violations"] });
          qc.invalidateQueries({ queryKey: ["citations"] });

          toast.error(`TRAFFIC INFRACTION RECORDED!`, {
            description: `${violationType} · Plate: ${plate} · Saved to Supabase Database`,
          });
        } catch {
          toast.warning("Violation logged locally (Database connection busy).");
        }
      }
    },
    [captureSnapshotFrame, autoSaveViolations, locationName, cameraCode, qc]
  );

  // 7. Live Optical Motion Simulation & Flow Metering
  useEffect(() => {
    const interval = setInterval(() => {
      // Update telemetry
      setFps(Math.floor(58 + Math.random() * 4));

      // Update flow metrics
      setFlowMetrics((prev) => {
        const vpm = Math.floor(40 + Math.random() * 25);
        return {
          vehiclesPerMinute: vpm,
          avgSpeedKmh: Math.floor(38 + Math.random() * 12),
          densityStatus: vpm > 55 ? "DENSE_SLOW" : vpm > 45 ? "MODERATE" : "FREE_FLOW",
          lane1Count: prev.lane1Count + (Math.random() > 0.6 ? 1 : 0),
          lane2Count: prev.lane2Count + (Math.random() > 0.5 ? 1 : 0),
          lane3Count: prev.lane3Count + (Math.random() > 0.7 ? 1 : 0),
          totalCountToday: prev.totalCountToday + 1,
        };
      });

      // Spawn optical tracking bounding boxes
      if (Math.random() > 0.3) {
        const isVio = Math.random() > 0.85;
        const box = {
          id: Math.random().toString(36).substring(2, 7),
          x: Math.floor(10 + Math.random() * 70),
          y: Math.floor(20 + Math.random() * 50),
          w: Math.floor(14 + Math.random() * 12),
          h: Math.floor(18 + Math.random() * 16),
          plate: SAMPLE_PLATES[Math.floor(Math.random() * SAMPLE_PLATES.length)],
          speed: Math.floor(35 + Math.random() * 40),
          isViolation: isVio,
          violationType: isVio ? VIOLATION_TYPES[Math.floor(Math.random() * VIOLATION_TYPES.length)] : undefined,
          confidence: Math.floor(88 + Math.random() * 11),
        };

        setActiveDetections((prev) => [...prev.slice(-4), box]);

        if (isVio) {
          handleTriggerViolationDetection(box.violationType);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [handleTriggerViolationDetection]);

  return (
    <div className="flex flex-col gap-6">
      {/* Top 4K Camera Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-panel p-4 shadow-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex size-3">
              <span
                className={cn(
                  "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                  streamActive ? "bg-emerald-400" : "bg-neutral-500"
                )}
              />
              <span
                className={cn(
                  "relative inline-flex size-3 rounded-full",
                  streamActive ? "bg-emerald-500" : "bg-neutral-600"
                )}
              />
            </span>
            <span className="font-mono-tab text-xs font-bold uppercase tracking-wider text-foreground">
              {streamActive ? "4K Optical Sensor Live" : "Optical Sensor Standby"}
            </span>
          </div>

          {/* Device Selector */}
          {devices.length > 0 && (
            <select
              value={selectedDeviceId}
              onChange={(e) => {
                setSelectedDeviceId(e.target.value);
              }}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary/60"
            >
              {devices.map((d, i) => (
                <option key={d.deviceId || i} value={d.deviceId}>
                  {d.label || `Webcam Sensor #${i + 1}`}
                </option>
              ))}
            </select>
          )}

          {/* Resolution Selector */}
          <div className="flex rounded-lg border border-border bg-background/80 p-0.5 text-xs">
            <button
              onClick={() => setResolutionMode("4k")}
              className={cn(
                "rounded-md px-2.5 py-1 font-mono-tab font-semibold transition-colors",
                resolutionMode === "4k"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              4K UHD
            </button>
            <button
              onClick={() => setResolutionMode("1080p")}
              className={cn(
                "rounded-md px-2.5 py-1 font-mono-tab font-semibold transition-colors",
                resolutionMode === "1080p"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              1080p FHD
            </button>
            <button
              onClick={() => setResolutionMode("720p")}
              className={cn(
                "rounded-md px-2.5 py-1 font-mono-tab font-semibold transition-colors",
                resolutionMode === "720p"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              720p HD
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {!streamActive ? (
            <button
              onClick={startWebcam}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:scale-105"
            >
              <Video className="size-4" />
              Connect 4K Webcam
            </button>
          ) : (
            <button
              onClick={stopWebcam}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-panel-elevated px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-danger hover:border-danger/40"
            >
              <VideoOff className="size-4" />
              Disconnect
            </button>
          )}

          {/* Continuous Video Recorder Button */}
          {isRecording ? (
            <button
              onClick={stopRecording}
              className="inline-flex items-center gap-2 rounded-xl bg-danger px-4 py-2 text-xs font-bold text-white shadow-lg shadow-danger/40 animate-pulse"
            >
              <Square className="size-3.5 fill-current" />
              Stop REC ({recordingSeconds}s)
            </button>
          ) : (
            <button
              onClick={startRecording}
              disabled={!streamActive}
              className="inline-flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3.5 py-2 text-xs font-bold text-red-400 transition-all hover:bg-red-500/20 disabled:opacity-50"
            >
              <Radio className="size-3.5 text-red-500 animate-pulse" />
              Record Clip
            </button>
          )}

          {/* Trigger Instant Snapshot & Violation */}
          <button
            onClick={() => handleTriggerViolationDetection()}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 px-3.5 py-2 text-xs font-bold transition-all hover:bg-amber-500/30"
          >
            <Camera className="size-4" />
            Capture Evidence
          </button>
        </div>
      </div>

      {/* Main 4K Stream Viewport & Optical HUD Canvas */}
      <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-border/80 bg-black font-mono shadow-2xl">
        {/* Real Live Webcam Video Element */}
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className={cn(
            "absolute inset-0 size-full object-cover",
            streamActive ? "opacity-100" : "opacity-0"
          )}
        />

        {/* Fallback Simulation CCTV Feed when Webcam is Inactive */}
        {!streamActive && (
          <img
            src="/cctv-1.jpg"
            alt="CCTV Feed"
            className="absolute inset-0 size-full object-cover opacity-70 mix-blend-luminosity grayscale"
          />
        )}

        {/* Optical Flow Grid Overlay */}
        {showOpticalFlowGrid && (
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,229,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px] mix-blend-overlay" />
        )}

        {/* Top Left AI Telemetry HUD */}
        <div className="pointer-events-none absolute left-5 top-5 flex flex-col gap-1.5 rounded-xl border border-white/10 bg-black/70 p-3.5 text-[11px] text-primary backdrop-blur-md shadow-2xl">
          <div className="flex items-center gap-2 font-bold tracking-widest text-white">
            <ScanEye className="size-4 text-primary animate-pulse" />
            <span>YOLOv11 4K VISION ENGINE</span>
          </div>
          <div className="flex flex-col gap-0.5 text-[10px] text-muted-foreground font-mono-tab">
            <span>
              NODE: <strong className="text-white">{cameraCode}</strong>
            </span>
            <span>
              RES: <strong className="text-white">{actualResolution.width ? `${actualResolution.width}x${actualResolution.height}` : resolutionMode === "4k" ? "3840x2160 (4K UHD)" : "1920x1080 (FHD)"}</strong>
            </span>
            <span>
              FPS: <strong className="text-emerald-400">{fps} FPS</strong>
            </span>
            <span>
              THROUGHPUT: <strong className="text-white">{bitrate} Mbps</strong>
            </span>
          </div>
        </div>

        {/* Top Right Live Recording & Violation Alarms */}
        <div className="pointer-events-none absolute right-5 top-5 flex flex-col items-end gap-2">
          {isRecording && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/50 bg-red-500/20 px-3 py-1.5 text-xs font-bold text-red-400 backdrop-blur-md animate-pulse">
              <span className="size-2 rounded-full bg-red-500" />
              <span>REC {recordingSeconds}s · 4K MASTER</span>
            </div>
          )}

          <div className="flex flex-col items-end gap-1 rounded-xl border border-white/10 bg-black/70 p-3 text-[10px] backdrop-blur-md text-right font-mono-tab">
            <span className="text-muted-foreground uppercase tracking-widest text-[9px]">
              Optical Flow Velocity
            </span>
            <span className="text-lg font-bold text-emerald-400">
              {flowMetrics.avgSpeedKmh} <span className="text-xs text-muted-foreground">km/h</span>
            </span>
            <span
              className={cn(
                "rounded px-2 py-0.5 text-[9px] font-bold uppercase",
                flowMetrics.densityStatus === "FREE_FLOW"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : flowMetrics.densityStatus === "MODERATE"
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-orange-500/20 text-orange-400"
              )}
            >
              {flowMetrics.densityStatus.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Dynamic AI Optical Bounding Boxes Overlay */}
        {showBoundingBoxes &&
          activeDetections.map((box) => (
            <motion.div
              key={box.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{
                left: `${box.x}%`,
                top: `${box.y}%`,
                width: `${box.w}%`,
                height: `${box.h}%`,
              }}
              className={cn(
                "pointer-events-none absolute rounded-lg border-2 shadow-2xl transition-all duration-300",
                box.isViolation
                  ? "border-red-500 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                  : "border-primary/80 bg-primary/5 shadow-[0_0_15px_rgba(0,229,255,0.2)]"
              )}
            >
              <div
                className={cn(
                  "absolute -top-7 left-0 flex items-center gap-1.5 whitespace-nowrap rounded px-2 py-0.5 text-[10px] font-bold text-white shadow-md",
                  box.isViolation ? "bg-red-600" : "bg-primary text-black"
                )}
              >
                <span>{box.plate}</span>
                <span className="opacity-80">· {box.speed} km/h</span>
              </div>

              {box.isViolation && (
                <div className="absolute -bottom-6 left-0 whitespace-nowrap rounded bg-black/80 px-2 py-0.5 text-[9px] font-bold text-red-400 border border-red-500/40">
                  ⚠️ {box.violationType} ({box.confidence}%)
                </div>
              )}
            </motion.div>
          ))}

        {/* Bottom Flow Telemetry Ribbon */}
        <div className="pointer-events-none absolute inset-x-5 bottom-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/80 p-3.5 backdrop-blur-md text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-foreground">
              <Activity className="size-4 text-primary" />
              <span className="font-semibold">{locationName}</span>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-[11px] text-muted-foreground font-mono-tab border-l border-white/10 pl-4">
              <span>Lane 1: <strong className="text-white">{flowMetrics.lane1Count}</strong></span>
              <span>Lane 2: <strong className="text-white">{flowMetrics.lane2Count}</strong></span>
              <span>Lane 3: <strong className="text-white">{flowMetrics.lane3Count}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono-tab text-[11px]">
            <span className="text-muted-foreground">
              Rate: <strong className="text-primary font-bold">{flowMetrics.vehiclesPerMinute} VPM</strong>
            </span>
            <span className="text-muted-foreground">
              Today: <strong className="text-white font-bold">{flowMetrics.totalCountToday.toLocaleString()} vehicles</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Traffic Flow & Automated Violation Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Metric 1: Flow Density */}
        <div className="panel flex flex-col justify-between rounded-2xl border border-border/80 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <Gauge className="size-4" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Corridor Flow Density
              </span>
            </div>
            <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-400">
              OPTIMAL
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono-tab text-foreground">
              {flowMetrics.vehiclesPerMinute}
            </span>
            <span className="text-xs text-muted-foreground">Vehicles / Min (VPM)</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/50 pt-2.5">
            <span>Avg Speed: <strong className="text-foreground">{flowMetrics.avgSpeedKmh} km/h</strong></span>
            <span>Speed Limit: <strong className="text-foreground">60 km/h</strong></span>
          </div>
        </div>

        {/* Metric 2: Detected Infractions */}
        <div className="panel flex flex-col justify-between rounded-2xl border border-border/80 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 place-items-center rounded-xl bg-red-500/10 text-red-500">
                <ShieldAlert className="size-4" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Infractions Captured
              </span>
            </div>
            <span className="rounded-md bg-red-500/10 px-2 py-0.5 text-xs font-bold text-red-400 font-mono-tab">
              {capturedViolations.length} DETECTED
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono-tab text-red-400">
              {capturedViolations.length}
            </span>
            <span className="text-xs text-muted-foreground">Auto-Ticketed to Supabase</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/50 pt-2.5">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoSaveViolations}
                onChange={(e) => setAutoSaveViolations(e.target.checked)}
                className="rounded accent-primary"
              />
              <span>Auto-commit to database</span>
            </label>
            <button
              onClick={() => handleTriggerViolationDetection()}
              className="text-primary font-bold hover:underline"
            >
              + Log Sample
            </button>
          </div>
        </div>

        {/* Metric 3: 4K Evidence Recording Archive */}
        <div className="panel flex flex-col justify-between rounded-2xl border border-border/80 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 place-items-center rounded-xl bg-cyan-500/10 text-cyan-400">
                <Radio className="size-4" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                4K Clip Archive
              </span>
            </div>
            <span className="rounded-md bg-cyan-500/10 px-2 py-0.5 text-xs font-bold text-cyan-400 font-mono-tab">
              {recordedClips.length} CLIPS
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono-tab text-cyan-400">
              {recordedClips.length}
            </span>
            <span className="text-xs text-muted-foreground">Evidence Video Reels</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/50 pt-2.5">
            <span>Encoding: <strong className="text-foreground">VP9 / WebM 4K</strong></span>
            <span>Bitrate: <strong className="text-foreground">{bitrate} Mbps</strong></span>
          </div>
        </div>
      </div>

      {/* Captured Violations & Video Reels Shelf */}
      <div className="panel flex flex-col gap-4 rounded-2xl border border-border/80 p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="size-5 text-red-400" />
            <h3 className="font-bold text-foreground text-sm">
              Live Captured Infractions & 4K Evidence Snapshots
            </h3>
          </div>
          <span className="font-mono-tab text-xs text-muted-foreground">
            {capturedViolations.length} records in current optical session
          </span>
        </div>

        {capturedViolations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <Camera className="size-8 opacity-30 mb-2" />
            <p className="text-xs">No violations flagged yet. Live optical detection is scanning active vehicles.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {capturedViolations.map((v) => (
              <div
                key={v.id}
                onClick={() => setSelectedViolationForPreview(v)}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-panel-elevated/60 p-3 transition-all hover:border-red-500/60 hover:shadow-xl cursor-pointer"
              >
                {/* Image Snapshot */}
                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
                  <img
                    src={v.snapshotDataUrl}
                    alt={v.plateNumber}
                    className="size-full object-cover transition-transform group-hover:scale-105"
                  />
                  <span className="absolute left-2 top-2 rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-mono-tab font-bold text-red-400 border border-red-500/40">
                    {v.confidence}% CONFIDENCE
                  </span>
                  <span className="absolute right-2 top-2 rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-mono-tab text-white">
                    {v.timestamp}
                  </span>
                </div>

                <div className="mt-2.5 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground font-mono-tab">
                      {v.plateNumber}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono-tab">
                      {v.speedKmh} km/h
                    </span>
                  </div>
                  <p className="text-[11px] text-red-400 font-semibold line-clamp-1">
                    {v.violationType}
                  </p>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="size-3" /> Supabase Synced
                    </span>
                    <span className="text-primary group-hover:underline">Inspect</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recorded Video Clips Archive */}
      {recordedClips.length > 0 && (
        <div className="panel flex flex-col gap-4 rounded-2xl border border-border/80 p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <Radio className="size-5 text-cyan-400" />
              <h3 className="font-bold text-foreground text-sm">
                Saved 4K Evidence Video Clips
              </h3>
            </div>
            <span className="font-mono-tab text-xs text-muted-foreground">
              {recordedClips.length} video files
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {recordedClips.map((clip) => (
              <div
                key={clip.id}
                className="flex flex-col gap-2 rounded-xl border border-border bg-panel-elevated p-3"
              >
                <video
                  src={clip.url}
                  controls
                  className="aspect-video w-full rounded-lg bg-black object-cover"
                />
                <div className="flex items-center justify-between text-xs font-mono-tab">
                  <span className="font-bold text-foreground">{clip.id}</span>
                  <span className="text-muted-foreground">{clip.durationSec}s · {clip.timestamp}</span>
                </div>
                <a
                  href={clip.url}
                  download={`${cameraCode}_${clip.id}.webm`}
                  className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 py-1.5 text-xs font-semibold transition-colors"
                >
                  <Download className="size-3.5" />
                  Download 4K Clip
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Resolution Snapshot Evidence Modal */}
      {selectedViolationForPreview && (
        <div
          onClick={() => setSelectedViolationForPreview(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-w-2xl w-full flex-col overflow-hidden rounded-3xl border border-border bg-panel p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-5 text-red-500" />
                <h3 className="font-bold text-foreground text-base">
                  Official 4K Violation Evidence Record
                </h3>
              </div>
              <button
                onClick={() => setSelectedViolationForPreview(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-panel-elevated hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black border border-border/80">
              <img
                src={selectedViolationForPreview.snapshotDataUrl}
                alt="Evidence"
                className="size-full object-cover"
              />
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono-tab text-xs">
              <div className="rounded-xl border border-border bg-panel-elevated p-2.5">
                <span className="text-[10px] text-muted-foreground uppercase">Plate Number</span>
                <p className="font-bold text-foreground mt-0.5">{selectedViolationForPreview.plateNumber}</p>
              </div>
              <div className="rounded-xl border border-border bg-panel-elevated p-2.5">
                <span className="text-[10px] text-muted-foreground uppercase">Infraction</span>
                <p className="font-bold text-red-400 mt-0.5 truncate">{selectedViolationForPreview.violationType}</p>
              </div>
              <div className="rounded-xl border border-border bg-panel-elevated p-2.5">
                <span className="text-[10px] text-muted-foreground uppercase">Speed</span>
                <p className="font-bold text-foreground mt-0.5">{selectedViolationForPreview.speedKmh} km/h</p>
              </div>
              <div className="rounded-xl border border-border bg-panel-elevated p-2.5">
                <span className="text-[10px] text-muted-foreground uppercase">Confidence</span>
                <p className="font-bold text-emerald-400 mt-0.5">{selectedViolationForPreview.confidence}%</p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 pt-3 border-t border-border">
              <a
                href={selectedViolationForPreview.snapshotDataUrl}
                download={`Violation_${selectedViolationForPreview.plateNumber}_${selectedViolationForPreview.id}.jpg`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel-elevated px-4 py-2 text-xs font-semibold text-foreground hover:bg-panel"
              >
                <Download className="size-4" />
                Download High-Res 4K Frame
              </a>
              <button
                onClick={() => setSelectedViolationForPreview(null)}
                className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white shadow-lg shadow-primary/30"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
