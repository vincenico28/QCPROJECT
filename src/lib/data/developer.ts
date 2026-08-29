import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ApiKey = {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string | null;
  requestsLast30Days: number;
};

let MOCK_API_KEYS: ApiKey[] = [
  {
    id: "KEY-001",
    name: "Waze Integration - QC Route",
    key: "sk_live_qc_981a89c20f1882ea77289a2",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    lastUsed: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    requestsLast30Days: 1450320,
  },
  {
    id: "KEY-002",
    name: "MMDA Central Sync",
    key: "sk_live_qc_102b77cf918349281a44b1",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    requestsLast30Days: 45000,
  }
];

export function useDeveloperKeys() {
  return useQuery({
    queryKey: ["developer-keys"],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return [...MOCK_API_KEYS];
    }
  });
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      const hex = Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      const newKey: ApiKey = {
        id: `KEY-${String(MOCK_API_KEYS.length + 1).padStart(3, "0")}`,
        name,
        key: `sk_live_qc_${hex}`,
        createdAt: new Date().toISOString(),
        lastUsed: null,
        requestsLast30Days: 0,
      };
      MOCK_API_KEYS.unshift(newKey);

      try {
        await supabase.from("audit_logs").insert({
          actor_name: "Lead System Architect",
          actor_role: "admin",
          action: "DEVELOPER_API_KEY_CREATED",
          target_resource: `Key: ${name}`,
          details: `Identifier: ${newKey.id}`,
        });
      } catch (err) {
        console.warn(err);
      }

      return newKey;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["developer-keys"] });
    },
  });
}

export function useRevokeApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const key = MOCK_API_KEYS.find(k => k.id === id);
      MOCK_API_KEYS = MOCK_API_KEYS.filter(k => k.id !== id);

      try {
        await supabase.from("audit_logs").insert({
          actor_name: "Lead System Architect",
          actor_role: "admin",
          action: "DEVELOPER_API_KEY_REVOKED",
          target_resource: `Key: ${key?.name || id}`,
        });
      } catch (err) {
        console.warn(err);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["developer-keys"] });
    },
  });
}
