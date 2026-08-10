import { createFileRoute } from "@tanstack/react-router";
import { useDeveloperKeys } from "@/lib/data/developer";
import { Loader2, Code2, Key, Copy, Plus, Activity, BookOpen } from "lucide-react";

export const Route = createFileRoute("/developer")({
  head: () => ({
    meta: [{ title: "Developer API Portal — QC Command Center" }],
  }),
  component: DeveloperPage,
});

function DeveloperPage() {
  const { data: keys, isLoading } = useDeveloperKeys();

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Code2 className="size-6 text-purple-500" />
            Developer API Portal
          </h1>
          <p className="text-sm text-muted-foreground">Manage API keys for third-party integrations (Waze, MMDA, Google Maps).</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-panel-elevated px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/5">
            <BookOpen className="size-4" />
            Documentation
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-500">
            <Plus className="size-4" />
            Generate Key
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
           {isLoading || !keys ? (
            <div className="grid h-64 place-items-center">
              <Loader2 className="size-8 animate-spin text-purple-500" />
            </div>
          ) : (
            <div className="grid gap-4">
              {keys.map((apiKey) => (
                <div key={apiKey.id} className="panel rounded-2xl border border-border p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-purple-500/20 text-purple-500">
                      <Key className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{apiKey.name}</h3>
                      <div className="mt-2 flex items-center gap-2">
                         <code className="rounded bg-black/50 px-2 py-1 text-xs font-mono text-purple-300 border border-purple-500/30">
                           {apiKey.key}
                         </code>
                         <button className="text-muted-foreground hover:text-white transition-colors" title="Copy to clipboard">
                           <Copy className="size-4" />
                         </button>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">Created {new Date(apiKey.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-row md:flex-col gap-6 md:gap-2 items-center md:items-end justify-between border-t md:border-t-0 border-border/50 pt-4 md:pt-0">
                     <div className="text-left md:text-right">
                       <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Last Used</p>
                       <p className="text-sm font-semibold text-white mt-1">
                         {apiKey.lastUsed ? new Date(apiKey.lastUsed).toLocaleString() : "Never"}
                       </p>
                     </div>
                     <div className="text-left md:text-right">
                       <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">30D Requests</p>
                       <p className="text-sm font-semibold text-emerald-400 mt-1 flex items-center md:justify-end gap-1">
                         <Activity className="size-3" />
                         {apiKey.requestsLast30Days.toLocaleString()}
                       </p>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
           <div className="panel rounded-2xl border border-border p-5 shadow-lg">
              <h3 className="font-bold text-white mb-4">API Usage Summary</h3>
              <div className="flex flex-col gap-4">
                 <div className="flex justify-between items-center border-b border-border/50 pb-3">
                   <span className="text-sm text-muted-foreground">Total Requests (30D)</span>
                   <span className="font-mono-tab font-bold text-white">1,495,320</span>
                 </div>
                 <div className="flex justify-between items-center border-b border-border/50 pb-3">
                   <span className="text-sm text-muted-foreground">Active Keys</span>
                   <span className="font-mono-tab font-bold text-white">2</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-sm text-muted-foreground">Error Rate</span>
                   <span className="font-mono-tab font-bold text-emerald-400">0.01%</span>
                 </div>
              </div>
           </div>

           <div className="panel rounded-2xl border border-purple-500/30 bg-purple-500/5 p-5 shadow-lg">
              <h3 className="font-bold text-white">Webhooks</h3>
              <p className="text-xs text-muted-foreground mt-2 mb-4 leading-relaxed">
                Configure HTTP callbacks to receive real-time JSON payloads when AI cameras detect accidents or when rules trigger.
              </p>
              <button className="w-full rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20">
                Manage Webhooks
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
