import { useEffect, useState } from "react";
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
import { formatPeso, timeAgo, useOfficers, type Violation } from "@/lib/data/traffic";
import { cn } from "@/lib/utils";

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
  const [vehicleModel, setVehicleModel] = useState("Toyota Vios (Silver)");
  const [zoomEvidence, setZoomEvidence] = useState(false);

  const { data: officers = [] } = useOfficers();
  const issue = useIssueCitation();
  const review = useReviewViolation();

  useEffect(() => {
    if (!violation) return;
    setOffense(violation.violation_type);
    setAmount(fineFor(violation.violation_type));
    setOfficerId("");
    setVehicleModel(
      violation.plate_number.startsWith("N")
        ? "Toyota Vios 1.3E (Silver Metallic)"
        : violation.plate_number.startsWith("A")
        ? "Mitsubishi Mirage G4 (Gray)"
        : "Honda Civic 1.5 RS (White Pearl)"
    );
  }, [violation]);

  if (!violation) return null;
  const v = violation;
  const conf = Number(v.confidence) > 1 ? Number(v.confidence) : Math.round(Number(v.confidence) * 100);

  async function confirmAndIssue() {
    const officer = officers.find((o) => o.id === officerId) ?? null;
    try {
      const row = await issue.mutateAsync({
        violation: v,
        offense: offense.trim() || v.violation_type,
        amount,
        officerName: officer ? `${officer.rank} ${officer.full_name}` : "AI Auto-Validator",
        vehicleModel: vehicleModel.trim() || null,
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
            <div className="relative overflow-hidden rounded-xl border border-border bg-black">
              {v.evidence_url ? (
                <div className="relative group">
                  <img
                    src={v.evidence_url}
                    alt={`Evidence capture for ${v.plate_number}`}
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
                      <span className="font-bold">{conf}% MATCH</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid h-48 place-items-center text-xs text-subtle">
                  <Camera className="size-6 text-subtle mb-1" />
                  No evidence frame available
                </div>
              )}
            </div>

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
            <div className="rounded-xl border border-blue-500/20 bg-blue-950/20 p-3 text-xs">
              <span className="font-mono-tab text-[9px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                <Car className="size-3" /> LTO LTMS Vehicle Match
              </span>
              <p className="text-white font-semibold text-xs mt-1">{vehicleModel}</p>
              <p className="text-[10px] text-white/60">Registered LGU: Quezon City (District 6)</p>
            </div>
          </div>

          {/* Right Column: Citation Form */}
          <div className="flex flex-col gap-3">
            <Field label="Offense Classification">
              <input
                value={offense}
                onChange={(e) => {
                  setOffense(e.target.value);
                  setAmount(fineFor(e.target.value));
                }}
                className={inputClass}
              />
            </Field>

            <Field label="Statutory Fine (PHP)">
              <input
                type="number"
                min={0}
                step={100}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className={inputClass}
              />
            </Field>

            <Field label="Verified Vehicle Model">
              <input
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                placeholder="e.g. Toyota Vios 2021"
                className={inputClass}
              />
            </Field>

            <Field label="Assign Reviewing Officer">
              <select
                value={officerId}
                onChange={(e) => setOfficerId(e.target.value)}
                className={inputClass}
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
                Confirming this violation will automatically issue an official <strong>Notice of Violation (NOV)</strong> and synchronize with the public <em>"May Huli Ka"</em> citizen verifier.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between border-t border-border pt-4 mt-2">
          <button
            type="button"
            onClick={dismiss}
            disabled={busy}
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
              Cancel
            </button>
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
