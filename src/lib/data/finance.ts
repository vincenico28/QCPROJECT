import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  serverUpdateCitationStatus,
  serverFetchFinanceQueue,
  serverVerifyPayment,
  serverProcessRefund,
} from "@/lib/server.functions";

export type PaymentQueueItem = {
  id: string;
  citationId: string;
  plateNumber: string;
  payerName?: string;
  amount: number;
  method: "gcash" | "maya" | "landbank" | "over-the-counter" | string;
  referenceNumber: string;
  proofUrl: string;
  status: "pending_verification" | "verified" | "rejected" | string;
  submittedDate: string;
  timestamp: string;
};

export type RefundQueueItem = {
  id: string;
  citationId: string;
  plateNumber: string;
  amount: number;
  claimant: string;
  reason: string;
  status: "pending" | "processed" | "rejected" | string;
  approvedDate: string;
};

export type CashDrawer = {
  openingBalance: number;
  cashCollected: number;
  digitalCollected: number;
  totalVerified: number;
  pendingAmount: number;
  refundAmount: number;
  cashierName: string;
  shiftStatus: "OPEN" | "SETTLED";
};

let DRAWER_SETTLED = false;

export function useFinanceQueue() {
  return useQuery({
    queryKey: ["finance-queue"],
    queryFn: async () => {
      const data = await serverFetchFinanceQueue();
      const p = data.pendingPayments || [];
      const r = data.pendingRefunds || [];
      
      const payments: PaymentQueueItem[] = p.map((row: any) => ({
        id: row.id,
        citationId: row.citation_id,
        plateNumber: row.plate_number,
        payerName: row.payer_name || "Registered Vehicle Owner",
        amount: Number(row.amount),
        method: row.method,
        referenceNumber: row.reference_number,
        proofUrl: row.proof_url || "",
        status: row.status,
        submittedDate: row.submitted_date || row.created_at,
        timestamp: row.submitted_date || row.created_at,
      }));

      const refunds: RefundQueueItem[] = r.map((row: any) => ({
        id: row.id,
        citationId: row.citation_id,
        plateNumber: row.plate_number,
        claimant: row.claimant,
        reason: row.reason,
        status: row.status,
        approvedDate: row.approved_date || row.created_at,
      }));

      // Calculate the drawer base state + dynamic state from payments/refunds
      const openingBalance = 5000;
      
      const cashCollected = payments
        .filter(x => x.status === "verified" && x.method === "over-the-counter")
        .reduce((sum, x) => sum + x.amount, 0);

      const digitalCollected = payments
        .filter(x => x.status === "verified" && x.method !== "over-the-counter")
        .reduce((sum, x) => sum + x.amount, 0);

      const totalVerified = cashCollected + digitalCollected;

      const pendingAmount = payments
        .filter(x => x.status === "pending_verification")
        .reduce((sum, x) => sum + x.amount, 0);

      const refundAmount = refunds
        .filter(x => x.status === "pending")
        .reduce((sum, x) => sum + x.amount, 0);

      return {
        pendingPayments: payments.filter(x => x.status === "pending_verification"),
        pendingRefunds: refunds.filter(x => x.status === "pending"),
        dailyDrawer: {
          openingBalance,
          cashCollected,
          digitalCollected,
          totalVerified,
          pendingAmount,
          refundAmount,
          cashierName: "Treasury Officer M. Santos",
          shiftStatus: DRAWER_SETTLED ? "SETTLED" : "OPEN",
        } as CashDrawer,
      };
    },
  });
}

export function useVerifyPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ paymentId, citationId }: { paymentId: string, citationId: string }) => {
      await serverVerifyPayment({ data: { paymentId, citationId } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance-queue"] });
    },
  });
}

export function useProcessRefund() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ refundId }: { refundId: string }) => {
      await serverProcessRefund({ data: { refundId } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance-queue"] });
    },
  });
}

export function useSettleCashDrawer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      DRAWER_SETTLED = true;
      return { success: true, shiftStatus: "SETTLED" };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance-queue"] });
    },
  });
}
