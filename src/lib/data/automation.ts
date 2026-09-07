import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Trigger =
  | "AI_Accident_Detected"
  | "Congestion_Spike"
  | "Weather_Alert"
  | "Counterflow_Surge"
  | "Speeding_Cluster";

export type Action =
  | "Dispatch_Officer"
  | "Broadcast_Advisory"
  | "Notify_LGU"
  | "Adjust_Signal_Timing"
  | "Trigger_Variable_Message_Sign";

export type AutomationRule = {
  id: string;
  name: string;
  trigger: Trigger;
  conditions: string;
  actions: Action[];
  status: "Active" | "Paused";
  lastTriggered: string | null;
  triggerCount?: number;
};

export type RuleExecution = {
  id: string;
  ruleId: string;
  ruleName: string;
  triggeredAt: string;
  triggerEvent: string;
  location: string;
  actionsExecuted: string[];
  executionTimeMs: number;
  status: "SUCCESS" | "WARNING";
};

let MOCK_RULES: AutomationRule[] = [
  {
    id: "RULE-001",
    name: "Severe Collision Rapid Response Protocol",
    trigger: "AI_Accident_Detected",
    conditions: "Optical Confidence > 90% AND Multiple Vehicles Involved",
    actions: ["Dispatch_Officer", "Broadcast_Advisory", "Notify_LGU"],
    status: "Active",
    lastTriggered: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    triggerCount: 38,
  },
  {
    id: "RULE-002",
    name: "Commonwealth Arterial Congestion Surge Rerouting",
    trigger: "Congestion_Spike",
    conditions: "Traffic Density > 85% on Commonwealth Ave Corridor",
    actions: ["Broadcast_Advisory", "Trigger_Variable_Message_Sign", "Adjust_Signal_Timing"],
    status: "Active",
    lastTriggered: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    triggerCount: 84,
  },
  {
    id: "RULE-003",
    name: "Typhoon Protocol & Flooding Diversion",
    trigger: "Weather_Alert",
    conditions: "Rainfall > 35mm/hr OR Water Sensor Level > 0.4m",
    actions: ["Broadcast_Advisory", "Notify_LGU", "Trigger_Variable_Message_Sign"],
    status: "Paused",
    lastTriggered: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    triggerCount: 14,
  },
  {
    id: "RULE-004",
    name: "High-Risk Counterflow Interception Alert",
    trigger: "Counterflow_Surge",
    conditions: "Vehicle cross-median traversal confirmed on 2+ cameras",
    actions: ["Dispatch_Officer", "Broadcast_Advisory"],
    status: "Active",
    lastTriggered: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    triggerCount: 22,
  },
];

let MOCK_EXECUTIONS: RuleExecution[] = [
  {
    id: "EXEC-0941",
    ruleId: "RULE-002",
    ruleName: "Commonwealth Arterial Congestion Surge Rerouting",
    triggeredAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    triggerEvent: "Corridor density reached 88.4% (Threshold: >85%)",
    location: "Commonwealth Ave — Litex to Sandiganbayan",
    actionsExecuted: ["Broadcasted Public Advisory ADV-104", "Updated VMS Billboard #02", "Extended Green Phase +18s"],
    executionTimeMs: 24,
    status: "SUCCESS",
  },
  {
    id: "EXEC-0940",
    ruleId: "RULE-001",
    ruleName: "Severe Collision Rapid Response Protocol",
    triggeredAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    triggerEvent: "2-Vehicle Side-Swipe detected with 94.2% AI confidence",
    location: "Katipunan Ave cor. Aurora Flyover",
    actionsExecuted: ["Dispatched Patrol Unit #7742", "Broadcasted Advisory", "Pushed GeoJSON notice to QC Disaster Ops"],
    executionTimeMs: 38,
    status: "SUCCESS",
  },
  {
    id: "EXEC-0939",
    ruleId: "RULE-004",
    ruleName: "High-Risk Counterflow Interception Alert",
    triggeredAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    triggerEvent: "Sedan traversing northbound in southbound express lane",
    location: "Visayas Ave near Central Market",
    actionsExecuted: ["Alerted Highway Patrol Sector Unit 3", "Broadcasted Urgent Proximity Warning"],
    executionTimeMs: 19,
    status: "SUCCESS",
  },
];

export function useAutomationRules() {
  return useQuery({
    queryKey: ["automation-rules"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return [...MOCK_RULES];
    },
  });
}

export function useRuleExecutions() {
  return useQuery({
    queryKey: ["automation-executions"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return [...MOCK_EXECUTIONS];
    },
  });
}

export function useToggleRuleStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const rule = MOCK_RULES.find((r) => r.id === id);
      if (rule) {
        rule.status = rule.status === "Active" ? "Paused" : "Active";
        // Record audit log
        try {
          await supabase.from("audit_logs").insert({
            actor_name: "Operations Dispatcher",
            actor_role: "admin",
            action: `AUTOMATION_RULE_${rule.status.toUpperCase()}`,
            target_resource: `Rule: ${rule.name}`,
            details: `Status toggled to ${rule.status}`,
          });
        } catch (err) {
          console.warn(err);
        }
      }
      return rule;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automation-rules"] });
    },
  });
}

export function useSimulateRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      await new Promise((resolve) => setTimeout(resolve, 350));
      const rule = MOCK_RULES.find((r) => r.id === id);
      if (!rule) throw new Error("Rule not found");

      const ms = Math.floor(18 + Math.random() * 28);
      const newExec: RuleExecution = {
        id: `EXEC-${Math.floor(1000 + Math.random() * 9000)}`,
        ruleId: rule.id,
        ruleName: rule.name,
        triggeredAt: new Date().toISOString(),
        triggerEvent: `Simulated trigger event: ${rule.conditions}`,
        location: "Quezon City Automated Sentinel Corridor",
        actionsExecuted: rule.actions.map((a) => `Executed: ${a.replace(/_/g, " ")}`),
        executionTimeMs: ms,
        status: "SUCCESS",
      };

      rule.lastTriggered = new Date().toISOString();
      rule.triggerCount = (rule.triggerCount || 0) + 1;
      MOCK_EXECUTIONS.unshift(newExec);

      try {
        await supabase.from("audit_logs").insert({
          actor_name: "Operations Dispatcher",
          actor_role: "admin",
          action: "AUTOMATION_RULE_SIMULATED",
          target_resource: `Rule: ${rule.name}`,
          details: `Manual test execution completed in ${ms}ms with ${rule.actions.length} actions`,
        });
      } catch (err) {
        console.warn(err);
      }

      return newExec;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automation-rules"] });
      qc.invalidateQueries({ queryKey: ["automation-executions"] });
    },
  });
}

export function useCreateAutomationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; trigger: Trigger; conditions: string; actions: Action[] }) => {
      const newRule: AutomationRule = {
        id: `RULE-${String(MOCK_RULES.length + 1).padStart(3, "0")}`,
        name: input.name,
        trigger: input.trigger,
        conditions: input.conditions,
        actions: input.actions,
        status: "Active",
        lastTriggered: null,
        triggerCount: 0,
      };
      MOCK_RULES.unshift(newRule);

      try {
        await supabase.from("audit_logs").insert({
          actor_name: "Operations Dispatcher",
          actor_role: "admin",
          action: "AUTOMATION_RULE_CREATED",
          target_resource: `Rule: ${input.name}`,
          details: `Trigger: ${input.trigger}, Actions: ${input.actions.join(", ")}`,
        });
      } catch (err) {
        console.warn(err);
      }
      return newRule;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automation-rules"] });
    },
  });
}
