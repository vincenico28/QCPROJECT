import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Scale,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ArrowRight,
  ShieldAlert,
  FileText,
  Camera,
  MapPin,
  Car,
  AlertTriangle,
  UserCheck,
  Eye,
  Gavel,
  BookOpen,
  Printer,
  X,
  FileCheck,
} from "lucide-react";
import { useDisputes, useUpdateDispute, type Dispute } from "@/lib/data/disputes";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { timeAgo, formatPeso } from "@/lib/data/traffic";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";

export const Route = createFileRoute("/disputes")({
  head: () => ({
    meta: [{ title: "Traffic Adjudication Board (TAB) Appeals · Culiat Traffic Ops" }],
  }),
  component: DisputesPage,
});

function DisputesPage() {
  const { data: disputes = [], isLoading } = useDisputes();
  const [filter, setFilter] = useState<"all" | "pending" | "resolved">("pending");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    return (disputes as Dispute[]).filter((d) => {
      if (filter === "pending" && d.status !== "pending") return false;
      if (filter === "resolved" && d.status === "pending") return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        d.id.toLowerCase().includes(q) ||
        d.citation_id.toLowerCase().includes(q) ||
        (d.citation?.plate_number ?? "").toLowerCase().includes(q) ||
        (d.statutoryGround ?? "").toLowerCase().includes(q) ||
        d.reason.toLowerCase().includes(q)
      );
    });
  }, [disputes, filter, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: disputes.length,
      pending: disputes.filter((d) => d.status === "pending").length,
      approved: disputes.filter((d) => d.status === "approved").length,
      rejected: disputes.filter((d) => d.status === "rejected").length,
    };
  }, [disputes]);

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-primary/20 px-2 py-0.5 font-mono-tab text-[10px] font-bold text-primary border border-primary/30">
              MMDA TAB ADJUDICATION BOARD
            </span>
            <span className="text-xs text-subtle">· Legal Hearing Docket</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            Motorist Appeals & Adjudication Queue
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Review formal protests filed under MMDA NCAP guidelines (TAB Form 01), inspect CCTV evidence, and issue official resolution orders.
          </p>
        </div>
      </div>

      {/* KPI Ribbons */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="panel rounded-2xl border border-border p-4">
          <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">Total Cases Filed</span>
          <p className="mt-2 font-mono-tab text-2xl font-black text-white">{counts.all}</p>
          <span className="text-[10px] text-white/50 block">Cumulative Appeals</span>
        </div>

        <div className="panel rounded-2xl border border-amber-500/30 bg-amber-950/10 p-4">
          <span className="font-mono-tab text-[10px] uppercase tracking-widest text-amber-400">Pending Hearing</span>
          <p className="mt-2 font-mono-tab text-2xl font-black text-amber-300">{counts.pending}</p>
          <span className="text-[10px] text-amber-400/80 block">Requires Board Action</span>
        </div>

        <div className="panel rounded-2xl border border-emerald-500/30 bg-emerald-950/10 p-4">
          <span className="font-mono-tab text-[10px] uppercase tracking-widest text-emerald-400">Appeals Granted (Waived)</span>
          <p className="mt-2 font-mono-tab text-2xl font-black text-emerald-300">{counts.approved}</p>
          <span className="text-[10px] text-emerald-400/80 block">Dismissed / No Fine</span>
        </div>

        <div className="panel rounded-2xl border border-border p-4">
          <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">Appeals Upheld</span>
          <p className="mt-2 font-mono-tab text-2xl font-black text-white/70">{counts.rejected}</p>
          <span className="text-[10px] text-white/40 block">Citation Maintained</span>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="panel flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-xl border border-border bg-background p-1">
          {(["pending", "resolved", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-lg px-3 py-1.5 font-mono-tab text-xs font-bold uppercase tracking-wider transition-colors",
                filter === f ? "bg-primary text-white shadow-sm" : "text-subtle hover:text-foreground"
              )}
            >
              {f}
              <span className="ml-1.5 rounded-full bg-black/40 px-1.5 py-0.2 text-[9px] text-white/80">
                {f === "pending" ? counts.pending : f === "resolved" ? counts.approved + counts.rejected : counts.all}
              </span>
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search docket#, plate, ground…"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none"
          />
        </div>
      </div>

      {/* Docket Cards Grid */}
      {isLoading ? (
        <div className="grid place-items-center py-20 text-subtle">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-panel/30 py-20 text-center text-sm text-subtle">
          <Scale className="mb-3 size-8 opacity-30 text-primary" />
          No {filter === "all" ? "" : filter} adjudication cases in the docket.
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {filtered.map((dispute) => (
            <DisputeCard key={dispute.id} dispute={dispute} />
          ))}
        </div>
      )}
    </div>
  );
}

