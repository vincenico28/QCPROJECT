import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { serverUpdateCitationStatus } from "@/lib/server.functions";

export type PaymentQueueItem = {
  id: string;
  citationId: string;
  plateNumber: string;
  amount: number;
  method: "gcash" | "maya" | "landbank" | "over-the-counter";
  referenceNumber: string;
  proofUrl: string;
  status: "pending_verification" | "verified" | "rejected";
  submittedDate: string;
};

export type RefundQueueItem = {
  id: string;
  citationId: string;
  plateNumber: string;
  amount: number;
  claimant: string;
  reason: string;
  status: "pending" | "processed" | "rejected";
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

let MOCK_PAYMENTS: PaymentQueueItem[] = [
  {
    id: "PAY-001",
    citationId: "NOV-2026-QC-00129",
    plateNumber: "NDB-8921",
    amount: 2000,
    method: "gcash",
    referenceNumber: "GCASH-9821039812",
    proofUrl: "/assets/violation-1.jpg",
    status: "pending_verification",
    submittedDate: new Date(Date.now() - 1000 * 60 * 24).toISOString(),
  },
  {
    id: "PAY-002",
    citationId: "NOV-2026-QC-00142",
    plateNumber: "XYZ-987",
    amount: 2500,
    method: "maya",
    referenceNumber: "MAYA-7712398412",
    proofUrl: "/assets/violation-3.jpg",
    status: "pending_verification",
    submittedDate: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "PAY-003",
    citationId: "NOV-2026-QC-00150",
    plateNumber: "CAS-3901",
    amount: 5000,
    method: "over-the-counter",
    referenceNumber: "OTC-CULIAT-88129",
    proofUrl: "/assets/violation-2.jpg",
    status: "verified",
    submittedDate: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
];

let MOCK_REFUNDS: RefundQueueItem[] = [
  {
    id: "REF-001",
    citationId: "NOV-2026-QC-00042",
    plateNumber: "CAR-9912",
    amount: 2000,
    claimant: "Dr. Manuel Quezon",
    reason: "TAB Appeal Dismissal",
    status: "pending",
    approvedDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "REF-002",
    citationId: "NOV-2026-QC-00018",
    plateNumber: "WXY-1122",
    amount: 1500,
    claimant: "Ana Dela Rosa",
    reason: "Overpayment",
    status: "pending",
    approvedDate: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

let MOCK_DRAWER: CashDrawer = {
  openingBalance: 5000,
  cashCollected: 18500,
  digitalCollected: 42000,
  totalVerified: 60500,
  pendingAmount: 4500,
  refundAmount: 3500,
  cashierName: "Treasury Officer M. Santos",
  shiftStatus: "OPEN",
};

export function useFinanceQueue() {
  return useQuery({
    queryKey: ["finance-queue"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return {
        pendingPayments: MOCK_PAYMENTS,
        pendingRefunds: MOCK_REFUNDS,
        dailyDrawer: {
          ...MOCK_DRAWER,
          pendingAmount: MOCK_PAYMENTS.filter((p) => p.status === "pending_verification").reduce(
            (sum, p) => sum + p.amount,
            0
          ),
          refundAmount: MOCK_REFUNDS.filter((r) => r.status === "pending").reduce(
            (sum, r) => sum + r.amount,
            0
          ),
        },
      };
    },
  });
}

export function useVerifyPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ paymentId }: { paymentId: string }) => {
      const p = MOCK_PAYMENTS.find((x) => x.id === paymentId);
      if (p) {
        p.status = "verified";
        MOCK_DRAWER.totalVerified += p.amount;
        if (p.method === "over-the-counter") {
          MOCK_DRAWER.cashCollected += p.amount;
        } else {
          MOCK_DRAWER.digitalCollected += p.amount;
        }

        // Persist citation status update to Supabase
        await serverUpdateCitationStatus({
          data: { citationNumber: p.citationId, status: "paid" },
        });
      }
      return p;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance-queue"] });
      qc.invalidateQueries({ queryKey: ["citations"] });
      qc.invalidateQueries({ queryKey: ["violations"] });
    },
  });
}

export function useProcessRefund() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ refundId }: { refundId: string }) => {
      const r = MOCK_REFUNDS.find((x) => x.id === refundId);
      if (r) {
        r.status = "processed";
      }
      return r;
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
      MOCK_DRAWER.shiftStatus = "SETTLED";
      return MOCK_DRAWER;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance-queue"] });
    },
  });
}
