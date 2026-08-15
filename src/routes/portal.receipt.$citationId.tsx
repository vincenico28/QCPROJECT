import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, FileDown, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/portal/receipt/$citationId")({
  component: ReceiptPage,
});

function ReceiptPage() {
  const { citationId } = Route.useParams();
  
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md panel flex flex-col items-center text-center gap-6 rounded-3xl p-8 border border-border shadow-xl">
        <div className="grid size-20 place-items-center rounded-full bg-success/10 text-success mb-2">
          <CheckCircle2 className="size-10" />
        </div>
        
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Payment Successful</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Thank you. Your citation <strong className="font-mono-tab text-foreground">{citationId}</strong> has been fully settled.
          </p>
        </div>

        <div className="w-full rounded-xl bg-panel-elevated p-4 text-left border border-border flex flex-col gap-3">
          <Detail label="Reference No" value={`OR-${Math.floor(100000 + Math.random() * 900000)}`} />
          <Detail label="Date Paid" value={new Date().toLocaleDateString('en-PH')} />
          <Detail label="Status" value="CLEARED" tone="text-success" />
        </div>

        <div className="mt-2 flex w-full flex-col gap-3">
          <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors">
            <FileDown className="size-4" />
            Download PDF Receipt
          </button>
          
          <Link
            to="/citizen"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-panel-elevated px-4 py-3 font-medium text-foreground hover:bg-panel transition-colors border border-border"
          >
            Back to Portal
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value, tone = "text-foreground" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-subtle font-medium">{label}</span>
      <span className={`font-mono-tab font-bold ${tone}`}>{value}</span>
    </div>
  );
}
