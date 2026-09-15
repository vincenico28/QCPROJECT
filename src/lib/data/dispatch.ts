import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  serverFetchDispatches,
  serverSaveDispatch,
  serverUpdateDispatchStatus,
  serverRequestDispatchSupport,
} from "@/lib/server.functions";

export type DispatchStatus = "queued" | "en_route" | "on_scene" | "resolved" | "cancelled";
export type DispatchPriority = "low" | "medium" | "high" | "critical";

export type SupportUnitType = "wrecker" | "medic" | "fire" | "police_backup";
export type SupportUnitStatus = "inbound" | "on_scene";

export type ActiveSupportUnit = {
  type: SupportUnitType;
  status: SupportUnitStatus;
  eta: string;
  label: string;
};

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

export type DispatchEtaResult = {
  etaMinutes: number;
  distanceKm: number;
  label: string;
  subLabel: string;
  stage: "queued" | "en_route" | "on_scene" | "resolved" | "cancelled";
};

export function calculateDispatchEta(dispatch: Dispatch): DispatchEtaResult {
  const now = Date.now();
  const createdMs = new Date(dispatch.created_at).getTime();

  if (dispatch.status === "queued") {
    return {
      etaMinutes: 8,
      distanceKm: 2.1,
      label: "Pending Unit Ack",
      subLabel: "Est. 8 mins once rolling",
      stage: "queued",
    };
  }

  if (dispatch.status === "en_route") {
    const ackMs = dispatch.acknowledged_at ? new Date(dispatch.acknowledged_at).getTime() : createdMs;
    const elapsedEnRoute = Math.max(0, Math.floor((now - ackMs) / 60000));
    const baseTravel = dispatch.priority === "critical" ? 6 : 9;
    const remaining = Math.max(1, baseTravel - elapsedEnRoute);
    const distance = Math.max(0.3, +(remaining * 0.28).toFixed(1));

    return {
      etaMinutes: remaining,
      distanceKm: distance,
      label: `ETA ~${remaining} min${remaining > 1 ? "s" : ""}`,
      subLabel: `${distance} km away · Inbound`,
      stage: "en_route",
    };
  }

  if (dispatch.status === "on_scene") {
    const ackMs = dispatch.acknowledged_at ? new Date(dispatch.acknowledged_at).getTime() : createdMs;
    const onSceneElapsed = Math.max(1, Math.floor((now - ackMs) / 60000));

    return {
      etaMinutes: 0,
      distanceKm: 0,
      label: "On Scene",
      subLabel: `Active ${onSceneElapsed}m at incident site`,
      stage: "on_scene",
    };
  }

  if (dispatch.status === "resolved") {
    const resolvedMs = dispatch.resolved_at ? new Date(dispatch.resolved_at).getTime() : now;
    const totalDuration = Math.max(1, Math.floor((resolvedMs - createdMs) / 60000));

    return {
      etaMinutes: 0,
      distanceKm: 0,
      label: "Resolved",
      subLabel: `Cleared in ${totalDuration}m total`,
      stage: "resolved",
    };
  }

  return {
    etaMinutes: 0,
    distanceKm: 0,
    label: "Cancelled",
    subLabel: "Operation aborted",
    stage: "cancelled",
  };
}

export function parseSupportUnits(instructions: string | null): ActiveSupportUnit[] {
  if (!instructions) return [];
  const regex = /\[SUPPORT:(wrecker|medic|fire|police_backup):(inbound|on_scene):([^:]+):([^\]]+)\]/g;
  const units: ActiveSupportUnit[] = [];
  let match;
  while ((match = regex.exec(instructions)) !== null) {
    units.push({
      type: match[1] as SupportUnitType,
      status: match[2] as SupportUnitStatus,
      eta: match[3],
      label: match[4],
    });
  }
  return units;
}

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

export function useRequestDispatchSupport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      dispatchId: string;
      supportType: SupportUnitType;
      action?: "request" | "cancel" | "arrived";
      notes?: string;
    }) => {
      return await serverRequestDispatchSupport({
        data: {
          dispatchId: input.dispatchId,
          supportType: input.supportType,
          action: input.action || "request",
          notes: input.notes,
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dispatches"] });
      qc.invalidateQueries({ queryKey: ["audit-logs"] });
    },
  });
}
