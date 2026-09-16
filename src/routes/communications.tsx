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
  Printer,
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
  "Payment Declined",
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
        (log.recipientName ?? "").toLowerCase().includes(q) ||
        (log.citationNumber ?? "").toLowerCase().includes(q) ||
        (log.plateNumber ?? "").toLowerCase().includes(q) ||
        (log.offense ?? "").toLowerCase().includes(q) ||
        (log.vehicleModel ?? "").toLowerCase().includes(q)
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
        onSuccess: () => {
          toast.success(`Email notification sent to ${recipient}`);
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
              <div className="flex items-center gap-2.5">
                <h2 className="font-bold text-white text-base">Real-Time Email Dispatch Stream</h2>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500"></span>
                  </span>
                  Realtime Sync
                </span>
              </div>

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
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-white group-hover:text-primary transition-colors">
                          {log.subject}
                        </span>
                        {log.plateNumber && (
                          <span className="rounded bg-primary/15 border border-primary/30 px-1.5 py-0.5 font-mono-tab text-[9px] font-bold text-primary">
                            {log.plateNumber}
                          </span>
                        )}
                        {log.amount && (
                          <span className="rounded bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 font-mono-tab text-[9px] font-bold text-amber-400">
                            ₱{log.amount.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        {log.recipientName && (
                          <>
                            <strong className="text-white/80 font-medium">{log.recipientName}</strong>
                            <span>·</span>
                          </>
                        )}
                        <span className="truncate">{log.recipient}</span>
                        {log.vehicleModel && (
                          <>
                            <span>·</span>
                            <span className="text-white/50 text-[11px] truncate">{log.vehicleModel}</span>
                          </>
                        )}
                      </div>
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

                  {log.offense && (
                    <div className="text-[11px] text-amber-300/80 bg-amber-950/20 border border-amber-500/20 rounded px-2 py-0.5 w-fit">
                      Offense: <span className="font-semibold text-white/90">{log.offense}</span>
                    </div>
                  )}

                  {log.previewBody && (
                    <p className="text-xs text-white/70 line-clamp-2 leading-relaxed mt-0.5">
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
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-panel p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b border-border pb-3">
                <div>
                  <Dialog.Title className="text-base font-bold text-white flex items-center gap-2">
                    <MailOpen className="size-4 text-primary" />
                    Official Email Transmission Dispatch
                  </Dialog.Title>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Transmitted to: <strong className="text-white">{selectedEmail.recipientName ? `${selectedEmail.recipientName} (${selectedEmail.recipient})` : selectedEmail.recipient}</strong>
                  </p>
                </div>
                <Dialog.Close asChild>
                  <button className="rounded p-1 text-muted-foreground hover:text-foreground">
                    <X className="size-4" />
                  </button>
                </Dialog.Close>
              </div>

              {/* Rendered Government Letterhead Email Body */}
              <div className="mt-4 rounded-2xl border border-neutral-300 bg-neutral-50 text-neutral-900 p-6 sm:p-8 shadow-inner flex flex-col gap-5 font-sans">
                {/* Government Official Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-neutral-800 pb-4 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="grid size-12 place-items-center rounded-2xl bg-blue-900 text-white font-black text-sm shadow-md border-2 border-amber-400">
                      QC
                    </div>
                    <div>
                      <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-500 font-bold block">
                        Republic of the Philippines
                      </span>
                      <h3 className="font-black text-base text-blue-950 tracking-tight leading-tight">
                        QUEZON CITY GOVERNMENT
                      </h3>
                      <p className="text-[11px] font-semibold text-neutral-700">
                        Department of Public Order and Safety (DPOS) · MMDA NCAP Operations
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end text-xs font-mono">
                    <span className="rounded bg-blue-900 text-amber-300 px-2.5 py-0.5 text-[10px] font-bold tracking-wider">
                      TRANSMISSION REF: {selectedEmail.id.slice(0, 13)}
                    </span>
                    <span className="text-[10px] text-neutral-500 mt-1">
                      {new Date(selectedEmail.timestamp).toLocaleString("en-PH", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                </div>

                {/* Recipient & Metadata Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl bg-white border border-neutral-200 p-4 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">Registered Motorist</span>
                    <strong className="text-neutral-900 text-sm block mt-0.5">
                      {selectedEmail.recipientName || "Registered Vehicle Owner"}
                    </strong>
                    <span className="text-neutral-500 text-[11px] break-all">{selectedEmail.recipient}</span>
                  </div>

                  <div className="flex flex-col sm:items-end justify-center">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">Notice Identifier</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <strong className="font-mono text-sm text-blue-950">
                        {selectedEmail.citationNumber || "NOV-NOTICE-REF"}
                      </strong>
                      {selectedEmail.plateNumber && (
                        <span className="rounded bg-amber-100 border border-amber-300 px-2 py-0.5 font-mono text-[10px] font-black text-amber-900">
                          {selectedEmail.plateNumber}
                        </span>
                      )}
                    </div>
                    {selectedEmail.vehicleModel && (
                      <span className="text-neutral-500 text-[11px] mt-0.5">{selectedEmail.vehicleModel}</span>
                    )}
                  </div>
                </div>

                {/* Email Subject Headline */}
                <div className="border-l-4 border-blue-800 pl-3 py-1">
                  <h4 className="text-base font-black text-blue-950">{selectedEmail.subject}</h4>
                  <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                    Category: {selectedEmail.type} · Delivery: {selectedEmail.status}
                  </span>
                </div>

                {/* Dynamic Content based on Email Type */}
                <div className="rounded-xl bg-white border border-neutral-200 p-5 text-xs text-neutral-800 leading-relaxed flex flex-col gap-3">
                  {selectedEmail.type === "Citation Notice" && (
                    <>
                      <p className="font-semibold text-neutral-900">
                        Notice to Registered Motorist under Quezon City Ordinance SP-2957, S-2020:
                      </p>
                      <p>
                        Please be advised that an automated traffic citation was issued against the vehicle with license plate <strong className="text-blue-900 font-mono">{selectedEmail.plateNumber || "registered to your name"}</strong> for the offense of:
                      </p>
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3.5 flex flex-col gap-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-amber-950 text-sm">
                            {selectedEmail.offense || "Traffic Ordinance Violation"}
                          </span>
                          {selectedEmail.amount && (
                            <span className="font-mono font-black text-amber-900 text-sm">
                              ₱{selectedEmail.amount.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-amber-800 leading-normal">
                          Location: Commonwealth Ave. / Katipunan Ave. Corridor · High-resolution digital CCTV evidence verified by QC DPOS Traffic Operations.
                        </p>
                      </div>

                      <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-[11px] text-red-900 flex items-start gap-2">
                        <AlertTriangle className="size-4 shrink-0 text-red-600 mt-0.5" />
                        <div>
                          <strong className="block">STATUTORY DEADLINE FOR SETTLEMENT: 10 CALENDAR DAYS</strong>
                          Unsettled notices will cause your vehicle record to be automatically tagged with an <span className="font-bold underline">LTO LTMS Registration Renewal Alarm</span>, preventing vehicle registration renewal nationwide.
                        </div>
                      </div>
                    </>
                  )}

                  {selectedEmail.type === "Payment Receipt" && (
                    <>
                      <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3.5 text-emerald-950 flex items-start gap-2.5">
                        <CheckCircle2 className="size-5 shrink-0 text-emerald-600 mt-0.5" />
                        <div>
                          <strong className="text-sm block">TRAFFIC CITATION SETTLEMENT CONFIRMED</strong>
                          <p className="text-[11px] text-emerald-800 mt-0.5">
                            Your settlement has been recorded and certified by the Quezon City Treasury. Your Certificate of Traffic Clearance is active and all LTO LTMS registration hold alarms have been lifted in real time.
                          </p>
                        </div>
                      </div>

                      {selectedEmail.amount && (
                        <div className="grid grid-cols-2 gap-2 border-t border-b border-neutral-200 py-2.5 text-[11px] font-mono">
                          <div>
                            <span className="text-neutral-400 block text-[9px] uppercase">Amount Settled:</span>
                            <strong className="text-emerald-900 text-sm font-bold">₱{selectedEmail.amount.toLocaleString()}.00</strong>
                          </div>
                          <div>
                            <span className="text-neutral-400 block text-[9px] uppercase">LTO Clearance Status:</span>
                            <strong className="text-emerald-700">CLEARED FOR RENEWAL</strong>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {selectedEmail.type === "Warning Reminder" && (
                    <>
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3.5 text-amber-950 flex items-start gap-2.5">
                        <AlertTriangle className="size-5 shrink-0 text-amber-600 mt-0.5" />
                        <div>
                          <strong className="text-sm block">FINAL URGENT WARNING BEFORE LTO TAGGING</strong>
                          <p className="text-[11px] text-amber-800 mt-0.5">
                            Our records indicate that Notice of Violation <strong className="font-mono">{selectedEmail.citationNumber}</strong> remains unsettled. Only 7 calendar days remain prior to automatic transmission to the Land Transportation Office (LTO) LTMS database.
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {selectedEmail.type === "Payment Declined" && (
                    <>
                      <div className="rounded-lg bg-red-50 border border-red-200 p-3.5 text-red-950 flex items-start gap-2.5">
                        <AlertTriangle className="size-5 shrink-0 text-red-600 mt-0.5" />
                        <div>
                          <strong className="text-sm block">PAYMENT VERIFICATION DECLINED</strong>
                          <p className="text-[11px] text-red-800 mt-0.5">
                            The Quezon City Treasury was unable to verify your submitted payment reference. Please access the Citizen Portal to review the cashier notes and resubmit your valid GCash or LandBank proof of transfer.
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {selectedEmail.type === "TAB Appeal Resolution" && (
                    <>
                      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3.5 text-blue-950 flex items-start gap-2.5">
                        <FileCheck2 className="size-5 shrink-0 text-blue-600 mt-0.5" />
                        <div>
                          <strong className="text-sm block">TRAFFIC ADJUDICATION BOARD RESOLUTION ORDER</strong>
                          <p className="text-[11px] text-blue-800 mt-0.5">
                            The adjudication panel has reviewed your contest regarding {selectedEmail.citationNumber}. Please review the formal resolution order and clearance certificates attached.
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Quick Action Navigation Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {selectedEmail.citationNumber && (
                    <>
                      <a
                        href={`/portal/pay/${encodeURIComponent(selectedEmail.citationNumber)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-900 px-3.5 py-1.5 text-[11px] font-bold text-white hover:bg-blue-800 transition-colors shadow-sm"
                      >
                        <ExternalLink className="size-3" />
                        Open Citizen Payment Portal
                      </a>

                      <a
                        href={`/citations?query=${encodeURIComponent(selectedEmail.citationNumber)}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3.5 py-1.5 text-[11px] font-bold text-neutral-800 hover:bg-neutral-100 transition-colors"
                      >
                        <Eye className="size-3" />
                        View Citation Record
                      </a>
                    </>
                  )}

                  {selectedEmail.plateNumber && (
                    <a
                      href={`/lookup?query=${encodeURIComponent(selectedEmail.plateNumber)}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3.5 py-1.5 text-[11px] font-bold text-neutral-800 hover:bg-neutral-100 transition-colors"
                    >
                      <Search className="size-3" />
                      Public Plate NOV Check
                    </a>
                  )}
                </div>

                {/* Official Verification QR & Seal Footer */}
                <div className="flex items-center justify-between border-t border-neutral-300 pt-4 text-[10px] text-neutral-500">
                  <div className="flex items-center gap-3">
                    <QrCode className="size-8 text-neutral-900 shrink-0" />
                    <div>
                      <span className="font-bold text-neutral-800 block">DIGITALLY SIGNED & VERIFIABLE</span>
                      <span>Quezon City DPOS Automated Communications Gateway</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-blue-900 block uppercase">Republic Act No. 8792</span>
                    <span>Electronic Commerce Act Verified</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel-elevated px-4 py-2 text-xs font-semibold text-white hover:bg-panel-highlight transition-all"
                >
                  <Printer className="size-3.5" />
                  Print Transmission Copy
                </button>

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
