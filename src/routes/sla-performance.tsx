import { createFileRoute } from "@tanstack/react-router";
import { useSlaPerformance } from "@/lib/data/sla";
import { Loader2, Target, CheckCircle2, AlertTriangle, AlertCircle, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export const Route = createFileRoute("/sla-performance")({
  head: () => ({
    meta: [{ title: "SLA Performance — QC Command Center" }],
  }),
  component: SlaPerformancePage,
});

const MOCK_UPTIME_CHART = [
  { time: "00:00", uptime: 99.9 },
  { time: "04:00", uptime: 99.95 },
  { time: "08:00", uptime: 99.8 },
  { time: "12:00", uptime: 99.99 },
  { time: "16:00", uptime: 99.7 },
  { time: "20:00", uptime: 99.98 },
];

function SlaPerformancePage() {
  const { data: metrics, isLoading } = useSlaPerformance();

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Target className="size-6 text-blue-400" />
            System SLA & Performance
          </h1>
          <p className="text-sm text-muted-foreground">Monitor service level agreements, system uptime, and human operational efficiency.</p>
        </div>
      </div>

      {isLoading || !metrics ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
           <div className="lg:col-span-2 flex flex-col gap-4">
              <h2 className="font-bold tracking-tight text-white flex items-center gap-2 border-b border-border pb-2">
                 Key Performance Indicators (KPIs)
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                 {metrics.map(metric => (
                    <div key={metric.id} className="panel rounded-xl border border-border bg-panel p-5 relative overflow-hidden transition-all hover:border-border/80">
                       <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{metric.name}</p>
                            <p className="text-2xl font-black text-white mt-1">{metric.actual}</p>
                          </div>
                          <div className={cn(
                             "grid size-8 place-items-center rounded-full shrink-0",
                             metric.status === "Pass" ? "bg-emerald-500/20 text-emerald-500" :
                             metric.status === "Warning" ? "bg-orange-500/20 text-orange-500" :
                             "bg-red-500/20 text-red-500"
                          )}>
                             {metric.status === "Pass" ? <CheckCircle2 className="size-4" /> :
                              metric.status === "Warning" ? <AlertTriangle className="size-4" /> :
                              <AlertCircle className="size-4" />}
                          </div>
                       </div>
                       
                       <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                          <div className="flex items-center gap-2 text-xs">
                             <span className="text-muted-foreground">Target:</span>
                             <span className="font-bold text-white">{metric.target}</span>
                          </div>
                          <div className={cn(
                             "flex items-center gap-1 text-xs font-bold",
                             metric.trend > 0 ? "text-emerald-400" : "text-red-400"
                          )}>
                             {metric.trend > 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                             {Math.abs(metric.trend)}%
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           <div className="flex flex-col gap-6">
              <div className="panel flex-1 rounded-xl border border-border p-5">
                 <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                    <Activity className="size-4 text-emerald-400" />
                    Global System Uptime (24h)
                 </h3>
                 <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={MOCK_UPTIME_CHART} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorUptime" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="time" stroke="#666" tick={{fill: '#666', fontSize: 10}} tickLine={false} axisLine={false} />
                        <YAxis domain={[99.5, 100]} stroke="#666" tick={{fill: '#666', fontSize: 10}} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', borderRadius: '8px' }}
                          itemStyle={{ color: '#10b981' }}
                          formatter={(value: number) => [`${value}%`, 'Uptime']}
                        />
                        <Area type="monotone" dataKey="uptime" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorUptime)" />
                      </AreaChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="mt-4 flex flex-col gap-2 border-t border-border/50 pt-4">
                    <div className="flex justify-between text-sm">
                       <span className="text-muted-foreground">Overall Reliability</span>
                       <span className="font-bold text-emerald-400">99.92%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                       <span className="text-muted-foreground">Total Downtime</span>
                       <span className="font-bold text-white">4m 12s</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
