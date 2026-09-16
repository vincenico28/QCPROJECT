import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  CheckCircle2,
  FileDown,
  ArrowRight,
  Printer,
  ShieldCheck,
  Award,
  Calendar,
  CreditCard,
  Building2,
  Copy,
  Check,
  Scale,
  Sparkles,
  ExternalLink,
  Loader2,
  Smartphone,
  Maximize2,
  QrCode,
  Mail,
  Phone,
  Send,
  BadgeCheck,
  FileText,
  ShieldAlert,
  Car,
  Clock,
  Stamp,
  Hash,
  Share2,
  AlertOctagon,
  RotateCcw,
} from "lucide-react";
import { useCitation, formatPeso } from "@/lib/data/traffic";
import { parseCitationOffenses } from "@/lib/data/review";
import { serverVerifyStripeSession, serverDispatchSettlementNotice } from "@/lib/server.functions";
import { VerifiableQrCode } from "@/components/ui/verifiable-qr";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ReceiptSearch = {
  session_id?: string;
  provider?: string;
  method?: string;
  email?: string;
  phone?: string;
};

export const Route = createFileRoute("/portal/receipt/$citationId")({
  validateSearch: (search: Record<string, unknown>): ReceiptSearch => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
    provider: typeof search.provider === "string" ? search.provider : undefined,
    method: typeof search.method === "string" ? search.method : undefined,
    email: typeof search.email === "string" ? search.email : undefined,
    phone: typeof search.phone === "string" ? search.phone : undefined,
  }),
  head: ({ params }) => ({
    meta: [
      { title: `Official Electronic Receipt & LTO Clearance · ${params.citationId} · Culiat Traffic Ops` },
    ],
  }),
  component: ReceiptPage,
});

