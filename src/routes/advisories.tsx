import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAdvisories, useCreateAdvisory, useToggleAdvisoryStatus } from "@/lib/data/advisories";
import { Loader2, Megaphone, Plus, AlertTriangle, Info, ShieldAlert, X, Radio, Eye, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/advisories")({
  head: () => ({
    meta: [{ title: "Public Advisories — Culiat Traffic Ops" }],
  }),
  component: AdvisoriesPage,
});

function AdvisoriesPage() {
  const { data: advisories, isLoading } = useAdvisories();
  const createAdvisory = useCreateAdvisory();
  const toggleStatus = useToggleAdvisoryStatus();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [corridor, setCorridor] = useState("Commonwealth Ave");
  const [severity, setSeverity] = useState<"Info" | "Warning" | "Critical">("Warning");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    createAdvisory.mutate(
      { title, message, severity, corridor },
      {
        onSuccess: () => {
          toast.success("Advisory Broadcasted!", {
            description: `Published to citizen portal and command center feeds.`,
          });
          setOpen(false);
          setTitle("");
          setMessage("");
        },
        onError: (err: any) => {
          toast.error("Failed to broadcast advisory", {
            description: err.message,
          });
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Megaphone className="size-6 text-blue-500" />
            Public Advisories
          </h1>
          <p className="text-sm text-muted-foreground">Broadcast live traffic updates and road closures to the Citizen Portal.</p>
        </div>
        
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90">
              <Plus className="size-4" />
              New Broadcast
            </button>
          </Dialog.Trigger>

          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-in fade-in" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-panel p-6 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2 text-primary font-bold text-lg">
                  <Megaphone className="size-5" />
                  <h3>Broadcast Public Advisory</h3>
                </div>
                <Dialog.Close asChild>
                  <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-panel-elevated hover:text-foreground">
                    <X className="size-4" />
                  </button>
                </Dialog.Close>
              </div>

              <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Advisory Title</label>
                  <input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Flash Flooding at Tandang Sora Underpass"
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Affected Corridor</label>
                    <input
                      required
                      value={corridor}
                      onChange={(e) => setCorridor(e.target.value)}
                      placeholder="e.g. Commonwealth Ave"
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Severity Level</label>
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value as any)}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="Info">Info (Routine Delay)</option>
                      <option value="Warning">Warning (Obstruction / Bottleneck)</option>
                      <option value="Critical">Critical (Flooding / Total Road Closure)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Advisory Message Details</label>
                  <textarea
                    required
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Provide motorists with re-routing guidance and expected duration..."
                    className="rounded-lg border border-border bg-background p-3 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="mt-2 flex justify-end gap-3 border-t border-border pt-4">
                  <Dialog.Close asChild>
                    <button type="button" className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-panel-elevated">
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    type="submit"
                    disabled={createAdvisory.isPending}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50"
                  >
                    {createAdvisory.isPending ? <Loader2 className="size-4 animate-spin" /> : <Radio className="size-4" />}
                    Broadcast Live
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {isLoading || !advisories ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4">
          {advisories.map((advisory) => {
            const Icon = advisory.severity === "Critical" ? ShieldAlert : advisory.severity === "Warning" ? AlertTriangle : Info;
            return (
              <div 
                key={advisory.id} 
                className={cn(
                  "panel flex flex-col gap-2 rounded-2xl border p-5 shadow-lg transition-colors",
                  advisory.severity === "Critical" ? "border-red-500/30 bg-red-500/5" :
                  advisory.severity === "Warning" ? "border-orange-500/30 bg-orange-500/5" :
                  "border-blue-500/30 bg-blue-500/5"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "grid size-10 place-items-center rounded-lg shrink-0",
                      advisory.severity === "Critical" ? "bg-red-500/20 text-red-500" :
                      advisory.severity === "Warning" ? "bg-orange-500/20 text-orange-500" :
                      "bg-blue-500/20 text-blue-500"
                    )}>
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">{advisory.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded font-bold",
                          advisory.severity === "Critical" ? "bg-red-500/20 text-red-400" :
                          advisory.severity === "Warning" ? "bg-orange-500/20 text-orange-400" :
                          "bg-blue-500/20 text-blue-400"
                        )}>
                          {advisory.severity}
                        </span>
                        <span>{new Date(advisory.publishedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <button
                      onClick={() => {
                        toggleStatus.mutate(
                          { id: advisory.id, active: !advisory.active, title: advisory.title },
                          {
                            onSuccess: () => {
                              toast.success(
                                advisory.active ? "Advisory moved to Archive" : "Advisory re-activated Live"
                              );
                            },
                          }
                        );
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-panel-elevated transition-colors"
                    >
                      {advisory.active ? <Archive className="size-3 text-amber-400" /> : <Eye className="size-3 text-emerald-400" />}
                      {advisory.active ? "Archive" : "Activate"}
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="relative flex size-2">
                         <span className={cn(
                           "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                           advisory.active ? "bg-emerald-400" : "bg-neutral-500"
                         )}></span>
                         <span className={cn(
                           "relative inline-flex size-2 rounded-full",
                           advisory.active ? "bg-emerald-500" : "bg-neutral-600"
                         )}></span>
                      </span>
                      <span className="text-xs font-semibold text-white">{advisory.active ? "Live" : "Archived"}</span>
                    </div>
                  </div>
                </div>

                <p className="mt-2 text-sm text-white/80 pl-0 sm:pl-13">
                  {advisory.message}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
