import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Loader2, CreditCard, Smartphone } from "lucide-react";
import { formatPeso, useCitation, useUpdateCitationStatus } from "@/lib/data/traffic";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/pay/$citationId")({
  component: PaymentPage,
});

function PaymentPage() {
  const { citationId } = Route.useParams();
  const navigate = useNavigate();
  const [method, setMethod] = useState<"gcash" | "card">("gcash");
  const [busy, setBusy] = useState(false);

  const { data: citation, isLoading, error } = useCitation(citationId);
  const updateCitation = useUpdateCitationStatus();
  const amount = citation?.amount ? Number(citation.amount) : 0;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);

    updateCitation.mutate({ citationId, status: "paid" }, {
      onSuccess: () => {
        setBusy(false);
        navigate({ to: "/portal/receipt/$citationId", params: { citationId } });
      },
      onError: (err) => {
        setBusy(false);
        toast.error("Payment failed to register");
        console.error(err);
      }
    });
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
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background gap-4">
        <p className="text-sm text-danger">Could not load citation details.</p>
        <Link to="/citizen" className="text-sm text-primary underline">Go back</Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link
            to="/citizen"
            className="inline-flex items-center gap-2 text-xs text-subtle transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back to portal
          </Link>
          <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
            Secure Checkout
          </span>
        </div>
      </header>

      <main className="mx-auto flex max-w-md flex-col gap-6 px-6 py-12">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Complete Payment</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Settle your citation <strong className="font-mono-tab text-foreground">{citationId}</strong>
          </p>
          <div className="mt-4 inline-block rounded-2xl bg-panel-elevated px-6 py-4 border border-border shadow-sm">
            <span className="block text-xs uppercase tracking-widest text-subtle mb-1">Total Due</span>
            <span className="text-3xl font-semibold text-primary">{formatPeso(amount)}</span>
          </div>
        </div>

        <form onSubmit={handlePay} className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold">Payment Method</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMethod("gcash")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl border p-4 transition-all",
                  method === "gcash" ? "border-primary bg-primary/10 text-primary" : "border-border bg-panel text-subtle hover:bg-panel-elevated"
                )}
              >
                <Smartphone className="size-5" />
                <span className="font-semibold text-sm">e-Wallet</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod("card")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl border p-4 transition-all",
                  method === "card" ? "border-primary bg-primary/10 text-primary" : "border-border bg-panel text-subtle hover:bg-panel-elevated"
                )}
              >
                <CreditCard className="size-5" />
                <span className="font-semibold text-sm">Card</span>
              </button>
            </div>
          </div>

          {method === "card" && (
            <div className="panel flex flex-col gap-4 rounded-xl p-5 border border-border">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-subtle">Card number</span>
                <input required placeholder="0000 0000 0000 0000" className={inputClass} />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-subtle">Expiry</span>
                  <input required placeholder="MM/YY" className={inputClass} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-subtle">CVC</span>
                  <input required placeholder="123" className={inputClass} />
                </label>
              </div>
            </div>
          )}

          {method === "gcash" && (
            <div className="panel flex flex-col gap-4 rounded-xl p-5 border border-border text-center">
              <p className="text-sm text-subtle">You will be securely redirected to Maya/GCash gateway to complete the transaction.</p>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-5 animate-spin" /> : `Pay ${formatPeso(amount)}`}
          </button>
        </form>
      </main>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20";
