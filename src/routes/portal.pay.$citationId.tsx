import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
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
} from "lucide-react";
import { formatPeso, useCitation, useUpdateCitationStatus } from "@/lib/data/traffic";
import { parseCitationOffenses } from "@/lib/data/review";
import { processPaymentCheckout } from "@/lib/server.functions";
import { VerifiableQrCode } from "@/components/ui/verifiable-qr";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  const [copiedNotice, setCopiedNotice] = useState(false);

  // Form Fields
  const [payerName, setPayerName] = useState("Juan Dela Cruz");
  const [payerEmail, setPayerEmail] = useState("juan.delacruz@gmail.com");
  const [mobileNumber, setMobileNumber] = useState("0917-882-9411");

  // Card details state
  const [cardNumber, setCardNumber] = useState("4532 •••• •••• 8912");
  const [cardExpiry, setCardExpiry] = useState("08/29");
  const [cardCvv, setCardCvv] = useState("•••");

  const { data: citation, isLoading, error } = useCitation(citationId);
  const updateCitation = useUpdateCitationStatus();
  const amount = citation?.amount ? Number(citation.amount) : 2000;

  // Breakdown of statutory offenses
  const parsedOffenses = parseCitationOffenses(citation?.offense, amount);

  const handleCopyNotice = () => {
    navigator.clipboard.writeText(citation?.citation_number || citationId);
    setCopiedNotice(true);
    toast.success("Notice number copied to clipboard");
    setTimeout(() => setCopiedNotice(false), 2000);
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);

    try {
      // Execute full-stack server function
      await processPaymentCheckout({
        data: {
          citationNumber: citation?.citation_number || citationId,
          plateNumber: citation?.plate_number || "NDB-8921",
          amount,
          paymentMethod: method,
          payerEmail,
          payerName,
        },
      });

      // Update citation status in database & local state
      await updateCitation.mutateAsync({
        citationId: citation?.citation_number || citationId,
        status: "paid",
      });

      toast.success("Payment settlement verified!", {
        description: `Official Clearance certificate and Receipt generated.`,
      });

      navigate({
        to: "/portal/receipt/$citationId",
        params: { citationId: citation?.citation_number || citationId },
      });
    } catch (err) {
      toast.error("Payment settlement error", {
        description: err instanceof Error ? err.message : "Please review your payment details.",
      });
    } finally {
      setBusy(false);
    }
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
          <div className="flex items-center gap-2">
            <Lock className="size-3.5 text-emerald-400" />
            <span className="font-mono-tab text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              256-Bit SSL Encrypted Settlement Gateway
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Already Paid Banner if applicable */}
        {isAlreadyPaid && (
          <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-6 text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-bold text-white">This Notice Has Already Been Settled</p>
                <p className="text-xs text-muted-foreground">
                  The statutory fine is fully paid and your vehicle is clear of LTO alarms.
                </p>
              </div>
            </div>
            <Link
              to="/portal/receipt/$citationId"
              params={{ citationId: citation.citation_number || citation.id }}
              className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-emerald-950 hover:bg-emerald-400 transition-colors shrink-0"
            >
              View Official Receipt
            </Link>
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
                Pay your traffic violation fine online through authorized government gateways. Settlement triggers immediate clearance and synchronization with the LTO Land Transportation Management System (LTMS).
              </p>
            </div>

            <form onSubmit={handlePay} className="flex flex-col gap-6">
              {/* Payment Methods */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono-tab text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Select Payment Gateway
                  </span>
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="size-3" /> Zero Gateway Fee
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <MethodButton
                    active={method === "gcash"}
                    onClick={() => setMethod("gcash")}
                    title="GCash"
                    sub="e-Wallet / QR Ph"
                    icon={Smartphone}
                    badge="Most Popular"
                  />
                  <MethodButton
                    active={method === "maya"}
                    onClick={() => setMethod("maya")}
                    title="Maya"
                    sub="Wallet & Card"
                    icon={Smartphone}
                  />
                  <MethodButton
                    active={method === "card"}
                    onClick={() => setMethod("card")}
                    title="Credit / Debit"
                    sub="Visa / Mastercard"
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

              {/* Gateway Interactive Inputs */}
              <div className="panel flex flex-col gap-4 rounded-2xl p-5 border border-border bg-panel">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <span className="font-mono-tab text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    {method === "gcash" && <Smartphone className="size-3.5 text-blue-400" />}
                    {method === "maya" && <Smartphone className="size-3.5 text-emerald-400" />}
                    {method === "card" && <CreditCard className="size-3.5 text-amber-400" />}
                    {method === "landbank" && <Building2 className="size-3.5 text-green-500" />}
                    {method.toUpperCase()} Gateway Channel
                  </span>
                  <span className="font-mono-tab text-[10px] font-bold text-muted-foreground uppercase">
                    Status: <span className="text-emerald-400">Live Gateway</span>
                  </span>
                </div>

                {method === "gcash" && (
                  <div className="flex flex-col gap-3">
                    <div className="rounded-xl border border-blue-500/20 bg-blue-950/20 p-3.5 flex items-center justify-between gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-bold text-blue-400 flex items-center gap-1">
                          <QrCode className="size-3.5" /> Instant Scan to Pay via QR Ph
                        </span>
                        <p className="text-[10px] text-muted-foreground">
                          Scan using GCash app or input your registered GCash mobile number below.
                        </p>
                      </div>
                      <div className="p-1.5 bg-white rounded-lg border border-border shrink-0 shadow-md">
                        <VerifiableQrCode
                          data={`00020101021226600016PH.GCASH.GATEWAY0115${citation.citation_number}5204601153066085405${amount}.005802PH5917QUEZON CITY LGU6011QUEZON CITY6304`}
                          size={76}
                        />
                      </div>
                    </div>

                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] font-medium text-muted-foreground">Registered GCash Mobile Number</span>
                      <input
                        required
                        type="tel"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        placeholder="0917-000-0000"
                        className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-white focus:border-primary focus:outline-none font-mono-tab"
                      />
                    </label>
                  </div>
                )}

                {method === "maya" && (
                  <div className="flex flex-col gap-3">
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3.5 flex items-center justify-between gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                          <QrCode className="size-3.5" /> Maya Express Checkout
                        </span>
                        <p className="text-[10px] text-muted-foreground">
                          Authorized Maya direct merchant integration with instant webhook reconciliation.
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

                {method === "card" && (
                  <div className="flex flex-col gap-3">
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] font-medium text-muted-foreground">Card Number</span>
                      <div className="relative">
                        <input
                          required
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="4123 4567 8901 2345"
                          className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-white focus:border-primary focus:outline-none font-mono-tab"
                        />
                        <div className="absolute right-3 top-2.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                          <span className="font-bold text-blue-400">VISA</span>
                          <span className="font-bold text-amber-500">MC</span>
                        </div>
                      </div>
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] font-medium text-muted-foreground">Expiry Date (MM/YY)</span>
                        <input
                          required
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/YY"
                          className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-white focus:border-primary focus:outline-none font-mono-tab"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] font-medium text-muted-foreground">Security Code (CVV)</span>
                        <input
                          required
                          type="password"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="123"
                          className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-white focus:border-primary focus:outline-none font-mono-tab"
                        />
                      </label>
                    </div>
                  </div>
                )}

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
                <span className="font-mono-tab text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Payer & Official Receipt Credentials
                </span>

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
                    <span className="text-[11px] font-medium text-muted-foreground">Contact Number</span>
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
                    Reconciling & Clearing LTO Record…
                  </>
                ) : isAlreadyPaid ? (
                  <>
                    <CheckCircle2 className="size-4 text-white" />
                    Citation Notice Cleared & Paid
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
