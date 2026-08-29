import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  useFinanceQueue,
  useVerifyPayment,
  useProcessRefund,
  useSettleCashDrawer,
  type PaymentQueueItem,
  type RefundQueueItem,
} from "@/lib/data/finance";
import { formatPeso, timeAgo } from "@/lib/data/traffic";
import {
  Loader2,
  DollarSign,
  ArrowRightLeft,
  Landmark,
  CheckCircle2,
  Clock,
  Receipt,
  FileCheck2,
  Eye,
  CreditCard,
  ShieldCheck,
  Printer,
  Sparkles,
  Wallet,
  AlertCircle,
  X,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/finance")({
  head: () => ({
    meta: [{ title: "Finance & Treasury Cashier — Culiat Traffic Ops" }],
  }),
  component: FinanceDashboard,
});

function FinanceDashboard() {
  const { data, isLoading } = useFinanceQueue();
  const verifyPayment = useVerifyPayment();
  const processRefund = useProcessRefund();
  const settleDrawer = useSettleCashDrawer();

  const [selectedProofPayment, setSelectedProofPayment] = useState<PaymentQueueItem | null>(null);
  const [selectedRefund, setSelectedRefund] = useState<RefundQueueItem | null>(null);
  const [closeDrawerModal, setCloseDrawerModal] = useState(false);

  const handleVerify = (payment: PaymentQueueItem) => {
    verifyPayment.mutate(
      { paymentId: payment.id, citationId: payment.citationId },
      {
        onSuccess: () => {
          toast.success(`Payment ${payment.referenceNumber} Verified`, {
            description: `OR Issued · LTO LTMS Clearance tag released for plate ${payment.plateNumber}`,
          });
          setSelectedProofPayment(null);
        },
      }
    );
  };

  const handleRefund = (refund: RefundQueueItem) => {
    processRefund.mutate(
      { refundId: refund.id },
      {
        onSuccess: () => {
          toast.success(`Refund of ${formatPeso(refund.amount)} Processed`, {
            description: `Transferred to ${refund.claimant} via Treasury Disbursement Voucher.`,
          });
          setSelectedRefund(null);
        },
      }
    );
  };

  const handleSettle = () => {
    settleDrawer.mutate(undefined, {
      onSuccess: () => {
        toast.success("Cash Drawer Closed & Remittance Recorded", {
          description: "End of day settlement report generated for Quezon City Hall Treasury.",
        });
        setCloseDrawerModal(false);
      },
    });
  };

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono-tab text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
              LGU TREASURY CASHIER
            </span>
            <span className="text-xs text-subtle">· Shift: {data?.dailyDrawer.shiftStatus === "OPEN" ? "🟢 ACTIVE" : "🔒 CLOSED"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            Finance & Revenue Reconciliation
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Verify online gateway transactions (GCash, Maya, Landbank), process TAB refunds, and balance daily cash drawers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCloseDrawerModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel px-4 py-2 text-xs font-semibold text-foreground hover:bg-panel-elevated transition-colors"
          >
            <Printer className="size-3.5" />
            EOD Drawer Summary
          </button>
        </div>
      </div>

      {isLoading || !data ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Revenue KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="panel flex flex-col justify-center rounded-2xl border border-emerald-500/30 bg-emerald-950/10 p-5 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Landmark className="size-5" />
                </div>
                <div>
                  <span className="font-mono-tab text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Total Verified</span>
                  <p className="font-mono-tab text-2xl font-black text-white mt-0.5">
                    {formatPeso(data.dailyDrawer.totalVerified)}
                  </p>
                </div>
              </div>
              <span className="text-[10px] text-emerald-400/80 mt-2 font-mono-tab">Digital + Cash in Hand</span>
            </div>

            <div className="panel flex flex-col justify-center rounded-2xl border border-blue-500/30 bg-blue-950/10 p-5 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-blue-500/20 text-blue-400">
                  <CreditCard className="size-5" />
                </div>
                <div>
                  <span className="font-mono-tab text-[10px] uppercase tracking-widest text-blue-400 font-bold">Digital (GCash/Maya)</span>
                  <p className="font-mono-tab text-2xl font-black text-white mt-0.5">
                    {formatPeso(data.dailyDrawer.digitalCollected)}
                  </p>
                </div>
              </div>
              <span className="text-[10px] text-white/50 mt-2 font-mono-tab">Online Gateway Settlement</span>
            </div>

            <div className="panel flex flex-col justify-center rounded-2xl border border-amber-500/30 bg-amber-950/10 p-5 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-amber-500/20 text-amber-400">
                  <Clock className="size-5" />
                </div>
                <div>
                  <span className="font-mono-tab text-[10px] uppercase tracking-widest text-amber-400 font-bold">Pending Verification</span>
                  <p className="font-mono-tab text-2xl font-black text-amber-300 mt-0.5">
                    {formatPeso(data.dailyDrawer.pendingAmount)}
                  </p>
                </div>
              </div>
              <span className="text-[10px] text-amber-400/80 mt-2 font-mono-tab">{data.pendingPayments.filter(p => p.status === "pending_verification").length} Payments in queue</span>
            </div>

            <div className="panel flex flex-col justify-center rounded-2xl border border-orange-500/30 bg-orange-950/10 p-5 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-orange-500/20 text-orange-400">
                  <ArrowRightLeft className="size-5" />
                </div>
                <div>
                  <span className="font-mono-tab text-[10px] uppercase tracking-widest text-orange-400 font-bold">Pending Refunds</span>
                  <p className="font-mono-tab text-2xl font-black text-orange-300 mt-0.5">
                    {formatPeso(data.dailyDrawer.refundAmount)}
                  </p>
                </div>
              </div>
              <span className="text-[10px] text-white/50 mt-2 font-mono-tab">TAB Dismissals & Overpayments</span>
            </div>
          </div>

          {/* Queues Grid */}
          <div className="grid gap-6 lg:grid-cols-2 mt-2">
            {/* Payment Verification Queue */}
            <div className="panel flex flex-col gap-4 rounded-2xl border border-border bg-panel p-6 shadow-xl h-[520px] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <h2 className="font-bold text-white flex items-center gap-2 text-base">
                  <DollarSign className="size-5 text-emerald-400" />
                  Payment Verification Queue
                </h2>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400 font-mono-tab">
                  {data.pendingPayments.filter(p => p.status === "pending_verification").length} Pending Verification
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {data.pendingPayments.map((p) => {
                  const isVerified = p.status === "verified";
                  return (
                    <div
                      key={p.id}
                      className={cn(
                        "flex flex-col gap-3 rounded-xl border p-4 transition-colors",
                        isVerified
                          ? "border-emerald-500/30 bg-emerald-950/10"
                          : "border-border bg-background/60"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono-tab text-sm font-bold text-white">{p.citationId}</span>
                            <span className="rounded bg-primary/20 px-1.5 py-0.2 font-mono-tab text-[9px] font-bold text-primary uppercase">
                              {p.method}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Payer: <span className="text-white font-medium">{p.payerName}</span> · Plate: <span className="font-mono-tab text-white">{p.plateNumber}</span>
                          </p>
                          <p className="text-[10px] font-mono-tab text-subtle mt-0.5">
                            Ref: {p.referenceNumber} · {timeAgo(p.timestamp)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono-tab text-base font-black text-emerald-400">{formatPeso(p.amount)}</span>
                          <span
                            className={cn(
                              "block text-[10px] font-mono-tab font-bold uppercase mt-1",
                              isVerified ? "text-emerald-400" : "text-amber-400"
                            )}
                          >
                            {isVerified ? "VERIFIED" : "PENDING"}
                          </span>
                        </div>
                      </div>

                      {!isVerified && (
                        <div className="flex items-center gap-2 border-t border-border pt-3">
                          <button
                            onClick={() => handleVerify(p)}
                            disabled={verifyPayment.isPending}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle2 className="size-3.5" />
                            Verify & Release Hold
                          </button>
                          {p.proofUrl && (
                            <button
                              onClick={() => setSelectedProofPayment(p)}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-panel px-3 py-2 text-xs font-semibold text-foreground hover:bg-panel-elevated transition-colors"
                            >
                              <Eye className="size-3.5" />
                              View Proof
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Refund Processing Queue */}
            <div className="panel flex flex-col gap-4 rounded-2xl border border-border bg-panel p-6 shadow-xl h-[520px] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <h2 className="font-bold text-white flex items-center gap-2 text-base">
                  <ArrowRightLeft className="size-5 text-orange-400" />
                  Refund & Settlement Queue
                </h2>
                <span className="rounded-full bg-orange-500/20 px-2.5 py-0.5 text-xs font-bold text-orange-400 font-mono-tab">
                  {data.pendingRefunds.filter(r => r.status === "pending").length} Pending
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {data.pendingRefunds.map((r) => {
                  const isProcessed = r.status === "processed";
                  return (
                    <div
                      key={r.id}
                      className={cn(
                        "flex flex-col gap-3 rounded-xl border p-4 transition-colors",
                        isProcessed
                          ? "border-emerald-500/30 bg-emerald-950/10"
                          : "border-border bg-background/60"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono-tab text-sm font-bold text-white">{r.citationId}</span>
                            <span className="rounded bg-orange-500/20 px-1.5 py-0.2 font-mono-tab text-[9px] font-bold text-orange-400 uppercase">
                              {r.reason}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Claimant: <span className="text-white font-medium">{r.claimant}</span> · Plate: <span className="font-mono-tab text-white">{r.plateNumber}</span>
                          </p>
                          <p className="text-[10px] font-mono-tab text-subtle mt-0.5">
                            Approved: {new Date(r.approvedDate).toLocaleDateString("en-PH")}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono-tab text-base font-black text-orange-400">{formatPeso(r.amount)}</span>
                          <span
                            className={cn(
                              "block text-[10px] font-mono-tab font-bold uppercase mt-1",
                              isProcessed ? "text-emerald-400" : "text-amber-400"
                            )}
                          >
                            {isProcessed ? "DISBURSED" : "AWAITING VOUCHER"}
                          </span>
                        </div>
                      </div>

                      {!isProcessed && (
                        <div className="flex items-center gap-2 border-t border-border pt-3">
                          <button
                            onClick={() => handleRefund(r)}
                            disabled={processRefund.isPending}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-orange-600 py-2 text-xs font-bold text-white shadow-md shadow-orange-600/20 hover:bg-orange-500 transition-colors disabled:opacity-50"
                          >
                            <Receipt className="size-3.5" />
                            Disburse via Treasury Voucher
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* PROOF OF PAYMENT MODAL */}
      {selectedProofPayment && (
        <Dialog.Root open onOpenChange={(o) => !o && setSelectedProofPayment(null)}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-panel p-6 shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex items-start justify-between border-b border-border pb-3">
                <Dialog.Title className="text-base font-bold text-white flex items-center gap-2">
                  <CreditCard className="size-4 text-primary" />
                  Proof of Payment · {selectedProofPayment.referenceNumber}
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button className="rounded p-1 text-muted-foreground hover:text-foreground">
                    <X className="size-4" />
                  </button>
                </Dialog.Close>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                <div className="overflow-hidden rounded-xl border border-border bg-black">
                  <img
                    src={selectedProofPayment.proofUrl}
                    alt="Proof of Payment"
                    className="h-48 w-full object-cover"
                  />
                </div>
                <div className="rounded-xl border border-border bg-background p-3 text-xs flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <span className="text-subtle">Citation Number:</span>
                    <span className="font-mono-tab font-bold text-white">{selectedProofPayment.citationId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-subtle">Payer Name:</span>
                    <span className="font-medium text-white">{selectedProofPayment.payerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-subtle">Amount Paid:</span>
                    <span className="font-mono-tab font-bold text-emerald-400">{formatPeso(selectedProofPayment.amount)}</span>
                  </div>
                </div>

                <div className="mt-2 flex justify-end gap-2">
                  <Dialog.Close asChild>
                    <button className="rounded-lg px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-panel-elevated">
                      Close
                    </button>
                  </Dialog.Close>
                  <button
                    onClick={() => handleVerify(selectedProofPayment)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                  >
                    <CheckCircle2 className="size-3.5" />
                    Verify Payment
                  </button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      {/* END OF DAY SETTLEMENT MODAL */}
      <Dialog.Root open={closeDrawerModal} onOpenChange={setCloseDrawerModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-panel p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-border pb-3">
              <Dialog.Title className="text-base font-bold text-white flex items-center gap-2">
                <Landmark className="size-4 text-emerald-400" />
                End-of-Day (EOD) Drawer Settlement
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="rounded p-1 text-muted-foreground hover:text-foreground">
                  <X className="size-4" />
                </button>
              </Dialog.Close>
            </div>

            <div className="mt-4 flex flex-col gap-4 text-xs">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4">
                <span className="font-mono-tab text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Total Daily Remittance</span>
                <p className="font-mono-tab text-3xl font-black text-white mt-1">
                  {formatPeso(data?.dailyDrawer.totalVerified || 0)}
                </p>
                <p className="text-[11px] text-white/60 mt-1">
                  Ready for electronic remittance to Quezon City Government General Treasury Fund.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border border-border bg-background p-3">
                  <span className="text-subtle font-mono-tab text-[10px]">CASH IN DRAWER</span>
                  <p className="font-mono-tab font-bold text-white text-sm mt-0.5">
                    {formatPeso(data?.dailyDrawer.cashCollected || 0)}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-background p-3">
                  <span className="text-subtle font-mono-tab text-[10px]">DIGITAL GATEWAYS</span>
                  <p className="font-mono-tab font-bold text-white text-sm mt-0.5">
                    {formatPeso(data?.dailyDrawer.digitalCollected || 0)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex justify-between gap-3 border-t border-border pt-4">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-panel-elevated"
                >
                  <Printer className="size-3.5" />
                  Print Settlement Slip
                </button>
                <button
                  onClick={handleSettle}
                  disabled={settleDrawer.isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  <FileCheck2 className="size-3.5" />
                  Confirm & Close Shift
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
