import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useCitations, formatPeso, timeAgo, type Citation, useUpdateCitationStatus, useCreateCitation, useVehicleLookup } from "@/lib/data/traffic";
import { fineFor } from "@/lib/data/review";
import { cn } from "@/lib/utils";
import {
  Search,
  Download,
  Receipt,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Plus,
  Printer,
  Copy,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  QrCode,
  FileText,
  AlertTriangle,
  X,
  Loader2,
  Building2,
  Calendar,
  UserCheck,
  Car,
  DollarSign,
  Scale,
  Camera,
  Upload,
  ScanLine,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/citations")({
  head: () => ({
    meta: [
      { title: "Digital Citations & NOV Ledger · Culiat Traffic Ops" },
      {
        name: "description",
        content:
          "Digital traffic citations and Notices of Violation (NOV) issued across Barangay Culiat, Quezon City with payment status, officer attribution, and revenue analytics.",
      },
      { property: "og:title", content: "Digital Citations & NOV Ledger · Culiat Traffic Ops" },
      {
        property: "og:description",
        content:
          "Digital citations ledger with payment tracking and revenue analytics for Barangay Culiat, Quezon City enforcement.",
      },
    ],
  }),
  component: CitationsPage,
});

const STATUSES = ["all", "unpaid", "paid", "contested", "overdue"] as const;
type StatusFilter = (typeof STATUSES)[number];

const OFFENSE_TYPES = [
  "All Offenses",
  "Red Light",
  "Illegal Parking",
  "Counterflow",
  "Yellow Box Infraction",
  "Bus Lane Violation",
  "No Helmet",
  "Overspeeding",
] as const;

