import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useCreateCitation } from "@/lib/data/traffic";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/officer/issue")({
  head: () => ({
    meta: [{ title: "Issue Citation · QC Traffic Ops" }],
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
    <div className="flex flex-col p-4 pb-20">
      <h2 className="mb-4 text-xl font-semibold tracking-tight">Issue Citation</h2>
      
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
