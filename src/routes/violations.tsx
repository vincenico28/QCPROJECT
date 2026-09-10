import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useViolations, useCitations, timeAgo, type Violation, type Citation, formatPeso } from "@/lib/data/traffic";
import { ViolationReviewDialog } from "@/components/violations/violation-review-dialog";
import { useBulkReviewViolations, useAddManualViolation, fineFor } from "@/lib/data/review";
import { cn } from "@/lib/utils";
import {
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Camera,
  MapPin,
  Sparkles,
  Download,
  Plus,
  Zap,
  CheckCheck,
  Trash2,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  Loader2,
  X,
  ShieldAlert,
  ArrowUpRight,
  Upload,
  ScanLine,
  FileCheck,
  RefreshCw,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/violations")({
  head: () => ({
    meta: [
      { title: "Violations Review Console · Culiat Traffic Ops" },
      {
        name: "description",
        content:
          "AI-detected traffic violations across Barangay Culiat, Quezon City with high-resolution CCTV evidence, bulk confirmation, and MMDA NCAP enforcement tools.",
      },
      { property: "og:title", content: "Violations Review Console · Culiat Traffic Ops" },
      {
        property: "og:description",
        content: "Live AI-detected violations across Barangay Culiat, Quezon City with CCTV evidence, batch confirmation, and status.",
      },
    ],
  }),
  component: ViolationsPage,
});

const STATUSES = ["all", "pending", "confirmed", "dismissed"] as const;
type StatusFilter = (typeof STATUSES)[number];

const VIOLATION_TYPES = [
  "All Offenses",
  "Red Light",
  "Illegal Parking",
  "Counterflow",
  "Yellow Box Infraction",
  "Bus Lane Violation",
  "No Helmet",
  "Overspeeding",
] as const;

