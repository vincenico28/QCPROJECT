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
  Car,
  UserCheck,
  ShieldAlert,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import {
  lookupCitation,
  type PublicCitation,
  type PublicVehicleLookupResult,
} from "@/lib/citation-lookup.functions";
import { formatPeso } from "@/lib/data/traffic";
import { cn } from "@/lib/utils";
import { FileDisputeDialog } from "@/components/citations/file-dispute-dialog";
import { parseEvidenceUrls } from "@/lib/storage";
import { parseCitationOffenses } from "@/lib/data/review";

export const Route = createFileRoute("/lookup")({
  head: () => ({
    meta: [
      { title: "Notice of Violation (NOV) & Citation Lookup · Culiat Traffic Ops" },
      {
        name: "description",
        content:
          "Check the status, amount due, photographic CCTV evidence, and LTO registration clearance of a Quezon City vehicle or citation.",
      },
      { property: "og:title", content: "Citation Lookup · Culiat Traffic Ops" },
      {
        property: "og:description",
        content:
          "Official motorist self-service portal to verify Quezon City traffic citations, inspect camera evidence, settle online, or check LTO renewal clearance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LookupPage,
});

const SAMPLE_LOOKUPS = [
  {
    label: "NBA-1121 · Ford Raptor (Live AI Apprehensions)",
    plate: "NBA-1121",
    ref: "",
    status: "unpaid",
  },
  {
    label: "NDB-8921 · Red Light (Unpaid)",
    plate: "NDB-8921",
    ref: "NOV-2026-QC-00129",
    status: "unpaid",
  },
  {
    label: "CAS 3901 · Fortuner (All Clear / Cleared LTO)",
    plate: "CAS 3901",
    ref: "",
    status: "clean",
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
  const [result, setResult] = useState<PublicVehicleLookupResult | null>(null);
  const run = useServerFn(lookupCitation);

  const search = useMutation({
    mutationFn: (input: { query?: string; plate?: string; reference?: string }) =>
      run({ data: input }),
    onSuccess: (res) => {
      setResult(res);
      setNotFound(!res);
    },
  });

  const handleTestPill = (p: string, r: string) => {
    setPlate(p);
    setReference(r);
    setNotFound(false);
    setResult(null);
    search.mutate({ query: p.trim(), plate: p.trim(), reference: r.trim() });
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
            Notice of Violation (NOV) & Vehicle Lookup
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground leading-relaxed">
            Search by vehicle license plate or citation reference number to verify outstanding traffic notices, inspect CCTV camera evidence, settle online, and check your official LTO renewal clearance.
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
                key={sample.label}
                type="button"
                onClick={() => handleTestPill(sample.plate, sample.ref)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel px-3 py-1.5 text-xs text-foreground hover:border-primary/50 hover:bg-panel-elevated transition-colors font-medium"
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    sample.status === "clean" || sample.status === "paid"
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
            const cleanQ = (plate || reference).trim();
            if (!cleanQ) return;
            setNotFound(false);
            setResult(null);
            search.mutate({
              query: cleanQ,
              plate: plate.trim() || undefined,
              reference: reference.trim() || undefined,
            });
          }}
          className="panel grid gap-4 rounded-3xl border border-border p-6 shadow-xl sm:grid-cols-2"
        >
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle flex items-center justify-between">
              <span>License Plate Number or Citation Reference *</span>
              <span className="text-[9px] text-primary">Plate-only lookup supported</span>
            </span>
            <input
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              placeholder="e.g. NDB 8921, CAS 3901, or NOV-2026-QC-00129"
              className={inputClass}
              required
            />
          </label>

          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
              Specific Ticket Reference Number (Optional)
            </span>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value.toUpperCase())}
              placeholder="e.g. NOV-2026-QC-00129 or QC-88218 (Optional: leave blank to search all citations)"
              className={inputClass}
            />
          </label>

          <div className="sm:col-span-2 flex items-center justify-between pt-2">
            <button
              type="submit"
              disabled={search.isPending || (!plate.trim() && !reference.trim())}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {search.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              Verify Vehicle & Citations
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
            <p>Verification lookup failed. Please double-check your plate number or citation reference and try again.</p>
          </div>
        )}

        {notFound && (
          <div className="rounded-2xl border border-border bg-panel p-6 text-sm text-muted-foreground text-center">
            <p className="font-semibold text-white">No record found.</p>
            <p className="mt-1 text-xs text-subtle">
              No registered vehicle or active violation matched search query <strong className="text-white font-mono-tab">{plate || reference}</strong>.
            </p>
            <p className="mt-3 text-xs text-subtle">
              If this is a newly purchased vehicle, you can register it directly on the <Link to="/citizen" className="text-primary underline">Citizen Portal</Link> or visit the QC DPOS window.
            </p>
          </div>
        )}

        {/* Dynamic Verification & Multi-Citation Results */}
        {result && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* 1. Vehicle Identity & LTO Clearance Summary Banner */}
            <div className="panel rounded-3xl border border-border bg-panel p-6 sm:p-8 shadow-2xl flex flex-col gap-5">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/60 pb-5">
                <div>
                  <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle flex items-center gap-1.5">
                    <Car className="size-3.5 text-primary" /> Verified Motor Vehicle Record
                  </span>
                  <div className="flex items-center gap-3 mt-1">
                    <h2 className="font-mono-tab text-3xl font-black text-foreground">
                      {result.plateNumber}
                    </h2>
                    {result.vehicleModel && (
                      <span className="rounded-xl border border-border/80 bg-panel-elevated px-3 py-1 text-xs font-semibold text-foreground">
                        {result.vehicleModel}
                      </span>
                    )}
                  </div>
                  {result.registeredOwner && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Registered Owner: <strong className="text-foreground">{result.registeredOwner}</strong>
                    </p>
                  )}
                </div>

                {/* LTO Clearance Badge */}
                {result.unpaidCount === 0 ? (
                  <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-right">
                    <div className="flex items-center gap-2 justify-end text-emerald-400 font-bold text-sm">
                      <CheckCircle2 className="size-4" />
                      <span>CLEARED FOR LTO RENEWAL</span>
                    </div>
                    <p className="text-[11px] text-emerald-300/80 mt-0.5">
                      No active holds on record with QC Traffic Ops
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-right">
                    <div className="flex items-center gap-2 justify-end text-red-400 font-bold text-sm">
                      <ShieldAlert className="size-4" />
                      <span>LTO REGISTRATION HOLD ACTIVE</span>
                    </div>
                    <p className="text-[11px] text-red-300/80 mt-0.5">
                      {result.unpaidCount} unpaid citation{result.unpaidCount > 1 ? "s" : ""} · Total {formatPeso(result.totalOutstanding)}
                    </p>
                  </div>
                )}
              </div>

              {/* LTO Status Explanation Card */}
              {result.unpaidCount === 0 ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 flex items-start gap-3">
                  <ShieldCheck className="size-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <p className="font-bold text-emerald-400">
                      Official Quezon City LGU Clearance Status
                    </p>
                    <p className="text-white/80 mt-0.5">
                      Vehicle <strong className="font-mono-tab text-emerald-300">{result.plateNumber}</strong> has zero outstanding traffic citations or NCAP violation holds in Quezon City. Your record is cleared for immediate annual registration renewal and motor vehicle inspection at any Land Transportation Office (LTO) branch.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-4 flex items-start gap-3">
                  <AlertTriangle className="size-5 text-red-400 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <p className="font-bold text-red-400">
                      Action Required: Settle Outstanding Notice(s) to Clear LTO Hold
                    </p>
                    <p className="text-white/80 mt-0.5">
                      Under Quezon City Traffic Ordinance and unified MMDA NCAP guidelines, vehicles with overdue citations are tagged with active LTO LTMS renewal holds. Electronic settlement via GCash or Maya below automatically issues an official receipt and clears the hold.
                    </p>
                  </div>
                </div>
              )}

              {/* 2. Citizen Motorist Linkage / Claim Card */}
              {result.isCitizenRegistered ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-panel-elevated p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="grid size-9 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                      <UserCheck className="size-4" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">
                        Verified Citizen Motorist Profile: {result.citizenName || result.registeredOwner}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        This vehicle is actively linked to the QC Citizen Portal with automatic push alerts.
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/citizen"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors shrink-0"
                  >
                    Open Citizen Portal <ChevronRight className="size-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="grid size-9 place-items-center rounded-xl bg-primary/20 text-primary shrink-0">
                      <Sparkles className="size-4" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">
                        Are you the registered owner of this vehicle?
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Claim and link this vehicle on the QC Citizen Portal to get instant SMS notifications, 5-day grace periods, and earn Eco-Tokens.
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/citizen"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors shrink-0"
                  >
                    Claim Vehicle on Portal <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              )}
            </div>

            {/* 3. Citations List */}
            {result.citations.length > 0 ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <FileText className="size-4 text-primary" />
                    Assessed Notices of Violation ({result.citations.length})
                  </h3>
                  <span className="font-mono-tab text-xs text-muted-foreground">
                    {result.unpaidCount > 0 ? `${result.unpaidCount} Pending Settlement` : "All Settled"}
                  </span>
                </div>

                <div className="flex flex-col gap-6">
                  {result.citations.map((c) => (
                    <CitationCard key={c.id} citation={c} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-emerald-500/30 bg-panel p-8 text-center flex flex-col items-center gap-3 shadow-xl">
                <div className="grid size-14 place-items-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-inner">
                  <CheckCircle2 className="size-8" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Pristine Driving Record</h3>
                <p className="max-w-md text-xs text-muted-foreground leading-relaxed">
                  No active traffic citations, outstanding fines, or camera violations were found for plate <strong className="font-mono-tab text-foreground">{result.plateNumber}</strong> on Quezon City monitored road corridors.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Link
                    to="/citizen"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <User className="size-3.5" />
                    Connect Vehicle in Citizen Garage
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Informational Assurance Banner */}
        <div className="rounded-2xl border border-border/60 bg-panel/40 p-5 flex items-start gap-3">
          <ShieldCheck className="size-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-subtle leading-relaxed">
            <p className="font-semibold text-foreground">Official LGU Privacy & Security Verification</p>
            <p className="mt-0.5">
              Notice of Violation records are safeguarded under Republic Act 10173 (Data Privacy Act of 2012). Citations and vehicle clearance statuses are queried directly from the Quezon City DPOS Traffic Ledger. Electronic settlements immediately issue an official electronic receipt and sync with the LTO Land Transportation Management System (LTMS).
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function CitationCard({ citation }: { citation: PublicCitation }) {
  const [showEvidence, setShowEvidence] = useState(false);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);

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
        {(() => {
          const parsed = parseCitationOffenses(citation.offense, citation.amount);
          return (
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                  Charged Offense{parsed.length > 1 ? `s (${parsed.length} on Notice)` : ""}
                </span>
                {citation.ordinanceCode && (
                  <span className="font-mono-tab text-[10px] text-primary">
                    {citation.ordinanceCode}
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-col divide-y divide-border/40 rounded-xl border border-border/50 bg-black/20 p-2.5">
                {parsed.map((item, idx) => (
                  <div key={idx} className="py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="grid size-4 place-items-center rounded-full bg-white/10 text-[9px] font-mono-tab text-muted-foreground">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-foreground text-sm">{item.name}</span>
                        {item.category && (
                          <span className="rounded bg-primary/10 border border-primary/20 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-primary">
                            {item.category}
                          </span>
                        )}
                        {item.code && (
                          <span className="font-mono-tab text-[9px] text-muted-foreground bg-white/5 px-1 py-0.5 rounded">
                            {item.code}
                          </span>
                        )}
                      </div>
                      {item.ordinance && (
                        <p className="text-[10px] text-primary/80 font-mono-tab pl-6">
                          {item.ordinance}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-end pl-6 sm:pl-0">
                      <span className="font-mono-tab text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">
                        {formatPeso(item.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

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

        {showEvidence && (() => {
          const frames = parseEvidenceUrls(citation.evidence_url);
          const activeUrl = frames[activeFrameIndex] || frames[0] || "/assets/violation-1.jpg";
          return (
            <div className="p-4 pt-0 border-t border-border/50">
              <div className="relative overflow-hidden rounded-xl border border-border bg-black mt-3">
                <img
                  src={activeUrl}
                  alt="Violation photographic evidence"
                  className="w-full max-h-72 object-cover"
                />
                <div className="absolute top-2 left-2 rounded-lg bg-black/80 px-2.5 py-1 font-mono-tab text-[10px] text-white border border-white/10 backdrop-blur-sm">
                  ANPR MATCH: <strong className="text-emerald-400">{citation.plate_number}</strong> (99.4% Optical Conf.)
                  {frames.length > 1 && ` · Frame ${activeFrameIndex + 1} of ${frames.length}`}
                </div>
                <div className="absolute bottom-2 right-2 rounded-lg bg-black/80 px-2.5 py-1 font-mono-tab text-[10px] text-muted-foreground border border-white/10 backdrop-blur-sm">
                  {citation.location || "QC Sentinel Node #04"} · T+0.0s Event Record
                </div>
              </div>

              {frames.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pt-2 justify-center">
                  {frames.map((frameUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveFrameIndex(idx)}
                      className={cn(
                        "relative h-12 w-16 overflow-hidden rounded-lg border-2 transition-all",
                        activeFrameIndex === idx
                          ? "border-primary ring-2 ring-primary/40"
                          : "border-border opacity-70 hover:opacity-100"
                      )}
                    >
                      <img src={frameUrl} alt={`Frame ${idx + 1}`} className="size-full object-cover" />
                      <span className="absolute bottom-0.5 right-0.5 rounded bg-black/85 px-1 py-0.2 font-mono-tab text-[8px] font-bold text-white">
                        #{idx + 1}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <p className="mt-2 text-[11px] text-subtle text-center">
                Official timestamped frame recorded by Quezon City High-Definition Traffic Sentinel Camera.
              </p>
            </div>
          );
        })()}
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
