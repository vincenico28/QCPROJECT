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
} from "lucide-react";
import { formatPeso, useCitation, useUpdateCitationStatus } from "@/lib/data/traffic";
import { processPaymentCheckout } from "@/lib/server.functions";
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

  // Form Fields
  const [payerName, setPayerName] = useState("Juan Dela Cruz");
  const [payerEmail, setPayerEmail] = useState("juan.delacruz@gmail.com");
  const [mobileNumber, setMobileNumber] = useState("0917-123-4567");

  const { data: citation, isLoading, error } = useCitation(citationId);
  const updateCitation = useUpdateCitationStatus();
  const amount = citation?.amount ? Number(citation.amount) : 2000;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);

    try {
      // Execute full-stack server function
      await processPaymentCheckout({
        data: {
          citationNumber: citationId,
          plateNumber: citation?.plate_number || "NDB-8921",
          amount,
          paymentMethod: method,
          payerEmail,
          payerName,
        },
      });

      // Update client/local cache
      await updateCitation.mutateAsync({ citationId, status: "paid" });

      toast.success("Payment settlement verified!", {
        description: `Reference OR-2026-${Math.floor(100000 + Math.random() * 900000)} generated.`,
      });

      navigate({ to: "/portal/receipt/$citationId", params: { citationId } });
    } catch (err) {
      toast.error("Payment failed to process", {
        description: err instanceof Error ? err.message : "Please check your details.",
      });
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !citation) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background gap-4 p-6 text-center">
        <AlertCircle className="size-12 text-danger" />
        <p className="text-sm text-foreground font-semibold">Could not load citation record.</p>
        <Link to="/citizen" className="text-sm text-primary underline">
          Return to Citizen Portal
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Header Bar */}
      <header className="border-b border-border bg-panel/50 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link
            to="/citizen"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-white"
          >
            <ArrowLeft className="size-3.5" />
            Back to Portal
          </Link>
          <div className="flex items-center gap-2">
            <Lock className="size-3.5 text-emerald-400" />
            <span className="font-mono-tab text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              256-Bit SSL Encrypted Checkout
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left Column: Payment Method & Details */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div>
              <span className="rounded bg-primary/20 px-2 py-0.5 font-mono-tab text-[10px] font-bold text-primary border border-primary/30">
                QC LGU CITATION SETTLEMENT
              </span>
              <h1 className="text-2xl font-black text-white tracking-tight mt-1">
                Settlement & LTO Clearance
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pay your violation notice online to instantly clear your record and prevent Land Transportation Office (LTO) alarms.
              </p>
            </div>

            <form onSubmit={handlePay} className="flex flex-col gap-6">
              {/* Payment Methods */}
              <div className="flex flex-col gap-3">
                <span className="font-mono-tab text-[10px] font-bold uppercase tracking-widest text-subtle">
                  Select Gateway
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <MethodButton
                    active={method === "gcash"}
                    onClick={() => setMethod("gcash")}
                    title="GCash"
                    sub="e-Wallet / QR"
                    icon={Smartphone}
                  />
                  <MethodButton
                    active={method === "maya"}
                    onClick={() => setMethod("maya")}
                    title="Maya"
                    sub="Wallet & Card"
                    icon={Smartphone}
                  />
                  <MethodButton
                    active={method === "landbank"}
                    onClick={() => setMethod("landbank")}
                    title="Landbank"
                    sub="Link.BizPortal"
                    icon={Building2}
                  />
                  <MethodButton
                    active={method === "card"}
                    onClick={() => setMethod("card")}
                    title="Credit / Debit"
                    sub="Visa / Mastercard"
                    icon={CreditCard}
                  />
                </div>
              </div>

              {/* Payer Information */}
              <div className="panel flex flex-col gap-3.5 rounded-2xl p-5 border border-border">
                <span className="font-mono-tab text-[10px] font-bold uppercase tracking-widest text-subtle">
                  Payer Information
                </span>

                <label className="flex flex-col gap-1">
                  <span className="text-[11px] text-muted-foreground">Full Name</span>
                  <input
                    required
                    type="text"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] text-muted-foreground">Email for Receipt</span>
                    <input
                      required
                      type="email"
                      value={payerEmail}
                      onChange={(e) => setPayerEmail(e.target.value)}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] text-muted-foreground">Mobile (SMS Alert)</span>
                    <input
                      required
                      type="text"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                    />
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 font-bold text-white shadow-xl shadow-primary/25 hover:bg-primary/90 transition-all disabled:opacity-50 text-sm"
              >
                {busy ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Processing Real-Time Settlement…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-4" />
                    Pay {formatPeso(amount)} & Lift LTO Hold
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="panel flex flex-col gap-4 rounded-3xl p-6 border border-border shadow-2xl">
              <div className="border-b border-border pb-3">
                <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                  Notice Details
                </span>
                <p className="font-mono-tab text-base font-bold text-white mt-1">
                  {citation.citation_number}
                </p>
              </div>

              <div className="flex flex-col gap-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">License Plate</span>
                  <span className="font-mono-tab font-bold text-white bg-primary/20 px-2 py-0.5 rounded border border-primary/30">
                    {citation.plate_number}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Violation Offense</span>
                  <span className="font-semibold text-white">{citation.offense}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Issuing Authority</span>
                  <span className="text-white font-medium">QC DPOS / MMDA NCAP</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Issuance Date</span>
                  <span className="font-mono-tab text-muted-foreground">
                    {new Date(citation.issued_at).toLocaleDateString("en-PH")}
                  </span>
                </div>
              </div>

              <div className="border-t border-border pt-4 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Statutory Fine</span>
                  <span className="font-mono-tab font-bold text-white">{formatPeso(amount)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Gateway Processing Fee</span>
                  <span className="font-mono-tab text-emerald-400 font-bold">₱0.00 (Waived)</span>
                </div>
                <div className="flex justify-between items-center border-t border-border/50 pt-3 mt-1">
                  <span className="font-bold text-white text-sm">Total Payable</span>
                  <span className="font-mono-tab text-2xl font-black text-primary">
                    {formatPeso(amount)}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3 text-[11px] text-emerald-400 leading-relaxed">
                <span className="font-bold block mb-0.5">Instant Clearance:</span>
                Upon successful payment, your Certificate of Clearance is issued immediately and relayed to the LTO LTMS server.
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
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  sub: string;
  icon: typeof Smartphone;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-1.5 rounded-2xl border p-4 text-left transition-all",
        active
          ? "border-primary bg-primary/10 shadow-md shadow-primary/10"
          : "border-border bg-panel hover:bg-panel-elevated"
      )}
    >
      <div className="flex items-center justify-between w-full">
        <Icon className={cn("size-5", active ? "text-primary" : "text-muted-foreground")} />
        {active && <CheckCircle2 className="size-4 text-primary" />}
      </div>
      <div>
        <p className={cn("font-bold text-xs", active ? "text-white" : "text-foreground")}>{title}</p>
        <span className="text-[10px] text-muted-foreground block">{sub}</span>
      </div>
    </button>
  );
}