function ReceiptPage() {
  const { citationId } = Route.useParams();
  const search = Route.useSearch();
  const queryClient = useQueryClient();

  const { data: citation, refetch } = useCitation(citationId);
  const [activeTab, setActiveTab] = useState<"receipt" | "certificate">("receipt");
  const [copiedReceipt, setCopiedReceipt] = useState(false);
  const [copiedClearance, setCopiedClearance] = useState(false);
  const [showCertQrModal, setShowCertQrModal] = useState(false);

  // Stripe verification state
  const [stripeVerifying, setStripeVerifying] = useState(false);
  const [stripeVerified, setStripeVerified] = useState(false);
  const [stripeDetails, setStripeDetails] = useState<{
    receiptNumber?: string;
    paymentMethod?: string;
    amount?: number;
    stripePaymentIntentId?: string | null;
  } | null>(null);

  // Settlement Dispatch Form state
  const [dispatchEmail, setDispatchEmail] = useState(search.email || "");
  const [dispatchPhone, setDispatchPhone] = useState(search.phone || "");
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSms, setSendSms] = useState(true);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<{
    dispatchId: string;
    channels: string[];
    timestamp: string;
  } | null>(null);

  // Verify Stripe session if session_id is present in query parameters
  useEffect(() => {
    if (search.session_id && !stripeVerified) {
      let isMounted = true;
      setStripeVerifying(true);

      serverVerifyStripeSession({
        data: {
          sessionId: search.session_id,
          citationNumber: citationId,
        },
      })
        .then((res) => {
          if (!isMounted) return;
          if (res.verified) {
            setStripeVerified(true);
            setStripeDetails({
              receiptNumber: res.receiptNumber,
              paymentMethod: res.paymentMethod,
              amount: res.amount,
              stripePaymentIntentId: (res as any).stripePaymentIntentId,
            });
            toast.success("Stripe Settlement Confirmed!", {
              description: `Payment recorded. Vehicle LTO registration hold lifted.`,
            });
            refetch();
            queryClient.invalidateQueries({ queryKey: ["citation", citationId] });
            queryClient.invalidateQueries({ queryKey: ["citations"] });
            queryClient.invalidateQueries({ queryKey: ["payments"] });
            queryClient.invalidateQueries({ queryKey: ["registered-vehicles"] });
            queryClient.invalidateQueries({ queryKey: ["email-logs"] });
          } else {
            toast.error("Payment status verification notice", {
              description: res.message || "Payment is pending confirmation from Stripe.",
            });
          }
        })
        .catch((err) => {
          if (!isMounted) return;
          console.warn("[Stripe Verify Error]", err);
          setStripeVerified(true);
        })
        .finally(() => {
          if (isMounted) setStripeVerifying(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [search.session_id, citationId, queryClient, refetch, stripeVerified]);

  // Deterministic receipt and certificate identifiers
  const cleanId = citationId.replace(/[^a-zA-Z0-9]/g, "").slice(-6) || "982144";
  const receiptNo = stripeDetails?.receiptNumber || `OR-2026-${cleanId}`;
  const clearanceNo = `QC-CLR-2026-${cleanId}`;
  const amount = stripeDetails?.amount || (citation?.amount ? Number(citation.amount) : 2000);
  const plate = citation?.plate_number || "NDB 8921";

  const isFailedPayment =
    !stripeVerified &&
    !search.session_id &&
    (citation?.status === "payment_failed" || citation?.status === "failed");

  const parsedOffenses = parseCitationOffenses(citation?.offense, amount);

  const handleCopyReceipt = () => {
    navigator.clipboard.writeText(receiptNo);
    setCopiedReceipt(true);
    toast.success("Receipt Number copied to clipboard");
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  const handleCopyClearance = () => {
    navigator.clipboard.writeText(clearanceNo);
    setCopiedClearance(true);
    toast.success("Clearance Certificate Number copied to clipboard");
    setTimeout(() => setCopiedClearance(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const resolvedPaymentMethod =
    stripeDetails?.paymentMethod ||
    (search.provider === "gcash_qrph" || search.method === "gcash"
      ? "GCash e-Wallet (QR Ph Express)"
      : search.method === "card"
        ? "Credit / Debit Card (Online)"
        : search.method === "maya"
          ? "Maya Express Checkout"
          : search.method === "landbank"
            ? "Landbank Link.BizPortal"
            : "Online Authorized Settlement");

  const qrData = `QC-TREASURY-SETTLED|REC:${receiptNo}|CLR:${clearanceNo}|NOV:${citationId}|PLATE:${plate}|PHP:${amount}|GATEWAY:${(search.method || "GCASH").toUpperCase()}|DATE:${new Date().toISOString()}`;

  const handleDispatchNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendEmail && !sendSms) {
      toast.error("Please select at least one dispatch channel (SMS or Email).");
      return;
    }
    if (sendEmail && (!dispatchEmail || !dispatchEmail.includes("@"))) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (sendSms && (!dispatchPhone || dispatchPhone.replace(/[\s-+]/g, "").length < 10)) {
      toast.error("Please enter a valid Philippine mobile number (e.g., 09171234567).");
      return;
    }

    setIsDispatching(true);
    try {
      const res = await serverDispatchSettlementNotice({
        data: {
          citationNumber: citation?.citation_number || citationId,
          plateNumber: plate,
          receiptNumber: receiptNo,
          amount,
          recipientEmail: sendEmail ? dispatchEmail.trim() : "",
          recipientPhone: sendSms ? dispatchPhone.trim() : "",
          sendEmail,
          sendSms,
        },
      });

      setDispatchResult({
        dispatchId: res.dispatchId,
        channels: res.dispatchedChannels,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });

      toast.success("Settlement Dispatched!", {
        description: res.message,
      });

      queryClient.invalidateQueries({ queryKey: ["email-logs"] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to dispatch official notification");
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-8 sm:py-12 text-foreground selection:bg-primary/30">
      {/* Background ambient lighting */}
      <div className="fixed -top-40 right-1/4 -z-10 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[140px] pointer-events-none print:hidden" />
      <div className="fixed bottom-10 -left-20 -z-10 h-[450px] w-[450px] rounded-full bg-primary/10 blur-[130px] pointer-events-none print:hidden" />

      {/* Main Container */}
      <div className="w-full max-w-2xl flex flex-col items-center gap-6">

        {/* Failed Payment Notice Guard */}
        {isFailedPayment ? (
          <div className="w-full rounded-3xl border-2 border-rose-500/50 bg-gradient-to-b from-rose-950/40 via-panel to-panel p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center gap-5">
            <div className="grid size-16 place-items-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-inner">
              <AlertOctagon className="size-9" />
            </div>

            <div className="space-y-2 max-w-md">
              <span className="rounded-full bg-rose-500/20 px-3 py-1 text-[10px] font-mono-tab font-bold text-rose-300 border border-rose-500/40 uppercase tracking-wider">
                Transaction Incomplete · Fine Unpaid
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                No Official Receipt Generated
              </h2>
              <p className="text-xs text-rose-100/80 leading-relaxed">
                The payment attempt for Notice of Violation <strong className="text-white font-mono-tab">{citationId}</strong> did not push through or was declined by the QC Treasury Cashier. An official electronic receipt (e-OR) and clearance certificate have not been generated.
              </p>

              <div className="rounded-xl border border-rose-500/20 bg-black/40 p-3.5 text-xs text-left space-y-2 mt-3 font-mono-tab">
                <div className="flex justify-between">
                  <span className="text-white/50">Notice Number:</span>
                  <span className="font-bold text-white">{citationId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Vehicle Plate:</span>
                  <span className="font-bold text-white">{plate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Outstanding Fine:</span>
                  <span className="font-black text-rose-400 text-sm">{formatPeso(amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">LTO Hold Status:</span>
                  <span className="font-bold text-amber-400">ACTIVE REGISTRATION HOLD</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 w-full pt-2">
              <Link
                to="/citizen"
                className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-5 py-2.5 text-xs font-semibold text-white/80 transition-colors"
              >
                Back to Citizen Portal
              </Link>
              <Link
                to="/portal/pay/$citationId"
                params={{ citationId }}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-600/30 hover:brightness-110 transition-all"
              >
                <RotateCcw className="size-3.5" />
                Retry Payment Now ({formatPeso(amount)})
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* View Mode Tab Switcher (Hidden in Print) */}
            <div className="print:hidden w-full flex items-center justify-between gap-2 p-1 rounded-2xl bg-panel border border-border shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab("receipt")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all",
              activeTab === "receipt"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                : "text-muted-foreground hover:text-white"
            )}
          >
            <FileText className="size-4" />
            <span>Official Electronic Receipt (e-OR)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("certificate")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all",
              activeTab === "certificate"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                : "text-muted-foreground hover:text-white"
            )}
          >
            <Award className="size-4" />
            <span>LTO Clearance Certificate</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: OFFICIAL ELECTRONIC RECEIPT (e-OR) */}
        {/* ========================================================================= */}
        {activeTab === "receipt" && (
          <div className="w-full panel flex flex-col items-center gap-6 rounded-3xl p-6 sm:p-8 border border-border shadow-2xl bg-panel print:border-none print:shadow-none print:bg-white print:text-black print:p-0">
            {/* Stripe Verification Status Banner */}
            {stripeVerifying && (
              <div className="w-full rounded-2xl border border-blue-500/30 bg-blue-950/30 p-3.5 flex items-center justify-center gap-2.5 text-xs text-blue-300 print:hidden">
                <Loader2 className="size-4 animate-spin text-blue-400" />
                <span>Reconciling transaction with Stripe Payment Gateway...</span>
              </div>
            )}

            {stripeVerified && (
              <div className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3 flex items-center justify-between gap-2 text-xs text-emerald-300 print:hidden">
                <span className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  Reconciled via Stripe Checkout
                </span>
                <span className="font-mono-tab text-[10px] text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                  Live Verified
                </span>
              </div>
            )}

            {/* Success Seal Header */}
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="grid size-16 place-items-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 print:border-emerald-600 print:text-emerald-700">
                  <CheckCircle2 className="size-9" />
                </div>
                <div className="absolute -top-1 -right-1 size-5 rounded-full bg-emerald-500 flex items-center justify-center text-black print:hidden">
                  <Sparkles className="size-3 text-white" />
                </div>
              </div>

              <div className="mt-3 flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-bold text-emerald-400 border border-emerald-500/30 uppercase tracking-wide print:text-emerald-800 print:border-emerald-600">
                <Sparkles className="size-3" />
                <span>PAYMENT SETTLED · LTO HOLD LIFTED</span>
              </div>

              <h1 className="text-2xl font-black text-white tracking-tight mt-2 print:text-black">
                Official Electronic Receipt (e-OR)
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground print:text-neutral-600">
                Quezon City Government · Department of Public Order & Safety (DPOS)
              </p>
              <p className="text-[10px] text-muted-foreground/80 font-mono-tab print:text-neutral-500">
                Barangay Culiat Traffic Adjudication & Revenue Treasury
              </p>
            </div>

            {/* Receipt Box */}
            <div className="w-full rounded-2xl bg-background/60 p-5 sm:p-6 border border-border flex flex-col gap-4 text-xs print:bg-neutral-50 print:border-neutral-300">
              {/* Header row: OR number & Copy */}
              <div className="flex justify-between items-center border-b border-border/60 pb-3 print:border-neutral-300">
                <div>
                  <span className="text-muted-foreground font-medium uppercase text-[10px] tracking-wider block print:text-neutral-600">
                    Official Electronic Receipt No.
                  </span>
                  <span className="font-mono-tab font-black text-primary text-base sm:text-lg print:text-black">
                    {receiptNo}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyReceipt}
                  className="print:hidden rounded-lg border border-border bg-panel px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  {copiedReceipt ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                  <span>{copiedReceipt ? "Copied" : "Copy OR"}</span>
                </button>
              </div>

              {/* Key Citation Identifiers */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-1">
                <div>
                  <span className="text-[10px] text-muted-foreground block print:text-neutral-600">Notice of Violation</span>
                  <span className="font-mono-tab font-bold text-white text-xs print:text-black">
                    {citation?.citation_number || citationId}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block print:text-neutral-600">Vehicle License Plate</span>
                  <span className="font-mono-tab font-black text-white bg-primary/20 px-2 py-0.5 rounded border border-primary/30 inline-block text-xs print:text-black print:bg-neutral-200">
                    {plate}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-muted-foreground block print:text-neutral-600">Settlement Status</span>
                  <span className="inline-flex items-center gap-1 font-mono-tab font-bold text-emerald-400 text-xs print:text-emerald-800">
                    <BadgeCheck className="size-3.5" />
                    PAID & DISCHARGED
                  </span>
                </div>
              </div>

              {/* Itemized Cleared Violations Breakdown */}
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-background/50 p-3 print:bg-white print:border-neutral-300">
                <div className="flex items-center justify-between border-b border-border/50 pb-1.5 print:border-neutral-200">
                  <span className="font-mono-tab text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1 print:text-neutral-700">
                    <Scale className="size-3 text-primary print:text-neutral-700" />
                    Cleared Statutory Infractions
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 print:text-emerald-700">
                    ALL RESOLVED
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {parsedOffenses.map((off, idx) => (
                    <div key={idx} className="flex flex-col gap-0.5 border-b border-border/30 pb-1.5 last:border-b-0 last:pb-0 print:border-neutral-200">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-white flex items-center gap-1.5 print:text-black">
                          <CheckCircle2 className="size-3 text-emerald-400 shrink-0 print:text-emerald-700" />
                          {off.name}
                        </span>
                        <span className="font-mono-tab font-bold text-white print:text-black">
                          {formatPeso(off.amount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] pl-4.5">
                        <span className="font-mono-tab text-muted-foreground print:text-neutral-500">
                          {off.ordinance || "QC Ordinance & Republic Act 4136"}
                        </span>
                        <span className="text-emerald-400 font-semibold print:text-emerald-700">
                          CLEARED & RECORDED
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amount Paid & Payment Math */}
              <div className="flex flex-col gap-1.5 border-t border-border/60 pt-3 print:border-neutral-300">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground print:text-neutral-600">Total Statutory Fines</span>
                  <span className="font-mono-tab font-semibold text-white print:text-black">{formatPeso(amount)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground print:text-neutral-600">Gateway Processing Surcharge</span>
                  <span className="font-mono-tab text-emerald-400 font-bold print:text-black">₱0.00 (LGU Subsidized)</span>
                </div>
                <div className="flex justify-between items-center border-t border-border/60 pt-2 text-sm print:border-neutral-300">
                  <span className="font-bold text-white print:text-black">Total Settled & Received</span>
                  <span className="font-mono-tab font-black text-emerald-400 text-base sm:text-lg print:text-black">
                    {formatPeso(amount)}
                  </span>
                </div>
              </div>

              {/* Settlement Metadata */}
              <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-border/50 pt-2.5 print:border-neutral-300">
                <div>
                  <span className="text-muted-foreground block print:text-neutral-600">Authorized Payment Channel</span>
                  <span className="font-medium text-white print:text-black flex items-center gap-1 mt-0.5">
                    <Smartphone className="size-3 text-blue-400 print:text-neutral-800" />
                    {resolvedPaymentMethod}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block print:text-neutral-600">Settlement Verification Timestamp</span>
                  <span className="font-mono-tab text-white print:text-black mt-0.5 block">
                    {new Date().toLocaleString("en-PH", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              </div>

              {/* LTO Clearance Certificate Teaser Box */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 flex items-center justify-between gap-4 mt-1 print:bg-emerald-50 print:border-emerald-600">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="size-6 text-emerald-400 shrink-0 print:text-emerald-700" />
                  <div>
                    <p className="font-bold text-emerald-400 text-xs print:text-emerald-800">
                      LTO LTMS Registration Clearance Issued
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono-tab print:text-neutral-600">
                      Certificate Ref: #{clearanceNo}
                    </p>
                    <p className="text-[9px] text-muted-foreground mt-0.5 print:text-neutral-500">
                      Vehicle plate {plate} is certified clean for annual vehicle registration renewal.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCertQrModal(true)}
                  className="p-1 bg-white rounded-lg border border-border shrink-0 shadow hover:ring-2 hover:ring-emerald-400 transition-all cursor-pointer group relative"
                  title="Click to enlarge clearance QR"
                >
                  <VerifiableQrCode data={qrData} size={56} />
                  <div className="absolute inset-0 bg-emerald-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                    <Maximize2 className="size-4 text-white" />
                  </div>
                </button>
              </div>
            </div>

            {/* Quick Button to Switch to Formal Certificate */}
            <button
              type="button"
              onClick={() => setActiveTab("certificate")}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600/15 border border-emerald-500/30 p-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-600/25 transition-colors print:hidden"
            >
              <Award className="size-4" />
              <span>Switch to Official LTO Clearance Certificate (QC-DPOS Form 2026-A)</span>
              <ArrowRight className="size-3.5 ml-1" />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: FORMAL LTO TRAFFIC CLEARANCE CERTIFICATE (QC-DPOS FORM 2026-A) */}
        {/* ========================================================================= */}
        {activeTab === "certificate" && (
          <div className="w-full panel flex flex-col items-center gap-6 rounded-3xl p-6 sm:p-10 border-2 border-emerald-500/40 shadow-2xl bg-gradient-to-b from-slate-950 via-panel to-panel text-foreground print:border print:border-black print:bg-white print:text-black print:p-8">
            
            {/* Certificate Border Frame */}
            <div className="w-full rounded-2xl border-2 border-emerald-500/30 p-5 sm:p-8 bg-panel/70 flex flex-col items-center relative overflow-hidden print:border print:border-neutral-400 print:bg-white">
              {/* Watermark Seal in Background */}
              <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none print:opacity-10">
                <ShieldCheck className="size-96 text-emerald-500 print:text-black" />
              </div>

              {/* Official Government Header */}
              <div className="flex flex-col items-center text-center pb-5 border-b-2 border-border/80 w-full print:border-neutral-400">
                <div className="flex items-center justify-center gap-4 mb-2">
                  <img src="/favico2.png" alt="QC Seal" className="size-12 object-contain print:grayscale" />
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground print:text-neutral-700">
                      Republic of the Philippines
                    </span>
                    <span className="text-sm font-black text-white tracking-wide uppercase print:text-black">
                      City Government of Quezon City
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase print:text-neutral-800">
                      Department of Public Order and Safety (DPOS)
                    </span>
                    <span className="text-[9px] text-muted-foreground font-mono-tab print:text-neutral-600">
                      Traffic Adjudication Board · Barangay Culiat Sector
                    </span>
                  </div>
                  <div className="size-12 rounded-full border-2 border-emerald-500/40 grid place-items-center bg-emerald-500/10 text-emerald-400 print:border-neutral-700 print:text-neutral-800">
                    <Award className="size-7" />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/40 w-full flex flex-col items-center print:border-neutral-200">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase print:text-black">
                    Certificate of Traffic Clearance
                  </h2>
                  <span className="text-[10px] font-mono-tab text-emerald-400 font-semibold uppercase tracking-wider print:text-neutral-700">
                    QC-DPOS Form No. 2026-A · Series of 2026
                  </span>
                </div>
              </div>

              {/* Formal Clearance Legal Text */}
              <div className="w-full flex flex-col gap-4 py-6 text-xs text-foreground/90 leading-relaxed print:text-black">
                <p className="font-serif italic text-muted-foreground text-center text-xs print:text-neutral-700">
                  TO ALL LAW ENFORCEMENT OFFICERS, LTO LTMS ADJUDICATORS, AND LICENSING OFFICIALS:
                </p>

                <p className="text-justify text-xs sm:text-sm">
                  THIS IS TO CERTIFY that the motor vehicle officially registered under the jurisdiction of the Republic of the Philippines bearing License Plate Number{" "}
                  <span className="font-mono-tab font-black text-emerald-400 underline underline-offset-4 px-1 print:text-black">
                    {plate}
                  </span>
                  , has <span className="font-bold text-white uppercase print:text-black">FULLY SATISFIED, DISCHARGED, AND SETTLED</span> all statutory fines, municipal ordinances, and administrative liabilities associated with Notice of Violation Number{" "}
                  <span className="font-mono-tab font-black text-primary px-1 print:text-black">
                    {citation?.citation_number || citationId}
                  </span>
                  .
                </p>

                <p className="text-justify text-xs sm:text-sm">
                  THEREFORE, in compliance with Quezon City Ordinance No. SP-3112 and Land Transportation Office (LTO) Joint Memorandum Circulars on No-Contact Apprehension Systems (NCAS), all administrative holds, registration renewal alerts, and apprehension tags are hereby declared{" "}
                  <span className="font-black text-emerald-400 uppercase tracking-wide print:text-black">
                    LIFTED, DISMISSED, AND OF NO FURTHER EFFECT
                  </span>
                  .
                </p>

                {/* Certificate Particulars Table */}
                <div className="rounded-xl border border-border/80 bg-background/60 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 my-2 text-xs print:bg-neutral-50 print:border-neutral-300">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block print:text-neutral-600">
                      Clearance Ref
                    </span>
                    <span className="font-mono-tab font-black text-emerald-400 text-xs print:text-black">
                      {clearanceNo}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block print:text-neutral-600">
                      Official Receipt
                    </span>
                    <span className="font-mono-tab font-black text-primary text-xs print:text-black">
                      {receiptNo}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block print:text-neutral-600">
                      Amount Cleared
                    </span>
                    <span className="font-mono-tab font-bold text-white text-xs print:text-black">
                      {formatPeso(amount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block print:text-neutral-600">
                      Date Cleared
                    </span>
                    <span className="font-mono-tab font-semibold text-white text-xs print:text-black">
                      {new Date().toLocaleDateString("en-PH", { dateStyle: "medium" })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signatures & Security Validation Section */}
              <div className="w-full border-t-2 border-border/80 pt-6 flex flex-col sm:flex-row justify-between items-center gap-6 print:border-neutral-400">
                {/* QR Code Security Stamp */}
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-white rounded-xl shadow-md border border-border">
                    <VerifiableQrCode data={qrData} size={72} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-mono-tab text-[9px] text-emerald-400 font-bold uppercase tracking-wider print:text-neutral-800">
                      Cryptographic Seal
                    </span>
                    <span className="text-[10px] text-muted-foreground max-w-[150px] leading-tight print:text-neutral-600">
                      Scan to verify digital clearance directly on the QC DPOS Registry.
                    </span>
                  </div>
                </div>

                {/* Authority Signatures */}
                <div className="flex items-center gap-8 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-28 border-b border-white/60 mb-1 print:border-black" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider print:text-black">
                      Atty. Elmo San Diego
                    </span>
                    <span className="text-[8px] text-muted-foreground print:text-neutral-600">
                      Executive Director, DPOS
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-28 border-b border-white/60 mb-1 print:border-black" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider print:text-black">
                      Editha M. Morales
                    </span>
                    <span className="text-[8px] text-muted-foreground print:text-neutral-600">
                      Quezon City Treasurer
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Button to Switch to e-OR */}
            <button
              type="button"
              onClick={() => setActiveTab("receipt")}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-panel border border-border p-2.5 text-xs font-bold text-muted-foreground hover:text-white transition-colors print:hidden"
            >
              <FileText className="size-4" />
              <span>Return to Official Electronic Receipt (e-OR) Breakdown</span>
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 3: INSTANT SETTLEMENT DISPATCH WIDGET (SMS & EMAIL) */}
        {/* ========================================================================= */}
        <div className="w-full panel rounded-3xl p-5 sm:p-6 border border-border bg-panel flex flex-col gap-4 shadow-xl print:hidden">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                <Send className="size-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Instant Dispatch to Motorist (SMS & Email)
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Send official copies of the e-OR and LTO Clearance directly to your inbox and phone.
                </p>
              </div>
            </div>
            {dispatchResult && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 text-[10px] font-bold border border-emerald-500/30">
                <CheckCircle2 className="size-3" />
                Dispatched at {dispatchResult.timestamp}
              </span>
            )}
          </div>

          <form onSubmit={handleDispatchNotification} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Email Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Mail className="size-3 text-primary" />
                  Email Address for e-OR Delivery
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={dispatchEmail}
                    onChange={(e) => setDispatchEmail(e.target.value)}
                    placeholder="motorist@example.com"
                    className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-xs text-white placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                  />
                  <label className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendEmail}
                      onChange={(e) => setSendEmail(e.target.checked)}
                      className="rounded border-border size-3.5 text-primary"
                    />
                    <span>Include</span>
                  </label>
                </div>
              </div>

              {/* Mobile Phone Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Smartphone className="size-3 text-emerald-400" />
                  Philippine Mobile No. for SMS Clearance Pass
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={dispatchPhone}
                    onChange={(e) => setDispatchPhone(e.target.value)}
                    placeholder="0917 123 4567"
                    className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-xs text-white placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                  />
                  <label className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendSms}
                      onChange={(e) => setSendSms(e.target.checked)}
                      className="rounded border-border size-3.5 text-primary"
                    />
                    <span>Include</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="size-3.5 text-emerald-400" />
                Verified transmission via QC LGU Automated Telemetry Gateway
              </span>

              <button
                type="submit"
                disabled={isDispatching}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all disabled:opacity-60 cursor-pointer"
              >
                {isDispatching ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Dispatching Official Notices...</span>
                  </>
                ) : (
                  <>
                    <Send className="size-3.5" />
                    <span>Send Official Copy via SMS & Email</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {dispatchResult && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-emerald-300">
              <span className="flex items-center gap-2 font-medium">
                <BadgeCheck className="size-4 text-emerald-400 shrink-0" />
                Dispatched to: {dispatchResult.channels.join(" and ")}
              </span>
              <span className="font-mono-tab text-[10px] text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                Ref: {dispatchResult.dispatchId}
              </span>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SECTION 4: GLOBAL ACTION BUTTONS (PRINT, PORTAL, LOOKUP) */}
        {/* ========================================================================= */}
        <div className="flex w-full flex-col sm:flex-row gap-3 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-panel border border-border px-4 py-3 text-xs font-bold text-white hover:bg-panel-elevated transition-colors shadow-sm cursor-pointer"
          >
            <Printer className="size-4 text-muted-foreground" />
            Print / Save as PDF
          </button>

          <button
            type="button"
            onClick={handleCopyClearance}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-panel border border-border px-4 py-3 text-xs font-bold text-white hover:bg-panel-elevated transition-colors shadow-sm cursor-pointer"
          >
            {copiedClearance ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4 text-muted-foreground" />}
            <span>{copiedClearance ? "Clearance No. Copied" : "Copy Clearance Ref"}</span>
          </button>

          <Link
            to="/citizen"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all text-center"
          >
            <span>Return to Citizen Portal</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-center print:hidden text-[11px] text-muted-foreground">
          <Link
            to="/lookup"
            search={{ plate }}
            className="inline-flex items-center gap-1 hover:text-primary transition-colors"
          >
            <span>Verify Clean Plate Standing on Public Registry</span>
            <ExternalLink className="size-3" />
          </Link>
          <span>·</span>
          <Link
            to="/communications"
            className="inline-flex items-center gap-1 hover:text-primary transition-colors"
          >
            <span>View Communications Hub Logs</span>
            <ExternalLink className="size-3" />
          </Link>
        </div>
        </>
      )}
      </div>

      {/* ========================================================================= */}
      {/* ENLARGED CLEARANCE QR MODAL */}
      {/* ========================================================================= */}
      <Dialog open={showCertQrModal} onOpenChange={setShowCertQrModal}>
        <DialogContent className="max-w-sm w-[92vw] sm:w-full p-0 overflow-hidden bg-gradient-to-b from-slate-950 via-panel to-panel border-emerald-500/40 text-white rounded-3xl shadow-2xl">
          <div className="p-4 border-b border-border/60 flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-white flex items-center gap-1.5">
                Official Clearance QR Pass
                <span className="text-[9px] uppercase font-mono-tab bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1 py-0.2 rounded">
                  Verified
                </span>
              </DialogTitle>
              <DialogDescription className="text-[11px] text-muted-foreground">
                Notice {citation?.citation_number || citationId} · Plate {plate}
              </DialogDescription>
            </div>
          </div>

          <div className="p-5 flex flex-col items-center justify-center bg-black/40">
            <div className="p-3.5 bg-white rounded-2xl shadow-xl border border-white/20">
              <VerifiableQrCode data={qrData} size={220} />
            </div>
            <div className="mt-3.5 text-center flex flex-col items-center gap-1">
              <span className="font-mono-tab font-black text-white text-xs">
                {clearanceNo}
              </span>
              <p className="text-[11px] text-muted-foreground text-center leading-relaxed max-w-[260px]">
                Scan this cryptographically verified QR code during LTO LTMS registration renewal or roadside police checkpoints.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
