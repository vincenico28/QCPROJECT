import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  LayoutDashboard,
  FileSignature,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Car,
  Receipt,
  Sparkles,
} from "lucide-react";
import { useCreateCitation, formatPeso } from "@/lib/data/traffic";
import { useAuth } from "@/hooks/use-auth";
import { fineFor } from "@/lib/data/review";

export const Route = createFileRoute("/officer/issue")({
  head: () => ({
    meta: [{ title: "Issue Digital Citation · Culiat Traffic Ops" }],
  }),
  component: IssuePage,
});

const OFFENSES = [
  "Illegal Parking",
  "Red Light",
  "Counterflow",
  "Yellow Box Infraction",
  "Bus Lane Violation",
  "No Helmet",
  "Overspeeding",
  "Obstruction",
  "No Entry Zone",
  "Number Coding",
];

function IssuePage() {
  const { user } = useAuth();
  const createCitation = useCreateCitation();

  const [plate, setPlate] = useState("");
  const [model, setModel] = useState("");
  const [offense, setOffense] = useState(OFFENSES[0]);
  const [amount, setAmount] = useState(fineFor(OFFENSES[0]));
  const [evidenceAttached, setEvidenceAttached] = useState(false);
  const [lastIssuedNumber, setLastIssuedNumber] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate) return;

    createCitation.mutate(
      {
        violation_id: null,
        plate_number: plate,
        vehicle_model: model || null,
        offense,
        amount,
        officer_name: user?.email ?? "Enforcement Officer",
      },
      {
        onSuccess: (data) => {
          toast.success(`Citation #${data.citation_number} issued for ${plate}`);
          setLastIssuedNumber(data.citation_number);
          setPlate("");
          setModel("");
          setEvidenceAttached(false);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  return (
    <div className="flex flex-col p-4 pb-20 max-w-xl mx-auto w-full min-h-screen bg-background border-x border-border">
      {/* Back Navigation Bar */}
      <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
        <Link
          to="/officer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-panel-elevated transition-colors"
        >
          <ArrowLeft className="size-3.5 text-primary" />
          Terminal
        </Link>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-panel-elevated transition-colors"
        >
          <LayoutDashboard className="size-3.5 text-subtle" />
          Command Center
        </Link>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <div className="grid size-9 place-items-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
          <FileSignature className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Issue Digital Citation (OVR)
          </h2>
          <p className="text-xs text-muted-foreground">Officer On-Site Traffic Violation Ticket</p>
        </div>
      </div>

      {lastIssuedNumber && (
        <div className="mb-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="size-5 text-emerald-400" />
            <div>
              <p className="font-bold text-foreground text-xs">Citation #{lastIssuedNumber} Issued</p>
              <p className="text-[10px] text-muted-foreground">Logged to QC Central LGU Ledger</p>
            </div>
          </div>
          <button
            onClick={() => setLastIssuedNumber(null)}
            className="text-[11px] font-bold text-emerald-400 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="panel rounded-3xl border border-border bg-panel p-5 sm:p-6 shadow-xl flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-subtle font-mono-tab">
            Vehicle License Plate *
          </label>
          <input
            type="text"
            required
            value={plate}
            onChange={(e) => setPlate(e.target.value.toUpperCase())}
            placeholder="e.g. NDB 8921"
            className="rounded-xl border border-border bg-panel-elevated px-3.5 py-2.5 text-sm font-mono-tab uppercase text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-subtle font-mono-tab">
            Vehicle Model (Optional)
          </label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="e.g. Toyota Vios Silver"
            className="rounded-xl border border-border bg-panel-elevated px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-subtle font-mono-tab">
            Violation Classification *
          </label>
          <select
            value={offense}
            onChange={(e) => {
              const val = e.target.value;
              setOffense(val);
              setAmount(fineFor(val));
            }}
            className="rounded-xl border border-border bg-panel-elevated px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            {OFFENSES.map((o) => (
              <option key={o} value={o}>
                {o} (₱{fineFor(o).toLocaleString()})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-subtle font-mono-tab">
            Assessed Penalty Amount (PHP) *
          </label>
          <input
            type="number"
            required
            min={500}
            step={100}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="rounded-xl border border-border bg-panel-elevated px-3.5 py-2.5 text-sm font-mono-tab font-bold text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        {/* Evidence Photo Attachment */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-panel-elevated/60 p-3">
          <div className="flex items-center gap-2 text-xs">
            <Camera className="size-4 text-primary" />
            <span className="text-muted-foreground">
              {evidenceAttached ? "Photo evidence attached (1 frame)" : "Attach camera evidence"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setEvidenceAttached((prev) => !prev);
              toast.success(
                !evidenceAttached ? "Body camera evidence frame attached" : "Evidence cleared"
              );
            }}
            className="rounded-lg border border-border bg-panel px-2.5 py-1 text-[11px] font-bold text-foreground hover:bg-panel-elevated transition-colors"
          >
            {evidenceAttached ? "Remove" : "Attach"}
          </button>
        </div>

        <button
          type="submit"
          disabled={createCitation.isPending || !plate}
          className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-xs uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          {createCitation.isPending && <Loader2 className="size-4 animate-spin" />}
          Issue Digital Citation ({formatPeso(amount).replace("PHP", "₱")})
        </button>
      </form>
    </div>
  );
}
