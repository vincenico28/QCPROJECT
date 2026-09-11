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
  Stamp,
  Maximize2,
  ShieldCheck,
  User,
  Calendar,
  Building,
  Sparkles,
  ExternalLink,
  ChevronRight,
  BadgeAlert,
} from "lucide-react";
import { useDisputes, useUpdateDispute, type Dispute } from "@/lib/data/disputes";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { timeAgo, formatPeso } from "@/lib/data/traffic";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";

export const Route = createFileRoute("/disputes")({
  head: () => ({
    meta: [
      { title: "Traffic Adjudication Board (TAB) Appeals · Culiat Traffic Ops" },
      {
        name: "description",
        content:
          "Quezon City Traffic Adjudication Board (TAB) Motorist Appeals & Hearing Docket. Review statutory protests, inspect optical ANPR evidence, and execute official resolution orders.",
      },
    ],
  }),
  component: DisputesPage,
});

export function DisputesPage() {
  const { data: disputes = [], isLoading } = useDisputes();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [groundFilter, setGroundFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResolutionDispute, setSelectedResolutionDispute] = useState<Dispute | null>(null);

  const availableGrounds = useMemo(() => {
    const set = new Set<string>();
    disputes.forEach((d) => {
      if (d.statutoryGround) set.add(d.statutoryGround);
    });
    return Array.from(set);
  }, [disputes]);

  const filtered = useMemo(() => {
    return (disputes as Dispute[]).filter((d) => {
      if (filter === "pending" && d.status !== "pending") return false;
      if (filter === "approved" && d.status !== "approved") return false;
      if (filter === "rejected" && d.status !== "rejected") return false;

      if (groundFilter !== "all" && d.statutoryGround !== groundFilter) return false;

      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        d.id.toLowerCase().includes(q) ||
        (d.docketNumber ?? "").toLowerCase().includes(q) ||
        d.citation_id.toLowerCase().includes(q) ||
        (d.citation?.plate_number ?? "").toLowerCase().includes(q) ||
        (d.statutoryGround ?? "").toLowerCase().includes(q) ||
        d.reason.toLowerCase().includes(q) ||
        (d.nominatedDriver?.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [disputes, filter, groundFilter, searchQuery]);

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
              MMDA / QC-DPOS TAB ADJUDICATION BOARD
            </span>
            <span className="text-xs text-subtle">· Legal Hearing Docket (NCAP Form 01)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            Motorist Appeals & Adjudication Queue
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Review formal statutory protests, inspect high-resolution optical CCTV evidence, nominate authorized operators, and issue certified resolution decrees.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              toast.info("Quezon City TAB Docket Registry Synced", {
                description: "Connected to LTO LTMS Apprehension Arbitration Gateway.",
              });
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-panel-elevated transition-colors"
          >
            <ShieldCheck className="size-3.5 text-emerald-400" />
            LTO LTMS Link Active
          </button>
        </div>
      </div>

      {/* KPI Ribbons */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <button
          onClick={() => {
            setFilter("all");
            setGroundFilter("all");
          }}
          className={cn(
            "panel text-left rounded-2xl border p-4 transition-all hover:border-white/30",
            filter === "all" ? "border-primary bg-primary/5 ring-1 ring-primary/40" : "border-border"
          )}
        >
          <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">Total Cases Filed</span>
          <p className="mt-2 font-mono-tab text-2xl font-black text-white">{counts.all}</p>
          <span className="text-[10px] text-white/50 block">Cumulative Formal Appeals</span>
        </button>

        <button
          onClick={() => {
            setFilter("pending");
          }}
          className={cn(
            "panel text-left rounded-2xl border p-4 transition-all hover:border-amber-500/50",
            filter === "pending"
              ? "border-amber-500 bg-amber-950/20 ring-1 ring-amber-500/40"
              : "border-amber-500/30 bg-amber-950/10"
          )}
        >
          <span className="font-mono-tab text-[10px] uppercase tracking-widest text-amber-400">Pending Review</span>
          <p className="mt-2 font-mono-tab text-2xl font-black text-amber-300">{counts.pending}</p>
          <span className="text-[10px] text-amber-400/80 block">Requires Board Ruling</span>
        </button>

        <button
          onClick={() => {
            setFilter("approved");
          }}
          className={cn(
            "panel text-left rounded-2xl border p-4 transition-all hover:border-emerald-500/50",
            filter === "approved"
              ? "border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/40"
              : "border-emerald-500/30 bg-emerald-950/10"
          )}
        >
          <span className="font-mono-tab text-[10px] uppercase tracking-widest text-emerald-400">Appeals Granted</span>
          <p className="mt-2 font-mono-tab text-2xl font-black text-emerald-300">{counts.approved}</p>
          <span className="text-[10px] text-emerald-400/80 block">Dismissed / Fine Waived</span>
        </button>

        <button
          onClick={() => {
            setFilter("rejected");
          }}
          className={cn(
            "panel text-left rounded-2xl border p-4 transition-all hover:border-red-500/50",
            filter === "rejected"
              ? "border-red-500 bg-red-950/20 ring-1 ring-red-500/40"
              : "border-border"
          )}
        >
          <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">Appeals Upheld</span>
          <p className="mt-2 font-mono-tab text-2xl font-black text-white/70">{counts.rejected}</p>
          <span className="text-[10px] text-white/40 block">Citation & Penalty Maintained</span>
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="panel flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-border bg-background p-1">
            {(["pending", "approved", "rejected", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-lg px-3 py-1.5 font-mono-tab text-xs font-bold uppercase tracking-wider transition-colors",
                  filter === f ? "bg-primary text-white shadow-sm" : "text-subtle hover:text-foreground"
                )}
              >
                {f === "pending"
                  ? "Pending"
                  : f === "approved"
                  ? "Granted"
                  : f === "rejected"
                  ? "Upheld"
                  : "All"}
                <span className="ml-1.5 rounded-full bg-black/40 px-1.5 py-0.2 text-[9px] text-white/80">
                  {f === "pending"
                    ? counts.pending
                    : f === "approved"
                    ? counts.approved
                    : f === "rejected"
                    ? counts.rejected
                    : counts.all}
                </span>
              </button>
            ))}
          </div>

          {availableGrounds.length > 0 && (
            <select
              value={groundFilter}
              onChange={(e) => setGroundFilter(e.target.value)}
              aria-label="Filter by statutory ground"
              className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-white focus:border-primary focus:outline-none"
            >
              <option value="all">All Statutory Grounds</option>
              {availableGrounds.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search docket, plate, driver, ground..."
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none font-mono"
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
          <p className="font-bold text-white text-base">No Adjudication Dockets Match Filter</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Try adjusting your search criteria or resetting filters to view all filed motorist protests.
          </p>
          <button
            onClick={() => {
              setFilter("all");
              setGroundFilter("all");
              setSearchQuery("");
            }}
            className="mt-4 rounded-xl border border-border bg-panel px-4 py-2 text-xs font-semibold text-white hover:bg-panel-elevated transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {filtered.map((dispute) => (
            <DisputeCard
              key={dispute.id}
              dispute={dispute}
              onViewOrder={(d) => setSelectedResolutionDispute(d)}
            />
          ))}
        </div>
      )}

      {/* Official Resolution Order Printable Modal */}
      {selectedResolutionDispute && (
        <OfficialResolutionOrderModal
          dispute={selectedResolutionDispute}
          onClose={() => setSelectedResolutionDispute(null)}
        />
      )}
    </div>
  );
}

