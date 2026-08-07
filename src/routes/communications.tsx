import { createFileRoute } from "@tanstack/react-router";
import { useEmailLogs } from "@/lib/data/communications";
import { Loader2, Mail, CheckCircle2, AlertTriangle, Send, MailOpen, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/communications")({
  head: () => ({
    meta: [{ title: "Communications Center — Culiat Traffic Ops" }],
  }),
  component: CommunicationsPage,
});

function CommunicationsPage() {
  const { data: logs, isLoading } = useEmailLogs();

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Communications Center</h1>
          <p className="text-sm text-muted-foreground">Monitor automated email dispatch statuses to citizens.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-panel px-4 py-2 text-sm text-white">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
            </span>
            SMTP Edge Healthy
          </div>
        </div>
      </div>

      {isLoading || !logs ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Email Stats */}
          <div className="panel col-span-1 flex flex-col gap-4 rounded-2xl border border-border/50 p-6 shadow-lg">
             <div className="flex items-center gap-3 border-b border-border/50 pb-4">
              <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <Mail className="size-5" />
              </div>
              <div>
                <h2 className="font-semibold text-white">Today's Dispatch</h2>
                <p className="text-xs text-muted-foreground">Total sent via Edge Functions</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-4 mt-2">
               <div className="flex items-center justify-between">
                 <span className="flex items-center gap-2 text-sm text-muted-foreground">
                   <Send className="size-4 text-primary" />
                   Total Processed
                 </span>
                 <span className="font-mono-tab font-bold text-white text-lg">1,248</span>
               </div>
               <div className="flex items-center justify-between">
                 <span className="flex items-center gap-2 text-sm text-muted-foreground">
                   <CheckCircle2 className="size-4 text-emerald-500" />
                   Successfully Delivered
                 </span>
                 <span className="font-mono-tab font-bold text-emerald-400 text-lg">1,235</span>
               </div>
               <div className="flex items-center justify-between">
                 <span className="flex items-center gap-2 text-sm text-muted-foreground">
                   <AlertTriangle className="size-4 text-red-500" />
                   Bounced / Failed
                 </span>
                 <span className="font-mono-tab font-bold text-red-400 text-lg">13</span>
               </div>
            </div>
          </div>

          {/* Delivery Log */}
          <div className="panel lg:col-span-2 flex flex-col gap-4 rounded-2xl border border-border/50 p-6 shadow-lg h-[500px] overflow-hidden">
             <div className="flex items-center justify-between border-b border-border/50 pb-4">
               <h2 className="font-semibold text-white">Live Delivery Stream</h2>
               <div className="text-xs text-muted-foreground flex items-center gap-1">
                 <Clock className="size-3" /> Auto-refreshing
               </div>
             </div>
             
             <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3 custom-scrollbar">
                {logs.map(log => (
                  <div key={log.id} className="flex flex-col gap-2 rounded-lg border border-border bg-background/50 p-3">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1 pr-4">
                        <p className="text-sm font-medium text-white truncate">{log.subject}</p>
                        <p className="text-xs text-muted-foreground truncate">{log.recipient}</p>
                      </div>
                      <span className={cn(
                        "shrink-0 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        log.status === "Delivered" ? "bg-emerald-500/20 text-emerald-500" :
                        log.status === "Bounced" ? "bg-red-500/20 text-red-500" : "bg-yellow-500/20 text-yellow-500"
                      )}>
                        {log.status === "Delivered" && <CheckCircle2 className="size-3" />}
                        {log.status === "Bounced" && <AlertTriangle className="size-3" />}
                        {log.status === "Pending" && <Clock className="size-3" />}
                        {log.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border/30 pt-2 text-[10px] text-muted-foreground">
                      <span className="font-mono-tab">{log.id}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
