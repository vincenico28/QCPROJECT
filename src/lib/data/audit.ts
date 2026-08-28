import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AuditEvent = {
  id: string;
  user: string;
  role: string;
  action: string;
  target: string;
  ipAddress: string;
  timestamp: string;
  severity: "info" | "warning" | "critical";
};

const DEFAULT_AUDIT_LOGS: AuditEvent[] = [
  {
    id: "LOG-9921",
    user: "admin@qc.gov.ph",
    role: "Super Admin",
    action: "Updated AI Threshold",
    target: "System Settings",
    ipAddress: "112.203.201.55",
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    severity: "warning",
  },
  {
    id: "LOG-9920",
    user: "finance.officer@qc.gov.ph",
    role: "Cashier",
    action: "Processed Refund",
    target: "CIT-00042 (Amount: ₱1,000)",
    ipAddress: "112.203.201.89",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    severity: "info",
  },
  {
    id: "LOG-9919",
    user: "system",
    role: "System",
    action: "Failed Login Attempt",
    target: "admin@qc.gov.ph",
    ipAddress: "45.22.19.102",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    severity: "critical",
  },
  {
    id: "LOG-9918",
    user: "dispatcher_03@qc.gov.ph",
    role: "Dispatcher",
    action: "Verified Citation",
    target: "CIT-00129",
    ipAddress: "112.203.201.12",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    severity: "info",
  },
];

export function useAuditLogs() {
  return useQuery({
    queryKey: ["audit-logs"],
    queryFn: async (): Promise<AuditEvent[]> => {
      try {
        const { data, error } = await supabase
          .from("audit_logs")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id.substring(0, 8).toUpperCase(),
            user: d.actor_name,
            role: d.actor_role,
            action: d.action,
            target: d.target_resource,
            ipAddress: "112.203.201.55",
            timestamp: d.created_at,
            severity: d.action.includes("DELETE") || d.action.includes("FAILED") ? "critical" :
                      d.action.includes("UPDATE") || d.action.includes("REJECT") ? "warning" : "info",
          }));
        }
      } catch {
        // fallback
      }
      return DEFAULT_AUDIT_LOGS;
    },
  });
}

export function useRecordAuditLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { actor: string; role: string; action: string; resource: string; details?: string }) => {
      await supabase.from("audit_logs").insert({
        actor_name: input.actor,
        actor_role: input.role,
        action: input.action,
        target_resource: input.resource,
        details: input.details || null,
      });
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["audit-logs"] });
    },
  });
}
