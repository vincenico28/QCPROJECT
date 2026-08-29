import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAutomationRules, useToggleRuleStatus, useCreateAutomationRule, Trigger, Action } from "@/lib/data/automation";
import { Loader2, Bot, Play, Pause, Plus, Zap, ArrowRight, ShieldAlert, RadioReceiver, Megaphone, X, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/automation")({
  head: () => ({
    meta: [{ title: "Automated Rules Engine — QC Command Center" }],
  }),
  component: AutomationPage,
});

function ActionBadge({ action }: { action: string }) {
  const getIcon = () => {
    switch (action) {
      case "Dispatch_Officer": return <RadioReceiver className="size-3" />;
      case "Broadcast_Advisory": return <Megaphone className="size-3" />;
      case "Notify_LGU": return <ShieldAlert className="size-3" />;
      default: return <Zap className="size-3" />;
    }
  };

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
      {getIcon()} {action.replace(/_/g, " ")}
    </span>
  );
}

function AutomationPage() {
  const { data: rules, isLoading } = useAutomationRules();
  const toggleStatus = useToggleRuleStatus();
  const createRule = useCreateAutomationRule();

  const [createOpen, setCreateOpen] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [trigger, setTrigger] = useState<Trigger>("AI_Accident_Detected");
  const [conditions, setConditions] = useState("Confidence > 90%");
  const [dispatchOfficer, setDispatchOfficer] = useState(true);
  const [broadcastAdvisory, setBroadcastAdvisory] = useState(true);
  const [notifyLgu, setNotifyLgu] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) return;

    const actions: Action[] = [];
    if (dispatchOfficer) actions.push("Dispatch_Officer");
    if (broadcastAdvisory) actions.push("Broadcast_Advisory");
    if (notifyLgu) actions.push("Notify_LGU");

    createRule.mutate(
      {
        name: ruleName.trim(),
        trigger,
        conditions: conditions.trim(),
        actions,
      },
      {
        onSuccess: () => {
          toast.success(`Automation rule "${ruleName}" activated!`);
          setCreateOpen(false);
          setRuleName("");
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Bot className="size-6 text-emerald-500" />
            Automated Rules Engine
          </h1>
          <p className="text-sm text-muted-foreground">Configure IF-THIS-THEN-THAT autonomous workflows for the Command Center.</p>
        </div>

        <Dialog.Root open={createOpen} onOpenChange={setCreateOpen}>
          <Dialog.Trigger asChild>
            <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500">
              <Plus className="size-4" />
              Create Rule
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-panel p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <div className="grid size-8 place-items-center rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Bot className="size-4" />
                  </div>
                  <Dialog.Title className="text-lg font-bold text-white">Create Automation Workflow</Dialog.Title>
                </div>
                <Dialog.Close asChild>
                  <button className="rounded-lg p-1 text-muted-foreground hover:bg-panel-elevated hover:text-white">
                    <X className="size-5" />
                  </button>
                </Dialog.Close>
              </div>

              <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rule Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Heavy Rain Flood Alert"
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-white placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Trigger (IF)</label>
                    <select
                      value={trigger}
                      onChange={(e) => setTrigger(e.target.value as Trigger)}
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-white focus:border-primary focus:outline-none"
                    >
                      <option value="AI_Accident_Detected">AI Accident Detected</option>
                      <option value="Congestion_Spike">Congestion Spike</option>
                      <option value="Weather_Alert">Weather Alert</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Conditions</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Confidence > 90%"
                      value={conditions}
                      onChange={(e) => setConditions(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-white placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions (THEN)</label>
                  <div className="mt-2 flex flex-col gap-2.5 rounded-xl border border-border bg-background/50 p-3">
                    <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={dispatchOfficer}
                        onChange={(e) => setDispatchOfficer(e.target.checked)}
                        className="rounded border-border bg-background text-primary focus:ring-0"
                      />
                      <span>Dispatch Nearest Traffic Officer</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={broadcastAdvisory}
                        onChange={(e) => setBroadcastAdvisory(e.target.checked)}
                        className="rounded border-border bg-background text-primary focus:ring-0"
                      />
                      <span>Broadcast Public Traffic Advisory</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifyLgu}
                        onChange={(e) => setNotifyLgu(e.target.checked)}
                        className="rounded border-border bg-background text-primary focus:ring-0"
                      />
                      <span>Notify QC Disaster Risk & LGU Ops</span>
                    </label>
                  </div>
                </div>

                <div className="mt-2 flex justify-end gap-3 border-t border-border pt-4">
                  <Dialog.Close asChild>
                    <button type="button" className="rounded-lg px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-panel-elevated">
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    type="submit"
                    disabled={createRule.isPending}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {createRule.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                    Save & Deploy Rule
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {isLoading || !rules ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4">
          {rules.map((rule) => (
            <div key={rule.id} className="panel rounded-2xl border border-border p-5 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-white text-lg">{rule.name}</h3>
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wider",
                      rule.status === "Active" ? "bg-emerald-500/20 text-emerald-400" : "bg-neutral-500/20 text-neutral-400"
                    )}>
                      {rule.status === "Active" ? <Play className="size-3" /> : <Pause className="size-3" />}
                      {rule.status}
                    </span>
                  </div>
                  
                  <div className="mt-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-6 bg-background/50 rounded-xl p-4 border border-border/50">
                     <div className="flex-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">IF (Trigger)</p>
                        <div className="flex items-center gap-2">
                           <div className="grid size-8 place-items-center rounded-lg bg-orange-500/20 text-orange-500">
                             <Zap className="size-4" />
                           </div>
                           <div>
                             <p className="font-semibold text-white">{rule.trigger.replace(/_/g, " ")}</p>
                             <p className="text-xs text-white/50">{rule.conditions}</p>
                           </div>
                        </div>
                     </div>
                     
                     <div className="hidden md:flex items-center justify-center">
                        <ArrowRight className="size-5 text-muted-foreground" />
                     </div>
                     
                     <div className="flex-1 border-t md:border-t-0 md:border-l border-border/50 pt-3 md:pt-0 md:pl-6">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">THEN (Actions)</p>
                        <div className="flex flex-wrap gap-2">
                           {rule.actions.map(action => (
                             <ActionBadge key={action} action={action} />
                           ))}
                        </div>
                     </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end justify-between border-t md:border-t-0 md:border-l border-border/50 pt-4 md:pt-0 md:pl-6 gap-4">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Last Triggered</p>
                    <p className="text-sm font-semibold text-white font-mono-tab mt-1">
                      {rule.lastTriggered ? new Date(rule.lastTriggered).toLocaleString() : "Never"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        toggleStatus.mutate(
                          { id: rule.id },
                          {
                            onSuccess: () => {
                              toast.info(`Rule "${rule.name}" is now ${rule.status === "Active" ? "Paused" : "Active"}`);
                            },
                          }
                        );
                      }}
                      disabled={toggleStatus.isPending}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors",
                        rule.status === "Active" ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30" : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                      )}
                    >
                      {rule.status === "Active" ? "Pause Rule" : "Resume Rule"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
