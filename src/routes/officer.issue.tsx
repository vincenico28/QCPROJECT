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
  Upload,
  Trash2,
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
  const [evidenceUrl, setEvidenceUrl] = useState<string | null>(null);
  const [evidenceFileName, setEvidenceFileName] = useState<string | null>(null);
  const [evidenceSizeKb, setEvidenceSizeKb] = useState<number | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [lastIssuedNumber, setLastIssuedNumber] = useState<string | null>(null);

  const handleEvidenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please attach an image file (PNG, JPG, WebP)");
      return;
    }

    setIsCompressing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1280;
        const maxHeight = 960;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.82);
          const sizeKb = Math.round((compressed.length * 3) / 4 / 1024);
          setEvidenceUrl(compressed);
          setEvidenceFileName(file.name);
          setEvidenceSizeKb(sizeKb);
          setIsCompressing(false);
          toast.success("Officer Camera Frame Attached", {
            description: `${file.name} compressed to ${sizeKb} KB HD frame.`,
          });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

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
        evidence_url: evidenceUrl,
        location: "Quezon City Road Apprehension",
      },
      {
        onSuccess: (data) => {
          toast.success(`Citation #${data.citation_number} issued for ${plate}`);
          setLastIssuedNumber(data.citation_number);
          setPlate("");
          setModel("");
          setEvidenceUrl(null);
          setEvidenceFileName(null);
          setEvidenceSizeKb(null);
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
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-panel-elevated/60 p-3.5">
          <div className="flex items-center justify-between">
            <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle font-bold flex items-center gap-1.5">
              <Camera className="size-3.5 text-primary" /> Body-Cam / CCTV Evidence Attachment
            </span>
            {evidenceUrl && (
              <span className="text-[10px] font-mono-tab text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                1 Frame Attached ({evidenceSizeKb} KB)
              </span>
            )}
          </div>

          {evidenceUrl ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
              <img src={evidenceUrl} alt="Evidence Frame" className="size-full object-cover" />
              <div className="absolute inset-x-2 bottom-2 flex items-center justify-between bg-black/70 backdrop-blur-sm p-2 rounded-lg text-[10px] text-white">
                <span className="truncate max-w-[200px] font-medium text-white/90">{evidenceFileName || "Snapshot Frame"}</span>
                <button
                  type="button"
                  onClick={() => {
                    setEvidenceUrl(null);
                    setEvidenceFileName(null);
                    setEvidenceSizeKb(null);
                    toast.info("Evidence frame removed");
                  }}
                  className="rounded px-2 py-0.5 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors font-semibold flex items-center gap-1"
                >
                  <Trash2 className="size-3" /> Remove
                </button>
              </div>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-panel p-4 text-center hover:border-primary transition-all">
              <Upload className="size-5 text-primary" />
              <span className="text-xs font-semibold text-foreground">
                {isCompressing ? "Processing photo..." : "Attach Photo / Body Camera Snapshot"}
              </span>
              <span className="text-[10px] text-muted-foreground">
                Auto-optimized to HD format & synced to QC central enforcement database.
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleEvidenceUpload}
                disabled={isCompressing}
                className="hidden"
              />
            </label>
          )}
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