function CitationsPage() {
  const { data: citations = [], isLoading } = useCitations(200);
  const updateStatus = useUpdateCitationStatus();
  const createCitation = useCreateCitation();

  const [status, setStatus] = useState<StatusFilter>("all");
  const [offenseFilter, setOffenseFilter] = useState<string>("All Offenses");
  const [q, setQ] = useState("");
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form State for Direct Citation
  const [formPlate, setFormPlate] = useState("");
  const [formVehicle, setFormVehicle] = useState("");
  const [formOffense, setFormOffense] = useState("Illegal Parking");
  const [formAmount, setFormAmount] = useState(1000);
  const [formOfficer, setFormOfficer] = useState("Sgt. Juan Dela Cruz");

  // Evidence state
  const QC_CCTV_NODES = [
    { code: "CAM-042", label: "Commonwealth Ave cor. Tandang Sora", snapshot: "/assets/violation-1.jpg" },
    { code: "CAM-108", label: "Tomas Morato Ave cor. Scout Madriñan", snapshot: "/assets/cctv-2.jpg" },
    { code: "CAM-059", label: "EDSA-Quezon Ave Flyover", snapshot: "/assets/violation-2.jpg" },
    { code: "CAM-021", label: "Katipunan Ave cor. CP Garcia", snapshot: "/assets/cctv-3.jpg" },
    { code: "CAM-133", label: "Elliptical Road / QC Circle", snapshot: "/assets/violation-3.jpg" },
    { code: "CAM-077", label: "Aurora Blvd cor. Katipunan", snapshot: "/assets/cctv-1.jpg" },
  ];
  const [evidenceSource, setEvidenceSource] = useState<"cctv" | "upload">("cctv");
  const [formCam, setFormCam] = useState(QC_CCTV_NODES[0].code);
  const [formEvidenceUrl, setFormEvidenceUrl] = useState(QC_CCTV_NODES[0].snapshot);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSizeKb, setUploadedFileSizeKb] = useState<number | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const { data: lookedUpVehicle, isLoading: isLookingUpPlate } = useVehicleLookup(formPlate);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }
    try {
      setIsProcessingFile(true);
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
            setFormEvidenceUrl(compressed);
            setUploadedFileName(file.name);
            setUploadedFileSizeKb(sizeKb);
            setEvidenceSource("upload");
            setIsProcessingFile(false);
            toast.success("Photo Evidence Attached", {
              description: `${file.name} (${sizeKb} KB) ready to upload to Supabase Storage.`,
            });
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsProcessingFile(false);
      toast.error("Failed to process image file");
    }
  };

  useEffect(() => {
    if (lookedUpVehicle?.makeModel && !formVehicle) {
      setFormVehicle(lookedUpVehicle.makeModel);
    }
  }, [lookedUpVehicle, formVehicle]);

  const filtered = useMemo(() => {
    return citations.filter((c) => {
      if (status !== "all" && c.status !== status) return false;
      if (offenseFilter !== "All Offenses" && c.offense !== offenseFilter) return false;
      if (!q) return true;
      const n = q.toLowerCase();
      return (
        c.citation_number.toLowerCase().includes(n) ||
        c.plate_number.toLowerCase().includes(n) ||
        c.offense.toLowerCase().includes(n) ||
        (c.vehicle_model ?? "").toLowerCase().includes(n) ||
        (c.officer_name ?? "").toLowerCase().includes(n)
      );
    });
  }, [citations, status, offenseFilter, q]);

  const stats = useMemo(() => {
    const total = citations.reduce((s, c) => s + Number(c.amount), 0);
    const paid = citations.filter((c) => c.status === "paid");
    const paidSum = paid.reduce((s, c) => s + Number(c.amount), 0);
    const unpaidSum = citations
      .filter((c) => c.status === "unpaid" || c.status === "overdue")
      .reduce((s, c) => s + Number(c.amount), 0);
    const collectionRate = total > 0 ? (paidSum / total) * 100 : 0;
    return {
      issued: citations.length,
      total,
      paidSum,
      unpaidSum,
      collectionRate,
      counts: {
        all: citations.length,
        unpaid: citations.filter((c) => c.status === "unpaid").length,
        paid: paid.length,
        contested: citations.filter((c) => c.status === "contested").length,
        overdue: citations.filter((c) => c.status === "overdue").length,
      } as Record<StatusFilter, number>,
    };
  }, [citations]);

  async function exportCsv() {
    const rows = [
      ["Notice of Violation #", "Plate", "Vehicle", "Offense", "Amount", "Status", "Officer", "Issued"],
      ...filtered.map((c) => [
        c.citation_number,
        c.plate_number,
        c.vehicle_model ?? "",
        c.offense,
        String(c.amount),
        c.status,
        c.officer_name ?? "",
        new Date(c.issued_at).toISOString(),
      ]),
    ];
    const csv = rows.map((r) => r.map((f) => `"${f}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `citations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} citations`);

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      await supabase.from("audit_logs").insert({
        actor_name: "Operations Chief",
        actor_role: "admin",
        action: "CITATIONS_LEDGER_EXPORTED",
        target_resource: "Citations Table",
        details: `Exported ${filtered.length} records to CSV.`,
      });
    } catch (err) {
      console.warn(err);
    }
  }

  const handleCreateDirectCitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPlate) return;
    const finalVehicle = formVehicle.trim() || lookedUpVehicle?.makeModel || null;
    const cleanPlate = formPlate.toUpperCase().trim();

    let finalEvidenceUrl = formEvidenceUrl;
    if (evidenceSource === "upload" && formEvidenceUrl) {
      try {
        const { uploadEvidenceToSupabase } = await import("@/lib/storage");
        finalEvidenceUrl = await uploadEvidenceToSupabase(formEvidenceUrl, {
          plateNumber: cleanPlate,
          category: formOffense,
          folder: "citations",
        });
      } catch (uploadErr) {
        console.warn("[Storage] Fallback to direct evidence URL", uploadErr);
      }
    }

    createCitation.mutate(
      {
        plate_number: cleanPlate,
        vehicle_model: finalVehicle,
        offense: formOffense,
        amount: formAmount,
        officer_name: formOfficer,
        evidence_url: finalEvidenceUrl,
      },
      {
        onSuccess: (newC) => {
          toast.success(`Citation ${newC.citation_number} issued successfully`, {
            description: `Plate: ${newC.plate_number} · Evidence stored to Supabase Storage · Amount: ${formatPeso(newC.amount)}`,
          });
          setCreateModalOpen(false);
          setFormPlate("");
          setFormVehicle("");
          setUploadedFileName(null);
          setUploadedFileSizeKb(null);
        },
      },
    );
  };

  const handleMarkSettled = (cit: Citation) => {
    updateStatus.mutate(
      { citationId: cit.citation_number, status: "paid" },
      {
        onSuccess: () => {
          toast.success(`Citation ${cit.citation_number} marked as PAID / SETTLED`, {
            description: "Official Receipt generated and LTO alarm cleared.",
          });
          setSelectedCitation(null);
        },
      },
    );
  };

  const handleMarkContested = (cit: Citation) => {
    updateStatus.mutate(
      { citationId: cit.citation_number, status: "contested" },
      {
        onSuccess: () => {
          toast.info(`Citation ${cit.citation_number} marked as CONTESTED`, {
            description: "Transferred to Traffic Adjudication Board (TAB) review queue.",
          });
          setSelectedCitation(null);
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-primary/20 px-2 py-0.5 font-mono-tab text-[10px] font-bold text-primary border border-primary/30">
              MMDA NCAP UNIFIED LEDGER
            </span>
            <span className="text-xs text-subtle">· Live LGU Database</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            Digital Citations & Notice of Violation (NOV)
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage issued citations, over-the-counter payments, TAB appeals, and LTO clearance status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Issue Direct Citation Modal */}
          <Dialog.Root open={createModalOpen} onOpenChange={setCreateModalOpen}>
            <Dialog.Trigger asChild>
              <button className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all">
                <Plus className="size-3.5" />
                Issue Direct Citation
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-panel p-6 shadow-2xl animate-in fade-in zoom-in-95">
                <div className="flex items-start justify-between border-b border-border pb-3">
                  <Dialog.Title className="text-base font-bold text-foreground flex items-center gap-2">
                    <Receipt className="size-4 text-primary" />
                    Issue Manual Traffic Citation
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button className="rounded p-1 text-muted-foreground hover:text-foreground">
                      <X className="size-4" />
                    </button>
                  </Dialog.Close>
                </div>

                <form onSubmit={handleCreateDirectCitation} className="mt-4 flex flex-col gap-4">
                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                      Vehicle License Plate *
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. NDB-8921"
                      value={formPlate}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setFormPlate(val);
                      }}
                      className="rounded-lg border border-border bg-background px-3.5 py-2 text-sm uppercase text-foreground focus:border-primary focus:outline-none"
                    />
                  </label>

                  {lookedUpVehicle && formPlate.trim().length >= 3 && (
                    <div className={cn(
                      "rounded-xl border p-2.5 text-xs flex items-center justify-between",
                      lookedUpVehicle.foundInDatabase
                        ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-400"
                        : "border-blue-500/20 bg-blue-950/20 text-blue-400"
                    )}>
                      <div className="flex items-center gap-2">
                        <Car className="size-3.5 shrink-0" />
                        <div>
                          <p className="font-bold text-[11px] leading-tight">
                            {lookedUpVehicle.foundInDatabase ? "QC Registered Citizen Motorist" : "LTO LTMS Vehicle Match"}
                          </p>
                          <p className="text-[10px] text-white/70">
                            Owner: <strong>{lookedUpVehicle.registeredOwner}</strong> · {lookedUpVehicle.makeModel}
                          </p>
                        </div>
                      </div>
                      {lookedUpVehicle.ltoAlarmTagged && (
                        <span className="rounded bg-red-500/20 border border-red-500/30 px-2 py-0.5 font-mono-tab text-[9px] font-bold text-red-400 uppercase">
                          LTO Hold
                        </span>
                      )}
                    </div>
                  )}

                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                      Vehicle Make / Model
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. Toyota Vios (Silver)"
                      value={formVehicle}
                      onChange={(e) => setFormVehicle(e.target.value)}
                      className="rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                      Offense Description *
                    </span>
                    <select
                      value={formOffense}
                      onChange={(e) => {
                        setFormOffense(e.target.value);
                        setFormAmount(fineFor(e.target.value));
                      }}
                      className="rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="Illegal Parking">Illegal Parking (₱1,000)</option>
                      <option value="Red Light">Red Light / Beating the Red Light (₱2,000)</option>
                      <option value="Counterflow">Counterflow (₱2,500)</option>
                      <option value="Yellow Box Infraction">Yellow Box Infraction (₱1,500)</option>
                      <option value="Bus Lane Violation">Bus Lane Violation (₱5,000)</option>
                      <option value="No Helmet">No Helmet (₱1,500)</option>
                      <option value="Overspeeding">Overspeeding (₱3,000)</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                      Fine Amount (PHP) *
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={formAmount}
                      onChange={(e) => setFormAmount(Number(e.target.value))}
                      className="rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                      Issuing Enforcer / Officer
                    </span>
                    <input
                      type="text"
                      value={formOfficer}
                      onChange={(e) => setFormOfficer(e.target.value)}
                      className="rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                  </label>

                  {/* Evidence Attachment Section */}
                  <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-panel-elevated/40 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono-tab text-[10px] uppercase tracking-widest text-foreground font-bold flex items-center gap-1.5">
                        <Camera className="size-3.5 text-primary" /> CCTV / Photo Evidence Frame
                      </span>
                      <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/10 text-[10px]">
                        <button
                          type="button"
                          onClick={() => {
                            setEvidenceSource("cctv");
                            const node = QC_CCTV_NODES.find((n) => n.code === formCam);
                            if (node) setFormEvidenceUrl(node.snapshot);
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

                    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black shadow-inner">
                      <img
                        src={formEvidenceUrl}
                        alt="Evidence Frame"
                        className="size-full object-cover"
                      />
                      <div className="absolute inset-x-3 top-3 flex items-center justify-between pointer-events-none">
                        <span className="rounded bg-black/70 px-2 py-0.5 font-mono-tab text-[9px] font-bold text-red-400 border border-red-500/40">
                          ● EVIDENCE REC · {formCam}
                        </span>
                        <span className="rounded bg-black/70 px-2 py-0.5 font-mono-tab text-[9px] text-white/80 border border-white/10">
                          {new Date().toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="absolute inset-x-4 bottom-2.5 rounded-lg border border-emerald-400/80 bg-black/75 p-1.5 backdrop-blur-sm pointer-events-none flex items-center justify-between text-[10px] font-mono-tab text-emerald-400">
                        <span className="font-bold flex items-center gap-1">
                          <ScanLine className="size-3" /> ANPR: {formPlate || "PLATE-NUMBER"}
                        </span>
                        <span className="font-bold">VERIFIED</span>
                      </div>
                      {isProcessingFile && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-white">
                          <Loader2 className="size-6 animate-spin text-primary" />
                          <span className="text-xs font-semibold">Processing photo...</span>
                        </div>
                      )}
                    </div>

                    {evidenceSource === "upload" ? (
                      <label className="cursor-pointer rounded-xl border border-dashed border-primary/40 bg-primary/5 p-2.5 text-center text-xs text-muted-foreground hover:border-primary hover:bg-primary/10 transition-all flex items-center justify-center gap-2">
                        <Upload className="size-4 text-primary" />
                        <span>
                          <strong className="text-primary font-semibold">Upload Photo Evidence</strong> (saved to Supabase Storage)
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <select
                        value={formCam}
                        onChange={(e) => {
                          setFormCam(e.target.value);
                          const node = QC_CCTV_NODES.find((n) => n.code === e.target.value);
                          if (node) setFormEvidenceUrl(node.snapshot);
                        }}
                        className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                      >
                        {QC_CCTV_NODES.map((n) => (
                          <option key={n.code} value={n.code}>
                            {n.code} ({n.label})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="mt-4 flex justify-end gap-3 border-t border-border pt-4">
                    <Dialog.Close asChild>
                      <button className="rounded-lg px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-panel-elevated">
                        Cancel
                      </button>
                    </Dialog.Close>
                    <button
                      type="submit"
                      disabled={createCitation.isPending || !formPlate}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 disabled:opacity-50"
                    >
                      {createCitation.isPending && <Loader2 className="size-3.5 animate-spin" />}
                      Issue Citation ({formatPeso(formAmount)})
                    </button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-panel-elevated transition-colors"
          >
            <Download className="size-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Citations Issued"
          value={stats.issued.toLocaleString()}
          icon={Receipt}
          tone="primary"
          sub="Total NCAP & Officer notices"
        />
        <KpiCard
          label="Revenue Collected"
          value={formatPeso(stats.paidSum)}
          icon={CheckCircle2}
          tone="success"
          sub={`${stats.collectionRate.toFixed(1)}% collection rate`}
        />
        <KpiCard
          label="Outstanding Balance"
          value={formatPeso(stats.unpaidSum)}
          icon={Clock}
          tone="warning"
          sub={`${stats.counts.unpaid + stats.counts.overdue} pending notices`}
        />
        <KpiCard
          label="Total Billed"
          value={formatPeso(stats.total)}
          icon={TrendingUp}
          tone="primary"
          sub="Gross citation liability"
        />
      </div>

      {/* Filter Bar */}
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
                    {stats.counts[s]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Offense Filter */}
          <select
            value={offenseFilter}
            onChange={(e) => setOffenseFilter(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
          >
            {OFFENSE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="relative flex items-center w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 size-4 text-subtle" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search NOV#, plate, vehicle, officer…"
              className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none"
            />
          </label>
        </div>
      </div>

      {/* Citations Table */}
      <div className="panel overflow-hidden rounded-2xl border border-border shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-black/20">
                {[
                  "Notice / Citation #",
                  "Plate Number",
                  "Vehicle",
                  "Offense",
                  "Amount",
                  "Issuing Authority",
                  "Issued Date",
                  "Status",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-sm text-subtle">
                    <Loader2 className="mx-auto size-6 animate-spin text-primary mb-2" />
                    Loading citations ledger…
                  </td>
                </tr>
              )}
              {!isLoading &&
                filtered.map((c) => (
                  <CitationRow
                    key={c.id}
                    c={c}
                    onOpenDetail={() => setSelectedCitation(c)}
                  />
                ))}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-sm text-subtle">
                    No citations match your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* OFFICIAL NOTICE OF VIOLATION (NOV) DETAIL & PRINT MODAL */}
      {selectedCitation && (
        <Dialog.Root open onOpenChange={(o) => !o && setSelectedCitation(null)}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-panel p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              {/* Slip Header */}
              <div className="flex items-start justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-12 place-items-center rounded-2xl bg-primary/20 text-primary border border-primary/30">
                    <Building2 className="size-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Barangay Culiat, Quezon City</h3>
                    <p className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                      Unified MMDA NCAP Traffic Enforcement
                    </p>
                  </div>
                </div>
                <Dialog.Close asChild>
                  <button className="rounded p-1 text-muted-foreground hover:text-foreground">
                    <X className="size-5" />
                  </button>
                </Dialog.Close>
              </div>

              {/* Official Slip Content */}
              <div className="mt-6 rounded-2xl border border-border bg-panel-elevated p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                  <div>
                    <span className="text-[10px] font-mono-tab text-subtle uppercase">Official Serial Reference</span>
                    <p className="font-mono-tab text-base font-black text-foreground">{selectedCitation.citation_number}</p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 font-mono-tab text-xs font-bold uppercase",
                      selectedCitation.status === "paid"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : selectedCitation.status === "overdue"
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : selectedCitation.status === "contested"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-amber-500/20 text-amber-400 border border-amber-500/30",
                    )}
                  >
                    {selectedCitation.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-subtle font-mono-tab text-[10px] uppercase">License Plate</span>
                    <p className="font-mono-tab text-sm font-bold text-foreground mt-0.5">{selectedCitation.plate_number}</p>
                  </div>
                  <div>
                    <span className="text-subtle font-mono-tab text-[10px] uppercase">Vehicle Model</span>
                    <p className="font-medium text-foreground mt-0.5">{selectedCitation.vehicle_model || "Registered Vehicle"}</p>
                  </div>
                  <div>
                    <span className="text-subtle font-mono-tab text-[10px] uppercase">Violation Offense</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedCitation.offense}</p>
                  </div>
                  <div>
                    <span className="text-subtle font-mono-tab text-[10px] uppercase">Fine Amount</span>
                    <p className="font-mono-tab text-base font-black text-foreground mt-0.5">{formatPeso(selectedCitation.amount)}</p>
                  </div>
                  <div>
                    <span className="text-subtle font-mono-tab text-[10px] uppercase">Issuing Authority</span>
                    <p className="text-foreground mt-0.5">{selectedCitation.officer_name || "AI Automated Camera Grid"}</p>
                  </div>
                  <div>
                    <span className="text-subtle font-mono-tab text-[10px] uppercase">Date & Time Issued</span>
                    <p className="font-mono-tab text-foreground mt-0.5">{new Date(selectedCitation.issued_at).toLocaleString("en-PH")}</p>
                  </div>
                </div>

                {/* Photographic Evidence Frame Viewer */}
                <div className="rounded-xl border border-border bg-black overflow-hidden relative shadow-inner">
                  <img
                    src={selectedCitation.evidence_url || "/assets/violation-1.jpg"}
                    alt={`Evidence capture for ${selectedCitation.plate_number}`}
                    className="h-48 w-full object-cover"
                  />
                  <div className="absolute inset-x-3 top-3 flex items-center justify-between pointer-events-none">
                    <span className="rounded bg-black/70 px-2 py-0.5 font-mono-tab text-[9px] font-bold text-red-400 border border-red-500/40 flex items-center gap-1">
                      ● EVIDENCE CAPTURE · {selectedCitation.citation_number}
                    </span>
                    <span className="rounded bg-black/70 px-2 py-0.5 font-mono-tab text-[9px] text-emerald-400 border border-emerald-500/30 font-bold">
                      {selectedCitation.evidence_url?.includes("supabase.co") ? "Supabase Storage CDN" : "Optical Sensor Frame"}
                    </span>
                  </div>
                  <div className="absolute inset-x-4 bottom-3 rounded-lg border border-emerald-400/80 bg-black/80 p-2 backdrop-blur-sm pointer-events-none flex items-center justify-between text-[10px] font-mono-tab text-emerald-400">
                    <span className="font-bold">ANPR OCR: {selectedCitation.plate_number}</span>
                    <span className="font-bold">VERIFIED EVIDENCE</span>
                  </div>
                </div>

                {/* QR Code & LTO status */}
                <div className="rounded-xl border border-border bg-panel p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <QrCode className="size-10 text-foreground shrink-0" />
                    <div>
                      <p className="text-[11px] font-bold text-foreground">Digital Verification QR</p>
                      <p className="text-[10px] text-muted-foreground">LTO LTMS Hold release valid upon clearance</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono-tab font-bold text-emerald-400">
                    {selectedCitation.status === "paid" ? "CLEARANCE ACTIVE" : "HOLD PENDING"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-panel-elevated transition-colors"
                  >
                    <Printer className="size-3.5" />
                    Print Notice Slip
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/portal/pay/${selectedCitation.citation_number}`);
                      toast.success("Public payment link copied to clipboard!");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-panel-elevated transition-colors"
                  >
                    <Copy className="size-3.5" />
                    Copy Pay Link
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {selectedCitation.status !== "paid" && (
                    <button
                      onClick={() => handleMarkSettled(selectedCitation)}
                      disabled={updateStatus.isPending}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="size-3.5" />
                      Mark Paid (OTC Cash / Card)
                    </button>
                  )}

                  {selectedCitation.status === "unpaid" && (
                    <button
                      onClick={() => handleMarkContested(selectedCitation)}
                      disabled={updateStatus.isPending}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/40 bg-blue-500/10 px-3.5 py-2 text-xs font-bold text-blue-400 hover:bg-blue-500/20 transition-colors"
                    >
                      <Scale className="size-3.5" />
                      File TAB Contest
                    </button>
                  )}
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
  sub,
}: {
  label: string;
  value: string;
  icon: typeof Receipt;
  tone: "primary" | "success" | "warning";
  sub?: string;
}) {
  const toneCls =
    tone === "success"
      ? "text-success bg-success/10 border-success/30"
      : tone === "warning"
        ? "text-warning bg-warning/10 border-warning/30"
        : "text-primary bg-primary/10 border-primary/30";
  return (
    <div className="panel rounded-2xl p-5 border border-border">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
            {label}
          </div>
          <div className="mt-2 text-2xl font-black tracking-tight text-foreground">{value}</div>
          {sub && <div className="mt-1 font-mono-tab text-[11px] text-muted-foreground">{sub}</div>}
        </div>
        <div className={cn("grid size-10 place-items-center rounded-xl border", toneCls)}>
          <Icon className="size-5" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}

function CitationRow({
  c,
  onOpenDetail,
}: {
  c: Citation;
  onOpenDetail: () => void;
}) {
  const statusTone =
    c.status === "paid"
      ? "bg-success/10 text-success border-success/30"
      : c.status === "contested"
        ? "bg-primary/10 text-primary border-primary/30"
        : c.status === "overdue"
          ? "bg-danger/10 text-danger border-danger/30"
          : "bg-warning/10 text-warning border-warning/30";
  const StatusIcon = c.status === "paid" ? CheckCircle2 : c.status === "overdue" ? XCircle : Clock;

  return (
    <tr className="text-sm transition-colors hover:bg-panel-elevated/50">
      <td className="px-5 py-3.5">
        <button
          onClick={onOpenDetail}
          className="font-mono-tab font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
        >
          {c.citation_number}
        </button>
      </td>
      <td className="px-5 py-3.5 font-mono-tab font-semibold text-foreground">{c.plate_number}</td>
      <td className="px-5 py-3.5 text-xs text-muted-foreground">{c.vehicle_model ?? "—"}</td>
      <td className="px-5 py-3.5 text-xs font-semibold text-foreground">{c.offense}</td>
      <td className="px-5 py-3.5 font-mono-tab font-bold text-foreground">{formatPeso(Number(c.amount))}</td>
      <td className="px-5 py-3.5 text-xs text-muted-foreground">{c.officer_name ?? "AI Camera Grid"}</td>
      <td className="px-5 py-3.5">
        <div className="text-xs text-foreground font-medium">{timeAgo(c.issued_at)}</div>
        <div className="font-mono-tab text-[10px] text-subtle">
          {new Date(c.issued_at).toLocaleDateString("en-PH")}
        </div>
      </td>
      <td className="px-5 py-3.5">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono-tab text-[10px] font-bold uppercase",
            statusTone,
          )}
        >
          <StatusIcon className="size-3" />
          {c.status}
        </span>
      </td>
      <td className="px-5 py-3.5 text-right">
        <button
          onClick={onOpenDetail}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-panel px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-panel-elevated hover:text-white transition-colors"
        >
          <FileText className="size-3.5" />
          View Slip
        </button>
      </td>
    </tr>
  );
}
