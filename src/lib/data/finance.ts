import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type PaymentQueueItem = {
  id: string;
  citationId: string;
  plateNumber: string;
  payerName: string;
  amount: number;
  method: "over-the-counter" | "gcash" | "maya" | "landbank";
  referenceNumber: string;
  status: "pending_verification" | "verified";
  timestamp: string;
  proofUrl?: string;
};

export type RefundQueueItem = {
  id: string;
  citationId: string;
  plateNumber: string;
  amount: number;
  claimant: string;
  reason: "TAB Appeal Dismissal" | "Overpayment" | "Duplicate Transaction";
  status: "pending" | "processed";
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
    id: "PAY-9012",
    citationId: "NOV-2026-QC-00129",
    plateNumber: "NDB-8921",
    payerName: "Juan Dela Cruz",
    amount: 2000,
    method: "gcash",
    referenceNumber: "GC-98210491823",
    status: "pending_verification",
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    proofUrl: "/assets/violation-1.jpg",
  },
  {
    id: "PAY-9013",
    citationId: "NOV-2026-QC-00142",
    plateNumber: "XYZ-987",
    payerName: "Roberto Santos",
    amount: 2500,
    method: "maya",
    referenceNumber: "MY-7819204128",
    status: "pending_verification",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    proofUrl: "/assets/violation-3.jpg",
  },
  {
    id: "PAY-9014",
    citationId: "NOV-2026-QC-00164",
    plateNumber: "NBP-5412",
    payerName: "Elena Ramos",
    amount: 1500,
    method: "over-the-counter",
    referenceNumber: "OTC-QC-2026-081",
    status: "verified",
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
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
      await new Promise((resolve) => setTimeout(resolve, 300));
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
      await new Promise((r) => setTimeout(r, 400));
      const p = MOCK_PAYMENTS.find((x) => x.id === paymentId);
      if (p) {
        p.status = "verified";
        MOCK_DRAWER.totalVerified += p.amount;
        if (p.method === "over-the-counter") {
          MOCK_DRAWER.cashCollected += p.amount;
        } else {
          MOCK_DRAWER.digitalCollected += p.amount;
        }
      }
      return p;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance-queue"] });
      qc.invalidateQueries({ queryKey: ["citations"] });
    },
  });
}

export function useProcessRefund() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ refundId }: { refundId: string }) => {
      await new Promise((r) => setTimeout(r, 400));
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
      await new Promise((r) => setTimeout(r, 500));
      MOCK_DRAWER.shiftStatus = "SETTLED";
      return MOCK_DRAWER;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance-queue"] });
    },
  });
}
