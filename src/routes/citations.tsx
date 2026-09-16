import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useCitations, formatPeso, timeAgo, type Citation, useUpdateCitationStatus, useCreateCitation, useVehicleLookup } from "@/lib/data/traffic";
import { fineFor, formatOffenseItems, parseCitationOffenses, splitOffenses } from "@/lib/data/review";
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
  Sparkles,
  Layers,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";
import {
  uploadMultipleEvidenceToSupabase,
  serializeEvidenceUrls,
  parseEvidenceUrls,
} from "@/lib/storage";

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

export type CitationViolationItem = {
  id: string;
  offense: string;
  amount: number;
  isCustom: boolean;
  customText: string;
};

export type FormEvidenceItem = {
  id: string;
  url: string;
  fileName: string;
  sizeKb: number;
};

const compressImageFile = (file: File): Promise<{ url: string; sizeKb: number }> => {
  return new Promise((resolve, reject) => {
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
          resolve({ url: compressed, sizeKb });
        } else {
          reject(new Error("Canvas context failed"));
        }
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const STANDARD_OFFENSES = [
  "Illegal Parking",
  "Red Light",
  "Counterflow",
  "Yellow Box Infraction",
  "Bus Lane Violation",
  "No Helmet",
  "Overspeeding",
  "Obstruction",
  "No Entry Zone",
  "Number Coding",
];

const STATUSES = ["all", "citizen", "unpaid", "paid", "contested", "overdue"] as const;
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
  const [formViolationItems, setFormViolationItems] = useState<CitationViolationItem[]>([
    {
      id: "item-1",
      offense: "Illegal Parking",
      amount: 1000,
      isCustom: false,
      customText: "",
    },
  ]);
  const [formOfficer, setFormOfficer] = useState("Sgt. Juan Dela Cruz");

  const totalFormAmount = useMemo(() => {
    return formViolationItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  }, [formViolationItems]);

  const addFormViolationItem = () => {
    const nextOffense =
      STANDARD_OFFENSES.find((o) => !formViolationItems.some((item) => item.offense === o)) || "Obstruction";
    setFormViolationItems((prev) => [
      ...prev,
      {
        id: `v-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        offense: nextOffense,
        amount: fineFor(nextOffense),
        isCustom: false,
        customText: "",
      },
    ]);
  };

  const removeFormViolationItem = (id: string) => {
    if (formViolationItems.length <= 1) return;
    setFormViolationItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateFormViolationItem = (id: string, updates: Partial<CitationViolationItem>) => {
    setFormViolationItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...updates };
        if (updates.offense && updates.offense !== item.offense && !updated.isCustom) {
          updated.amount = fineFor(updates.offense);
        }
        return updated;
      }),
    );
  };

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
  const [formCctvSnapshot, setFormCctvSnapshot] = useState(QC_CCTV_NODES[0].snapshot);
  const [formUploadedItems, setFormUploadedItems] = useState<FormEvidenceItem[]>([]);
  const [selectedUploadIndex, setSelectedUploadIndex] = useState(0);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);
  const [activeSlipFrameIndex, setActiveSlipFrameIndex] = useState(0);

  const { data: lookedUpVehicle, isLoading: isLookingUpPlate } = useVehicleLookup(formPlate);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const validFiles = files.filter((f) => f.type.startsWith("image/"));
    if (validFiles.length === 0) {
      toast.error("Please select valid image file(s)");
      return;
    }
    try {
      setIsProcessingFile(true);
      const newItems: FormEvidenceItem[] = [];
      for (const file of validFiles) {
        const { url, sizeKb } = await compressImageFile(file);
        newItems.push({
          id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          url,
          fileName: file.name,
          sizeKb,
        });
      }
      setFormUploadedItems((prev) => {
        const updated = [...prev, ...newItems];
        setSelectedUploadIndex(updated.length - 1);
        return updated;
      });
      setEvidenceSource("upload");
      toast.success(
        validFiles.length === 1
          ? `Evidence Frame Attached (${newItems[0].sizeKb} KB)`
          : `${validFiles.length} Evidence Frames Attached`
      );
    } catch (err) {
      console.error("Image processing error", err);
      toast.error("Failed to process image file(s)");
    } finally {
      setIsProcessingFile(false);
      e.target.value = "";
    }
  };

  const removeUploadedItem = (id: string) => {
    setFormUploadedItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      setSelectedUploadIndex((curr) => (curr >= next.length ? Math.max(0, next.length - 1) : curr));
      return next;
    });
  };

  useEffect(() => {
    setActiveSlipFrameIndex(0);
  }, [selectedCitation]);

  useEffect(() => {
    if (lookedUpVehicle?.makeModel && !formVehicle) {
      setFormVehicle(lookedUpVehicle.makeModel);
    }
  }, [lookedUpVehicle, formVehicle]);

  const filtered = useMemo(() => {
    return citations.filter((c) => {
      if (status === "citizen") {
        if (!c.isCitizenRegistered) return false;
      } else if (status !== "all" && c.status !== status) {
        return false;
      }
      if (offenseFilter !== "All Offenses" && c.offense !== offenseFilter) return false;
      if (!q) return true;
      const n = q.toLowerCase();
      return (
        c.citation_number.toLowerCase().includes(n) ||
        c.plate_number.toLowerCase().includes(n) ||
        c.offense.toLowerCase().includes(n) ||
        (c.vehicle_model ?? "").toLowerCase().includes(n) ||
        (c.officer_name ?? "").toLowerCase().includes(n) ||
        (c.citizenName ?? "").toLowerCase().includes(n) ||
        (c.citizenEmail ?? "").toLowerCase().includes(n) ||
        (c.registeredOwner ?? "").toLowerCase().includes(n)
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
        citizen: citations.filter((c) => c.isCitizenRegistered).length,
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
    const validViolationItems = formViolationItems
      .map((item) => ({
        name: item.isCustom ? item.customText.trim() : item.offense.trim(),
        amount: Number(item.amount) || 1000,
        isCustom: item.isCustom,
      }))
      .filter((item) => item.name.length > 0);

    if (validViolationItems.length === 0) {
      toast.error("Please enter or select at least one violation classification");
      return;
    }

    const combinedOffense = formatOffenseItems(validViolationItems);
    const finalVehicle = formVehicle.trim() || lookedUpVehicle?.makeModel || null;
    const cleanPlate = formPlate.toUpperCase().trim();

    let finalEvidenceUrl: string = formCctvSnapshot;
    if (evidenceSource === "upload" && formUploadedItems.length > 0) {
      setIsUploadingEvidence(true);
      try {
        const uploadedUrls = await uploadMultipleEvidenceToSupabase(
          formUploadedItems.map((item) => item.url),
          {
            plateNumber: cleanPlate,
            category: combinedOffense,
            folder: "citations",
          }
        );
        finalEvidenceUrl = serializeEvidenceUrls(uploadedUrls);
      } catch (uploadErr) {
        console.warn("[Storage] Fallback to direct evidence URL", uploadErr);
        finalEvidenceUrl = serializeEvidenceUrls(formUploadedItems.map((item) => item.url));
      } finally {
        setIsUploadingEvidence(false);
      }
    } else if (evidenceSource === "cctv") {
      finalEvidenceUrl = formCctvSnapshot;
    }

    createCitation.mutate(
      {
        plate_number: cleanPlate,
        vehicle_model: finalVehicle,
        offense: combinedOffense,
        amount: totalFormAmount,
        officer_name: formOfficer,
        evidence_url: finalEvidenceUrl,
      },
      {
        onSuccess: (newC) => {
          toast.success(`Citation ${newC.citation_number} issued successfully`, {
            description: `Plate: ${newC.plate_number} · ${validViolationItems.length} violation(s) · Amount: ${formatPeso(newC.amount)}`,
          });
          setCreateModalOpen(false);
          setFormPlate("");
          setFormVehicle("");
          setFormViolationItems([
            {
              id: "item-1",
              offense: "Illegal Parking",
              amount: 1000,
              isCustom: false,
              customText: "",
            },
          ]);
          setFormUploadedItems([]);
          setSelectedUploadIndex(0);
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
                Issue Digital Citation (OVR)
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-panel p-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
                <div className="flex items-start justify-between border-b border-border pb-3">
                  <Dialog.Title className="text-base font-bold text-foreground flex items-center gap-2">
                    <Receipt className="size-4 text-primary" />
                    Issue Digital Citation (OVR)
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

                  {/* Multi-Violation & Assessed Penalties Section */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle font-bold flex items-center gap-1.5">
                          <Layers className="size-3.5 text-primary" />
                          Charged Violations ({formViolationItems.length})
                        </span>
                        {formViolationItems.length > 1 && (
                          <span className="rounded-full bg-primary/20 border border-primary/30 px-2 py-0.5 font-mono-tab text-[10px] font-bold text-primary">
                            Multi-Offense
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={addFormViolationItem}
                        className="inline-flex items-center gap-1 rounded-lg border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary hover:bg-primary/20 transition-all shadow-sm"
                      >
                        <Plus className="size-3" />
                        Add Violation
                      </button>
                    </div>

                    {/* List of Form Violation Items */}
                    <div className="flex flex-col gap-2.5">
                      {formViolationItems.map((item, index) => (
                        <div
                          key={item.id}
                          className="rounded-xl border border-border bg-panel-elevated/60 p-3 shadow-sm flex flex-col gap-2.5 transition-all relative"
                        >
                          <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono-tab text-[10px] font-black text-foreground">
                                #{index + 1}
                              </span>
                              <span className="text-xs font-bold text-foreground truncate max-w-[180px]">
                                {item.isCustom
                                  ? item.customText || "Custom Violation"
                                  : item.offense}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => updateFormViolationItem(item.id, { isCustom: !item.isCustom })}
                                className={cn(
                                  "text-[10px] font-semibold px-2 py-0.5 rounded border transition-all flex items-center gap-1",
                                  item.isCustom
                                    ? "bg-primary/15 border-primary/40 text-primary"
                                    : "bg-panel border-border text-muted-foreground hover:text-foreground"
                                )}
                              >
                                <Sparkles className="size-2.5" />
                                {item.isCustom ? "Standard List" : "+ Custom"}
                              </button>

                              {formViolationItems.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeFormViolationItem(item.id)}
                                  className="rounded p-1 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                  title="Remove this violation"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Classification Picker */}
                          {item.isCustom ? (
                            <div className="flex flex-col gap-1">
                              <input
                                type="text"
                                required
                                value={item.customText}
                                onChange={(e) => updateFormViolationItem(item.id, { customText: e.target.value })}
                                placeholder="e.g. Operating Colorum PUV / Ordinance SP-2957"
                                className="rounded-lg border border-primary/50 bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                              />
                              <span className="text-[10px] text-muted-foreground">
                                Enter custom QC ordinance, MMDA violation code, or special classification.
                              </span>
                            </div>
                          ) : (
                            <select
                              value={item.offense}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "__custom__") {
                                  updateFormViolationItem(item.id, { isCustom: true });
                                } else {
                                  updateFormViolationItem(item.id, { offense: val });
                                }
                              }}
                              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                            >
                              {STANDARD_OFFENSES.map((o) => (
                                <option key={o} value={o}>
                                  {o} (₱{fineFor(o).toLocaleString()})
                                </option>
                              ))}
                              <option value="__custom__">★ Other / Custom Violation...</option>
                            </select>
                          )}

                          {/* Fine Amount & Presets */}
                          <div className="flex flex-col gap-1.5 pt-1 border-t border-border/30">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-subtle font-mono-tab">
                                Penalty Fine (PHP)
                              </span>
                              <span className="text-xs font-mono-tab font-bold text-primary">
                                ₱{Number(item.amount || 0).toLocaleString()}
                              </span>
                            </div>

                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground font-mono-tab">
                                ₱
                              </span>
                              <input
                                type="number"
                                required
                                min={100}
                                step={50}
                                value={item.amount}
                                onChange={(e) => updateFormViolationItem(item.id, { amount: Number(e.target.value) })}
                                className="w-full rounded-lg border border-border bg-background pl-7 pr-3 py-1.5 text-xs font-mono-tab font-bold text-foreground focus:border-primary focus:outline-none"
                              />
                            </div>

                            <div className="flex items-center gap-1 flex-wrap pt-0.5">
                              {[500, 1000, 1500, 2000, 2500, 3000, 5000].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => updateFormViolationItem(item.id, { amount: preset })}
                                  className={cn(
                                    "rounded px-2 py-0.5 text-[10px] font-mono-tab font-semibold border transition-all",
                                    item.amount === preset
                                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                      : "bg-panel border-border text-muted-foreground hover:text-foreground hover:bg-panel-elevated"
                                  )}
                                >
                                  ₱{preset >= 1000 ? `${preset / 1000}k` : preset}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Quick Add Violation Button */}
                    <button
                      type="button"
                      onClick={addFormViolationItem}
                      className="w-full rounded-xl border border-dashed border-border py-2 text-xs font-bold text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Plus className="size-3.5" />
                      Add Another Violation to Citation Ticket
                    </button>

                    {/* Combined Total Summary Card */}
                    <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-mono-tab text-[10px] font-bold uppercase tracking-widest text-subtle">
                          Total Combined Statutory Penalty
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formViolationItems.length} {formViolationItems.length === 1 ? "violation" : "violations"} charged on single citation slip
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono-tab text-base font-black text-primary">
                          ₱{totalFormAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

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
                  <div className="flex flex-col gap-2.5 rounded-xl border border-white/10 bg-panel-elevated/40 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono-tab text-[10px] uppercase tracking-widest text-foreground font-bold flex items-center gap-1.5">
                        <Camera className="size-3.5 text-primary" /> CCTV / Photo Evidence Attachment
                      </span>
                      <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/10 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setEvidenceSource("cctv")}
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
                          Upload Photos {formUploadedItems.length > 0 && `(${formUploadedItems.length})`}
                        </button>
                      </div>
                    </div>

                    {evidenceSource === "cctv" ? (
                      <div className="flex flex-col gap-2">
                        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black shadow-inner">
                          <img
                            src={formCctvSnapshot}
                            alt="CCTV Node Frame"
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
                        </div>

                        <select
                          value={formCam}
                          onChange={(e) => {
                            setFormCam(e.target.value);
                            const node = QC_CCTV_NODES.find((n) => n.code === e.target.value);
                            if (node) setFormCctvSnapshot(node.snapshot);
                          }}
                          className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                        >
                          {QC_CCTV_NODES.map((n) => (
                            <option key={n.code} value={n.code}>
                              {n.code} ({n.label})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2.5">
                        {formUploadedItems.length > 0 ? (
                          <div className="flex flex-col gap-2">
                            {/* Active uploaded preview */}
                            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black shadow-inner group">
                              <img
                                src={formUploadedItems[selectedUploadIndex]?.url}
                                alt={`Uploaded frame ${selectedUploadIndex + 1}`}
                                className="size-full object-cover"
                              />
                              <div className="absolute inset-x-3 top-3 flex items-center justify-between pointer-events-none">
                                <span className="rounded bg-black/75 px-2 py-0.5 font-mono-tab text-[9px] font-bold text-amber-400 border border-amber-500/30">
                                  ● FRAME {selectedUploadIndex + 1} OF {formUploadedItems.length}
                                </span>
                                <span className="rounded bg-black/75 px-2 py-0.5 font-mono-tab text-[9px] text-white/80 border border-white/10 truncate max-w-[130px]">
                                  {formUploadedItems[selectedUploadIndex]?.fileName}
                                </span>
                              </div>

                              {formUploadedItems.length > 1 && (
                                <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedUploadIndex((prev) =>
                                        prev > 0 ? prev - 1 : formUploadedItems.length - 1
                                      )
                                    }
                                    className="pointer-events-auto rounded-full bg-black/70 hover:bg-black p-1.5 text-white shadow border border-white/10 transition-all"
                                    title="Previous frame"
                                  >
                                    <ChevronLeft className="size-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedUploadIndex((prev) =>
                                        prev < formUploadedItems.length - 1 ? prev + 1 : 0
                                      )
                                    }
                                    className="pointer-events-auto rounded-full bg-black/70 hover:bg-black p-1.5 text-white shadow border border-white/10 transition-all"
                                    title="Next frame"
                                  >
                                    <ChevronRight className="size-4" />
                                  </button>
                                </div>
                              )}

                              <div className="absolute inset-x-4 bottom-2.5 rounded-lg border border-emerald-400/80 bg-black/75 p-1.5 backdrop-blur-sm pointer-events-none flex items-center justify-between text-[10px] font-mono-tab text-emerald-400">
                                <span className="font-bold flex items-center gap-1">
                                  <ScanLine className="size-3" /> ANPR: {formPlate || "PLATE-NUMBER"}
                                </span>
                                <span className="font-bold">{formUploadedItems[selectedUploadIndex]?.sizeKb} KB OPTIMIZED</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeUploadedItem(formUploadedItems[selectedUploadIndex]?.id)}
                                className="absolute right-3 bottom-2.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white p-1.5 shadow transition-all pointer-events-auto z-10"
                                title="Remove photo"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>

                            {/* Thumbnail row */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                              {formUploadedItems.map((item, uIdx) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => setSelectedUploadIndex(uIdx)}
                                  className={cn(
                                    "relative h-12 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                                    selectedUploadIndex === uIdx
                                      ? "border-primary ring-2 ring-primary/30"
                                      : "border-border opacity-70 hover:opacity-100"
                                  )}
                                >
                                  <img src={item.url} alt={`Thumb ${uIdx + 1}`} className="size-full object-cover" />
                                  <span className="absolute bottom-0.5 right-0.5 rounded bg-black/80 px-1 py-0.2 font-mono-tab text-[8px] font-bold text-white">
                                    #{uIdx + 1}
                                  </span>
                                </button>
                              ))}

                              <label className="cursor-pointer flex h-12 w-16 shrink-0 flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 text-primary hover:border-primary hover:bg-primary/10 transition-all">
                                <Plus className="size-3.5" />
                                <span className="text-[8px] font-bold">+ Photo</span>
                                <input
                                  type="file"
                                  multiple
                                  accept="image/*"
                                  onChange={handleFileUpload}
                                  disabled={isProcessingFile}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>
                        ) : (
                          <label className="cursor-pointer rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 text-center text-xs text-muted-foreground hover:border-primary hover:bg-primary/10 transition-all flex flex-col items-center justify-center gap-1.5">
                            <Upload className="size-5 text-primary" />
                            <span>
                              <strong className="text-primary font-semibold">Upload Photo Evidence</strong> (saved to Supabase Storage)
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              Select multiple photos (e.g. angle, plate close-up, wide context). Auto-optimized.
                            </span>
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={handleFileUpload}
                              disabled={isProcessingFile}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
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
                      disabled={createCitation.isPending || isUploadingEvidence || !formPlate}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 disabled:opacity-50"
                    >
                      {(createCitation.isPending || isUploadingEvidence) && <Loader2 className="size-3.5 animate-spin" />}
                      {isUploadingEvidence
                        ? `Uploading ${formUploadedItems.length} Photo(s)...`
                        : `Issue Citation (${formViolationItems.length > 1 ? `${formViolationItems.length} Violations · ` : ""}${evidenceSource === "upload" && formUploadedItems.length > 0 ? `${formUploadedItems.length} Photo${formUploadedItems.length > 1 ? "s" : ""} · ` : ""}${formatPeso(totalFormAmount)})`}
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
              const isCitizen = s === "citizen";
              return (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={cn(
                    "shrink-0 rounded-lg px-3 py-1.5 font-mono-tab text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5",
                    active
                      ? isCitizen
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-primary text-primary-foreground shadow-sm"
                      : isCitizen
                        ? "text-emerald-400 hover:text-emerald-300"
                        : "text-subtle hover:text-foreground",
                  )}
                >
                  {isCitizen && <UserCheck className="size-3 shrink-0" />}
                  {isCitizen ? "Citizen Motorists" : s}
                  <span className={cn(
                    "ml-1 rounded-full px-1.5 py-0.2 text-[9px]",
                    active ? "bg-black/40 text-white" : "bg-white/10 text-muted-foreground"
                  )}>
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
              placeholder="Search NOV#, plate, vehicle, motorist, officer…"
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
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="font-mono-tab text-sm font-bold text-foreground">{selectedCitation.plate_number}</p>
                      {selectedCitation.ltoAlarmTagged && (
                        <span className="rounded bg-red-500/20 border border-red-500/30 px-1.5 py-0.2 font-mono-tab text-[9px] font-bold text-red-400 uppercase">
                          LTO Hold
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-subtle font-mono-tab text-[10px] uppercase">Vehicle Model</span>
                    <p className="font-medium text-foreground mt-0.5">{selectedCitation.vehicle_model || "Registered Vehicle"}</p>
                  </div>

                  {/* Citizen Motorist Linkage */}
                  <div className="col-span-2">
                    {selectedCitation.isCitizenRegistered ? (
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <UserCheck className="size-4 text-emerald-400" />
                            <span className="text-xs font-bold text-emerald-400">
                              Verified Citizen Motorist Profile
                            </span>
                          </div>
                          <Link
                            to="/vehicles/$plate"
                            params={{ plate: selectedCitation.plate_number }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:underline"
                          >
                            Vehicle Registry <ExternalLink className="size-3" />
                          </Link>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-1 border-t border-emerald-500/20">
                          <div>
                            <span className="text-[9px] font-mono-tab uppercase text-subtle">Motorist Name</span>
                            <p className="font-semibold text-foreground">{selectedCitation.citizenName || selectedCitation.registeredOwner || "Verified Resident"}</p>
                          </div>
                          {selectedCitation.citizenEmail && (
                            <div>
                              <span className="text-[9px] font-mono-tab uppercase text-subtle">Citizen Email</span>
                              <p className="text-foreground truncate">{selectedCitation.citizenEmail}</p>
                            </div>
                          )}
                          {selectedCitation.citizenPhone && (
                            <div>
                              <span className="text-[9px] font-mono-tab uppercase text-subtle">Mobile Contact</span>
                              <p className="text-foreground font-mono-tab">{selectedCitation.citizenPhone}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-border/70 bg-panel/60 p-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Car className="size-3.5 text-muted-foreground shrink-0" />
                          <span className="text-[11px] text-muted-foreground">
                            Owner: <strong className="text-foreground">{selectedCitation.registeredOwner || "Unregistered Standard Motorist"}</strong>
                          </span>
                        </div>
                        <Link
                          to="/vehicles/$plate"
                          params={{ plate: selectedCitation.plate_number }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                        >
                          Registry <ExternalLink className="size-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                  {(() => {
                    const parsedOffenses = parseCitationOffenses(selectedCitation.offense, selectedCitation.amount);
                    return (
                      <div className="col-span-2 rounded-xl border border-border/60 bg-background/50 p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-subtle font-mono-tab text-[10px] uppercase font-bold">
                            Charged Violation(s)
                          </span>
                          {parsedOffenses.length > 1 && (
                            <span className="rounded bg-primary/20 border border-primary/30 px-2 py-0.5 font-mono-tab text-[10px] font-bold text-primary">
                              {parsedOffenses.length} Offenses on 1 Ticket
                            </span>
                          )}
                        </div>
                        {parsedOffenses.length > 1 ? (
                          <div className="flex flex-col divide-y divide-border/30">
                            {parsedOffenses.map((item, idx) => (
                              <div key={idx} className="py-1.5 flex items-center justify-between text-xs">
                                <span className="font-semibold text-foreground flex items-center gap-1.5">
                                  <span className="grid size-4 place-items-center rounded-full bg-white/10 text-[9px] font-mono-tab text-muted-foreground">
                                    {idx + 1}
                                  </span>
                                  {item.name}
                                </span>
                                <span className="font-mono-tab text-xs font-bold text-foreground">
                                  {formatPeso(item.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-foreground text-sm">{parsedOffenses[0]?.name || selectedCitation.offense}</p>
                            <span className="font-mono-tab text-xs font-bold text-foreground">
                              {formatPeso(parsedOffenses[0]?.amount || selectedCitation.amount)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  <div>
                    <span className="text-subtle font-mono-tab text-[10px] uppercase">Total Assessed Fine</span>
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

                {/* Photographic Evidence Frame Viewer (Interactive Multi-Frame Gallery) */}
                {(() => {
                  const slipFrames = parseEvidenceUrls(selectedCitation.evidence_url);
                  const activeUrl = slipFrames[activeSlipFrameIndex] || slipFrames[0] || "/assets/violation-1.jpg";
                  return (
                    <div className="flex flex-col gap-2">
                      <div className="rounded-xl border border-border bg-black overflow-hidden relative shadow-inner">
                        <img
                          src={activeUrl}
                          alt={`Evidence capture for ${selectedCitation.plate_number} frame ${activeSlipFrameIndex + 1}`}
                          className="h-52 w-full object-cover"
                        />
                        <div className="absolute inset-x-3 top-3 flex items-center justify-between pointer-events-none">
                          <span className="rounded bg-black/75 px-2 py-0.5 font-mono-tab text-[9px] font-bold text-red-400 border border-red-500/40 flex items-center gap-1">
                            ● EVIDENCE CAPTURE · {selectedCitation.citation_number}
                            {slipFrames.length > 1 && ` [${activeSlipFrameIndex + 1}/${slipFrames.length}]`}
                          </span>
                          <span className="rounded bg-black/75 px-2 py-0.5 font-mono-tab text-[9px] text-emerald-400 border border-emerald-500/30 font-bold">
                            {activeUrl.includes("supabase.co") ? "Supabase Storage CDN" : "Optical Sensor Frame"}
                          </span>
                        </div>

                        {slipFrames.length > 1 && (
                          <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveSlipFrameIndex((prev) =>
                                  prev > 0 ? prev - 1 : slipFrames.length - 1
                                )
                              }
                              className="pointer-events-auto rounded-full bg-black/75 hover:bg-black p-1.5 text-white shadow border border-white/10 transition-all"
                              title="Previous evidence frame"
                            >
                              <ChevronLeft className="size-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setActiveSlipFrameIndex((prev) =>
                                  prev < slipFrames.length - 1 ? prev + 1 : 0
                                )
                              }
                              className="pointer-events-auto rounded-full bg-black/75 hover:bg-black p-1.5 text-white shadow border border-white/10 transition-all"
                              title="Next evidence frame"
                            >
                              <ChevronRight className="size-4" />
                            </button>
                          </div>
                        )}

                        <div className="absolute inset-x-4 bottom-3 rounded-lg border border-emerald-400/80 bg-black/80 p-2 backdrop-blur-sm pointer-events-none flex items-center justify-between text-[10px] font-mono-tab text-emerald-400">
                          <span className="font-bold">ANPR OCR: {selectedCitation.plate_number}</span>
                          <span className="font-bold">
                            {slipFrames.length > 1
                              ? `FRAME ${activeSlipFrameIndex + 1} OF ${slipFrames.length} VERIFIED`
                              : "VERIFIED EVIDENCE"}
                          </span>
                        </div>
                      </div>

                      {slipFrames.length > 1 && (
                        <div className="flex items-center justify-between gap-2 px-0.5">
                          <div className="flex items-center gap-2 overflow-x-auto py-1">
                            {slipFrames.map((frameUrl, fIdx) => (
                              <button
                                key={fIdx}
                                type="button"
                                onClick={() => setActiveSlipFrameIndex(fIdx)}
                                className={cn(
                                  "relative h-12 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                                  activeSlipFrameIndex === fIdx
                                    ? "border-primary ring-2 ring-primary/40 shadow-sm"
                                    : "border-border opacity-70 hover:opacity-100"
                                )}
                              >
                                <img src={frameUrl} alt={`Frame ${fIdx + 1}`} className="size-full object-cover" />
                                <span className="absolute bottom-0.5 right-0.5 rounded bg-black/85 px-1 py-0.2 font-mono-tab text-[8px] font-bold text-white">
                                  #{fIdx + 1}
                                </span>
                              </button>
                            ))}
                          </div>

                          <a
                            href={activeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-panel px-2.5 py-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:bg-panel-elevated transition-colors shrink-0"
                          >
                            <ExternalLink className="size-3" />
                            HD Frame
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })()}

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
                  {selectedCitation.status === "paid" ? (
                    <a
                      href={`/portal/receipt/${selectedCitation.citation_number}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 px-3.5 py-2 text-xs font-bold text-emerald-400 transition-colors shadow-sm"
                    >
                      <Receipt className="size-3.5" />
                      <span>View e-OR & Clearance Pass</span>
                      <ExternalLink className="size-3" />
                    </a>
                  ) : (
                    <a
                      href={`/portal/pay/${selectedCitation.citation_number}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary/20 border border-primary/40 hover:bg-primary/30 px-3.5 py-2 text-xs font-bold text-primary transition-colors shadow-sm"
                    >
                      <CreditCard className="size-3.5" />
                      <span>Open Motorist Portal</span>
                      <ExternalLink className="size-3" />
                    </a>
                  )}

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
      <td className="px-5 py-3.5 font-mono-tab font-semibold text-foreground">
        <div className="flex items-center gap-1.5">
          <span>{c.plate_number}</span>
          {c.ltoAlarmTagged && (
            <span className="rounded bg-red-500/20 border border-red-500/30 px-1 py-0.2 font-mono-tab text-[8px] font-bold text-red-400 uppercase">
              Hold
            </span>
          )}
        </div>
        {c.isCitizenRegistered ? (
          <div className="mt-0.5 flex items-center gap-1">
            <span className="inline-flex items-center gap-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 font-mono-tab text-[9px] font-bold text-emerald-400 uppercase">
              <UserCheck className="size-2.5 shrink-0" />
              Citizen
            </span>
          </div>
        ) : (
          c.registeredOwner && (
            <div className="mt-0.5 text-[9px] text-muted-foreground/60 truncate max-w-[110px]">
              {c.registeredOwner}
            </div>
          )
        )}
      </td>
      <td className="px-5 py-3.5 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">{c.vehicle_model ?? "—"}</p>
        {c.citizenName && (
          <p className="text-[10px] text-emerald-400/90 font-medium truncate max-w-[130px]" title={c.citizenName}>
            {c.citizenName}
          </p>
        )}
      </td>
      <td className="px-5 py-3.5 text-xs">
        {(() => {
          const parsed = parseCitationOffenses(c.offense, c.amount);
          return parsed.length > 1 ? (
            <div className="flex flex-col gap-0.5 max-w-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="rounded bg-primary/20 border border-primary/30 px-1.5 py-0.5 font-mono-tab text-[9px] font-bold text-primary whitespace-nowrap">
                  {parsed.length} Violations
                </span>
                <span className="font-semibold text-foreground truncate">
                  {parsed[0].name}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground truncate" title={c.offense}>
                +{parsed.slice(1).map((s) => s.name).join(", ")}
              </span>
            </div>
          ) : (
            <span className="font-semibold text-foreground">{parsed[0]?.name || c.offense}</span>
          );
        })()}
      </td>
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
        <div className="flex items-center justify-end gap-1.5">
          {c.status === "paid" ? (
            <a
              href={`/portal/receipt/${c.citation_number}`}
              target="_blank"
              rel="noreferrer"
              title="Open Official e-OR & LTO Clearance Pass"
              className="inline-flex items-center justify-center size-7 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors shrink-0"
            >
              <Receipt className="size-3.5" />
            </a>
          ) : (
            <a
              href={`/portal/pay/${c.citation_number}`}
              target="_blank"
              rel="noreferrer"
              title="Open Public Payment Portal"
              className="inline-flex items-center justify-center size-7 rounded-lg border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0"
            >
              <CreditCard className="size-3.5" />
            </a>
          )}
          <button
            onClick={onOpenDetail}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-panel px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-panel-elevated hover:text-white transition-colors"
          >
            <FileText className="size-3.5" />
            <span>Slip</span>
          </button>
        </div>
      </td>
    </tr>
  );
}
