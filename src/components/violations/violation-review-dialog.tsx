import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Loader2,
  ShieldCheck,
  XCircle,
  Camera,
  MapPin,
  Car,
  FileText,
  ScanLine,
  Send,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  CreditCard,
  Scale,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fineFor, useIssueCitation, useReviewViolation } from "@/lib/data/review";
import { formatPeso, timeAgo, useOfficers, useCitations, type Violation, useVehicleLookup } from "@/lib/data/traffic";
import { cn } from "@/lib/utils";
import { parseEvidenceUrls, getPrimaryEvidenceUrl } from "@/lib/storage";

export function ViolationReviewDialog({
  violation,
  onClose,
}: {
  violation: Violation | null;
  onClose: () => void;
}) {
  const [offense, setOffense] = useState("");
  const [amount, setAmount] = useState(0);
  const [officerId, setOfficerId] = useState("");
  const [vehicleModel, setVehicleModel] = useState("Private Vehicle / Sedan");
  const [zoomEvidence, setZoomEvidence] = useState(false);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);

  const { data: officers = [] } = useOfficers();
  const { data: vehicleInfo, isLoading: lookingUpVehicle } = useVehicleLookup(violation?.plate_number ?? "");
  const { data: citations = [] } = useCitations(200);
  const issue = useIssueCitation();
  const review = useReviewViolation();

  const existingCitation = violation
    ? citations.find((c) => c.violation_id === violation.id)
    : null;

  useEffect(() => {
    if (!violation) return;
    setOffense(violation.violation_type);
    setAmount(fineFor(violation.violation_type));
    setOfficerId("");
    setActiveFrameIndex(0);
    setZoomEvidence(false);
  }, [violation]);

  useEffect(() => {
    if (vehicleInfo?.makeModel) {
      setVehicleModel(vehicleInfo.makeModel);
    }
  }, [vehicleInfo]);

  if (!violation) return null;
  const v = violation;
  const conf = Number(v.confidence) > 1 ? Number(v.confidence) : Math.round(Number(v.confidence) * 100);

  async function confirmAndIssue() {
    if (existingCitation) {
      toast.info("Notice of Violation already active", {
        description: `Citation ${existingCitation.citation_number} has already been issued for this violation.`,
      });
      onClose();
      return;
    }

    const officer = officers.find((o) => o.id === officerId) ?? null;
    const finalModel = vehicleModel.trim() || vehicleInfo?.makeModel || null;
    try {
      const row = await issue.mutateAsync({
        violation: v,
        offense: offense.trim() || v.violation_type,
        amount,
        officerName: officer ? `${officer.rank} ${officer.full_name}` : "AI Auto-Validator",
        vehicleModel: finalModel,
      });
      toast.success(`Citation ${row.citation_number} issued & dispatched`, {
        description: `Plate: ${v.plate_number} · ${formatPeso(row.amount)} · NOV dispatched to LTO database`,
      });
      onClose();
    } catch (err) {
      toast.error("Could not issue citation", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  async function dismiss() {
    try {
      await review.mutateAsync({ id: v.id, status: "dismissed" });
      toast.success(`Detection dismissed`, { description: `Plate ${v.plate_number} flagged as non-infraction.` });
      onClose();
    } catch (err) {
      toast.error("Could not dismiss detection", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  const busy = issue.isPending || review.isPending;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl border-border bg-panel text-foreground">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-foreground font-bold">
              <ShieldCheck className="size-5 text-primary" />
              ANPR Detection Review · {v.plate_number}
            </DialogTitle>
            <span className="rounded bg-primary/15 border border-primary/30 px-2 py-0.5 font-mono-tab text-[10px] font-bold text-primary">
              ID: {v.id}
            </span>
          </div>
          <DialogDescription className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
            {v.ai_detected ? "MMDA NCAP Computer Vision Telemetry" : "Manual Field Report"} · {timeAgo(v.detected_at)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Left Column: Evidence & OCR */}
          <div className="flex flex-col gap-3">
            {(() => {
              const frames = parseEvidenceUrls(v.evidence_url);
              const activeFrameUrl = frames[activeFrameIndex] || frames[0] || "/assets/violation-1.jpg";
              return (
                <>
                  <div className="relative overflow-hidden rounded-xl border border-border bg-black">
                    {v.evidence_url ? (
                      <div className="relative group">
                        <img
                          src={activeFrameUrl}
                          alt={`Evidence capture for ${v.plate_number} frame ${activeFrameIndex + 1}`}
                          className={cn(
                            "h-48 w-full object-cover transition-transform duration-300",
                            zoomEvidence && "scale-125"
                          )}
                          loading="lazy"
                        />
                        {/* OCR ANPR Bounding Box Overlay */}
                        <div className="absolute inset-x-6 bottom-4 rounded-lg border-2 border-emerald-400/80 bg-black/70 p-2 backdrop-blur-sm">
                          <div className="flex items-center justify-between text-[10px] font-mono-tab text-emerald-400">
                            <span className="flex items-center gap-1 font-bold">
                              <ScanLine className="size-3" /> ANPR OCR: {v.plate_number}
                            </span>
                            <span className="font-bold">
                              {conf}% MATCH
                              {frames.length > 1 && ` · [${activeFrameIndex + 1}/${frames.length}]`}
                            </span>
                          </div>
                        </div>

                        {/* Multi-Frame Navigation Controls */}
                        {frames.length > 1 && (
                          <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveFrameIndex((prev) => (prev > 0 ? prev - 1 : frames.length - 1));
                              }}
                              className="pointer-events-auto rounded-full bg-black/75 p-1.5 text-white/80 hover:bg-black hover:text-white border border-white/20 transition-all backdrop-blur-sm"
                              title="Previous evidence frame"
                            >
                              <ChevronLeft className="size-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveFrameIndex((prev) => (prev < frames.length - 1 ? prev + 1 : 0));
                              }}
                              className="pointer-events-auto rounded-full bg-black/75 p-1.5 text-white/80 hover:bg-black hover:text-white border border-white/20 transition-all backdrop-blur-sm"
                              title="Next evidence frame"
                            >
                              <ChevronRight className="size-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="grid h-48 place-items-center text-xs text-subtle">
                        <Camera className="size-6 text-subtle mb-1" />
                        No evidence frame available
                      </div>
                    )}
                    {v.evidence_url && (
                      <button
                        type="button"
                        onClick={() => setZoomEvidence(!zoomEvidence)}
                        className="absolute top-2 right-2 rounded-lg bg-black/60 border border-white/10 px-2 py-1 text-[10px] font-mono-tab text-white/80 hover:text-white z-10"
                      >
                        {zoomEvidence ? "Reset Zoom" : "2x Optical Zoom"}
                      </button>
                    )}
                  </div>

                  {/* Multi-Frame Thumbnails */}
                  {frames.length > 1 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {frames.map((frameUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveFrameIndex(idx)}
                          className={cn(
                            "relative h-12 w-16 shrink-0 overflow-hidden rounded-lg border transition-all",
                            activeFrameIndex === idx
                              ? "border-emerald-500 ring-2 ring-emerald-500/50"
                              : "border-white/10 opacity-70 hover:opacity-100 hover:border-white/30"
                          )}
                        >
                          <img src={frameUrl} alt={`Frame ${idx + 1}`} className="size-full object-cover" />
                          <span className="absolute bottom-0.5 right-0.5 rounded bg-black/80 px-1 font-mono-tab text-[8px] font-bold text-white">
                            #{idx + 1}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}

            {/* Camera & Location Metadata */}
            <div className="rounded-xl border border-white/5 bg-background/50 p-3 flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-primary" /> {v.location}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono-tab border-t border-border pt-1.5">
                <span className="text-subtle">Node: {v.camera_code ?? "QC-CAM-GRID"}</span>
                <span className="text-emerald-400 font-semibold">Optical Zoom: 4K Ultra HD</span>
              </div>
            </div>

            {/* LTO Database Lookup Card */}
            <div className={cn(
              "rounded-xl border p-3 text-xs transition-all",
              vehicleInfo?.foundInDatabase
                ? "border-emerald-500/30 bg-emerald-950/20"
                : "border-blue-500/20 bg-blue-950/20"
            )}>
              <div className="flex items-center justify-between">
                <span className={cn(
                  "font-mono-tab text-[9px] font-bold uppercase tracking-wider flex items-center gap-1",
                  vehicleInfo?.foundInDatabase ? "text-emerald-400" : "text-blue-400"
                )}>
                  <Car className="size-3" />
                  {vehicleInfo?.foundInDatabase ? "QC Motorist Registry Match" : "LTO LTMS Vehicle Match"}
                </span>
                {lookingUpVehicle && <Loader2 className="size-3 animate-spin text-subtle" />}
                {vehicleInfo?.ltoAlarmTagged && (
                  <span className="rounded bg-red-500/20 border border-red-500/30 px-1.5 py-0.2 font-mono-tab text-[9px] font-bold text-red-400 uppercase">
                    LTO Hold Active
                  </span>
                )}
              </div>
              <p className="text-white font-semibold text-xs mt-1">
                {lookingUpVehicle ? "Querying registry database..." : (vehicleInfo?.makeModel || vehicleModel)}
              </p>
              <div className="flex items-center justify-between text-[10px] text-white/70 mt-1">
                <span className="truncate max-w-[160px]">Owner: {vehicleInfo?.registeredOwner || "Verifying..."}</span>
                {vehicleInfo?.unpaidCitationsCount ? (
                  <span className="text-amber-400 font-semibold">{vehicleInfo.unpaidCitationsCount} Unpaid Novs</span>
                ) : (
                  <span className="text-emerald-400 font-semibold">Clean Record</span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Citation Form */}
          <div className="flex flex-col gap-3">
            {existingCitation && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3.5 text-xs flex flex-col gap-2 shadow-inner animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5 font-mono-tab text-[10px] uppercase tracking-wider">
                    <CheckCircle2 className="size-3.5 text-emerald-400" />
                    Notice of Violation (NOV) Active
                  </span>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono-tab",
                    existingCitation.status === "paid"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  )}>
                    {existingCitation.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-white pt-1.5 border-t border-emerald-500/20">
                  <span className="text-white/70">Citation Number:</span>
                  <strong className="font-mono-tab text-emerald-300 font-bold">{existingCitation.citation_number}</strong>
                </div>
                <div className="flex items-center justify-between text-xs text-white">
                  <span className="text-white/70">Statutory Fine:</span>
                  <span className="font-bold text-white">{formatPeso(existingCitation.amount)}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-white/60">
                  <span>Adjudicating Officer: {existingCitation.officer_name || "Field Enforcer"}</span>
                  <span>Issued: {timeAgo(existingCitation.issued_at)}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-500/20">
                  {existingCitation.status === "paid" ? (
                    <a
                      href={`/portal/receipt/${existingCitation.citation_number}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/20 hover:bg-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-300 transition-colors"
                    >
                      <Receipt className="size-3.5" />
                      <span>View e-OR & Clearance Pass</span>
                      <ExternalLink className="size-3 text-emerald-400/80" />
                    </a>
                  ) : (
                    <a
                      href={`/portal/pay/${existingCitation.citation_number}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/20 hover:bg-primary/30 px-3 py-1.5 text-xs font-bold text-primary transition-colors"
                    >
                      <CreditCard className="size-3.5" />
                      <span>Open Motorist Payment Portal</span>
                      <ExternalLink className="size-3 text-primary/80" />
                    </a>
                  )}

                  <Link
                    to="/disputes"
                    search={{ citation: existingCitation.citation_number }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 transition-colors"
                  >
                    <Scale className="size-3.5 text-amber-400" />
                    <span>Adjudication Docket</span>
                  </Link>
                </div>
              </div>
            )}

            <Field label="Offense Classification">
              <input
                value={offense}
                disabled={!!existingCitation}
                onChange={(e) => {
                  setOffense(e.target.value);
                  setAmount(fineFor(e.target.value));
                }}
                className={cn(inputClass, existingCitation && "opacity-60 cursor-not-allowed")}
              />
            </Field>

            <Field label="Statutory Fine (PHP)">
              <input
                type="number"
                min={0}
                step={100}
                value={amount}
                disabled={!!existingCitation}
                onChange={(e) => setAmount(Number(e.target.value))}
                className={cn(inputClass, existingCitation && "opacity-60 cursor-not-allowed")}
              />
            </Field>

            <Field label="Verified Vehicle Model">
              <input
                value={vehicleModel}
                disabled={!!existingCitation}
                onChange={(e) => setVehicleModel(e.target.value)}
                placeholder="e.g. Toyota Vios 2021"
                className={cn(inputClass, existingCitation && "opacity-60 cursor-not-allowed")}
              />
            </Field>

            <Field label="Assign Reviewing Officer">
              <select
                value={officerId}
                disabled={!!existingCitation}
                onChange={(e) => setOfficerId(e.target.value)}
                className={cn(inputClass, existingCitation && "opacity-60 cursor-not-allowed")}
              >
                <option value="">AI Auto-Validator (Default)</option>
                {officers.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.badge_number} · {o.rank} {o.full_name}
                  </option>
                ))}
              </select>
            </Field>

            <div className="rounded-xl border border-border bg-background/50 p-3 mt-1 text-[11px] text-muted-foreground leading-relaxed">
              <p>
                {existingCitation
                  ? "This violation has been officially adjudicated and dispatched into the public \"May Huli Ka\" citizen verifier."
                  : "Confirming this violation will automatically issue an official Notice of Violation (NOV) and synchronize with the public \"May Huli Ka\" citizen verifier."}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between border-t border-border pt-4 mt-2">
          <button
            type="button"
            onClick={dismiss}
            disabled={busy || !!existingCitation}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-colors disabled:opacity-50"
          >
            {review.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <XCircle className="size-3.5" />}
            Dismiss Detection
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-panel-elevated"
            >
              Close
            </button>
            {existingCitation ? (
              <div className="flex items-center gap-2">
                {existingCitation.status === "paid" ? (
                  <a
                    href={`/portal/receipt/${existingCitation.citation_number}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 transition-colors"
                  >
                    <Receipt className="size-3.5" />
                    <span>View e-OR Receipt</span>
                    <ExternalLink className="size-3 text-white/80" />
                  </a>
                ) : (
                  <a
                    href={`/portal/pay/${existingCitation.citation_number}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary hover:bg-primary/90 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-primary/25 transition-colors"
                  >
                    <CreditCard className="size-3.5" />
                    <span>Open Payment Portal</span>
                    <ExternalLink className="size-3 text-white/80" />
                  </a>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={confirmAndIssue}
                disabled={busy || amount <= 0}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 transition-colors disabled:opacity-50"
              >
                {issue.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="size-3.5" />
                )}
                Confirm & Issue Citation ({formatPeso(amount)})
              </button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
        {label}
      </span>
      {children}
    </label>
  );
}
