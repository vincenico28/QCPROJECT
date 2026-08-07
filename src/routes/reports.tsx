import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useReportSummary, generateReportCsv } from "@/lib/data/reports";
import { formatPeso } from "@/lib/data/traffic";
import { Download, FileText, Loader2, Calendar, TrendingUp, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Enterprise Reports — Culiat Traffic Ops" },
      {
        name: "description",
        content: "Generate comprehensive reports for revenue, violations, and enforcement statistics.",
      },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const [dateRange, setDateRange] = useState({ 
    from: new Date(new Date().setDate(new Date().getDate() - 30)), 
    to: new Date() 
  });
  
  const { data, isLoading } = useReportSummary(dateRange);

  const handleExportCSV = () => {
    if (!data) return;
    const csvContent = generateReportCsv(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `QC_Traffic_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Report exported successfully!");
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Enterprise Reports</h1>
          <p className="text-sm text-muted-foreground">
            Generate and export official LGU compliance and revenue reports.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-panel px-4 py-2 text-sm text-white">
            <Calendar className="size-4 text-primary" />
            <span>Last 30 Days</span>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={isLoading || !data}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            Export CSV
          </button>
        </div>
      </div>

      {isLoading || !data ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Top KPIs */}
          <div className="panel flex flex-col justify-center rounded-2xl border border-border/50 bg-panel p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-full bg-emerald-500/10 text-emerald-500">
                <TrendingUp className="size-5" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground">Total Revenue</p>
            </div>
            <p className="mt-4 font-mono-tab text-3xl font-bold text-white">
              {formatPeso(data.totalRevenue)}
            </p>
          </div>

          <div className="panel flex flex-col justify-center rounded-2xl border border-border/50 bg-panel p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-full bg-blue-500/10 text-blue-500">
                <FileText className="size-5" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground">Total Citations</p>
            </div>
            <p className="mt-4 font-mono-tab text-3xl font-bold text-white">
              {data.totalCitations.toLocaleString()}
            </p>
          </div>

          <div className="panel flex flex-col justify-center rounded-2xl border border-border/50 bg-panel p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-full bg-yellow-500/10 text-yellow-500">
                <AlertTriangle className="size-5" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground">Unpaid Citations</p>
            </div>
            <p className="mt-4 font-mono-tab text-3xl font-bold text-white">
              {data.unpaidCitations.toLocaleString()}
            </p>
          </div>
          
           <div className="panel flex flex-col justify-center rounded-2xl border border-border/50 bg-panel p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
                <FileText className="size-5" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground">Settled</p>
            </div>
            <p className="mt-4 font-mono-tab text-3xl font-bold text-white">
              {data.settledCitations.toLocaleString()}
            </p>
          </div>

          {/* Charts Area */}
          <div className="panel col-span-1 flex flex-col gap-4 rounded-2xl border border-border/50 p-6 lg:col-span-3">
            <h2 className="text-lg font-semibold text-white">Revenue Trend (Last 14 Days)</h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#888" 
                    fontSize={12} 
                    tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  />
                  <YAxis stroke="#888" fontSize={12} tickFormatter={(val) => `₱${val / 1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333', color: '#fff' }}
                    formatter={(value: number) => [formatPeso(value), "Revenue"]}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Line type="monotone" dataKey="amount" stroke="#cc0000" strokeWidth={3} dot={{ fill: '#cc0000', strokeWidth: 2 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel col-span-1 flex flex-col gap-4 rounded-2xl border border-border/50 p-6">
            <h2 className="text-lg font-semibold text-white">Top Violations</h2>
            <div className="flex flex-col gap-4 mt-2">
              {data.topViolations.map((v, i) => (
                <div key={v.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex size-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-white">{v.name}</span>
                  </div>
                  <span className="text-sm font-mono-tab font-bold text-muted-foreground">{v.count}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
