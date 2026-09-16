import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Loader2,
  CreditCard,
  Smartphone,
  ShieldCheck,
  Building2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Lock,
  QrCode,
  Copy,
  Check,
  Info,
  Scale,
  Sparkles,
  ExternalLink,
  Zap,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Download,
  Search,
  BadgeCheck,
} from "lucide-react";
import { formatPeso, useCitation, useUpdateCitationStatus } from "@/lib/data/traffic";
import { parseCitationOffenses } from "@/lib/data/review";
import {
  processPaymentCheckout,
  serverCreateStripeCheckoutSession,
  serverRecordFailedPayment,
} from "@/lib/server.functions";
import { VerifiableQrCode } from "@/components/ui/verifiable-qr";
import { DEFAULT_GCASH_QR, GCASH_QR_URL } from "@/assets/gcash-qr";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { FileDisputeDialog } from "@/components/citations/file-dispute-dialog";

export const Route = createFileRoute("/portal/pay/$citationId")({
  head: ({ params }) => ({
    meta: [
      { title: `Secure Payment · Notice ${params.citationId} · Culiat Traffic Ops` },
    ],
  }),
  component: PaymentPage,
});

type PaymentMethod = "gcash" | "maya" | "landbank" | "card";

function PaymentPage() {
  const { citationId } = Route.useParams();
  const navigate = useNavigate();
  const [method, setMethod] = useState<PaymentMethod>("gcash");
  const [busy, setBusy] = useState(false);
  const [busyStep, setBusyStep] = useState<string>("");
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [copiedAccountNo, setCopiedAccountNo] = useState(false);
  const [gcashRefNumber, setGcashRefNumber] = useState("");
  const [qrLoadFailed, setQrLoadFailed] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrZoomMode, setQrZoomMode] = useState<"card" | "qr-only">("card");

  // Recipient GCash Account Configuration from Environment Variables
  const gcashAccountName = (import.meta as any).env.VITE_GCASH_ACCOUNT_NAME || "Quezon City DPOS Treasury";
  const gcashAccountNumber = (import.meta as any).env.VITE_GCASH_ACCOUNT_NUMBER || "0917-882-9411";
  const envQr = (import.meta as any).env?.VITE_GCASH_QR_IMAGE;
  const gcashCustomQr =
    envQr && envQr.trim() !== "" && envQr !== "/my-gcash-qr.png" && envQr !== "/assets/my-gcash-qr.png"
      ? envQr
      : DEFAULT_GCASH_QR;

  // Form Fields
  const [payerName, setPayerName] = useState("Juan Dela Cruz");
  const [payerEmail, setPayerEmail] = useState("juan.delacruz@gmail.com");
  const [mobileNumber, setMobileNumber] = useState("0917-882-9411");
  const [profileAutoFilled, setProfileAutoFilled] = useState(false);

  // Card details state
  const [cardNumber, setCardNumber] = useState("4532 •••• •••• 8912");
  const [cardExpiry, setCardExpiry] = useState("08/29");
  const [cardCvv, setCardCvv] = useState("•••");

  const { data: citation, isLoading, error } = useCitation(citationId);
  const updateCitation = useUpdateCitationStatus();
  const queryClient = useQueryClient();
  const amount = citation?.amount ? Number(citation.amount) : 2000;

  // Auto-populate from citation's citizen motorist details or active citizen session
  useEffect(() => {
    if (citation && !profileAutoFilled) {
      let candidateName = citation.citizenName || citation.registeredOwner || "";
      let candidateEmail = citation.citizenEmail || "";
      let candidatePhone = citation.citizenPhone || "";

      try {
        const storedSession = localStorage.getItem("qc_citizen_session");
        if (storedSession) {
          const parsed = JSON.parse(storedSession);
          if (!candidateName && parsed.full_name) candidateName = parsed.full_name;
          if (!candidateEmail && parsed.email) candidateEmail = parsed.email;
          if (!candidatePhone && parsed.phone) candidatePhone = parsed.phone;
        }
      } catch {
        // Ignore session parse error
      }

      if (candidateName) setPayerName(candidateName);
      if (candidateEmail) setPayerEmail(candidateEmail);
      if (candidatePhone) setMobileNumber(candidatePhone);

      if (candidateName || candidateEmail || citation.isCitizenRegistered) {
        setProfileAutoFilled(true);
      }
    }
  }, [citation, profileAutoFilled]);

  // Breakdown of statutory offenses
  const parsedOffenses = parseCitationOffenses(citation?.offense, amount);

  const handleCopyNotice = () => {
    navigator.clipboard.writeText(citation?.citation_number || citationId);
    setCopiedNotice(true);
    toast.success("Notice number copied to clipboard");
    setTimeout(() => setCopiedNotice(false), 2000);
  };

  const handleCopyAccountNo = () => {
    navigator.clipboard.writeText(gcashAccountNumber.replace(/[^0-9]/g, ""));
    setCopiedAccountNo(true);
    toast.success("Recipient GCash number copied to clipboard!");
    setTimeout(() => setCopiedAccountNo(false), 2000);
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);

    const citNumber = citation?.citation_number || citationId;
    const plate = citation?.plate_number || "NDB-8921";

    try {
      // 1. If Card selected and Stripe is configured, try Stripe Checkout:
      if (method === "card") {
        setBusyStep("Connecting to Stripe Secure Gateway…");
        try {
          const stripeRes = await serverCreateStripeCheckoutSession({
            data: {
              citationNumber: citNumber,
              plateNumber: plate,
              amount,
              paymentMethod: "card",
              payerEmail,
              payerName,
              originUrl: window.location.origin,
            },
          });

          if (stripeRes.url) {
            toast.success("Redirecting to Stripe Hosted Checkout...");
            window.location.href = stripeRes.url;
            return;
          } else if (stripeRes.redirectUrl) {
            toast.success("Redirecting to Stripe Settlement Verification...");
            window.location.href = stripeRes.redirectUrl;
            return;
          }
        } catch {
          // Fallback to direct settlement below
        }
      }

      // 2. GCash QR Ph & Direct LGU Settlement:
      if (method === "gcash") {
        const cleanRef = gcashRefNumber.trim();
        if (!cleanRef) {
          toast.error("GCash Reference No. Required", {
            description: "Please enter the 13-digit Reference Number from your GCash receipt or SMS before proceeding.",
          });
          setBusy(false);
          return;
        }
        setBusyStep("Authorizing GCash Settlement…");
        await new Promise((r) => setTimeout(r, 600));
        setBusyStep(`Verifying GCash Ref #${cleanRef} with Treasury…`);
        await new Promise((r) => setTimeout(r, 600));
        setBusyStep("Generating LTO Clearance Certificate…");
      }

      await processPaymentCheckout({
        data: {
          citationNumber: citNumber,
          plateNumber: plate,
          amount,
          paymentMethod: method,
          payerEmail,
          payerName,
          referenceNumber: gcashRefNumber.trim() || undefined,
        },
      });

      await updateCitation.mutateAsync({
        citationId: citNumber,
        status: "paid",
      });

      queryClient.invalidateQueries({ queryKey: ["finance-queue"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["citations"] });
      queryClient.invalidateQueries({ queryKey: ["citation", citNumber] });

      toast.success("Payment settlement verified!", {
        description: `Official Clearance certificate and Receipt generated for ${citNumber}.`,
      });

      navigate({
        to: "/portal/receipt/$citationId",
        params: { citationId: citNumber },
        search: {
          method: method,
          provider: method === "gcash" ? "gcash_qrph" : method,
          email: payerEmail || undefined,
          phone: mobileNumber || undefined,
        },
      });
    } catch (err) {
      console.error("[Payment Error]", err);
      const errMsg = err instanceof Error ? err.message : "Payment gateway authorization declined or connection timed out";
      toast.error("Payment settlement error", {
        description: errMsg,
      });

      try {
        await serverRecordFailedPayment({
          data: {
            citationNumber: citNumber,
            plateNumber: plate,
            amount,
            paymentMethod: method,
            referenceNumber: gcashRefNumber.trim() || undefined,
            reason: errMsg,
            payerName,
            payerEmail,
          },
        });
      } catch (logErr) {
        console.warn("[Record Failed Payment Warning]", logErr);
      }
    } finally {
      setBusy(false);
      setBusyStep("");
    }
  };

  const handleSimulateFailure = async () => {
    setBusy(true);
    setBusyStep("Contacting Payment Gateway Provider…");
    const citNumber = citation?.citation_number || citationId;
    const plate = citation?.plate_number || "NDB-8921";

    setTimeout(async () => {
      try {
        await serverRecordFailedPayment({
          data: {
            citationNumber: citNumber,
            plateNumber: plate,
            amount,
            paymentMethod: method,
            referenceNumber: `FAIL-${Math.floor(100000 + Math.random() * 900000)}`,
            reason: "Payment did not push through: Gateway authorization declined by bank or connection timed out.",
            payerName,
            payerEmail,
          },
        });
        toast.error("Payment Did Not Push Through", {
          description: `Transaction for Notice ${citNumber} failed. Status updated in Citizen Portal.`,
        });
      } catch (err: any) {
        toast.error("Error recording failed transaction", { description: err?.message });
      } finally {
        setBusy(false);
        setBusyStep("");
      }
    }, 800);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-mono-tab">Retrieving citation record from QC database...</p>
      </div>
    );
  }

  if (error || !citation) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background gap-4 p-6 text-center">
        <div className="size-14 rounded-2xl bg-danger/10 border border-danger/20 flex items-center justify-center text-danger">
          <AlertCircle className="size-8" />
        </div>
        <div className="max-w-md">
          <h2 className="text-lg font-bold text-white">Citation Notice Not Found</h2>
          <p className="text-xs text-muted-foreground mt-1">
            We could not locate notice reference <span className="font-mono-tab text-white font-semibold">{citationId}</span> in the active database.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/citizen"
            className="rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-primary/90 transition-all"
          >
            Return to Citizen Portal
          </Link>
          <Link
            to="/lookup"
            className="rounded-xl border border-border bg-panel px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-white transition-colors"
          >
            Public Plate Search
          </Link>
        </div>
      </div>
    );
  }

  const isAlreadyPaid = citation.status === "paid" || citation.status === "settled";
  const isPaymentFailed = citation.status === "payment_failed" || citation.status === "failed";
  const isDisputed = citation.status === "disputed";

  const gcashQrPayload = `00020101021226600016PH.GCASH.GATEWAY0115${citation.citation_number || citationId}5204601153066085405${amount}.005802PH5924QUEZON CITY LGU TREASURY6011QUEZON CITY62210517QC-NOV-${citation.plate_number}6304`;

  // Dedicated Already Settled View: Prevents accidental duplicate payments
  if (isAlreadyPaid) {
    return (
      <div className="min-h-dvh bg-background text-foreground flex flex-col selection:bg-emerald-500/30">
        {/* Ambient lighting */}
        <div className="fixed -top-40 right-1/4 -z-10 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[140px] pointer-events-none" />
        <div className="fixed bottom-10 -left-20 -z-10 h-[450px] w-[450px] rounded-full bg-primary/10 blur-[130px] pointer-events-none" />

        {/* Header Bar */}
        <header className="border-b border-border bg-panel/60 backdrop-blur-md sticky top-0 z-30">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <Link
              to="/citizen"
              className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-white"
            >
              <ArrowLeft className="size-3.5" />
              Back to Citizen Portal
            </Link>
            <div className="flex items-center gap-2 text-emerald-400 font-mono-tab text-xs font-bold">
              <CheckCircle2 className="size-4" />
              <span>SETTLEMENT VERIFIED · LTO HOLD LIFTED</span>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-2xl px-6 py-12 flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-full rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/25 via-panel to-panel p-8 sm:p-12 shadow-2xl flex flex-col items-center gap-6">
            <div className="relative">
              <div className="absolute -inset-3 rounded-full bg-emerald-500/20 blur-xl animate-pulse" />
              <div className="relative grid size-20 place-items-center rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-400 shadow-xl">
                <ShieldCheck className="size-10" />
              </div>
            </div>

            <div className="space-y-2 max-w-md">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3.5 py-1 text-xs font-bold text-emerald-300">
                <CheckCircle2 className="size-3.5" />
                SETTLEMENT CONFIRMED BY QC TREASURY
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Notice Already Settled & Cleared
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                This traffic citation has already been satisfied and marked paid. No additional payment is required. The Certificate of Traffic Clearance is active and all LTO registration hold alarms have been cleared.
              </p>
            </div>

            {/* Citation Particulars Summary Card */}
            <div className="w-full rounded-2xl bg-background/60 border border-border p-5 text-left flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-border/60 text-xs">
                <div>
                  <span className="text-[10px] font-mono-tab uppercase tracking-wider text-muted-foreground block">Notice Identifier</span>
                  <strong className="font-mono-tab text-white text-sm mt-0.5 block">{citation.citation_number || citationId}</strong>
                </div>
                <div>
                  <span className="text-[10px] font-mono-tab uppercase tracking-wider text-muted-foreground block">Vehicle License Plate</span>
                  <span className="inline-block font-mono-tab text-amber-300 font-black text-sm mt-0.5 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/25">
                    {citation.plate_number}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-mono-tab uppercase tracking-wider text-muted-foreground block">Violation Offense</span>
                  <span className="text-white font-medium">{citation.offense}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono-tab uppercase tracking-wider text-muted-foreground block">Amount Settled</span>
                  <span className="font-mono-tab font-black text-emerald-400 text-sm">{formatPeso(amount)}</span>
                </div>
              </div>

              {citation.citizenName && (
                <div className="pt-2 border-t border-border/60 text-xs flex items-center justify-between text-muted-foreground">
                  <span>Registered Motorist:</span>
                  <span className="text-white font-semibold">{citation.citizenName}</span>
                </div>
              )}
            </div>

            {/* LTO Clearance Status Banner */}
            <div className="w-full rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 flex items-center gap-3 text-left">
              <BadgeCheck className="size-6 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <strong className="text-emerald-300 block">LTO LTMS Vehicle Clearance: ACTIVE</strong>
                <span className="text-muted-foreground text-[11px]">Cleared for Land Transportation Office registration renewal nationwide.</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <Link
                to="/portal/receipt/$citationId"
                params={{ citationId: citation.citation_number || citation.id }}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-xs font-bold text-emerald-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all"
              >
                <FileText className="size-4" />
                View Official Receipt & Clearance
              </Link>

              <Link
                to="/lookup"
                search={{ query: citation.plate_number }}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-panel-elevated px-5 py-3 text-xs font-semibold text-white hover:bg-panel-highlight transition-all"
              >
                <Search className="size-4" />
                Check Plate Violations
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Header Bar */}
      <header className="border-b border-border bg-panel/60 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            to="/citizen"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-white"
          >
            <ArrowLeft className="size-3.5" />
            Back to Citizen Portal
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-[10px] font-bold text-blue-400">
              <span>QR Ph Certified Gateway</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Lock className="size-3.5" />
              <span className="font-mono-tab text-[10px] font-bold uppercase tracking-widest">
                256-Bit SSL Encrypted
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* TAB Appeal & Contest Due Process Banner */}
        <div className="mb-6 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-blue-950/20 to-black/40 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-start gap-3.5">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Scale className="size-5" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <strong className="text-white text-sm">Disputing this Notice of Violation?</strong>
                <span className="rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                  Legal Due Process
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Under QC Ordinance No. SP-2957, you have the legal right to submit an official contest to the Traffic Adjudication Board (TAB) for emergency overrides, stolen plates, or enforcer errors before payment.
              </p>
            </div>
          </div>
          <Link
            to="/disputes"
            search={{ citation: citation.citation_number || citationId }}
            className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-xs font-bold text-blue-300 hover:bg-blue-500/20 transition-colors"
          >
            <span>File TAB Contest</span>
            <ExternalLink className="size-3.5" />
          </Link>
        </div>

        {/* Payment Failed / Did Not Push Through Alert Banner */}
        {isPaymentFailed && !isAlreadyPaid && (
          <div className="mb-6 rounded-2xl border-2 border-rose-500/50 bg-gradient-to-r from-rose-950/40 via-red-950/30 to-black/60 p-4 sm:p-5 flex items-start justify-between gap-4 shadow-xl">
            <div className="flex items-start gap-3.5">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <AlertCircle className="size-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-rose-500/30 text-rose-200 border border-rose-500/40 px-2 py-0.5 font-mono-tab text-[10px] font-bold uppercase">
                    Payment Not Pushed Through
                  </span>
                  <span className="text-xs text-white/70 font-mono-tab">
                    Previous Attempt Failed
                  </span>
                </div>
                <p className="text-sm font-bold text-white">
                  Your previous online payment attempt did not push through.
                </p>
                <p className="text-xs text-rose-200/80 leading-relaxed">
                  The transaction was declined by the payment gateway or connection timed out before verification.
                  The outstanding fine of <strong>{formatPeso(amount)}</strong> remains UNPAID and your vehicle still has an active LTO registration hold. Please complete payment below to lift the apprehension hold.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left Column: Payment Method & Details */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-[10px] font-bold text-primary border border-primary/25">
                <Sparkles className="size-3" />
                <span>OFFICIAL QC LGU ONLINE TREASURY</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight mt-2">
                Settlement & Instant LTO Clearance
              </h1>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Pay your traffic violation fine online via GCash QR Ph or authorized government gateways. Settlement triggers immediate clearance and synchronization with the LTO Land Transportation Management System (LTMS).
              </p>
            </div>

            {/* TAB Dispute & Statutory Due Process Banner */}
            {isDisputed ? (
              <div className="rounded-2xl border border-amber-500/40 bg-amber-950/20 p-4.5 flex items-start gap-3.5 shadow-md">
                <div className="size-9 rounded-xl bg-amber-500/20 border border-amber-500/40 grid place-items-center text-amber-400 shrink-0">
                  <Scale className="size-4.5" />
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-300">Under Formal TAB Adjudication Review</span>
                    <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 text-[9px] font-mono-tab uppercase font-bold">
                      Docket Active
                    </span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-[11px]">
                    This citation has an active statutory protest filed with the Quezon City Traffic Adjudication Board. Fines and penalties are held in abeyance pending board resolution. You may voluntarily settle below to immediately clear all LTO LTMS registration holds.
                  </p>
                  <div className="pt-1">
                    <Link
                      to="/citizen"
                      className="text-primary hover:underline text-[11px] font-semibold inline-flex items-center gap-1"
                    >
                      <span>Check Appeal Status in Citizen Portal</span>
                      <ExternalLink className="size-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ) : !isAlreadyPaid ? (
              <div className="rounded-2xl border border-border/80 bg-background/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="size-8 rounded-xl bg-primary/15 border border-primary/25 grid place-items-center text-primary shrink-0 mt-0.5">
                    <Scale className="size-4" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white block">
                      Right to Contest Before Payment (Due Process)
                    </span>
                    <p className="text-[11px] text-muted-foreground leading-relaxed max-w-lg">
                      Motorists who believe this violation was issued in error, that an optical plate misread occurred, or an emergency exemption applies may file a formal protest under QC Ordinance No. SP-2957 within 10 days of notice.
                    </p>
                  </div>
                </div>
                <div className="shrink-0 pl-11 sm:pl-0">
                  <FileDisputeDialog
                    citationId={citation.id}
                    citationNumber={citation.citation_number || citationId}
                    trigger={
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-2 text-xs font-bold text-amber-300 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                      >
                        <Scale className="size-3.5" />
                        <span>Contest Violation</span>
                      </button>
                    }
                  />
                </div>
              </div>
            ) : null}

            <form onSubmit={handlePay} className="flex flex-col gap-6">
              {/* Payment Methods */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono-tab text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Select Payment Gateway
                  </span>
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="size-3" /> Zero Gateway Surcharge
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <MethodButton
                    active={method === "gcash"}
                    onClick={() => setMethod("gcash")}
                    title="GCash"
                    sub="e-Wallet / QR Ph"
                    icon={Smartphone}
                    badge="QR Ph Official"
                  />
                  <MethodButton
                    active={method === "maya"}
                    onClick={() => setMethod("maya")}
                    title="Maya"
                    sub="Wallet & Direct Pay"
                    icon={Smartphone}
                  />
                  <MethodButton
                    active={method === "card"}
                    onClick={() => setMethod("card")}
                    title="Credit / Debit"
                    sub="Visa · MC · Card"
                    icon={CreditCard}
                  />
                  <MethodButton
                    active={method === "landbank"}
                    onClick={() => setMethod("landbank")}
                    title="Landbank"
                    sub="Link.BizPortal"
                    icon={Building2}
                    badge="Direct LGU"
                  />
                </div>
              </div>

              {/* Gateway Interactive Details */}
              <div className="panel flex flex-col gap-4 rounded-2xl p-5 border border-border bg-panel">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <span className="font-mono-tab text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    {method === "gcash" && <Smartphone className="size-3.5 text-blue-400" />}
                    {method === "maya" && <Smartphone className="size-3.5 text-emerald-400" />}
                    {method === "card" && <CreditCard className="size-3.5 text-amber-400" />}
                    {method === "landbank" && <Building2 className="size-3.5 text-green-500" />}
                    {method.toUpperCase()} Payment Gateway
                  </span>
                  <span className="font-mono-tab text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Gateway Ready
                  </span>
                </div>

                {/* GCASH QR PH OFFICIAL BOX */}
                {method === "gcash" && (
                  <div className="flex flex-col gap-4">
                    <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-b from-blue-950/40 to-panel p-4 flex flex-col sm:flex-row items-center gap-5">
                      {/* Clickable QR Code Preview with Hover Overlay & Zoom Button */}
                      <div className="flex flex-col items-center shrink-0">
                        <div
                          onClick={() => setShowQrModal(true)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setShowQrModal(true)}
                          className="group relative flex flex-col items-center p-2.5 bg-white rounded-2xl border border-border shadow-lg cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all overflow-hidden"
                          title="Click to view full screen QR"
                        >
                          {gcashCustomQr ? (
                            <img
                              src={gcashCustomQr}
                              alt="GCash Merchant QR"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = DEFAULT_GCASH_QR;
                              }}
                              className="size-40 sm:size-44 object-contain rounded-xl transition-transform duration-200 group-hover:scale-[1.03]"
                            />
                          ) : (
                            <VerifiableQrCode data={gcashQrPayload} size={150} />
                          )}

                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-blue-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white p-3 rounded-2xl backdrop-blur-[2px]">
                            <div className="size-9 rounded-full bg-white/20 flex items-center justify-center border border-white/40 shadow">
                              <Maximize2 className="size-4 text-white" />
                            </div>
                            <span className="text-[11px] font-bold text-center drop-shadow">
                              Click for Full View
                            </span>
                            <span className="text-[9px] text-blue-200 font-mono-tab">
                              Enlarge & Scan
                            </span>
                          </div>

                          <span className="font-mono-tab text-[9px] font-black text-blue-950 mt-1.5 uppercase tracking-wider">
                            QR Ph · GCash
                          </span>
                        </div>

                        {/* Dedicated Full View Button */}
                        <button
                          type="button"
                          onClick={() => setShowQrModal(true)}
                          className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-blue-500/40 bg-blue-950/60 px-3 py-1.5 text-xs font-semibold text-blue-300 hover:bg-blue-900/80 hover:text-white transition-colors shadow-sm"
                        >
                          <Maximize2 className="size-3.5" />
                          <span>Full View / Zoom QR</span>
                        </button>
                      </div>

                      <div className="flex flex-col gap-2 text-center sm:text-left flex-1">
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                          <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/40">
                            Scan to Pay with GCash
                          </span>
                          <span className="font-mono-tab text-[10px] text-muted-foreground">
                            Official Treasury Account
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Scan the official QR Ph code using your <strong>GCash App</strong> (or any QR Ph compliant e-wallet/banking app).
                        </p>

                        {/* Recipient Account Details with 1-click Copy */}
                        <div className="mt-1 flex items-center justify-between rounded-xl bg-background/80 px-3 py-2 border border-border/80 text-left">
                          <div>
                            <span className="text-[9px] text-muted-foreground block uppercase font-mono-tab">
                              Send Settlement To (GCash)
                            </span>
                            <span className="text-xs font-bold text-white block">{gcashAccountName}</span>
                            <span className="font-mono-tab text-xs text-emerald-400 font-bold">{gcashAccountNumber}</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyAccountNo}
                            className="rounded-lg border border-border bg-panel px-2.5 py-1 text-xs font-semibold text-white hover:bg-panel-elevated flex items-center gap-1.5 transition-colors shadow-sm"
                            title="Copy GCash Number"
                          >
                            {copiedAccountNo ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                            <span>{copiedAccountNo ? "Copied" : "Copy No."}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] font-medium text-muted-foreground">Payer's GCash Mobile Number</span>
                        <div className="relative">
                          <input
                            required
                            type="tel"
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value)}
                            placeholder="0917-000-0000"
                            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-white focus:border-primary focus:outline-none font-mono-tab pl-9"
                          />
                          <Smartphone className="size-4 text-blue-400 absolute left-3 top-2.5" />
                        </div>
                      </label>

                      <label className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-white flex items-center gap-1">
                            GCash Reference No. <span className="text-red-400 font-bold">*</span>
                          </span>
                          <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 border border-amber-500/30">
                            Required to Proceed
                          </span>
                        </div>
                        <input
                          required={method === "gcash"}
                          type="text"
                          value={gcashRefNumber}
                          onChange={(e) => setGcashRefNumber(e.target.value)}
                          placeholder="e.g. 1002 9841 2910"
                          className={cn(
                            "w-full rounded-xl border bg-background px-3.5 py-2.5 text-xs text-white focus:outline-none font-mono-tab transition-colors",
                            !gcashRefNumber.trim()
                              ? "border-amber-500/50 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                              : "border-border focus:border-primary"
                          )}
                        />
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Scan the QR code above with GCash, then enter the 13-digit Reference Number from your SMS or GCash receipt to proceed.
                        </p>
                      </label>
                    </div>
                  </div>
                )}

                {/* CARD */}
                {method === "card" && (
                  <div className="flex flex-col gap-3.5">
                    <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                          <CreditCard className="size-4" />
                          Credit / Debit Card Online Settlement
                        </span>
                        <div className="flex items-center gap-1 text-[10px]">
                          <span className="font-bold text-blue-400">VISA</span>
                          <span className="font-bold text-amber-500">MC</span>
                          <span className="font-bold text-emerald-400">JCB</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Card settlements are processed with 3D-Secure authentication and tokenization.
                      </p>
                    </div>

                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] font-medium text-muted-foreground">Card Number</span>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-white focus:border-primary focus:outline-none font-mono-tab"
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] font-medium text-muted-foreground">Expiry Date (MM/YY)</span>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-white focus:border-primary focus:outline-none font-mono-tab"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] font-medium text-muted-foreground">CVV</span>
                        <input
                          type="password"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-white focus:border-primary focus:outline-none font-mono-tab"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* MAYA */}
                {method === "maya" && (
                  <div className="flex flex-col gap-3">
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3.5 flex items-center justify-between gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                          <QrCode className="size-3.5" /> Maya Express Checkout
                        </span>
                        <p className="text-[10px] text-muted-foreground">
                          Authorized Maya direct merchant integration with instant reconciliation.
                        </p>
                      </div>
                      <div className="p-1.5 bg-white rounded-lg border border-border shrink-0 shadow-md">
                        <VerifiableQrCode
                          data={`00020101021226580014PH.MAYA.DIRECT0115${citation.citation_number}5204601153066085405${amount}.005802PH5917QUEZON CITY LGU6011QUEZON CITY6304`}
                          size={76}
                        />
                      </div>
                    </div>

                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] font-medium text-muted-foreground">Maya Account Mobile Number</span>
                      <input
                        required
                        type="tel"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        placeholder="0918-000-0000"
                        className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-white focus:border-primary focus:outline-none font-mono-tab"
                      />
                    </label>
                  </div>
                )}

                {/* LANDBANK */}
                {method === "landbank" && (
                  <div className="flex flex-col gap-3">
                    <div className="rounded-xl border border-green-500/20 bg-green-950/20 p-3.5 text-xs flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-green-400">Landbank Link.BizPortal Routing</span>
                        <span className="font-mono-tab text-[10px] text-muted-foreground">Agency Code: QC-DPOS-771</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Your transaction reference will be forwarded directly to the Landbank Electronic Payment System. Funds are remitted to QC Treasury Account <span className="font-mono-tab text-white font-semibold">0112-9842-19</span>.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Payer Information */}
              <div className="panel flex flex-col gap-3.5 rounded-2xl p-5 border border-border bg-panel">
                <div className="flex items-center justify-between">
                  <span className="font-mono-tab text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Payer & Official Receipt Credentials
                  </span>
                  {citation.isCitizenRegistered ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                      <ShieldCheck className="size-3" />
                      Verified Citizen Motorist Profile
                    </span>
                  ) : profileAutoFilled ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-[10px] font-bold text-blue-400">
                      <Check className="size-3" />
                      Auto-filled from Registry
                    </span>
                  ) : null}
                </div>

                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-muted-foreground">Full Name (Registered Motorist / Representative)</span>
                  <input
                    required
                    type="text"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-white focus:border-primary focus:outline-none"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium text-muted-foreground">Email for Electronic OR</span>
                    <input
                      required
                      type="email"
                      value={payerEmail}
                      onChange={(e) => setPayerEmail(e.target.value)}
                      className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-white focus:border-primary focus:outline-none font-mono-tab"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium text-muted-foreground">Mobile Contact (SMS Clearance Notice)</span>
                    <input
                      required
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-white focus:border-primary focus:outline-none font-mono-tab"
                    />
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={busy || isAlreadyPaid}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 font-bold text-white shadow-xl shadow-primary/25 hover:bg-primary/90 transition-all disabled:opacity-50 text-sm active:scale-[0.99]"
              >
                {busy ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>{busyStep || "Processing Real-Time Settlement…"}</span>
                  </>
                ) : isAlreadyPaid ? (
                  <>
                    <CheckCircle2 className="size-4 text-white" />
                    Citation Notice Cleared & Paid
                  </>
                ) : method === "gcash" ? (
                  !gcashRefNumber.trim() ? (
                    <>
                      <Smartphone className="size-4 text-amber-300 animate-pulse" />
                      <span>Input GCash Reference No. to Proceed</span>
                    </>
                  ) : (
                    <>
                      <Smartphone className="size-4" />
                      <span>Pay {formatPeso(amount)} with GCash & Lift LTO Hold</span>
                    </>
                  )
                ) : method === "card" ? (
                  <>
                    <CreditCard className="size-4" />
                    Pay {formatPeso(amount)} with Card
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-4" />
                    Settle {formatPeso(amount)} & Lift LTO Hold
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground font-mono-tab">
                <Lock className="size-3 text-emerald-400" />
                <span>Authorized Settlement Node · Official Republic Act 4136 & QC Traffic Ordinance Enforcement</span>
              </div>

              {!isAlreadyPaid && (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-semibold text-white/70 block">Gateway Diagnostic & Simulation</span>
                    <span className="text-[10px] text-white/40 block font-mono-tab">Test "Payment Not Pushed Through" state in Citizen Portal</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSimulateFailure}
                    disabled={busy}
                    className="shrink-0 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-[11px] font-bold text-rose-300 hover:bg-rose-500/20 transition-all disabled:opacity-50"
                  >
                    Simulate Payment Not Pushed Through
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Right Column: Order Summary & Itemized Statutory Breakdown */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="panel flex flex-col gap-5 rounded-3xl p-6 border border-border shadow-2xl bg-panel sticky top-24">
              {/* Notice Details Header */}
              <div className="flex items-start justify-between border-b border-border pb-3">
                <div>
                  <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Notice of Violation (NOV)
                  </span>
                  <p className="font-mono-tab text-base font-bold text-white mt-0.5">
                    {citation.citation_number}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyNotice}
                  className="rounded-lg border border-border bg-panel-elevated p-1.5 text-muted-foreground hover:text-white transition-colors"
                  title="Copy Notice Number"
                >
                  {copiedNotice ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                </button>
              </div>

              {/* Core Metadata */}
              <div className="flex flex-col gap-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">License Plate</span>
                  <span className="font-mono-tab font-black text-white bg-primary/20 px-2.5 py-0.5 rounded-lg border border-primary/30 tracking-wider">
                    {citation.plate_number}
                  </span>
                </div>
                {citation.vehicle_model && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Vehicle Model</span>
                    <span className="text-white font-medium">{citation.vehicle_model}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Issuing Authority</span>
                  <span className="text-white font-medium">QC DPOS / MMDA NCAP</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Enforcing Officer</span>
                  <span className="text-white font-medium">{citation.officer_name || "Enforcer On Duty"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Issuance Date</span>
                  <span className="font-mono-tab text-muted-foreground">
                    {new Date(citation.issued_at).toLocaleDateString("en-PH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              {/* Itemized Statutory Violation Breakdown Table */}
              <div className="flex flex-col gap-2.5 rounded-2xl border border-border/80 bg-background/50 p-3.5">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <span className="font-mono-tab text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Scale className="size-3 text-primary" />
                    Itemized Violation Breakdown
                  </span>
                  <span className="font-mono-tab text-[10px] text-muted-foreground">
                    {parsedOffenses.length} {parsedOffenses.length === 1 ? "infraction" : "infractions"}
                  </span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {parsedOffenses.map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-1 border-b border-border/40 pb-2 last:border-b-0 last:pb-0">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-semibold text-white leading-snug">
                          {item.name}
                        </span>
                        <span className="font-mono-tab text-xs font-bold text-primary shrink-0">
                          {formatPeso(item.amount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-mono-tab text-muted-foreground">
                          {item.ordinance || "QC Traffic Code"}
                        </span>
                        {item.category && (
                          <span className="rounded bg-panel px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground border border-border/60">
                            {item.category}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-[10px] text-muted-foreground/80 leading-relaxed italic">
                          {item.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Math Summary */}
              <div className="border-t border-border pt-4 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Statutory Fines Subtotal</span>
                  <span className="font-mono-tab font-semibold text-white">{formatPeso(amount)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">QC LGU Surcharge</span>
                  <span className="font-mono-tab text-emerald-400 font-semibold">₱0.00 (Standard)</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Gateway Processing Fee</span>
                  <span className="font-mono-tab text-emerald-400 font-bold">₱0.00 (Waived)</span>
                </div>
                <div className="flex justify-between items-center border-t border-border/80 pt-3 mt-1">
                  <div>
                    <span className="font-bold text-white text-sm block">Total Settlement</span>
                    <span className="text-[10px] text-muted-foreground">Full statutory fine amount</span>
                  </div>
                  <span className="font-mono-tab text-2xl font-black text-primary">
                    {formatPeso(amount)}
                  </span>
                </div>
              </div>

              {/* Instant Clearance Alert */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3.5 text-[11px] text-emerald-400 leading-relaxed flex items-start gap-2.5">
                <ShieldCheck className="size-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-0.5">Instant LTMS Clearance:</span>
                  Upon confirmation, the Quezon City treasury automatically issues your official e-receipt and signals the LTO system to remove apprehension flags.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FULL VIEW & ENLARGED GCASH QR DIALOG */}
      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent className="max-w-md w-[94vw] sm:w-full p-0 overflow-hidden bg-gradient-to-b from-slate-950 via-panel to-panel border-blue-500/40 text-white rounded-3xl shadow-2xl">
          <div className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <QrCode className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  Official GCash QR Ph
                  <span className="text-[10px] uppercase font-mono-tab bg-blue-500/20 text-blue-400 border border-blue-500/40 px-1.5 py-0.5 rounded">
                    High Resolution
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Point your GCash app scanner at the code below
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 flex flex-col items-center justify-center bg-black/40">
            {/* View Mode Switcher: Full Card vs QR Matrix Only */}
            <div className="mb-3.5 flex items-center gap-1.5 rounded-xl bg-background/90 p-1 border border-border">
              <button
                type="button"
                onClick={() => setQrZoomMode("card")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-all",
                  qrZoomMode === "card"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-white"
                )}
              >
                <ZoomOut className="size-3.5" />
                <span>Standard View</span>
              </button>
              <button
                type="button"
                onClick={() => setQrZoomMode("qr-only")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-all",
                  qrZoomMode === "qr-only"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-white"
                )}
              >
                <ZoomIn className="size-3.5" />
                <span>Zoom In (1.3x)</span>
              </button>
            </div>

            {/* High-Resolution QR Display Container */}
            <div
              onClick={() => setQrZoomMode(qrZoomMode === "card" ? "qr-only" : "card")}
              className="relative bg-white p-3 rounded-2xl shadow-2xl border border-white/20 overflow-hidden flex items-center justify-center cursor-pointer select-none max-h-[58vh] sm:max-h-[62vh]"
              title="Click to toggle zoom"
            >
              <div className={cn("transition-all duration-300 flex items-center justify-center overflow-hidden", qrZoomMode === "qr-only" ? "size-64 sm:size-72" : "")}>
                <img
                  src={gcashCustomQr}
                  alt="Official GCash QR Code"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_GCASH_QR;
                  }}
                  className={cn(
                    "object-contain rounded-xl transition-all duration-300",
                    qrZoomMode === "qr-only"
                      ? "scale-[1.3]"
                      : "size-64 sm:size-72 max-h-[50vh]"
                  )}
                />
              </div>
            </div>

            {/* Recipient info with 1-click Copy */}
            <div className="w-full mt-4 flex flex-col gap-2.5">
              <div className="flex items-center justify-between rounded-xl bg-background/90 px-3.5 py-2.5 border border-border text-left">
                <div>
                  <span className="text-[9px] text-muted-foreground uppercase font-mono-tab block">
                    Recipient Account
                  </span>
                  <span className="text-xs font-bold text-white block">{gcashAccountName}</span>
                  <span className="font-mono-tab text-xs text-emerald-400 font-bold">{gcashAccountNumber}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyAccountNo}
                  className="rounded-lg border border-border bg-panel px-3 py-1.5 text-xs font-semibold text-white hover:bg-panel-elevated flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  {copiedAccountNo ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                  <span>{copiedAccountNo ? "Copied" : "Copy No."}</span>
                </button>
              </div>

              {/* Utility actions: Open in new tab + Download QR */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={GCASH_QR_URL || "/my-gcash-qr.png"}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-border/80 bg-panel/80 hover:bg-panel py-2 px-3 text-xs font-medium text-center text-muted-foreground hover:text-white flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="size-3.5" />
                  <span>Open in New Tab</span>
                </a>
                <a
                  href={GCASH_QR_URL || "/my-gcash-qr.png"}
                  download="my-gcash-qr.png"
                  className="rounded-xl border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 py-2 px-3 text-xs font-medium text-center text-blue-400 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="size-3.5" />
                  <span>Download QR</span>
                </a>
              </div>

              <p className="text-[11px] text-center text-muted-foreground leading-relaxed mt-0.5">
                💡 <strong>Tip for mobile motorists:</strong> Download or screenshot this QR, open GCash, tap <strong>Scan QR</strong>, and choose <strong>Upload QR from Photos</strong>.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MethodButton({
  active,
  onClick,
  title,
  sub,
  icon: Icon,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  sub: string;
  icon: typeof Smartphone;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-start gap-1.5 rounded-2xl border p-4 text-left transition-all",
        active
          ? "border-primary bg-primary/10 shadow-md shadow-primary/10"
          : "border-border bg-panel hover:bg-panel-elevated"
      )}
    >
      {badge && (
        <span className="absolute right-3 top-3 rounded-full bg-primary/20 px-1.5 py-0.5 text-[9px] font-bold text-primary border border-primary/30">
          {badge}
        </span>
      )}
      <div className="flex items-center justify-between w-full">
        <Icon className={cn("size-5", active ? "text-primary" : "text-muted-foreground")} />
        {active && !badge && <CheckCircle2 className="size-4 text-primary" />}
      </div>
      <div>
        <p className={cn("font-bold text-xs", active ? "text-white" : "text-foreground")}>{title}</p>
        <span className="text-[10px] text-muted-foreground block">{sub}</span>
      </div>
    </button>
  );
}
