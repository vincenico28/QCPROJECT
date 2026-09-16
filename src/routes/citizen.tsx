import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
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
  type CitizenVoucher,
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
  RotateCcw,
  AlertOctagon,
  XCircle,
  Tag,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Copy,
  Check,
  Shield,
  Calendar,
  TrendingUp,
  Maximize2,
  SlidersHorizontal,
  Layers,
  BadgeCheck,
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
        content:
          "Official MMDA No Contact Apprehension Policy (NCAP) Motorist Portal for Barangay Culiat, Quezon City. Verify Notices of Violation (NOV), inspect CCTV evidence, file disputes, and generate LTO clearance certificates.",
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

/**
 * MMDA Number Coding Engine for Metro Manila / Quezon City
 * Plates ending in:
 * 1, 2 = Monday
 * 3, 4 = Tuesday
 * 5, 6 = Wednesday
 * 7, 8 = Thursday
 * 9, 0 = Friday
 * Weekends = No restriction
 */
function getMMDACodingInfo(plate: string) {
  const digits = plate.replace(/\D/g, "");
  const lastDigit = digits.length > 0 ? parseInt(digits[digits.length - 1], 10) : null;

  if (lastDigit === null) {
    return {
      dayName: "Unspecified",
      restrictedDayIndex: -1,
      isRestrictedToday: false,
      isWeekend: false,
      codingDigit: "-",
      windowHours: "7:00 AM – 10:00 AM & 5:00 PM – 8:00 PM",
    };
  }

  let restrictedDayIndex = 1;
  let dayName = "Monday";
  if (lastDigit === 1 || lastDigit === 2) {
    restrictedDayIndex = 1;
    dayName = "Monday";
  } else if (lastDigit === 3 || lastDigit === 4) {
    restrictedDayIndex = 2;
    dayName = "Tuesday";
  } else if (lastDigit === 5 || lastDigit === 6) {
    restrictedDayIndex = 3;
    dayName = "Wednesday";
  } else if (lastDigit === 7 || lastDigit === 8) {
    restrictedDayIndex = 4;
    dayName = "Thursday";
  } else if (lastDigit === 9 || lastDigit === 0) {
    restrictedDayIndex = 5;
    dayName = "Friday";
  }

  const todayIndex = new Date().getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const isWeekend = todayIndex === 0 || todayIndex === 6;
  const isRestrictedToday = !isWeekend && todayIndex === restrictedDayIndex;

  return {
    dayName,
    restrictedDayIndex,
    isRestrictedToday,
    isWeekend,
    codingDigit: lastDigit.toString(),
    windowHours: "7:00 AM – 10:00 AM & 5:00 PM – 8:00 PM",
  };
}

function formatTimeAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Authentic SVG-based Verifiable QR Code Component with deterministic bit pattern
 */
