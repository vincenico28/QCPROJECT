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
    officer_id: "104",
    officer_name: "Field Officer",
    badge_number: "BADGE-104",
    violation_id: "V-001",
    location: "Commonwealth Ave & Tandang Sora",
    priority: "high",
    instructions: "Respond to reported collision blocking 2 lanes.",
    status: "en_route",
    acknowledged_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    resolved_at: null,
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: "DSP-002",
    reference: "REF-1002",
    officer_id: "101",
    officer_name: "Juan Dela Cruz",
    badge_number: "BADGE-101",
    violation_id: null,
    location: "Quezon Memorial Circle",
    priority: "medium",
    instructions: "Direct traffic, broken traffic light.",
    status: "queued",
    acknowledged_at: null,
    resolved_at: null,
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  }
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
