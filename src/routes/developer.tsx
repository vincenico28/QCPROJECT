import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useDeveloperKeys, useCreateApiKey, useRevokeApiKey } from "@/lib/data/developer";
import { Loader2, Code2, Key, Copy, Plus, Activity, BookOpen, Trash2, X, CheckCircle2 } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/developer")({
  head: () => ({
    meta: [{ title: "Developer API Portal — QC Command Center" }],
  }),
  component: DeveloperPage,
});

function DeveloperPage() {
  const { data: keys, isLoading } = useDeveloperKeys();
  const createKey = useCreateApiKey();
  const revokeKey = useRevokeApiKey();

  const [createOpen, setCreateOpen] = useState(false);
  const [keyName, setKeyName] = useState("");

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    createKey.mutate(
      { name: keyName.trim() },
      {
        onSuccess: (newKey) => {
          toast.success(`API Key "${newKey.name}" created!`, {
            description: "Store your key securely. It has been authorized for QC LGU API endpoints.",
          });
          setCreateOpen(false);
          setKeyName("");
        },
      }
    );
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("API key copied to clipboard!");
  };

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
          <button
            onClick={() => toast.info("Opening API Documentation: https://api.qc-flow-guardian.gov.ph/docs")}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-panel-elevated px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/5"
          >
            <BookOpen className="size-4" />
            Documentation
          </button>

          <Dialog.Root open={createOpen} onOpenChange={setCreateOpen}>
            <Dialog.Trigger asChild>
              <button className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-500">
                <Plus className="size-4" />
                Generate Key
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-panel p-6 shadow-2xl">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="flex items-center gap-2">
                    <div className="grid size-8 place-items-center rounded-lg bg-purple-500/20 text-purple-400">
                      <Key className="size-4" />
                    </div>
                    <Dialog.Title className="text-lg font-bold text-white">Generate API Key</Dialog.Title>
                  </div>
                  <Dialog.Close asChild>
                    <button className="rounded-lg p-1 text-muted-foreground hover:bg-panel-elevated hover:text-white">
                      <X className="size-5" />
                    </button>
                  </Dialog.Close>
                </div>

                <form onSubmit={handleGenerate} className="mt-4 flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Application / Service Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Google Maps Transit Feed"
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-white placeholder:text-muted-foreground/50 focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This key will grant read access to Quezon City real-time traffic speeds, camera telemetry, and active advisories.
                  </p>

                  <div className="mt-2 flex justify-end gap-3 border-t border-border pt-4">
                    <Dialog.Close asChild>
                      <button type="button" className="rounded-lg px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-panel-elevated">
                        Cancel
                      </button>
                    </Dialog.Close>
                    <button
                      type="submit"
                      disabled={createKey.isPending}
                      className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 disabled:opacity-50"
                    >
                      {createKey.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                      Generate Key
                    </button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
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
                         <button
                           onClick={() => handleCopy(apiKey.key)}
                           className="text-muted-foreground hover:text-white transition-colors"
                           title="Copy to clipboard"
                         >
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
                     <div className="flex items-center gap-3">
                       <div className="text-left md:text-right">
                         <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">30D Requests</p>
                         <p className="text-sm font-semibold text-emerald-400 mt-1 flex items-center md:justify-end gap-1">
                           <Activity className="size-3" />
                           {apiKey.requestsLast30Days.toLocaleString()}
                         </p>
                       </div>
                       <button
                         onClick={() => {
                           revokeKey.mutate({ id: apiKey.id });
                           toast.error(`Revoked API key: ${apiKey.name}`);
                         }}
                         className="rounded-lg p-2 text-muted-foreground hover:bg-red-500/20 hover:text-red-400 transition-colors"
                         title="Revoke API Key"
                       >
                         <Trash2 className="size-4" />
                       </button>
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
                   <span className="font-mono-tab font-bold text-white">{keys?.length || 2}</span>
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
              <button
                onClick={() => toast.info("Webhook endpoints live: https://webhook.qc-flow-guardian.gov.ph/events")}
                className="w-full rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20"
              >
                Manage Webhooks
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
