import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  Loader2,
  Search,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Printer,
  Camera,
  MapPin,
  Clock,
  ExternalLink,
  ChevronRight,
  User,
  AlertTriangle,
  Eye,
  CreditCard,
  Scale,
} from "lucide-react";
import { lookupCitation, type PublicCitation } from "@/lib/citation-lookup.functions";
import { formatPeso } from "@/lib/data/traffic";
import { cn } from "@/lib/utils";
import { FileDisputeDialog } from "@/components/citations/file-dispute-dialog";

export const Route = createFileRoute("/lookup")({
  head: () => ({
    meta: [
      { title: "Notice of Violation (NOV) & Citation Lookup · Culiat Traffic Ops" },
      {
        name: "description",
        content:
          "Check the status, amount due, and photographic CCTV evidence of a Barangay Culiat, Quezon City traffic citation using your plate number and citation reference.",
      },
      { property: "og:title", content: "Citation Lookup · Culiat Traffic Ops" },
      {
        property: "og:description",
        content:
          "Official motorist self-service portal to verify Quezon City traffic citations, inspect camera evidence, settle online, or file a formal contest.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LookupPage,
});

const SAMPLE_LOOKUPS = [
  {
    label: "NDB-8921 · Red Light (Unpaid)",
    plate: "NDB-8921",
    ref: "NOV-2026-QC-00129",
    status: "unpaid",
  },
  {
    label: "ABC 1234 · No Helmet (Pending)",
    plate: "ABC 1234",
    ref: "QC-88218",
    status: "pending",
  },
  {
    label: "WHI 9981 · Speeding (Contested)",
    plate: "WHI 9981",
    ref: "QC-88217",
    status: "contested",
  },
  {
    label: "NDG 4412 · Obstruction (Settled)",
    plate: "NDG 4412",
    ref: "QC-88219",
    status: "paid",
  },
];

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

  const handleTestPill = (p: string, r: string) => {
    setPlate(p);
    setReference(r);
    setNotFound(false);
    setResult(null);
    search.mutate({ plate: p.trim(), reference: r.trim() });
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs text-subtle transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
              QC LGU · Public Service Gateway
            </span>
            <Link
              to="/citizen"
              className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
            >
              <User className="size-3" />
              Citizen Portal
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10">
        <div>
          <div className="flex items-center gap-2 text-primary font-mono-tab text-xs font-semibold uppercase tracking-wider mb-2">
            <Search className="size-4" /> Official Motorist Verification
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Notice of Violation (NOV) Lookup
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground leading-relaxed">
            Enter your vehicle plate number and the citation reference printed on your ticket or SMS notice
            to view the offense, CCTV photo evidence, settlement amount, and payment status.
          </p>
        </div>

        {/* Quick Sample Selector */}
        <div className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-panel/50 p-4">
          <div className="flex items-center justify-between text-xs font-mono-tab text-subtle">
            <span className="font-semibold uppercase tracking-wider">Quick Sample Test Cases:</span>
            <span className="text-[11px]">Click any case to test lookup instantly</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_LOOKUPS.map((sample) => (
              <button
                key={sample.ref}
                type="button"
                onClick={() => handleTestPill(sample.plate, sample.ref)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel px-3 py-1.5 text-xs text-foreground hover:border-primary/50 hover:bg-panel-elevated transition-colors font-medium"
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    sample.status === "paid"
                      ? "bg-emerald-400"
                      : sample.status === "contested"
                      ? "bg-yellow-400"
                      : "bg-red-400"
                  )}
                />
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setNotFound(false);
            setResult(null);
            search.mutate({ plate: plate.trim(), reference: reference.trim() });
          }}
          className="panel grid gap-4 rounded-3xl border border-border p-6 shadow-xl sm:grid-cols-2"
        >
          <label className="flex flex-col gap-1.5">
            <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
              Plate Number
            </span>
            <input
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              placeholder="e.g. NDB-8921 or ABC 1234"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
              Citation Reference / NOV Number
            </span>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value.toUpperCase())}
              placeholder="e.g. NOV-2026-QC-00129 or QC-88218"
              className={inputClass}
            />
          </label>
          <div className="sm:col-span-2 flex items-center justify-between pt-2">
            <button
              type="submit"
              disabled={search.isPending || plate.trim().length < 3 || reference.trim().length < 4}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {search.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              Verify Notice & Offense
            </button>

            {(plate || reference) && (
              <button
                type="button"
                onClick={() => {
                  setPlate("");
                  setReference("");
                  setResult(null);
                  setNotFound(false);
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear fields
              </button>
            )}
          </div>
        </form>

        {search.isError && (
          <div className="rounded-2xl border border-danger/30 bg-danger/10 p-5 text-sm text-danger flex items-center gap-3">
            <AlertTriangle className="size-5 shrink-0 text-danger" />
            <p>Verification lookup failed. Please double-check the plate and reference format and try again.</p>
          </div>
        )}

        {notFound && (
          <div className="rounded-2xl border border-border bg-panel p-6 text-sm text-muted-foreground text-center">
            <p className="font-semibold text-white">No citation record found.</p>
            <p className="mt-1 text-xs text-subtle">
              No active or historical violation matches plate <strong className="text-white font-mono-tab">{plate}</strong> and reference <strong className="text-white font-mono-tab">{reference}</strong>.
            </p>
            <p className="mt-3 text-xs text-subtle">
              Please double check the reference code, or visit the QC LGU Department of Public Order and Safety (DPOS) window.
            </p>
          </div>
        )}

        {result && <CitationCard citation={result} />}

        {/* Informational Assurance Banner */}
        <div className="rounded-2xl border border-border/60 bg-panel/40 p-5 flex items-start gap-3">
          <ShieldCheck className="size-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-subtle leading-relaxed">
            <p className="font-semibold text-foreground">Official LGU Privacy & Security Verification</p>
            <p className="mt-0.5">
              Notice of Violation records are safeguarded under Republic Act 10173 (Data Privacy Act of 2012). Details are only rendered when the vehicle plate and exact issued reference match. All electronic settlements immediately issue an official electronic receipt and sync directly with the LTO Land Transportation Management System (LTMS).
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function CitationCard({ citation }: { citation: PublicCitation }) {
  const [showEvidence, setShowEvidence] = useState(false);

  const isPaid = citation.status === "paid";
  const isContested = citation.status === "contested";

  const tone = isPaid
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
    : isContested
    ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
    : "border-red-500/30 bg-red-500/10 text-red-400";

  return (
    <article className="panel flex flex-col gap-6 rounded-3xl border border-border p-6 sm:p-8 shadow-2xl bg-panel">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            <span className="font-mono-tab text-xs uppercase tracking-widest text-subtle">
              Official QC Citation
            </span>
          </div>
          <h2 className="mt-1 font-mono-tab text-2xl font-black tracking-tight text-foreground">
            {citation.citation_number}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full border px-3 py-1 font-mono-tab text-xs font-bold uppercase tracking-wider",
              tone
            )}
          >
            {citation.status}
          </span>
        </div>
      </div>

      {/* Detail Grid */}
      <dl className="grid grid-cols-2 gap-5 sm:grid-cols-4">
        <Detail label="Plate Number" value={citation.plate_number} />
        <Detail label="Vehicle Model" value={citation.vehicle_model ?? "Registered Motor Vehicle"} />
        <Detail
          label="Date of Detection"
          value={new Date(citation.issued_at).toLocaleDateString("en-PH", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        />
        <div>
          <dt className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
            Amount Due
          </dt>
          <dd className="mt-1 font-mono-tab text-lg font-black text-foreground">
            {formatPeso(citation.amount).replace("PHP", "₱")}
          </dd>
        </div>
      </dl>

      {/* Offense & Location Detail */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-background/50 p-4">
        <div>
          <div className="flex items-center justify-between">
            <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
              Charged Offense
            </span>
            {citation.ordinanceCode && (
              <span className="font-mono-tab text-[10px] text-primary">
                {citation.ordinanceCode}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm font-semibold text-foreground">{citation.offense}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border/40 text-xs">
          <div className="flex items-center gap-2 text-subtle">
            <MapPin className="size-3.5 text-primary shrink-0" />
            <span className="truncate">{citation.location || "Commonwealth Ave Corridor"}</span>
          </div>
          <div className="flex items-center gap-2 text-subtle">
            <Clock className="size-3.5 text-orange-400 shrink-0" />
            <span>
              {isPaid
                ? "Cleared in LTO LTMS"
                : citation.dueDate
                ? `Due: ${new Date(citation.dueDate).toLocaleDateString("en-PH")}`
                : "7-Day Surcharge Grace Period"}
            </span>
          </div>
        </div>
      </div>

      {/* Photographic Evidence Accordion */}
      <div className="rounded-2xl border border-border/70 bg-panel-elevated overflow-hidden">
        <button
          type="button"
          onClick={() => setShowEvidence(!showEvidence)}
          className="w-full flex items-center justify-between p-4 text-xs font-semibold text-foreground hover:bg-white/[0.02] transition-colors"
        >
          <span className="flex items-center gap-2">
            <Camera className="size-4 text-primary" />
            {showEvidence ? "Hide Camera Telemetry & Evidence" : "Inspect Photographic CCTV Evidence"}
          </span>
          <span className="font-mono-tab text-[10px] text-primary">
            {showEvidence ? "COLLAPSE ▲" : "VIEW SNAPSHOT ▼"}
          </span>
        </button>

        {showEvidence && (
          <div className="p-4 pt-0 border-t border-border/50">
            <div className="relative overflow-hidden rounded-xl border border-border bg-black mt-3">
              <img
                src={citation.evidence_url || "/assets/violation-1.jpg"}
                alt="Violation photographic evidence"
                className="w-full max-h-72 object-cover"
              />
              <div className="absolute top-2 left-2 rounded-lg bg-black/80 px-2.5 py-1 font-mono-tab text-[10px] text-white border border-white/10 backdrop-blur-sm">
                ANPR MATCH: <strong className="text-emerald-400">{citation.plate_number}</strong> (99.4% Optical Conf.)
              </div>
              <div className="absolute bottom-2 right-2 rounded-lg bg-black/80 px-2.5 py-1 font-mono-tab text-[10px] text-muted-foreground border border-white/10 backdrop-blur-sm">
                {citation.location || "QC Sentinel Node #04"} · T+0.0s Event Record
              </div>
            </div>
            <p className="mt-2 text-[11px] text-subtle text-center">
              Official timestamped frame recorded by Quezon City High-Definition Traffic Sentinel Camera.
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!isPaid ? (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Payment can be settled online via digital channels (GCash, Maya, Landbank, Credit Card) or at any QC City Hall Treasury window. Uncontested unpaid citations may incur LTO LTMS registration alarms after 15 days.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              to="/portal/pay/$citationId"
              params={{ citationId: citation.citation_number }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90"
            >
              <CreditCard className="size-4" />
              Settle Online Now (₱{citation.amount.toLocaleString()})
            </Link>

            {citation.status === "pending" || citation.status === "unpaid" ? (
              <FileDisputeDialog citationId={citation.id} citationNumber={citation.citation_number} />
            ) : (
              <div className="flex items-center justify-center rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-xs font-semibold text-yellow-400">
                <Scale className="size-4 mr-2" /> Contest Under Adjudication
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="size-4" /> Citation settled. LTO LTMS clearance certificate generated.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              to="/portal/receipt/$citationId"
              params={{ citationId: citation.citation_number }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors shadow-sm"
            >
              <Printer className="size-4" /> View Official Receipt
            </Link>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-panel-elevated px-4 py-3 text-sm font-semibold text-foreground hover:bg-white/5 transition-colors"
            >
              <Printer className="size-4" /> Print Notice
            </button>
          </div>
        </div>
      )}

      {/* Citizen Portal Banner */}
      <div className="mt-2 pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="size-4 text-primary" />
          <span>Registered vehicle owner? Manage your entire garage fleet and nominate actual drivers.</span>
        </div>
        <Link
          to="/citizen"
          className="inline-flex items-center gap-1 font-semibold text-primary hover:underline shrink-0"
        >
          Open Citizen Portal <ChevronRight className="size-3" />
        </Link>
      </div>
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
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 font-mono-tab text-sm text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20";

