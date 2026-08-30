import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useAuditLogs } from "@/lib/data/audit";
import { Loader2, ShieldAlert, User, Activity, Globe, Download, AlertTriangle, Search, Filter, ShieldCheck, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/audit-logs")({
  head: () => ({
    meta: [{ title: "Security Audit Logs — Culiat Traffic Ops" }],
  }),
  component: AuditLogsPage,
});

function AuditLogsPage() {
  const { data: logs = [], isLoading } = useAuditLogs();
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<"all" | "info" | "warning" | "critical">("all");

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSeverity = severityFilter === "all" || log.severity === severityFilter;
      if (!matchesSeverity) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        log.user.toLowerCase().includes(q) ||
        log.role.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.target.toLowerCase().includes(q) ||
        log.id.toLowerCase().includes(q)
      );
    });
  }, [logs, search, severityFilter]);

  const stats = useMemo(() => {
    const total = logs.length;
    const critical = logs.filter((l) => l.severity === "critical").length;
    const warning = logs.filter((l) => l.severity === "warning").length;
    const info = logs.filter((l) => l.severity === "info").length;
    return { total, critical, warning, info };
  }, [logs]);

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error("No audit logs to export");
      return;
    }

    const headers = ["Log ID", "Timestamp", "User / Actor", "Role", "Action", "Target Resource", "IP Address", "Severity"];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.timestamp,
      `"${l.user}"`,
      `"${l.role}"`,
      `"${l.action}"`,
      `"${l.target}"`,
      l.ipAddress,
      l.severity,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `qc-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${filteredLogs.length} audit log records to CSV`);
  };

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="size-6 text-primary" />
            Security & Audit Logs
          </h1>
          <p className="text-sm text-muted-foreground">Immutable ledger of all administrative, dispatch, and financial actions.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 rounded-lg bg-panel border border-border px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-panel-elevated"
        >
          <Download className="size-4" />
          Export Secure Log (CSV)
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-panel p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Audited Events</p>
          <p className="mt-1 text-2xl font-black text-white">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">Info Events</p>
          <p className="mt-1 text-2xl font-black text-blue-400">{stats.info}</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">Warning Modifications</p>
          <p className="mt-1 text-2xl font-black text-amber-400">{stats.warning}</p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-400">Critical / Security Alerts</p>
          <p className="mt-1 text-2xl font-black text-red-400">{stats.critical}</p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by actor, role, action, or target..."
            className="w-full rounded-lg border border-border bg-panel pl-9 pr-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <div className="inline-flex rounded-lg border border-border bg-panel p-1">
            {(["all", "info", "warning", "critical"] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors",
                  severityFilter === sev
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-2xl border border-border/50 bg-panel shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-white">
                <thead className="bg-black/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-medium tracking-wider">Timestamp / ID</th>
                    <th className="px-6 py-4 font-medium tracking-wider">User</th>
                    <th className="px-6 py-4 font-medium tracking-wider">Action & Target</th>
                    <th className="px-6 py-4 font-medium tracking-wider">IP Address</th>
                    <th className="px-6 py-4 font-medium tracking-wider text-right">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground">
                        No audit log events match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="transition-colors hover:bg-white/5">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-medium">{new Date(log.timestamp).toLocaleString()}</span>
                            <span className="font-mono-tab text-[10px] text-muted-foreground mt-0.5">{log.id}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                             <div className="grid size-6 place-items-center rounded-full bg-white/10 text-muted-foreground">
                               <User className="size-3" />
                             </div>
                             <div className="flex flex-col">
                               <span className="font-medium">{log.user}</span>
                               <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">{log.role}</span>
                             </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-2">
                            <Activity className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                            <div className="flex flex-col">
                               <span className="font-medium">{log.action}</span>
                               <span className="text-xs text-muted-foreground mt-0.5">{log.target}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Globe className="size-3" />
                            <span className="font-mono-tab text-xs">{log.ipAddress}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                           <span className={cn(
                             "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                             log.severity === "info" ? "bg-blue-500/10 text-blue-400" :
                             log.severity === "warning" ? "bg-yellow-500/10 text-yellow-500" : "bg-red-500/20 text-red-500"
                           )}>
                             {log.severity === "critical" && <AlertTriangle className="size-3" />}
                             {log.severity === "warning" && <ShieldAlert className="size-3" />}
                             {log.severity}
                           </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
