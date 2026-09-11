import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCitizenProfile,
  useCitizenAuth,
  useAddCitizenVehicle,
  useRemoveCitizenVehicle,
  useSettleCitizenCitation,
  useNominateActualDriver,
  useRedeemEcoReward,
  useSubmitHazardReport,
  useCitizenHazardReports,
  type CitizenCitation,
  type CitizenHazardReport,
} from "@/lib/data/citizen";
import { useAdvisories } from "@/lib/data/advisories";
import { useCitizenDisputes, useCreateDispute } from "@/lib/data/disputes";
import { CitizenAuthScreen } from "@/components/citizen/citizen-auth-screen";
import {
  Loader2,
  Car,
  AlertTriangle,
  ShieldCheck,
  FileText,
  CheckCircle2,
  User,
  LogOut,
  Radio,
  Activity,
  Clock,
  ShieldAlert,
  Leaf,
  Gift,
  Trophy,
  Plus,
  X,
  QrCode,
  Printer,
  Sparkles,
  MapPin,
  Trash2,
  CreditCard,
  Camera,
  Eye,
  Send,
  Download,
  Award,
  Zap,
  UserCheck,
  Info,
  Scale,
  FileCheck2,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Receipt,
  Tag,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatPeso } from "@/lib/data/traffic";
import { parseCitationOffenses, getOffenseDetails } from "@/lib/data/review";
import { cn } from "@/lib/utils";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";

import cctv1 from "@/assets/cctv-1.jpg";
import cctv2 from "@/assets/cctv-2.jpg";
import cctv3 from "@/assets/cctv-3.jpg";
import violation1 from "@/assets/violation-1.jpg";
import violation2 from "@/assets/violation-2.jpg";
import violation3 from "@/assets/violation-3.jpg";

export const Route = createFileRoute("/citizen")({
  head: () => ({
    meta: [
      { title: "Citizen Portal (MMDA NCAP) — Culiat Traffic Ops" },
      {
        name: "description",
        content: "Official MMDA No Contact Apprehension Policy (NCAP) Motorist Portal for Barangay Culiat, Quezon City. Verify Notices of Violation (NOV), inspect CCTV evidence, file disputes, and generate LTO clearance certificates.",
      },
    ],
  }),
  component: CitizenPortal,
});

const NCAP_GROUNDS = [
  { value: "emergency", label: "Medical / Humanitarian Emergency Situation (Patient in transit)" },
  { value: "yielding", label: "Yielded to Emergency Vehicle (Ambulance, Fire Engine, Police Patrol)" },
  { value: "enforcer_directed", label: "Directed by On-Duty Traffic Enforcer / Manual Traffic Override" },
  { value: "sold_vehicle", label: "Vehicle Sold / Transferred (Deed of Sale & LTO Release)" },
  { value: "defective_signal", label: "Defective Traffic Signal / Obscured Road Pavement Markings" },
  { value: "plate_cloning", label: "Mismatched Vehicle Model / Suspected Plate Cloning" },
];

