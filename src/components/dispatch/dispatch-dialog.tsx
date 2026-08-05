import { useState } from "react";
import { toast } from "sonner";
import { Radio, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useOfficers, useViolations } from "@/lib/data/traffic";
import { useCreateDispatch, type DispatchPriority } from "@/lib/data/dispatch";
import { cn } from "@/lib/utils";

const PRIORITIES: DispatchPriority[] = ["low", "medium", "high", "critical"];

export function DispatchDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [officerId, setOfficerId] = useState("");
  const [location, setLocation] = useState("");
  const [violationId, setViolationId] = useState("");
  const [priority, setPriority] = useState<DispatchPriority>("medium");
  const [instructions, setInstructions] = useState("");

  const { data: officers = [] } = useOfficers();
  const { data: violations = [] } = useViolations(15);
  const create = useCreateDispatch();

  const available = officers.filter((o) => o.status !== "off_duty");

  function reset() {
    setOfficerId("");
    setLocation("");
    setViolationId("");
    setPriority("medium");
    setInstructions("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const officer = officers.find((o) => o.id === officerId) ?? null;
    if (!location.trim()) {
      toast.error("Location is required");
      return;
    }
    try {
      const row = await create.mutateAsync({
        officer_id: officer?.id ?? null,
        officer_name: officer?.full_name ?? null,
        badge_number: officer?.badge_number ?? null,
        location: location.trim(),
        priority,
        instructions: instructions.trim() || null,
        violation_id: violationId || null,
      });
      toast.success(`Dispatch ${row.reference} sent`, {
        description: officer
          ? `${officer.rank} ${officer.full_name} · ${location}`
          : `Unassigned · ${location}`,
      });
      reset();
      setOpen(false);
    } catch (err) {
      toast.error("Dispatch failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg border-border bg-panel">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Radio className="size-4 text-primary" />
            Dispatch Officer
          </DialogTitle>
          <DialogDescription className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
            QC LGU · Field assignment order
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Officer">
            <select
              value={officerId}
              onChange={(e) => setOfficerId(e.target.value)}
              className={inputClass}
            >
              <option value="">Unassigned · nearest unit</option>
              {available.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.badge_number} · {o.rank} {o.full_name} ({o.district})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Location">
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Commonwealth Ave cor. Tandang Sora"
              className={inputClass}
            />
          </Field>

          <Field label="Link violation (optional)">
            <select
              value={violationId}
              onChange={(e) => {
                setViolationId(e.target.value);
                const v = violations.find((x) => x.id === e.target.value);
                if (v && !location) setLocation(v.location);
              }}
              className={inputClass}
            >
              <option value="">No linked detection</option>
              {violations.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate_number} · {v.violation_type} · {v.location}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Priority">
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    "flex-1 rounded-lg border px-2 py-2 font-mono-tab text-[10px] font-bold uppercase tracking-widest transition-colors",
                    priority === p
                      ? "border-primary/50 bg-primary/15 text-primary"
                      : "border-border text-subtle hover:text-foreground",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Instructions">
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              placeholder="Situation brief, required equipment, contact…"
              className={cn(inputClass, "resize-none")}
            />
          </Field>

          <DialogFooter>
            <button
              type="submit"
              disabled={create.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {create.isPending && <Loader2 className="size-4 animate-spin" />}
              Send dispatch
            </button>
          </DialogFooter>
        </form>
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
