import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCitations, formatPeso, timeAgo, type Citation, useUpdateCitationStatus, useCreateCitation } from "@/lib/data/traffic";
import { fineFor } from "@/lib/data/review";
import { cn } from "@/lib/utils";
import {
  Search,
  Download,
  Receipt,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Plus,
  Printer,
  Copy,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  QrCode,
  FileText,
  AlertTriangle,
  X,
  Loader2,
  Building2,
  Calendar,
  UserCheck,
  Car,
  DollarSign,
  Scale,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/citations")({
  head: () => ({
    meta: [
      { title: "Digital Citations & NOV Ledger · Culiat Traffic Ops" },
      {
        name: "description",
        content:
          "Digital traffic citations and Notices of Violation (NOV) issued across Barangay Culiat, Quezon City with payment status, officer attribution, and revenue analytics.",
      },
      { property: "og:title", content: "Digital Citations & NOV Ledger · Culiat Traffic Ops" },
      {
        property: "og:description",
        content:
          "Digital citations ledger with payment tracking and revenue analytics for Barangay Culiat, Quezon City enforcement.",
      },
    ],
  }),
  component: CitationsPage,
});

const STATUSES = ["all", "unpaid", "paid", "contested", "overdue"] as const;
type StatusFilter = (typeof STATUSES)[number];

const OFFENSE_TYPES = [
  "All Offenses",
  "Red Light",
  "Illegal Parking",
  "Counterflow",
  "Yellow Box Infraction",
  "Bus Lane Violation",
  "No Helmet",
  "Overspeeding",
] as const;

