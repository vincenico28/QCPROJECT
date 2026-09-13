import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
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
} from "lucide-react";
import { useCitation, formatPeso } from "@/lib/data/traffic";
import { parseCitationOffenses } from "@/lib/data/review";
import { VerifiableQrCode } from "@/components/ui/verifiable-qr";
import { toast } from "sonner";

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
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  // Deterministic receipt and certificate identifiers
  const cleanId = citationId.replace(/[^a-zA-Z0-9]/g, "").slice(-6) || "982144";
  const receiptNo = `OR-2026-${cleanId}`;
  const clearanceNo = `QC-CLR-2026-${cleanId}`;
  const amount = citation?.amount ? Number(citation.amount) : 2000;

  const parsedOffenses = parseCitationOffenses(citation?.offense, amount);

  const handleCopyReceipt = () => {
    navigator.clipboard.writeText(receiptNo);
    setCopiedReceipt(true);
    toast.success("Receipt Number copied to clipboard");
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const qrData = `QC-TREASURY-SETTLED|REC:${receiptNo}|CLR:${clearanceNo}|NOV:${citationId}|PLATE:${citation?.plate_number || "QC"}|PHP:${amount}|DATE:${new Date().toISOString()}`;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-xl panel flex flex-col items-center gap-6 rounded-3xl p-6 sm:p-8 border border-border shadow-2xl bg-panel print:border-none print:shadow-none print:bg-white print:text-black print:p-0">
        {/* Success / Seal Header */}
        <div className="flex flex-col items-center text-center">
          <div className="grid size-16 place-items-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 print:border-emerald-600 print:text-emerald-700">
            <CheckCircle2 className="size-9" />
          </div>

          <div className="mt-3 flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-bold text-emerald-400 border border-emerald-500/30 uppercase tracking-wide">
            <Sparkles className="size-3" />
            <span>PAYMENT SETTLED & LTO HOLD LIFTED</span>
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
        <div className="w-full rounded-2xl bg-background/60 p-5 border border-border flex flex-col gap-4 text-xs print:bg-neutral-50 print:border-neutral-300">
          {/* Header row: OR number & Copy */}
          <div className="flex justify-between items-center border-b border-border/60 pb-3">
            <div>
              <span className="text-muted-foreground font-medium uppercase text-[10px] tracking-wider block">
                Official Receipt Number
              </span>
              <span className="font-mono-tab font-black text-primary text-base print:text-black">
                {receiptNo}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyReceipt}
              className="print:hidden rounded-lg border border-border bg-panel px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:text-white flex items-center gap-1.5 transition-colors"
            >
              {copiedReceipt ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
              <span>{copiedReceipt ? "Copied" : "Copy OR"}</span>
            </button>
          </div>

          {/* Key Citation Identifiers */}
          <div className="grid grid-cols-2 gap-3 pb-1">
            <div>
              <span className="text-[10px] text-muted-foreground block">Notice Number</span>
              <span className="font-mono-tab font-bold text-white text-xs print:text-black">
                {citation?.citation_number || citationId}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">License Plate</span>
              <span className="font-mono-tab font-black text-white bg-primary/20 px-2 py-0.5 rounded border border-primary/30 inline-block text-xs print:text-black print:bg-neutral-200">
                {citation?.plate_number || "NDB-8921"}
              </span>
            </div>
          </div>

          {/* Itemized Cleared Violations Breakdown */}
          <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-background/50 p-3 print:bg-white print:border-neutral-300">
            <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
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
                <div key={idx} className="flex flex-col gap-0.5 border-b border-border/30 pb-1.5 last:border-b-0 last:pb-0">
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
                      {off.ordinance || "QC Ordinance"}
                    </span>
                    <span className="text-emerald-400 font-semibold print:text-emerald-700">
                      PAID & DISCHARGED
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Amount Paid & Payment Math */}
          <div className="flex flex-col gap-1.5 border-t border-border/60 pt-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Total Statutory Fines</span>
              <span className="font-mono-tab font-semibold text-white print:text-black">{formatPeso(amount)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Gateway Processing Charge</span>
              <span className="font-mono-tab text-emerald-400 font-bold print:text-black">₱0.00 (Waived)</span>
            </div>
            <div className="flex justify-between items-center border-t border-border/60 pt-2 text-sm">
              <span className="font-bold text-white print:text-black">Total Settled & Received</span>
              <span className="font-mono-tab font-black text-emerald-400 text-base print:text-black">
                {formatPeso(amount)}
              </span>
            </div>
          </div>

          {/* Settlement Metadata */}
          <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-border/50 pt-2.5">
            <div>
              <span className="text-muted-foreground block">Payment Channel</span>
              <span className="font-medium text-white print:text-black">Online Authorized e-Payment</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Settlement Timestamp</span>
              <span className="font-mono-tab text-white print:text-black">
                {new Date().toLocaleString("en-PH", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </div>
          </div>

          {/* LTO Clearance Certificate Stamp Box */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 flex items-center justify-between gap-4 mt-1 print:bg-emerald-50 print:border-emerald-600">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-6 text-emerald-400 shrink-0 print:text-emerald-700" />
              <div>
                <p className="font-bold text-emerald-400 text-xs print:text-emerald-800">
                  LTO LTMS Registration Clearance Verified
                </p>
                <p className="text-[10px] text-muted-foreground font-mono-tab print:text-neutral-600">
                  Certificate Ref: #{clearanceNo}
                </p>
                <p className="text-[9px] text-muted-foreground mt-0.5 print:text-neutral-500">
                  Vehicle plate {citation?.plate_number || "registered"} is marked clean for registration renewal.
                </p>
              </div>
            </div>
            <div className="p-1 bg-white rounded-lg border border-border shrink-0 shadow">
              <VerifiableQrCode data={qrData} size={64} />
            </div>
          </div>
        </div>

        {/* Action Buttons (Hidden on Print) */}
        <div className="flex w-full flex-col sm:flex-row gap-3 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-panel border border-border px-4 py-3 text-xs font-bold text-white hover:bg-panel-elevated transition-colors shadow-sm"
          >
            <Printer className="size-4 text-muted-foreground" />
            Print / Save as PDF
          </button>

          <Link
            to="/citizen"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all"
          >
            <span>Return to Portal</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="text-center print:hidden">
          <Link
            to="/lookup"
            search={{ plate: citation?.plate_number }}
            className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary transition-colors"
          >
            <span>Verify Clean Plate Standing on Public Registry</span>
            <ExternalLink className="size-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
