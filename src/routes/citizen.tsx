import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
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
} from "lucide-react";
import { formatPeso } from "@/lib/data/traffic";
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
          toast.success(`Vehicle ${newPlate.toUpperCase()} registered to your profile.`);
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
      <div className="flex overflow-x-auto border-b border-white/10 bg-black/40 px-4 py-2 lg:hidden gap-2">
        <button
          onClick={() => setActiveTab("ncap")}
          className={cn("whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold", activeTab === "ncap" ? "bg-blue-600 text-white" : "text-white/70")}
        >
          NCAP Notices ({unpaidCitations.length})
        </button>
        <button
          onClick={() => setActiveTab("vehicles")}
          className={cn("whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold", activeTab === "vehicles" ? "bg-[#0066cc] text-white" : "text-white/70")}
        >
          My Vehicles
        </button>
        <button
          onClick={() => setActiveTab("pass")}
          className={cn("whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold", activeTab === "pass" ? "bg-[#0066cc] text-white" : "text-white/70")}
        >
          Digital Pass
        </button>
        <button
          onClick={() => setActiveTab("traffic")}
          className={cn("whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold", activeTab === "traffic" ? "bg-[#0066cc] text-white" : "text-white/70")}
        >
          Live Traffic
        </button>
        <button
          onClick={() => setActiveTab("hazard")}
          className={cn("whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold", activeTab === "hazard" ? "bg-orange-500 text-white" : "text-orange-400/80")}
        >
          Report Hazard
        </button>
        <button
          onClick={() => setActiveTab("disputes")}
          className={cn("whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold", activeTab === "disputes" ? "bg-[#0066cc] text-white" : "text-white/70")}
        >
          Appeals
        </button>
        <button
          onClick={() => setActiveTab("rewards")}
          className={cn("whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold", activeTab === "rewards" ? "bg-emerald-600 text-white" : "text-emerald-400")}
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

                  return (
                    <div
                      key={c.id}
                      className={cn(
                        "rounded-2xl border p-6 transition-all flex flex-col gap-6 shadow-xl",
                        isUnpaid ? "border-red-500/30 bg-red-950/10 hover:border-red-500/50" :
                        isSettled ? "border-emerald-500/30 bg-emerald-950/10" :
                        "border-blue-500/30 bg-blue-950/10",
                      )}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-white/10 pb-4">
                        <div className="flex items-start gap-3.5">
                          <div
                            className={cn(
                              "grid size-11 shrink-0 place-items-center rounded-xl",
                              isUnpaid ? "bg-red-500/20 text-red-400" :
                              isSettled ? "bg-emerald-500/20 text-emerald-400" :
                              "bg-blue-500/20 text-blue-400",
                            )}
                          >
                            {isUnpaid ? <AlertTriangle className="size-5" /> :
                             isSettled ? <CheckCircle2 className="size-5" /> :
                             <Clock className="size-5" />}
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono-tab text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded">
                                {c.novNumber || c.id}
                              </span>
                              <span className="text-xs text-white/50">• {c.plateNumber}</span>
                              <span
                                className={cn(
                                  "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                  isUnpaid ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                                  isSettled ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                                  "bg-blue-500/20 text-blue-400 border border-blue-500/30",
                                )}
                              >
                                {c.status === "unpaid" ? "NOTICE ISSUED / UNPAID" :
                                 c.status === "settled" ? "CLEARED & SETTLED" : "UNDER ADJUDICATION"}
                              </span>
                            </div>

                            <h3 className="text-lg font-bold text-white mt-1.5">{c.violation}</h3>
                            <p className="text-xs text-white/60 font-mono-tab">{c.ordinanceCode || "MMDA Regulation 16-002"}</p>
                          </div>
                        </div>

                        {/* Amount & Due Date Box */}
                        <div className="flex flex-row lg:flex-col items-end justify-between lg:justify-center border-t lg:border-t-0 border-white/10 pt-3 lg:pt-0">
                          <span className="font-mono-tab text-2xl font-black text-white">{formatPeso(c.amount + (c.surcharge || 0))}</span>
                          {isUnpaid && (
                            <span className="text-[11px] font-semibold text-orange-400 flex items-center gap-1 mt-0.5">
                              <Clock className="size-3" /> Due: {new Date(c.dueDate || Date.now() + 7 * 86400000).toLocaleDateString()}
                            </span>
                          )}
                          {isSettled && (
                            <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
                              <FileCheck2 className="size-3" /> Clearance Issued
                            </span>
                          )}
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
                              className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition-all"
                            >
                              Settle Online
                            </button>
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

              <button
                onClick={() => setAddVehicleOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0066cc] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0066cc]/90 transition-all"
              >
                <Plus className="size-4" /> Add Vehicle
              </button>
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
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-3">
                      <button
                        onClick={() => setActiveTab("pass")}
                        className="text-xs font-semibold text-[#0066cc] hover:underline flex items-center gap-1"
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
                <div className="col-span-3 rounded-2xl border border-dashed border-white/20 p-8 text-center">
                  <Car className="mx-auto size-8 text-white/40" />
                  <p className="mt-2 text-sm text-white/70">No vehicles registered yet.</p>
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
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/20 bg-[#0a0a0b] p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
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

                  {/* 3-Frame Photographic Evidence Viewer */}
                  <div className="mt-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white/60 mb-3 flex items-center gap-2">
                      <Camera className="size-4 text-blue-400" />
                      High-Resolution ANPR Multi-Frame Sequence
                    </h3>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="flex flex-col gap-1.5 rounded-xl border border-white/10 bg-black/60 p-2">
                        <img src={violation1} alt="Frame 01 Approach" className="h-36 w-full rounded-lg object-cover" />
                        <span className="text-[10px] font-mono-tab font-bold text-blue-400">FRAME 01 • APPROACH</span>
                        <p className="text-[10px] text-white/70">Vehicle entering trigger zone on amber light phase.</p>
                      </div>

                      <div className="flex flex-col gap-1.5 rounded-xl border border-red-500/30 bg-red-950/20 p-2">
                        <img src={violation2} alt="Frame 02 Infraction" className="h-36 w-full rounded-lg object-cover" />
                        <span className="text-[10px] font-mono-tab font-bold text-red-400">FRAME 02 • INFRACTION TRIGGER</span>
                        <p className="text-[10px] text-white/70">Solid red light crossing line: +1.8s into red phase.</p>
                      </div>

                      <div className="flex flex-col gap-1.5 rounded-xl border border-white/10 bg-black/60 p-2">
                        <img src={violation3} alt="Frame 03 Plate OCR" className="h-36 w-full rounded-lg object-cover" />
                        <span className="text-[10px] font-mono-tab font-bold text-emerald-400">FRAME 03 • ANPR PLATE CROP</span>
                        <p className="text-[10px] text-white/70">Plate: {selectedNov.plateNumber} (Confidence: 99.4%)</p>
                      </div>
                    </div>
                  </div>

                  {/* Violation Breakdown Table */}
                  <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <span className="text-white/40 block">Fine Base</span>
                        <span className="font-mono-tab text-white font-bold">{formatPeso(selectedNov.amount)}</span>
                      </div>
                      <div>
                        <span className="text-white/40 block">Late Surcharge</span>
                        <span className="font-mono-tab text-emerald-400 font-bold">₱0.00</span>
                      </div>
                      <div>
                        <span className="text-white/40 block">Total Due</span>
                        <span className="font-mono-tab text-lg font-black text-white">{formatPeso(selectedNov.amount)}</span>
                      </div>
                      <div>
                        <span className="text-white/40 block">Settlement Deadline</span>
                        <span className="font-mono-tab text-orange-400 font-bold">
                          {new Date(selectedNov.dueDate || Date.now() + 7 * 86400000).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

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
                    className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
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
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/20 bg-[#0e1017] p-8 shadow-2xl">
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

                  <div className="mt-6 space-y-2 text-xs text-white/80 border-t border-white/10 pt-4">
                    <p><strong>Issued To:</strong> {currentCitizen.fullName}</p>
                    <p><strong>Vehicle Plate:</strong> {clearedCitation.plateNumber}</p>
                    <p><strong>Resolved NOV:</strong> {clearedCitation.novNumber || clearedCitation.id}</p>
                    <p><strong>Violation:</strong> {clearedCitation.violation}</p>
                    <p><strong>Date Cleared:</strong> {new Date().toLocaleDateString()}</p>
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
                <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
                  <p className="text-[10px] font-mono-tab uppercase text-white/50">Citation Reference</p>
                  <p className="text-base font-bold text-white mt-0.5">{selectedCitationId || "CIT-00135"}</p>
                </div>

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
      </main>
    </div>
  );
}
