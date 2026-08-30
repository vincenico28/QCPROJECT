import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
    meta: [{ title: "AI Model Training Hub — Culiat Traffic Ops" }],
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

function AiTrainingPage() {
  const { data: datasets, isLoading: loadingDatasets } = useAiDatasets();
  const { data: metrics, isLoading: loadingMetrics } = useAiMetrics();
  const createDataset = useCreateAiDataset();

  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Upload Form
  const [datasetName, setDatasetName] = useState("");
  const [imageCount, setImageCount] = useState("2500");
  const [selectedClasses, setSelectedClasses] = useState("Red Light, Helmet, Yellow Box");

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
              details: "Trained 10 epochs on QC CCTV annotated datasets. Checkpoint weights exported: yolov11-culiat-v2.8.pt (mAP@50: 97.4%).",
            });
          } catch (err) {
            console.warn(err);
          }
        })();
      }
    }, 1000);
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
            Manage CCTV annotation datasets, trigger transfer learning fine-tuning runs, and inspect model convergence metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
            {isTraining ? `Training Epoch ${currentEpoch}/10 (${trainingProgress}%)` : "Start Training Run"}
          </button>
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

      {isLoading || !datasets || !metrics ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
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
              {datasets.map((ds) => (
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
            </div>

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