function CitizenPortal() {
  const { citizen, isAuthenticated, logout } = useCitizenAuth();
  const { data: profile } = useCitizenProfile();
  const { data: advisories, isLoading: loadingAdvisories } = useAdvisories();
  const { data: disputes, isLoading: loadingDisputes } = useCitizenDisputes();
  const createDispute = useCreateDispute();
  const addVehicle = useAddCitizenVehicle();
  const removeVehicle = useRemoveCitizenVehicle();
  const settleCitation = useSettleCitizenCitation();
  const nominateDriver = useNominateActualDriver();
  const redeemReward = useRedeemEcoReward();
  const submitHazard = useSubmitHazardReport();
  const { data: citizenHazards = [], isLoading: loadingHazards } = useCitizenHazardReports();

  const currentCitizen = profile || citizen;

  const [activeTab, setActiveTab] = useState<"vehicles" | "ncap" | "pass" | "traffic" | "hazard" | "disputes" | "rewards">("ncap");
  const [appealModalOpen, setAppealModalOpen] = useState(false);
  const [appealReason, setAppealReason] = useState("");
  const [appealGround, setAppealGround] = useState(NCAP_GROUNDS[0].label);
  const [appealCitationId, setAppealCitationId] = useState("");

  // Inspect NOV Modal State
  const [inspectNovModalOpen, setInspectNovModalOpen] = useState(false);
  const [selectedNov, setSelectedNov] = useState<CitizenCitation | null>(null);
  const [activeFrameMode, setActiveFrameMode] = useState<"wide" | "plate" | "telemetry">("wide");
  const [activeEvidenceFrameIndex, setActiveEvidenceFrameIndex] = useState(0);

  // Nominate Driver Modal State
  const [nominateModalOpen, setNominateModalOpen] = useState(false);
  const [nomineeName, setNomineeName] = useState("");
  const [nomineeLicense, setNomineeLicense] = useState("");

  // Clearance Certificate Modal State
  const [clearanceModalOpen, setClearanceModalOpen] = useState(false);
  const [clearedCitation, setClearedCitation] = useState<CitizenCitation | null>(null);

  // Add Vehicle Modal State
  const [addVehicleOpen, setAddVehicleOpen] = useState(false);
  const [newPlate, setNewPlate] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newType, setNewType] = useState("Sedan");

  // Hazard Report State
  const [hazardCategory, setHazardCategory] = useState<CitizenHazardReport["category"]>("Stalled Vehicle");
  const [hazardLocation, setHazardLocation] = useState("Commonwealth Ave near Tandang Sora");
  const [hazardDesc, setHazardDesc] = useState("");

  // Quick Settle Modal State
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [selectedCitationId, setSelectedCitationId] = useState<string | null>(null);
  const [settleMethod, setSettleMethod] = useState<"gcash" | "maya" | "card">("gcash");
  const [settling, setSettling] = useState(false);

  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncCommandCenter = async () => {
    setIsSyncing(true);
    await queryClient.invalidateQueries({ queryKey: ["citizen-profile"] });
    await queryClient.invalidateQueries({ queryKey: ["citations"] });
    await queryClient.invalidateQueries({ queryKey: ["violations"] });
    setTimeout(() => {
      setIsSyncing(false);
      toast.success("Command Center Database Synchronized", {
        description: "Latest notices of violation and LTO hold statuses updated.",
      });
    }, 450);
  };

  // Show Citizen Auth Screen (Sign In & Sign Up) if not authenticated
  if (!isAuthenticated || !currentCitizen) {
    return <CitizenAuthScreen />;
  }

  const unpaidCitations = currentCitizen.citations ? currentCitizen.citations.filter((c) => c.status === "unpaid") : [];
  const totalUnpaid = unpaidCitations.reduce((sum, c) => sum + c.amount + (c.surcharge || 0), 0);

  const handleAddVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlate || !newModel) return;

    addVehicle.mutate(
      { plateNumber: newPlate, makeModel: newModel, type: newType },
      {
        onSuccess: () => {
          toast.success(`Vehicle ${newPlate.toUpperCase()} registered to your profile!`, {
            description: "Synchronized with QC Command Center & MMDA NCAP database.",
          });
          setAddVehicleOpen(false);
          setNewPlate("");
          setNewModel("");
          setNewType("Sedan");
        },
        onError: () => toast.error("Failed to add vehicle"),
      },
    );
  };

  const handleQuickSettleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCitationId) return;
    setSettling(true);
    setTimeout(() => {
      settleCitation.mutate(selectedCitationId, {
        onSuccess: () => {
          setSettling(false);
          setSettleModalOpen(false);
          if (selectedNov && selectedNov.id === selectedCitationId) {
            setSelectedNov({ ...selectedNov, status: "settled", ltoAlarmStatus: "CLEARED" });
          }
          toast.success(`Notice of Violation ${selectedCitationId} settled successfully! LTO registration hold lifted.`);
        },
        onError: () => {
          setSettling(false);
          toast.error("Failed to settle citation");
        },
      });
    }, 1200);
  };

  const handleNominateDriverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNov || !nomineeName || !nomineeLicense) {
      toast.error("Please fill in the driver's full name and license number");
      return;
    }

    nominateDriver.mutate(
      { citationId: selectedNov.id, name: nomineeName, licenseNumber: nomineeLicense },
      {
        onSuccess: () => {
          toast.success(`Driver nomination submitted for NOV #${selectedNov.novNumber}. Adjudication board notified.`);
          setNominateModalOpen(false);
          setNomineeName("");
          setNomineeLicense("");
          setInspectNovModalOpen(false);
        },
        onError: () => toast.error("Failed to submit driver nomination"),
      },
    );
  };

  const handleHazardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hazardDesc) {
      toast.error("Please provide a description of the incident");
      return;
    }
    submitHazard.mutate(
      { category: hazardCategory, location: hazardLocation, description: hazardDesc },
      {
        onSuccess: (report) => {
          toast.success(`Incident report #${report.id} dispatched! +50 Eco-Reward Tokens awarded.`);
          setHazardDesc("");
        },
        onError: () => toast.error("Failed to submit incident report"),
      },
    );
  };

  const handleClaimReward = (title: string, description: string, cost: number) => {
    if ((currentCitizen.tokens || 0) < cost) {
      toast.error("Insufficient Eco-Reward Tokens for this reward");
      return;
    }
    redeemReward.mutate(
      { title, description, cost },
      {
        onSuccess: (voucher) => {
          toast.success(`Reward claimed! Voucher code: ${voucher.code}`);
        },
        onError: (err: any) => toast.error(err.message || "Failed to redeem reward"),
      },
    );
  };

  return (
    <div className="min-h-dvh bg-background text-foreground selection:bg-primary/30">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
            <img src="/favico2.png" alt="Culiat LGU" className="size-8" />
            <div className="flex flex-col">
              <span className="font-semibold tracking-tight text-foreground flex items-center gap-1.5">
                Citizen<span className="text-primary">Portal</span>
                <span className="rounded bg-blue-500/20 px-1.5 py-0.2 text-[9px] font-mono-tab font-bold text-blue-400 border border-blue-500/30">
                  MMDA NCAP
                </span>
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-6">
            <nav className="hidden items-center gap-6 text-sm font-medium text-white/70 lg:flex">
              <button
                onClick={() => setActiveTab("ncap")}
                className={cn(
                  "transition-colors flex items-center gap-1.5",
                  activeTab === "ncap" ? "text-blue-400 font-semibold" : "hover:text-white",
                )}
              >
                <Camera className="size-3.5" />
                NCAP Notices ({unpaidCitations.length})
              </button>
              <button
                onClick={() => setActiveTab("vehicles")}
                className={cn("transition-colors", activeTab === "vehicles" ? "text-white font-semibold" : "hover:text-white")}
              >
                My Vehicles
              </button>
              <button
                onClick={() => setActiveTab("pass")}
                className={cn(
                  "transition-colors flex items-center gap-1.5",
                  activeTab === "pass" ? "text-primary font-semibold" : "hover:text-foreground",
                )}
              >
                <QrCode className="size-3.5" />
                Digital Pass
              </button>
              <button
                onClick={() => setActiveTab("traffic")}
                className={cn("transition-colors", activeTab === "traffic" ? "text-foreground font-semibold" : "hover:text-foreground")}
              >
                Live Traffic
              </button>
              <button
                onClick={() => setActiveTab("hazard")}
                className={cn(
                  "transition-colors flex items-center gap-1.5",
                  activeTab === "hazard" ? "text-orange-400 font-semibold" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <AlertTriangle className="size-3.5" />
                Report Hazard
              </button>
              <button
                onClick={() => setActiveTab("disputes")}
                className={cn("transition-colors", activeTab === "disputes" ? "text-foreground font-semibold" : "hover:text-foreground")}
              >
                Adjudication & Appeals
              </button>
              <button
                onClick={() => setActiveTab("rewards")}
                className={cn(
                  "transition-colors flex items-center gap-1.5 font-medium",
                  activeTab === "rewards" ? "text-emerald-400 font-semibold" : "text-emerald-400/70 hover:text-emerald-400",
                )}
              >
                <Leaf className="size-3.5" />
                Eco-Rewards ({currentCitizen.tokens || 0})
              </button>
            </nav>

            <div className="flex items-center gap-3 pl-6 border-l border-border">
              <div className="flex items-center gap-2">
                <div className="grid size-8 place-items-center rounded-full bg-primary/20 text-primary">
                  <User className="size-4" />
                </div>
                <div className="hidden flex-col md:flex">
                  <span className="text-sm font-medium leading-none text-foreground">{currentCitizen.fullName}</span>
                  <span className="text-xs text-subtle">{currentCitizen.id}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  logout();
                  toast.success("Signed out of Citizen Portal");
                }}
                className="text-white/50 hover:text-white transition-colors"
                title="Sign out of Citizen Portal"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Tab Navigation Bar */}
      <div className="flex overflow-x-auto border-b border-border bg-panel/60 px-4 py-2 lg:hidden gap-2">
        <button
          onClick={() => setActiveTab("ncap")}
          className={cn("whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold", activeTab === "ncap" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground")}
        >
          NCAP Notices ({unpaidCitations.length})
        </button>
        <button
          onClick={() => setActiveTab("vehicles")}
          className={cn("whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold", activeTab === "vehicles" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground")}
        >
          My Vehicles
        </button>
        <button
          onClick={() => setActiveTab("pass")}
          className={cn("whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold", activeTab === "pass" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground")}
        >
          Digital Pass
        </button>
        <button
          onClick={() => setActiveTab("traffic")}
          className={cn("whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold", activeTab === "traffic" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground")}
        >
          Live Traffic
        </button>
        <button
          onClick={() => setActiveTab("hazard")}
          className={cn("whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold", activeTab === "hazard" ? "bg-orange-500 text-white font-bold" : "text-orange-400/80")}
        >
          Report Hazard
        </button>
        <button
          onClick={() => setActiveTab("disputes")}
          className={cn("whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold", activeTab === "disputes" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground")}
        >
          Appeals
        </button>
        <button
          onClick={() => setActiveTab("rewards")}
          className={cn("whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold", activeTab === "rewards" ? "bg-emerald-600 text-white font-bold" : "text-emerald-400")}
        >
          Eco-Rewards
        </button>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* ========================================================================= */}
        {/* TAB 1: MMDA NCAP NOTICES OF VIOLATION (NOV) HUB */}
        {/* ========================================================================= */}
        {activeTab === "ncap" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* MMDA NCAP Header Banner */}
            <div className="mb-8 rounded-3xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-blue-900/10 to-transparent p-6 sm:p-8 relative overflow-hidden shadow-2xl">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
                <div className="flex items-start gap-4">
                  <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    <Camera className="size-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest font-mono-tab text-blue-400 font-bold">
                      MMDA NO CONTACT APPREHENSION POLICY (NCAP)
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
                      Notices of Violation (NOV) & Evidence Hub
                    </h1>
                    <p className="mt-2 text-xs sm:text-sm text-white/70 max-w-2xl leading-relaxed">
                      Review camera capture evidence, settle violations online to prevent <strong>LTO Registration Alarms</strong>, or submit a formal protest to the <strong>QC Traffic Adjudication Board (TAB)</strong> within the 10-day statutory window.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
                  <div className="rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-center">
                    <span className="text-[10px] font-mono-tab uppercase text-white/50 block">Registered Plate</span>
                    <span className="font-mono-tab text-sm font-bold text-white">
                      {currentCitizen.vehicles && currentCitizen.vehicles[0] ? currentCitizen.vehicles[0].plateNumber : "NO PLATE"}
                    </span>
                  </div>
                  <button
                    onClick={handleSyncCommandCenter}
                    disabled={isSyncing}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-blue-500/40 bg-blue-500/10 px-3.5 py-2 text-xs font-semibold text-blue-400 hover:bg-blue-500/20 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={cn("size-3.5", isSyncing && "animate-spin")} />
                    {isSyncing ? "Syncing..." : "Sync Command Center"}
                  </button>
                </div>
              </div>
            </div>

            {/* Citations / NOV Grid */}
            <div className="grid gap-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <FileText className="size-5 text-blue-400" />
                  Recorded Notices of Violation ({currentCitizen.citations ? currentCitizen.citations.length : 0})
                </h2>

                <button
                  onClick={() => setActiveTab("disputes")}
                  className="text-xs font-semibold text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Scale className="size-3.5" /> Adjudication Guidelines
                </button>
              </div>

              {currentCitizen.citations && currentCitizen.citations.length > 0 ? (
                currentCitizen.citations.map((c) => {
                  const isUnpaid = c.status === "unpaid";
                  const isSettled = c.status === "settled";
                  const isAppealed = c.status === "appealed";

                  const parsedOffenses = parseCitationOffenses(c.violation, c.amount);
                  const isMultiOffense = parsedOffenses.length > 1;
                  const baseSubtotal = parsedOffenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
                  const surcharge = c.surcharge || 0;
                  const totalLiability = c.amount + surcharge;

                  return (
                    <div
                      key={c.id}
                      className={cn(
                        "rounded-2xl border p-6 transition-all flex flex-col gap-5 shadow-xl backdrop-blur-sm",
                        isUnpaid ? "border-red-500/30 bg-gradient-to-br from-red-950/20 via-black/40 to-black/60 hover:border-red-500/50" :
                        isSettled ? "border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-black/40 to-black/60" :
                        "border-blue-500/30 bg-gradient-to-br from-blue-950/20 via-black/40 to-black/60",
                      )}
                    >
                      {/* Top Header: Identity, Tags, Total Amount */}
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 border-b border-white/10 pb-4">
                        <div className="flex items-start gap-3.5">
                          <div
                            className={cn(
                              "grid size-11 shrink-0 place-items-center rounded-xl shadow-inner",
                              isUnpaid ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                              isSettled ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                              "bg-blue-500/20 text-blue-400 border border-blue-500/30",
                            )}
                          >
                            {isUnpaid ? <AlertTriangle className="size-5" /> :
                             isSettled ? <CheckCircle2 className="size-5" /> :
                             <Clock className="size-5" />}
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono-tab text-xs font-bold text-white bg-white/10 px-2.5 py-0.5 rounded-md border border-white/10">
                                {c.novNumber || c.id}
                              </span>
                              <span className="font-mono-tab text-xs font-semibold text-white/70">
                                Plate: <span className="font-bold text-white">{c.plateNumber}</span>
                              </span>
                              <span
                                className={cn(
                                  "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                                  isUnpaid ? "bg-red-500/20 text-red-400 border-red-500/30" :
                                  isSettled ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                                  "bg-blue-500/20 text-blue-400 border-blue-500/30",
                                )}
                              >
                                {c.status === "unpaid" ? "NOTICE ISSUED / UNPAID" :
                                 c.status === "settled" ? "CLEARED & SETTLED" : "UNDER ADJUDICATION"}
                              </span>
                              {isMultiOffense ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                                  <AlertTriangle className="size-3" /> {parsedOffenses.length} OFFENSES ON 1 TICKET
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 border border-blue-500/30 px-2.5 py-0.5 text-[10px] font-bold text-blue-300">
                                  SINGLE INFRACTION
                                </span>
                              )}
                            </div>

                            <h3 className="text-lg font-bold text-white">
                              {isMultiOffense
                                ? `Multi-Violation Traffic Apprehension (${parsedOffenses.length} Offenses)`
                                : parsedOffenses[0]?.name || c.violation}
                            </h3>
                            <p className="text-xs text-white/60 font-mono-tab flex items-center gap-2">
                              <span>Issued: {new Date(c.date).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}</span>
                              <span>•</span>
                              <span>{c.ordinanceCode || "QC Traffic Ordinance SP-2938 / MMDA NCAP"}</span>
                            </p>
                          </div>
                        </div>

                        {/* Amount & Due Date Box */}
                        <div className="flex flex-row lg:flex-col items-end justify-between lg:justify-start border-t lg:border-t-0 border-white/10 pt-3 lg:pt-0 shrink-0">
                          <div className="text-right">
                            <span className="font-mono-tab text-[10px] uppercase text-white/50 block">Total Assessed Fine</span>
                            <span className="font-mono-tab text-2xl sm:text-3xl font-black text-white tracking-tight">
                              {formatPeso(totalLiability)}
                            </span>
                          </div>
                          {isUnpaid && (
                            <span className="text-[11px] font-semibold text-orange-400 flex items-center gap-1 mt-1">
                              <Clock className="size-3" /> Due: {new Date(c.dueDate || Date.now() + 7 * 86400000).toLocaleDateString()}
                            </span>
                          )}
                          {isSettled && (
                            <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 mt-1">
                              <FileCheck2 className="size-3" /> Clearance Issued
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Itemized Charged Violations & Statutory Fines Breakdown */}
                      <div className="rounded-xl border border-white/10 bg-black/50 overflow-hidden shadow-inner">
                        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-4 py-2.5 text-xs">
                          <span className="font-mono-tab font-bold uppercase tracking-wider text-white/70 flex items-center gap-2">
                            <Scale className="size-3.5 text-blue-400" />
                            Charged Violation(s) & Statutory Fine Breakdown
                          </span>
                          <span className="font-mono-tab text-[11px] text-white/40">
                            {parsedOffenses.length} Offense{parsedOffenses.length > 1 ? "s" : ""} on 1 Ticket
                          </span>
                        </div>

                        <div className="divide-y divide-white/5 p-2">
                          {parsedOffenses.map((item, idx) => {
                            const catTone =
                              item.category === "Franchise & Colorum" ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                              item.category === "Registration & Licensing" ? "bg-blue-500/20 text-blue-300 border-blue-500/30" :
                              item.category === "Moving Violation" ? "bg-purple-500/20 text-purple-300 border-purple-500/30" :
                              item.category === "Obstruction & Parking" ? "bg-rose-500/20 text-rose-300 border-rose-500/30" :
                              "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";

                            return (
                              <div
                                key={idx}
                                className="p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg hover:bg-white/[0.02] transition-colors"
                              >
                                <div className="flex items-start gap-3 min-w-0">
                                  <div className="grid size-6 shrink-0 place-items-center rounded-full bg-white/10 text-[11px] font-mono-tab font-bold text-white/80">
                                    {idx + 1}
                                  </div>
                                  <div className="space-y-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="font-bold text-sm text-white">{item.name}</span>
                                      {item.category && (
                                        <span className={cn("rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border", catTone)}>
                                          {item.category}
                                        </span>
                                      )}
                                      {item.code && (
                                        <span className="font-mono-tab text-[10px] text-white/50 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                                          {item.code}
                                        </span>
                                      )}
                                    </div>
                                    {item.ordinance && (
                                      <p className="text-[11px] text-blue-400/90 font-mono-tab">
                                        Statutory Basis: {item.ordinance}
                                      </p>
                                    )}
                                    {item.description && (
                                      <p className="text-[11px] text-white/60 line-clamp-1">
                                        {item.description}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-3 pl-9 sm:pl-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-white/5 shrink-0">
                                  <span className="text-[10px] font-mono-tab uppercase text-white/40 sm:hidden">Penalty Fine:</span>
                                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-right shadow-sm">
                                    <span className="font-mono-tab text-sm font-black text-emerald-400">
                                      {formatPeso(item.amount)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Financial Ledger Subtotal Bar */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border-t border-white/10 bg-black/70 p-3 text-xs">
                          <div>
                            <span className="text-[10px] font-mono-tab uppercase text-white/40 block">Statutory Fine Subtotal</span>
                            <span className="font-mono-tab font-bold text-white">{formatPeso(baseSubtotal)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono-tab uppercase text-white/40 block">Late Surcharge / Admin Fee</span>
                            <span className={cn("font-mono-tab font-bold", surcharge > 0 ? "text-orange-400" : "text-emerald-400")}>
                              {formatPeso(surcharge)}
                            </span>
                          </div>
                          <div className="col-span-2 sm:col-span-1 text-left sm:text-right border-t sm:border-t-0 border-white/10 pt-2 sm:pt-0">
                            <span className="text-[10px] font-mono-tab uppercase text-white/40 block">Total Assessed Due</span>
                            <span className="font-mono-tab text-base font-black text-white">{formatPeso(totalLiability)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Location & LTO Alarm Notice */}
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
                        <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
                          <span className="text-white/40 block font-mono-tab text-[10px] uppercase">Interception Location</span>
                          <span className="font-medium text-white/90 mt-1 block flex items-center gap-1.5">
                            <MapPin className="size-3.5 text-blue-400 shrink-0" />
                            {c.location || "Commonwealth Ave Intersection"}
                          </span>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
                          <span className="text-white/40 block font-mono-tab text-[10px] uppercase">LTO LTMS Alarm Status</span>
                          <span
                            className={cn(
                              "font-bold mt-1 block flex items-center gap-1.5",
                              c.ltoAlarmStatus === "CLEARED" ? "text-emerald-400" :
                              c.ltoAlarmStatus === "LTO_ALARM_ACTIVE" ? "text-red-400" :
                              "text-orange-400",
                            )}
                          >
                            <ShieldAlert className="size-3.5 shrink-0" />
                            {c.ltoAlarmStatus === "CLEARED" ? "CLEARED (No LTO Hold)" :
                             c.ltoAlarmStatus === "LTO_ALARM_ACTIVE" ? "ALARM ACTIVE (Registration Held)" :
                             "WARNING: Pending LTO Hold in 7 Days"}
                          </span>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
                          <span className="text-white/40 block font-mono-tab text-[10px] uppercase">Protest Window</span>
                          <span className="font-medium text-white/80 mt-1 block">
                            {isSettled ? "Case Closed" : "10 Calendar Days from Notice"}
                          </span>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedNov(c);
                              setActiveFrameMode("wide");
                              setActiveEvidenceFrameIndex(0);
                              setInspectNovModalOpen(true);
                            }}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600/20 border border-blue-500/40 px-4 py-2 text-xs font-bold text-blue-400 hover:bg-blue-600 hover:text-white transition-all"
                          >
                            <Eye className="size-3.5" /> Inspect CCTV Evidence
                          </button>

                          {isSettled && (
                            <button
                              onClick={() => {
                                setClearedCitation(c);
                                setClearanceModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20"
                            >
                              <FileCheck2 className="size-3.5" /> View Clearance Certificate
                            </button>
                          )}
                        </div>

                        {isUnpaid && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedNov(c);
                                setNominateModalOpen(true);
                              }}
                              className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white"
                            >
                              <UserCheck className="size-3.5 inline mr-1" /> Nominate Actual Driver
                            </button>

                            <button
                              onClick={() => {
                                setAppealCitationId(c.id);
                                setAppealModalOpen(true);
                              }}
                              className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white"
                            >
                              Contest / Appeal
                            </button>

                            <button
                              onClick={() => {
                                setSelectedCitationId(c.id);
                                setSettleModalOpen(true);
                              }}
                              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition-all flex items-center gap-1.5"
                            >
                              <CreditCard className="size-3.5" /> Quick Settle
                            </button>

                            <Link
                              to="/portal/pay/$citationId"
                              params={{ citationId: c.novNumber || c.id }}
                              className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
                            >
                              <ExternalLink className="size-3.5" /> Official Checkout
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center flex flex-col items-center">
                  <div className="grid size-14 place-items-center rounded-2xl bg-emerald-500/20 text-emerald-400 mb-4">
                    <CheckCircle2 className="size-7" />
                  </div>
                  <h3 className="text-lg font-bold text-white">No Active Notices of Violation</h3>
                  <p className="text-xs text-white/60 max-w-md mt-1">
                    Your registered vehicles have 0 outstanding MMDA NCAP infractions. Keep driving safely to earn monthly Eco-Reward Tokens!
                  </p>
                </div>
              )}
            </div>

            {/* NCAP Process Flowchart Card */}
            <div className="mt-12 rounded-3xl border border-white/10 bg-black/40 p-8">
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-6">
                <Info className="size-5 text-blue-400" />
                MMDA NCAP Standard Operating Procedure (SOP)
              </h3>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-blue-400 font-mono-tab text-xs font-bold">
                    <span className="grid size-6 place-items-center rounded-full bg-blue-500/20">1</span>
                    DETECTION & NOTICE
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed">
                    High-resolution ANPR CCTV captures vehicle in violation. A digital Notice of Violation (NOV) is generated with optical plate recognition verification.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-blue-400 font-mono-tab text-xs font-bold">
                    <span className="grid size-6 place-items-center rounded-full bg-blue-500/20">2</span>
                    10-DAY PROTEST WINDOW
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Motorist may inspect high-res frame evidence. If contesting under statutory grounds (emergency, directed by enforcer, sold unit), submit formal appeal to TAB.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-blue-400 font-mono-tab text-xs font-bold">
                    <span className="grid size-6 place-items-center rounded-full bg-blue-500/20">3</span>
                    SETTLEMENT & LTO CLEARANCE
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Settle online via QR Ph / GCash / Maya. An electronic Certificate of Clearance is issued immediately, removing any LTO LTMS registration hold.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: MY REGISTERED VEHICLES */}
        {/* ========================================================================= */}
        {activeTab === "vehicles" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Registered Motorist Vehicles</h1>
                <p className="mt-1 text-sm text-white/60">Manage your verified fleet and monitor LTO registration alarm statuses.</p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleSyncCommandCenter}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 transition-all disabled:opacity-50"
                  title="Synchronize violations from Command Center"
                >
                  <RefreshCw className={cn("size-3.5", isSyncing && "animate-spin")} />
                  {isSyncing ? "Syncing..." : "Sync Command Center"}
                </button>

                <button
                  onClick={() => setAddVehicleOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all"
                >
                  <Plus className="size-4" /> Add Vehicle
                </button>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {currentCitizen.vehicles && currentCitizen.vehicles.length > 0 ? (
                currentCitizen.vehicles.map((v) => (
                  <div
                    key={v.id}
                    className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 transition-all hover:bg-white/10 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/80">
                          {v.type}
                        </span>
                        {v.status === "verified" ? (
                          <div className="flex items-center gap-1 text-emerald-400">
                            <CheckCircle2 className="size-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">LGU Verified</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-yellow-500">
                            <AlertTriangle className="size-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Pending LTO</span>
                          </div>
                        )}
                      </div>

                      <h3 className="mt-3 font-mono-tab text-2xl font-bold tracking-wider text-white">{v.plateNumber}</h3>
                      <p className="mt-1 text-sm text-white/60">{v.makeModel}</p>

                      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-3 text-[11px]">
                        <div>
                          <span className="text-white/40 block">LTO Expiry</span>
                          <span className="font-mono-tab text-white/80 font-medium">{v.ltoExpiry || "2027-12-31"}</span>
                        </div>
                        <div>
                          <span className="text-white/40 block">LTO Hold Status</span>
                          <span className={cn("font-medium", v.ltoAlarmStatus === "CLEARED" ? "text-emerald-400" : "text-orange-400")}>
                            {v.ltoAlarmStatus === "CLEARED" ? "Cleared" : "Pending Action"}
                          </span>
                        </div>
                      </div>

                      {(() => {
                        const vehicleUnpaid = unpaidCitations.filter(
                          (c) => c.plateNumber.toUpperCase().replace(/[\s-]/g, "") === v.plateNumber.toUpperCase().replace(/[\s-]/g, "")
                        ).length;
                        return (
                          <div className="mt-3 flex items-center justify-between rounded-lg bg-black/40 px-3 py-1.5 text-[11px]">
                            <span className="text-white/50">Command Center Status:</span>
                            {vehicleUnpaid > 0 ? (
                              <span className="font-bold text-red-400 flex items-center gap-1">
                                <AlertTriangle className="size-3" /> {vehicleUnpaid} Active {vehicleUnpaid === 1 ? "Notice" : "Notices"}
                              </span>
                            ) : (
                              <span className="font-bold text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="size-3" /> Clean Record
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-border pt-3">
                      <button
                        onClick={() => setActiveTab("pass")}
                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        <QrCode className="size-3" /> Motorist Pass
                      </button>
                      <button
                        onClick={() => {
                          removeVehicle.mutate(v.id, {
                            onSuccess: () => toast.success(`Removed vehicle ${v.plateNumber}`),
                          });
                        }}
                        className="text-white/40 hover:text-red-400 transition-colors p-1"
                        title="Remove vehicle"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 rounded-2xl border border-dashed border-white/20 p-12 text-center flex flex-col items-center">
                  <div className="grid size-14 place-items-center rounded-2xl bg-white/5 text-white/40 mb-3">
                    <Car className="size-7" />
                  </div>
                  <h3 className="text-base font-bold text-white">No Vehicles Registered</h3>
                  <p className="mt-1 text-xs text-white/60 max-w-sm">
                    Link your vehicle plate to automatically query Quezon City NCAP cameras, monitor LTO LTMS holds, and access your digital motorist pass.
                  </p>
                  <button
                    onClick={() => setAddVehicleOpen(true)}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all"
                  >
                    <Plus className="size-4" /> Add Your First Vehicle
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: DIGITAL MOTORIST PASS */}
        {/* ========================================================================= */}
        {activeTab === "pass" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2.5">
                  <QrCode className="size-7 text-[#0066cc]" />
                  Digital Motorist Pass
                </h1>
                <p className="mt-1 text-sm text-white/60">
                  Official verified resident pass for Barangay Culiat traffic checkpoints and green lane access.
                </p>
              </div>

              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-all"
              >
                <Printer className="size-4" /> Print Pass
              </button>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="relative overflow-hidden rounded-3xl border border-border bg-panel p-8 shadow-2xl">
                  <div className="flex items-start justify-between border-b border-border pb-6">
                    <div className="flex items-center gap-3">
                      <img src="/favico2.png" alt="LGU Seal" className="size-12" />
                      <div>
                        <p className="text-[10px] uppercase font-mono-tab tracking-widest text-primary font-bold">
                          Quezon City Traffic Operations
                        </p>
                        <h2 className="text-xl font-black tracking-tight text-foreground">
                          BARANGAY CULIAT MOTORIST PASS
                        </h2>
                      </div>
                    </div>

                    <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-center">
                      <span className="text-[10px] font-bold font-mono-tab uppercase text-emerald-400 block">STATUS</span>
                      <span className="text-xs font-bold text-white">ACTIVE / VALID</span>
                    </div>
                  </div>

                  <div className="mt-8 grid gap-8 md:grid-cols-3 items-center">
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/60 p-6 text-center">
                      <div className="grid size-36 place-items-center rounded-xl bg-white p-3 shadow-inner">
                        <div className="grid grid-cols-6 grid-rows-6 gap-1 size-full">
                          {Array.from({ length: 36 }).map((_, i) => (
                            <div
                              key={i}
                              className={cn(
                                "rounded-[2px]",
                                (i % 2 === 0 && i % 3 === 0) || i === 0 || i === 5 || i === 30 || i === 35 || i % 7 === 0
                                  ? "bg-black"
                                  : "bg-black/20",
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="mt-3 font-mono-tab text-[11px] font-bold text-white/80 tracking-widest">
                        {currentCitizen.id}
                      </span>
                    </div>

                    <div className="md:col-span-2 flex flex-col gap-4">
                      <div>
                        <span className="text-[10px] uppercase font-mono-tab tracking-widest text-white/40">Authorized Motorist</span>
                        <p className="text-xl font-bold text-white">{currentCitizen.fullName}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] uppercase font-mono-tab tracking-widest text-white/40">Driver's License</span>
                          <p className="font-mono-tab text-sm font-semibold text-white">{currentCitizen.driverLicenseNumber || "N02-89-102934"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-mono-tab tracking-widest text-white/40">Pass Type</span>
                          <p className="text-sm font-semibold text-emerald-400">Culiat Resident Motorist</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] uppercase font-mono-tab tracking-widest text-white/40">Primary Plate</span>
                          <p className="font-mono-tab text-lg font-bold text-[#0066cc]">
                            {currentCitizen.vehicles && currentCitizen.vehicles[0] ? currentCitizen.vehicles[0].plateNumber : "NO VEHICLE"}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-mono-tab tracking-widest text-white/40">Valid Through</span>
                          <p className="font-mono-tab text-sm font-semibold text-white">DECEMBER 2027</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: LIVE TRAFFIC FEEDS */}
        {/* ========================================================================= */}
        {activeTab === "traffic" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Live Traffic & CCTV Feeds</h1>
              <p className="mt-1 text-sm text-white/60">
                Real-time camera snapshots and official public announcements broadcasted directly from the QC Command Center.
              </p>
            </div>

            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/60">
                <img src={cctv1} alt="Commonwealth Ave" className="h-44 w-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-xs font-bold text-white">Commonwealth Ave (Northbound)</p>
                  <p className="text-[10px] text-white/60 font-mono-tab">Speed: 38 km/h • Moderate</p>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/60">
                <img src={cctv2} alt="Tandang Sora" className="h-44 w-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-xs font-bold text-white">Tandang Sora Flyover Intersection</p>
                  <p className="text-[10px] text-white/60 font-mono-tab">Speed: 24 km/h • Congested</p>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/60">
                <img src={cctv3} alt="Visayas Ave" className="h-44 w-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-xs font-bold text-white">Visayas Ave — Central Avenue</p>
                  <p className="text-[10px] text-white/60 font-mono-tab">Speed: 52 km/h • Clear</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: COMMUNITY ROAD HAZARD REPORTER */}
        {/* ========================================================================= */}
        {activeTab === "hazard" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2.5">
                <AlertTriangle className="size-7 text-orange-500" />
                Community Road Hazard Reporter
              </h1>
              <p className="mt-1 text-sm text-white/60">
                Report stalled vehicles, broken signals, or accidents. Reports are dispatched immediately to patrol units (+50 Eco-Reward Tokens per report).
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <form onSubmit={handleHazardSubmit} className="rounded-2xl border border-border bg-panel p-6 shadow-xl flex flex-col gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-1.5">
                      <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                        Incident Category *
                      </span>
                      <select
                        value={hazardCategory}
                        onChange={(e) => setHazardCategory(e.target.value as any)}
                        className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-orange-500 focus:outline-none"
                      >
                        <option value="Stalled Vehicle">Stalled Vehicle / Breakdown</option>
                        <option value="Accident / Collision">Accident / Collision</option>
                        <option value="Broken Traffic Light">Broken Traffic Signal / Light</option>
                        <option value="Flooding / Obstruction">Flooding / Road Obstruction</option>
                        <option value="Illegal Parking">Severe Illegal Parking Obstruction</option>
                      </select>
                    </label>

                    <label className="flex flex-col gap-1.5">
                      <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                        Approximate Location *
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Commonwealth Ave near Culiat Overpass"
                        value={hazardLocation}
                        onChange={(e) => setHazardLocation(e.target.value)}
                        className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-orange-500 focus:outline-none"
                      />
                    </label>
                  </div>

                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                      Description & Details *
                    </span>
                    <textarea
                      rows={4}
                      required
                      placeholder="Describe the situation (e.g. lane blocked, vehicle model, hazard severity)..."
                      value={hazardDesc}
                      onChange={(e) => setHazardDesc(e.target.value)}
                      className="resize-none rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-orange-500 focus:outline-none"
                    />
                  </label>

                  <div className="flex items-center justify-between border-t border-white/10 pt-4">
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                      <Sparkles className="size-4" /> Earn +50 Eco-Reward Tokens on verification
                    </span>

                    <button
                      type="submit"
                      disabled={submitHazard.isPending || !hazardDesc}
                      className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 hover:bg-orange-600 transition-all disabled:opacity-50"
                    >
                      {submitHazard.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                      Dispatch Report to QC Ops
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: ADJUDICATION BOARD & CONTESTED APPEALS */}
        {/* ========================================================================= */}
        {activeTab === "disputes" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Traffic Adjudication Board (TAB) Appeals</h1>
                <p className="mt-1 text-sm text-white/60">
                  Track your formal contest filings and review hearing determinations under MMDA NCAP statutory guidelines.
                </p>
              </div>

              <Dialog.Root open={appealModalOpen} onOpenChange={setAppealModalOpen}>
                <Dialog.Trigger asChild>
                  <button className="inline-flex items-center gap-2 rounded-xl bg-[#0066cc] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0066cc]/90 transition-colors">
                    <Scale className="size-4" />
                    File Formal Protest
                  </button>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
                  <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-panel p-6 shadow-2xl">
                    <Dialog.Title className="text-lg font-bold text-foreground flex items-center gap-2">
                      <Scale className="size-5 text-primary" />
                      File NCAP Citation Protest (TAB Form 01)
                    </Dialog.Title>
                    <Dialog.Description className="mt-2 text-sm text-muted-foreground">
                      Pursuant to MMDA NCAP Guidelines, formal appeals must be lodged within 10 calendar days of receipt.
                    </Dialog.Description>

                    <div className="mt-6 flex flex-col gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-subtle">Notice of Violation (NOV)</label>
                        {currentCitizen.citations && currentCitizen.citations.length > 0 ? (
                          <select
                            value={appealCitationId}
                            onChange={(e) => setAppealCitationId(e.target.value)}
                            className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                          >
                            <option value="" className="bg-background text-muted-foreground">-- Select NOV --</option>
                            {currentCitizen.citations.map((c) => (
                              <option key={c.id} value={c.id} className="bg-background text-foreground">
                                {c.novNumber || c.id} · {c.plateNumber} — {c.violation} ({formatPeso(c.amount)})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={appealCitationId}
                            onChange={(e) => setAppealCitationId(e.target.value)}
                            placeholder="e.g. NOV-2026-QC-09124"
                            className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                          />
                        )}
                      </div>

                      {appealCitationId && (() => {
                        const target = currentCitizen?.citations?.find((c) => c.id === appealCitationId || c.novNumber === appealCitationId);
                        if (!target) return null;
                        const parsed = parseCitationOffenses(target.violation, target.amount);
                        return (
                          <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-xs space-y-2">
                            <div className="flex items-center justify-between border-b border-white/10 pb-1 font-mono-tab">
                              <span className="text-[10px] uppercase font-bold text-white/60">
                                Charges Under Appeal ({parsed.length})
                              </span>
                              <span className="text-blue-400 font-bold">{formatPeso(target.amount)}</span>
                            </div>
                            <div className="divide-y divide-white/5 space-y-1">
                              {parsed.map((item, idx) => (
                                <div key={idx} className="pt-1 flex items-center justify-between text-xs">
                                  <span className="text-white font-medium flex items-center gap-1.5">
                                    <span className="text-[10px] text-white/40 font-mono-tab">#{idx + 1}</span>
                                    <span>{item.name}</span>
                                  </span>
                                  <span className="font-mono-tab font-bold text-white/80">{formatPeso(item.amount)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-subtle">Statutory Ground for Appeal</label>
                        <select
                          value={appealGround}
                          onChange={(e) => setAppealGround(e.target.value)}
                          className="rounded-lg border border-border bg-background px-4 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                        >
                          {NCAP_GROUNDS.map((g) => (
                            <option key={g.value} value={g.label} className="bg-background text-foreground">
                              {g.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-subtle">Supporting Statement & Defense</label>
                        <textarea
                          rows={4}
                          value={appealReason}
                          onChange={(e) => setAppealReason(e.target.value)}
                          placeholder="Provide factual details (time of day, emergency situation, presence of traffic enforcer override, deed of sale date)..."
                          className="resize-none rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                      <Dialog.Close asChild>
                        <button className="rounded-lg px-4 py-2 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white transition-colors">
                          Cancel
                        </button>
                      </Dialog.Close>
                      <button
                        disabled={createDispute.isPending || !appealCitationId || !appealReason}
                        onClick={() => {
                          createDispute.mutate(
                            { citation_id: appealCitationId, reason: `[Ground: ${appealGround}] ${appealReason}` },
                            {
                              onSuccess: () => {
                                toast.success(`Appeal for ${appealCitationId} filed with Traffic Adjudication Board.`);
                                setAppealModalOpen(false);
                                setAppealCitationId("");
                                setAppealReason("");
                              },
                            },
                          );
                        }}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#0066cc] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0066cc]/90 transition-colors disabled:opacity-50"
                      >
                        {createDispute.isPending && <Loader2 className="size-4 animate-spin" />}
                        Submit to Board
                      </button>
                    </div>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            </div>

            {loadingDisputes ? (
              <div className="grid h-64 place-items-center">
                <Loader2 className="size-8 animate-spin text-[#0066cc]" />
              </div>
            ) : (
              <div className="grid gap-6">
                {disputes?.map((dispute) => (
                  <div key={dispute.id} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="grid size-10 place-items-center rounded-xl bg-blue-500/20 text-blue-400">
                          <Scale className="size-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white">Docket #{dispute.id}</h3>
                          <p className="text-xs text-white/50">Notice of Violation: {dispute.citation_id}</p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider",
                          dispute.status === "approved" ? "bg-emerald-500/20 text-emerald-500" :
                          dispute.status === "rejected" ? "bg-red-500/20 text-red-500" :
                          "bg-blue-500/20 text-blue-400",
                        )}
                      >
                        {dispute.status === "approved" ? "DISMISSED (NO FINE)" :
                         dispute.status === "rejected" ? "PENALTY UPHELD" : "PENDING BOARD REVIEW"}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-6 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-white/50">Motorist Formal Defense</p>
                        <p className="mt-1 text-sm text-white/90">"{dispute.reason}"</p>
                        <p className="mt-2 text-xs text-white/40 flex items-center gap-1">
                          <Clock className="size-3" /> Submitted {new Date(dispute.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      {dispute.admin_notes && (
                        <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-orange-500">Adjudication Officer Findings</p>
                          <p className="mt-1 text-sm text-white/90">{dispute.admin_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: ECO-REWARDS & MOTORIST INCENTIVES */}
        {/* ========================================================================= */}
        {activeTab === "rewards" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-emerald-400 flex items-center gap-2">
                <Leaf className="size-8" />
                Eco-Rewards Program
              </h1>
              <p className="mt-1 text-sm text-white/60">
                Earn tokens for clean driving records and road hazard reporting. Redeem for official LGU motorist perks.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 via-emerald-950/20 to-transparent p-8 relative overflow-hidden shadow-2xl">
                  <Trophy className="absolute -bottom-4 -right-4 size-40 text-emerald-500/15 rotate-12 pointer-events-none" />
                  <span className="text-xs font-bold uppercase tracking-widest font-mono-tab text-emerald-400">
                    Safe Driver Rewards Balance
                  </span>
                  <p className="text-5xl sm:text-6xl font-black text-emerald-300 mt-2 font-mono-tab">
                    {currentCitizen.tokens || 0} <span className="text-xl text-emerald-400/80">Tokens</span>
                  </p>
                  <p className="text-xs text-emerald-400/90 mt-3 font-semibold flex items-center gap-1.5">
                    <Sparkles className="size-4" /> Maintain clean driving streak to earn +100 tokens monthly!
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex flex-col justify-between hover:border-emerald-500/50 transition-colors group">
                    <div>
                      <div className="grid size-11 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
                        <Car className="size-6" />
                      </div>
                      <h3 className="font-bold text-white">1-Month Free QC Facility Parking</h3>
                      <p className="text-xs text-white/60 mt-1">Unlimited free parking pass across all QC Hall and LGU public lots.</p>
                    </div>
                    <button
                      onClick={() => handleClaimReward("1-Month Free QC Parking", "Unlimited QC LGU lot parking", 500)}
                      disabled={redeemReward.isPending || (currentCitizen.tokens || 0) < 500}
                      className="mt-4 w-full rounded-xl bg-emerald-600/20 py-2.5 text-xs font-bold text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors disabled:opacity-40"
                    >
                      Redeem for 500 Tokens
                    </button>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex flex-col justify-between hover:border-emerald-500/50 transition-colors group">
                    <div>
                      <div className="grid size-11 place-items-center rounded-xl bg-blue-500/20 text-blue-400 mb-3 group-hover:scale-110 transition-transform">
                        <Gift className="size-6" />
                      </div>
                      <h3 className="font-bold text-white">Priority QC Express Lane Pass</h3>
                      <p className="text-xs text-white/60 mt-1">Skip the queue for your next LTO registration renewal at QC Express Center.</p>
                    </div>
                    <button
                      onClick={() => handleClaimReward("Priority QC Express Pass", "Skip the line for LTO renewals", 750)}
                      disabled={redeemReward.isPending || (currentCitizen.tokens || 0) < 750}
                      className="mt-4 w-full rounded-xl bg-emerald-600/20 py-2.5 text-xs font-bold text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors disabled:opacity-40"
                    >
                      Redeem for 750 Tokens
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 1: INSPECT NCAP EVIDENCE PACK (CCTV FRAMES) */}
        {/* ========================================================================= */}
        <Dialog.Root open={inspectNovModalOpen} onOpenChange={setInspectNovModalOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md animate-in fade-in" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-panel p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
              {selectedNov && (
                <div>
                  <div className="flex items-start justify-between border-b border-white/10 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-blue-500/20 px-2 py-0.5 font-mono-tab text-[10px] font-bold text-blue-400 border border-blue-500/30">
                          OFFICIAL NCAP EVIDENCE PACK
                        </span>
                        <span className="font-mono-tab text-xs font-bold text-white/80">{selectedNov.novNumber}</span>
                      </div>
                      <h2 className="text-xl font-bold text-white mt-1">{selectedNov.violation}</h2>
                      <p className="text-xs text-white/50">{selectedNov.location}</p>
                    </div>

                    <Dialog.Close asChild>
                      <button className="rounded p-1 text-white/50 hover:text-white">
                        <X className="size-5" />
                      </button>
                    </Dialog.Close>
                  </div>

                  {/* Photographic Evidence Viewfinder & Optical Sequence */}
                  {(() => {
                    const frames = selectedNov.evidenceFrames && selectedNov.evidenceFrames.length > 0
                      ? selectedNov.evidenceFrames
                      : [{ url: "/assets/violation-1.jpg", label: `Optical Sentinel Capture: ${selectedNov.violation}`, timestamp: new Date(selectedNov.date).toLocaleTimeString() }];
                    const safeIndex = Math.min(activeEvidenceFrameIndex, frames.length - 1);
                    const currentFrame = frames[safeIndex] || frames[0];
                    const evidenceUrl = currentFrame.url || "/assets/violation-1.jpg";
                    const isSupabaseStorage = evidenceUrl.includes("supabase.co") || evidenceUrl.startsWith("http");

                    return (
                      <div className="mt-6 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-white/60 flex items-center gap-2">
                            <Camera className="size-4 text-blue-400" />
                            Official Optical Evidence Capture (ANPR Verified)
                            {frames.length > 1 && (
                              <span className="rounded bg-blue-500/20 px-2 py-0.5 font-mono-tab text-[10px] font-bold text-blue-300">
                                Frame {safeIndex + 1} of {frames.length}
                              </span>
                            )}
                          </h3>
                          <div className="flex items-center gap-2">
                            {isSupabaseStorage ? (
                              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono-tab text-[10px] font-bold text-emerald-400">
                                <ShieldCheck className="size-3" /> Supabase Storage Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 font-mono-tab text-[10px] font-bold text-blue-400">
                                CCTV Sentinel Frame
                              </span>
                            )}
                            <a
                              href={evidenceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-md border border-white/20 bg-white/5 px-2 py-0.5 font-mono-tab text-[10px] font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                            >
                              <ExternalLink className="size-3" /> Full Res
                            </a>
                          </div>
                        </div>

                        {/* Main High-Resolution Viewfinder */}
                        <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-black shadow-2xl">
                          <div className="relative h-64 sm:h-80 w-full overflow-hidden flex items-center justify-center bg-zinc-950">
                            <img
                              src={evidenceUrl}
                              alt={`Optical evidence for ${selectedNov.novNumber} - Frame ${safeIndex + 1}`}
                              className={cn(
                                "size-full object-cover transition-transform duration-300",
                                activeFrameMode === "plate" ? "scale-150 object-center" : "",
                                activeFrameMode === "telemetry" ? "brightness-90 contrast-125" : ""
                              )}
                            />

                            {/* Viewfinder HUD Overlays */}
                            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3.5 bg-gradient-to-t from-black/80 via-transparent to-black/60">
                              {/* Top Bar */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="flex items-center gap-1.5 rounded bg-red-600/90 px-2 py-0.5 font-mono-tab text-[10px] font-bold text-white shadow">
                                    <span className="size-1.5 rounded-full bg-white animate-pulse" /> REC
                                  </span>
                                  <span className="font-mono-tab text-[11px] font-semibold text-white/90 drop-shadow">
                                    CAM-QC-{selectedNov.plateNumber.replace(/\s+/g, "").slice(0, 4)} • {selectedNov.location}
                                  </span>
                                </div>
                                <span className="font-mono-tab text-[11px] text-white/70 drop-shadow">
                                  {new Date(selectedNov.date).toLocaleDateString()} {currentFrame.timestamp || new Date(selectedNov.date).toLocaleTimeString()}
                                </span>
                              </div>

                              {/* Center Reticle (when in plate mode) */}
                              {activeFrameMode === "plate" && (
                                <div className="self-center flex flex-col items-center">
                                  <div className="size-28 rounded-lg border-2 border-dashed border-emerald-400/90 bg-emerald-500/10 backdrop-blur-[1px] flex items-center justify-center">
                                    <span className="font-mono-tab text-xs font-black text-emerald-300 bg-black/80 px-2 py-0.5 rounded border border-emerald-400">
                                      {selectedNov.plateNumber}
                                    </span>
                                  </div>
                                  <span className="mt-1 font-mono-tab text-[10px] font-bold text-emerald-400 bg-black/80 px-2 py-0.5 rounded">
                                    ANPR OCR Confidence: 99.4%
                                  </span>
                                </div>
                              )}

                              {/* Bottom Information HUD */}
                              <div className="flex flex-wrap items-end justify-between gap-2">
                                <div className="rounded-xl border border-white/15 bg-black/75 px-3 py-1.5 backdrop-blur-md">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono-tab text-[10px] uppercase text-white/50">Target Plate:</span>
                                    <span className="font-mono-tab text-xs font-black text-amber-400 tracking-wider">
                                      {selectedNov.plateNumber}
                                    </span>
                                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono-tab text-[9px] font-bold text-emerald-400 border border-emerald-500/30">
                                      MATCH 99.4%
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-white/70 mt-0.5">
                                    {currentFrame.label || `Violation: ${selectedNov.violation}`}
                                  </p>
                                </div>

                                <div className="rounded-xl border border-white/15 bg-black/75 px-3 py-1.5 backdrop-blur-md text-right font-mono-tab text-[10px]">
                                  <span className="text-white/50 block">Ordinance Code</span>
                                  <span className="text-blue-400 font-semibold">{selectedNov.ordinanceCode}</span>
                                </div>
                              </div>
                            </div>

                            {/* Previous / Next Arrow Controls if Multiple Frames */}
                            {frames.length > 1 && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveEvidenceFrameIndex((prev) => (prev > 0 ? prev - 1 : frames.length - 1));
                                  }}
                                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/70 p-2 text-white/80 hover:bg-black hover:text-white border border-white/20 transition-all backdrop-blur-sm"
                                  title="Previous Frame"
                                >
                                  <ChevronLeft className="size-5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveEvidenceFrameIndex((prev) => (prev < frames.length - 1 ? prev + 1 : 0));
                                  }}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/70 p-2 text-white/80 hover:bg-black hover:text-white border border-white/20 transition-all backdrop-blur-sm"
                                  title="Next Frame"
                                >
                                  <ChevronRight className="size-5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Multi-Frame Selection Strip if Multiple Frames */}
                        {frames.length > 1 ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px] text-white/60">
                              <span>Select Evidence Frame to Inspect:</span>
                              <span className="font-mono-tab text-white/80">Frame {safeIndex + 1} of {frames.length}</span>
                            </div>
                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                              {frames.map((frame, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setActiveEvidenceFrameIndex(idx);
                                    setActiveFrameMode("wide");
                                  }}
                                  className={cn(
                                    "relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition-all text-left",
                                    safeIndex === idx
                                      ? "border-blue-500 ring-2 ring-blue-500/50 shadow-lg"
                                      : "border-white/10 opacity-70 hover:opacity-100 hover:border-white/30"
                                  )}
                                >
                                  <img src={frame.url} alt={`Evidence Frame ${idx + 1}`} className="size-full object-cover" />
                                  <span className="absolute bottom-1 right-1 rounded bg-black/85 px-1.5 py-0.5 font-mono-tab text-[9px] font-bold text-white">
                                    #{idx + 1}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          /* 3-Mode Optical Inspection Sequence for Single Frame */
                          <div className="grid gap-3 sm:grid-cols-3">
                            <button
                              type="button"
                              onClick={() => setActiveFrameMode("wide")}
                              className={cn(
                                "text-left flex flex-col gap-1.5 rounded-xl border p-2.5 transition-all",
                                activeFrameMode === "wide"
                                  ? "border-blue-500 bg-blue-500/15 ring-1 ring-blue-500/50"
                                  : "border-white/10 bg-black/40 hover:bg-black/60 hover:border-white/20"
                              )}
                            >
                              <div className="relative h-24 w-full overflow-hidden rounded-lg bg-zinc-900">
                                <img src={evidenceUrl} alt="Frame 01 Approach" className="size-full object-cover" />
                                <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 font-mono-tab text-[9px] text-blue-400 font-bold">
                                  WIDE ANGLE
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono-tab font-bold text-blue-400">FRAME 01 • APPROACH</span>
                                {activeFrameMode === "wide" && <span className="size-1.5 rounded-full bg-blue-400" />}
                              </div>
                              <p className="text-[10px] text-white/70 line-clamp-1">Primary photographic capture of vehicle approaching intersection.</p>
                            </button>

                            <button
                              type="button"
                              onClick={() => setActiveFrameMode("telemetry")}
                              className={cn(
                                "text-left flex flex-col gap-1.5 rounded-xl border p-2.5 transition-all",
                                activeFrameMode === "telemetry"
                                  ? "border-red-500 bg-red-500/15 ring-1 ring-red-500/50"
                                  : "border-white/10 bg-black/40 hover:bg-black/60 hover:border-white/20"
                              )}
                            >
                              <div className="relative h-24 w-full overflow-hidden rounded-lg bg-zinc-900">
                                <img src={evidenceUrl} alt="Frame 02 Infraction" className="size-full object-cover contrast-125" />
                                <span className="absolute bottom-1 right-1 rounded bg-red-950/90 px-1.5 py-0.5 font-mono-tab text-[9px] text-red-400 font-bold border border-red-500/40">
                                  TRIGGER POINT
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono-tab font-bold text-red-400">FRAME 02 • INFRACTION</span>
                                {activeFrameMode === "telemetry" && <span className="size-1.5 rounded-full bg-red-400" />}
                              </div>
                              <p className="text-[10px] text-white/70 line-clamp-1">Stop line crossing / active lane sensor trigger verified.</p>
                            </button>

                            <button
                              type="button"
                              onClick={() => setActiveFrameMode("plate")}
                              className={cn(
                                "text-left flex flex-col gap-1.5 rounded-xl border p-2.5 transition-all",
                                activeFrameMode === "plate"
                                  ? "border-emerald-500 bg-emerald-500/15 ring-1 ring-emerald-500/50"
                                  : "border-white/10 bg-black/40 hover:bg-black/60 hover:border-white/20"
                              )}
                            >
                              <div className="relative h-24 w-full overflow-hidden rounded-lg bg-zinc-900">
                                <img src={evidenceUrl} alt="Frame 03 ANPR Plate Crop" className="size-full object-cover scale-150" />
                                <span className="absolute bottom-1 right-1 rounded bg-emerald-950/90 px-1.5 py-0.5 font-mono-tab text-[9px] text-emerald-400 font-bold border border-emerald-500/40">
                                  99.4% OCR
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono-tab font-bold text-emerald-400">FRAME 03 • ANPR CROP</span>
                                {activeFrameMode === "plate" && <span className="size-1.5 rounded-full bg-emerald-400" />}
                              </div>
                              <p className="text-[10px] text-white/70 line-clamp-1">Automated plate recognition crop matching {selectedNov.plateNumber}.</p>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Official Statutory Violation & Penalty Schedule Slip */}
                  {(() => {
                    const parsed = parseCitationOffenses(selectedNov.violation, selectedNov.amount);
                    const baseSub = parsed.reduce((s, i) => s + (i.amount || 0), 0);
                    const surchargeAmt = selectedNov.surcharge || 0;
                    const totalDueAmt = selectedNov.amount + surchargeAmt;

                    return (
                      <div className="mt-6 rounded-2xl border border-white/10 bg-black/60 overflow-hidden shadow-2xl">
                        {/* Slip Header */}
                        <div className="border-b border-white/10 bg-white/[0.03] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <Scale className="size-4 text-blue-400" />
                              <span className="font-mono-tab text-xs font-bold uppercase tracking-wider text-white">
                                Official Statutory Adjudication & Fine Schedule
                              </span>
                            </div>
                            <p className="text-[11px] text-white/50 mt-0.5">
                              Enforced under QC Traffic Management Code & MMDA No Contact Apprehension Policy
                            </p>
                          </div>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 font-mono-tab text-[10px] font-bold text-white/80 border border-white/10 self-start sm:self-auto">
                            {parsed.length} Infraction{parsed.length > 1 ? "s" : ""} Assessed
                          </span>
                        </div>

                        {/* Itemized Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="border-b border-white/10 bg-white/[0.01] font-mono-tab text-[10px] uppercase text-white/40">
                              <tr>
                                <th className="px-4 py-2.5 w-10">#</th>
                                <th className="px-4 py-2.5">Charged Offense & Statutory Classification</th>
                                <th className="px-4 py-2.5 hidden sm:table-cell">Legal Ordinance Basis</th>
                                <th className="px-4 py-2.5 text-right">Statutory Fine</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {parsed.map((item, idx) => {
                                const catTone =
                                  item.category === "Franchise & Colorum" ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                                  item.category === "Registration & Licensing" ? "bg-blue-500/20 text-blue-300 border-blue-500/30" :
                                  item.category === "Moving Violation" ? "bg-purple-500/20 text-purple-300 border-purple-500/30" :
                                  item.category === "Obstruction & Parking" ? "bg-rose-500/20 text-rose-300 border-rose-500/30" :
                                  "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";

                                return (
                                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-4 py-3 font-mono-tab text-white/50 align-top">
                                      {idx + 1}
                                    </td>
                                    <td className="px-4 py-3 align-top">
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="font-bold text-white text-sm">{item.name}</span>
                                        {item.category && (
                                          <span className={cn("rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border", catTone)}>
                                            {item.category}
                                          </span>
                                        )}
                                      </div>
                                      {item.description && (
                                        <p className="text-[11px] text-white/60 mt-1 leading-relaxed">
                                          {item.description}
                                        </p>
                                      )}
                                      <p className="text-[10px] text-blue-400 font-mono-tab mt-1 sm:hidden">
                                        {item.ordinance}
                                      </p>
                                    </td>
                                    <td className="px-4 py-3 align-top hidden sm:table-cell font-mono-tab text-[11px] text-blue-300/90">
                                      <div>{item.ordinance || selectedNov.ordinanceCode}</div>
                                      {item.code && (
                                        <div className="text-[10px] text-white/40 mt-0.5">Code: {item.code}</div>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 align-top text-right font-mono-tab font-black text-emerald-400 text-sm whitespace-nowrap">
                                      {formatPeso(item.amount)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Financial Reconciliation Ledger */}
                        <div className="border-t border-white/10 bg-black/80 p-4">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                            <div>
                              <span className="text-white/40 block font-mono-tab text-[10px] uppercase">Base Fines Subtotal</span>
                              <span className="font-mono-tab text-white font-bold text-sm">{formatPeso(baseSub)}</span>
                            </div>
                            <div>
                              <span className="text-white/40 block font-mono-tab text-[10px] uppercase">Late Surcharge</span>
                              <span className={cn("font-mono-tab font-bold text-sm", surchargeAmt > 0 ? "text-orange-400" : "text-emerald-400")}>
                                {formatPeso(surchargeAmt)}
                              </span>
                            </div>
                            <div>
                              <span className="text-white/40 block font-mono-tab text-[10px] uppercase">Total Assessed Due</span>
                              <span className="font-mono-tab text-xl font-black text-white">{formatPeso(totalDueAmt)}</span>
                            </div>
                            <div>
                              <span className="text-white/40 block font-mono-tab text-[10px] uppercase">Settlement Deadline</span>
                              <span className="font-mono-tab text-orange-400 font-bold text-sm">
                                {new Date(selectedNov.dueDate || Date.now() + 7 * 86400000).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] text-white/50">
                            <span className="flex items-center gap-1.5">
                              <ShieldAlert className="size-3.5 text-amber-400 shrink-0" />
                              Unsettled citations beyond 10 days will be tagged on the LTO LTMS database, preventing annual registration renewal.
                            </span>
                            <span className="font-mono-tab text-white/60 shrink-0">
                              Adjudication Unit: Culiat Traffic Operations Center
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Actions in Evidence Inspector */}
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                    <button
                      onClick={() => {
                        setNominateModalOpen(true);
                      }}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/90 hover:bg-white/10"
                    >
                      <UserCheck className="size-3.5 inline mr-1" /> Nominate Actual Driver
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setAppealCitationId(selectedNov.id);
                          setAppealModalOpen(true);
                        }}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/90 hover:bg-white/10"
                      >
                        Contest / File Protest
                      </button>

                      {selectedNov.status === "unpaid" && (
                        <button
                          onClick={() => {
                            setSelectedCitationId(selectedNov.id);
                            setSettleModalOpen(true);
                          }}
                          className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/30"
                        >
                          Settle Online ({formatPeso(selectedNov.amount)})
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* ========================================================================= */}
        {/* MODAL 2: NOMINATE ACTUAL DRIVER */}
        {/* ========================================================================= */}
        <Dialog.Root open={nominateModalOpen} onOpenChange={setNominateModalOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-panel p-6 shadow-2xl">
              <div className="flex items-start justify-between border-b border-border pb-3">
                <Dialog.Title className="text-base font-bold text-foreground flex items-center gap-2">
                  <UserCheck className="size-5 text-primary" />
                  Nominate Actual Driver (Transfer Liability)
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button className="rounded p-1 text-subtle hover:text-foreground">
                    <X className="size-4" />
                  </button>
                </Dialog.Close>
              </div>

              <form onSubmit={handleNominateDriverSubmit} className="mt-4 flex flex-col gap-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Under MMDA NCAP rules, if you were not the driver at the time of apprehension, you may transfer liability by submitting the driver's verified credentials.
                </p>

                {selectedNov && (() => {
                  const parsed = parseCitationOffenses(selectedNov.violation, selectedNov.amount);
                  return (
                    <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-xs space-y-1.5">
                      <div className="flex items-center justify-between font-mono-tab">
                        <span className="text-white/60">Citation: <strong className="text-white">{selectedNov.novNumber}</strong></span>
                        <span className="text-white/60">Plate: <strong className="text-white">{selectedNov.plateNumber}</strong></span>
                      </div>
                      <div className="text-[11px] text-white/70">
                        Transferring liability for: <span className="font-semibold text-white">{parsed.map((p) => p.name).join(" & ")}</span> ({formatPeso(selectedNov.amount)})
                      </div>
                    </div>
                  );
                })()}

                <label className="flex flex-col gap-1.5">
                  <span className="font-mono-tab text-[10px] uppercase text-subtle">Driver Full Name *</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Roberto M. Gomez"
                    value={nomineeName}
                    onChange={(e) => setNomineeName(e.target.value)}
                    className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="font-mono-tab text-[10px] uppercase text-subtle">Driver's License Number *</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. N01-14-192834"
                    value={nomineeLicense}
                    onChange={(e) => setNomineeLicense(e.target.value.toUpperCase())}
                    className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm uppercase text-foreground focus:border-primary focus:outline-none"
                  />
                </label>

                <div className="mt-4 flex justify-end gap-3 border-t border-white/10 pt-4">
                  <Dialog.Close asChild>
                    <button className="rounded-lg px-4 py-2 text-sm font-semibold text-white/70 hover:bg-white/10">
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    type="submit"
                    disabled={nominateDriver.isPending || !nomineeName || !nomineeLicense}
                    className="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 disabled:opacity-50 transition-all"
                  >
                    {nominateDriver.isPending && <Loader2 className="size-4 animate-spin inline mr-1" />}
                    Submit Nomination
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* ========================================================================= */}
        {/* MODAL 3: CERTIFICATE OF TRAFFIC CLEARANCE */}
        {/* ========================================================================= */}
        <Dialog.Root open={clearanceModalOpen} onOpenChange={setClearanceModalOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-panel p-8 shadow-2xl">
              {clearedCitation && (
                <div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-4 text-center">
                    <div className="flex items-center gap-3 text-left">
                      <img src="/favico2.png" alt="LGU Seal" className="size-10" />
                      <div>
                        <span className="text-[10px] font-mono-tab uppercase text-emerald-400 font-bold block">
                          REPUBLIC OF THE PHILIPPINES • QUEZON CITY
                        </span>
                        <h2 className="text-base font-black text-white">CERTIFICATE OF TRAFFIC CLEARANCE</h2>
                      </div>
                    </div>
                    <Dialog.Close asChild>
                      <button className="rounded p-1 text-white/50 hover:text-white">
                        <X className="size-4" />
                      </button>
                    </Dialog.Close>
                  </div>

                  <div className="mt-6 flex flex-col items-center justify-center p-4 text-center bg-black/40 rounded-2xl border border-white/10">
                    <CheckCircle2 className="size-12 text-emerald-400 mb-2" />
                    <span className="font-mono-tab text-xs font-bold text-white/80">
                      CERTIFICATE #{clearedCitation.clearanceCertNumber || "MMDA-QC-CLR-2026-99124"}
                    </span>
                    <span className="text-xs text-emerald-400 font-semibold mt-1">LTO LTMS REGISTRATION ALARM CLEARED</span>
                  </div>

                  <div className="mt-5 space-y-3 text-xs text-white/80 border-t border-white/10 pt-4">
                    <div className="grid grid-cols-2 gap-3 text-xs bg-white/5 p-3 rounded-xl border border-white/10">
                      <div>
                        <span className="text-white/40 block font-mono-tab text-[10px] uppercase">Issued To</span>
                        <span className="font-bold text-white">{currentCitizen.fullName}</span>
                      </div>
                      <div>
                        <span className="text-white/40 block font-mono-tab text-[10px] uppercase">Vehicle Plate</span>
                        <span className="font-bold text-white font-mono-tab">{clearedCitation.plateNumber}</span>
                      </div>
                      <div>
                        <span className="text-white/40 block font-mono-tab text-[10px] uppercase">Cleared Notice</span>
                        <span className="font-mono-tab text-white/90">{clearedCitation.novNumber || clearedCitation.id}</span>
                      </div>
                      <div>
                        <span className="text-white/40 block font-mono-tab text-[10px] uppercase">Date Adjudicated</span>
                        <span className="text-white/90">{new Date().toLocaleDateString("en-PH", { dateStyle: "medium" })}</span>
                      </div>
                    </div>

                    {/* Itemized Cleared Violations */}
                    <div className="space-y-1.5">
                      <span className="font-mono-tab text-[10px] uppercase font-bold text-white/50 block">
                        Itemized Cleared Violations & Penalties
                      </span>
                      <div className="divide-y divide-white/10 rounded-xl border border-white/10 bg-black/50 p-2.5">
                        {parseCitationOffenses(clearedCitation.violation, clearedCitation.amount).map((item, idx) => (
                          <div key={idx} className="py-1.5 flex items-center justify-between text-xs">
                            <span className="font-semibold text-white flex items-center gap-2">
                              <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                              <span>{item.name}</span>
                              {item.code && (
                                <span className="font-mono-tab text-[9px] text-white/40 bg-white/5 px-1 rounded">
                                  {item.code}
                                </span>
                              )}
                            </span>
                            <span className="font-mono-tab text-xs font-bold text-emerald-400">
                              {formatPeso(item.amount)} [PAID]
                            </span>
                          </div>
                        ))}
                        <div className="pt-2 flex items-center justify-between text-xs font-bold border-t border-white/10">
                          <span className="text-white/70">Total Liability Cleared</span>
                          <span className="font-mono-tab text-emerald-400">{formatPeso(clearedCitation.amount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end gap-3 border-t border-white/10 pt-4">
                    <button
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20"
                    >
                      <Printer className="size-4" /> Print Certificate
                    </button>
                  </div>
                </div>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* ========================================================================= */}
        {/* MODAL 4: INSTANT ONLINE CITATION SETTLEMENT */}
        {/* ========================================================================= */}
        <Dialog.Root open={settleModalOpen} onOpenChange={setSettleModalOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-panel p-6 shadow-2xl">
              <div className="flex items-start justify-between border-b border-border pb-3">
                <Dialog.Title className="text-lg font-bold text-foreground flex items-center gap-2">
                  <CreditCard className="size-5 text-emerald-400" />
                  Instant Online Citation Settlement
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button className="rounded p-1 text-subtle hover:text-foreground">
                    <X className="size-4" />
                  </button>
                </Dialog.Close>
              </div>

              <form onSubmit={handleQuickSettleSubmit} className="mt-4 flex flex-col gap-4">
                {(() => {
                  const targetCitation = currentCitizen?.citations?.find(
                    (c) => c.id === selectedCitationId || c.novNumber === selectedCitationId
                  );
                  const targetParsed = targetCitation
                    ? parseCitationOffenses(targetCitation.violation, targetCitation.amount)
                    : [];
                  const targetTotal = targetCitation
                    ? targetCitation.amount + (targetCitation.surcharge || 0)
                    : 0;

                  return (
                    <div className="space-y-3">
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-mono-tab uppercase text-white/50">Notice of Violation</p>
                          <p className="text-sm font-bold text-white font-mono-tab mt-0.5">
                            {targetCitation?.novNumber || selectedCitationId || "CIT-00135"}
                          </p>
                        </div>
                        {targetCitation?.plateNumber && (
                          <div className="text-right">
                            <p className="text-[10px] font-mono-tab uppercase text-white/50">Plate Number</p>
                            <p className="text-sm font-bold text-white font-mono-tab mt-0.5">
                              {targetCitation.plateNumber}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Itemized breakdown in Settle modal */}
                      <div className="rounded-xl border border-white/10 bg-black/60 p-3 space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-mono-tab uppercase text-white/50 border-b border-white/10 pb-1.5">
                          <span>Charged Offense Breakdown ({targetParsed.length})</span>
                          <span>Assessed Fine</span>
                        </div>
                        <div className="divide-y divide-white/5 space-y-1">
                          {targetParsed.map((off, idx) => (
                            <div key={idx} className="flex items-center justify-between pt-1 text-xs">
                              <span className="font-semibold text-white flex items-center gap-1.5">
                                <span className="grid size-4 place-items-center rounded-full bg-white/10 text-[9px] font-mono-tab text-white/60">
                                  {idx + 1}
                                </span>
                                {off.name}
                              </span>
                              <span className="font-mono-tab font-bold text-emerald-400">
                                {formatPeso(off.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="border-t border-white/10 pt-2 flex items-center justify-between font-mono-tab text-xs font-bold">
                          <span className="text-white/70">Total Amount to Pay</span>
                          <span className="text-sm font-black text-white">{formatPeso(targetTotal)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Select Payment Gateway</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSettleMethod("gcash")}
                      className={cn(
                        "rounded-xl border p-3 text-center transition-all",
                        settleMethod === "gcash" ? "border-blue-500 bg-blue-500/20 text-white font-bold" : "border-white/10 text-white/70 hover:bg-white/5",
                      )}
                    >
                      <span className="block text-xs font-bold">GCash</span>
                      <span className="text-[10px] text-white/50">QR Ph</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettleMethod("maya")}
                      className={cn(
                        "rounded-xl border p-3 text-center transition-all",
                        settleMethod === "maya" ? "border-emerald-500 bg-emerald-500/20 text-white font-bold" : "border-white/10 text-white/70 hover:bg-white/5",
                      )}
                    >
                      <span className="block text-xs font-bold">Maya</span>
                      <span className="text-[10px] text-white/50">Wallet</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettleMethod("card")}
                      className={cn(
                        "rounded-xl border p-3 text-center transition-all",
                        settleMethod === "card" ? "border-purple-500 bg-purple-500/20 text-white font-bold" : "border-white/10 text-white/70 hover:bg-white/5",
                      )}
                    >
                      <span className="block text-xs font-bold">Card</span>
                      <span className="text-[10px] text-white/50">Visa/MC</span>
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-3 border-t border-white/10 pt-4">
                  <Dialog.Close asChild>
                    <button className="rounded-lg px-4 py-2 text-sm font-semibold text-white/70 hover:bg-white/10 transition-colors">
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    type="submit"
                    disabled={settling}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
                  >
                    {settling && <Loader2 className="size-4 animate-spin" />}
                    Confirm & Settle
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* ========================================================================= */}
        {/* MODAL 5: ADD VEHICLE */}
        {/* ========================================================================= */}
        <Dialog.Root open={addVehicleOpen} onOpenChange={setAddVehicleOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-panel p-6 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-start justify-between border-b border-border pb-3">
                <Dialog.Title className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Car className="size-5 text-primary" />
                  Register Motor Vehicle
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button className="rounded p-1 text-subtle hover:text-foreground">
                    <X className="size-4" />
                  </button>
                </Dialog.Close>
              </div>

              <form onSubmit={handleAddVehicleSubmit} className="mt-4 flex flex-col gap-4">
                <p className="text-xs text-white/70 leading-relaxed">
                  Enter your vehicle registration details to link with Quezon City NCAP cameras and LTO registration monitoring.
                </p>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-white/60">
                    Plate Number / Conduction Sticker
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NBD 1234 or 1301-098765"
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-sm uppercase text-white placeholder:text-white/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <span className="text-[10px] text-white/40">
                    Standard format: 3 letters + 4 digits (cars) or 3 letters + 3 digits / conduction sticker.
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-white/60">
                    Make, Model & Year
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Toyota Vios 2023 Gray"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-white/60">
                    Vehicle Classification
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#161922] px-4 py-2.5 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Sedan">Sedan / Hatchback</option>
                    <option value="SUV">SUV / Crossover</option>
                    <option value="MPV">MPV / AUV</option>
                    <option value="Pickup">Pickup Truck</option>
                    <option value="Van">Van / Commuter</option>
                    <option value="Motorcycle">Motorcycle / Scooter</option>
                    <option value="Commercial">Commercial Truck / Bus</option>
                    <option value="Electric Vehicle">Electric Vehicle (EV / Hybrid)</option>
                  </select>
                </div>

                <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-[11px] text-blue-300 leading-relaxed">
                  <strong>Notice:</strong> Adding this vehicle will query the QC Command Center database for any pending NCAP violations or officer-issued citations under this plate.
                </div>

                <div className="mt-2 flex justify-end gap-3 border-t border-white/10 pt-4">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="rounded-lg px-4 py-2 text-sm font-semibold text-white/70 hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    type="submit"
                    disabled={addVehicle.isPending}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {addVehicle.isPending && <Loader2 className="size-4 animate-spin" />}
                    Register Vehicle
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </main>
    </div>
  );
}
