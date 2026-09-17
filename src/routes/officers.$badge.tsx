import { createFileRoute, Link, useParams, ClientOnly } from "@tanstack/react-router";
import { useMemo, useState, lazy, Suspense } from "react";
import {
  ArrowLeft,
  Phone,
  ShieldCheck,
  Radio,
  CreditCard,
  MapPin,
  Activity,
  Award,
  QrCode,
  BatteryCharging,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  Copy,
  ExternalLink,
  Shield,
  Zap,
  Power,
  Clock,
  Car,
  FileText,
  BadgeCheck,
  Video,
  Eye,
  Bell,
  Send,
  Target,
  Sparkles,
  Printer,
  X,
} from "lucide-react";
import { soundEffects } from "@/lib/sound-effects";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  useOfficers,
  useCitations,
  useToggleOfficerDuty,
  formatPeso,
  timeAgo,
  type Officer,
  type Citation,
} from "@/lib/data/traffic";
import { useDispatches, DISPATCH_STATUS_LABEL } from "@/lib/data/dispatch";
import { useOfficerShifts } from "@/lib/data/officer-shifts";
import { DispatchDialog } from "@/components/dispatch/dispatch-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import { getPrimaryEvidenceUrl, parseEvidenceUrls } from "@/lib/storage";
import { RoadsideThermalSlipDialog, type RoadsideCitationSlipData } from "@/components/officers/roadside-thermal-slip-dialog";

