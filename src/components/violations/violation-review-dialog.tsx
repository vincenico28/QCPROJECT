import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck, XCircle, Camera, MapPin } from "lucide-react";
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
  const [vehicleModel, setVehicleModel] = useState("");

  const { data: officers = [] } = useOfficers();
  const issue = useIssueCitation();
  const review = useReviewViolation();

  useEffect(() => {
    if (!violation) return;
    setOffense(violation.violation_type);
    setAmount(fineFor(violation.violation_type));
    setOfficerId("");
    setVehicleModel("");
  }, [violation]);

  if (!violation) return null;
  const v = violation;
  const conf = Number(v.confidence);

  async function confirmAndIssue() {
    const officer = officers.find((o) => o.id === officerId) ?? null;
    try {
      const row = await issue.mutateAsync({
        violation: v,
        offense: offense.trim() || v.violation_type,
        amount,
        officerName: officer ? `${officer.rank} ${officer.full_name}` : null,
        vehicleModel: vehicleModel.trim() || null,
      });
      toast.success(`Citation ${row.citation_number} issued`, {
        description: `${v.plate_number} · ${formatPeso(row.amount)}`,
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
      toast.success(`Detection dismissed`, { description: v.plate_number });
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
      <DialogContent className="max-w-2xl border-border bg-panel">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <ShieldCheck className="size-4 text-primary" />
            Review detection · {v.plate_number}
          </DialogTitle>
          <DialogDescription className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
            {v.ai_detected ? "AI detection" : "Manual report"} · {timeAgo(v.detected_at)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-3">
            <div className="overflow-hidden rounded-xl border border-border bg-background">
              {v.evidence_url ? (
                <img
                  src={v.evidence_url}
                  alt={`Evidence capture for ${v.plate_number} — ${v.violation_type}`}
                  className="h-44 w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="grid h-44 place-items-center text-xs text-subtle">
                  No evidence frame
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5 text-subtle" /> {v.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Camera className="size-3.5 text-subtle" /> {v.camera_code ?? "No node"}
              </span>
              <span className="font-mono-tab">
                AI confidence:{" "}
                <span
                  className={cn(
                    "font-bold",
                    conf >= 90 ? "text-success" : conf >= 80 ? "text-primary" : "text-warning",
                  )}
                >
                  {conf.toFixed(1)}%
                </span>
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Field label="Offense">
              <input
                value={offense}
                onChange={(e) => {
                  setOffense(e.target.value);
                  setAmount(fineFor(e.target.value));
                }}
                className={inputClass}
              />
            </Field>
            <Field label="Fine amount (PHP)">
              <input
                type="number"
                min={0}
                step={100}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className={inputClass}
              />
            </Field>
            <Field label="Issuing officer">
              <select
                value={officerId}
                onChange={(e) => setOfficerId(e.target.value)}
                className={inputClass}
              >
                <option value="">System-issued (no officer)</option>
                {officers.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.badge_number} · {o.rank} {o.full_name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Vehicle model (optional)">
              <input
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                placeholder="e.g. Toyota Vios 2019"
                className={inputClass}
              />
            </Field>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <button
            type="button"
            onClick={dismiss}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-danger disabled:opacity-50"
          >
            {review.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <XCircle className="size-4" />
            )}
            Dismiss detection
          </button>
          <button
            type="button"
            onClick={confirmAndIssue}
            disabled={busy || amount <= 0}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {issue.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ShieldCheck className="size-4" />
            )}
            Confirm & issue citation
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
        {label}
      </span>
      {children}
    </label>
  );
}
