import { createFileRoute } from "@tanstack/react-router";
import { useAiDatasets, useAiMetrics } from "@/lib/data/ai-training";
import { Loader2, BrainCircuit, Upload, PlayCircle, BarChart, HardDrive, Target } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ai-training")({
  head: () => ({
    meta: [{ title: "AI Model Training Hub — Culiat Traffic Ops" }],
  }),
  component: AiTrainingPage,
});

function AiTrainingPage() {
  const { data: datasets, isLoading: loadingDatasets } = useAiDatasets();
  const { data: metrics, isLoading: loadingMetrics } = useAiMetrics();

  const isLoading = loadingDatasets || loadingMetrics;

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">AI Model Training Hub</h1>
          <p className="text-sm text-muted-foreground">Manage datasets and fine-tune the YOLOv11 traffic detection model.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg bg-panel border border-border px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-panel-elevated">
            <Upload className="size-4" />
            Upload Dataset
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90">
            <PlayCircle className="size-4" />
            Start Training Run
          </button>
        </div>
      </div>

      {isLoading || !datasets || !metrics ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Datasets Panel */}
          <div className="panel col-span-1 flex flex-col gap-4 rounded-2xl border border-border/50 p-6 shadow-lg">
            <div className="flex items-center gap-3 border-b border-border/50 pb-4">
              <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <HardDrive className="size-5" />
              </div>
              <div>
                <h2 className="font-semibold text-white">Local Datasets</h2>
                <p className="text-xs text-muted-foreground">Annotated image sets</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-3 mt-2">
               {datasets.map(ds => (
                 <div key={ds.id} className="flex flex-col gap-2 rounded-lg border border-border bg-background/50 p-3">
                   <div className="flex items-center justify-between">
                     <p className="font-semibold text-white text-sm">{ds.name}</p>
                     <span className={cn(
                       "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                       ds.status === "Ready" ? "bg-emerald-500/20 text-emerald-500" :
                       ds.status === "Training" ? "bg-blue-500/20 text-blue-400 animate-pulse" : "bg-red-500/20 text-red-500"
                     )}>
                       {ds.status}
                     </span>
                   </div>
                   <div className="flex items-center justify-between text-xs text-muted-foreground">
                     <span>{ds.images.toLocaleString()} images</span>
                     <span className="font-mono-tab">{ds.id}</span>
                   </div>
                   <div className="flex flex-wrap gap-1 mt-1">
                     {ds.classes.map(c => (
                       <span key={c} className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-white/70">
                         {c}
                       </span>
                     ))}
                   </div>
                 </div>
               ))}
            </div>
          </div>

          {/* Metrics Chart */}
          <div className="panel lg:col-span-2 flex flex-col gap-4 rounded-2xl border border-border/50 p-6 shadow-lg">
             <div className="flex items-center justify-between border-b border-border/50 pb-4">
               <div className="flex items-center gap-3">
                 <div className="grid size-10 place-items-center rounded-lg bg-blue-500/10 text-blue-400">
                   <BarChart className="size-5" />
                 </div>
                 <div>
                   <h2 className="font-semibold text-white">Training Metrics (mAP)</h2>
                   <p className="text-xs text-muted-foreground">Current Run: Tricycles - Culiat</p>
                 </div>
               </div>
               
               <div className="flex gap-4">
                 <div className="text-right">
                   <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 justify-end">
                     <Target className="size-3" /> mAP@50
                   </p>
                   <p className="font-mono-tab text-xl font-bold text-emerald-400">
                     {(metrics[metrics.length-1].map50 * 100).toFixed(1)}%
                   </p>
                 </div>
                 <div className="text-right">
                   <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 justify-end">
                     <BrainCircuit className="size-3" /> Loss
                   </p>
                   <p className="font-mono-tab text-xl font-bold text-blue-400">
                     {metrics[metrics.length-1].loss.toFixed(3)}
                   </p>
                 </div>
               </div>
             </div>
             
             <div className="flex-1 min-h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis 
                      dataKey="epoch" 
                      stroke="#888" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `Epoch ${val}`}
                    />
                    <YAxis 
                      yAxisId="left"
                      stroke="#888" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      stroke="#888" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1b1e', borderColor: '#333', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="map50" 
                      name="mAP@0.50"
                      stroke="#10b981" 
                      strokeWidth={2}
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
          </div>
        </div>
      )}
    </div>
  );
}