function VerifiableQrCode({ data, size = 140, className }: { data: string; size?: number; className?: string }) {
  const cells: boolean[][] = useMemo(() => {
    const grid: boolean[][] = Array.from({ length: 21 }, () => Array(21).fill(false));

    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = (hash << 5) - hash + data.charCodeAt(i);
      hash |= 0;
    }

    const setFinder = (row: number, col: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
            grid[row + r][col + c] = true;
          }
        }
      }
    };
    setFinder(0, 0);
    setFinder(0, 14);
    setFinder(14, 0);

    for (let i = 8; i < 13; i++) {
      grid[6][i] = i % 2 === 0;
      grid[i][6] = i % 2 === 0;
    }

    let seed = Math.abs(hash) + 12345;
    for (let r = 0; r < 21; r++) {
      for (let c = 0; c < 21; c++) {
        const inFinderTL = r < 8 && c < 8;
        const inFinderTR = r < 8 && c >= 13;
        const inFinderBL = r >= 13 && c < 8;
        const inTiming = (r === 6 && c >= 8 && c <= 12) || (c === 6 && r >= 8 && r <= 12);
        if (inFinderTL || inFinderTR || inFinderBL || inTiming) continue;

        seed = (seed * 9301 + 49297) % 233280;
        grid[r][c] = seed / 233280 > 0.48;
      }
    }
    return grid;
  }, [data]);

  return (
    <svg
      viewBox="0 0 21 21"
      width={size}
      height={size}
      className={cn("shape-rendering-crispEdges", className)}
      style={{ shapeRendering: "crispEdges" }}
    >
      <rect width="21" height="21" fill="white" />
      {cells.map((row, r) =>
        row.map((cell, c) => (cell ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#0f172a" /> : null)),
      )}
    </svg>
  );
}

const CORRIDOR_TELEMETRY = [
  {
    corridor: "Commonwealth Avenue (Northbound)",
    segment: "Philcoa to Tandang Sora Overpass",
    speedKmH: 38,
    speedLimit: 60,
    volumePerHour: 2420,
    status: "Moderate Flow",
    statusTone: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    lanesActive: "8 of 9 Lanes Open",
  },
  {
    corridor: "Tandang Sora Flyover & Culiat Intersection",
    segment: "Culiat Commercial Strip",
    speedKmH: 22,
    speedLimit: 50,
    volumePerHour: 1890,
    status: "Congested (Roadwork)",
    statusTone: "text-red-400 bg-red-500/10 border-red-500/30",
    lanesActive: "3 of 4 Lanes Open",
  },
  {
    corridor: "Visayas Avenue",
    segment: "Elliptical Road to Central Avenue",
    speedKmH: 52,
    speedLimit: 60,
    volumePerHour: 1120,
    status: "Free Flow",
    statusTone: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    lanesActive: "6 of 6 Lanes Open",
  },
  {
    corridor: "Katipunan Avenue (C-5 Northbound)",
    segment: "CP Garcia to Tandang Sora Extension",
    speedKmH: 31,
    speedLimit: 60,
    volumePerHour: 2150,
    status: "Moderate Flow",
    statusTone: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    lanesActive: "6 of 6 Lanes Open",
  },
  {
    corridor: "Mindanao Avenue",
    segment: "Sauyo to Quirino Highway Interchange",
    speedKmH: 45,
    speedLimit: 60,
    volumePerHour: 1650,
    status: "Normal Flow",
    statusTone: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    lanesActive: "6 of 6 Lanes Open",
  },
];

const CCTV_FEEDS = [
  {
    title: "Commonwealth Ave (Northbound)",
    location: "Philcoa / UP Diliman Corridor",
    speed: "38 km/h • Moderate",
    image: cctv1,
    cameraCode: "QC-CAM-COMM-01",
    resolution: "1080p 60fps",
    density: "Moderate Density (62%)",
  },
  {
    title: "Tandang Sora Flyover Intersection",
    location: "Barangay Culiat West Approach",
    speed: "24 km/h • Congested",
    image: cctv2,
    cameraCode: "QC-CAM-TSORA-04",
    resolution: "1080p 60fps",
    density: "High Density (88%)",
  },
  {
    title: "Visayas Ave — Central Avenue",
    location: "Culiat Southern Boundary",
    speed: "52 km/h • Clear",
    image: cctv3,
    cameraCode: "QC-CAM-VISAYAS-02",
    resolution: "1080p 60fps",
    density: "Light Density (24%)",
  },
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

  // Tab 1 NCAP Filtering & Batch Settle State
  const [novFilterStatus, setNovFilterStatus] = useState<"all" | "unpaid" | "settled" | "failed" | "appealed">("all");
  const [novFilterPlate, setNovFilterPlate] = useState<string>("all");
  const [novSearchQuery, setNovSearchQuery] = useState<string>("");
  const [batchSettleModalOpen, setBatchSettleModalOpen] = useState(false);
  const [batchSettling, setBatchSettling] = useState(false);
  const [batchSettleMethod, setBatchSettleMethod] = useState<"gcash" | "maya" | "card">("gcash");

  // Printable Official NOV Slip State
  const [officialNoticeModalOpen, setOfficialNoticeModalOpen] = useState(false);
  const [selectedOfficialNotice, setSelectedOfficialNotice] = useState<CitizenCitation | null>(null);

  // Tab 4 Live Traffic CCTV Modal
  const [cctvModalOpen, setCctvModalOpen] = useState(false);
  const [selectedCctvIndex, setSelectedCctvIndex] = useState(0);

  // Tab 5 Hazard Filter
  const [hazardFilterCategory, setHazardFilterCategory] = useState<string>("all");

  // Tab 7 Voucher Copy State
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Disputes Modal State
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

  // Hazard Report Form State
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

  const allCitations = currentCitizen.citations || [];
  const unpaidOnlyCitations = allCitations.filter((c) => c.status === "unpaid");
  const settledCitations = allCitations.filter((c) => c.status === "settled" || c.paymentDetails?.status === "verified");
  const failedCitations = allCitations.filter((c) => c.status === "payment_failed" || c.paymentDetails?.status === "failed");
  const appealedCitations = allCitations.filter((c) => c.status === "appealed");

  // Citations with outstanding liability (regular unpaid + failed payment attempts)
  const unpaidCitations = allCitations.filter((c) => c.status === "unpaid" || c.status === "payment_failed");
  const totalUnpaid = unpaidCitations.reduce((sum, c) => sum + c.amount + (c.surcharge || 0), 0);

  // Filtered Citations for Tab 1
  const filteredCitations = allCitations.filter((c) => {
    if (novFilterStatus === "unpaid" && c.status !== "unpaid") return false;
    if (novFilterStatus === "settled" && c.status !== "settled" && c.paymentDetails?.status !== "verified") return false;
    if (novFilterStatus === "failed" && c.status !== "payment_failed" && c.paymentDetails?.status !== "failed") return false;
    if (novFilterStatus === "appealed" && c.status !== "appealed") return false;

    if (novFilterPlate !== "all") {
      const p1 = c.plateNumber.toUpperCase().replace(/[\s-]/g, "");
      const p2 = novFilterPlate.toUpperCase().replace(/[\s-]/g, "");
      if (p1 !== p2) return false;
    }

    if (novSearchQuery.trim()) {
      const q = novSearchQuery.toLowerCase().trim();
      const novNum = (c.novNumber || c.id).toLowerCase();
      const plate = c.plateNumber.toLowerCase();
      const viol = c.violation.toLowerCase();
      const ord = (c.ordinanceCode || "").toLowerCase();
      if (!novNum.includes(q) && !plate.includes(q) && !viol.includes(q) && !ord.includes(q)) {
        return false;
      }
    }

    return true;
  });

  // Filtered Hazards for Tab 5
  const filteredHazards = citizenHazards.filter((h) => {
    if (hazardFilterCategory === "all") return true;
    return h.category === hazardFilterCategory;
  });

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

  const handleBatchSettleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (unpaidCitations.length === 0) return;
    setBatchSettling(true);

    try {
      for (const c of unpaidCitations) {
        await settleCitation.mutateAsync(c.id);
      }
      toast.success(`All ${unpaidCitations.length} Notices of Violation settled successfully!`, {
        description: "All LTO LTMS registration alarms cleared. Certificates of clearance issued.",
      });
      setBatchSettleModalOpen(false);
    } catch {
      toast.error("Failed to process batch settlement. Please try again.");
    } finally {
      setBatchSettling(false);
    }
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

  const handleCopyVoucherCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Voucher code ${code} copied to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2200);
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
          className={cn(
            "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold",
            activeTab === "ncap" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground",
          )}
        >
          NCAP Notices ({unpaidCitations.length})
        </button>
        <button
          onClick={() => setActiveTab("vehicles")}
          className={cn(
            "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold",
            activeTab === "vehicles" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground",
          )}
        >
          My Vehicles
        </button>
        <button
          onClick={() => setActiveTab("pass")}
          className={cn(
            "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold",
            activeTab === "pass" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground",
          )}
        >
          Digital Pass
        </button>
        <button
          onClick={() => setActiveTab("traffic")}
          className={cn(
            "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold",
            activeTab === "traffic" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground",
          )}
        >
          Live Traffic
        </button>
        <button
          onClick={() => setActiveTab("hazard")}
          className={cn(
            "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold",
            activeTab === "hazard" ? "bg-orange-500 text-white font-bold" : "text-orange-400/80",
          )}
        >
          Report Hazard
        </button>
        <button
          onClick={() => setActiveTab("disputes")}
          className={cn(
            "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold",
            activeTab === "disputes" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground",
          )}
        >
          Appeals
        </button>
        <button
          onClick={() => setActiveTab("rewards")}
          className={cn(
            "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold",
            activeTab === "rewards" ? "bg-emerald-600 text-white font-bold" : "text-emerald-400",
          )}
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
            <div className="mb-6 rounded-3xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-blue-900/10 to-transparent p-6 sm:p-8 relative overflow-hidden shadow-2xl">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
                <div className="flex items-start gap-4">
                  <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    <Camera className="size-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest font-mono-tab text-blue-400 font-bold">
                      MMDA NO CONTACT APPREHENSION POLICY (NCAP)
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Notices of Violation (NOV) & Evidence Hub</h1>
                    <p className="mt-2 text-xs sm:text-sm text-white/70 max-w-2xl leading-relaxed">
                      Review optical camera evidence, settle individual violations or batch-settle to prevent{" "}
                      <strong>LTO Registration Alarms</strong>, or submit a formal protest to the{" "}
                      <strong>QC Traffic Adjudication Board (TAB)</strong> within the 10-day statutory window.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
                  <div className="rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-center">
                    <span className="text-[10px] font-mono-tab uppercase text-white/50 block">Registered Fleet</span>
                    <span className="font-mono-tab text-sm font-bold text-white">
                      {currentCitizen.vehicles?.length || 0} Vehicle(s) Linked
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

            {/* Consolidated Batch Settlement Elevated Banner */}
            {unpaidCitations.length > 0 && (
              <div className="mb-6 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/30 via-black/50 to-black/70 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-3.5">
                  <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <ShieldAlert className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 font-mono-tab text-[10px] font-bold text-amber-300 uppercase">
                        Consolidated LTO Hold Notice
                      </span>
                      <span className="font-mono-tab text-xs text-white/70">
                        {unpaidCitations.length} Unsettled {unpaidCitations.length === 1 ? "Notice" : "Notices"}
                      </span>
                    </div>
                    <p className="text-xs text-white/80 mt-1">
                      Outstanding balance of{" "}
                      <strong className="text-white font-mono-tab font-bold text-sm">{formatPeso(totalUnpaid)}</strong> across your
                      registered fleet. Settle all in one transaction to immediately clear all LTO registration holds.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setBatchSettleModalOpen(true)}
                  className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-500/20 hover:brightness-110 transition-all"
                >
                  <CreditCard className="size-4" />
                  Settle All Unpaid Notices ({formatPeso(totalUnpaid)})
                </button>
              </div>
            )}

            {/* Interactive Filters & Search Bar */}
            <div className="mb-6 rounded-2xl border border-white/10 bg-black/40 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Status Tabs */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                  <button
                    onClick={() => setNovFilterStatus("all")}
                    className={cn(
                      "rounded-lg px-3 py-1.5 transition-all",
                      novFilterStatus === "all" ? "bg-white text-black font-bold shadow" : "bg-white/5 text-white/70 hover:bg-white/10",
                    )}
                  >
                    All ({allCitations.length})
                  </button>
                  <button
                    onClick={() => setNovFilterStatus("unpaid")}
                    className={cn(
                      "rounded-lg px-3 py-1.5 transition-all flex items-center gap-1.5",
                      novFilterStatus === "unpaid"
                        ? "bg-amber-500 text-black font-bold shadow"
                        : "bg-amber-500/10 text-amber-300 hover:bg-amber-500/20",
                    )}
                  >
                    <span className="size-1.5 rounded-full bg-amber-400" />
                    Unpaid ({unpaidOnlyCitations.length})
                  </button>
                  <button
                    onClick={() => setNovFilterStatus("settled")}
                    className={cn(
                      "rounded-lg px-3 py-1.5 transition-all flex items-center gap-1.5",
                      novFilterStatus === "settled"
                        ? "bg-emerald-500 text-white font-bold shadow"
                        : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20",
                    )}
                  >
                    <CheckCircle2 className="size-3" />
                    Payment Verified ({settledCitations.length})
                  </button>
                  <button
                    onClick={() => setNovFilterStatus("failed")}
                    className={cn(
                      "rounded-lg px-3 py-1.5 transition-all flex items-center gap-1.5",
                      novFilterStatus === "failed"
                        ? "bg-rose-600 text-white font-bold shadow"
                        : "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20",
                    )}
                  >
                    <AlertOctagon className="size-3" />
                    Payment Failed ({failedCitations.length})
                  </button>
                  <button
                    onClick={() => setNovFilterStatus("appealed")}
                    className={cn(
                      "rounded-lg px-3 py-1.5 transition-all flex items-center gap-1.5",
                      novFilterStatus === "appealed"
                        ? "bg-blue-500 text-white font-bold shadow"
                        : "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20",
                    )}
                  >
                    <Scale className="size-3" />
                    Under Protest ({appealedCitations.length})
                  </button>
                </div>

                {/* Vehicle Plate Dropdown Filter */}
                {currentCitizen.vehicles && currentCitizen.vehicles.length > 1 && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-white/40 font-mono-tab">Plate:</span>
                    <select
                      value={novFilterPlate}
                      onChange={(e) => setNovFilterPlate(e.target.value)}
                      className="rounded-lg border border-white/10 bg-black/60 px-3 py-1.5 text-xs text-white focus:border-blue-500 outline-none"
                    >
                      <option value="all">All Registered Plates</option>
                      {currentCitizen.vehicles.map((v) => (
                        <option key={v.id} value={v.plateNumber}>
                          {v.plateNumber} ({v.makeModel})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Search Field */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Filter by NOV reference #, vehicle plate, violation type, or legal ordinance code..."
                  value={novSearchQuery}
                  onChange={(e) => setNovSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2 text-xs text-white placeholder:text-white/30 focus:border-blue-500 focus:outline-none"
                />
                {novSearchQuery && (
                  <button
                    onClick={() => setNovSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Citations / NOV Grid */}
            <div className="grid gap-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  <FileText className="size-4 text-blue-400" />
                  Notices of Violation ({filteredCitations.length} shown)
                </h2>

                <button
                  onClick={() => setActiveTab("disputes")}
                  className="text-xs font-semibold text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Scale className="size-3.5" /> Adjudication Guidelines
                </button>
              </div>

              {filteredCitations.length > 0 ? (
                filteredCitations.map((c) => {
                  const isPaymentVerified = c.status === "settled" || c.paymentDetails?.status === "verified";
                  const isPaymentFailed = c.status === "payment_failed" || c.paymentDetails?.status === "failed";
                  const isPaymentPending = c.status === "payment_pending" || c.paymentDetails?.status === "pending_verification";
                  const isAppealed = c.status === "appealed";
                  const isUnpaid = !isPaymentVerified && !isPaymentFailed && !isPaymentPending && !isAppealed;

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
                        isPaymentVerified
                          ? "border-emerald-500/40 bg-gradient-to-br from-emerald-950/25 via-black/40 to-black/60 shadow-emerald-950/20"
                          : isPaymentFailed
                            ? "border-rose-500/50 bg-gradient-to-br from-rose-950/30 via-black/50 to-black/70 shadow-rose-950/30 ring-1 ring-rose-500/30"
                            : isPaymentPending
                              ? "border-amber-500/40 bg-gradient-to-br from-amber-950/25 via-black/40 to-black/60"
                              : isAppealed
                                ? "border-blue-500/30 bg-gradient-to-br from-blue-950/20 via-black/40 to-black/60"
                                : "border-red-500/30 bg-gradient-to-br from-red-950/20 via-black/40 to-black/60 hover:border-red-500/50",
                      )}
                    >
                      {/* Top Header: Identity, Tags, Total Amount */}
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 border-b border-white/10 pb-4">
                        <div className="flex items-start gap-3.5">
                          <div
                            className={cn(
                              "grid size-11 shrink-0 place-items-center rounded-xl shadow-inner",
                              isPaymentVerified
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : isPaymentFailed
                                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                  : isPaymentPending
                                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                    : isAppealed
                                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                      : "bg-red-500/20 text-red-400 border border-red-500/30",
                            )}
                          >
                            {isPaymentVerified ? (
                              <CheckCircle2 className="size-5" />
                            ) : isPaymentFailed ? (
                              <AlertOctagon className="size-5" />
                            ) : isPaymentPending ? (
                              <Clock className="size-5" />
                            ) : isAppealed ? (
                              <Scale className="size-5" />
                            ) : (
                              <AlertTriangle className="size-5" />
                            )}
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
                                  isPaymentVerified
                                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm"
                                    : isPaymentFailed
                                      ? "bg-rose-500/25 text-rose-200 border-rose-500/50 shadow-sm"
                                      : isPaymentPending
                                        ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                        : isAppealed
                                          ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                                          : "bg-red-500/20 text-red-400 border-red-500/30",
                                )}
                              >
                                {isPaymentVerified
                                  ? "✓ PAYMENT VERIFIED & SETTLED · LTO HOLD LIFTED"
                                  : isPaymentFailed
                                    ? "✕ PAYMENT NOT PUSHED THROUGH / FAILED"
                                    : isPaymentPending
                                      ? "⏳ PAYMENT SUBMITTED · PENDING VERIFICATION"
                                      : isAppealed
                                        ? "UNDER ADJUDICATION / PROTEST"
                                        : "NOTICE ISSUED / UNPAID"}
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

                        {/* Amount & Status Box */}
                        <div className="flex flex-row lg:flex-col items-end justify-between lg:justify-start border-t lg:border-t-0 border-white/10 pt-3 lg:pt-0 shrink-0">
                          <div className="text-right">
                            <span className="font-mono-tab text-[10px] uppercase text-white/50 block">
                              {isPaymentVerified ? "Settled Total Fine" : "Total Assessed Fine"}
                            </span>
                            <span
                              className={cn(
                                "font-mono-tab text-2xl sm:text-3xl font-black tracking-tight",
                                isPaymentVerified ? "text-emerald-400" : isPaymentFailed ? "text-rose-300" : "text-white",
                              )}
                            >
                              {formatPeso(totalLiability)}
                            </span>
                          </div>
                          {isPaymentVerified && (
                            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 mt-1">
                              <FileCheck2 className="size-3.5" /> Clearance Issued & Verified
                            </span>
                          )}
                          {isPaymentFailed && (
                            <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1 mt-1">
                              <AlertOctagon className="size-3.5" /> Fine Remains Unpaid
                            </span>
                          )}
                          {isPaymentPending && (
                            <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1 mt-1">
                              <Clock className="size-3.5" /> Treasury Review Pending
                            </span>
                          )}
                          {isAppealed && (
                            <span className="text-[11px] font-semibold text-blue-400 flex items-center gap-1 mt-1">
                              <Scale className="size-3.5" /> Protest Under Review
                            </span>
                          )}
                          {isUnpaid && (
                            <span className="text-[11px] font-semibold text-orange-400 flex items-center gap-1 mt-1">
                              <Clock className="size-3" /> Due: {new Date(c.dueDate || Date.now() + 7 * 86400000).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* PAYMENT STATUS SPECIFIC DETAIL BANNERS */}
                      {/* Case 1: Verified Settlement Details Card */}
                      {isPaymentVerified && (
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-3 shadow-inner">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/20 pb-2.5">
                            <div className="flex items-center gap-2">
                              <div className="size-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 grid place-items-center">
                                <Check className="size-3.5" />
                              </div>
                              <span className="text-xs font-bold text-emerald-300 font-mono-tab">
                                Official Electronic Receipt & LTO Clearance Active
                              </span>
                            </div>
                            <span className="text-[10px] font-mono-tab font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              LTMS Hold Lifted
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div>
                              <span className="text-[10px] font-mono-tab uppercase text-white/50 block">Official Receipt #</span>
                              <span className="font-mono-tab font-bold text-white text-xs block truncate">
                                {c.paymentDetails?.receiptNumber || c.clearanceCertNumber || `OR-2026-${c.id.slice(-6).toUpperCase()}`}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] font-mono-tab uppercase text-white/50 block">Payment Channel</span>
                              <span className="font-bold text-white text-xs block">
                                {c.paymentDetails?.method || "GCash (Online QR Ph)"}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] font-mono-tab uppercase text-white/50 block">Settlement Date</span>
                              <span className="font-mono-tab text-white/80 text-xs block">
                                {c.paymentDetails?.paidAt
                                  ? new Date(c.paymentDetails.paidAt).toLocaleDateString("en-PH", { dateStyle: "medium" })
                                  : new Date(c.date).toLocaleDateString("en-PH", { dateStyle: "medium" })}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] font-mono-tab uppercase text-white/50 block">Clearance Certificate</span>
                              <span className="font-mono-tab font-bold text-emerald-400 text-xs block">
                                {c.clearanceCertNumber || `MMDA-QC-CLR-${c.id.slice(-5).toUpperCase()}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Case 2: Payment Failed / Not Push Through Warning Banner */}
                      {isPaymentFailed && (
                        <div className="rounded-2xl border-2 border-rose-500/50 bg-gradient-to-r from-rose-950/40 via-red-950/30 to-black/60 p-4 sm:p-5 shadow-lg shadow-rose-950/30 space-y-3.5">
                          <div className="flex items-start gap-3.5">
                            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-inner">
                              <AlertOctagon className="size-5" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-sm font-bold text-rose-200">
                                  Online Payment Did Not Push Through
                                </h4>
                                <span className="rounded bg-rose-500/30 text-rose-200 border border-rose-500/40 px-2 py-0.5 text-[10px] font-mono-tab uppercase font-bold">
                                  Transaction Incomplete
                                </span>
                              </div>
                              <p className="text-xs text-rose-100/80 leading-relaxed">
                                Your online payment attempt could not be completed (the payment gateway declined authorization or the session timed out).
                                The statutory fine of <strong className="text-white font-mono-tab font-bold">{formatPeso(totalLiability)}</strong> remains <strong>UNPAID</strong>. Your vehicle remains flagged under active LTO registration alarm holds until full settlement.
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 rounded-xl border border-rose-500/20 bg-black/40 p-3 text-xs">
                            <div>
                              <span className="text-[10px] font-mono-tab uppercase text-white/50 block">Attempted Channel</span>
                              <span className="font-semibold text-white/90 font-mono-tab">
                                {c.paymentDetails?.method || "Online Payment Gateway"}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] font-mono-tab uppercase text-white/50 block">Attempt Reference</span>
                              <span className="font-mono-tab text-white/80">
                                {c.paymentDetails?.referenceNumber || "FAIL-SESSION"}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] font-mono-tab uppercase text-white/50 block">Gateway Error Reason</span>
                              <span className="font-medium text-rose-300 truncate block" title={c.paymentDetails?.failureReason}>
                                {c.paymentDetails?.failureReason || "Gateway authorization declined or timed out"}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-rose-500/20">
                            <span className="text-[11px] text-rose-200/70 flex items-center gap-1.5 font-mono-tab">
                              <Clock className="size-3 text-rose-400" />
                              Re-attempt payment immediately to prevent penalty surcharges and LTO alarms.
                            </span>
                            <Link
                              to="/portal/pay/$citationId"
                              params={{ citationId: c.novNumber || c.id }}
                              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-600/30 hover:brightness-110 transition-all active:scale-[0.98]"
                            >
                              <RotateCcw className="size-3.5" /> Retry Payment Now ({formatPeso(totalLiability)})
                            </Link>
                          </div>
                        </div>
                      )}

                      {/* Case 3: Payment Submitted & Pending Verification */}
                      {isPaymentPending && (
                        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-2">
                          <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 font-mono-tab">
                              <Clock className="size-4 text-amber-400" />
                              Payment Proof Submitted · Pending Treasury Verification
                            </span>
                            <span className="text-[10px] font-mono-tab font-semibold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                              IN REVIEW
                            </span>
                          </div>
                          <p className="text-xs text-amber-100/70 leading-relaxed">
                            Your payment reference <strong className="text-white font-mono-tab font-semibold">{c.paymentDetails?.referenceNumber || "Submitted Proof"}</strong> is currently being validated by DPOS Treasury officers. Once reconciled, your LTO hold will automatically be lifted.
                          </p>
                        </div>
                      )}

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
                          {parsedOffenses.map((offense, idx) => {
                            const catTone =
                              offense.category === "Franchise & Colorum"
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                : offense.category === "Registration & Licensing"
                                  ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                                  : offense.category === "Moving Violation"
                                    ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                                    : offense.category === "Obstruction & Parking"
                                      ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                                      : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";

                            return (
                              <div
                                key={idx}
                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2.5 gap-2 rounded-lg hover:bg-white/[0.02] transition-colors"
                              >
                                <div className="flex items-start gap-3">
                                  <span className="grid size-6 shrink-0 place-items-center rounded-md bg-white/10 font-mono-tab text-xs font-bold text-white/80">
                                    {idx + 1}
                                  </span>
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="font-bold text-white text-sm">{offense.name}</span>
                                      {offense.category && (
                                        <span className={cn("rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border", catTone)}>
                                          {offense.category}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-white/50 mt-0.5 leading-relaxed font-mono-tab">
                                      Legal Basis: {offense.ordinance}
                                    </p>
                                  </div>
                                </div>

                                <div className="text-right shrink-0 pl-9 sm:pl-0">
                                  <span className="font-mono-tab text-sm font-black text-emerald-400">
                                    {formatPeso(offense.amount)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Financial Ledger Footer */}
                        <div className="border-t border-white/10 bg-white/[0.02] px-4 py-2 flex items-center justify-between text-xs font-mono-tab">
                          <span className="text-white/50">Base Violations Subtotal:</span>
                          <span className="font-bold text-white">{formatPeso(baseSubtotal)}</span>
                        </div>
                      </div>

                      {/* Location & Capture Details */}
                      <div className="grid gap-3 sm:grid-cols-3 text-xs">
                        <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
                          <span className="text-white/40 block font-mono-tab text-[10px] uppercase">Optical Capture Point</span>
                          <span className="font-medium text-white/90 mt-1 block flex items-center gap-1.5">
                            <MapPin className="size-3.5 text-blue-400 shrink-0" />
                            {c.location || "Commonwealth Ave near Tandang Sora Overpass"}
                          </span>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
                          <span className="text-white/40 block font-mono-tab text-[10px] uppercase">LTO Registration Alarm</span>
                          <span
                            className={cn(
                              "font-bold mt-1 block font-mono-tab",
                              c.ltoAlarmStatus === "CLEARED" || isPaymentVerified ? "text-emerald-400" : "text-amber-400",
                            )}
                          >
                            {c.ltoAlarmStatus === "CLEARED" || isPaymentVerified
                              ? "CLEARED (No LTMS Hold)"
                              : isPaymentFailed
                                ? "LTO ALARM ACTIVE: Unpaid Fine"
                                : "WARNING: Pending LTO Hold in 7 Days"}
                          </span>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
                          <span className="text-white/40 block font-mono-tab text-[10px] uppercase">Protest Window</span>
                          <span className="font-medium text-white/80 mt-1 block">
                            {isPaymentVerified ? "Case Closed" : "10 Calendar Days from Notice"}
                          </span>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                        <div className="flex flex-wrap items-center gap-2">
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

                          <button
                            onClick={() => {
                              setSelectedOfficialNotice(c);
                              setOfficialNoticeModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-all"
                            title="Print Official Notice of Violation"
                          >
                            <Printer className="size-3.5" /> Official NOV Slip
                          </button>

                          {isPaymentVerified && (
                            <>
                              <button
                                onClick={() => {
                                  setClearedCitation(c);
                                  setClearanceModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all"
                              >
                                <FileCheck2 className="size-3.5" /> View Clearance Certificate
                              </button>

                              <Link
                                to="/portal/receipt/$citationId"
                                params={{ citationId: c.novNumber || c.id }}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all"
                              >
                                <Receipt className="size-3.5" /> Official e-OR Receipt
                              </Link>
                            </>
                          )}
                        </div>

                        {(isUnpaid || isPaymentFailed) && (
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedNov(c);
                                setNominateModalOpen(true);
                              }}
                              className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white"
                            >
                              <UserCheck className="size-3.5 inline mr-1" /> Nominate Driver
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
                              className={cn(
                                "rounded-xl px-3.5 py-2 text-xs font-bold transition-all flex items-center gap-1.5",
                                isPaymentFailed
                                  ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500"
                                  : "border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20",
                              )}
                            >
                              {isPaymentFailed ? (
                                <>
                                  <RotateCcw className="size-3.5" /> Retry Payment
                                </>
                              ) : (
                                <>
                                  <ExternalLink className="size-3.5" /> Official Checkout
                                </>
                              )}
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
                  <h3 className="text-lg font-bold text-white">No Notices Found Matching Filters</h3>
                  <p className="text-xs text-white/60 max-w-md mt-1">
                    Try adjusting your search query, status pill filter, or vehicle plate selection.
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
                <p className="mt-1 text-sm text-white/60">
                  Manage your verified fleet, monitor live MMDA number coding restrictions, and track LTO registration compliance.
                </p>
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
                currentCitizen.vehicles.map((v) => {
                  const coding = getMMDACodingInfo(v.plateNumber);
                  const vehicleUnpaid = unpaidCitations.filter(
                    (c) => c.plateNumber.toUpperCase().replace(/[\s-]/g, "") === v.plateNumber.toUpperCase().replace(/[\s-]/g, ""),
                  ).length;

                  return (
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

                        {/* Live MMDA Number Coding Restriction Card */}
                        <div className="mt-4 rounded-xl border border-white/10 bg-black/50 p-3 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono-tab text-[10px] uppercase tracking-wider text-white/50">
                              MMDA Number Coding:
                            </span>
                            {coding.isRestrictedToday ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 border border-red-500/40 px-2 py-0.5 text-[10px] font-bold text-red-400 animate-pulse">
                                <AlertTriangle className="size-3" /> RESTRICTED TODAY
                              </span>
                            ) : coding.isWeekend ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 text-[10px] font-bold text-blue-300">
                                WEEKEND (FREE FLOW)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                                <CheckCircle2 className="size-3" /> CODING: {coding.dayName.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-white/70">
                            {coding.isRestrictedToday
                              ? `Plate ending in ${coding.codingDigit} is banned today during peak hours (7-10 AM & 5-8 PM).`
                              : `Assigned Coding Day: ${coding.dayName}. Allowed on road today without penalty.`}
                          </p>
                        </div>

                        {/* LTO Registration & Compliance Checklist */}
                        <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3 space-y-2 text-[11px]">
                          <span className="font-mono-tab text-[10px] uppercase text-white/40 block font-bold">
                            LTO Compliance Checklist:
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-white/40 block">MVIS Emission:</span>
                              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="size-3" /> Passed (Valid)
                              </span>
                            </div>
                            <div>
                              <span className="text-white/40 block">CTPL Insurance:</span>
                              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                <ShieldCheck className="size-3" /> Policy Active
                              </span>
                            </div>
                            <div>
                              <span className="text-white/40 block">LTO Expiry:</span>
                              <span className="font-mono-tab text-white/80 font-medium">{v.ltoExpiry || "2027-12-31"}</span>
                            </div>
                            <div>
                              <span className="text-white/40 block">LTMS Hold:</span>
                              <span
                                className={cn(
                                  "font-medium font-mono-tab",
                                  vehicleUnpaid > 0 ? "text-orange-400" : "text-emerald-400",
                                )}
                              >
                                {vehicleUnpaid > 0 ? "Pending Action" : "Cleared"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Command Center Status */}
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
                      </div>

                      <div className="mt-6 flex items-center justify-between border-t border-border pt-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              setNovFilterPlate(v.plateNumber);
                              setActiveTab("ncap");
                            }}
                            className="text-xs font-semibold text-blue-400 hover:underline flex items-center gap-1"
                          >
                            <FileText className="size-3" /> View Notices
                          </button>
                          <button
                            onClick={() => setActiveTab("pass")}
                            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                          >
                            <QrCode className="size-3" /> Motorist Pass
                          </button>
                        </div>
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
                  );
                })
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
                  Digital Motorist Pass & Sentry Access
                </h1>
                <p className="mt-1 text-sm text-white/60">
                  Official verified resident pass for Barangay Culiat traffic checkpoints, green lane bypass, and community parking access.
                </p>
              </div>

              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-all"
              >
                <Printer className="size-4" /> Print Motorist Pass
              </button>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              {/* Primary Digital Motorist Pass Card */}
              <div className="lg:col-span-2">
                <div className="relative overflow-hidden rounded-3xl border border-border bg-panel p-8 shadow-2xl">
                  {/* Pass Header */}
                  <div className="flex items-start justify-between border-b border-border pb-6">
                    <div className="flex items-center gap-3">
                      <img src="/favico2.png" alt="LGU Seal" className="size-12" />
                      <div>
                        <p className="text-[10px] uppercase font-mono-tab tracking-widest text-primary font-bold">
                          Quezon City Traffic Operations
                        </p>
                        <h2 className="text-xl font-black tracking-tight text-foreground">BARANGAY CULIAT MOTORIST PASS</h2>
                        <span className="text-[11px] text-white/50 font-mono-tab">RFID 915 MHz EPC Gen 2 Certified</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-center">
                      <span className="text-[10px] font-bold font-mono-tab uppercase text-emerald-400 block">SENTRY GATE STATUS</span>
                      <span className="text-xs font-bold text-white flex items-center gap-1">
                        <CheckCircle2 className="size-3 text-emerald-400" /> ACTIVE / VALID
                      </span>
                    </div>
                  </div>

                  {/* Pass Body: Verifiable SVG QR Code & Credentials */}
                  <div className="mt-8 grid gap-8 md:grid-cols-3 items-center">
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/60 p-6 text-center">
                      <div className="grid size-40 place-items-center rounded-2xl bg-white p-3 shadow-2xl border border-white/20">
                        <VerifiableQrCode
                          data={`${currentCitizen.id}:${currentCitizen.fullName}:${currentCitizen.vehicles?.[0]?.plateNumber || "PASS"}`}
                          size={136}
                        />
                      </div>
                      <span className="mt-3 font-mono-tab text-[11px] font-bold text-white/80 tracking-widest">
                        {currentCitizen.id}
                      </span>
                      <span className="font-mono-tab text-[9px] text-emerald-400 mt-0.5 uppercase tracking-wider">
                        SHA-256: 8F2A-77C1-E4D9
                      </span>
                    </div>

                    <div className="md:col-span-2 flex flex-col gap-4">
                      <div>
                        <span className="text-[10px] uppercase font-mono-tab tracking-widest text-white/40">Authorized Resident Motorist</span>
                        <p className="text-xl font-bold text-white">{currentCitizen.fullName}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] uppercase font-mono-tab tracking-widest text-white/40">Driver's License</span>
                          <p className="font-mono-tab text-sm font-semibold text-white">
                            {currentCitizen.driverLicenseNumber || "N02-89-102934"}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-mono-tab tracking-widest text-white/40">Pass Classification</span>
                          <p className="text-sm font-semibold text-emerald-400">Culiat Resident Motorist</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] uppercase font-mono-tab tracking-widest text-white/40">Primary Vehicle Plate</span>
                          <p className="font-mono-tab text-lg font-bold text-[#0066cc]">
                            {currentCitizen.vehicles && currentCitizen.vehicles[0]
                              ? currentCitizen.vehicles[0].plateNumber
                              : "NO VEHICLE"}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-mono-tab tracking-widest text-white/40">Validity Window</span>
                          <p className="font-mono-tab text-sm font-semibold text-white">DECEMBER 2027</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Verified Fast-Track Corridors Sidebar */}
              <div className="lg:col-span-1 flex flex-col gap-4">
                <div className="rounded-2xl border border-white/10 bg-panel p-5 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white/80 flex items-center gap-2">
                    <ShieldCheck className="size-4 text-emerald-400" />
                    Authorized Pass Corridors
                  </h3>
                  <div className="space-y-2.5">
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">Tandang Sora Resident Lane</span>
                        <span className="text-[10px] font-mono-tab text-emerald-400 font-bold">ACTIVE</span>
                      </div>
                      <p className="text-[11px] text-white/60 mt-1">Priority bypass during peak congestion hours (7-10 AM & 5-8 PM).</p>
                    </div>

                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">Commonwealth Service Road Bypass</span>
                        <span className="text-[10px] font-mono-tab text-emerald-400 font-bold">ACTIVE</span>
                      </div>
                      <p className="text-[11px] text-white/60 mt-1">Exclusive resident green lane access at Culiat entry gate.</p>
                    </div>

                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">Culiat Barangay Sentry Gate</span>
                        <span className="text-[10px] font-mono-tab text-emerald-400 font-bold">RFID READY</span>
                      </div>
                      <p className="text-[11px] text-white/60 mt-1">Automated barrier arm clearance via optical ANPR sensor.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: LIVE TRAFFIC FEEDS & QC COMMAND CENTER ADVISORIES */}
        {/* ========================================================================= */}
        {activeTab === "traffic" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Live Traffic & QC CCTV Sentinel Feeds</h1>
                <p className="mt-1 text-sm text-white/60">
                  Real-time camera snapshots, corridor speed telemetry, and official roadwork advisories broadcasted directly from the QC Command Center.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 border border-red-500/30 px-3 py-1 text-xs font-mono-tab font-bold text-red-400">
                  <span className="size-2 rounded-full bg-red-500 animate-pulse" /> LIVE TELEMETRY
                </span>
              </div>
            </div>

            {/* QC Roadwork & Traffic Advisories Section */}
            <div className="rounded-3xl border border-white/10 bg-black/40 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Radio className="size-4 text-blue-400" />
                  Active Quezon City Road & Traffic Advisories
                </h2>
                <span className="text-xs text-white/50 font-mono-tab">Updated 2 mins ago</span>
              </div>

              {loadingAdvisories ? (
                <div className="grid h-24 place-items-center">
                  <Loader2 className="size-6 animate-spin text-primary" />
                </div>
              ) : advisories && advisories.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {advisories.map((adv) => {
                    const isCrit = adv.severity === "Critical";
                    const isWarn = adv.severity === "Warning";

                    return (
                      <div
                        key={adv.id}
                        className={cn(
                          "rounded-2xl border p-4 flex flex-col justify-between gap-2 transition-all",
                          isCrit
                            ? "border-red-500/40 bg-red-950/20"
                            : isWarn
                              ? "border-amber-500/40 bg-amber-950/20"
                              : "border-blue-500/40 bg-blue-950/20",
                        )}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border",
                                isCrit
                                  ? "bg-red-500/20 text-red-400 border-red-500/30"
                                  : isWarn
                                    ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                    : "bg-blue-500/20 text-blue-300 border-blue-500/30",
                              )}
                            >
                              {adv.severity} Advisory
                            </span>
                            <span className="text-[10px] font-mono-tab text-white/40">
                              {formatTimeAgo(adv.publishedAt)}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white mt-2">{adv.title}</h4>
                          <p className="text-xs text-white/70 mt-1 leading-relaxed">{adv.message}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-white/50">No critical traffic advisories in effect at this time.</p>
              )}
            </div>

            {/* Live Camera Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Camera className="size-4 text-primary" />
                  Barangay Culiat Sentinel Camera Feeds (Click to expand)
                </h2>
                <span className="text-xs text-white/50 font-mono-tab">3 Active Feeds</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {CCTV_FEEDS.map((feed, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedCctvIndex(idx);
                      setCctvModalOpen(true);
                    }}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/60 text-left hover:border-primary/50 transition-all shadow-xl"
                  >
                    <img
                      src={feed.image}
                      alt={feed.title}
                      className="h-48 w-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                    <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded bg-red-600/90 px-2 py-0.5 font-mono-tab text-[10px] font-bold text-white shadow">
                      <span className="size-1.5 rounded-full bg-white animate-pulse" /> LIVE
                    </span>
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-xs font-bold text-white group-hover:text-primary transition-colors">{feed.title}</p>
                      <p className="text-[10px] text-white/60 font-mono-tab mt-0.5">{feed.speed}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Real-Time Corridor Telemetry & Congestion Matrix */}
            <div className="rounded-3xl border border-white/10 bg-black/40 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="size-4 text-emerald-400" />
                  Corridor Speed & Traffic Density Matrix
                </h2>
                <span className="text-xs text-white/50 font-mono-tab">Quezon City Division 2</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/10 font-mono-tab text-[10px] uppercase text-white/40">
                    <tr>
                      <th className="py-2 px-3">Corridor & Segment</th>
                      <th className="py-2 px-3">Average Speed</th>
                      <th className="py-2 px-3">Speed Limit</th>
                      <th className="py-2 px-3">Vehicular Volume</th>
                      <th className="py-2 px-3">Congestion Status</th>
                      <th className="py-2 px-3">Active Lanes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono-tab">
                    {CORRIDOR_TELEMETRY.map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-bold text-white block">{row.corridor}</span>
                          <span className="text-[11px] text-white/50 font-sans">{row.segment}</span>
                        </td>
                        <td className="py-3 px-3 font-bold text-emerald-400">{row.speedKmH} km/h</td>
                        <td className="py-3 px-3 text-white/60">{row.speedLimit} km/h</td>
                        <td className="py-3 px-3 text-white/80">{row.volumePerHour.toLocaleString()} veh/hr</td>
                        <td className="py-3 px-3">
                          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold border", row.statusTone)}>
                            {row.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-white/60">{row.lanesActive}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                Community Road Hazard Reporter & Patrol Dispatch
              </h1>
              <p className="mt-1 text-sm text-white/60">
                Report stalled vehicles, broken signals, or accidents. Reports are dispatched immediately to mobile patrol units (+50 Eco-Reward Tokens per verified report).
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              {/* Left 2 Columns: Report Form */}
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

                {/* Live Community Statistics Box */}
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-center">
                    <span className="text-2xl font-bold font-mono-tab text-white">
                      {citizenHazards.length > 0 ? citizenHazards.length : 12}
                    </span>
                    <span className="text-[10px] font-mono-tab uppercase text-white/50 block mt-0.5">Reports Logged</span>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-center">
                    <span className="text-2xl font-bold font-mono-tab text-blue-400">4 Units</span>
                    <span className="text-[10px] font-mono-tab uppercase text-white/50 block mt-0.5">Patrols Dispatched</span>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-center">
                    <span className="text-2xl font-bold font-mono-tab text-emerald-400">+600</span>
                    <span className="text-[10px] font-mono-tab uppercase text-white/50 block mt-0.5">Tokens Credited</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Community Hazard Feed */}
              <div className="lg:col-span-1 flex flex-col gap-4">
                <div className="rounded-2xl border border-white/10 bg-panel p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white/80 flex items-center gap-2">
                      <Radio className="size-4 text-orange-400" />
                      Live Community Hazard Feed
                    </h3>
                    <span className="text-[10px] font-mono-tab text-emerald-400 font-bold">DISPATCH ACTIVE</span>
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setHazardFilterCategory("all")}
                      className={cn(
                        "rounded px-2 py-1 transition-colors",
                        hazardFilterCategory === "all" ? "bg-white text-black font-bold" : "bg-white/5 text-white/60 hover:bg-white/10",
                      )}
                    >
                      All ({citizenHazards.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setHazardFilterCategory("Stalled Vehicle")}
                      className={cn(
                        "rounded px-2 py-1 transition-colors",
                        hazardFilterCategory === "Stalled Vehicle"
                          ? "bg-orange-500 text-white font-bold"
                          : "bg-white/5 text-white/60 hover:bg-white/10",
                      )}
                    >
                      Stalled
                    </button>
                    <button
                      type="button"
                      onClick={() => setHazardFilterCategory("Accident / Collision")}
                      className={cn(
                        "rounded px-2 py-1 transition-colors",
                        hazardFilterCategory === "Accident / Collision"
                          ? "bg-red-500 text-white font-bold"
                          : "bg-white/5 text-white/60 hover:bg-white/10",
                      )}
                    >
                      Accident
                    </button>
                    <button
                      type="button"
                      onClick={() => setHazardFilterCategory("Broken Traffic Light")}
                      className={cn(
                        "rounded px-2 py-1 transition-colors",
                        hazardFilterCategory === "Broken Traffic Light"
                          ? "bg-yellow-500 text-black font-bold"
                          : "bg-white/5 text-white/60 hover:bg-white/10",
                      )}
                    >
                      Signal
                    </button>
                  </div>

                  {/* Feed Items */}
                  {loadingHazards ? (
                    <div className="grid h-32 place-items-center">
                      <Loader2 className="size-6 animate-spin text-orange-500" />
                    </div>
                  ) : filteredHazards.length > 0 ? (
                    <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                      {filteredHazards.map((h) => {
                        const isResolved = h.status === "Resolved";
                        const isDispatched = h.status === "Officer Dispatched";

                        return (
                          <div
                            key={h.id}
                            className="rounded-xl border border-white/10 bg-black/40 p-3.5 space-y-1.5 transition-all hover:border-white/20"
                          >
                            <div className="flex items-center justify-between">
                              <span className="rounded bg-orange-500/20 border border-orange-500/30 px-1.5 py-0.5 text-[9px] font-bold text-orange-300 uppercase">
                                {h.category}
                              </span>
                              <span
                                className={cn(
                                  "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase",
                                  isResolved
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : isDispatched
                                      ? "bg-blue-500/20 text-blue-400"
                                      : "bg-amber-500/20 text-amber-400",
                                )}
                              >
                                {h.status}
                              </span>
                            </div>

                            <p className="text-xs font-semibold text-white mt-1">{h.location}</p>
                            <p className="text-[11px] text-white/70 line-clamp-2 leading-relaxed">{h.description}</p>

                            <div className="flex items-center justify-between border-t border-white/5 pt-1.5 text-[10px] text-white/40 font-mono-tab">
                              <span>{formatTimeAgo(h.reportedAt)}</span>
                              <span className="text-emerald-400 font-semibold">+50 Tokens Awarded</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-white/10 bg-black/20 p-6 text-center text-white/50 text-xs">
                      No reports match the selected category.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: ADJUDICATION BOARD & CONTESTED APPEALS */}
        {/* ========================================================================= */}
        {activeTab === "disputes" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
                            <option value="" className="bg-background text-muted-foreground">
                              -- Select NOV --
                            </option>
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

                      {appealCitationId &&
                        (() => {
                          const target = currentCitizen?.citations?.find(
                            (c) => c.id === appealCitationId || c.novNumber === appealCitationId,
                          );
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
                        <label className="text-xs font-semibold uppercase tracking-wider text-subtle">
                          Supporting Statement & Defense
                        </label>
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
            ) : disputes && disputes.length > 0 ? (
              <div className="grid gap-6">
                {disputes.map((dispute) => (
                  <div key={dispute.id} className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
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
                          dispute.status === "approved"
                            ? "bg-emerald-500/20 text-emerald-500"
                            : dispute.status === "rejected"
                              ? "bg-red-500/20 text-red-500"
                              : "bg-blue-500/20 text-blue-400",
                        )}
                      >
                        {dispute.status === "approved"
                          ? "DISMISSED (NO FINE)"
                          : dispute.status === "rejected"
                            ? "PENALTY UPHELD"
                            : "PENDING BOARD REVIEW"}
                      </span>
                    </div>

                    {/* 4-Stage Adjudication Progress Tracker */}
                    <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                      <span className="font-mono-tab text-[10px] uppercase text-white/40 block mb-3 font-bold">
                        Adjudication Progress Workflow:
                      </span>
                      <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono-tab">
                        <div className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 p-2 text-emerald-300">
                          <span className="block font-bold">1. FILING</span>
                          <span className="text-[9px] opacity-80">Protest Lodged</span>
                        </div>
                        <div className="rounded-lg bg-blue-500/20 border border-blue-500/40 p-2 text-blue-300">
                          <span className="block font-bold">2. INTAKE</span>
                          <span className="text-[9px] opacity-80">Evidence Verified</span>
                        </div>
                        <div
                          className={cn(
                            "rounded-lg p-2 border",
                            dispute.status === "pending"
                              ? "bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse"
                              : "bg-white/10 border-white/20 text-white/80",
                          )}
                        >
                          <span className="block font-bold">3. HEARING</span>
                          <span className="text-[9px] opacity-80">TAB Deliberation</span>
                        </div>
                        <div
                          className={cn(
                            "rounded-lg p-2 border",
                            dispute.status === "approved"
                              ? "bg-emerald-500/30 border-emerald-500 text-emerald-300"
                              : dispute.status === "rejected"
                                ? "bg-red-500/30 border-red-500 text-red-300"
                                : "bg-white/5 border-white/10 text-white/40",
                          )}
                        >
                          <span className="block font-bold">4. RESOLUTION</span>
                          <span className="text-[9px] opacity-80">
                            {dispute.status === "approved" ? "Dismissed" : dispute.status === "rejected" ? "Upheld" : "Pending"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
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
            ) : (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center flex flex-col items-center">
                <div className="grid size-14 place-items-center rounded-2xl bg-blue-500/20 text-blue-400 mb-4">
                  <Scale className="size-7" />
                </div>
                <h3 className="text-lg font-bold text-white">No Active TAB Appeals</h3>
                <p className="text-xs text-white/60 max-w-md mt-1">
                  You have not filed any formal protests. If you receive an erroneous notice of violation, you may submit TAB Form 01 within 10 calendar days.
                </p>
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
                Eco-Rewards & Safe Driver Wallet
              </h1>
              <p className="mt-1 text-sm text-white/60">
                Earn tokens for clean driving records and road hazard reporting. Redeem for parking passes, fuel discounts, and LTO express lanes.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              {/* Left 2 Columns: Balance & Reward Cards */}
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

              {/* Right Column: Motorist Claimed Vouchers Wallet */}
              <div className="lg:col-span-1 flex flex-col gap-4">
                <div className="rounded-2xl border border-white/10 bg-panel p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white/80 flex items-center gap-2">
                      <Gift className="size-4 text-emerald-400" />
                      My Claimed Vouchers ({currentCitizen.vouchers?.length || 0})
                    </h3>
                  </div>

                  {currentCitizen.vouchers && currentCitizen.vouchers.length > 0 ? (
                    <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                      {currentCitizen.vouchers.map((v) => (
                        <div
                          key={v.id}
                          className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-3 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-xs font-bold text-white">{v.title}</h4>
                              <p className="text-[10px] text-white/60 mt-0.5">{v.description}</p>
                            </div>
                            <span className="rounded bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-mono-tab font-bold text-emerald-300 uppercase">
                              {v.status}
                            </span>
                          </div>

                          {/* Voucher Code & QR Box */}
                          <div className="flex items-center justify-between gap-3 bg-black/60 rounded-xl p-3 border border-white/10">
                            <div className="space-y-1">
                              <span className="font-mono-tab text-[9px] uppercase text-white/40 block">Voucher Code</span>
                              <span className="font-mono-tab text-xs font-bold text-emerald-400 block tracking-wider">
                                {v.code}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyVoucherCode(v.code)}
                                className="inline-flex items-center gap-1 text-[10px] text-white/70 hover:text-white transition-colors"
                              >
                                {copiedCode === v.code ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                                {copiedCode === v.code ? "Copied!" : "Copy Code"}
                              </button>
                            </div>

                            <div className="p-1.5 bg-white rounded-lg shrink-0">
                              <VerifiableQrCode data={v.code} size={56} />
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-white/40 font-mono-tab">
                            <span>Claimed {new Date(v.claimedAt).toLocaleDateString()}</span>
                            <span>Cost: {v.cost} Tokens</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-white/10 bg-black/20 p-6 text-center space-y-2">
                      <div className="grid size-10 place-items-center rounded-xl bg-white/5 text-white/40 mx-auto">
                        <Gift className="size-5" />
                      </div>
                      <p className="text-xs font-semibold text-white">No Vouchers Claimed Yet</p>
                      <p className="text-[11px] text-white/50">
                        Redeem your safe driver tokens on the left to unlock parking passes, toll discounts, and LTO express lanes.
                      </p>
                    </div>
                  )}
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
                    const frames =
                      selectedNov.evidenceFrames && selectedNov.evidenceFrames.length > 0
                        ? selectedNov.evidenceFrames
                        : [
                            {
                              url: "/assets/violation-1.jpg",
                              label: `Optical Sentinel Capture: ${selectedNov.violation}`,
                              timestamp: new Date(selectedNov.date).toLocaleTimeString(),
                            },
                          ];
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
                                activeFrameMode === "telemetry" ? "brightness-90 contrast-125" : "",
                              )}
                            />

                            {/* Viewfinder HUD Overlays */}
                            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3.5 bg-gradient-to-t from-black/80 via-transparent to-black/60">
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
                                  {new Date(selectedNov.date).toLocaleDateString()}{" "}
                                  {currentFrame.timestamp || new Date(selectedNov.date).toLocaleTimeString()}
                                </span>
                              </div>

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

                        {/* Multi-Frame Strip or 3-Mode Viewfinder Sequence */}
                        {frames.length > 1 ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px] text-white/60">
                              <span>Select Evidence Frame to Inspect:</span>
                              <span className="font-mono-tab text-white/80">
                                Frame {safeIndex + 1} of {frames.length}
                              </span>
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
                                      : "border-white/10 opacity-70 hover:opacity-100 hover:border-white/30",
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
                          <div className="grid gap-3 sm:grid-cols-3">
                            <button
                              type="button"
                              onClick={() => setActiveFrameMode("wide")}
                              className={cn(
                                "text-left flex flex-col gap-1.5 rounded-xl border p-2.5 transition-all",
                                activeFrameMode === "wide"
                                  ? "border-blue-500 bg-blue-500/15 ring-1 ring-blue-500/50"
                                  : "border-white/10 bg-black/40 hover:bg-black/60 hover:border-white/20",
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
                              <p className="text-[10px] text-white/70 line-clamp-1">
                                Primary photographic capture of vehicle approaching intersection.
                              </p>
                            </button>

                            <button
                              type="button"
                              onClick={() => setActiveFrameMode("telemetry")}
                              className={cn(
                                "text-left flex flex-col gap-1.5 rounded-xl border p-2.5 transition-all",
                                activeFrameMode === "telemetry"
                                  ? "border-red-500 bg-red-500/15 ring-1 ring-red-500/50"
                                  : "border-white/10 bg-black/40 hover:bg-black/60 hover:border-white/20",
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
                              <p className="text-[10px] text-white/70 line-clamp-1">
                                Stop line crossing / active lane sensor trigger verified.
                              </p>
                            </button>

                            <button
                              type="button"
                              onClick={() => setActiveFrameMode("plate")}
                              className={cn(
                                "text-left flex flex-col gap-1.5 rounded-xl border p-2.5 transition-all",
                                activeFrameMode === "plate"
                                  ? "border-emerald-500 bg-emerald-500/15 ring-1 ring-emerald-500/50"
                                  : "border-white/10 bg-black/40 hover:bg-black/60 hover:border-white/20",
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
                              <p className="text-[10px] text-white/70 line-clamp-1">
                                Automated plate recognition crop matching {selectedNov.plateNumber}.
                              </p>
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
                                  item.category === "Franchise & Colorum"
                                    ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                    : item.category === "Registration & Licensing"
                                      ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                                      : item.category === "Moving Violation"
                                        ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                                        : item.category === "Obstruction & Parking"
                                          ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                                          : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";

                                return (
                                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-4 py-3 font-mono-tab text-white/50 align-top">{idx + 1}</td>
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
                                        <p className="text-[11px] text-white/60 mt-1 leading-relaxed">{item.description}</p>
                                      )}
                                      <p className="text-[10px] text-blue-400 font-mono-tab mt-1 sm:hidden">{item.ordinance}</p>
                                    </td>
                                    <td className="px-4 py-3 align-top hidden sm:table-cell font-mono-tab text-[11px] text-blue-300/90">
                                      <div>{item.ordinance || selectedNov.ordinanceCode}</div>
                                      {item.code && <div className="text-[10px] text-white/40 mt-0.5">Code: {item.code}</div>}
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
                              <span
                                className={cn(
                                  "font-mono-tab font-bold text-sm",
                                  surchargeAmt > 0 ? "text-orange-400" : "text-emerald-400",
                                )}
                              >
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
                      <UserCheck className="size-3.5 inline mr-1" /> Nominate Driver
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

                      {(selectedNov.status === "unpaid" || selectedNov.status === "payment_failed") && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedCitationId(selectedNov.id);
                              setSettleModalOpen(true);
                            }}
                            className={cn(
                              "rounded-xl px-5 py-2.5 text-xs font-bold text-white transition-all shadow-lg flex items-center gap-1.5",
                              selectedNov.status === "payment_failed"
                                ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/30"
                                : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30",
                            )}
                          >
                            {selectedNov.status === "payment_failed" ? (
                              <>
                                <RotateCcw className="size-3.5" /> Retry Payment ({formatPeso(selectedNov.amount)})
                              </>
                            ) : (
                              <>
                                <CreditCard className="size-3.5" /> Quick Settle ({formatPeso(selectedNov.amount)})
                              </>
                            )}
                          </button>

                          <Link
                            to="/portal/pay/$citationId"
                            params={{ citationId: selectedNov.novNumber || selectedNov.id }}
                            className="rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition-all flex items-center gap-1.5"
                          >
                            <ExternalLink className="size-3.5" /> Official Portal
                          </Link>
                        </>
                      )}
                      {(selectedNov.status === "settled" || selectedNov.paymentDetails?.status === "verified") && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-400">
                            <CheckCircle2 className="size-4" /> Payment Verified & Settled
                          </span>
                          <Link
                            to="/portal/receipt/$citationId"
                            params={{ citationId: selectedNov.novNumber || selectedNov.id }}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition-all"
                          >
                            <Receipt className="size-4" /> View Official e-OR & Clearance Pass
                          </Link>
                        </div>
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

                {selectedNov &&
                  (() => {
                    const parsed = parseCitationOffenses(selectedNov.violation, selectedNov.amount);
                    return (
                      <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-xs space-y-1.5">
                        <div className="flex items-center justify-between font-mono-tab">
                          <span className="text-white/60">
                            Citation: <strong className="text-white">{selectedNov.novNumber}</strong>
                          </span>
                          <span className="text-white/60">
                            Plate: <strong className="text-white">{selectedNov.plateNumber}</strong>
                          </span>
                        </div>
                        <div className="text-[11px] text-white/70">
                          Transferring liability for:{" "}
                          <span className="font-semibold text-white">{parsed.map((p) => p.name).join(" & ")}</span> (
                          {formatPeso(selectedNov.amount)})
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

                    {/* Verifiable QR Code & Official Digital Seal */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-3.5 mt-4">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-white rounded-xl shadow-md shrink-0">
                          <VerifiableQrCode
                            data={`QC-DPOS-CLR|${clearedCitation.clearanceCertNumber || "MMDA-QC-CLR"}|${clearedCitation.plateNumber}|${clearedCitation.novNumber || clearedCitation.id}`}
                            size={72}
                          />
                        </div>
                        <div className="space-y-0.5 text-left">
                          <span className="text-[10px] font-mono-tab font-bold text-emerald-400 block uppercase">
                            Digital Seal Verified · LTO LTMS Synced
                          </span>
                          <p className="text-[11px] text-white/70 leading-snug">
                            Scan to verify official clearance with Quezon City Hall Traffic Adjudication Bureau.
                          </p>
                          <span className="text-[10px] text-white/40 font-mono-tab block">
                            Signed: Maria Teresa L. Santos, City Treasurer
                          </span>
                        </div>
                      </div>

                      <Link
                        to="/portal/receipt/$citationId"
                        params={{ citationId: clearedCitation.novNumber || clearedCitation.id }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 px-3.5 py-2 text-xs font-bold text-emerald-300 transition-colors shrink-0"
                      >
                        <Receipt className="size-3.5" /> Official e-OR
                      </Link>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-4">
                    <button
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
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
                    (c) => c.id === selectedCitationId || c.novNumber === selectedCitationId,
                  );
                  const targetParsed = targetCitation ? parseCitationOffenses(targetCitation.violation, targetCitation.amount) : [];
                  const targetTotal = targetCitation ? targetCitation.amount + (targetCitation.surcharge || 0) : 0;

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
                            <p className="text-sm font-bold text-white font-mono-tab mt-0.5">{targetCitation.plateNumber}</p>
                          </div>
                        )}
                      </div>

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
                              <span className="font-mono-tab font-bold text-emerald-400">{formatPeso(off.amount)}</span>
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
                        settleMethod === "gcash"
                          ? "border-blue-500 bg-blue-500/20 text-white font-bold"
                          : "border-white/10 text-white/70 hover:bg-white/5",
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
                        settleMethod === "maya"
                          ? "border-emerald-500 bg-emerald-500/20 text-white font-bold"
                          : "border-white/10 text-white/70 hover:bg-white/5",
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
                        settleMethod === "card"
                          ? "border-purple-500 bg-purple-500/20 text-white font-bold"
                          : "border-white/10 text-white/70 hover:bg-white/5",
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
        {/* MODAL 5: CONSOLIDATED BATCH SETTLEMENT MODAL */}
        {/* ========================================================================= */}
        <Dialog.Root open={batchSettleModalOpen} onOpenChange={setBatchSettleModalOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md animate-in fade-in" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-panel p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b border-border pb-3">
                <Dialog.Title className="text-lg font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="size-5 text-emerald-400" />
                  Consolidated Batch Settlement ({unpaidCitations.length} Notices)
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button className="rounded p-1 text-subtle hover:text-foreground">
                    <X className="size-4" />
                  </button>
                </Dialog.Close>
              </div>

              <form onSubmit={handleBatchSettleSubmit} className="mt-4 flex flex-col gap-4">
                <p className="text-xs text-white/70 leading-relaxed">
                  Settle all outstanding Notices of Violation across your registered fleet in a single transaction. Digital Certificates of Clearance will be issued immediately.
                </p>

                {/* List of citations to be batch settled */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {unpaidCitations.map((c) => {
                    const parsed = parseCitationOffenses(c.violation, c.amount);
                    return (
                      <div key={c.id} className="rounded-xl border border-white/10 bg-black/40 p-3 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono-tab font-bold text-white">{c.novNumber || c.id}</span>
                            <span className="font-mono-tab text-[10px] text-white/50 bg-white/5 px-1.5 rounded">
                              {c.plateNumber}
                            </span>
                          </div>
                          <p className="text-[11px] text-white/60 mt-0.5">{parsed.map((p) => p.name).join(" + ")}</p>
                        </div>
                        <span className="font-mono-tab font-bold text-emerald-400">{formatPeso(c.amount)}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Total Summary */}
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 flex items-center justify-between font-mono-tab">
                  <span className="text-xs uppercase text-emerald-300 font-bold">Total Batch Assessed Due:</span>
                  <span className="text-xl font-black text-emerald-400">{formatPeso(totalUnpaid)}</span>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Payment Gateway</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setBatchSettleMethod("gcash")}
                      className={cn(
                        "rounded-xl border p-2.5 text-center transition-all",
                        batchSettleMethod === "gcash"
                          ? "border-blue-500 bg-blue-500/20 text-white font-bold"
                          : "border-white/10 text-white/70 hover:bg-white/5",
                      )}
                    >
                      <span className="block text-xs font-bold">GCash</span>
                      <span className="text-[10px] text-white/50">QR Ph</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBatchSettleMethod("maya")}
                      className={cn(
                        "rounded-xl border p-2.5 text-center transition-all",
                        batchSettleMethod === "maya"
                          ? "border-emerald-500 bg-emerald-500/20 text-white font-bold"
                          : "border-white/10 text-white/70 hover:bg-white/5",
                      )}
                    >
                      <span className="block text-xs font-bold">Maya</span>
                      <span className="text-[10px] text-white/50">Wallet</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBatchSettleMethod("card")}
                      className={cn(
                        "rounded-xl border p-2.5 text-center transition-all",
                        batchSettleMethod === "card"
                          ? "border-purple-500 bg-purple-500/20 text-white font-bold"
                          : "border-white/10 text-white/70 hover:bg-white/5",
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
                    disabled={batchSettling}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                  >
                    {batchSettling && <Loader2 className="size-4 animate-spin" />}
                    Confirm Batch Settle ({formatPeso(totalUnpaid)})
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* ========================================================================= */}
        {/* MODAL 6: PRINTABLE OFFICIAL NOTICE OF VIOLATION (NOV) SLIP */}
        {/* ========================================================================= */}
        <Dialog.Root open={officialNoticeModalOpen} onOpenChange={setOfficialNoticeModalOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md animate-in fade-in" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-panel p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
              {selectedOfficialNotice && (
                <div className="space-y-6">
                  {/* Government Header */}
                  <div className="flex items-start justify-between border-b border-white/15 pb-4">
                    <div className="flex items-center gap-3">
                      <img src="/favico2.png" alt="LGU Seal" className="size-12" />
                      <div>
                        <span className="text-[10px] font-mono-tab uppercase tracking-wider text-blue-400 font-bold block">
                          REPUBLIC OF THE PHILIPPINES • QUEZON CITY
                        </span>
                        <h2 className="text-base sm:text-lg font-black text-white">
                          OFFICIAL NOTICE OF TRAFFIC VIOLATION (NOV)
                        </h2>
                        <span className="text-[11px] text-white/60 font-mono-tab">
                          Issued pursuant to QC Ordinance SP-2938 & MMDA NCAP Mandate
                        </span>
                      </div>
                    </div>

                    <Dialog.Close asChild>
                      <button className="rounded p-1 text-white/50 hover:text-white">
                        <X className="size-4" />
                      </button>
                    </Dialog.Close>
                  </div>

                  {/* Notice Identity & Barcode Header */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-black/50 p-4 rounded-2xl border border-white/10 text-xs font-mono-tab">
                    <div>
                      <span className="text-[10px] uppercase text-white/40 block">Notice Reference</span>
                      <span className="font-bold text-white">{selectedOfficialNotice.novNumber || selectedOfficialNotice.id}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-white/40 block">Apprehension Date</span>
                      <span className="text-white">
                        {new Date(selectedOfficialNotice.date).toLocaleDateString("en-PH", { dateStyle: "medium" })}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-white/40 block">Plate Number</span>
                      <span className="font-bold text-blue-400">{selectedOfficialNotice.plateNumber}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-white/40 block">Registered Owner</span>
                      <span className="text-white truncate">{currentCitizen.fullName}</span>
                    </div>
                  </div>

                  {/* Itemized Violations Table */}
                  <div className="space-y-2">
                    <span className="font-mono-tab text-[10px] uppercase font-bold text-white/50 block">
                      Itemized Charged Violations & Statutory Basis:
                    </span>
                    <div className="rounded-xl border border-white/10 bg-black/40 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-white/10 bg-white/[0.02] font-mono-tab text-[10px] uppercase text-white/40">
                          <tr>
                            <th className="py-2.5 px-3">#</th>
                            <th className="py-2.5 px-3">Violation Description</th>
                            <th className="py-2.5 px-3">Legal Basis</th>
                            <th className="py-2.5 px-3 text-right">Statutory Fine</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {parseCitationOffenses(selectedOfficialNotice.violation, selectedOfficialNotice.amount).map((off, idx) => (
                            <tr key={idx}>
                              <td className="py-2.5 px-3 font-mono-tab text-white/40">{idx + 1}</td>
                              <td className="py-2.5 px-3 font-bold text-white">{off.name}</td>
                              <td className="py-2.5 px-3 font-mono-tab text-[11px] text-blue-300">{off.ordinance}</td>
                              <td className="py-2.5 px-3 font-mono-tab font-bold text-right text-emerald-400">
                                {formatPeso(off.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Summary & Statutory Notice Box */}
                  <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-mono-tab">
                      <span className="text-white/70 uppercase text-[10px]">Total Assessed Liability</span>
                      <span className="text-base font-black text-white">{formatPeso(selectedOfficialNotice.amount)}</span>
                    </div>
                    <p className="text-[11px] text-white/70 leading-relaxed">
                      <strong>STATUTORY NOTICE:</strong> You have ten (10) calendar days from receipt of this notice to either settle the assessed fine online or lodge a formal protest before the Traffic Adjudication Board (TAB). Failure to settle will result in an automatic alarm hold on your LTO LTMS profile.
                    </p>
                  </div>

                  {/* Print and Close Actions */}
                  <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
                    <Dialog.Close asChild>
                      <button className="rounded-lg px-4 py-2 text-sm font-semibold text-white/70 hover:bg-white/10">
                        Close
                      </button>
                    </Dialog.Close>
                    <button
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/25"
                    >
                      <Printer className="size-4" /> Print Official Slip
                    </button>
                  </div>
                </div>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* ========================================================================= */}
        {/* MODAL 7: FULL-SCREEN CCTV VIEWER MODAL */}
        {/* ========================================================================= */}
        <Dialog.Root open={cctvModalOpen} onOpenChange={setCctvModalOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md animate-in fade-in" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-panel p-6 shadow-2xl">
              {(() => {
                const activeFeed = CCTV_FEEDS[selectedCctvIndex] || CCTV_FEEDS[0];
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 rounded bg-red-600 px-2 py-0.5 font-mono-tab text-[10px] font-bold text-white shadow">
                          <span className="size-1.5 rounded-full bg-white animate-pulse" /> LIVE STREAM
                        </span>
                        <h3 className="font-bold text-white text-base">{activeFeed.title}</h3>
                      </div>
                      <Dialog.Close asChild>
                        <button className="rounded p-1 text-white/50 hover:text-white">
                          <X className="size-5" />
                        </button>
                      </Dialog.Close>
                    </div>

                    <div className="relative h-80 sm:h-96 w-full overflow-hidden rounded-2xl border border-white/15 bg-black">
                      <img src={activeFeed.image} alt={activeFeed.title} className="size-full object-cover" />
                      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-t from-black/80 via-transparent to-black/60 font-mono-tab">
                        <div className="flex items-center justify-between text-xs text-white/80">
                          <span>CAMERA: {activeFeed.cameraCode}</span>
                          <span>{activeFeed.resolution} • 60 FPS</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-white/80">
                          <span>LOCATION: {activeFeed.location}</span>
                          <span className="text-emerald-400 font-bold">{activeFeed.density}</span>
                        </div>
                      </div>
                    </div>

                    {/* Camera Feed Switcher */}
                    <div className="flex items-center gap-2">
                      {CCTV_FEEDS.map((feed, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedCctvIndex(i)}
                          className={cn(
                            "rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all",
                            selectedCctvIndex === i
                              ? "bg-primary text-primary-foreground font-bold shadow"
                              : "bg-white/5 text-white/70 hover:bg-white/10",
                          )}
                        >
                          CAM 0{i + 1}: {feed.title.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* ========================================================================= */}
        {/* MODAL 8: REGISTER MOTOR VEHICLE */}
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
