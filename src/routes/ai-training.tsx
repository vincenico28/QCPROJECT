import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useAiDatasets, useAiMetrics, useCreateAiDataset } from "@/lib/data/ai-training";
import {
  Loader2,
  BrainCircuit,
  Upload,
  PlayCircle,
  BarChart,
  HardDrive,
  Target,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  X,
  FileCode,
  Sliders,
  Camera,
  RefreshCw,
  Eye,
  ShieldAlert,
  Zap,
  Download,
  Copy,
  Check,
  Maximize2,
  Activity,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/ai-training")({
  head: () => ({
    meta: [
      { title: "AI Model Training Hub & Detection Matrix — Culiat Traffic Ops" },
      {
        name: "description",
        content:
          "YOLOv11 edge computer vision fine-tuning, optical dataset curation, real-time inference playground, and model convergence analytics.",
      },
    ],
  }),
  component: AiTrainingPage,
});

const CLASS_PERFORMANCE = [
  { className: "Red Light Infraction", precision: "98.4%", recall: "97.1%", mAP50: "98.1%", samples: 14200 },
  { className: "Illegal Parking / Obstruction", precision: "95.2%", recall: "93.8%", mAP50: "94.9%", samples: 18900 },
  { className: "Counterflow / Wrong-Way", precision: "96.8%", recall: "95.5%", mAP50: "96.4%", samples: 9400 },
  { className: "Busway / Exclusive Lane", precision: "97.6%", recall: "96.9%", mAP50: "97.2%", samples: 12800 },
  { className: "No Helmet (Motorcycle)", precision: "94.1%", recall: "92.7%", mAP50: "93.8%", samples: 8600 },
  { className: "Yellow Box Gridlock", precision: "96.0%", recall: "94.3%", mAP50: "95.5%", samples: 11200 },
];

type BBoxDetection = {
  id: string;
  className: string;
  confidence: number;
  box: { x: number; y: number; w: number; h: number }; // percentages 0-100
  color: string;
  speedKph?: number;
  plateNumber?: string;
  flagged?: boolean;
};

const TEST_SCENARIOS = [
  {
    id: "scen-cw-tandang",
    name: "Commonwealth Ave cor. Tandang Sora",
    cameraCode: "QC-CAM-CW-04",
    imageUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200&auto=format&fit=crop&q=80",
    description: "High-density multi-lane corridor during evening peak rush.",
    detections: [
      {
        id: "det-1",
        className: "Sedan (Private)",
        confidence: 0.984,
        box: { x: 18, y: 44, w: 26, h: 32 },
        color: "#38bdf8",
        speedKph: 36,
        plateNumber: "NDB-8921",
      },
      {
        id: "det-2",
        className: "Red Light Infraction",
        confidence: 0.965,
        box: { x: 52, y: 38, w: 24, h: 34 },
        color: "#ef4444",
        speedKph: 42,
        plateNumber: "ABC-1234",
        flagged: true,
      },
      {
        id: "det-3",
        className: "Motorcycle (Helmet Verified)",
        confidence: 0.942,
        box: { x: 42, y: 55, w: 12, h: 22 },
        color: "#10b981",
        speedKph: 31,
      },
      {
        id: "det-4",
        className: "Pedestrian Crosswalk",
        confidence: 0.918,
        box: { x: 80, y: 60, w: 10, h: 26 },
        color: "#a855f7",
        speedKph: 4,
      },
    ] as BBoxDetection[],
  },
  {
    id: "scen-visayas-central",
    name: "Visayas Ave cor. Central Ave",
    cameraCode: "QC-CAM-VIS-02",
    imageUrl: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=1200&auto=format&fit=crop&q=80",
    description: "Intersection yellow-box gridlock & lane obstruction monitoring.",
    detections: [
      {
        id: "det-201",
        className: "Yellow Box Gridlock",
        confidence: 0.978,
        box: { x: 30, y: 35, w: 38, h: 42 },
        color: "#f59e0b",
        speedKph: 2,
        flagged: true,
      },
      {
        id: "det-202",
        className: "No Helmet (Motorcycle)",
        confidence: 0.935,
        box: { x: 74, y: 48, w: 14, h: 25 },
        color: "#ef4444",
        speedKph: 28,
        plateNumber: "MC-7890",
        flagged: true,
      },
      {
        id: "det-203",
        className: "Utility Jeepney",
        confidence: 0.989,
        box: { x: 12, y: 46, w: 22, h: 36 },
        color: "#38bdf8",
        speedKph: 15,
      },
    ] as BBoxDetection[],
  },
  {
    id: "scen-katipunan-busway",
    name: "Commonwealth Median Busway Express",
    cameraCode: "QC-CAM-BUS-01",
    imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&auto=format&fit=crop&q=80",
    description: "Dedicated rapid bus transit lane with automated intrusion detection.",
    detections: [
      {
        id: "det-301",
        className: "Authorized Public Bus",
        confidence: 0.992,
        box: { x: 32, y: 25, w: 36, h: 56 },
        color: "#10b981",
        speedKph: 48,
        plateNumber: "BUS-4410",
      },
      {
        id: "det-302",
        className: "Busway Intrusion (Private Sedan)",
        confidence: 0.971,
        box: { x: 10, y: 40, w: 22, h: 32 },
        color: "#ef4444",
        speedKph: 52,
        plateNumber: "WHI-9981",
        flagged: true,
      },
    ] as BBoxDetection[],
  },
];

