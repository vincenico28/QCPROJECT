import { useState } from "react";
import {
  Printer,
  X,
  Send,
  Smartphone,
  Mail,
  ShieldAlert,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  FileText,
  AlertTriangle,
  QrCode,
  Layers,
  MapPin,
  Calendar,
  Clock,
  Car,
  User,
  BadgeCheck,
  Download,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { formatPeso } from "@/lib/data/traffic";
import { VerifiableQrCode } from "@/components/ui/verifiable-qr";
import { serverDispatchSettlementNotice } from "@/lib/server.functions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type RoadsideCitationSlipData = {
  citationNumber: string;
  plateNumber: string;
  vehicleModel?: string | null;
  driverName?: string | null;
  driverLicense?: string | null;
  location: string;
  sector?: string | null;
  coords?: [number, number] | null;
  offenses: { offense: string; amount: number }[];
  totalAmount: number;
  officerName: string;
  officerBadge?: string | null;
  issuedAt: string;
  apprehensionMode?: "attended" | "unattended";
  enforcementAction?: "top_issued" | "license_confiscated" | "warning_issued";
  evidenceUrls?: string[];
  contactMobile?: string | null;
  contactEmail?: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slip: RoadsideCitationSlipData | null;
  onIssueAnother?: () => void;
};

