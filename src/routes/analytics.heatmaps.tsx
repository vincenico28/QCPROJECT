import { createFileRoute, Link } from "@tanstack/react-router";
import { useHeatmapData } from "@/lib/data/heatmaps";
import { QC_CENTER } from "@/lib/data/gis";
import { Loader2, Flame, TrendingUp, Clock, AlertTriangle, ArrowLeft } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Suspense, lazy } from "react";

// Lazy load leaflet for map rendering
const MapContainer = lazy(() => import("react-leaflet").then(m => ({ default: m.MapContainer })));
const TileLayer = lazy(() => import("react-leaflet").then(m => ({ default: m.TileLayer })));
const CircleMarker = lazy(() => import("react-leaflet").then(m => ({ default: m.CircleMarker })));
const Popup = lazy(() => import("react-leaflet").then(m => ({ default: m.Popup })));

export const Route = createFileRoute("/analytics/heatmaps")({
  head: () => ({
    meta: [{ title: "Predictive Analytics — Culiat Traffic Ops" }],
  }),
  component: HeatmapsPage,
});

function HeatmapsPage() {
  const { data, isLoading } = useHeatmapData();

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link to="/analytics" className="inline-flex size-10 items-center justify-center rounded-xl bg-panel border border-border text-white hover:bg-panel-elevated transition-colors">
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Flame className="size-6 text-orange-500" />
              Predictive AI Heatmap
            </h1>
            <p className="text-sm text-muted-foreground">Historical GIS analysis and 24-hour volume forecasting.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-panel px-4 py-1.5 text-xs text-white">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-blue-500"></span>
            </span>
            ML Engine Online
          </div>
        </div>
      </div>

      {isLoading || !data ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-3">
          
          {/* Predictive Map Overlay */}
          <div className="panel xl:col-span-2 overflow-hidden rounded-2xl border border-border/50 relative z-0 h-[600px] shadow-lg">
            <div className="absolute top-4 left-4 z-10 bg-black/80 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl">
               <h3 className="text-sm font-bold text-white mb-2">High-Risk Zones (Next 4hrs)</h3>
               <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="size-3 rounded-full bg-red-500/80"></span>
                    <span className="text-white/80">Critical (90%+ Probability)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="size-3 rounded-full bg-orange-500/80"></span>
                    <span className="text-white/80">Warning (70-89%)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="size-3 rounded-full bg-yellow-500/80"></span>
                    <span className="text-white/80">Elevated (50-69%)</span>
                  </div>
               </div>
            </div>
            
            <Suspense fallback={<div className="grid h-full place-items-center bg-background"><Loader2 className="size-8 animate-spin text-primary" /></div>}>
              <MapContainer
                center={QC_CENTER}
                zoom={14}
                zoomControl={false}
                className="h-full w-full z-0"
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                {data.points.map(point => {
                  const color = point.intensity > 0.8 ? "#ef4444" : point.intensity > 0.5 ? "#f97316" : "#eab308";
                  return (
                    <CircleMarker 
                      key={point.id}
                      center={[point.lat, point.lng]}
                      pathOptions={{ color, fillColor: color, fillOpacity: 0.6 }}
                      radius={point.intensity * 25}
                    >
                      <Popup className="custom-popup">
                        <div className="flex flex-col gap-1 p-1">
                          <strong className="text-white font-sans">{point.label}</strong>
                          <span className="text-xs text-muted-foreground font-mono-tab flex items-center gap-1">
                            <AlertTriangle className="size-3 text-orange-500" />
                            {point.predictedViolations} Pred. Violations
                          </span>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            </Suspense>
          </div>

          {/* Time Series Forecast */}
          <div className="panel xl:col-span-1 flex flex-col gap-4 rounded-2xl border border-border/50 p-6 shadow-lg h-[600px]">
             <div className="flex items-center justify-between border-b border-border/50 pb-4">
               <div className="flex items-center gap-3">
                 <div className="grid size-10 place-items-center rounded-lg bg-orange-500/10 text-orange-500">
                   <TrendingUp className="size-5" />
                 </div>
                 <div>
                   <h2 className="font-semibold text-white">24h Forecast</h2>
                   <p className="text-xs text-muted-foreground">Violation Volume Prediction</p>
                 </div>
               </div>
             </div>
             
             <div className="flex-1 w-full mt-4 -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.predictions}>
                    <defs>
                      <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis 
                      dataKey="time" 
                      stroke="#888" 
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      interval={3}
                    />
                    <YAxis 
                      stroke="#888" 
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1b1e', borderColor: '#333', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend iconType="circle" />
                    <Area 
                      type="monotone" 
                      dataKey="actual" 
                      name="Actual Recorded"
                      stroke="#3b82f6" 
                      fillOpacity={1} 
                      fill="url(#colorActual)" 
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="predicted" 
                      name="AI Predicted"
                      stroke="#f97316" 
                      fillOpacity={1} 
                      fill="url(#colorPredicted)" 
                      strokeDasharray="5 5"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
             
             <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-4 mt-2">
                <div className="flex items-start gap-3">
                   <Clock className="size-5 text-orange-500 shrink-0" />
                   <div>
                     <h4 className="text-sm font-bold text-orange-500">Rush Hour Alert</h4>
                     <p className="text-xs text-orange-500/80 mt-1">
                       AI predicts a 140% spike in violations at 17:00. Recommend deploying 2 additional officers to EDSA-Philcoa sector.
                     </p>
                   </div>
                </div>
             </div>
          </div>

        </div>
      )}
    </div>
  );
}
