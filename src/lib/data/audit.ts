import { useQuery } from "@tanstack/react-query";

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

const MOCK_AUDIT_LOGS: AuditEvent[] = [
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
  }
];

export function useAuditLogs() {
  return useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return MOCK_AUDIT_LOGS;
    }
  });
}
