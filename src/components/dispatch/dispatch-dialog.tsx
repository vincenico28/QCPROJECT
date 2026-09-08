import { useState } from "react";
import { toast } from "sonner";
import {
  Radio,
  Loader2,
  Zap,
  MapPin,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Car,
  Ambulance,
  UserCheck,
  Send,
  Sparkles,
} from "lucide-react";
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

const TACTICAL_PRESETS = [
  {
    code: "CODE 1",
    label: "Vehicle Stall & Lane Obstruction",
    priority: "high" as DispatchPriority,
    location: "Commonwealth Ave cor. Tandang Sora",
    instructions:
      "Clear stalled vehicle obstructing primary through-lane. Deploy reflective hazard markers and coordinate with QC LGU towing unit.",
  },
  {
    code: "CODE 2",
    label: "Intersection Collision & DRRMC Escort",
    priority: "critical" as DispatchPriority,
    location: "Commonwealth Ave Median Corridor",
    instructions:
      "Multi-vehicle impact reported. Clear right-of-way for QC DRRMC Ambulance inbound to East Avenue Medical Center. Secure scene.",
  },
  {
    code: "CODE 3",
    label: "Peak Rush Manual Signal Override",
    priority: "medium" as DispatchPriority,
    location: "Visayas Ave cor. Central Ave",
    instructions:
      "Perform manual hand gesture traffic control to flush outbound bottleneck. Automated signal cycle overridden until congestion clears.",
  },
  {
    code: "CODE 4",
    label: "Illegal Busway / Counterflow Intercept",
    priority: "high" as DispatchPriority,
    location: "Commonwealth Exclusive Bus Rapid Lane",
    instructions:
      "Apprehend unauthorized private vehicles and motorcycles illegally entering the exclusive busway corridor. Issue electronic citations.",
  },
  {
    code: "CODE 5",
    label: "Flash Flood / Gutter Water Diversion",
    priority: "critical" as DispatchPriority,
    location: "Katipunan Flyover Low-Lying Underpass",
    instructions:
      "Heavy rainfall causing localized gutter-deep ponding. Divert light vehicles to elevated overpass and erect high-water barrier beacons.",
  },
];

const CORRIDOR_PRESETS = [
  "Commonwealth Ave cor. Tandang Sora",
  "Visayas Ave cor. Central Ave",
  "Katipunan Flyover Northbound",
  "Quirino Highway Inbound",
  "Philcoa / QC Circle Bypass",
];

