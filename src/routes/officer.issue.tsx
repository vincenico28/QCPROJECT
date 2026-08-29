import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ArrowLeft, LayoutDashboard, FileSignature } from "lucide-react";
import { useCreateCitation } from "@/lib/data/traffic";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/officer/issue")({
  head: () => ({
    meta: [{ title: "Issue Citation · Culiat Traffic Ops" }],
  }),
  component: IssuePage,
});

const OFFENSES = [
  "No Helmet",
  "Illegal Parking",
  "Beating the Red Light",
  "Reckless Driving",
  "Over speeding",
];

function IssuePage() {
  const { user } = useAuth();
  const createCitation = useCreateCitation();
  
  const [plate, setPlate] = useState("");
  const [model, setModel] = useState("");
  const [offense, setOffense] = useState(OFFENSES[0]);
  const [amount, setAmount] = useState(2500);

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
        officer_name: user?.email ?? "Unknown Officer",
      },
      {
        onSuccess: () => {
          toast.success("Citation issued successfully");
          setPlate("");
          setModel("");
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  return (
    <div className="flex flex-col p-4 pb-20 max-w-2xl mx-auto w-full">
      {/* Back Navigation Bar */}
      <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
        <Link
          to="/officer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-panel-elevated transition-colors"
        >
          <ArrowLeft className="size-3.5 text-primary" />
          Back to Terminal
        </Link>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-panel-elevated transition-colors"
        >
          <LayoutDashboard className="size-3.5 text-subtle" />
          Command Center
        </Link>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <div className="grid size-8 place-items-center rounded-lg bg-orange-500/20 text-orange-400">
          <FileSignature className="size-4" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Issue Electronic Citation</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold">Plate Number</label>
          <input
            type="text"
            required
            value={plate}
            onChange={(e) => setPlate(e.target.value.toUpperCase())}
            placeholder="e.g. ABC 1234"
            className="rounded-lg border border-border bg-panel px-3 py-2 uppercase focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold">Vehicle Model (Optional)</label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="e.g. Toyota Vios"
            className="rounded-lg border border-border bg-panel px-3 py-2 focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold">Offense</label>
          <select
            value={offense}
            onChange={(e) => setOffense(e.target.value)}
            className="rounded-lg border border-border bg-panel px-3 py-2 focus:border-primary focus:outline-none"
          >
            {OFFENSES.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold">Penalty Amount (PHP)</label>
          <input
            type="number"
            required
            min={500}
            step={100}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="rounded-lg border border-border bg-panel px-3 py-2 focus:border-primary focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={createCitation.isPending}
          className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-primary py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/20"
        >
          {createCitation.isPending && <Loader2 className="size-4 animate-spin" />}
          Issue Citation
        </button>
      </form>
    </div>
  );
}
