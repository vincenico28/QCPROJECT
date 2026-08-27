import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type DispatchPriority = "low" | "medium" | "high" | "critical";
export type DispatchStatus = "queued" | "en_route" | "on_scene" | "resolved" | "cancelled";

export type Dispatch = {
  id: string;
  reference: string;
  officer_id: string | null;
  officer_name: string | null;
  badge_number: string | null;
  violation_id: string | null;
  location: string;
  priority: DispatchPriority;
  instructions: string | null;
  status: DispatchStatus;
  acknowledged_at: string | null;
  resolved_at: string | null;
  created_at: string;
};

export const DISPATCH_STATUS_LABEL: Record<DispatchStatus, string> = {
  queued: "Queued",
  en_route: "En Route",
  on_scene: "On Scene",
  resolved: "Resolved",
  cancelled: "Cancelled",
};

export let MOCK_DISPATCHES: Dispatch[] = [
  {
    id: "DSP-001",
    reference: "REF-1001",
    officer_id: "103",
    officer_name: "Ramon Valderama",
    badge_number: "BADGE-103",
    violation_id: "V-101",
    location: "Commonwealth Ave & Tandang Sora",
    priority: "critical",
    instructions: "Major truck stalling blocking 2 inner lanes. Deploy tow truck and establish contraflow cones.",
    status: "en_route",
    acknowledged_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    resolved_at: null,
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: "DSP-002",
    reference: "REF-1002",
    officer_id: "101",
    officer_name: "Juan Dela Cruz",
    badge_number: "BADGE-101",
    violation_id: null,
    location: "Visayas Ave near Central Market",
    priority: "medium",
    instructions: "Clear illegal vendor double parking causing bottle-neck during morning peak.",
    status: "on_scene",
    acknowledged_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    resolved_at: null,
    created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: "DSP-003",
    reference: "REF-1003",
    officer_id: "102",
    officer_name: "Maria Santos",
    badge_number: "BADGE-102",
    violation_id: "V-104",
    location: "Commonwealth Ave / Luzon Overpass",
    priority: "high",
    instructions: "Malfunctioning amber light phase. Perform manual traffic directing until engineering team arrives.",
    status: "queued",
    acknowledged_at: null,
    resolved_at: null,
    created_at: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
  },
  {
    id: "DSP-004",
    reference: "REF-1004",
    officer_id: "105",
    officer_name: "Corazon Aquino-Lim",
    badge_number: "BADGE-105",
    violation_id: null,
    location: "Tandang Sora Overpass",
    priority: "low",
    instructions: "Routine speed radar surveillance and PUV loading zone compliance.",
    status: "resolved",
    acknowledged_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    resolved_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
  },
];

export function useDispatches(limit = 50) {
  return useQuery({
    queryKey: ["dispatches", limit],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 400));
      return MOCK_DISPATCHES.slice(0, limit);
    },
    refetchInterval: 20_000,
  });
}

export type NewDispatch = {
  officer_id: string | null;
  officer_name: string | null;
  badge_number: string | null;
  location: string;
  priority: DispatchPriority;
  instructions: string | null;
  violation_id?: string | null;
};

export function useCreateDispatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewDispatch) => {
      await new Promise(r => setTimeout(r, 600));
      const id = `DSP-${Date.now()}`;
      const d: Dispatch = {
        id,
        reference: `REF-${Math.floor(1000 + Math.random() * 9000)}`,
        officer_id: input.officer_id,
        officer_name: input.officer_name,
        badge_number: input.badge_number,
        violation_id: input.violation_id || null,
        location: input.location,
        priority: input.priority,
        instructions: input.instructions,
        status: "queued",
        acknowledged_at: null,
        resolved_at: null,
        created_at: new Date().toISOString(),
      };
      MOCK_DISPATCHES.unshift(d);
      return d;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dispatches"] }),
  });
}

export function useUpdateDispatchStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: DispatchStatus }) => {
      await new Promise(r => setTimeout(r, 400));
      const d = MOCK_DISPATCHES.find(x => x.id === id);
      if (d) {
        d.status = status;
        if (status === "en_route" || status === "on_scene") d.acknowledged_at = new Date().toISOString();
        if (status === "resolved" || status === "cancelled") d.resolved_at = new Date().toISOString();
      } else {
        throw new Error("Dispatch not found");
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dispatches"] }),
  });
}