export const Route = createFileRoute("/officers/$badge")({
  head: ({ params }) => ({
    meta: [
      { title: `Officer #${params.badge} · Culiat Traffic Ops` },
      {
        name: "description",
        content: `Service record and live telemetry for Barangay Culiat, Quezon City traffic enforcer badge #${params.badge}: duty status, citations issued, revenue collected and dispatch history.`,
      },
      {
        property: "og:title",
        content: `Officer #${params.badge} · Culiat Traffic Ops`,
      },
      {
        property: "og:description",
        content:
          "Officer service record: duty status, citation output, collections, and live GPS dispatch assignments.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OfficerDetailPage,
});

const OfficerSectorMap = lazy(() => import("@/components/officers/officer-sector-map"));

export function OfficerDetailPage() {
  const { badge } = useParams({ from: "/officers/$badge" });
  const { data: officers = [], isLoading } = useOfficers();
  const { data: citations = [] } = useCitations(300);
  const { data: dispatches = [] } = useDispatches(300);
  const { data: shifts = [] } = useOfficerShifts();
  const toggleDuty = useToggleOfficerDuty();

  const [citationSearch, setCitationSearch] = useState("");
  const [citationStatusFilter, setCitationStatusFilter] = useState<string>("all");
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [credentialModalOpen, setCredentialModalOpen] = useState(false);
  const [radioModalOpen, setRadioModalOpen] = useState(false);
  const [nightVision, setNightVision] = useState(false);
  const [telemetryView, setTelemetryView] = useState<"details" | "map" | "bodycam">("details");
  const [selectedSlipData, setSelectedSlipData] = useState<RoadsideCitationSlipData | null>(null);
  const [showSlipModal, setShowSlipModal] = useState(false);

  const officer = officers.find(
    (o) =>
      o.badge_number?.toLowerCase() === badge?.toLowerCase() ||
      o.id === badge ||
      o.full_name?.toLowerCase() === decodeURIComponent(badge)?.toLowerCase(),
  );

  const shiftData = useMemo(() => {
    if (!officer) return null;
    return shifts.find(
      (s) => s.badgeNumber.toLowerCase() === officer.badge_number.toLowerCase()
    );
  }, [shifts, officer]);

  const own = useMemo(
    () =>
      officer
        ? citations.filter(
            (c) =>
              c.officer_name === officer.full_name ||
              (officer.badge_number && c.officer_name?.includes(officer.badge_number)) ||
              (officer.full_name &&
                c.officer_name?.toLowerCase().includes(officer.full_name.toLowerCase())),
          )
        : [],
    [citations, officer],
  );

  const ownDispatches = useMemo(
    () =>
      dispatches.filter(
        (d) =>
          d.badge_number?.toLowerCase() === badge?.toLowerCase() ||
          (officer && d.badge_number?.toLowerCase() === officer.badge_number?.toLowerCase()),
      ),
    [dispatches, badge, officer],
  );

  const collected = own
    .filter((c) => c.status === "paid")
    .reduce((s, c) => s + Number(c.amount), 0);
  const outstanding = own
    .filter((c) => c.status !== "paid" && c.status !== "dismissed")
    .reduce((s, c) => s + Number(c.amount), 0);
  const collectionRate =
    collected + outstanding > 0
      ? Math.round((collected / (collected + outstanding)) * 100)
      : 100;

  // Filtered citations
  const filteredCitations = useMemo(() => {
    return own.filter((c) => {
      if (citationStatusFilter !== "all" && c.status !== citationStatusFilter) {
        return false;
      }
      if (!citationSearch.trim()) return true;
      const q = citationSearch.toLowerCase();
      return (
        c.citation_number.toLowerCase().includes(q) ||
        c.plate_number.toLowerCase().includes(q) ||
        c.offense.toLowerCase().includes(q)
      );
    });
  }, [own, citationStatusFilter, citationSearch]);

  const handleOpenRoadsideSlip = (c: Citation) => {
    const slip: RoadsideCitationSlipData = {
      citationNumber: c.citation_number,
      plateNumber: c.plate_number,
      vehicleModel: c.vehicle_model || undefined,
      driverName: undefined,
      location: c.location || `${officer?.district || "Sector A - Culiat"} Patrol Beat`,
      sector: officer?.district || "Sector A - Culiat",
      offenses: [
        {
          offense: c.offense,
          amount: Number(c.amount) || 1000,
        },
      ],
      totalAmount: Number(c.amount) || 1000,
      officerName: officer?.full_name || "Enforcement Officer",
      officerBadge: officer?.badge_number || badge,
      issuedAt: c.issued_at,
      apprehensionMode: "attended",
      enforcementAction: "top_issued",
      evidenceUrls: c.evidence_url ? parseEvidenceUrls(c.evidence_url) : [],
    };
    setSelectedSlipData(slip);
    setShowSlipModal(true);
  };

  // Generate 14-day output chart data
  const chartData = useMemo(() => {
    const days: { date: string; citations: number; settled: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000);
      const dateKey = d.toISOString().slice(5, 10);
      const dayMatches = own.filter(
        (c) => new Date(c.issued_at).toISOString().slice(5, 10) === dateKey
      );
      days.push({
        date: dateKey,
        citations: dayMatches.length,
        settled: dayMatches.filter((c) => c.status === "paid").length,
      });
    }
    return days;
  }, [own]);

  const handleToggleDuty = () => {
    if (!officer) return;
    toggleDuty.mutate(
      { id: officer.id, currentDuty: !!officer.on_duty },
      {
        onSuccess: () => {
          toast.success(
            `${officer.rank} ${officer.full_name} status updated to ${
              officer.on_duty ? "OFF DUTY" : "ON DUTY (Active Patrol)"
            }`,
          );
        },
        onError: () => {
          toast.error("Failed to update officer duty status");
        },
      }
    );
  };

  const copyBadgeInfo = () => {
    if (!officer) return;
    navigator.clipboard.writeText(
      `QC Traffic Enforcer: ${officer.full_name} | Badge #${officer.badge_number} | District: ${officer.district}`
    );
    toast.success("Officer badge information copied to clipboard");
  };

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-sm text-subtle">
        <div className="flex flex-col items-center gap-3">
          <Activity className="size-8 animate-spin text-primary" />
          <p className="font-mono-tab text-xs uppercase tracking-widest text-muted-foreground">
            Loading officer dossier & GPS telemetry…
          </p>
        </div>
      </div>
    );
  }

  if (!officer) {
    return (
      <div className="flex flex-col items-center gap-4 p-16 text-center">
        <Shield className="size-12 text-subtle" />
        <h2 className="text-xl font-bold text-foreground">Officer Dossier Not Found</h2>
        <p className="text-sm text-subtle">
          No personnel record registered in the roster for badge #{badge}.
        </p>
        <Link
          to="/officers"
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
        >
          Return to Personnel Roster
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/officers"
          className="flex w-fit items-center gap-2 font-mono-tab text-[11px] uppercase tracking-widest text-subtle transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Personnel Roster
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCredentialModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-panel-elevated transition-colors"
          >
            <QrCode className="size-3.5 text-primary" />
            Digital Service ID
          </button>
          <button
            onClick={copyBadgeInfo}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-panel-elevated transition-colors"
            title="Copy officer credentials"
          >
            <Copy className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Main Profile Header Banner */}
      <ProfileHeader
        officer={officer}
        shiftData={shiftData}
        onToggleDuty={handleToggleDuty}
        isToggling={toggleDuty.isPending}
        onOpenRadioPing={() => {
          soundEffects.playRadioChirp();
          setRadioModalOpen(true);
        }}
      />

      {/* KPI Ribbons */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Citations Issued"
          value={officer.citations_issued || own.length}
          subtext="Lifetime Total Tickets"
          icon={ShieldCheck}
          tone="text-primary"
        />
        <Kpi
          label="Fines Collected"
          value={formatPeso(collected)}
          subtext="Treasury Settled"
          icon={CreditCard}
          tone="text-emerald-400"
        />
        <Kpi
          label="Outstanding Penalties"
          value={formatPeso(outstanding)}
          subtext="Pending Settlement"
          icon={AlertTriangle}
          tone="text-amber-400"
        />
        <Kpi
          label="Tactical Dispatches"
          value={ownDispatches.length}
          subtext="Emergency Incident Runs"
          icon={Radio}
          tone="text-foreground"
        />
      </div>

      {/* Telemetry & Output Trends Row */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Live Field Telemetry Card */}
        <div className="panel rounded-3xl border border-border bg-panel p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex flex-col gap-2 border-b border-border/60 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                  <Activity className="size-4 text-primary" />
                  Live Field Telemetry
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono-tab text-[10px] font-bold uppercase tracking-wider",
                    officer.on_duty
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : "bg-neutral-500/15 text-neutral-400 border border-neutral-500/30",
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      officer.on_duty ? "bg-emerald-400 animate-pulse" : "bg-neutral-400",
                    )}
                  />
                  {officer.on_duty ? "Patrol Active" : "Shift Inactive"}
                </span>
              </div>

              {/* View Mode Toggle */}
              <div className="mt-1 flex items-center justify-between">
                <span className="font-mono-tab text-[10px] text-muted-foreground uppercase">Display Mode:</span>
                <div className="flex items-center gap-1 rounded-xl border border-border bg-background p-0.5 font-mono-tab text-[10px]">
                  <button
                    type="button"
                    onClick={() => setTelemetryView("details")}
                    className={cn(
                      "rounded-lg px-2.5 py-1 font-bold uppercase transition-colors",
                      telemetryView === "details"
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Diagnostics
                  </button>
                  <button
                    type="button"
                    onClick={() => setTelemetryView("map")}
                    className={cn(
                      "rounded-lg px-2.5 py-1 font-bold uppercase transition-colors flex items-center gap-1",
                      telemetryView === "map"
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <MapPin className="size-3" /> Sector GIS
                  </button>
                  <button
                    type="button"
                    onClick={() => setTelemetryView("bodycam")}
                    className={cn(
                      "rounded-lg px-2.5 py-1 font-bold uppercase transition-colors flex items-center gap-1",
                      telemetryView === "bodycam"
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Video className="size-3" /> Axon HUD
                  </button>
                </div>
              </div>
            </div>

            {telemetryView === "bodycam" ? (
              <div
                className={cn(
                  "mt-4 h-[250px] w-full overflow-hidden rounded-2xl border relative font-mono text-xs flex flex-col justify-between p-3 select-none transition-all shadow-inner",
                  nightVision
                    ? "border-emerald-500/50 bg-[#041409] text-emerald-400"
                    : "border-border bg-[#080b12] text-white"
                )}
              >
                {/* Scanline pattern overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.4)_51%)] bg-[length:100%_4px] pointer-events-none opacity-40" />
                {nightVision && (
                  <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_40%,rgba(0,0,0,0.7)_100%)] pointer-events-none" />
                )}

                {/* Top HUD */}
                <div className="relative z-10 flex items-center justify-between font-mono-tab text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75" />
                      <span className="relative inline-flex size-2 rounded-full bg-danger" />
                    </span>
                    <span className="font-bold text-danger uppercase tracking-widest">
                      REC 1080P 60FPS
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setNightVision(!nightVision)}
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase transition-colors border flex items-center gap-1",
                        nightVision
                          ? "bg-emerald-500 text-black border-emerald-400 shadow-sm"
                          : "bg-white/10 text-white/80 border-white/20 hover:bg-white/20"
                      )}
                    >
                      <Eye className="size-2.5" />
                      {nightVision ? "IR NV ON" : "Night Vision"}
                    </button>
                    <span className="text-white/60">AXON-3</span>
                  </div>
                </div>

                {/* Center Tactical Reticle */}
                <div className="relative z-10 flex flex-col items-center justify-center opacity-30 pointer-events-none">
                  <div className="size-12 border border-current rounded-full flex items-center justify-center">
                    <div className="size-1.5 bg-current rounded-full" />
                  </div>
                  <span className="text-[8px] uppercase tracking-widest mt-1 font-mono-tab">
                    EIS STABILIZED · OPTICAL LOCK
                  </span>
                </div>

                {/* Bottom HUD */}
                <div className="relative z-10 flex items-end justify-between font-mono-tab text-[9px] border-t border-white/10 pt-1.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-white/80">
                      GPS: {shiftData?.location ? `${shiftData.location[0].toFixed(4)}°N, ${shiftData.location[1].toFixed(4)}°E` : "14.6563° N, 121.0697° E"}
                    </span>
                    <span className="text-white/60">
                      OFFICER: #{officer.badge_number} · PATROL ACTIVE
                    </span>
                  </div>
                  <div className="text-right flex flex-col items-end gap-0.5">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Activity className="size-2.5" /> MIC: -12dB [LIVE]
                    </span>
                    <span className="text-white/50">{new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            ) : telemetryView === "map" ? (
              <div className="mt-4 h-[340px] md:h-[380px] w-full overflow-hidden rounded-2xl border border-border bg-background relative shadow-inner">
                <ClientOnly
                  fallback={
                    <div className="grid h-full place-items-center bg-background">
                      <Activity className="size-6 animate-spin text-primary" />
                    </div>
                  }
                >
                  <Suspense
                    fallback={
                      <div className="grid h-full place-items-center bg-background">
                        <Activity className="size-6 animate-spin text-primary" />
                      </div>
                    }
                  >
                    <OfficerSectorMap
                      officer={officer}
                      shift={shiftData}
                      location={shiftData?.location || [14.664, 121.05]}
                    />
                  </Suspense>
                </ClientOnly>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-subtle" /> Patrol Sector:
                  </span>
                  <span className="font-semibold text-foreground">
                    {officer.district || "District 1 - Culiat Central"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Clock className="size-3.5 text-subtle" /> Current Shift:
                  </span>
                  <span className="font-mono-tab text-foreground">
                    06:00 - 14:00 (Watch Alpha)
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Radio className="size-3.5 text-subtle" /> Radio Call Sign:
                  </span>
                  <span className="font-mono-tab font-bold text-primary">
                    QC-ALPHA-{(officer.badge_number || "101").replace(/\D/g, "")}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <BatteryCharging className="size-3.5 text-subtle" /> Mobile Terminal:
                  </span>
                  <span className="font-mono-tab text-emerald-400 font-semibold">
                    {shiftData?.batteryLevel ?? 88}% Battery · 5G Online
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Award className="size-3.5 text-subtle" /> Collection Rate:
                  </span>
                  <span className="font-mono-tab font-bold text-emerald-400">
                    {collectionRate}% Efficiency
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 rounded-2xl border border-border/60 bg-panel-elevated/60 p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono-tab">
              Assigned Field Equipment
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-medium text-foreground font-mono-tab">
              <span className="rounded-lg bg-background border border-border px-2 py-1">
                Motorola APX 8000
              </span>
              <span className="rounded-lg bg-background border border-border px-2 py-1">
                Axon Body 3
              </span>
              <span className="rounded-lg bg-background border border-border px-2 py-1">
                QC-T2026 POS Scanner
              </span>
            </div>
          </div>
        </div>

        {/* 14-Day Output Sparkline Chart */}
        <div className="panel xl:col-span-2 rounded-3xl border border-border bg-panel p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
              <TrendingUp className="size-4 text-emerald-400" />
              14-Day Enforcement Output & Settlements
            </div>
            <div className="flex items-center gap-3 font-mono-tab text-[10px]">
              <span className="flex items-center gap-1 text-primary font-semibold">
                <span className="size-2 rounded-full bg-primary" /> Issued
              </span>
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <span className="size-2 rounded-full bg-emerald-400" /> Settled
              </span>
            </div>
          </div>

          <div className="mt-4 flex-1 h-[210px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIssued" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSettled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="#666"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#888", fontSize: 10, fontFamily: "monospace" }}
                />
                <YAxis
                  stroke="#666"
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  tick={{ fill: "#888", fontSize: 10, fontFamily: "monospace" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0d0f14",
                    borderColor: "rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="citations"
                  name="Issued"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorIssued)"
                />
                <Area
                  type="monotone"
                  dataKey="settled"
                  name="Settled"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSettled)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Enforcement Performance Quota & Service Honours */}
      <div className="panel rounded-3xl border border-border bg-panel p-6 shadow-xl flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div>
            <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
              <Target className="size-4 text-primary" />
              Field Enforcement Quota & Citizen Service Honours
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              DPOS performance benchmarks and municipal commendation ledger for Q3 2026
            </p>
          </div>
          <span className="font-mono-tab text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full w-fit">
            94.2% Rating · Grade A Officer
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-panel-elevated/40 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Monthly Citation Target</span>
                <span className="font-mono-tab font-bold text-foreground">{Math.min(100, Math.round((own.length / 40) * 100))}%</span>
              </div>
              <div className="mt-2 w-full bg-border rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round((own.length / 40) * 100))}%` }}
                />
              </div>
            </div>
            <p className="font-mono-tab text-[10px] text-muted-foreground mt-3">
              {own.length} issued / 40 target tickets
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-panel-elevated/40 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Emergency Response SLA</span>
                <span className="font-mono-tab font-bold text-emerald-400">96.4%</span>
              </div>
              <div className="mt-2 w-full bg-border rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: "96.4%" }}
                />
              </div>
            </div>
            <p className="font-mono-tab text-[10px] text-muted-foreground mt-3">
              Average arrival &lt; 3.8 mins across 14 dispatches
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-panel-elevated/40 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Field Hours Logged</span>
                <span className="font-mono-tab font-bold text-foreground">148 / 160h</span>
              </div>
              <div className="mt-2 w-full bg-border rounded-full h-2 overflow-hidden">
                <div
                  className="bg-sky-500 h-full rounded-full"
                  style={{ width: "92.5%" }}
                />
              </div>
            </div>
            <p className="font-mono-tab text-[10px] text-muted-foreground mt-3">
              12 hours remaining this monthly cycle
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-panel-elevated/40 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Citizen Satisfaction</span>
                <span className="font-mono-tab font-bold text-amber-400">4.9 / 5.0 ★</span>
              </div>
              <div className="mt-2 w-full bg-border rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full"
                  style={{ width: "98%" }}
                />
              </div>
            </div>
            <p className="font-mono-tab text-[10px] text-muted-foreground mt-3">
              Zero citizen misconduct grievances filed
            </p>
          </div>
        </div>

        {/* Commendation Badges */}
        <div className="border-t border-border/60 pt-3 flex flex-wrap items-center gap-2">
          <span className="font-mono-tab text-[10px] uppercase tracking-wider text-muted-foreground font-bold mr-1">
            Service Commendations:
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono-tab text-[10px] font-bold text-primary">
            <Sparkles className="size-3" /> QC De-escalation Medal
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono-tab text-[10px] font-bold text-emerald-400">
            <ShieldCheck className="size-3" /> Culiat Flood Rescue Ribbon
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 font-mono-tab text-[10px] font-bold text-amber-400">
            <Award className="size-3" /> Zero Fatalities Corridor Award
          </span>
        </div>
      </div>

      {/* Citations & Dispatch Logs Dual Grid */}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* Citations Issued Table */}
        <section className="panel overflow-hidden rounded-3xl border border-border bg-panel shadow-xl flex flex-col">
          <header className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Citations & Notices Issued
              </h2>
              <p className="text-xs text-muted-foreground">
                Official violations recorded by this enforcer
              </p>
            </div>

            {/* Filter toolbar */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search citation or plate..."
                  value={citationSearch}
                  onChange={(e) => setCitationSearch(e.target.value)}
                  className="rounded-xl border border-border bg-panel-elevated pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none w-44 sm:w-56"
                />
              </div>

              <select
                value={citationStatusFilter}
                onChange={(e) => setCitationStatusFilter(e.target.value)}
                className="rounded-xl border border-border bg-panel-elevated px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="contested">Contested</option>
              </select>
            </div>
          </header>

          {filteredCitations.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              <FileText className="size-8 text-subtle mx-auto mb-2 opacity-50" />
              No citations matched your filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                    <th className="px-5 py-3 font-medium">Notice Reference</th>
                    <th className="px-5 py-3 font-medium">Plate</th>
                    <th className="px-5 py-3 font-medium">Offense</th>
                    <th className="px-5 py-3 text-right font-medium">Fine</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 text-right font-medium">Evidence & Slip</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCitations.slice(0, 30).map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-border/50 last:border-0 hover:bg-panel-elevated/60 transition-colors"
                    >
                      <td className="px-5 py-3 font-mono-tab text-xs font-semibold text-primary">
                        {c.citation_number}
                      </td>
                      <td className="px-5 py-3 font-mono-tab text-xs font-bold text-foreground">
                        <span className="rounded border border-border bg-panel-elevated px-1.5 py-0.5">
                          {c.plate_number}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {c.offense}
                      </td>
                      <td className="px-5 py-3 text-right font-mono-tab text-xs font-semibold text-foreground">
                        {formatPeso(Number(c.amount))}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            "rounded-md border px-2 py-0.5 font-mono-tab text-[10px] font-semibold uppercase tracking-widest",
                            c.status === "paid"
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                              : c.status === "contested"
                                ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                                : "border-border bg-panel-elevated text-muted-foreground",
                          )}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedCitation(c)}
                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-panel px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-panel-elevated hover:text-primary transition-colors cursor-pointer"
                          >
                            <Eye className="size-3" /> View Evidence
                          </button>
                          <button
                            onClick={() => handleOpenRoadsideSlip(c)}
                            className="inline-flex items-center gap-1 rounded-lg border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer"
                            title="Print 80mm Roadside Thermal OVR Slip"
                          >
                            <Printer className="size-3" /> Thermal Slip
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <footer className="border-t border-border px-5 py-3 font-mono-tab text-[10px] text-muted-foreground flex justify-between">
            <span>Showing up to 30 records</span>
            <span>Total: {own.length} citations</span>
          </footer>
        </section>

        {/* Dispatch Orders History */}
        <section className="panel flex flex-col rounded-3xl border border-border bg-panel shadow-xl">
          <header className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Tactical Dispatches</h2>
              <p className="text-xs text-muted-foreground">Emergency call assignments</p>
            </div>
            <span className="rounded-md border border-border bg-panel-elevated px-2 py-0.5 font-mono-tab text-[10px] font-bold text-primary">
              {ownDispatches.length} Total
            </span>
          </header>

          <div className="flex flex-col gap-3 p-5 flex-1 overflow-y-auto max-h-[500px]">
            {ownDispatches.length === 0 ? (
              <div className="py-12 text-center text-sm text-subtle">
                <Radio className="size-8 mx-auto mb-2 opacity-40 text-subtle" />
                No dispatch orders assigned to this officer.
              </div>
            ) : (
              ownDispatches.map((d) => (
                <div
                  key={d.id}
                  className="rounded-2xl border border-border bg-panel-elevated/60 p-4 transition-all hover:border-primary/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono-tab text-xs font-bold text-primary">
                      {d.reference}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 font-mono-tab text-[10px] font-bold uppercase",
                        d.status === "resolved"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : d.status === "en_route"
                            ? "bg-sky-500/15 text-sky-400"
                            : "bg-amber-500/15 text-amber-400",
                      )}
                    >
                      {DISPATCH_STATUS_LABEL[d.status]}
                    </span>
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-foreground font-medium">
                    <MapPin className="size-3.5 text-primary shrink-0" />
                    {d.location}
                  </p>
                  <div className="mt-2 flex items-center justify-between font-mono-tab text-[10px] text-muted-foreground border-t border-border/40 pt-2">
                    <span
                      className={cn(
                        "font-bold uppercase",
                        d.priority === "critical"
                          ? "text-red-400"
                          : d.priority === "high"
                            ? "text-orange-400"
                            : "text-muted-foreground",
                      )}
                    >
                      Priority: {d.priority}
                    </span>
                    <span>{timeAgo(d.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Digital Service ID Credential Modal */}
      <Dialog.Root open={credentialModalOpen} onOpenChange={setCredentialModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-panel p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex flex-col items-center text-center">
              <div className="size-16 rounded-2xl bg-panel-elevated border border-border p-2 shadow-inner">
                <img src="/favico2.png" alt="QC Logo" className="size-full object-contain" />
              </div>
              <h3 className="mt-3 text-lg font-black tracking-tight text-white uppercase">
                Quezon City Government
              </h3>
              <p className="font-mono-tab text-[10px] tracking-widest text-primary uppercase font-bold">
                Department of Public Order and Safety
              </p>

              {/* ID Card Box */}
              <div className="mt-5 w-full rounded-2xl border border-primary/30 bg-gradient-to-b from-primary/10 to-transparent p-5 text-left">
                <div className="flex items-center justify-between border-b border-primary/20 pb-3">
                  <div>
                    <p className="text-sm font-bold text-white">{officer.full_name}</p>
                    <p className="font-mono-tab text-[11px] text-primary">{officer.rank}</p>
                  </div>
                  <span className="rounded bg-primary/20 px-2 py-0.5 font-mono-tab text-xs font-black text-primary border border-primary/30">
                    #{officer.badge_number}
                  </span>
                </div>

                <div className="mt-3 flex flex-col gap-1.5 font-mono-tab text-[10px]">
                  <div className="flex justify-between text-muted-foreground">
                    <span>District:</span>
                    <span className="text-white">{officer.district}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Unit:</span>
                    <span className="text-white">{officer.unit}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Clearance:</span>
                    <span className="text-emerald-400 font-bold">LEVEL II FIELD ENFORCER</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Status:</span>
                    <span className="text-white">{officer.status.toUpperCase()}</span>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-center border-t border-primary/20 pt-4">
                  <div className="rounded-xl bg-white p-2 shadow-lg">
                    <QrCode className="size-28 text-black" />
                  </div>
                </div>
                <p className="mt-2 text-center font-mono-tab text-[9px] text-muted-foreground">
                  SCAN TO VERIFY OFFICIAL LGU CREDENTIAL
                </p>
              </div>

              <button
                onClick={() => setCredentialModalOpen(false)}
                className="mt-5 w-full rounded-xl bg-panel-elevated border border-border py-2 text-xs font-semibold text-foreground hover:bg-panel transition-colors"
              >
                Close Credential
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Radio Transmission Dialog */}
      <Dialog.Root open={radioModalOpen} onOpenChange={setRadioModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-panel p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="grid size-9 place-items-center rounded-xl bg-primary/20 text-primary border border-primary/30">
                  <Radio className="size-4" />
                </div>
                <div>
                  <Dialog.Title className="text-base font-bold text-foreground">
                    APX-8000 Radio Dispatch Ping
                  </Dialog.Title>
                  <p className="font-mono-tab text-[10px] text-muted-foreground">
                    Direct RF link to {officer.rank} {officer.full_name} (#{officer.badge_number})
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              Select an urgent operational 10-Code to chirp this officer's handheld Motorola APX-8000 transceiver:
            </p>

            <div className="grid gap-2 mt-3">
              {[
                { code: "10-4", desc: "Acknowledge / Standby for Priority Message" },
                { code: "10-76", desc: "En Route to Incident Location Immediately" },
                { code: "10-97", desc: "Confirm On Scene Arrival & Status" },
                { code: "10-33", desc: "Emergency Traffic Only — Standby" },
                { code: "10-21", desc: "Contact Command Dispatch Desk by Landline" },
              ].map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    soundEffects.playRadioChirp();
                    toast.success(`Transmitted ${item.code} to Badge #${officer.badge_number}!`, {
                      description: `Handheld APX-8000 radio alert chirp sent to ${officer.full_name}.`,
                    });
                    setRadioModalOpen(false);
                  }}
                  className="flex items-center justify-between rounded-xl border border-border bg-panel-elevated/70 p-3 text-left hover:bg-panel-elevated hover:border-primary/40 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono-tab text-xs font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                      {item.code}
                    </span>
                    <span className="text-xs text-foreground font-medium group-hover:text-primary transition-colors">
                      {item.desc}
                    </span>
                  </div>
                  <Send className="size-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setRadioModalOpen(false)}
                className="rounded-xl border border-border bg-panel-elevated px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Citation Evidence & Slip Modal */}
      {selectedCitation && (
        <Dialog.Root open={!!selectedCitation} onOpenChange={(open) => !open && setSelectedCitation(null)}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-panel p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <span className="font-mono-tab text-[10px] uppercase tracking-wider text-muted-foreground">
                    Enforcement Officer Ticket
                  </span>
                  <Dialog.Title className="text-base font-bold text-foreground">
                    {selectedCitation.citation_number}
                  </Dialog.Title>
                </div>
                <Dialog.Close asChild>
                  <button className="rounded-lg p-1 text-muted-foreground hover:bg-panel-elevated hover:text-foreground">
                    <X className="size-4" />
                  </button>
                </Dialog.Close>
              </div>

              {/* Photo Evidence Frame */}
              <div className="mt-4 rounded-xl border border-border bg-black overflow-hidden relative shadow-inner">
                <img
                  src={getPrimaryEvidenceUrl(selectedCitation.evidence_url)}
                  alt={`Evidence capture for ${selectedCitation.plate_number}`}
                  className="h-44 w-full object-cover"
                />
                <div className="absolute inset-x-3 top-3 flex items-center justify-between pointer-events-none">
                  <span className="rounded bg-black/70 px-2 py-0.5 font-mono-tab text-[9px] font-bold text-red-400 border border-red-500/40 flex items-center gap-1">
                    ● OFFICER CAPTURE · {selectedCitation.citation_number}
                    {parseEvidenceUrls(selectedCitation.evidence_url).length > 1 && (
                      <span> ({parseEvidenceUrls(selectedCitation.evidence_url).length} frames)</span>
                    )}
                  </span>
                  <span className="rounded bg-black/70 px-2 py-0.5 font-mono-tab text-[9px] text-emerald-400 border border-emerald-500/30 font-bold">
                    {getPrimaryEvidenceUrl(selectedCitation.evidence_url)?.includes("supabase.co") ? "Supabase Storage CDN" : "Optical Sensor Frame"}
                  </span>
                </div>
                <div className="absolute inset-x-3 bottom-2 rounded-lg border border-emerald-400/80 bg-black/80 p-2 backdrop-blur-sm pointer-events-none flex items-center justify-between text-[10px] font-mono-tab text-emerald-400">
                  <span className="font-bold">ANPR OCR: {selectedCitation.plate_number}</span>
                  <span className="font-bold">VERIFIED EVIDENCE</span>
                </div>
              </div>

              {/* Breakdown */}
              <div className="mt-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-panel-elevated/40 p-3">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Offense</span>
                    <strong className="text-foreground">{selectedCitation.offense}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Vehicle Model</span>
                    <span className="font-mono-tab text-foreground">{selectedCitation.vehicle_model || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Apprehending Officer</span>
                    <span className="text-foreground">{selectedCitation.officer_name || officer?.full_name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Issued At</span>
                    <span className="font-mono-tab text-foreground">
                      {new Date(selectedCitation.issued_at).toLocaleString("en-PH")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border bg-panel-elevated/60 p-3.5">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Statutory Fine</span>
                    <span className="font-mono-tab text-lg font-black text-foreground">
                      {formatPeso(Number(selectedCitation.amount))}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "rounded-md border px-2.5 py-1 font-mono-tab text-xs font-bold uppercase",
                      selectedCitation.status === "paid"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                    )}
                  >
                    {selectedCitation.status}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-panel-elevated"
                >
                  <Printer className="size-3.5" />
                  Print Slip
                </button>
                {selectedCitation.evidence_url && (
                  <a
                    href={getPrimaryEvidenceUrl(selectedCitation.evidence_url)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-panel-elevated text-primary"
                  >
                    <ExternalLink className="size-3.5" />
                    Open Full Photo
                  </a>
                )}
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      {/* Roadside Thermal Slip Dialog for Historical Citations */}
      <RoadsideThermalSlipDialog
        open={showSlipModal}
        onOpenChange={setShowSlipModal}
        slip={selectedSlipData}
      />
    </div>
  );
}

function ProfileHeader({
  officer,
  shiftData,
  onToggleDuty,
  isToggling,
  onOpenRadioPing,
}: {
  officer: Officer;
  shiftData: any;
  onToggleDuty: () => void;
  isToggling: boolean;
  onOpenRadioPing: () => void;
}) {
  return (
    <div className="panel flex flex-col gap-6 rounded-3xl border border-border bg-panel p-6 shadow-xl lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        {/* Officer Avatar with Duty Pulse */}
        <div className="relative grid size-20 shrink-0 place-items-center rounded-2xl bg-panel-elevated font-mono-tab text-2xl font-black text-foreground ring-2 ring-border shadow-inner">
          {officer.full_name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((p) => p[0]?.toUpperCase())
            .join("")}
          {officer.on_duty && (
            <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative size-4 rounded-full border-2 border-panel bg-emerald-500" />
            </span>
          )}
        </div>

        {/* Officer Details */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              {officer.full_name}
            </h1>
            <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono-tab text-xs font-black text-primary">
              BADGE #{officer.badge_number}
            </span>
          </div>

          <p className="font-mono-tab text-xs uppercase tracking-wider text-muted-foreground mt-1">
            {officer.rank} · {officer.unit} · {officer.district}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <span
              className={cn(
                "rounded-md border px-2.5 py-0.5 font-mono-tab text-[10px] font-bold uppercase tracking-wider",
                officer.status === "active"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : officer.status === "on_leave"
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                    : "border-red-500/30 bg-red-500/10 text-red-400",
              )}
            >
              {officer.status.replace("_", " ")}
            </span>

            <span
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 font-mono-tab text-[10px] font-bold uppercase tracking-wider",
                officer.on_duty
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-neutral-500/30 bg-neutral-500/10 text-neutral-400",
              )}
            >
              <Activity className="size-3" />
              {officer.on_duty ? "On Duty (Patrolling)" : "Off Duty (Rest)"}
            </span>

            {officer.contact_number && (
              <a
                href={`tel:${officer.contact_number}`}
                className="flex items-center gap-1.5 rounded-md border border-border bg-panel-elevated px-2.5 py-0.5 font-mono-tab text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              >
                <Phone className="size-3 text-primary" />
                {officer.contact_number}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onOpenRadioPing}
          className="inline-flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-3.5 py-2.5 text-xs font-bold text-primary hover:bg-primary/20 transition-all font-mono-tab uppercase tracking-wider"
        >
          <Bell className="size-3.5 text-primary animate-bounce" />
          Radio Alert
        </button>

        <button
          onClick={onToggleDuty}
          disabled={isToggling}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold font-mono-tab uppercase tracking-wider transition-all",
            officer.on_duty
              ? "border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
              : "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20",
          )}
        >
          <Power className="size-3.5" />
          {officer.on_duty ? "Set Off Duty" : "Clock On Duty"}
        </button>

        <DispatchDialog
          trigger={
            <button className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:scale-[1.02]">
              <Radio className="size-3.5" /> Dispatch Officer
            </button>
          }
        />
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  subtext,
  icon: Icon,
  tone = "text-foreground",
}: {
  label: string;
  value: string | number;
  subtext?: string;
  icon: typeof Radio;
  tone?: string;
}) {
  return (
    <div className="panel rounded-3xl border border-border bg-panel p-5 shadow-lg flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle font-semibold">
          {label}
        </span>
        <div className={cn("grid size-8 place-items-center rounded-xl bg-panel-elevated", tone)}>
          <Icon className="size-4" strokeWidth={2.25} />
        </div>
      </div>
      <div className="mt-3">
        <p className={cn("font-mono-tab text-2xl font-black tracking-tight", tone)}>
          {value}
        </p>
        {subtext && (
          <p className="font-mono-tab text-[10px] text-muted-foreground mt-0.5">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}
