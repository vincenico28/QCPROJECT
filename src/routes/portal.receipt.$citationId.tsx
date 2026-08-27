import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, FileDown, ArrowRight, Printer, QrCode, ShieldCheck, Award } from "lucide-react";
import { useCitation, formatPeso } from "@/lib/data/traffic";

export const Route = createFileRoute("/portal/receipt/$citationId")({
  head: ({ params }) => ({
    meta: [
      { title: `Official Electronic Receipt · ${params.citationId} · Culiat Traffic Ops` },
    ],
  }),
  component: ReceiptPage,
});

function ReceiptPage() {
  const { citationId } = Route.useParams();
  const { data: citation } = useCitation(citationId);

  const receiptNo = `OR-2026-${Math.floor(100000 + Math.random() * 900000)}`;
  const clearanceNo = `QC-CLR-2026-${Math.floor(10000 + Math.random() * 90000)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-12 text-foreground">
      <div className="w-full max-w-lg panel flex flex-col items-center gap-6 rounded-3xl p-6 sm:p-8 border border-border shadow-2xl bg-panel print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Success Icon */}
        <div className="grid size-16 place-items-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="size-9" />
        </div>

        {/* Title */}
        <div className="text-center">
          <span className="rounded bg-emerald-500/20 px-2.5 py-0.5 font-mono-tab text-[10px] font-bold text-emerald-400 border border-emerald-500/30 uppercase">
            Payment Verified & LTO Hold Cleared
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight mt-2 print:text-black">
            Official Electronic Receipt
          </h1>
          <p className="mt-1 text-xs text-muted-foreground print:text-neutral-600">
            Barangay Culiat, Quezon City Local Government Unit · Traffic Treasury
          </p>
        </div>

        {/* Receipt Box */}
        <div className="w-full rounded-2xl bg-background/60 p-5 border border-border flex flex-col gap-3.5 text-xs print:bg-neutral-50 print:border-neutral-300">
          <div className="flex justify-between items-center border-b border-border/50 pb-2">
            <span className="text-muted-foreground font-medium uppercase text-[10px] tracking-wider">Official Receipt No</span>
            <span className="font-mono-tab font-black text-primary text-sm print:text-black">{receiptNo}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Notice Number</span>
            <span className="font-mono-tab font-bold text-white print:text-black">{citationId}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Vehicle License Plate</span>
            <span className="font-mono-tab font-bold text-white bg-primary/20 px-2 py-0.5 rounded border border-primary/30 print:text-black">
              {citation?.plate_number || "NDB-8921"}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Violation Settled</span>
            <span className="font-semibold text-white print:text-black">{citation?.offense || "Traffic Infraction"}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Amount Paid</span>
            <span className="font-mono-tab font-black text-emerald-400 text-sm print:text-black">
              {formatPeso(citation?.amount || 2000)}
            </span>
          </div>

          <div className="flex justify-between items-center border-t border-border/50 pt-2 text-[10px]">
            <span className="text-muted-foreground">Settlement Timestamp</span>
            <span className="font-mono-tab text-white print:text-black">{new Date().toLocaleString("en-PH")}</span>
          </div>

          {/* LTO Clearance Certificate Stamp */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 flex items-center justify-between mt-1 print:bg-emerald-50 print:border-emerald-600">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="size-5 text-emerald-400 print:text-emerald-700" />
              <div>
                <p className="font-bold text-emerald-400 text-[11px] print:text-emerald-800">
                  LTO LTMS Registration Clearance Issued
                </p>
                <p className="text-[10px] text-muted-foreground font-mono-tab print:text-neutral-600">
                  Certificate #{clearanceNo}
                </p>
              </div>
            </div>
            <QrCode className="size-8 text-white print:text-black" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-2 flex w-full flex-col sm:flex-row gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-panel border border-border px-4 py-3 text-xs font-bold text-white hover:bg-panel-elevated transition-colors"
          >
            <Printer className="size-4" />
            Print Receipt
          </button>

          <Link
            to="/citizen"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all"
          >
            Return to Portal
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
