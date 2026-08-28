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
        if (rows && rows.length > 0) {
          return rows as Dispatch[];
        }
      } catch {
        // fallback
      }
      return MOCK_DISPATCHES.slice(0, limit);
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
      const row = await serverSaveDispatch({
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

      const d: Dispatch = {
        id: (row as any)?.id || `DSP-${Date.now()}`,
        reference: (row as any)?.reference || `REF-${Math.floor(1000 + Math.random() * 9000)}`,
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
        created_at: (row as any)?.created_at || new Date().toISOString(),
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
      await serverUpdateDispatchStatus({
        data: { id, status },
      });

      const d = MOCK_DISPATCHES.find((x) => x.id === id);
      if (d) {
        d.status = status;
        if (status === "en_route" || status === "on_scene") d.acknowledged_at = new Date().toISOString();
        if (status === "resolved" || status === "cancelled") d.resolved_at = new Date().toISOString();
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dispatches"] }),
  });
}
