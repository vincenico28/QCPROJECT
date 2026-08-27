import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  useEmailLogs,
  useSendNotificationEmail,
  type EmailLog,
} from "@/lib/data/communications";
import {
  Loader2,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Send,
  MailOpen,
  Clock,
  Plus,
  ShieldCheck,
  Building2,
  QrCode,
  ExternalLink,
  Search,
  X,
  Eye,
  FileCheck2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";
import { timeAgo } from "@/lib/data/traffic";

export const Route = createFileRoute("/communications")({
  head: () => ({
    meta: [
      { title: "Email Notifications & Communications — Culiat Traffic Ops" },
      {
        name: "description",
        content:
          "Automated email dispatching for Notices of Violation, payment receipts, LTO alarm warnings, and TAB resolutions for Barangay Culiat, Quezon City.",
      },
    ],
  }),
  component: CommunicationsPage,
});

const TYPES = [
  "All Types",
  "Citation Notice",
  "Payment Receipt",
  "Warning Reminder",
  "TAB Appeal Resolution",
] as const;

function CommunicationsPage() {
  const { data: logs = [], isLoading } = useEmailLogs();
  const sendEmail = useSendNotificationEmail();

  const [typeFilter, setTypeFilter] = useState<string>("All Types");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const [composeModalOpen, setComposeModalOpen] = useState(false);

  // Compose State
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [emailType, setEmailType] = useState<EmailLog["type"]>("Citation Notice");
  const [citationNumber, setCitationNumber] = useState("NOV-2026-QC-00129");
  const [plateNumber, setPlateNumber] = useState("NDB-8921");
  const [body, setBody] = useState("");

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (typeFilter !== "All Types" && log.type !== typeFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        log.subject.toLowerCase().includes(q) ||
        log.recipient.toLowerCase().includes(q) ||
        (log.citationNumber ?? "").toLowerCase().includes(q) ||
        (log.plateNumber ?? "").toLowerCase().includes(q)
      );
    });
  }, [logs, typeFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = logs.length;
    const delivered = logs.filter((l) => l.status === "Delivered").length;
    const bounced = logs.filter((l) => l.status === "Bounced").length;
    const pending = logs.filter((l) => l.status === "Pending").length;
    return { total: 1248 + total, delivered: 1235 + delivered, bounced: 13 + bounced, pending };
  }, [logs]);

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !subject || !body) return;
    sendEmail.mutate(
      {
        recipient,
        subject,
        type: emailType,
        citationNumber: citationNumber || undefined,
        plateNumber: plateNumber || undefined,
        body,
      },
      {
        onSuccess: (newMsg) => {
          toast.success(`Email notification sent to ${newMsg.recipient}`);
          setComposeModalOpen(false);
          setRecipient("");
          setSubject("");
          setBody("");
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-primary/20 px-2 py-0.5 font-mono-tab text-[10px] font-bold text-primary border border-primary/30">
              QC LGU EMAIL DISPATCH GATEWAY
            </span>
            <span className="text-xs text-subtle">· Automated Motorist Communications</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            Email Notifications & Communications
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Monitor automated email dispatches for Notices of Violation, 7-day LTO hold reminders, payment receipts, and TAB resolution orders.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-3.5 py-2 text-xs font-semibold text-emerald-400">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
            </span>
            SMTP Edge Relays Online
          </div>

          <Dialog.Root open={composeModalOpen} onOpenChange={setComposeModalOpen}>
            <Dialog.Trigger asChild>
              <button className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all">
                <Plus className="size-3.5" />
                Dispatch Email Notice
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-panel p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95">
                <div className="flex items-start justify-between border-b border-border pb-3">
                  <Dialog.Title className="text-base font-bold text-white flex items-center gap-2">
                    <Mail className="size-4 text-primary" />
                    Dispatch Automated Motorist Email
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button className="rounded p-1 text-muted-foreground hover:text-foreground">
                      <X className="size-4" />
                    </button>
                  </Dialog.Close>
                </div>

                <form onSubmit={handleSendEmail} className="mt-4 flex flex-col gap-3.5 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1">
                      <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                        Notification Type
                      </span>
                      <select
                        value={emailType}
                        onChange={(e) => {
                          const t = e.target.value as EmailLog["type"];
                          setEmailType(t);
                          if (t === "Citation Notice") {
                            setSubject("QC LGU & MMDA NCAP: Official Notice of Violation");
                            setBody("An automated traffic violation was recorded for vehicle NDB-8921 (Red Light Jump) on Commonwealth Ave. Please settle within 10 days to avoid LTO registration hold.");
                          } else if (t === "Payment Receipt") {
                            setSubject("Official Electronic Receipt & LTO Clearance");
                            setBody("Your traffic citation settlement has been received and verified. Your LTO registration hold is lifted.");
                          } else if (t === "Warning Reminder") {
                            setSubject("URGENT REMINDER: 7 Days Remaining to Settle Traffic Citation");
                            setBody("Your Notice of Violation remains unsettled. Failure to pay will result in automatic vehicle registration alarm tagging at the Land Transportation Office.");
                          }
                        }}
                        className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                      >
                        <option value="Citation Notice">Citation Notice (NOV)</option>
                        <option value="Payment Receipt">Payment Receipt & Clearance</option>
                        <option value="Warning Reminder">Warning / LTO Tagging Reminder</option>
                        <option value="TAB Appeal Resolution">TAB Appeal Resolution Order</option>
                      </select>
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                        Recipient Email Address *
                      </span>
                      <input
                        type="email"
                        required
                        placeholder="motorist@example.com"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1">
                      <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                        Linked Notice Number (NOV#)
                      </span>
                      <input
                        type="text"
                        value={citationNumber}
                        onChange={(e) => setCitationNumber(e.target.value)}
                        className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono-tab text-white focus:border-primary focus:outline-none"
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                        Vehicle License Plate
                      </span>
                      <input
                        type="text"
                        value={plateNumber}
                        onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                        className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono-tab uppercase text-white focus:border-primary focus:outline-none"
                      />
                    </label>
                  </div>

                  <label className="flex flex-col gap-1">
                    <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                      Email Subject Line *
                    </span>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. QC LGU & MMDA NCAP Notice of Violation"
                      className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                      Notification Body Text *
                    </span>
                    <textarea
                      required
                      rows={4}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Enter the official notification advisory body..."
                      className="w-full resize-none rounded-lg border border-border bg-background p-3 text-xs text-white focus:border-primary focus:outline-none"
                    />
                  </label>

                  <div className="mt-2 flex justify-end gap-2 border-t border-border pt-3">
                    <Dialog.Close asChild>
                      <button className="rounded-lg px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-panel-elevated">
                        Cancel
                      </button>
                    </Dialog.Close>
                    <button
                      type="submit"
                      disabled={sendEmail.isPending || !recipient || !subject || !body}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 disabled:opacity-50"
                    >
                      {sendEmail.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                      Dispatch Email
                    </button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>

      {isLoading ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Email Stats Sidebar */}
          <div className="panel col-span-1 flex flex-col gap-4 rounded-2xl border border-border p-6 shadow-xl h-fit">
            <div className="flex items-center gap-3 border-b border-border/50 pb-4">
              <div className="grid size-12 place-items-center rounded-2xl bg-primary/20 text-primary border border-primary/30">
                <Mail className="size-6" />
              </div>
              <div>
                <h2 className="font-bold text-white text-base">Dispatch Volume</h2>
                <p className="text-xs text-muted-foreground">Quezon City Automated SMTP Relay</p>
              </div>
            </div>

            <div className="flex flex-col gap-3.5 mt-2">
              <div className="flex items-center justify-between rounded-xl border border-border bg-background/50 p-3">
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Send className="size-4 text-primary" />
                  Total Processed
                </span>
                <span className="font-mono-tab font-black text-white text-base">{stats.total.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-3">
                <span className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  Delivered Successfully
                </span>
                <span className="font-mono-tab font-black text-emerald-400 text-base">{stats.delivered.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-red-500/30 bg-red-950/10 p-3">
                <span className="flex items-center gap-2 text-xs text-red-400 font-medium">
                  <AlertTriangle className="size-4 text-red-400" />
                  Bounced / Mailbox Full
                </span>
                <span className="font-mono-tab font-black text-red-400 text-base">{stats.bounced.toLocaleString()}</span>
              </div>
            </div>

            <div className="rounded-xl border border-blue-500/20 bg-blue-950/20 p-3.5 text-xs text-muted-foreground leading-relaxed mt-2">
              <span className="font-mono-tab text-[10px] font-bold text-blue-400 uppercase block mb-1">
                LTO LTMS Integration Notice
              </span>
              Motorists receive instant email notifications containing high-resolution CCTV snapshots, statutory fine schedules, and direct payment links upon violation verification.
            </div>
          </div>

          {/* Live Delivery Stream */}
          <div className="panel lg:col-span-2 flex flex-col gap-4 rounded-2xl border border-border p-6 shadow-xl h-[580px] overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/50 pb-4">
              <h2 className="font-bold text-white text-base">Real-Time Email Dispatch Stream</h2>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-white focus:border-primary focus:outline-none"
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                <div className="w-44">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search recipient, NOV#…"
                    className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-white focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => setSelectedEmail(log)}
                  className="group flex flex-col gap-2 rounded-xl border border-border bg-background/50 p-4 transition-all hover:bg-background/90 hover:border-primary/40 cursor-pointer shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white group-hover:text-primary transition-colors">
                          {log.subject}
                        </span>
                        {log.plateNumber && (
                          <span className="rounded bg-primary/15 px-1.5 py-0.2 font-mono-tab text-[9px] font-bold text-primary">
                            {log.plateNumber}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.recipient}</p>
                    </div>

                    <span
                      className={cn(
                        "shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                        log.status === "Delivered"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : log.status === "Bounced"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      )}
                    >
                      {log.status === "Delivered" && <CheckCircle2 className="size-3" />}
                      {log.status === "Bounced" && <AlertTriangle className="size-3" />}
                      {log.status === "Pending" && <Clock className="size-3" />}
                      {log.status}
                    </span>
                  </div>

                  {log.previewBody && (
                    <p className="text-xs text-white/70 line-clamp-2 leading-relaxed mt-1">
                      {log.previewBody}
                    </p>
                  )}

                  <div className="flex items-center justify-between border-t border-border/40 pt-2 text-[10px] text-muted-foreground font-mono-tab">
                    <span>ID: {log.id} · Type: {log.type}</span>
                    <span>{timeAgo(log.timestamp)} ({new Date(log.timestamp).toLocaleTimeString()})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* OFFICIAL HTML EMAIL PREVIEW MODAL */}
      {selectedEmail && (
        <Dialog.Root open onOpenChange={(o) => !o && setSelectedEmail(null)}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-panel p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b border-border pb-3">
                <div>
                  <Dialog.Title className="text-base font-bold text-white flex items-center gap-2">
                    <MailOpen className="size-4 text-primary" />
                    Official Email Transmission Preview
                  </Dialog.Title>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Recipient: <strong className="text-white">{selectedEmail.recipient}</strong>
                  </p>
                </div>
                <Dialog.Close asChild>
                  <button className="rounded p-1 text-muted-foreground hover:text-foreground">
                    <X className="size-4" />
                  </button>
                </Dialog.Close>
              </div>

              {/* Rendered HTML email body */}
              <div className="mt-4 rounded-2xl border border-border bg-white text-black p-6 shadow-inner flex flex-col gap-4 font-sans">
                {/* Government Header */}
                <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-xl bg-blue-600 text-white font-bold text-xs">
                      QC
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-neutral-900 leading-tight">Barangay Culiat, Quezon City</h4>
                      <p className="text-[10px] uppercase tracking-wider text-neutral-500">MMDA NCAP Traffic Enforcement Department</p>
                    </div>
                  </div>
                  <span className="rounded bg-blue-100 text-blue-800 px-2 py-0.5 text-[10px] font-bold font-mono">
                    {selectedEmail.id}
                  </span>
                </div>

                {/* Email Subject & Meta */}
                <div>
                  <h3 className="text-base font-bold text-neutral-900">{selectedEmail.subject}</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Sent: {new Date(selectedEmail.timestamp).toLocaleString("en-PH")}
                  </p>
                </div>

                {/* Body */}
                <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-4 text-xs text-neutral-800 leading-relaxed">
                  <p className="font-semibold text-neutral-900 mb-2">Dear Registered Motorist / Citizen,</p>
                  <p>{selectedEmail.previewBody || "This is an official automated advisory from the Quezon City Local Government Unit regarding your vehicle record and Notice of Violation under the No Contact Apprehension Policy (NCAP)."}</p>

                  {selectedEmail.citationNumber && (
                    <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-white border border-neutral-200 p-3 font-mono text-[11px]">
                      <div>
                        <span className="text-neutral-400 block text-[9px] uppercase">Notice Serial:</span>
                        <strong className="text-neutral-900">{selectedEmail.citationNumber}</strong>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[9px] uppercase">License Plate:</span>
                        <strong className="text-neutral-900">{selectedEmail.plateNumber || "NDB-8921"}</strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* QR and Footer in email */}
                <div className="flex items-center justify-between border-t border-neutral-200 pt-3 text-[10px] text-neutral-500">
                  <div className="flex items-center gap-2">
                    <QrCode className="size-6 text-neutral-800" />
                    <span>Scan to verify digital clearance on QC Citizen Portal</span>
                  </div>
                  <span className="font-bold text-emerald-700">Official Government Advisory</span>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Dialog.Close asChild>
                  <button className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white hover:bg-primary/90">
                    Close Preview
                  </button>
                </Dialog.Close>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  );
}
