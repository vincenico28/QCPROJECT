import { createFileRoute } from "@tanstack/react-router";
import { useFinanceAnalytics } from "@/lib/data/finance-analytics";
import { Loader2, TrendingUp, PieChart as PieChartIcon, LineChart as LineChartIcon, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { formatPeso } from "@/lib/data/traffic";

export const Route = createFileRoute("/finance-analytics")({
  head: () => ({
    meta: [{ title: "Financial Analytics — QC Command Center" }],
  }),
  component: FinanceAnalyticsPage,
});

const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6"];

function formatCompact(value: number) {
  if (value >= 1000000) return `₱${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `₱${(value / 1000).toFixed(1)}K`;
  return `₱${value}`;
}

function FinanceAnalyticsPage() {
  const { data, isLoading } = useFinanceAnalytics();

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <TrendingUp className="size-6 text-emerald-400" />
            Executive Financial Analytics
          </h1>
          <p className="text-sm text-muted-foreground">High-level revenue tracking, budget allocation, and AI-driven ROI projections.</p>
        </div>
      </div>

      {isLoading || !data ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
             <div className="panel rounded-xl border border-border p-5">
                <p className="text-sm font-semibold text-muted-foreground">YTD Revenue</p>
                <p className="text-3xl font-black text-white mt-1">{formatPeso(data.ytdTotal)}</p>
                <div className="flex items-center gap-1 mt-2 text-xs font-bold text-emerald-400">
                   <ArrowUpRight className="size-3" />
                   +14% vs last year
                </div>
             </div>
             <div className="panel rounded-xl border border-border p-5">
                <p className="text-sm font-semibold text-muted-foreground">Projected Automation Savings</p>
                <p className="text-3xl font-black text-emerald-400 mt-1">{formatPeso(data.projectedSavings)}</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                   Derived from AI dispatch efficiency
                </div>
             </div>
             <div className="panel rounded-xl border border-border p-5">
                <p className="text-sm font-semibold text-muted-foreground">Citation Revenue Trend</p>
                <p className="text-3xl font-black text-white mt-1">Declining</p>
                <div className="flex items-center gap-1 mt-2 text-xs font-bold text-emerald-400">
                   <ArrowDownRight className="size-3" />
                   Positive indicator of citizen compliance
                </div>
             </div>
             <div className="panel rounded-xl border border-border p-5">
                <p className="text-sm font-semibold text-muted-foreground">EV Charging Revenue</p>
                <p className="text-3xl font-black text-white mt-1">+155%</p>
                <div className="flex items-center gap-1 mt-2 text-xs font-bold text-emerald-400">
                   <ArrowUpRight className="size-3" />
                   Fastest growing sector
                </div>
             </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
             <div className="lg:col-span-2 panel rounded-xl border border-border p-5">
                <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                  <LineChartIcon className="size-4 text-emerald-400" />
                  Revenue Streams (6-Month Trend)
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.revenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCitations" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorEv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis dataKey="month" stroke="#666" tick={{fill: '#666', fontSize: 12}} tickLine={false} axisLine={false} />
                      <YAxis stroke="#666" tick={{fill: '#666', fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={formatCompact} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: number) => formatPeso(value)}
                      />
                      <Area type="monotone" dataKey="citations" name="Traffic Citations" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorCitations)" />
                      <Area type="monotone" dataKey="evCharging" name="EV Charging" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorEv)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
             </div>

             <div className="panel rounded-xl border border-border p-5">
                <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                  <PieChartIcon className="size-4 text-purple-400" />
                  Annual Budget Allocation
                </h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.budget}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="amount"
                        stroke="none"
                      >
                        {data.budget.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', borderRadius: '8px' }}
                        formatter={(value: number) => formatPeso(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2 mt-2">
                   {data.budget.map((item, i) => (
                      <div key={item.category} className="flex items-center justify-between text-sm">
                         <div className="flex items-center gap-2">
                            <div className="size-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-muted-foreground">{item.category}</span>
                         </div>
                         <span className="font-bold text-white font-mono-tab">{formatCompact(item.amount)}</span>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </>
      )}
    </div>
  );
}
