import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Search, ShieldCheck, FileText } from "lucide-react";
import { lookupCitation, type PublicCitation } from "@/lib/citation-lookup.functions";
import { formatPeso } from "@/lib/data/traffic";
import { cn } from "@/lib/utils";
import { FileDisputeDialog } from "@/components/citations/file-dispute-dialog";

export const Route = createFileRoute("/lookup")({
  head: () => ({
    meta: [
      { title: "Citation Lookup · Culiat Traffic Ops" },
      {
        name: "description",
        content:
          "Check the status and amount due of a Barangay Culiat, Quezon City traffic citation using your plate number and citation reference.",
      },
      { property: "og:title", content: "Citation Lookup · Culiat Traffic Ops" },
      {
        property: "og:description",
        content:
          "Motorist self-service portal to verify a Barangay Culiat, Quezon City traffic citation, its offense, amount and payment status.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LookupPage,
});

function LookupPage() {
  const [plate, setPlate] = useState("");
  const [reference, setReference] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [result, setResult] = useState<PublicCitation | null>(null);
  const run = useServerFn(lookupCitation);

  const search = useMutation({
    mutationFn: (input: { plate: string; reference: string }) => run({ data: input }),
    onSuccess: (row) => {
      setResult(row);
      setNotFound(!row);
    },
  });

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs text-subtle transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back to home
          </Link>
          <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
            QC LGU · Public Service
          </span>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Citation Lookup</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Enter your plate number and the citation reference printed on your ticket or SMS notice
            to view the offense, amount due and payment status.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setNotFound(false);
            setResult(null);
            search.mutate({ plate: plate.trim(), reference: reference.trim() });
          }}
          className="panel grid gap-4 rounded-2xl p-6 sm:grid-cols-2"
        >
          <label className="flex flex-col gap-1.5">
            <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
              Plate number
            </span>
            <input
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              placeholder="ABC1234"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
              Citation reference
            </span>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value.toUpperCase())}
              placeholder="QC-2026-000123"
              className={inputClass}
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={search.isPending || plate.trim().length < 3 || reference.trim().length < 4}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {search.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              Look up citation
            </button>
          </div>
        </form>

        {search.isError && (
          <p className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
            Lookup failed. Please check your details and try again.
          </p>
        )}

        {notFound && (
          <p className="rounded-xl border border-border bg-panel p-6 text-sm text-muted-foreground">
            No citation matches that plate and reference. Double-check the reference code, or visit
            the QC LGU enforcement office for assistance.
          </p>
        )}

        {result && <CitationCard citation={result} />}

        <p className="flex items-start gap-2 text-xs text-subtle">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
          For your privacy, records are only shown when the plate number and the exact citation
          reference match. Enforcement data is otherwise restricted to authorized QC LGU personnel.
        </p>
      </main>
    </div>
  );
}

function CitationCard({ citation }: { citation: PublicCitation }) {
  const tone =
    citation.status === "paid"
      ? "border-success/30 bg-success/10 text-success"
      : citation.status === "contested"
        ? "border-warning/30 bg-warning/10 text-warning"
        : "border-danger/30 bg-danger/10 text-danger";

  return (
    <article className="panel flex flex-col gap-5 rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-primary" />
          <span className="font-mono-tab text-sm font-bold text-foreground">
            {citation.citation_number}
          </span>
        </div>
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 font-mono-tab text-[10px] font-bold uppercase tracking-widest",
            tone,
          )}
        >
          {citation.status}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-5 sm:grid-cols-4">
        <Detail label="Plate" value={citation.plate_number} />
        <Detail label="Vehicle" value={citation.vehicle_model ?? "—"} />
        <Detail
          label="Issued"
          value={new Date(citation.issued_at).toLocaleDateString("en-PH", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        />
        <Detail label="Amount" value={formatPeso(citation.amount)} />
      </dl>

      <div className="rounded-lg border border-border bg-background/40 p-4">
        <p className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
          Offense
        </p>
        <p className="mt-1 text-sm text-foreground">{citation.offense}</p>
      </div>

      {citation.status !== "paid" && (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground">
            Settle this citation at any QC LGU treasury window or authorized payment center. Bring a
            valid ID and this reference number.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              to="/portal/pay/$citationId"
              params={{ citationId: citation.citation_number }}
              className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90"
            >
              Pay Now Online
            </Link>
            {citation.status === "pending" && (
              <FileDisputeDialog citationId={citation.id} citationNumber={citation.citation_number} />
            )}
          </div>
        </div>
      )}
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
        {label}
      </dt>
      <dd className="mt-1 font-mono-tab text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 font-mono-tab text-sm text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20";
