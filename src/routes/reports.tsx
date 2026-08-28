import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useReportSummary, generateReportCsv } from "@/lib/data/reports";
import { formatPeso } from "@/lib/data/traffic";
import {
  Download,
  FileText,
  Loader2,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Printer,
  ShieldCheck,
  Building2,
  CheckCircle2,
  FileSpreadsheet,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Enterprise Reports & Compliance · Culiat Traffic Ops" },
      {
        name: "description",
        content:
          "Generate official Quezon City LGU traffic enforcement compliance, revenue audit, and violation reports with multi-format export.",
      },
    ],
  }),
  component: ReportsPage,
});

const TIMEFRAMES = [
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days (Monthly)" },
  { key: "90d", label: "Quarterly" },
  { key: "365d", label: "Annual FY 2026" },
];

function ReportsPage() {
  const [timeframe, setTimeframe] = useState("30d");
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });

  const { data, isLoading } = useReportSummary(dateRange);

  const handleExportCSV = () => {
    if (!data) return;
    const csvContent = generateReportCsv(data);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `QC_Traffic_Executive_Report_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Executive CSV report exported successfully!");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-primary/20 px-2 py-0.5 font-mono-tab text-[10px] font-bold text-primary border border-primary/30">
              QC LGU EXECUTIVE AUDIT & COMPLIANCE
            </span>
            <span className="text-xs text-subtle">· Official Reporting Suite</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            Enterprise Traffic Reports & Compliance
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Generate certified LGU revenue reconciliation audits, statutory violation logs, and enforcement metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-panel-elevated transition-colors"
          >
            <Printer className="size-3.5" />
            Print Report
          </button>

          <button
            onClick={handleExportCSV}
            disabled={isLoading || !data}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : <FileSpreadsheet className="size-3.5" />}
            Export CSV / Excel
          </button>
        </div>
      </div>

      {/* Printable Report Header for Official Audit */}
      <div className="hidden print:flex flex-col border-b border-black pb-4 mb-4 text-black">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black uppercase">Republic of the Philippines · Quezon City</h2>
            <p className="text-xs font-bold">Barangay Culiat Local Government Unit · Traffic Treasury & DPOS</p>
            <p className="text-[10px] text-neutral-600">No Contact Apprehension Policy (NCAP) Statutory Audit Summary</p>
          </div>
          <div className="text-right font-mono text-xs">
            <p>Generated: {new Date().toLocaleDateString("en-PH")}</p>
            <p>Audit Ref: QC-AUD-2026-{Math.floor(1000 + Math.random() * 9000)}</p>
          </div>
        </div>
      </div>

      {/* Timeframe selector toolbar */}
      <div className="panel flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-border bg-background p-1">
          {TIMEFRAMES.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTimeframe(t.key);
                const days = t.key === "7d" ? 7 : t.key === "30d" ? 30 : t.key === "90d" ? 90 : 365;
                setDateRange({
                  from: new Date(new Date().setDate(new Date().getDate() - days)),
                  to: new Date(),
                });
              }}
              className={cn(
                "rounded-lg px-3 py-1.5 font-mono-tab text-xs font-bold uppercase tracking-wider transition-colors",
                timeframe === t.key ? "bg-primary text-white shadow-sm" : "text-subtle hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono-tab">
          <Calendar className="size-4 text-primary" />
          <span>
            {dateRange.from.toLocaleDateString("en-PH")} — {dateRange.to.toLocaleDateString("en-PH")}
          </span>
        </div>
      </div>

      {isLoading || !data ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Top KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="panel flex flex-col justify-between rounded-2xl p-5 border border-border">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                    Total Revenue Collected
                  </span>
                  <p className="mt-2 font-mono-tab text-2xl font-black text-emerald-400">
                    {formatPeso(data.totalRevenue)}
                  </p>
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">Net settled fines</span>
                </div>
                <div className="grid size-10 place-items-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <TrendingUp className="size-5" />
                </div>
              </div>
            </div>

            <div className="panel flex flex-col justify-between rounded-2xl p-5 border border-border">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                    Citations Issued
                  </span>
                  <p className="mt-2 font-mono-tab text-2xl font-black text-white">
                    {data.totalCitations.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">Official notices</span>
                </div>
                <div className="grid size-10 place-items-center rounded-xl bg-primary/10 border border-primary/30 text-primary">
                  <FileText className="size-5" />
                </div>
              </div>
            </div>

            <div className="panel flex flex-col justify-between rounded-2xl p-5 border border-border">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                    Unsettled / In Hold
                  </span>
                  <p className="mt-2 font-mono-tab text-2xl font-black text-amber-400">
                    {data.unpaidCitations.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">LTO tagging eligible</span>
                </div>
                <div className="grid size-10 place-items-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <AlertTriangle className="size-5" />
                </div>
              </div>
            </div>

            <div className="panel flex flex-col justify-between rounded-2xl p-5 border border-border">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                    Clearance Compliance Rate
                  </span>
                  <p className="mt-2 font-mono-tab text-2xl font-black text-blue-400">
                    {data.totalCitations > 0
                      ? `${Math.round((data.settledCitations / data.totalCitations) * 100)}%`
                      : "100%"}
                  </p>
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">
                    {data.settledCitations} cleared tickets
                  </span>
                </div>
                <div className="grid size-10 place-items-center rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                  <CheckCircle2 className="size-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Area */}
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="panel lg:col-span-8 flex flex-col gap-4 rounded-2xl border border-border p-6 shadow-xl">
              <h2 className="text-base font-bold text-white">Daily Revenue Trajectory</h2>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.dailyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#888"
                      fontSize={11}
                      tickFormatter={(val) =>
                        new Date(val).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                      }
                    />
                    <YAxis
                      stroke="#888"
                      fontSize={11}
                      tickFormatter={(val) => `₱${val / 1000}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        borderColor: "#27272a",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                      formatter={(val: any) => [formatPeso(Number(val)), "Revenue"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      name="Revenue"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="panel lg:col-span-4 flex flex-col gap-4 rounded-2xl border border-border p-6 shadow-xl">
              <h2 className="text-base font-bold text-white">Top Offense Distribution</h2>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.topViolations}
                    layout="vertical"
                    margin={{ left: 10, right: 10, top: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
                    <XAxis type="number" stroke="#888" fontSize={11} />
                    <YAxis
                      dataKey="type"
                      type="category"
                      stroke="#888"
                      fontSize={10}
                      width={100}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        borderColor: "#27272a",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
