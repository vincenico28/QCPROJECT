import { useQuery } from "@tanstack/react-query";

export type ApiKey = {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string | null;
  requestsLast30Days: number;
};

const MOCK_API_KEYS: ApiKey[] = [
  {
    id: "KEY-001",
    name: "Waze Integration - QC Route",
    key: "sk_live_qc_xxxxxxxxxxxxxxxxxxxxx89a2",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    lastUsed: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    requestsLast30Days: 1450320,
  },
  {
    id: "KEY-002",
    name: "MMDA Central Sync",
    key: "sk_live_qc_xxxxxxxxxxxxxxxxxxxxx44b1",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    requestsLast30Days: 45000,
  }
];

export function useDeveloperKeys() {
  return useQuery({
    queryKey: ["developer-keys"],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return MOCK_API_KEYS;
    }
  });
}