function DisputeCard({ dispute }: { dispute: Dispute }) {
  const { user } = useAuth();
  const update = useUpdateDispute();
  const [notes, setNotes] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"approved" | "rejected" | null>(null);

  const citation = dispute.citation;

  const handleResolve = async () => {
    if (!actionType) return;
    update.mutate(
      {
        id: dispute.id,
        status: actionType,
        admin_notes: notes || (actionType === "approved" ? "Appeal granted under MMDA TAB statutory review guidelines. Citation dismissed and LTO hold cleared." : "Appeal denied upon review of high-resolution ANPR footage. Citation upheld."),
        resolved_by: user?.email ? `Atty. ${user.email.split("@")[0]}` : "Atty. M. Roxas (TAB Hearing Officer)",
      },
      {
        onSuccess: () => {
          toast.success(
            actionType === "approved"
              ? `Appeal Granted for ${dispute.citation_id} (No Fine)`
              : `Appeal Upheld for ${dispute.citation_id}`,
            {
              description: actionType === "approved" ? "Citation waived & Certificate of Traffic Clearance ready." : "Motorist notified to settle outstanding citation balance.",
            }
          );
          setModalOpen(false);
        },
      }
    );
  };

  return (
    <article className="panel flex flex-col justify-between gap-4 rounded-2xl border border-border p-6 shadow-xl">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono-tab text-xs font-bold text-primary">
                {dispute.id}
              </span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 font-mono-tab text-[9px] font-bold uppercase tracking-wider",
                  dispute.status === "pending"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : dispute.status === "approved"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                )}
              >
                {dispute.status === "approved" ? "DISMISSED (NO FINE)" : dispute.status === "rejected" ? "UPHELD" : "PENDING REVIEW"}
              </span>
            </div>
            <p className="mt-1 font-mono-tab text-sm font-bold text-white">
              {citation?.plate_number} · {dispute.citation_id}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">Filed Under NCAP</p>
            <p className="font-mono-tab text-xs font-medium text-white/80">{timeAgo(dispute.created_at)}</p>
          </div>
        </div>

        {/* Statutory Ground Pill */}
        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3">
          <span className="font-mono-tab text-[9px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
            <BookOpen className="size-3" /> Statutory Ground for Appeal
          </span>
          <p className="text-xs font-semibold text-white mt-0.5">
            {dispute.statutoryGround || "Factual / Signal Discrepancy"}
          </p>
        </div>

        {/* Motorist's statement */}
        <div className="mt-4">
          <p className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">Motorist Written Statement</p>
          <p className="mt-1.5 rounded-xl border border-border bg-background/60 p-3.5 text-xs leading-relaxed text-white">
            "{dispute.reason}"
          </p>
        </div>

        {/* Evidence Frame Preview */}
        {citation?.evidenceUrl && (
          <div className="mt-4 rounded-xl border border-border bg-black/50 p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={citation.evidenceUrl}
                alt="Evidence preview"
                className="size-12 rounded-lg object-cover border border-white/10"
              />
              <div>
                <p className="text-xs font-semibold text-white">Intersection CCTV Evidence</p>
                <p className="text-[10px] text-muted-foreground">{citation.location || "Commonwealth Ave Corridor"}</p>
              </div>
            </div>
            <span className="font-mono-tab text-xs font-bold text-white">{formatPeso(citation.amount || 2000)}</span>
          </div>
        )}

        {/* Admin Resolution Display if completed */}
        {dispute.status !== "pending" && dispute.admin_notes && (
          <div className="mt-4 rounded-xl border border-border bg-panel-elevated p-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                Official Board Resolution
              </span>
              <span className="text-[10px] text-white/50">{dispute.resolved_by}</span>
            </div>
            <p className="mt-1.5 text-white/90 leading-relaxed font-medium">
              {dispute.admin_notes}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons for Pending */}
      {dispute.status === "pending" && (
        <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
          <button
            onClick={() => {
              setActionType("approved");
              setNotes("Reviewed intersection telemetry. Appeal is granted under MMDA TAB statutory guidelines. Citation dismissed without fine.");
              setModalOpen(true);
            }}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600/20 border border-emerald-500/40 py-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all"
          >
            <CheckCircle2 className="size-4" /> Grant Appeal (Dismiss NOV)
          </button>
          <button
            onClick={() => {
              setActionType("rejected");
              setNotes("ANPR footage confirms clear line crossing during red phase without authorized manual override. Apprehension upheld.");
              setModalOpen(true);
            }}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-600/20 border border-red-500/40 py-2.5 text-xs font-bold text-red-400 hover:bg-red-600 hover:text-white transition-all"
          >
            <XCircle className="size-4" /> Uphold Violation
          </button>

          {/* Resolution Confirmation Modal */}
          <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-panel p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95">
                <div className="flex items-start justify-between border-b border-border pb-3">
                  <Dialog.Title className="text-base font-bold text-white flex items-center gap-2">
                    <Gavel className="size-5 text-primary" />
                    {actionType === "approved" ? "Issue Resolution: Dismiss Citation" : "Issue Resolution: Uphold Citation"}
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button className="rounded p-1 text-muted-foreground hover:text-foreground">
                      <X className="size-5" />
                    </button>
                  </Dialog.Close>
                </div>

                <div className="mt-4 flex flex-col gap-3 text-xs">
                  <p className="text-muted-foreground leading-relaxed">
                    {actionType === "approved"
                      ? "Granting this appeal will formally dismiss Notice of Violation, zero out the fine, release any LTO LTMS hold alarms, and issue a Traffic Clearance Certificate."
                      : "Upholding this citation requires the registered owner/driver to settle the statutory penalty within 5 business days."}
                  </p>

                  <label className="flex flex-col gap-1.5 mt-2">
                    <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                      Adjudication Board Findings & Order *
                    </span>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                      className="w-full resize-none rounded-xl border border-border bg-background p-3 text-xs text-white focus:border-primary focus:outline-none"
                    />
                  </label>

                  <div className="mt-4 flex justify-end gap-2 border-t border-border pt-4">
                    <Dialog.Close asChild>
                      <button className="rounded-lg px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-panel-elevated">
                        Cancel
                      </button>
                    </Dialog.Close>
                    <button
                      onClick={handleResolve}
                      disabled={update.isPending || !notes}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-all disabled:opacity-50",
                        actionType === "approved" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500"
                      )}
                    >
                      {update.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <FileCheck className="size-3.5" />}
                      Execute Adjudication Order
                    </button>
                  </div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      )}
    </article>
  );
}
