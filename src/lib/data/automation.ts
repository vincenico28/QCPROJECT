import { useQuery } from "@tanstack/react-query";

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

const MOCK_RULES: AutomationRule[] = [
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
      await new Promise(resolve => setTimeout(resolve, 600));
      return MOCK_RULES;
    }
  });
}
