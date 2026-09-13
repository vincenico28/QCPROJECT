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
  Smartphone,
  Hash,
  ExternalLink,
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

  // Detailed Payment Verification Modal States
  const [verifyModalPayment, setVerifyModalPayment] = useState<PaymentQueueItem | null>(null);
  const [gcashRefInput, setGcashRefInput] = useState<string>("");
  const [cashierNotesInput, setCashierNotesInput] = useState<string>("");
  const [refInputError, setRefInputError] = useState<string>("");

  const handleOpenVerifyModal = (payment: PaymentQueueItem) => {
    setVerifyModalPayment(payment);
    const existingRef = payment.referenceNumber || "";
    // Pre-fill if motorist provided a realistic reference (not auto-generated OR-)
    setGcashRefInput(existingRef.startsWith("OR-") ? "" : existingRef);
    setCashierNotesInput("");
    setRefInputError("");
  };

  const handleConfirmVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyModalPayment) return;

    const cleanRef = gcashRefInput.trim();
    if (!cleanRef || cleanRef.length < 4) {
      setRefInputError("GCash Reference No. is required to verify settlement and lift LTO holds.");
      return;
    }

    verifyPayment.mutate(
      {
        paymentId: verifyModalPayment.id,
        citationId: verifyModalPayment.citationId,
        referenceNumber: cleanRef,
        cashierNotes: cashierNotesInput.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success(`GCash Payment Verified (Ref: ${cleanRef})`, {
            description: `Citation ${verifyModalPayment.citationId} marked paid. LTO LTMS Hold lifted for ${verifyModalPayment.plateNumber}.`,
          });
          setVerifyModalPayment(null);
        },
        onError: (err: any) => {
          toast.error("Verification failed", {
            description: err?.message || "Could not verify payment.",
          });
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

              <div className="flex flex-col gap-3.5">
                {data.pendingPayments.map((p) => {
                  const isVerified = p.status === "verified";
                  return (
                    <div
                      key={p.id}
                      className={cn(
                        "flex flex-col gap-3 rounded-2xl border p-4.5 transition-all shadow-sm",
                        isVerified
                          ? "border-emerald-500/30 bg-gradient-to-b from-emerald-950/20 to-panel"
                          : "border-border/80 bg-background/80 hover:border-border"
                      )}
                    >
                      {/* Top row: Identifiers & Badges */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono-tab text-sm font-black text-white">
                              {p.citationId}
                            </span>
                            <span className="rounded-md bg-blue-500/20 px-2 py-0.5 font-mono-tab text-[10px] font-bold text-blue-400 border border-blue-500/30 uppercase">
                              {p.method}
                            </span>
                            <span className="font-mono-tab text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded text-white border border-white/20">
                              {p.plateNumber}
                            </span>
                          </div>

                          {/* Itemized details */}
                          <div className="mt-1 flex flex-col gap-0.5 text-xs text-muted-foreground">
                            {p.offense && (
                              <p className="flex items-center gap-1.5 text-white/90">
                                <span className="text-subtle font-medium">Offense:</span>
                                <span className="font-semibold text-amber-300">{p.offense}</span>
                              </p>
                            )}
                            <p className="flex items-center gap-1.5">
                              <span className="text-subtle">Payer:</span>
                              <span className="text-white font-medium">{p.payerName}</span>
                              {p.vehicleModel && (
                                <span className="text-subtle">· Model: <strong className="text-white">{p.vehicleModel}</strong></span>
                              )}
                            </p>
                            <p className="text-[11px] font-mono-tab text-subtle flex items-center gap-1.5 mt-0.5">
                              <span>Submitted: {new Date(p.submittedDate).toLocaleString("en-PH", { dateStyle: "short", timeStyle: "short" })}</span>
                              <span>({timeAgo(p.timestamp)})</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono-tab text-lg font-black text-emerald-400 block">
                            {formatPeso(p.amount)}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono-tab font-black uppercase mt-1",
                              isVerified
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse"
                            )}
                          >
                            {isVerified ? "✓ VERIFIED" : "⏳ PENDING AUDIT"}
                          </span>
                        </div>
                      </div>

                      {/* Reference details banner */}
                      <div className="rounded-xl bg-panel p-2.5 border border-border/60 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Smartphone className="size-3.5 text-blue-400" />
                          <span className="text-subtle text-[11px]">GCash Reference:</span>
                          <span className="font-mono-tab font-bold text-white text-[11px]">
                            {p.referenceNumber || "Awaiting Input"}
                          </span>
                        </div>
                        {isVerified && (
                          <span className="text-[10px] font-bold text-emerald-400 font-mono-tab">
                            Cleared & Reconciled
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 border-t border-border/50 pt-2.5">
                        {!isVerified ? (
                          <button
                            type="button"
                            onClick={() => handleOpenVerifyModal(p)}
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                          >
                            <ShieldCheck className="size-4" />
                            <span>Verify Payment & Input GCash Ref</span>
                          </button>
                        ) : (
                          <a
                            href={`/portal/receipt/${p.citationId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-panel hover:bg-panel-elevated py-2 text-xs font-semibold text-foreground transition-colors"
                          >
                            <Receipt className="size-3.5 text-primary" />
                            <span>View Official Clearance Receipt</span>
                            <ExternalLink className="size-3 text-subtle" />
                          </a>
                        )}
                        {p.proofUrl && (
                          <button
                            type="button"
                            onClick={() => setSelectedProofPayment(p)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-panel px-3 py-2 text-xs font-semibold text-foreground hover:bg-panel-elevated transition-colors"
                          >
                            <Eye className="size-3.5" />
                            <span>Proof</span>
                          </button>
                        )}
                      </div>
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
                    onClick={() => {
                      const p = selectedProofPayment;
                      setSelectedProofPayment(null);
                      handleOpenVerifyModal(p);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                  >
                    <CheckCircle2 className="size-3.5" />
                    Verify Payment & Match Ref
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

      {/* DETAILED PAYMENT VERIFICATION MODAL (REQUIRES GCASH REF NO) */}
      {verifyModalPayment && (
        <Dialog.Root
          open={!!verifyModalPayment}
          onOpenChange={(open) => !open && setVerifyModalPayment(null)}
        >
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-blue-500/40 bg-gradient-to-b from-slate-950 via-panel to-panel p-6 shadow-2xl animate-in fade-in zoom-in-95 text-white max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b border-border/70 pb-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                    <Smartphone className="size-5" />
                  </div>
                  <div>
                    <Dialog.Title className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      Verify GCash Settlement
                      <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono-tab px-2 py-0.5">
                        Audit Required
                      </span>
                    </Dialog.Title>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Cross-reference GCash SMS/app alert & lift LTO LTMS apprehension hold
                    </p>
                  </div>
                </div>
                <Dialog.Close asChild>
                  <button className="rounded-lg p-1.5 text-muted-foreground hover:text-white hover:bg-panel transition-colors">
                    <X className="size-4" />
                  </button>
                </Dialog.Close>
              </div>

              <form onSubmit={handleConfirmVerification} className="mt-4 flex flex-col gap-4">
                {/* 1. Itemized Inspection Summary */}
                <div className="rounded-2xl border border-border/80 bg-background/80 p-4 flex flex-col gap-3">
                  <span className="font-mono-tab text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Citation Notice & Offense Breakdown
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-subtle text-[11px] block">Notice Number</span>
                      <span className="font-mono-tab font-bold text-white">{verifyModalPayment.citationId}</span>
                    </div>
                    <div>
                      <span className="text-subtle text-[11px] block">Plate Number</span>
                      <span className="font-mono-tab font-black text-white bg-primary/20 px-2 py-0.5 rounded border border-primary/30 inline-block">
                        {verifyModalPayment.plateNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-subtle text-[11px] block">Settlement Amount</span>
                      <span className="font-mono-tab font-black text-emerald-400 text-sm">
                        {formatPeso(verifyModalPayment.amount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-subtle text-[11px] block">Offense</span>
                      <span className="font-medium text-amber-300">
                        {verifyModalPayment.offense || "Traffic Ordinance Infraction"}
                      </span>
                    </div>
                    <div>
                      <span className="text-subtle text-[11px] block">Vehicle Model</span>
                      <span className="font-medium text-white">
                        {verifyModalPayment.vehicleModel || "Registered Vehicle"}
                      </span>
                    </div>
                    <div>
                      <span className="text-subtle text-[11px] block">Apprehending Officer</span>
                      <span className="font-medium text-white">
                        {verifyModalPayment.officerName || "Field Patrol"}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-border/50 pt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Payer: <strong className="text-white">{verifyModalPayment.payerName}</strong></span>
                    <span className="font-mono-tab">
                      Submitted: {new Date(verifyModalPayment.submittedDate).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  </div>
                </div>

                {/* 2. Official Treasury GCash Instructions */}
                <div className="rounded-2xl border border-blue-500/30 bg-blue-950/20 p-3.5 flex items-start gap-3 text-xs">
                  <AlertCircle className="size-4 text-blue-400 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1 leading-relaxed">
                    <p className="text-blue-200">
                      <strong>Check Recipient Account (VINCE NICO O. ESCALA · 0956-618-0016):</strong>
                    </p>
                    <p className="text-muted-foreground text-[11px]">
                      Open the GCash app on the treasury phone or check incoming SMS alerts from <strong>2882</strong> to locate the 13-digit Reference Number (e.g. <code>1002 9841 2910</code>) for <strong>{formatPeso(verifyModalPayment.amount)}</strong>.
                    </p>
                  </div>
                </div>

                {/* 3. GCash Reference Number Input (REQUIRED) */}
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center justify-between text-xs font-semibold text-white">
                    <span className="flex items-center gap-1.5">
                      <Hash className="size-3.5 text-blue-400" />
                      <span>GCash Transaction Reference No.</span>
                      <span className="text-red-400 font-bold">*</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono-tab font-normal">
                      Required for Audit
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      autoFocus
                      value={gcashRefInput}
                      onChange={(e) => {
                        setGcashRefInput(e.target.value);
                        if (refInputError) setRefInputError("");
                      }}
                      placeholder="e.g. 1002 9841 2910"
                      className={cn(
                        "w-full rounded-xl border bg-background px-4 py-3 text-sm text-white font-mono-tab tracking-wider focus:outline-none transition-colors",
                        refInputError
                          ? "border-red-500 focus:border-red-400"
                          : "border-border focus:border-blue-400"
                      )}
                    />
                  </div>
                  {refInputError ? (
                    <p className="text-[11px] text-red-400 flex items-center gap-1 mt-0.5">
                      <AlertCircle className="size-3" />
                      <span>{refInputError}</span>
                    </p>
                  ) : (
                    <p className="text-[10px] text-muted-foreground">
                      Input or confirm the exact reference from the GCash transaction receipt to bind this settlement.
                    </p>
                  )}
                </div>

                {/* 4. Cashier Audit Notes (Optional) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                    <span>Cashier Audit Remark (Optional)</span>
                    <span className="text-[10px]">Internal QC Treasury Record</span>
                  </label>
                  <input
                    type="text"
                    value={cashierNotesInput}
                    onChange={(e) => setCashierNotesInput(e.target.value)}
                    placeholder="e.g. Matched with SMS from 2882 on 0956-618-0016"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-white focus:border-primary focus:outline-none"
                  />
                </div>

                {/* 5. LTO LTMS Clearance Guarantee */}
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-[11px] text-emerald-400 flex items-center gap-2.5">
                  <ShieldCheck className="size-4 shrink-0" />
                  <span>
                    Confirming this payment marks the notice as <strong>PAID</strong>, issues the electronic receipt, and automatically clears the LTO LTMS apprehension hold on plate <strong>{verifyModalPayment.plateNumber}</strong>.
                  </span>
                </div>

                {/* Action buttons */}
                <div className="mt-2 flex items-center justify-end gap-2.5 pt-2 border-t border-border/70">
                  <button
                    type="button"
                    onClick={() => setVerifyModalPayment(null)}
                    disabled={verifyPayment.isPending}
                    className="rounded-xl px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-panel-elevated hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={verifyPayment.isPending}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {verifyPayment.isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Verifying & Reconciling…</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-4" />
                        <span>Confirm GCash Ref & Settle</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  );
}