export function RoadsideThermalSlipDialog({
  open,
  onOpenChange,
  slip,
  onIssueAnother,
}: Props) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSendingNotice, setIsSendingNotice] = useState(false);
  const [sendMobile, setSendMobile] = useState(slip?.contactMobile || "");
  const [sendEmail, setSendEmail] = useState(slip?.contactEmail || "");
  const [dispatchDrawerOpen, setDispatchDrawerOpen] = useState(false);

  if (!slip) return null;

  const paymentUrl = typeof window !== "undefined"
    ? `${window.location.origin}/portal/pay/${slip.citationNumber}`
    : `https://qc-guardian.gov.ph/portal/pay/${slip.citationNumber}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(paymentUrl);
    setCopiedLink(true);
    toast.success("Motorist Payment Link Copied to Clipboard");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDispatchNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendMobile && !sendEmail) {
      toast.error("Please enter a mobile phone number or email address");
      return;
    }
    setIsSendingNotice(true);
    try {
      await serverDispatchSettlementNotice({
        data: {
          citationNumber: slip.citationNumber,
          plateNumber: slip.plateNumber,
          receiptNumber: `TCT-${slip.citationNumber}`,
          amount: slip.totalAmount,
          recipientEmail: sendEmail.trim(),
          recipientPhone: sendMobile.trim(),
          sendEmail: Boolean(sendEmail.trim()),
          sendSms: Boolean(sendMobile.trim()),
        },
      });
      toast.success("Digital Citation Slip Dispatched", {
        description: `Sent official settlement notice to motorist via ${sendMobile ? "SMS" : ""}${sendMobile && sendEmail ? " & " : ""}${sendEmail ? "Email" : ""}.`,
      });
      setDispatchDrawerOpen(false);
    } catch (err: any) {
      toast.error("Dispatch Error", {
        description: err?.message || "Could not deliver electronic ticket notice",
      });
    } finally {
      setIsSendingNotice(false);
    }
  };

  const formattedDate = new Date(slip.issuedAt).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl border border-border bg-panel shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-panel-elevated/80 print:hidden">
            <div className="flex items-center gap-2.5">
              <div className="grid size-8 place-items-center rounded-xl bg-primary/20 text-primary border border-primary/30">
                <Printer className="size-4" />
              </div>
              <div>
                <Dialog.Title className="text-sm font-bold text-foreground">
                  Roadside Thermal OVR Ticket
                </Dialog.Title>
                <Dialog.Description className="text-[11px] text-muted-foreground font-mono-tab">
                  Notice #{slip.citationNumber} · 80mm Thermal Slip
                </Dialog.Description>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 transition-all cursor-pointer"
              >
                <Printer className="size-3.5" />
                <span>Print Thermal Slip</span>
              </button>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-xl p-1.5 text-muted-foreground hover:bg-panel hover:text-foreground transition-colors"
                >
                  <X className="size-4" />
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* Scrollable Container with Thermal Paper Stylings */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-950/70 flex flex-col items-center">
            
            {/* The 80mm Simulated Thermal Paper */}
            <div
              id="thermal-ovr-slip"
              className="w-full max-w-[370px] bg-white text-black p-5 sm:p-6 shadow-2xl rounded-sm font-mono text-[11px] leading-relaxed border-t-4 border-b-4 border-dashed border-neutral-300 relative select-text"
            >
              {/* Perforated edge marks */}
              <div className="text-center text-neutral-400 text-[8px] tracking-widest uppercase mb-2">
                - - - - - TEAR HERE (CITIZEN COPY) - - - - -
              </div>

              {/* LGU Seal Header */}
              <div className="text-center border-b border-black pb-3 mb-3">
                <p className="text-[9px] uppercase tracking-wider font-semibold">Republic of the Philippines</p>
                <h3 className="text-sm font-black tracking-tight uppercase">Quezon City Government</h3>
                <p className="text-[10px] font-bold">Department of Public Order & Safety (DPOS)</p>
                <p className="text-[9px] text-neutral-600">Traffic Enforcement & Adjudication Service</p>
                <p className="text-[8px] text-neutral-500 font-bold mt-0.5">BARANGAY CULIAT SECTOR COMMAND</p>
              </div>

              {/* Ticket Title */}
              <div className="text-center my-2 py-1 border-y border-dashed border-black bg-neutral-100">
                <p className="font-black text-xs tracking-wider uppercase">Ordinance Violation Receipt</p>
                <p className="text-[9px] text-neutral-700">Traffic Citation Ticket (OVR / TCT)</p>
                <p className="text-xs font-black tracking-widest mt-0.5">{slip.citationNumber}</p>
              </div>

              {/* Apprehension Info Table */}
              <div className="space-y-1 py-2 border-b border-neutral-300 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-neutral-600">DATE/TIME:</span>
                  <span className="font-bold">{formattedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">SECTOR/LOC:</span>
                  <span className="font-bold text-right max-w-[200px] truncate">{slip.location}</span>
                </div>
                {slip.sector && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">PATROL ZONE:</span>
                    <span className="font-semibold text-right">{slip.sector}</span>
                  </div>
                )}
                {slip.coords && (
                  <div className="flex justify-between text-[9px] text-neutral-500">
                    <span>GPS FIX:</span>
                    <span>{slip.coords[0].toFixed(4)}° N, {slip.coords[1].toFixed(4)}° E</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-neutral-600">ENFORCER:</span>
                  <span className="font-bold">{slip.officerName}</span>
                </div>
              </div>

              {/* Motorist & Vehicle Identification */}
              <div className="py-2.5 border-b border-neutral-300 text-[10px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-neutral-600">PLATE NO:</span>
                  <span className="font-black text-xs bg-neutral-200 px-1 rounded">{slip.plateNumber}</span>
                </div>
                {slip.vehicleModel && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">VEHICLE:</span>
                    <span className="font-semibold">{slip.vehicleModel}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-neutral-600">DRIVER NAME:</span>
                  <span className="font-bold text-right">{slip.driverName || "Driver / Registered Owner"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">LICENSE NO:</span>
                  <span className="font-bold">{slip.driverLicense || "Unpresented / Refused"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">APPREHENSION:</span>
                  <span className="font-bold uppercase">
                    {slip.apprehensionMode === "unattended" ? "Unattended (Windshield)" : "Attended (In-Person)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">ACTION:</span>
                  <span className="font-bold uppercase text-neutral-900">
                    {slip.enforcementAction === "license_confiscated"
                      ? "Driver's License Confiscated"
                      : slip.enforcementAction === "warning_issued"
                        ? "Official Written Warning"
                        : "TOP Issued (72h Valid)"}
                  </span>
                </div>
              </div>

              {/* Charged Offenses Breakdown */}
              <div className="py-2.5 border-b border-black text-[10px]">
                <div className="flex justify-between font-bold border-b border-neutral-300 pb-1 mb-1">
                  <span>CHARGED INFRACTION</span>
                  <span>PENALTY</span>
                </div>
                {slip.offenses.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-0.5">
                    <span className="max-w-[210px] truncate">
                      {idx + 1}. {item.offense}
                    </span>
                    <span className="font-bold shrink-0">{formatPeso(item.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-black text-xs pt-2 mt-1 border-t border-black">
                  <span>TOTAL FINE DUE:</span>
                  <span>{formatPeso(slip.totalAmount)}</span>
                </div>
              </div>

              {/* QR Code & Online Settlement */}
              <div className="flex flex-col items-center justify-center py-3 border-b border-neutral-300 text-center">
                <p className="text-[9px] font-bold uppercase tracking-wider text-neutral-800 mb-1.5">
                  Scan QR to Settle via GCash / Maya
                </p>
                <div className="p-2 border border-black bg-white inline-block">
                  <VerifiableQrCode data={paymentUrl} size={110} />
                </div>
                <p className="text-[8px] text-neutral-600 mt-1 font-mono break-all max-w-[250px]">
                  {paymentUrl}
                </p>
              </div>

              {/* Barcode Simulation */}
              <div className="py-2 text-center border-b border-dashed border-neutral-300">
                <div className="h-9 w-full flex items-center justify-center gap-0.5 opacity-90">
                  {Array.from({ length: 48 }).map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-full bg-black inline-block",
                        i % 5 === 0 ? "w-1" : i % 3 === 0 ? "w-0.5" : "w-[1px]"
                      )}
                    />
                  ))}
                </div>
                <p className="text-[8px] tracking-widest font-mono mt-0.5 font-bold">
                  *{slip.citationNumber}*
                </p>
              </div>

              {/* Statutory Notice */}
              <div className="pt-2 text-[8px] text-neutral-600 leading-tight text-justify">
                <p className="font-bold text-neutral-900 mb-0.5">LEGAL ADVISORY (QC ORD. SP-2957):</p>
                <p>
                  You have five (5) working days from date of apprehension to settle this fine online or at the QC Hall Treasury, Mayaman St., Diliman, Quezon City. If you wish to contest, report to the Traffic Adjudication Board (TAB). Failure to settle within 5 days will result in an automated <strong>LTO LTMS Registration Alarm</strong> holding vehicle renewal nationwide.
                </p>
              </div>

              <div className="text-center text-neutral-400 text-[8px] tracking-widest uppercase mt-3">
                - - - - - END OF TICKET - - - - -
              </div>
            </div>

            {/* In-Dialog Motorist Dispatch Drawer */}
            {dispatchDrawerOpen && (
              <form
                onSubmit={handleDispatchNotice}
                className="w-full max-w-[370px] mt-4 rounded-2xl border border-primary/40 bg-panel-elevated p-4 shadow-xl flex flex-col gap-3 animate-in fade-in"
              >
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Send className="size-3.5 text-primary" />
                    Dispatch Ticket Notice to Motorist
                  </span>
                  <button
                    type="button"
                    onClick={() => setDispatchDrawerOpen(false)}
                    className="text-muted-foreground hover:text-white"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-subtle uppercase font-mono-tab">
                    Mobile Contact (SMS Ticket Link)
                  </label>
                  <input
                    type="tel"
                    placeholder="0917-XXX-XXXX"
                    value={sendMobile}
                    onChange={(e) => setSendMobile(e.target.value)}
                    className="rounded-xl border border-border bg-panel px-3 py-1.5 text-xs text-white placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-subtle uppercase font-mono-tab">
                    Motorist Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="driver@example.com"
                    value={sendEmail}
                    onChange={(e) => setSendEmail(e.target.value)}
                    className="rounded-xl border border-border bg-panel px-3 py-1.5 text-xs text-white placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSendingNotice}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2 text-xs font-bold text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/90 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Send className="size-3.5" />
                  <span>{isSendingNotice ? "Dispatching…" : "Transmit Digital Ticket Notice"}</span>
                </button>
              </form>
            )}
          </div>

          {/* Dialog Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 p-4 border-t border-border bg-panel print:hidden">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-panel-elevated px-3 py-2 text-xs font-semibold text-foreground hover:bg-panel transition-colors cursor-pointer"
              >
                {copiedLink ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                <span>{copiedLink ? "Link Copied!" : "Copy Pay Link"}</span>
              </button>

              <button
                type="button"
                onClick={() => setDispatchDrawerOpen(!dispatchDrawerOpen)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-panel-elevated px-3 py-2 text-xs font-semibold text-foreground hover:bg-panel transition-colors cursor-pointer"
              >
                <Smartphone className="size-3.5 text-primary" />
                <span>SMS / Email Slip</span>
              </button>

              <a
                href={paymentUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1 rounded-xl border border-border bg-panel-elevated p-2 text-xs text-muted-foreground hover:text-foreground hover:bg-panel transition-colors"
                title="Open Motorist Payment Portal"
              >
                <ExternalLink className="size-3.5" />
              </a>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onIssueAnother && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    onIssueAnother();
                  }}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="size-3.5" />
                  <span>Issue Next Apprehension</span>
                </button>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
