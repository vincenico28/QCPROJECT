import { createFileRoute } from "@tanstack/react-router";
import { useAuditLogs } from "@/lib/data/audit";
import { Loader2, ShieldAlert, User, Activity, Globe, Download, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/audit-logs")({
  head: () => ({
    meta: [{ title: "Security Audit Logs — Culiat Traffic Ops" }],
  }),
  component: AuditLogsPage,
});

function AuditLogsPage() {
  const { data: logs, isLoading } = useAuditLogs();

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Security & Audit Logs</h1>
          <p className="text-sm text-muted-foreground">Immutable ledger of all administrative and financial actions.</p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-panel border border-border px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-panel-elevated"
        >
          <Download className="size-4" />
          Export Secure Log
        </button>
      </div>

      {isLoading || !logs ? (
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
                  {logs.map((log) => (
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