function CitationsPage() {
  const { data: citations = [], isLoading } = useCitations(200);
  const updateStatus = useUpdateCitationStatus();
  const createCitation = useCreateCitation();

  const [status, setStatus] = useState<StatusFilter>("all");
  const [offenseFilter, setOffenseFilter] = useState<string>("All Offenses");
  const [q, setQ] = useState("");
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form State for Direct Citation
  const [formPlate, setFormPlate] = useState("");
  const [formVehicle, setFormVehicle] = useState("");
  const [formOffense, setFormOffense] = useState("Illegal Parking");
  const [formAmount, setFormAmount] = useState(1000);
  const [formOfficer, setFormOfficer] = useState("Sgt. Juan Dela Cruz");

  const filtered = useMemo(() => {
    return citations.filter((c) => {
      if (status !== "all" && c.status !== status) return false;
      if (offenseFilter !== "All Offenses" && c.offense !== offenseFilter) return false;
      if (!q) return true;
      const n = q.toLowerCase();
      return (
        c.citation_number.toLowerCase().includes(n) ||
        c.plate_number.toLowerCase().includes(n) ||
        c.offense.toLowerCase().includes(n) ||
        (c.vehicle_model ?? "").toLowerCase().includes(n) ||
        (c.officer_name ?? "").toLowerCase().includes(n)
      );
    });
  }, [citations, status, offenseFilter, q]);

  const stats = useMemo(() => {
    const total = citations.reduce((s, c) => s + Number(c.amount), 0);
    const paid = citations.filter((c) => c.status === "paid");
    const paidSum = paid.reduce((s, c) => s + Number(c.amount), 0);
    const unpaidSum = citations
      .filter((c) => c.status === "unpaid" || c.status === "overdue")
      .reduce((s, c) => s + Number(c.amount), 0);
    const collectionRate = total > 0 ? (paidSum / total) * 100 : 0;
    return {
      issued: citations.length,
      total,
      paidSum,
      unpaidSum,
      collectionRate,
      counts: {
        all: citations.length,
        unpaid: citations.filter((c) => c.status === "unpaid").length,
        paid: paid.length,
        contested: citations.filter((c) => c.status === "contested").length,
        overdue: citations.filter((c) => c.status === "overdue").length,
      } as Record<StatusFilter, number>,
    };
  }, [citations]);

  async function exportCsv() {
    const rows = [
      ["Notice of Violation #", "Plate", "Vehicle", "Offense", "Amount", "Status", "Officer", "Issued"],
      ...filtered.map((c) => [
        c.citation_number,
        c.plate_number,
        c.vehicle_model ?? "",
        c.offense,
        String(c.amount),
        c.status,
        c.officer_name ?? "",
        new Date(c.issued_at).toISOString(),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qc-citations-ledger-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      await supabase.from("audit_logs").insert({
        actor_name: "Treasury & Adjudication Officer",
        actor_role: "admin",
        action: "CITATIONS_EXPORTED_CSV",
        target_resource: "Citations Ledger",
        details: `Exported ${filtered.length} citation records.`,
      });
    } catch (err) {
      console.warn(err);
    }
  }

  const handleCreateDirectCitation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPlate) return;
    createCitation.mutate(
      {
        plate_number: formPlate.toUpperCase().trim(),
        offense: formOffense,
        amount: formAmount,
        officer_name: formOfficer,
      },
      {
        onSuccess: (newC) => {
          toast.success(`Citation ${newC.citation_number} issued successfully`, {
            description: `Plate: ${newC.plate_number} · Amount: ${formatPeso(newC.amount)}`,
          });
          setCreateModalOpen(false);
          setFormPlate("");
          setFormVehicle("");
        },
      },
    );
  };

  const handleMarkSettled = (cit: Citation) => {
    updateStatus.mutate(
      { citationId: cit.citation_number, status: "paid" },
      {
        onSuccess: () => {
          toast.success(`Citation ${cit.citation_number} marked as PAID / SETTLED`, {
            description: "Official Receipt generated and LTO alarm cleared.",
          });
          setSelectedCitation(null);
        },
      },
    );
  };

  const handleMarkContested = (cit: Citation) => {
    updateStatus.mutate(
      { citationId: cit.citation_number, status: "contested" },
      {
        onSuccess: () => {
          toast.info(`Citation ${cit.citation_number} marked as CONTESTED`, {
            description: "Transferred to Traffic Adjudication Board (TAB) review queue.",
          });
          setSelectedCitation(null);
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-primary/20 px-2 py-0.5 font-mono-tab text-[10px] font-bold text-primary border border-primary/30">
              MMDA NCAP UNIFIED LEDGER
            </span>
            <span className="text-xs text-subtle">· Live LGU Database</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            Digital Citations & Notice of Violation (NOV)
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage issued citations, over-the-counter payments, TAB appeals, and LTO clearance status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Issue Direct Citation Modal */}
          <Dialog.Root open={createModalOpen} onOpenChange={setCreateModalOpen}>
            <Dialog.Trigger asChild>
              <button className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all">
                <Plus className="size-3.5" />
                Issue Direct Citation
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-panel p-6 shadow-2xl animate-in fade-in zoom-in-95">
                <div className="flex items-start justify-between border-b border-border pb-3">
                  <Dialog.Title className="text-base font-bold text-foreground flex items-center gap-2">
                    <Receipt className="size-4 text-primary" />
                    Issue Manual Traffic Citation
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button className="rounded p-1 text-muted-foreground hover:text-foreground">
                      <X className="size-4" />
                    </button>
                  </Dialog.Close>
                </div>

                <form onSubmit={handleCreateDirectCitation} className="mt-4 flex flex-col gap-4">
                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                      Vehicle License Plate *
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. NDB-8921"
                      value={formPlate}
                      onChange={(e) => setFormPlate(e.target.value.toUpperCase())}
                      className="rounded-lg border border-border bg-background px-3.5 py-2 text-sm uppercase text-foreground focus:border-primary focus:outline-none"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                      Vehicle Make / Model
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. Toyota Vios (Silver)"
                      value={formVehicle}
                      onChange={(e) => setFormVehicle(e.target.value)}
                      className="rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                      Offense Description *
                    </span>
                    <select
                      value={formOffense}
                      onChange={(e) => {
                        setFormOffense(e.target.value);
                        setFormAmount(fineFor(e.target.value));
                      }}
                      className="rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="Illegal Parking">Illegal Parking (₱1,000)</option>
                      <option value="Red Light">Red Light / Beating the Red Light (₱2,000)</option>
                      <option value="Counterflow">Counterflow (₱2,500)</option>
                      <option value="Yellow Box Infraction">Yellow Box Infraction (₱1,500)</option>
                      <option value="Bus Lane Violation">Bus Lane Violation (₱5,000)</option>
                      <option value="No Helmet">No Helmet (₱1,500)</option>
                      <option value="Overspeeding">Overspeeding (₱3,000)</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                      Fine Amount (PHP) *
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={formAmount}
                      onChange={(e) => setFormAmount(Number(e.target.value))}
                      className="rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                      Issuing Enforcer / Officer
                    </span>
                    <input
                      type="text"
                      value={formOfficer}
                      onChange={(e) => setFormOfficer(e.target.value)}
                      className="rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                  </label>

                  <div className="mt-4 flex justify-end gap-3 border-t border-border pt-4">
                    <Dialog.Close asChild>
                      <button className="rounded-lg px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-panel-elevated">
                        Cancel
                      </button>
                    </Dialog.Close>
                    <button
                      type="submit"
                      disabled={createCitation.isPending || !formPlate}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 disabled:opacity-50"
                    >
                      {createCitation.isPending && <Loader2 className="size-3.5 animate-spin" />}
                      Issue Citation ({formatPeso(formAmount)})
                    </button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-panel-elevated transition-colors"
          >
            <Download className="size-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Citations Issued"
          value={stats.issued.toLocaleString()}
          icon={Receipt}
          tone="primary"
          sub="Total NCAP & Officer notices"
        />
        <KpiCard
          label="Revenue Collected"
          value={formatPeso(stats.paidSum)}
          icon={CheckCircle2}
          tone="success"
          sub={`${stats.collectionRate.toFixed(1)}% collection rate`}
        />
        <KpiCard
          label="Outstanding Balance"
          value={formatPeso(stats.unpaidSum)}
          icon={Clock}
          tone="warning"
          sub={`${stats.counts.unpaid + stats.counts.overdue} pending notices`}
        />
        <KpiCard
          label="Total Billed"
          value={formatPeso(stats.total)}
          icon={TrendingUp}
          tone="primary"
          sub="Gross citation liability"
        />
      </div>

      {/* Filter Bar */}
      <div className="panel flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-border bg-background p-1">
            {STATUSES.map((s) => {
              const active = status === s;
              return (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={cn(
                    "shrink-0 rounded-lg px-3 py-1.5 font-mono-tab text-[11px] font-bold uppercase tracking-wider transition-colors",
                    active ? "bg-primary text-white shadow-sm" : "text-subtle hover:text-foreground",
                  )}
                >
                  {s}
                  <span className="ml-1.5 rounded-full bg-black/40 px-1.5 py-0.2 text-[9px] text-white/80">
                    {stats.counts[s]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Offense Filter */}
          <select
            value={offenseFilter}
            onChange={(e) => setOffenseFilter(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
          >
            {OFFENSE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="relative flex items-center w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 size-4 text-subtle" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search NOV#, plate, vehicle, officer…"
              className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none"
            />
          </label>
        </div>
      </div>

      {/* Citations Table */}
      <div className="panel overflow-hidden rounded-2xl border border-border shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-black/20">
                {[
                  "Notice / Citation #",
                  "Plate Number",
                  "Vehicle",
                  "Offense",
                  "Amount",
                  "Issuing Authority",
                  "Issued Date",
                  "Status",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-sm text-subtle">
                    <Loader2 className="mx-auto size-6 animate-spin text-primary mb-2" />
                    Loading citations ledger…
                  </td>
                </tr>
              )}
              {!isLoading &&
                filtered.map((c) => (
                  <CitationRow
                    key={c.id}
                    c={c}
                    onOpenDetail={() => setSelectedCitation(c)}
                  />
                ))}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-sm text-subtle">
                    No citations match your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* OFFICIAL NOTICE OF VIOLATION (NOV) DETAIL & PRINT MODAL */}
      {selectedCitation && (
        <Dialog.Root open onOpenChange={(o) => !o && setSelectedCitation(null)}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-panel p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              {/* Slip Header */}
              <div className="flex items-start justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-12 place-items-center rounded-2xl bg-primary/20 text-primary border border-primary/30">
                    <Building2 className="size-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Barangay Culiat, Quezon City</h3>
                    <p className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                      Unified MMDA NCAP Traffic Enforcement
                    </p>
                  </div>
                </div>
                <Dialog.Close asChild>
                  <button className="rounded p-1 text-muted-foreground hover:text-foreground">
                    <X className="size-5" />
                  </button>
                </Dialog.Close>
              </div>

              {/* Official Slip Content */}
              <div className="mt-6 rounded-2xl border border-border/80 bg-background/80 p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                  <div>
                    <span className="text-[10px] font-mono-tab text-subtle uppercase">Official Serial Reference</span>
                    <p className="font-mono-tab text-base font-black text-white">{selectedCitation.citation_number}</p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 font-mono-tab text-xs font-bold uppercase",
                      selectedCitation.status === "paid"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : selectedCitation.status === "overdue"
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : selectedCitation.status === "contested"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-amber-500/20 text-amber-400 border border-amber-500/30",
                    )}
                  >
                    {selectedCitation.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-subtle font-mono-tab text-[10px] uppercase">License Plate</span>
                    <p className="font-mono-tab text-sm font-bold text-white mt-0.5">{selectedCitation.plate_number}</p>
                  </div>
                  <div>
                    <span className="text-subtle font-mono-tab text-[10px] uppercase">Vehicle Model</span>
                    <p className="font-medium text-white mt-0.5">{selectedCitation.vehicle_model || "Registered Vehicle"}</p>
                  </div>
                  <div>
                    <span className="text-subtle font-mono-tab text-[10px] uppercase">Violation Offense</span>
                    <p className="font-semibold text-white mt-0.5">{selectedCitation.offense}</p>
                  </div>
                  <div>
                    <span className="text-subtle font-mono-tab text-[10px] uppercase">Fine Amount</span>
                    <p className="font-mono-tab text-base font-black text-white mt-0.5">{formatPeso(selectedCitation.amount)}</p>
                  </div>
                  <div>
                    <span className="text-subtle font-mono-tab text-[10px] uppercase">Issuing Authority</span>
                    <p className="text-white mt-0.5">{selectedCitation.officer_name || "AI Automated Camera Grid"}</p>
                  </div>
                  <div>
                    <span className="text-subtle font-mono-tab text-[10px] uppercase">Date & Time Issued</span>
                    <p className="font-mono-tab text-white mt-0.5">{new Date(selectedCitation.issued_at).toLocaleString("en-PH")}</p>
                  </div>
                </div>

                {/* QR Code & LTO status */}
                <div className="rounded-xl border border-white/5 bg-black/40 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <QrCode className="size-10 text-white shrink-0" />
                    <div>
                      <p className="text-[11px] font-bold text-white">Digital Verification QR</p>
                      <p className="text-[10px] text-white/50">LTO LTMS Hold release valid upon clearance</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono-tab font-bold text-emerald-400">
                    {selectedCitation.status === "paid" ? "CLEARANCE ACTIVE" : "HOLD PENDING"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-panel-elevated transition-colors"
                  >
                    <Printer className="size-3.5" />
                    Print Notice Slip
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/portal/pay/${selectedCitation.citation_number}`);
                      toast.success("Public payment link copied to clipboard!");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-panel-elevated transition-colors"
                  >
                    <Copy className="size-3.5" />
                    Copy Pay Link
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {selectedCitation.status !== "paid" && (
                    <button
                      onClick={() => handleMarkSettled(selectedCitation)}
                      disabled={updateStatus.isPending}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="size-3.5" />
                      Mark Paid (OTC Cash / Card)
                    </button>
                  )}

                  {selectedCitation.status === "unpaid" && (
                    <button
                      onClick={() => handleMarkContested(selectedCitation)}
                      disabled={updateStatus.isPending}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/40 bg-blue-500/10 px-3.5 py-2 text-xs font-bold text-blue-400 hover:bg-blue-500/20 transition-colors"
                    >
                      <Scale className="size-3.5" />
                      File TAB Contest
                    </button>
                  )}
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
  sub,
}: {
  label: string;
  value: string;
  icon: typeof Receipt;
  tone: "primary" | "success" | "warning";
  sub?: string;
}) {
  const toneCls =
    tone === "success"
      ? "text-success bg-success/10 border-success/30"
      : tone === "warning"
        ? "text-warning bg-warning/10 border-warning/30"
        : "text-primary bg-primary/10 border-primary/30";
  return (
    <div className="panel rounded-2xl p-5 border border-border">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
            {label}
          </div>
          <div className="mt-2 text-2xl font-black tracking-tight text-foreground">{value}</div>
          {sub && <div className="mt-1 font-mono-tab text-[11px] text-muted-foreground">{sub}</div>}
        </div>
        <div className={cn("grid size-10 place-items-center rounded-xl border", toneCls)}>
          <Icon className="size-5" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}

function CitationRow({
  c,
  onOpenDetail,
}: {
  c: Citation;
  onOpenDetail: () => void;
}) {
  const statusTone =
    c.status === "paid"
      ? "bg-success/10 text-success border-success/30"
      : c.status === "contested"
        ? "bg-primary/10 text-primary border-primary/30"
        : c.status === "overdue"
          ? "bg-danger/10 text-danger border-danger/30"
          : "bg-warning/10 text-warning border-warning/30";
  const StatusIcon = c.status === "paid" ? CheckCircle2 : c.status === "overdue" ? XCircle : Clock;

  return (
    <tr className="text-sm transition-colors hover:bg-panel-elevated/50">
      <td className="px-5 py-3.5">
        <button
          onClick={onOpenDetail}
          className="font-mono-tab font-bold text-white hover:text-primary transition-colors flex items-center gap-1.5"
        >
          {c.citation_number}
        </button>
      </td>
      <td className="px-5 py-3.5 font-mono-tab font-semibold text-white">{c.plate_number}</td>
      <td className="px-5 py-3.5 text-xs text-muted-foreground">{c.vehicle_model ?? "—"}</td>
      <td className="px-5 py-3.5 text-xs font-semibold text-white">{c.offense}</td>
      <td className="px-5 py-3.5 font-mono-tab font-bold text-white">{formatPeso(Number(c.amount))}</td>
      <td className="px-5 py-3.5 text-xs text-muted-foreground">{c.officer_name ?? "AI Camera Grid"}</td>
      <td className="px-5 py-3.5">
        <div className="text-xs text-white">{timeAgo(c.issued_at)}</div>
        <div className="font-mono-tab text-[10px] text-subtle">
          {new Date(c.issued_at).toLocaleDateString("en-PH")}
        </div>
      </td>
      <td className="px-5 py-3.5">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono-tab text-[10px] font-bold uppercase",
            statusTone,
          )}
        >
          <StatusIcon className="size-3" />
          {c.status}
        </span>
      </td>
      <td className="px-5 py-3.5 text-right">
        <button
          onClick={onOpenDetail}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-panel px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-panel-elevated hover:text-white transition-colors"
        >
          <FileText className="size-3.5" />
          View Slip
        </button>
      </td>
    </tr>
  );
}