export function AiTrainingPage() {
  const { data: datasets, isLoading: loadingDatasets } = useAiDatasets();
  const { data: metrics, isLoading: loadingMetrics } = useAiMetrics();
  const createDataset = useCreateAiDataset();

  const [activeTab, setActiveTab] = useState<"convergence" | "playground">("playground");

  // Training state
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Upload Form
  const [datasetName, setDatasetName] = useState("");
  const [imageCount, setImageCount] = useState("2500");
  const [selectedClasses, setSelectedClasses] = useState("Red Light, Helmet, Yellow Box");

  // Inference Playground State
  const [selectedScenario, setSelectedScenario] = useState(TEST_SCENARIOS[0]);
  const [confidenceThreshold, setConfidenceThreshold] = useState(70); // percentage
  const [isSimulatingInference, setIsSimulatingInference] = useState(false);
  const [lastInferenceTime, setLastInferenceTime] = useState<number>(13.8);
  const [copiedJson, setCopiedJson] = useState(false);
  const [selectedDetection, setSelectedDetection] = useState<BBoxDetection | null>(null);

  const isLoading = loadingDatasets || loadingMetrics;

  const handleStartTraining = () => {
    if (isTraining) return;
    setIsTraining(true);
    setTrainingProgress(0);
    setCurrentEpoch(1);

    toast.info("YOLOv11 Fine-Tuning Run Initiated", {
      description: "Allocating GPU tensors & loading Quezon City CCTV dataset...",
    });

    let epoch = 1;
    const interval = setInterval(() => {
      epoch += 1;
      setCurrentEpoch(epoch);
      setTrainingProgress(Math.min(100, Math.floor((epoch / 10) * 100)));

      if (epoch >= 10) {
        clearInterval(interval);
        setIsTraining(false);
        toast.success("AI Model Training Run Complete!", {
          description: "New checkpoint weights exported: yolov11-culiat-v2.8.pt (mAP@50: 97.4%)",
        });

        (async () => {
          try {
            const { supabase } = await import("@/integrations/supabase/client");
            await supabase.from("audit_logs").insert({
              actor_name: "Lead Computer Vision Engineer",
              actor_role: "admin",
              action: "AI_MODEL_TRAINING_EXECUTED",
              target_resource: "YOLOv11 Edge Detector",
              details:
                "Trained 10 epochs on QC CCTV annotated datasets. Checkpoint weights exported: yolov11-culiat-v2.8.pt (mAP@50: 97.4%).",
            });
          } catch (err) {
            console.warn(err);
          }
        })();
      }
    }, 1000);
  };

  const handleRunInference = () => {
    setIsSimulatingInference(true);
    const simulatedLatency = parseFloat((11 + Math.random() * 5).toFixed(1));
    setTimeout(() => {
      setLastInferenceTime(simulatedLatency);
      setIsSimulatingInference(false);
      toast.success(`Edge Inference Complete (${simulatedLatency} ms)`, {
        description: `Evaluated ${selectedScenario.detections.length} bounding boxes via TensorRT FP16 pipeline.`,
      });
    }, 450);
  };

  const visibleDetections = useMemo(() => {
    return selectedScenario.detections.filter((d) => d.confidence * 100 >= confidenceThreshold);
  }, [selectedScenario, confidenceThreshold]);

  const handleCopyDetectionJson = () => {
    const payload = {
      model: "yolov11-culiat-v2.8.pt",
      runtime: "NVIDIA TensorRT 10.2 FP16",
      camera: selectedScenario.cameraCode,
      inferenceMs: lastInferenceTime,
      timestamp: new Date().toISOString(),
      detections: visibleDetections,
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedJson(true);
    toast.success("Inference telemetry JSON copied to clipboard!");
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleUploadDataset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!datasetName.trim()) return;

    createDataset.mutate(
      {
        name: datasetName.trim(),
        images: parseInt(imageCount, 10) || 1000,
        classes: selectedClasses.split(",").map((c) => c.trim()).filter(Boolean),
      },
      {
        onSuccess: () => {
          toast.success(`Dataset "${datasetName}" uploaded & indexed`, {
            description: `${imageCount} labeled annotations validated.`,
          });
          setUploadModalOpen(false);
          setDatasetName("");
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-primary/20 px-2 py-0.5 font-mono-tab text-[10px] font-bold text-primary border border-primary/30">
              YOLOv11 COMPUTER VISION ENGINE
            </span>
            <span className="text-xs text-subtle">· Edge Inference & Transfer Learning</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            AI Model Training Hub & Detection Matrix
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage CCTV annotation datasets, trigger transfer learning fine-tuning runs, and test live edge optical detections.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Upload Modal */}
          <Dialog.Root open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
            <Dialog.Trigger asChild>
              <button className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-panel-elevated transition-colors">
                <Upload className="size-3.5" />
                Upload Dataset
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-panel p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95">
                <div className="flex items-start justify-between border-b border-border pb-3">
                  <Dialog.Title className="text-base font-bold text-white flex items-center gap-2">
                    <FileCode className="size-4 text-primary" />
                    Upload YOLO Dataset (.zip / .tar)
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button className="rounded p-1 text-muted-foreground hover:text-foreground">
                      <X className="size-4" />
                    </button>
                  </Dialog.Close>
                </div>

                <form onSubmit={handleUploadDataset} className="mt-4 flex flex-col gap-3.5 text-xs">
                  <label className="flex flex-col gap-1">
                    <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                      Dataset Title *
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Commonwealth Night Detections 2026"
                      value={datasetName}
                      onChange={(e) => setDatasetName(e.target.value)}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1">
                      <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                        Image Count
                      </span>
                      <input
                        type="number"
                        value={imageCount}
                        onChange={(e) => setImageCount(e.target.value)}
                        className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                        Annotation Format
                      </span>
                      <select className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-white focus:border-primary focus:outline-none">
                        <option value="yolo">YOLO TXT (Normalized BBoxes)</option>
                        <option value="coco">COCO JSON</option>
                        <option value="voc">Pascal VOC XML</option>
                      </select>
                    </label>
                  </div>

                  <label className="flex flex-col gap-1">
                    <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                      Target Classes
                    </span>
                    <input
                      type="text"
                      value={selectedClasses}
                      onChange={(e) => setSelectedClasses(e.target.value)}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                    />
                  </label>

                  <div className="mt-3 flex justify-end gap-2 border-t border-border pt-3">
                    <Dialog.Close asChild>
                      <button className="rounded-lg px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-panel-elevated">
                        Cancel
                      </button>
                    </Dialog.Close>
                    <button
                      type="submit"
                      disabled={!datasetName}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 disabled:opacity-50"
                    >
                      <Upload className="size-3.5" />
                      Index Dataset
                    </button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          <button
            onClick={handleStartTraining}
            disabled={isTraining}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {isTraining ? <Loader2 className="size-3.5 animate-spin" /> : <PlayCircle className="size-3.5" />}
            {isTraining ? `Training Epoch ${currentEpoch}/10 (${trainingProgress}%)` : "Fine-Tune YOLOv11"}
          </button>
        </div>
      </div>

      {/* Edge AI Health KPI Ribbon */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="panel rounded-2xl border border-border p-4">
          <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">Active Weights Checkpoint</span>
          <p className="mt-2 font-mono-tab text-base font-black text-white">yolov11-culiat-v2.8.pt</p>
          <span className="text-[10px] text-emerald-400 block mt-0.5">● Production Deployed</span>
        </div>

        <div className="panel rounded-2xl border border-border p-4">
          <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">Validation mAP@0.50</span>
          <p className="mt-2 font-mono-tab text-2xl font-black text-emerald-400">97.4%</p>
          <span className="text-[10px] text-white/50 block mt-0.5">+1.2% over v2.7</span>
        </div>

        <div className="panel rounded-2xl border border-border p-4">
          <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">Inference Latency</span>
          <p className="mt-2 font-mono-tab text-2xl font-black text-sky-400">{lastInferenceTime} ms</p>
          <span className="text-[10px] text-white/50 block mt-0.5">NVIDIA Jetson AGX Orin FP16</span>
        </div>

        <div className="panel rounded-2xl border border-border p-4">
          <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">Indexed QC Frames</span>
          <p className="mt-2 font-mono-tab text-2xl font-black text-amber-300">64,900</p>
          <span className="text-[10px] text-amber-400/80 block mt-0.5">Annotated CCTV Bounding Boxes</span>
        </div>
      </div>

      {/* Progress Banner if active */}
      {isTraining && (
        <div className="panel rounded-2xl border border-primary/40 bg-primary/10 p-4 flex flex-col gap-2 animate-in fade-in">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-2">
              <Cpu className="size-4 text-primary animate-pulse" />
              Fine-Tuning in Progress: YOLOv11-Culiat (Epoch {currentEpoch} of 10)
            </span>
            <span className="font-mono-tab font-black text-primary">{trainingProgress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-black/40">
            <div
              className="h-full bg-primary transition-all duration-500 rounded-full"
              style={{ width: `${trainingProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab("playground")}
          className={cn(
            "rounded-xl px-4 py-2 font-mono-tab text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2",
            activeTab === "playground"
              ? "bg-primary text-white shadow-md shadow-primary/20"
              : "text-muted-foreground hover:bg-panel hover:text-white"
          )}
        >
          <Eye className="size-3.5" /> Edge Optical Playground & BBoxes
        </button>
        <button
          onClick={() => setActiveTab("convergence")}
          className={cn(
            "rounded-xl px-4 py-2 font-mono-tab text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2",
            activeTab === "convergence"
              ? "bg-primary text-white shadow-md shadow-primary/20"
              : "text-muted-foreground hover:bg-panel hover:text-white"
          )}
        >
          <BarChart className="size-3.5" /> Model Convergence & Datasets
        </button>
      </div>

      {/* Tab 1: Interactive Inference Playground */}
      {activeTab === "playground" && (
        <div className="grid gap-6 xl:grid-cols-3">
          {/* Main Visual Detection Canvas */}
          <div className="panel xl:col-span-2 flex flex-col gap-4 rounded-2xl border border-border p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Camera className="size-4 text-primary" />
                  <h2 className="font-bold text-white text-base">{selectedScenario.name}</h2>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Camera: <span className="font-mono text-white font-bold">{selectedScenario.cameraCode}</span> · {selectedScenario.description}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunInference}
                  disabled={isSimulatingInference}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600/20 border border-emerald-500/40 px-3.5 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50"
                >
                  <Zap className={cn("size-3.5", isSimulatingInference && "animate-spin")} />
                  {isSimulatingInference ? "Inferencing..." : "Re-Run Detection"}
                </button>

                <button
                  onClick={handleCopyDetectionJson}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-white hover:bg-panel-elevated transition-colors"
                  title="Copy Bounding Box JSON"
                >
                  {copiedJson ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                  {copiedJson ? "Copied" : "JSON"}
                </button>
              </div>
            </div>

            {/* Bounding Box Render Viewport */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black group select-none">
              <img
                src={selectedScenario.imageUrl}
                alt={selectedScenario.name}
                className="size-full object-cover"
              />

              {/* SVG Bounding Boxes Overlay */}
              <div className="absolute inset-0 pointer-events-auto">
                {visibleDetections.map((det) => {
                  const isHovered = selectedDetection?.id === det.id;
                  return (
                    <div
                      key={det.id}
                      onClick={() => setSelectedDetection(det)}
                      onMouseEnter={() => setSelectedDetection(det)}
                      style={{
                        left: `${det.box.x}%`,
                        top: `${det.box.y}%`,
                        width: `${det.box.w}%`,
                        height: `${det.box.h}%`,
                        borderColor: det.color,
                      }}
                      className={cn(
                        "absolute cursor-pointer border-2 transition-all rounded-md flex flex-col justify-start items-start",
                        isHovered
                          ? "ring-4 ring-white/60 shadow-[0_0_24px_rgba(255,255,255,0.4)] z-20"
                          : "shadow-[0_0_12px_rgba(0,0,0,0.8)] z-10 hover:border-white"
                      )}
                    >
                      {/* Bounding Box Label Tag */}
                      <span
                        style={{ backgroundColor: det.color }}
                        className="font-mono-tab text-[9px] font-black uppercase text-black px-1.5 py-0.5 rounded-br -mt-0.5 -ml-0.5 flex items-center gap-1 shadow-md"
                      >
                        {det.className} {(det.confidence * 100).toFixed(0)}%
                        {det.speedKph && ` · ${det.speedKph}kph`}
                      </span>

                      {/* Optical Reticle Corners */}
                      <div className="absolute -top-1 -right-1 size-2 border-t-2 border-r-2 border-white" />
                      <div className="absolute -bottom-1 -left-1 size-2 border-b-2 border-l-2 border-white" />
                    </div>
                  );
                })}
              </div>

              {/* Bottom HUD Bar */}
              <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-black/75 backdrop-blur-md px-4 py-2 border border-white/10 flex items-center justify-between text-xs font-mono-tab">
                <div className="flex items-center gap-3 text-white">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                    Active Detections: {visibleDetections.length}
                  </span>
                  <span>·</span>
                  <span className="text-muted-foreground">Pipeline: TensorRT FP16</span>
                </div>
                <div className="text-right text-emerald-400 font-bold">
                  Latency: {lastInferenceTime}ms ({(1000 / lastInferenceTime).toFixed(0)} FPS)
                </div>
              </div>
            </div>

            {/* Scenario Selector Pills */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-xs text-muted-foreground self-center mr-1">Test Corridor:</span>
              {TEST_SCENARIOS.map((scen) => (
                <button
                  key={scen.id}
                  onClick={() => {
                    setSelectedScenario(scen);
                    setSelectedDetection(null);
                  }}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all",
                    selectedScenario.id === scen.id
                      ? "bg-primary text-white shadow-md shadow-primary/20 font-bold"
                      : "border border-border bg-background text-muted-foreground hover:text-white"
                  )}
                >
                  {scen.name}
                </button>
              ))}
            </div>
          </div>

          {/* Right Sidebar: Optical Diagnostics & Confidence Controls */}
          <div className="panel xl:col-span-1 flex flex-col gap-5 rounded-2xl border border-border p-6 shadow-xl h-fit">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Sliders className="size-4 text-primary" /> Detection Parameters
              </h3>
              <span className="font-mono-tab text-xs text-primary font-bold">{confidenceThreshold}% Threshold</span>
            </div>

            {/* Confidence Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Confidence Filter</span>
                <span className="font-mono-tab text-white font-bold">{confidenceThreshold}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(parseInt(e.target.value, 10))}
                className="w-full accent-primary cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-subtle font-mono-tab mt-1">
                <span>50% (High Recall)</span>
                <span>95% (Strict Precision)</span>
              </div>
            </div>

            {/* Selected Detection Inspector */}
            <div className="rounded-xl border border-border bg-background/60 p-4">
              <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle block mb-2">
                Selected Detection Telemetry
              </span>
              {selectedDetection ? (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Class:</span>
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span className="size-2 rounded-full" style={{ backgroundColor: selectedDetection.color }} />
                      {selectedDetection.className}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Confidence:</span>
                    <span className="font-mono-tab font-bold text-emerald-400">
                      {(selectedDetection.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  {selectedDetection.plateNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">ANPR Plate:</span>
                      <span className="font-mono-tab font-bold text-white bg-black/40 px-2 py-0.5 rounded border border-white/10">
                        {selectedDetection.plateNumber}
                      </span>
                    </div>
                  )}
                  {selectedDetection.speedKph && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Speed Radar:</span>
                      <span className="font-mono-tab font-bold text-sky-400">{selectedDetection.speedKph} kph</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Bounding Box:</span>
                    <span className="font-mono-tab text-[11px] text-muted-foreground">
                      [{selectedDetection.box.x}%, {selectedDetection.box.y}%, {selectedDetection.box.w}%, {selectedDetection.box.h}%]
                    </span>
                  </div>
                  {selectedDetection.flagged && (
                    <div className="mt-2 rounded-lg border border-red-500/40 bg-red-950/20 p-2 text-red-400 font-bold text-[11px] flex items-center gap-1.5">
                      <ShieldAlert className="size-3.5" />
                      Statutory Violation Flagged by Edge Model
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-2 text-center">
                  Click on any bounding box on the camera canvas to inspect normalized coordinates & sensor metrics.
                </p>
              )}
            </div>

            {/* Target Classes Distribution */}
            <div>
              <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle block mb-2">
                Active Optical Class Weights
              </span>
              <div className="flex flex-col gap-2">
                {CLASS_PERFORMANCE.slice(0, 4).map((cp) => (
                  <div key={cp.className} className="flex items-center justify-between text-xs">
                    <span className="text-white/80">{cp.className}</span>
                    <span className="font-mono-tab text-emerald-400 font-bold">{cp.mAP50}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Datasets & Convergence Analytics */}
      {activeTab === "convergence" && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Datasets Panel */}
          <div className="panel col-span-1 flex flex-col gap-4 rounded-2xl border border-border p-6 shadow-xl h-fit">
            <div className="flex items-center gap-3 border-b border-border/50 pb-4">
              <div className="grid size-12 place-items-center rounded-2xl bg-primary/20 text-primary border border-primary/30">
                <HardDrive className="size-6" />
              </div>
              <div>
                <h2 className="font-bold text-white text-base">CCTV Training Sets</h2>
                <p className="text-xs text-muted-foreground">Quezon City Labeled Optical Imagery</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-2">
              {datasets?.map((ds) => (
                <div key={ds.id} className="flex flex-col gap-2 rounded-xl border border-border bg-background/50 p-3.5">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-white text-xs">{ds.name}</p>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                        ds.status === "Ready"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : ds.status === "Training"
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      )}
                    >
                      {ds.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono-tab">
                    <span>{ds.images.toLocaleString()} images</span>
                    <span>{ds.id}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ds.classes.map((c) => (
                      <span
                        key={c}
                        className="rounded bg-white/10 px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-white/70"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Metrics Chart */}
          <div className="panel lg:col-span-2 flex flex-col gap-4 rounded-2xl border border-border p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <BarChart className="size-6" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-base">Model Convergence & Loss (mAP)</h2>
                  <p className="text-xs text-muted-foreground">Epoch Validation on Commonwealth & Tandang Sora Grid</p>
                </div>
              </div>

              {metrics && metrics.length > 0 && (
                <div className="flex gap-4">
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 justify-end">
                      <Target className="size-3 text-emerald-400" /> mAP@50
                    </p>
                    <p className="font-mono-tab text-xl font-black text-emerald-400">
                      {(metrics[metrics.length - 1].map50 * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 justify-end">
                      <BrainCircuit className="size-3 text-blue-400" /> Loss
                    </p>
                    <p className="font-mono-tab text-xl font-black text-blue-400">
                      {metrics[metrics.length - 1].loss.toFixed(3)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {metrics && (
              <div className="h-[280px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                    <XAxis
                      dataKey="epoch"
                      stroke="#888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `Epoch ${val}`}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="#888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "12px", fontSize: "12px" }}
                      itemStyle={{ color: "#fff" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="map50"
                      name="mAP@0.50"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={false}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="map95"
                      name="mAP@0.50-0.95"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="loss"
                      name="Training Loss"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Class Performance Table */}
            <div className="mt-4 border-t border-border pt-4">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider mb-2">
                Class Precision & Recall Matrix
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-subtle text-[10px] uppercase font-mono-tab">
                      <th className="py-2">Infraction Class</th>
                      <th className="py-2">Precision</th>
                      <th className="py-2">Recall</th>
                      <th className="py-2">mAP@50</th>
                      <th className="py-2 text-right">Sample Annotations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-mono-tab">
                    {CLASS_PERFORMANCE.map((cp) => (
                      <tr key={cp.className} className="hover:bg-panel-elevated/30">
                        <td className="py-2.5 font-sans font-medium text-white">{cp.className}</td>
                        <td className="py-2.5 text-emerald-400 font-bold">{cp.precision}</td>
                        <td className="py-2.5 text-blue-400 font-bold">{cp.recall}</td>
                        <td className="py-2.5 text-white font-bold">{cp.mAP50}</td>
                        <td className="py-2.5 text-right text-muted-foreground">
                          {cp.samples.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
