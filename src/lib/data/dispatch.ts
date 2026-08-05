import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

export function useDispatches(limit = 50) {
  return useQuery({
    queryKey: ["dispatches", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dispatches")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as Dispatch[];
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
      const { data: auth } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("dispatches")
        .insert({ ...input, created_by: auth.user?.id ?? null })
        .select()
        .single();
      if (error) throw error;
      return data as Dispatch;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dispatches"] }),
  });
}

export function useUpdateDispatchStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: DispatchStatus }) => {
      const patch: {
        status: DispatchStatus;
        acknowledged_at?: string;
        resolved_at?: string;
      } = { status };
      if (status === "en_route" || status === "on_scene")
        patch.acknowledged_at = new Date().toISOString();
      if (status === "resolved" || status === "cancelled")
        patch.resolved_at = new Date().toISOString();
      const { error } = await supabase.from("dispatches").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dispatches"] }),
  });
}
