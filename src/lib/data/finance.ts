import { useQuery } from "@tanstack/react-query";

export type PaymentQueueItem = {
  id: string;
  citationId: string;
  plateNumber: string;
  amount: number;
  method: "over-the-counter" | "bank-transfer" | "gcash";
  status: "pending_verification" | "verified";
  timestamp: string;
};

export type RefundQueueItem = {
  id: string;
  citationId: string;
  amount: number;
  reason: "Successful Appeal" | "Overpayment";
  status: "pending" | "processed";
};

const MOCK_PAYMENTS: PaymentQueueItem[] = [
  { id: "PAY-9012", citationId: "CIT-00129", plateNumber: "ABC-1234", amount: 1500, method: "gcash", status: "pending_verification", timestamp: new Date().toISOString() },
  { id: "PAY-9013", citationId: "CIT-00188", plateNumber: "DEF-5678", amount: 1000, method: "bank-transfer", status: "pending_verification", timestamp: new Date().toISOString() },
];

const MOCK_REFUNDS: RefundQueueItem[] = [
  { id: "REF-001", citationId: "CIT-00042", amount: 1000, reason: "Successful Appeal", status: "pending" },
];

export function useFinanceQueue() {
  return useQuery({
    queryKey: ["finance-queue"],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 600));
      return {
        pendingPayments: MOCK_PAYMENTS,
        pendingRefunds: MOCK_REFUNDS,
        dailyDrawer: {
          totalVerified: 45000,
          pendingAmount: MOCK_PAYMENTS.reduce((sum, p) => sum + p.amount, 0),
          refundAmount: MOCK_REFUNDS.reduce((sum, r) => sum + r.amount, 0),
        }
      };
    }
  });
}
