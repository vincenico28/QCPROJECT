import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  useAutomationRules,
  useRuleExecutions,
  useToggleRuleStatus,
  useCreateAutomationRule,
  useSimulateRule,
  Trigger,
  Action,
} from "@/lib/data/automation";
import {
  Loader2,
  Bot,
  Play,
  Pause,
  Plus,
  Zap,
  ArrowRight,
  ShieldAlert,
  RadioReceiver,
  Megaphone,
  X,
  CheckCircle2,
  Activity,
  Clock,
  Radio,
  Sliders,
  Sparkles,
  Layers,
  History,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/automation")({
  head: () => ({
    meta: [{ title: "Automated Rules Engine & Orchestration — QC Flow Guardian" }],
  }),
  component: AutomationPage,
});

function ActionBadge({ action }: { action: string }) {
  const getIcon = () => {
    switch (action) {
      case "Dispatch_Officer":
        return <RadioReceiver className="size-3" />;
      case "Broadcast_Advisory":
        return <Megaphone className="size-3" />;
      case "Notify_LGU":
        return <ShieldAlert className="size-3" />;
      case "Adjust_Signal_Timing":
        return <Sliders className="size-3" />;
      case "Trigger_Variable_Message_Sign":
        return <Radio className="size-3" />;
      default:
        return <Zap className="size-3" />;
    }
  };

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/25 px-2.5 py-1 text-[10px] font-mono-tab font-bold uppercase tracking-wider text-primary">
      {getIcon()} {action.replace(/_/g, " ")}
    </span>
  );
}

function TriggerIcon({ trigger }: { trigger: Trigger }) {
  switch (trigger) {
    case "AI_Accident_Detected":
      return <ShieldAlert className="size-4 text-red-400" />;
    case "Congestion_Spike":
      return <Zap className="size-4 text-orange-400" />;
    case "Weather_Alert":
      return <Activity className="size-4 text-blue-400" />;
    case "Counterflow_Surge":
      return <RadioReceiver className="size-4 text-purple-400" />;
    case "Speeding_Cluster":
      return <Sparkles className="size-4 text-yellow-400" />;
    default:
      return <Zap className="size-4 text-primary" />;
  }
}

