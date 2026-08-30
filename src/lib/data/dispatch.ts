import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  serverFetchDispatches,
  serverSaveDispatch,
  serverUpdateDispatchStatus,
} from "@/lib/server.functions";

export type DispatchStatus = "queued" | "en_route" | "on_scene" | "resolved" | "cancelled";
export type DispatchPriority = "low" | "medium" | "high" | "critical";

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
  en_route: "En route",
  on_scene: "On scene",
  resolved: "Resolved",
  cancelled: "Cancelled",
};

export let MOCK_DISPATCHES: Dispatch[] = [];

export function useDispatches(limit = 50) {
  const qc = useQueryClient();

  useEffect(() => {
    try {
      const channel = supabase
        .channel("realtime-dispatches")
        .on("postgres_changes", { event: "*", schema: "public", table: "dispatches" }, () => {
          qc.invalidateQueries({ queryKey: ["dispatches"] });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch {
      // Supabase realtime fallback
    }
  }, [qc]);

  return useQuery({
    queryKey: ["dispatches", limit],
    queryFn: async () => {
      try {
        const rows = await serverFetchDispatches({ data: limit });
        return (rows as Dispatch[]) || [];
      } catch {
        return [];
      }
    },
    refetchInterval: 10_000,
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
      const res = await serverSaveDispatch({
        data: {
          officer_id: input.officer_id || null,
          officer_name: input.officer_name || null,
          badge_number: input.badge_number || null,
          violation_id: input.violation_id || null,
          location: input.location,
          priority: input.priority,
          instructions: input.instructions || null,
        },
      });

      try {
        await supabase.from("audit_logs").insert({
          actor_name: "Central Dispatcher",
          actor_role: "dispatcher",
          action: "DISPATCH_UNIT_ASSIGNED",
          target_resource: `Officer: ${input.officer_name || "Unassigned Unit"}`,
          details: `Location: ${input.location}, Priority: ${input.priority.toUpperCase()}`,
        });
      } catch (err) {
        console.warn(err);
      }

      return res;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dispatches"] }),
  });
}

export function useUpdateDispatchStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: DispatchStatus }) => {
      await serverUpdateDispatchStatus({
        data: { id, status },
      });

      try {
        await supabase.from("audit_logs").insert({
          actor_name: "Field Unit / Dispatcher",
          actor_role: "dispatcher",
          action: `DISPATCH_STATUS_${status.toUpperCase()}`,
          target_resource: `Dispatch ID: ${id}`,
          details: `Progressed to ${status.toUpperCase()}`,
        });
      } catch (err) {
        console.warn(err);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dispatches"] }),
  });
}