export function DispatchDialog({
  trigger,
  defaultLocation = "",
  defaultPriority = "medium",
  defaultInstructions = "",
}: {
  trigger: React.ReactNode;
  defaultLocation?: string;
  defaultPriority?: DispatchPriority;
  defaultInstructions?: string;
}) {
  const [open, setOpen] = useState(false);
  const [officerId, setOfficerId] = useState("");
  const [location, setLocation] = useState(defaultLocation);
  const [violationId, setViolationId] = useState("");
  const [priority, setPriority] = useState<DispatchPriority>(defaultPriority);
  const [instructions, setInstructions] = useState(defaultInstructions);

  const { data: officers = [] } = useOfficers();
  const { data: violations = [] } = useViolations(15);
  const create = useCreateDispatch();

  const available = officers.filter((o) => o.status !== "off_duty");

  function reset() {
    setOfficerId("");
    setLocation(defaultLocation);
    setViolationId("");
    setPriority(defaultPriority);
    setInstructions(defaultInstructions);
  }

  function applyPreset(preset: (typeof TACTICAL_PRESETS)[0]) {
    setPriority(preset.priority);
    setLocation(preset.location);
    setInstructions(preset.instructions);
    toast.info(`Tactical Preset Applied: ${preset.code}`, {
      description: preset.label,
    });
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
      toast.success(`Dispatch Order ${row.reference} Broadcasted`, {
        description: officer
          ? `Assigned: ${officer.rank} ${officer.full_name} (${officer.badge_number}) · ${location}`
          : `Broadcasted to Nearest Patrol Grid · ${location}`,
      });
      reset();
      setOpen(false);
    } catch (err) {
      toast.error("Dispatch order failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  }

  const estimatedEta =
    priority === "critical"
      ? "2–4 mins (Code Red Emergency)"
      : priority === "high"
      ? "4–7 mins (Rapid Intercept)"
      : priority === "medium"
      ? "8–12 mins (Standard Patrol)"
      : "15–20 mins (Routine Patrol)";

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          if (defaultLocation) setLocation(defaultLocation);
          if (defaultPriority) setPriority(defaultPriority);
          if (defaultInstructions) setInstructions(defaultInstructions);
        } else {
          reset();
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto border-border bg-panel p-6 sm:p-7 shadow-2xl rounded-3xl animate-in fade-in zoom-in-95">
        <DialogHeader className="border-b border-border pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-foreground text-base sm:text-lg font-bold">
              <Radio className="size-5 text-primary animate-pulse" />
              Dispatch Patrol Officer
            </DialogTitle>
            <span className="rounded bg-primary/20 px-2 py-0.5 font-mono-tab text-[10px] font-bold text-primary border border-primary/30">
              QC LGU TOC
            </span>
          </div>
          <DialogDescription className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
            Barangay Culiat · Tactical Command Directive
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="mt-4 flex flex-col gap-4 text-xs">
          {/* Tactical 1-Click Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono-tab text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1">
                <Zap className="size-3" /> Quick Incident Presets
              </span>
              <span className="text-[10px] text-muted-foreground">1-Click Auto-Fill</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TACTICAL_PRESETS.map((p) => (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="rounded-lg border border-border/80 bg-background/60 px-2.5 py-1 text-[11px] font-medium text-white/80 hover:bg-panel-elevated hover:text-white hover:border-primary/40 transition-colors flex items-center gap-1.5"
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      p.priority === "critical"
                        ? "bg-red-400"
                        : p.priority === "high"
                        ? "bg-amber-400"
                        : "bg-blue-400"
                    )}
                  />
                  <span className="font-mono-tab font-bold text-white text-[10px]">{p.code}:</span>
                  <span>{p.label.split("&")[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Officer Assignment */}
          <Field label="Assign Patrol Officer">
            <select
              value={officerId}
              onChange={(e) => setOfficerId(e.target.value)}
              className={inputClass}
            >
              <option value="">Unassigned · Broadcast to Nearest Available Unit</option>
              {available.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.badge_number} · {o.rank} {o.full_name} ({o.district} · {o.status.toUpperCase()})
                </option>
              ))}
            </select>
          </Field>

          {/* Location with Quick Corridor Pills */}
          <Field label="Incident Location Corridor">
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Commonwealth Ave cor. Tandang Sora"
              className={inputClass}
            />
            <div className="flex flex-wrap gap-1 mt-1.5">
              {CORRIDOR_PRESETS.map((corridor) => (
                <button
                  key={corridor}
                  type="button"
                  onClick={() => setLocation(corridor)}
                  className="rounded bg-black/40 border border-white/5 px-2 py-0.5 text-[10px] font-mono-tab text-muted-foreground hover:text-white hover:border-white/20 transition-colors"
                >
                  {corridor.split("cor.")[0].trim()}
                </button>
              ))}
            </div>
          </Field>

          {/* Link Violation */}
          <Field label="Link ANPR Violation (Optional)">
            <select
              value={violationId}
              onChange={(e) => {
                setViolationId(e.target.value);
                const v = violations.find((x) => x.id === e.target.value);
                if (v && !location) setLocation(v.location);
              }}
              className={inputClass}
            >
              <option value="">No linked detection (Direct Manual Dispatch)</option>
              {violations.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate_number} · {v.violation_type} · {v.location}
                </option>
              ))}
            </select>
          </Field>

          {/* Priority Matrix */}
          <Field label="Priority Level & Tactical SLA">
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    "flex-1 rounded-xl border py-2.5 font-mono-tab text-xs font-bold uppercase tracking-wider transition-all",
                    priority === p
                      ? p === "critical"
                        ? "border-red-500 bg-red-950/40 text-red-300 ring-1 ring-red-500"
                        : p === "high"
                        ? "border-amber-500 bg-amber-950/40 text-amber-300 ring-1 ring-amber-500"
                        : "border-primary bg-primary/20 text-primary ring-1 ring-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] font-mono-tab text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="size-3 text-emerald-400" />
                Response SLA:
              </span>
              <span className="font-bold text-white">{estimatedEta}</span>
            </div>
          </Field>

          {/* Tactical Instructions */}
          <Field label="Tactical Directives & Situation Brief">
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              placeholder="Situation brief, special hazards, radio channel, required equipment…"
              className={cn(inputClass, "resize-none font-mono text-xs")}
            />
          </Field>

          <DialogFooter className="border-t border-border pt-3 mt-1">
            <button
              type="submit"
              disabled={create.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:scale-[1.01] disabled:opacity-60 w-full sm:w-auto"
            >
              {create.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
              Transmit Tactical Dispatch Order
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30";

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