function AutomationPage() {
  const { data: rules = [], isLoading: loadingRules } = useAutomationRules();
  const { data: executions = [], isLoading: loadingExecs } = useRuleExecutions();
  const toggleStatus = useToggleRuleStatus();
  const createRule = useCreateAutomationRule();
  const simulateRule = useSimulateRule();

  const [activeTab, setActiveTab] = useState<"rules" | "history">("rules");
  const [createOpen, setCreateOpen] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [trigger, setTrigger] = useState<Trigger>("AI_Accident_Detected");
  const [conditions, setConditions] = useState("Optical Confidence > 90%");
  const [dispatchOfficer, setDispatchOfficer] = useState(true);
  const [broadcastAdvisory, setBroadcastAdvisory] = useState(true);
  const [notifyLgu, setNotifyLgu] = useState(false);
  const [adjustSignals, setAdjustSignals] = useState(false);
  const [triggerVms, setTriggerVms] = useState(false);

  const activeCount = rules.filter((r) => r.status === "Active").length;
  const totalTriggers = rules.reduce((acc, r) => acc + (r.triggerCount || 0), 0);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) return;

    const actions: Action[] = [];
    if (dispatchOfficer) actions.push("Dispatch_Officer");
    if (broadcastAdvisory) actions.push("Broadcast_Advisory");
    if (notifyLgu) actions.push("Notify_LGU");
    if (adjustSignals) actions.push("Adjust_Signal_Timing");
    if (triggerVms) actions.push("Trigger_Variable_Message_Sign");

    createRule.mutate(
      {
        name: ruleName.trim(),
        trigger,
        conditions: conditions.trim(),
        actions,
      },
      {
        onSuccess: () => {
          toast.success(`Autonomous workflow "${ruleName}" activated!`);
          setCreateOpen(false);
          setRuleName("");
        },
      }
    );
  };

  const handleSimulate = (ruleId: string, ruleName: string) => {
    simulateRule.mutate(
      { id: ruleId },
      {
        onSuccess: (exec) => {
          toast.success(`Rule "${ruleName}" simulated in ${exec.executionTimeMs}ms!`, {
            description: `${exec.actionsExecuted.length} automated actions dispatched to edge grid.`,
          });
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 text-foreground">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono-tab text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
              AUTONOMOUS EDGE ORCHESTRATION
            </span>
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-xs text-subtle">· IF-THIS-THEN-THAT Policy Daemon</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2 mt-1">
            <Bot className="size-6 text-emerald-500" />
            Automated Rules Engine
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure sub-second autonomous triggers between optical AI detections, patrol dispatch, dynamic traffic light phasing, and public broadcast notices.
          </p>
        </div>

        <Dialog.Root open={createOpen} onOpenChange={setCreateOpen}>
          <Dialog.Trigger asChild>
            <button className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 transition-colors hover:bg-emerald-500">
              <Plus className="size-4" />
              Create Automation Workflow
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-panel p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <div className="grid size-9 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Bot className="size-5" />
                  </div>
                  <div>
                    <Dialog.Title className="text-base font-bold text-white">Create Automation Workflow</Dialog.Title>
                    <p className="text-[11px] text-muted-foreground">Autonomous event pipeline builder</p>
                  </div>
                </div>
                <Dialog.Close asChild>
                  <button className="rounded-xl p-1 text-muted-foreground hover:bg-panel-elevated hover:text-white">
                    <X className="size-5" />
                  </button>
                </Dialog.Close>
              </div>

              <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-4">
                <div>
                  <label className="font-mono-tab text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Workflow Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Commonwealth Rapid Signal Green Wave"
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-white placeholder:text-muted-foreground/50 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-mono-tab text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Trigger Event (IF)
                    </label>
                    <select
                      value={trigger}
                      onChange={(e) => setTrigger(e.target.value as Trigger)}
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-semibold text-white focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="AI_Accident_Detected">AI Collision / Accident</option>
                      <option value="Congestion_Spike">Congestion Density Spike</option>
                      <option value="Weather_Alert">Heavy Rainfall / Flooding</option>
                      <option value="Counterflow_Surge">Counterflow Hazard</option>
                      <option value="Speeding_Cluster">Speeding Cluster (&gt; 80 kph)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-mono-tab text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Evaluation Condition
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Optical Confidence > 90%"
                      value={conditions}
                      onChange={(e) => setConditions(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-white placeholder:text-muted-foreground/50 focus:border-emerald-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-mono-tab text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Automated Actions (THEN)
                  </label>
                  <div className="mt-2 grid grid-cols-1 gap-2 rounded-2xl border border-border bg-background/50 p-3">
                    <label className="flex items-center gap-2.5 text-xs text-white cursor-pointer p-1">
                      <input
                        type="checkbox"
                        checked={dispatchOfficer}
                        onChange={(e) => setDispatchOfficer(e.target.checked)}
                        className="size-4 rounded border-border bg-background text-emerald-500 focus:ring-0"
                      />
                      <span>Dispatch Nearest Available Field Unit (GPS Radius 1.5km)</span>
                    </label>
                    <label className="flex items-center gap-2.5 text-xs text-white cursor-pointer p-1">
                      <input
                        type="checkbox"
                        checked={broadcastAdvisory}
                        onChange={(e) => setBroadcastAdvisory(e.target.checked)}
                        className="size-4 rounded border-border bg-background text-emerald-500 focus:ring-0"
                      />
                      <span>Broadcast Public Traffic Advisory (Web Portal & Waze API)</span>
                    </label>
                    <label className="flex items-center gap-2.5 text-xs text-white cursor-pointer p-1">
                      <input
                        type="checkbox"
                        checked={notifyLgu}
                        onChange={(e) => setNotifyLgu(e.target.checked)}
                        className="size-4 rounded border-border bg-background text-emerald-500 focus:ring-0"
                      />
                      <span>Notify QC Disaster Risk Reduction & Emergency Rescue (CDRRMO)</span>
                    </label>
                    <label className="flex items-center gap-2.5 text-xs text-white cursor-pointer p-1">
                      <input
                        type="checkbox"
                        checked={adjustSignals}
                        onChange={(e) => setAdjustSignals(e.target.checked)}
                        className="size-4 rounded border-border bg-background text-emerald-500 focus:ring-0"
                      />
                      <span>Extend Green Light Phasing on Outbound Lanes (+15s Dynamic Phasing)</span>
                    </label>
                    <label className="flex items-center gap-2.5 text-xs text-white cursor-pointer p-1">
                      <input
                        type="checkbox"
                        checked={triggerVms}
                        onChange={(e) => setTriggerVms(e.target.checked)}
                        className="size-4 rounded border-border bg-background text-emerald-500 focus:ring-0"
                      />
                      <span>Update Electronic Overhead Variable Message Signs (VMS Billboard)</span>
                    </label>
                  </div>
                </div>

                <div className="mt-2 flex justify-end gap-3 border-t border-border pt-4">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="rounded-xl px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-panel-elevated"
                    >
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    type="submit"
                    disabled={createRule.isPending}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {createRule.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                    Deploy Automated Rule
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {/* Telemetry KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border/50 bg-panel/60 p-4 backdrop-blur-md">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Bot className="size-4 text-emerald-400" />
            <span className="font-mono-tab uppercase tracking-wider text-[11px]">Active Daemon Workflows</span>
          </div>
          <div className="text-xl font-bold text-white mt-1 font-mono-tab">
            {activeCount} <span className="text-xs font-normal text-subtle">of {rules.length} rules</span>
          </div>
          <p className="text-[11px] text-emerald-400/90 mt-0.5">Autonomous execution enabled</p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-panel/60 p-4 backdrop-blur-md">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Zap className="size-4 text-orange-400" />
            <span className="font-mono-tab uppercase tracking-wider text-[11px]">Autonomous Triggers (30D)</span>
          </div>
          <div className="text-xl font-bold text-white mt-1 font-mono-tab">{totalTriggers}</div>
          <p className="text-[11px] text-orange-400/90 mt-0.5">Automated field interventions</p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-panel/60 p-4 backdrop-blur-md">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Clock className="size-4 text-primary" />
            <span className="font-mono-tab uppercase tracking-wider text-[11px]">Average Trigger Latency</span>
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1 font-mono-tab">26ms</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Detection to action latency</p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-panel/60 p-4 backdrop-blur-md">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Sparkles className="size-4 text-purple-400" />
            <span className="font-mono-tab uppercase tracking-wider text-[11px]">Reliability Rate</span>
          </div>
          <div className="text-xl font-bold text-white mt-1 font-mono-tab">99.8%</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Deterministic pipeline verification</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border/60 pb-1 gap-2">
        <button
          onClick={() => setActiveTab("rules")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
            activeTab === "rules"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
              : "text-muted-foreground hover:text-white hover:bg-panel"
          )}
        >
          <Layers className="size-3.5" />
          Active Policy Rules ({rules.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
            activeTab === "history"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
              : "text-muted-foreground hover:text-white hover:bg-panel"
          )}
        >
          <History className="size-3.5" />
          Live Trigger Audit Log ({executions.length})
        </button>
      </div>

      {/* TAB 1: RULES LIST */}
      {activeTab === "rules" && (
        <div className="flex flex-col gap-4">
          {loadingRules ? (
            <div className="grid h-64 place-items-center rounded-3xl border border-border bg-panel">
              <Loader2 className="size-8 animate-spin text-emerald-500" />
            </div>
          ) : (
            rules.map((rule) => (
              <div
                key={rule.id}
                className="panel rounded-3xl border border-border p-6 shadow-xl bg-panel transition-all hover:border-border-strong"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-bold text-white text-lg tracking-tight">{rule.name}</h3>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider font-mono-tab",
                          rule.status === "Active"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-neutral-500/20 text-neutral-400 border border-neutral-500/30"
                        )}
                      >
                        {rule.status === "Active" ? <Play className="size-3" /> : <Pause className="size-3" />}
                        {rule.status}
                      </span>
                      <span className="font-mono-tab text-xs text-subtle">
                        Triggered: <strong className="text-white">{rule.triggerCount || 0} times</strong>
                      </span>
                    </div>

                    <div className="mt-4 flex flex-col md:flex-row md:items-center gap-4 bg-background/50 rounded-2xl p-4 border border-border/50">
                      <div className="flex-1">
                        <p className="text-[10px] font-mono-tab font-bold uppercase tracking-wider text-muted-foreground mb-1">
                          IF Trigger Condition
                        </p>
                        <div className="flex items-center gap-2.5">
                          <div className="grid size-9 place-items-center rounded-xl bg-orange-500/20 border border-orange-500/30">
                            <TriggerIcon trigger={rule.trigger} />
                          </div>
                          <div>
                            <p className="font-semibold text-white text-xs">{rule.trigger.replace(/_/g, " ")}</p>
                            <p className="font-mono text-[11px] text-orange-400/90">{rule.conditions}</p>
                          </div>
                        </div>
                      </div>

                      <div className="hidden md:flex items-center justify-center">
                        <ArrowRight className="size-5 text-muted-foreground" />
                      </div>

                      <div className="flex-1 border-t md:border-t-0 md:border-l border-border/50 pt-3 md:pt-0 md:pl-5">
                        <p className="text-[10px] font-mono-tab font-bold uppercase tracking-wider text-muted-foreground mb-2">
                          THEN Actions Dispatched
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {rule.actions.map((action) => (
                            <ActionBadge key={action} action={action} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 md:border-l border-border/50 pt-4 md:pt-0 md:pl-6 gap-3">
                    <div className="text-left md:text-right">
                      <p className="text-[10px] font-mono-tab uppercase text-muted-foreground">Last Triggered</p>
                      <p className="text-xs font-semibold text-white font-mono-tab mt-0.5">
                        {rule.lastTriggered ? new Date(rule.lastTriggered).toLocaleString() : "Never"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSimulate(rule.id, rule.name)}
                        disabled={simulateRule.isPending}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel-elevated px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-white/10 transition-colors disabled:opacity-50"
                        title="Simulate rule execution and log to trigger stream"
                      >
                        <Zap className="size-3.5 text-yellow-400" />
                        Test Run
                      </button>

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
                          "rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors",
                          rule.status === "Active"
                            ? "bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                        )}
                      >
                        {rule.status === "Active" ? "Pause" : "Resume"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: LIVE TRIGGER EXECUTION AUDIT LOG */}
      {activeTab === "history" && (
        <div className="panel rounded-3xl border border-border p-6 shadow-2xl bg-panel">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-4">
            <div>
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <History className="size-5 text-emerald-500" />
                Autonomous Event Execution Stream
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Detailed audit trail of autonomous policy decisions executed by edge nodes.
              </p>
            </div>
            <span className="font-mono-tab text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">
              REAL-TIME AUDIT SYNC
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/40 text-[11px] font-mono-tab uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 px-3">Execution Ref</th>
                  <th className="py-3 px-3">Rule Name & Condition</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3">Actions Executed</th>
                  <th className="py-3 px-3">Latency</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30 font-mono-tab text-xs">
                {executions.map((exec) => (
                  <tr key={exec.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-3 font-bold text-white">
                      <div>{exec.id}</div>
                      <div className="text-[10px] text-muted-foreground font-normal">
                        {new Date(exec.triggeredAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-sans font-semibold text-white">{exec.ruleName}</div>
                      <div className="text-[11px] text-orange-400/90 font-normal">{exec.triggerEvent}</div>
                    </td>
                    <td className="py-3.5 px-3 font-sans text-subtle text-xs">{exec.location}</td>
                    <td className="py-3.5 px-3">
                      <div className="flex flex-col gap-1">
                        {exec.actionsExecuted.map((act, i) => (
                          <span key={i} className="text-[10px] text-emerald-400 flex items-center gap-1 font-sans">
                            <Check className="size-3 text-emerald-400 shrink-0" />
                            {act}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-emerald-400 font-bold">{exec.executionTimeMs}ms</td>
                    <td className="py-3.5 px-3 text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 uppercase">
                        {exec.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

