import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Trigger = "AI_Accident_Detected" | "Congestion_Spike" | "Weather_Alert";
export type Action = "Dispatch_Officer" | "Broadcast_Advisory" | "Notify_LGU";

export type AutomationRule = {
  id: string;
  name: string;
  trigger: Trigger;
  conditions: string;
  actions: Action[];
  status: "Active" | "Paused";
  lastTriggered: string | null;
};

let MOCK_RULES: AutomationRule[] = [
  {
    id: "RULE-001",
    name: "Severe Accident Protocol",
    trigger: "AI_Accident_Detected",
    conditions: "Confidence > 90% AND Multiple Vehicles Involved",
    actions: ["Dispatch_Officer", "Broadcast_Advisory", "Notify_LGU"],
    status: "Active",
    lastTriggered: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: "RULE-002",
    name: "Rush Hour Congestion Re-routing",
    trigger: "Congestion_Spike",
    conditions: "Density > 85% on Commonwealth Ave",
    actions: ["Broadcast_Advisory"],
    status: "Active",
    lastTriggered: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "RULE-003",
    name: "Typhoon Protocol / Flooding",
    trigger: "Weather_Alert",
    conditions: "Water Level > 0.5m",
    actions: ["Broadcast_Advisory", "Notify_LGU"],
    status: "Paused",
    lastTriggered: null,
  }
];

export function useAutomationRules() {
  return useQuery({
    queryKey: ["automation-rules"],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return [...MOCK_RULES];
    }
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