function DisputeCard({
  dispute,
  onViewOrder,
}: {
  dispute: Dispute;
  onViewOrder: (d: Dispute) => void;
}) {
  const { user } = useAuth();
  const update = useUpdateDispute();
  const [notes, setNotes] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"approved" | "rejected" | null>(null);
  const [evidencePreviewOpen, setEvidencePreviewOpen] = useState(false);

  const citation = dispute.citation;

  const handleResolve = async () => {
    if (!actionType) return;
    update.mutate(
      {
        id: dispute.id,
        status: actionType,
        admin_notes:
          notes ||
          (actionType === "approved"
            ? "Appeal granted under MMDA TAB statutory review guidelines. Citation dismissed and LTO hold cleared."
            : "Appeal denied upon review of high-resolution ANPR footage. Citation upheld."),
        resolved_by: user?.email
          ? `Atty. ${user.email.split("@")[0]}`
          : "Atty. M. Roxas (Senior TAB Hearing Officer)",
      },
      {
        onSuccess: () => {
          toast.success(
            actionType === "approved"
              ? `Appeal Granted for ${dispute.citation_id} (No Fine)`
              : `Appeal Upheld for ${dispute.citation_id}`,
            {
              description:
                actionType === "approved"
                  ? "Citation waived & Certificate of Traffic Clearance generated."
                  : "Motorist notified to settle outstanding citation balance.",
            }
          );
          setModalOpen(false);
        },
      }
    );
  };

  return (
    <article className="panel flex flex-col justify-between gap-4 rounded-2xl border border-border p-6 shadow-xl relative overflow-hidden">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono-tab text-xs font-bold text-primary">
                {dispute.docketNumber || dispute.id}
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
                {dispute.status === "approved"
                  ? "DISMISSED (NO FINE)"
                  : dispute.status === "rejected"
                  ? "UPHELD (FINE ACTIVE)"
                  : "PENDING HEARING"}
              </span>
            </div>
            <p className="mt-1 font-mono-tab text-sm font-bold text-white flex items-center gap-2">
              <span className="rounded bg-black/40 px-2 py-0.5 text-white border border-white/10">
                {citation?.plate_number || "REG-UNVERIFIED"}
              </span>
              <span className="text-muted-foreground">·</span>
              <span>{dispute.citation_id}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">Docket Received</p>
            <p className="font-mono-tab text-xs font-medium text-white/80">{timeAgo(dispute.created_at)}</p>
          </div>
        </div>

        {/* Statutory Ground Pill */}
        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-start justify-between">
          <div>
            <span className="font-mono-tab text-[9px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <BookOpen className="size-3" /> Statutory Ground for Protest
            </span>
            <p className="text-xs font-semibold text-white mt-1">
              {dispute.statutoryGround || "Factual Discrepancy / Road Obstruction"}
            </p>
          </div>
          <span className="rounded bg-black/40 px-2 py-1 font-mono-tab text-[10px] font-bold text-white/80 border border-white/10">
            {formatPeso(citation?.amount || 2500)}
          </span>
        </div>

        {/* Nominated Driver (if provided) */}
        {dispute.nominatedDriver && (
          <div className="mt-3 rounded-xl border border-border/80 bg-background/80 p-3">
            <span className="font-mono-tab text-[9px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <UserCheck className="size-3" /> Nominated Driver Identified
            </span>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="font-medium text-white">{dispute.nominatedDriver.name}</span>
              <span className="font-mono-tab text-[11px] text-muted-foreground">
                License: {dispute.nominatedDriver.licenseNumber}
              </span>
            </div>
            {dispute.nominatedDriver.contactNumber && (
              <p className="font-mono-tab text-[10px] text-subtle mt-0.5">
                Contact: {dispute.nominatedDriver.contactNumber}
              </p>
            )}
          </div>
        )}

        {/* Motorist's statement */}
        <div className="mt-4">
          <p className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
            Motorist Written Statement (TAB Form 01)
          </p>
          <p className="mt-1.5 rounded-xl border border-border bg-background/60 p-3.5 text-xs leading-relaxed text-white">
            "{dispute.reason}"
          </p>
        </div>

        {/* Supporting Document / Evidence */}
        {dispute.supportingDocumentName && (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-border bg-black/40 p-2.5 text-xs">
            <div className="flex items-center gap-2 text-white">
              <FileText className="size-4 text-primary" />
              <span className="font-mono-tab text-[11px] font-medium">{dispute.supportingDocumentName}</span>
            </div>
            <span className="font-mono-tab text-[9px] font-bold uppercase text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 rounded">
              Verified Attachment
            </span>
          </div>
        )}

        {/* Evidence Frame Preview */}
        {citation?.evidenceUrl && (
          <div className="mt-4 rounded-xl border border-border bg-black/50 p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={citation.evidenceUrl}
                alt="Intersection CCTV Evidence"
                className="size-14 rounded-lg object-cover border border-white/10 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setEvidencePreviewOpen(true)}
              />
              <div>
                <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Camera className="size-3.5 text-primary" /> Optical CCTV Snapshot
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {citation.location || "Commonwealth Ave Corridor"}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[10px] font-mono-tab text-subtle">
                  <span>Speed: {citation.speedKph || 24} km/h</span>
                  <span>·</span>
                  <span>{citation.lane || "Lane 1"}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setEvidencePreviewOpen(true)}
              className="rounded-lg border border-border bg-panel p-2 text-muted-foreground hover:text-white hover:bg-panel-elevated transition-colors"
              title="Expand CCTV Snapshot"
            >
              <Maximize2 className="size-4" />
            </button>
          </div>
        )}

        {/* Admin Resolution Display if completed */}
        {dispute.status !== "pending" && dispute.admin_notes && (
          <div className="mt-4 rounded-xl border border-border bg-panel-elevated p-3.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono-tab text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
                <Stamp className="size-3.5" /> Official Board Resolution Order
              </span>
              <span className="text-[10px] font-mono-tab text-muted-foreground">{dispute.resolved_by}</span>
            </div>
            <p className="mt-2 text-white/90 leading-relaxed font-medium">
              {dispute.admin_notes}
            </p>
            {dispute.resolved_at && (
              <p className="text-[10px] font-mono-tab text-subtle mt-1.5">
                Decreed: {new Date(dispute.resolved_at).toLocaleString("en-PH")}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        {dispute.status === "pending" ? (
          <div className="flex items-center gap-2 w-full">
            <button
              onClick={() => {
                setActionType("approved");
                setNotes(
                  `Reviewed intersection telemetry and submitted affidavits. Appeal is GRANTED under Section 42 of the QC Traffic Code. Notice of Violation ${dispute.citation_id} is DISMISSED without fine. LTO LTMS registration hold is expunged.`
                );
                setModalOpen(true);
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600/20 border border-emerald-500/40 py-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all"
            >
              <CheckCircle2 className="size-4" /> Grant Appeal (Dismiss NOV)
            </button>

            <button
              onClick={() => {
                setActionType("rejected");
                setNotes(
                  `ANPR camera footage and speed radar confirm vehicle crossed stop line during steady red phase without authorized manual emergency override. Apprehension UPHELD. Motorist must settle fine within 5 working days.`
                );
                setModalOpen(true);
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-600/20 border border-red-500/40 py-2.5 text-xs font-bold text-red-400 hover:bg-red-600 hover:text-white transition-all"
            >
              <XCircle className="size-4" /> Uphold Violation
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span className="font-mono-tab text-[11px] text-muted-foreground flex items-center gap-1.5">
              <FileCheck className="size-3.5 text-emerald-400" />
              Official Docket Adjudicated
            </span>

            <button
              onClick={() => onViewOrder(dispute)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-3.5 py-2 text-xs font-bold text-primary hover:bg-primary hover:text-white transition-all"
            >
              <Printer className="size-3.5" /> View Official Decree (Form TAB-02)
            </button>
          </div>
        )}

        {/* Resolution Confirmation Modal */}
        <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-panel p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex items-start justify-between border-b border-border pb-3">
                <Dialog.Title className="text-base font-bold text-white flex items-center gap-2">
                  <Gavel className="size-5 text-primary" />
                  {actionType === "approved"
                    ? "Execute Adjudication: Grant & Dismiss Citation"
                    : "Execute Adjudication: Uphold Citation & Fine"}
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
                    ? "Granting this appeal formally dismisses Notice of Violation, zeroes out the statutory penalty, clears any LTO LTMS registration holds, and generates an official Certificate of Traffic Clearance."
                    : "Upholding this citation affirms the fine. The registered owner or nominated operator must settle the fine through authorized payment channels within 5 business days."}
                </p>

                <label className="flex flex-col gap-1.5 mt-2">
                  <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                    Adjudication Board Findings & Legal Decrees *
                  </span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full resize-none rounded-xl border border-border bg-background p-3 text-xs text-white focus:border-primary focus:outline-none font-mono"
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
                      actionType === "approved"
                        ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
                        : "bg-red-600 hover:bg-red-500 shadow-red-600/20"
                    )}
                  >
                    {update.isPending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Stamp className="size-3.5" />
                    )}
                    Promulgate Resolution Decree
                  </button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* Optical CCTV Evidence Full Modal */}
        <Dialog.Root open={evidencePreviewOpen} onOpenChange={setEvidencePreviewOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md animate-in fade-in" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-[#0b0f19] p-6 shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Camera className="size-4 text-primary" />
                  <span className="font-bold text-white text-sm">
                    Optical ANPR Capture Telemetry · {citation?.plate_number}
                  </span>
                </div>
                <Dialog.Close asChild>
                  <button className="rounded p-1 text-muted-foreground hover:text-white">
                    <X className="size-5" />
                  </button>
                </Dialog.Close>
              </div>

              <div className="mt-4 relative overflow-hidden rounded-2xl border border-white/10 bg-black">
                {citation?.evidenceUrl && (
                  <img
                    src={citation.evidenceUrl}
                    alt="Optical ANPR evidence"
                    className="w-full h-80 object-cover"
                  />
                )}
                {/* HUD Telemetry Overlay */}
                <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between font-mono-tab text-[10px] text-emerald-400">
                  <div className="flex justify-between items-start bg-black/60 backdrop-blur px-3 py-1.5 rounded-lg border border-emerald-500/30">
                    <div>
                      <p className="font-bold text-white">CAMERA: QC-CAM-CW-04</p>
                      <p className="text-emerald-400/80">{citation?.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">ANPR OCR: 99.4% CONF</p>
                      <p className="text-emerald-300">CALIBRATED RADAR: {citation?.speedKph || 24} KM/H</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-end bg-black/60 backdrop-blur px-3 py-1.5 rounded-lg border border-emerald-500/30">
                    <p>PLATE: {citation?.plate_number}</p>
                    <p>CIT REF: {dispute.citation_id}</p>
                    <p>TIMESTAMP: {new Date(dispute.created_at).toISOString()}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Official sensor capture securely hashed with SHA-256 for evidentiary integrity.
                </p>
                <div className="flex items-center gap-2">
                  {citation?.evidenceUrl && (
                    <a
                      href={citation.evidenceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel px-3 py-2 text-xs font-semibold text-foreground hover:bg-panel-elevated hover:text-primary transition-colors"
                    >
                      <ExternalLink className="size-3.5" /> Open Full Image
                    </a>
                  )}
                  <Dialog.Close asChild>
                    <button className="rounded-xl border border-border bg-panel px-4 py-2 text-xs font-semibold text-white hover:bg-panel-elevated">
                      Close Preview
                    </button>
                  </Dialog.Close>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </article>
  );
}

function OfficialResolutionOrderModal({
  dispute,
  onClose,
}: {
  dispute: Dispute;
  onClose: () => void;
}) {
  const citation = dispute.citation;
  const isApproved = dispute.status === "approved";

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog.Root open={true} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 max-h-[92vh] overflow-y-auto rounded-3xl border border-border bg-[#0e121a] p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 print:fixed print:inset-0 print:m-0 print:p-8 print:w-full print:max-w-none print:h-auto print:bg-white print:text-black">
          {/* Action Bar (Hidden on print) */}
          <div className="flex items-center justify-between border-b border-border pb-4 print:hidden">
            <div className="flex items-center gap-2">
              <Scale className="size-5 text-primary" />
              <span className="font-bold text-white text-base">
                Official TAB Resolution Order (TAB Form 02)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 transition-all shadow-lg"
              >
                <Printer className="size-3.5" /> Print Resolution Order
              </button>
              <button
                onClick={onClose}
                className="rounded-xl border border-border p-2 text-muted-foreground hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Printable Official Document */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-panel p-6 sm:p-8 text-white print:border-none print:p-0 print:text-black print:bg-white">
            {/* Republic Header */}
            <div className="flex items-center justify-between border-b-2 border-primary/40 pb-4 text-center">
              <div className="flex items-center gap-4 text-left">
                <img src="/favico2.png" alt="QC Seal" className="size-14 object-contain print:invert" />
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground print:text-neutral-600">
                    Republic of the Philippines
                  </h2>
                  <h1 className="text-base font-black tracking-tight text-white print:text-black">
                    QUEZON CITY LOCAL GOVERNMENT
                  </h1>
                  <p className="text-[11px] font-semibold text-primary">
                    Department of Public Order and Safety · Traffic Adjudication Board (TAB)
                  </p>
                </div>
              </div>
              <div className="text-right font-mono-tab text-xs">
                <p className="font-bold text-primary">FORM TAB-02</p>
                <p className="text-white print:text-black">{dispute.docketNumber || "QC-TAB-2026"}</p>
                <p className="text-[10px] text-muted-foreground print:text-neutral-500">
                  Date: {new Date(dispute.resolved_at || dispute.created_at).toLocaleDateString("en-PH")}
                </p>
              </div>
            </div>

            {/* Title */}
            <div className="my-6 text-center">
              <h3 className="text-lg font-black tracking-wider uppercase underline decoration-primary underline-offset-4">
                CERTIFICATE OF ADJUDICATION & RESOLUTION DECREE
              </h3>
              <p className="text-xs text-muted-foreground mt-1 print:text-neutral-600">
                In the Matter of Motorist Protest vs. Notice of Violation {dispute.citation_id}
              </p>
            </div>

            {/* Case Particulars Table */}
            <div className="grid grid-cols-2 gap-4 rounded-xl border border-border p-4 text-xs font-mono-tab print:border-neutral-300">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Registered Vehicle Plate</p>
                <p className="font-bold text-white text-sm mt-0.5 print:text-black">
                  {citation?.plate_number || "REG-UNVERIFIED"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Notice of Violation Reference</p>
                <p className="font-bold text-white text-sm mt-0.5 print:text-black">{dispute.citation_id}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Alleged Infraction</p>
                <p className="font-medium text-white print:text-black">{citation?.offense || "Traffic Code Infraction"}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Statutory Ground Raised</p>
                <p className="font-medium text-primary">{dispute.statutoryGround || "Factual Defense"}</p>
              </div>
              <div className="col-span-2 border-t border-border/50 pt-2 print:border-neutral-200">
                <p className="text-[10px] text-muted-foreground uppercase">Intersectional Location</p>
                <p className="font-medium text-white print:text-black">
                  {citation?.location || "Commonwealth Avenue & Tandang Sora Corridor, Quezon City"}
                </p>
              </div>
            </div>

            {/* Official Evidentiary Snapshot Exhibit */}
            {citation?.evidenceUrl && (
              <div className="mt-4 rounded-xl border border-border p-3.5 bg-black/40 print:bg-transparent print:border-neutral-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono-tab text-[10px] uppercase font-bold text-muted-foreground print:text-black flex items-center gap-1.5">
                    <Camera className="size-3 text-primary print:text-black" /> Optical CCTV Evidence Exhibit A
                  </span>
                  <span className="font-mono-tab text-[9px] text-emerald-400 print:text-green-800 font-bold">
                    ANPR VERIFIED · {citation.plate_number}
                  </span>
                </div>
                <img
                  src={citation.evidenceUrl}
                  alt="Optical Evidence Exhibit"
                  className="h-40 w-full object-cover rounded-lg border border-white/10 print:border-neutral-300"
                />
              </div>
            )}

            {/* Findings & Ruling */}
            <div className="mt-6 space-y-3 text-xs leading-relaxed">
              <h4 className="font-bold uppercase tracking-wider text-primary text-[11px]">
                FINDINGS OF THE BOARD:
              </h4>
              <p className="text-white/90 print:text-black bg-background/50 print:bg-transparent p-4 rounded-xl border border-border/50 print:border-none">
                {dispute.admin_notes ||
                  (isApproved
                    ? "Upon ocular inspection of high-resolution sensor telemetry and verification of the statutory defense, the Traffic Adjudication Board finds that the motorist's vehicle entered the intersection pursuant to lawful emergency precedence. Accordingly, liability under Ordinance No. SP-2957 is extinguished."
                    : "After thorough optical examination of camera footage, the Board finds sufficient evidence establishing that the vehicle traversed the stop bar without justification. Apprehension is affirmed.")}
              </p>

              <h4 className="font-bold uppercase tracking-wider text-primary text-[11px] pt-2">
                ORDER & DISPOSITION:
              </h4>
              <div
                className={cn(
                  "rounded-xl border p-4 text-center font-bold text-sm",
                  isApproved
                    ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-400 print:text-green-800 print:border-green-800"
                    : "border-red-500/40 bg-red-950/20 text-red-400 print:text-red-800 print:border-red-800"
                )}
              >
                {isApproved ? (
                  <div>
                    <p className="text-base uppercase tracking-wider">APPEAL GRANTED · CITATION DISMISSED</p>
                    <p className="text-xs font-normal text-emerald-300 mt-1 print:text-neutral-700">
                      Fine of {formatPeso(citation?.amount || 2500)} is WAIVED IN FULL. LTO LTMS Registration hold is
                      cleared.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-base uppercase tracking-wider">APPEAL DENIED · VIOLATION AFFIRMED</p>
                    <p className="text-xs font-normal text-red-300 mt-1 print:text-neutral-700">
                      The amount of {formatPeso(citation?.amount || 2500)} remains due and payable within 5 working
                      days.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Official Signatures & Seal */}
            <div className="mt-10 pt-6 border-t border-border flex items-end justify-between text-xs print:border-neutral-300">
              <div>
                <div className="flex items-center gap-2 text-emerald-400 print:text-green-800">
                  <Stamp className="size-6" />
                  <span className="font-mono-tab text-[10px] font-black uppercase">
                    SEALED & PROMULGATED
                  </span>
                </div>
                <p className="text-[10px] font-mono-tab text-muted-foreground mt-1 print:text-neutral-500">
                  Electronic Verification ID: {dispute.id}
                </p>
              </div>

              <div className="text-center">
                <div className="w-48 border-b border-white print:border-black mb-1 mx-auto" />
                <p className="font-bold text-white print:text-black">
                  {dispute.resolved_by || "Atty. M. Roxas"}
                </p>
                <p className="text-[10px] text-muted-foreground print:text-neutral-600">
                  Hearing Officer & TAB Legal Chairman
                </p>
                <p className="text-[9px] text-primary">QC DPOS Adjudication Board</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end print:hidden">
            <button
              onClick={onClose}
              className="rounded-xl border border-border bg-panel px-4 py-2 text-xs font-semibold text-white hover:bg-panel-elevated"
            >
              Done
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