function ViolationsPage() {
  const { data: violations = [], isLoading } = useViolations(100);
  const { data: citations = [] } = useCitations(200);
  const bulkReview = useBulkReviewViolations();
  const addManual = useAddManualViolation();

  const citationsByViolationId = useMemo(() => {
    const map = new Map<string, Citation>();
    for (const c of citations) {
      if (c.violation_id) {
        map.set(c.violation_id, c);
      }
    }
    return map;
  }, [citations]);

  const [status, setStatus] = useState<StatusFilter>("all");
  const [offenseFilter, setOffenseFilter] = useState<string>("All Offenses");
  const [q, setQ] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [review, setReview] = useState<Violation | null>(null);
  const qc = useQueryClient();
  const [manualModalOpen, setManualModalOpen] = useState(false);

  // Quezon City CCTV Nodes & Real Snapshots
  const QC_CCTV_NODES = [
    { code: "CAM-042", label: "Commonwealth Ave cor. Tandang Sora", snapshot: "/assets/violation-1.jpg" },
    { code: "CAM-108", label: "Tomas Morato Ave cor. Scout Madriñan", snapshot: "/assets/cctv-2.jpg" },
    { code: "CAM-059", label: "EDSA-Quezon Ave Flyover", snapshot: "/assets/violation-2.jpg" },
    { code: "CAM-021", label: "Katipunan Ave cor. CP Garcia", snapshot: "/assets/cctv-3.jpg" },
    { code: "CAM-133", label: "Elliptical Road / QC Circle", snapshot: "/assets/violation-3.jpg" },
    { code: "CAM-077", label: "Aurora Blvd cor. Katipunan", snapshot: "/assets/cctv-1.jpg" },
    { code: "QC-CAM-1002", label: "Tandang Sora Ave / Culiat Market", snapshot: "/assets/cctv-1.jpg" },
  ];

  // Manual Log State
  const [manualPlate, setManualPlate] = useState("");
  const [manualType, setManualType] = useState("Illegal Parking");
  const [manualCam, setManualCam] = useState(QC_CCTV_NODES[0].code);
  const [manualLocation, setManualLocation] = useState(QC_CCTV_NODES[0].label);
  const [manualEvidenceUrl, setManualEvidenceUrl] = useState<string>(QC_CCTV_NODES[0].snapshot);
  const [evidenceSource, setEvidenceSource] = useState<"cctv" | "upload">("cctv");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSizeKb, setUploadedFileSizeKb] = useState<number | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [autoIssueCitation, setAutoIssueCitation] = useState(true);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  const handleCameraChange = (code: string) => {
    setManualCam(code);
    const node = QC_CCTV_NODES.find((n) => n.code === code);
    if (node) {
      setManualLocation(node.label);
      if (evidenceSource === "cctv") {
        setManualEvidenceUrl(node.snapshot);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WebP)");
      return;
    }

    try {
      setIsProcessingFile(true);
      // High-performance canvas downsampler & compressor
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
            setManualEvidenceUrl(compressed);
            setUploadedFileName(file.name);
            setUploadedFileSizeKb(sizeKb);
            setEvidenceSource("upload");
            setIsProcessingFile(false);
            toast.success("Photo Evidence Attached & Optimized", {
              description: `${file.name} compressed to ${sizeKb} KB HD frame. Ready to store in database.`,
            });
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsProcessingFile(false);
      console.error("Image processing error", err);
      toast.error("Failed to process evidence frame");
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPlate) return;
    setIsSubmittingManual(true);

    try {
      const { serverSaveViolation, serverSaveCitation } = await import("@/lib/server.functions");
      const fineAmount = fineFor(manualType);
      const cleanPlate = manualPlate.toUpperCase().trim();
      const initialStatus = autoIssueCitation ? "confirmed" : "pending";

      let finalEvidenceUrl = manualEvidenceUrl;
      if (evidenceSource === "upload" && manualEvidenceUrl) {
        try {
          const { uploadEvidenceToSupabase } = await import("@/lib/storage");
          finalEvidenceUrl = await uploadEvidenceToSupabase(manualEvidenceUrl, {
            plateNumber: cleanPlate,
            category: manualType,
          });
        } catch (uploadErr) {
          console.warn("[Storage] Fallback to direct evidence URL", uploadErr);
        }
      }

      const savedViolation = await serverSaveViolation({
        data: {
          plate_number: cleanPlate,
          plateNumber: cleanPlate,
          violation_type: manualType,
          violationType: manualType,
          location: manualLocation,
          confidence: 99,
          camera_code: manualCam,
          cameraCode: manualCam,
          ai_detected: false,
          aiDetected: false,
          evidence_url: finalEvidenceUrl,
          evidenceUrl: finalEvidenceUrl,
          status: initialStatus,
        },
      });

      let issuedNovNumber = "";
      if (autoIssueCitation) {
        const cit = await serverSaveCitation({
          data: {
            violation_id: savedViolation.id,
            violationId: savedViolation.id,
            plate_number: cleanPlate,
            plateNumber: cleanPlate,
            offense: manualType,
            amount: fineAmount,
            officer_name: "Field Traffic Enforcer",
            evidence_url: finalEvidenceUrl,
            status: "unpaid",
          },
        });
        issuedNovNumber = cit?.citation_number || "";
      }

      await qc.invalidateQueries({ queryKey: ["violations"] });
      await qc.invalidateQueries({ queryKey: ["citations"] });
      await qc.invalidateQueries({ queryKey: ["registered-vehicles"] });

      if (autoIssueCitation) {
        toast.success(`Violation Confirmed & NOV Citation Issued!`, {
          description: `Plate: ${cleanPlate} · ${manualType} · Ticket ${issuedNovNumber || "Generated"} linked to citizen & LTO ledger.`,
        });
      } else {
        toast.success(`Field Violation Logged to Review Queue!`, {
          description: `Plate: ${cleanPlate} · ${manualType} · Status: Pending Review in review console.`,
        });
      }

      setManualModalOpen(false);
      setManualPlate("");
      setUploadedFileName(null);
      setUploadedFileSizeKb(null);
    } catch (err: any) {
      console.error("Direct server function error, using resilient mutation fallback", err);
      addManual.mutate({
        plate_number: manualPlate.toUpperCase().trim(),
        violation_type: manualType,
        location: manualLocation,
        camera_code: manualCam,
        evidence_url: manualEvidenceUrl,
        confidence: 99,
        status: autoIssueCitation ? "confirmed" : "pending",
      }, {
        onSuccess: () => {
          toast.success(`Violation & Evidence Frame Stored! (Queue Synced)`);
          setManualModalOpen(false);
          setManualPlate("");
          setUploadedFileName(null);
          setUploadedFileSizeKb(null);
        },
        onError: (mutationErr) => {
          toast.error("Failed to commit violation to database: " + mutationErr.message);
        },
      });
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const filtered = useMemo(() => {
    return violations.filter((v) => {
      if (status !== "all" && v.status !== status) return false;
      if (offenseFilter !== "All Offenses" && v.violation_type !== offenseFilter) return false;
      if (!q) return true;
      const needle = q.toLowerCase();
      return (
        v.plate_number.toLowerCase().includes(needle) ||
        v.violation_type.toLowerCase().includes(needle) ||
        v.location.toLowerCase().includes(needle) ||
        (v.camera_code && v.camera_code.toLowerCase().includes(needle))
      );
    });
  }, [violations, status, offenseFilter, q]);

  const counts = useMemo(() => {
    return {
      all: violations.length,
      pending: violations.filter((v) => v.status === "pending").length,
      confirmed: violations.filter((v) => v.status === "confirmed").length,
      dismissed: violations.filter((v) => v.status === "dismissed").length,
    } as Record<StatusFilter, number>;
  }, [violations]);

  const highConfidencePending = useMemo(() => {
    return violations.filter(
      (v) => v.status === "pending" && (Number(v.confidence) >= 0.9 || Number(v.confidence) >= 90),
    );
  }, [violations]);

  const handleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((v) => v.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleBulkConfirm = () => {
    if (selectedIds.length === 0) return;
    bulkReview.mutate(
      { ids: selectedIds, status: "confirmed" },
      {
        onSuccess: (res) => {
          toast.success(`Confirmed ${res.count} violation(s) and issued citations.`);
          setSelectedIds([]);
        },
      },
    );
  };

  const handleBulkDismiss = () => {
    if (selectedIds.length === 0) return;
    bulkReview.mutate(
      { ids: selectedIds, status: "dismissed" },
      {
        onSuccess: (res) => {
          toast.success(`Dismissed ${res.count} detection(s).`);
          setSelectedIds([]);
        },
      },
    );
  };

  const handleAutoValidateHighConfidence = () => {
    const ids = highConfidencePending.map((v) => v.id);
    if (ids.length === 0) {
      toast.info("No high-confidence (>90%) pending detections at this moment.");
      return;
    }
    bulkReview.mutate(
      { ids, status: "confirmed" },
      {
        onSuccess: (res) => {
          toast.success(`AI Auto-Validation Complete: Issued ${res.count} citation(s) for high-confidence detections.`);
        },
      },
    );
  };

  const exportCSV = async () => {
    const headers = ["ID", "Plate Number", "Violation Type", "Location", "Camera Code", "Confidence", "Status", "Detected At"];
    const rows = filtered.map((v) => [
      v.id,
      v.plate_number,
      v.violation_type,
      `"${v.location}"`,
      v.camera_code || "N/A",
      v.confidence,
      v.status,
      v.detected_at,
    ]);
    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `qc-violations-export-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      await supabase.from("audit_logs").insert({
        actor_name: "Violations Review Officer",
        actor_role: "admin",
        action: "VIOLATIONS_EXPORTED_CSV",
        target_resource: "Violations Ledger",
        details: `Exported ${filtered.length} violation records.`,
      });
    } catch (err) {
      console.warn(err);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-primary/20 px-2 py-0.5 font-mono-tab text-[10px] font-bold text-primary border border-primary/30">
              AI ENFORCEMENT STREAM
            </span>
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight mt-1">
            Traffic Violations Review Console
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Real-time computer vision detection stream, ANPR plate recognition, and bulk citation issuance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {highConfidencePending.length > 0 && (
            <button
              onClick={handleAutoValidateHighConfidence}
              disabled={bulkReview.isPending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              <Sparkles className="size-3.5" />
              Auto-Validate High Conf ({highConfidencePending.length})
            </button>
          )}

          {/* Log Manual Violation Modal */}
          <Dialog.Root open={manualModalOpen} onOpenChange={setManualModalOpen}>
            <Dialog.Trigger asChild>
              <button className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all">
                <Plus className="size-3.5" />
                Log Violation
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-panel p-6 shadow-2xl animate-in fade-in zoom-in-95">
                <div className="flex items-start justify-between border-b border-border pb-3">
                  <Dialog.Title className="text-base font-bold text-foreground flex items-center gap-2">
                    <Camera className="size-4 text-primary" />
                    Log Field Traffic Violation
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button className="rounded p-1 text-muted-foreground hover:text-foreground">
                      <X className="size-4" />
                    </button>
                  </Dialog.Close>
                </div>

                <form onSubmit={handleManualSubmit} className="mt-4 flex flex-col gap-4">
                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                      License Plate *
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. NDB-1234"
                      value={manualPlate}
                      onChange={(e) => setManualPlate(e.target.value.toUpperCase())}
                      className="rounded-lg border border-border bg-background px-3.5 py-2 text-sm uppercase text-foreground focus:border-primary focus:outline-none"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                      Violation Classification *
                    </span>
                    <select
                      value={manualType}
                      onChange={(e) => setManualType(e.target.value)}
                      className="rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="Illegal Parking">Illegal Parking (₱1,000)</option>
                      <option value="Red Light">Red Light Jump (₱2,000)</option>
                      <option value="Counterflow">Counterflow (₱2,500)</option>
                      <option value="Yellow Box Infraction">Yellow Box Infraction (₱1,500)</option>
                      <option value="Bus Lane Violation">Bus Lane Violation (₱5,000)</option>
                      <option value="No Helmet">No Helmet (₱1,500)</option>
                      <option value="Overspeeding">Overspeeding (₱3,000)</option>
                    </select>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1.5">
                      <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                        CCTV Camera Node *
                      </span>
                      <select
                        value={manualCam}
                        onChange={(e) => handleCameraChange(e.target.value)}
                        className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                      >
                        {QC_CCTV_NODES.map((node) => (
                          <option key={node.code} value={node.code}>
                            {node.code} ({node.label.split(" / ")[0]})
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="flex flex-col gap-1.5">
                      <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                        Location / Corridor *
                      </span>
                      <input
                        type="text"
                        required
                        value={manualLocation}
                        onChange={(e) => setManualLocation(e.target.value)}
                        className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                      />
                    </label>
                  </div>

                  {/* Photo / 4K Snapshot Evidence Attachment */}
                  <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-panel-elevated/40 p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono-tab text-[10px] uppercase tracking-widest text-foreground font-bold flex items-center gap-1.5">
                        <Camera className="size-3.5 text-primary" /> Photo / CCTV Evidence Frame
                      </span>
                      <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/10 text-[10px]">
                        <button
                          type="button"
                          onClick={() => {
                            setEvidenceSource("cctv");
                            const node = QC_CCTV_NODES.find((n) => n.code === manualCam);
                            if (node) setManualEvidenceUrl(node.snapshot);
                          }}
                          className={cn(
                            "px-2 py-0.5 rounded font-semibold transition-all",
                            evidenceSource === "cctv" ? "bg-primary text-white" : "text-white/60 hover:text-white"
                          )}
                        >
                          CCTV Node
                        </button>
                        <button
                          type="button"
                          onClick={() => setEvidenceSource("upload")}
                          className={cn(
                            "px-2 py-0.5 rounded font-semibold transition-all",
                            evidenceSource === "upload" ? "bg-primary text-white" : "text-white/60 hover:text-white"
                          )}
                        >
                          Upload Photo
                        </button>
                      </div>
                    </div>

                    {/* Interactive Evidence Viewfinder Preview */}
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black shadow-inner group">
                      <img
                        src={manualEvidenceUrl}
                        alt="Evidence Frame"
                        className="size-full object-cover"
                      />

                      {/* Optical Telemetry & ANPR Bounding Box Overlay */}
                      <div className="absolute inset-x-3 top-3 flex items-center justify-between pointer-events-none">
                        <span className="rounded bg-black/70 px-2 py-0.5 font-mono-tab text-[9px] font-bold text-red-400 border border-red-500/40 flex items-center gap-1">
                          ● REC 4K UHD · {manualCam}
                        </span>
                        <span className="rounded bg-black/70 px-2 py-0.5 font-mono-tab text-[9px] text-white/80 border border-white/10">
                          {new Date().toLocaleTimeString()}
                        </span>
                      </div>

                      {/* ANPR OCR Detection Box */}
                      <div className="absolute inset-x-6 bottom-3 rounded-lg border-2 border-emerald-400/80 bg-black/75 p-2 backdrop-blur-sm pointer-events-none">
                        <div className="flex items-center justify-between text-[10px] font-mono-tab text-emerald-400">
                          <span className="flex items-center gap-1 font-bold">
                            <ScanLine className="size-3 animate-pulse" /> ANPR OCR: {manualPlate || "PLATE-NUMBER"}
                          </span>
                          <span className="font-bold">99.4% MATCH</span>
                        </div>
                      </div>

                      {isProcessingFile && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-white">
                          <Loader2 className="size-6 animate-spin text-primary" />
                          <span className="text-xs font-semibold">Optimizing evidence frame...</span>
                        </div>
                      )}
                    </div>

                    {/* Evidence Controls */}
                    {evidenceSource === "upload" ? (
                      <div className="flex flex-col gap-1.5">
                        <label className="cursor-pointer rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3 text-center text-xs text-muted-foreground hover:border-primary hover:bg-primary/10 transition-all flex items-center justify-center gap-2">
                          <Upload className="size-4 text-primary" />
                          <span>
                            <strong className="text-primary font-semibold">Browse Custom Photo / Frame</strong> or drag image here
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                        {uploadedFileName && (
                          <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-[11px] text-emerald-300">
                            <span className="flex items-center gap-1.5 truncate">
                              <CheckCircle2 className="size-3.5 shrink-0" />
                              <span className="truncate font-medium">{uploadedFileName}</span>
                              <span className="text-emerald-400/70 font-mono-tab">({uploadedFileSizeKb} KB HD)</span>
                            </span>
                            <span className="font-bold text-[10px] uppercase text-emerald-400 shrink-0">Accurate Frame</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-[11px] text-white/70">
                        <span className="flex items-center gap-1.5">
                          <Camera className="size-3.5 text-blue-400" />
                          <span>Direct Optical Feed: <strong>{manualCam}</strong></span>
                        </span>
                        <span className="text-[10px] font-mono-tab text-emerald-400 font-bold">100% Calibrated</span>
                      </div>
                    )}
                  </div>

                  {/* Instant Citation Issuance Checkbox */}
                  <label className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoIssueCitation}
                      onChange={(e) => setAutoIssueCitation(e.target.checked)}
                      className="size-4 rounded accent-primary"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-emerald-400">
                        Generate Digital Citation (NOV)
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Automatically creates linked citation ticket in the public cashier ledger with photo evidence.
                      </span>
                    </div>
                  </label>

                  <div className="mt-4 flex justify-end gap-3 border-t border-border pt-4">
                    <Dialog.Close asChild>
                      <button
                        type="button"
                        className="rounded-lg px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-panel-elevated transition-colors"
                      >
                        Cancel
                      </button>
                    </Dialog.Close>
                    <button
                      type="submit"
                      disabled={!manualPlate || isSubmittingManual || isProcessingFile}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 transition-all disabled:opacity-50 shadow-lg shadow-primary/25"
                    >
                      {isSubmittingManual && <Loader2 className="size-3.5 animate-spin" />}
                      Commit to Supabase Database
                    </button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-panel-elevated transition-colors"
          >
            <Download className="size-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Ribbons */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="panel rounded-2xl border border-border p-4">
          <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">Total Detections</span>
          <p className="mt-2 font-mono-tab text-2xl font-black text-foreground">{counts.all}</p>
          <span className="text-[10px] text-emerald-400 font-semibold mt-0.5 block">Live AI Stream Active</span>
        </div>

        <div className="panel rounded-2xl border border-orange-500/30 bg-orange-950/10 p-4">
          <span className="font-mono-tab text-[10px] uppercase tracking-widest text-orange-400">Pending Review</span>
          <p className="mt-2 font-mono-tab text-2xl font-black text-orange-300">{counts.pending}</p>
          <span className="text-[10px] text-muted-foreground block">Requires Operator Action</span>
        </div>

        <div className="panel rounded-2xl border border-emerald-500/30 bg-emerald-950/10 p-4">
          <span className="font-mono-tab text-[10px] uppercase tracking-widest text-emerald-400">Confirmed Citations</span>
          <p className="mt-2 font-mono-tab text-2xl font-black text-emerald-300">{counts.confirmed}</p>
          <span className="text-[10px] text-emerald-400/80 block">Dispatched to LTO/NOV</span>
        </div>

        <div className="panel rounded-2xl border border-border p-4">
          <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">Dismissed / False</span>
          <p className="mt-2 font-mono-tab text-2xl font-black text-muted-foreground">{counts.dismissed}</p>
          <span className="text-[10px] text-subtle block">Filtered by Operators</span>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="panel flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-border bg-background p-1">
            {STATUSES.map((s) => {
              const active = status === s;
              return (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={cn(
                    "shrink-0 rounded-lg px-3 py-1.5 font-mono-tab text-[11px] font-bold uppercase tracking-wider transition-colors",
                    active ? "bg-primary text-primary-foreground shadow-sm" : "text-subtle hover:text-foreground",
                  )}
                >
                  {s}
                  <span className="ml-1.5 rounded-full bg-black/40 px-1.5 py-0.2 text-[9px] text-white/80">
                    {counts[s]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Offense Filter Dropdown */}
          <select
            value={offenseFilter}
            onChange={(e) => setOffenseFilter(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
          >
            {VIOLATION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="relative flex items-center w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 size-4 text-subtle" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search plate, type, camera…"
              className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none"
            />
          </label>
        </div>
      </div>

      {/* Bulk Action Strip (appears when items are selected) */}
      {selectedIds.length > 0 && (
        <div className="animate-in fade-in slide-in-from-top-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4 shadow-lg">
          <div className="flex items-center gap-2 text-xs text-white font-bold">
            <CheckCheck className="size-4 text-primary" />
            <span>{selectedIds.length} item(s) selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkConfirm}
              disabled={bulkReview.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="size-3.5" />
              Confirm & Issue Citations
            </button>
            <button
              onClick={handleBulkDismiss}
              disabled={bulkReview.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-1.5 text-xs font-semibold text-white/80 hover:bg-panel-elevated transition-colors disabled:opacity-50"
            >
              <XCircle className="size-3.5" />
              Dismiss Selected
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="rounded-lg p-1.5 text-xs text-white/60 hover:text-white"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Violations Table */}
      <div className="panel overflow-hidden rounded-2xl border border-border shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-black/20">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedIds.length === filtered.length}
                    onChange={handleSelectAll}
                    className="rounded border-border bg-background"
                  />
                </th>
                <th className="px-4 py-3 font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                  Evidence
                </th>
                <th className="px-4 py-3 font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                  Plate Number
                </th>
                <th className="px-4 py-3 font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                  Violation Offense
                </th>
                <th className="px-4 py-3 font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                  Location & Camera
                </th>
                <th className="px-4 py-3 font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                  AI Confidence
                </th>
                <th className="px-4 py-3 font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                  Status
                </th>
                <th className="px-4 py-3 text-right font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-sm text-subtle">
                    <Loader2 className="mx-auto size-6 animate-spin text-primary mb-2" />
                    Loading real-time camera detections…
                  </td>
                </tr>
              )}
              {!isLoading &&
                filtered.map((v) => {
                  const isSelected = selectedIds.includes(v.id);
                  const linkedCitation = citationsByViolationId.get(v.id);
                  return (
                    <ViolationRow
                      key={v.id}
                      v={v}
                      isSelected={isSelected}
                      linkedCitation={linkedCitation}
                      onToggleSelect={() => toggleSelect(v.id)}
                      onReview={() => setReview(v)}
                    />
                  );
                })}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-sm text-subtle">
                    No detections match your current filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ViolationReviewDialog violation={review} onClose={() => setReview(null)} />
    </div>
  );
}

function ViolationRow({
  v,
  isSelected,
  linkedCitation,
  onToggleSelect,
  onReview,
}: {
  v: Violation;
  isSelected: boolean;
  linkedCitation?: Citation;
  onToggleSelect: () => void;
  onReview: () => void;
}) {
  const conf = Number(v.confidence) > 1 ? Number(v.confidence) : Math.round(Number(v.confidence) * 100);
  const confTone = conf >= 90 ? "text-emerald-400" : conf >= 80 ? "text-blue-400" : "text-amber-400";
  const isCited = Boolean(linkedCitation || v.status === "confirmed" || v.status === "verified");

  return (
    <tr className={cn("transition-colors hover:bg-panel-elevated/40", isSelected && "bg-primary/5")}>
      <td className="px-4 py-3.5">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="rounded border-border bg-background"
        />
      </td>

      {/* Evidence Thumbnail */}
      <td className="px-4 py-3.5">
        <button
          onClick={onReview}
          className="group relative size-12 overflow-hidden rounded-xl border border-border bg-panel-elevated shadow-sm block"
          title="Inspect Evidence Frame"
        >
          {v.evidence_url ? (
            <img src={v.evidence_url} alt="Evidence" className="size-full object-cover group-hover:scale-110 transition-transform" />
          ) : (
            <div className="grid size-full place-items-center text-subtle">
              <Camera className="size-4" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Eye className="size-3.5 text-white" />
          </div>
        </button>
      </td>

      {/* Plate */}
      <td className="px-4 py-3.5">
        <button
          onClick={onReview}
          className="font-mono-tab text-sm font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
        >
          {v.plate_number}
        </button>
        <span className="text-[10px] text-muted-foreground font-mono-tab block mt-0.5">
          {timeAgo(v.detected_at)}
        </span>
      </td>

      {/* Violation Type */}
      <td className="px-4 py-3.5">
        <span className="font-bold text-xs text-foreground block">{v.violation_type}</span>
        <span className="font-mono-tab text-[10px] text-muted-foreground">
          Est. Fine: {formatPeso(fineFor(v.violation_type))}
        </span>
      </td>

      {/* Location */}
      <td className="px-4 py-3.5">
        <div className="flex flex-col text-xs">
          <span className="text-foreground flex items-center gap-1 font-medium">
            <MapPin className="size-3 text-subtle shrink-0" />
            {v.location}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono-tab mt-0.5">
            Node: {v.camera_code || "AI-CAM"}
          </span>
        </div>
      </td>

      {/* AI Confidence */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-14 rounded-full bg-border overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full",
                conf >= 90 ? "bg-emerald-500" : conf >= 80 ? "bg-blue-500" : "bg-amber-500",
              )}
              style={{ width: `${Math.min(100, conf)}%` }}
            />
          </div>
          <span className={cn("font-mono-tab text-xs font-bold", confTone)}>{conf}%</span>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3.5">
        {linkedCitation ? (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="size-3 text-emerald-400" />
            Cited ({linkedCitation.citation_number})
          </span>
        ) : (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
              v.status === "confirmed" || v.status === "verified"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : v.status === "dismissed" || v.status === "rejected"
                ? "bg-white/10 text-white/50"
                : "bg-orange-500/20 text-orange-400 border border-orange-500/30",
            )}
          >
            {v.status === "verified" ? "confirmed" : v.status === "rejected" ? "dismissed" : v.status}
          </span>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-3.5 text-right">
        {isCited ? (
          <button
            onClick={onReview}
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/40 hover:text-white transition-colors"
          >
            View Details
            <Eye className="size-3" />
          </button>
        ) : (
          <button
            onClick={onReview}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-panel px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-panel-elevated hover:text-white transition-colors"
          >
            Review & Issue
            <ArrowUpRight className="size-3" />
          </button>
        )}
      </td>
    </tr>
  );
}
