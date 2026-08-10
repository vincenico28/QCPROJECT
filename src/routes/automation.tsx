import { createFileRoute } from "@tanstack/react-router";
import { useAutomationRules } from "@/lib/data/automation";
import { Loader2, Bot, Play, Pause, Plus, Zap, ArrowRight, ShieldAlert, RadioReceiver, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

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
      {getIcon()} {action.replace("_", " ")}
    </span>
  );
}

function AutomationPage() {
  const { data: rules, isLoading } = useAutomationRules();

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
        <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500">
          <Plus className="size-4" />
          Create Rule
        </button>
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
                    <button className="rounded border border-border bg-panel-elevated px-3 py-1 text-xs font-semibold text-white hover:bg-white/10 transition-colors">
                      Edit
                    </button>
                    <button className={cn(
                      "rounded px-3 py-1 text-xs font-semibold text-white transition-colors",
                      rule.status === "Active" ? "bg-orange-500/20 text-orange-500 hover:bg-orange-500/30" : "bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30"
                    )}>
                      {rule.status === "Active" ? "Pause" : "Resume"}
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
