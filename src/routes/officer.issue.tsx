import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  LayoutDashboard,
  FileSignature,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Car,
  Receipt,
  Sparkles,
  Upload,
  Trash2,
  Plus,
  Layers,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  UserCheck,
  ShieldAlert,
} from "lucide-react";
import { useCreateCitation, formatPeso, useVehicleLookup } from "@/lib/data/traffic";
import { useAuth } from "@/hooks/use-auth";
import { fineFor, formatOffenseItems } from "@/lib/data/review";
import { uploadMultipleEvidenceToSupabase, serializeEvidenceUrls } from "@/lib/storage";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/officer/issue")({
  head: () => ({
    meta: [{ title: "Issue Digital Citation · Culiat Traffic Ops" }],
  }),
  component: IssuePage,
});

export type CitationViolationItem = {
  id: string;
  offense: string;
  amount: number;
  isCustom: boolean;
  customText: string;
};

export type EvidenceItem = {
  id: string;
  url: string;
  fileName: string;
  sizeKb: number;
};

const OFFENSES = [
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

function IssuePage() {
  const { user } = useAuth();
  const createCitation = useCreateCitation();

  const [plate, setPlate] = useState("");
  const [model, setModel] = useState("");
  const { data: lookedUpVehicle, isLoading: isLookingUpPlate } = useVehicleLookup(plate);

  // Auto-fill vehicle model when recognized in registry
  useEffect(() => {
    if (lookedUpVehicle?.makeModel && !model) {
      setModel(lookedUpVehicle.makeModel);
    }
  }, [lookedUpVehicle, model]);
  const [violationItems, setViolationItems] = useState<CitationViolationItem[]>([
    {
      id: "item-1",
      offense: OFFENSES[0],
      amount: fineFor(OFFENSES[0]),
      isCustom: false,
      customText: "",
    },
  ]);
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);
  const [selectedEvidenceIndex, setSelectedEvidenceIndex] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [lastIssuedNumber, setLastIssuedNumber] = useState<string | null>(null);

  const totalAmount = useMemo(() => {
    return violationItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  }, [violationItems]);

  const totalEvidenceKb = useMemo(() => {
    return evidenceItems.reduce((acc, item) => acc + (item.sizeKb || 0), 0);
  }, [evidenceItems]);

  const addViolationItem = () => {
    const nextOffense = OFFENSES.find((o) => !violationItems.some((item) => item.offense === o)) || OFFENSES[0];
    setViolationItems((prev) => [
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

  const removeViolationItem = (id: string) => {
    if (violationItems.length <= 1) return;
    setViolationItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateViolationItem = (id: string, updates: Partial<CitationViolationItem>) => {
    setViolationItems((prev) =>
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

  const handleEvidenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter((f) => f.type.startsWith("image/"));
    if (validFiles.length === 0) {
      toast.error("Please attach valid image files (PNG, JPG, WebP)");
      return;
    }

    setIsCompressing(true);
    try {
      const newItems: EvidenceItem[] = [];
      for (const file of validFiles) {
        const { url, sizeKb } = await compressImageFile(file);
        newItems.push({
          id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          url,
          fileName: file.name,
          sizeKb,
        });
      }

      setEvidenceItems((prev) => {
        const updated = [...prev, ...newItems];
        setSelectedEvidenceIndex(updated.length - 1);
        return updated;
      });

      toast.success(
        validFiles.length === 1
          ? `Evidence Frame Attached (${newItems[0].sizeKb} KB)`
          : `${validFiles.length} Evidence Frames Attached`
      );
    } catch (err) {
      console.error("Image compression error", err);
      toast.error("Failed to process attached photo(s)");
    } finally {
      setIsCompressing(false);
      e.target.value = "";
    }
  };

  const removeEvidenceItem = (id: string) => {
    setEvidenceItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      setSelectedEvidenceIndex((curr) => (curr >= next.length ? Math.max(0, next.length - 1) : curr));
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate) return;

    const validViolationItems = violationItems
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

    let finalEvidenceUrl: string | null = null;
    if (evidenceItems.length > 0) {
      setIsUploading(true);
      try {
        const uploadedUrls = await uploadMultipleEvidenceToSupabase(
          evidenceItems.map((item) => item.url),
          {
            plateNumber: plate,
            category: combinedOffense,
            folder: "officer_apprehensions",
          }
        );
        finalEvidenceUrl = serializeEvidenceUrls(uploadedUrls);
      } catch (err) {
        console.warn("Storage upload fallback:", err);
        finalEvidenceUrl = serializeEvidenceUrls(evidenceItems.map((item) => item.url));
      } finally {
        setIsUploading(false);
      }
    }

    createCitation.mutate(
      {
        violation_id: null,
        plate_number: plate,
        vehicle_model: model || null,
        offense: combinedOffense,
        amount: totalAmount,
        officer_name: user?.email ?? "Enforcement Officer",
        evidence_url: finalEvidenceUrl,
        location: "Quezon City Road Apprehension",
      },
      {
        onSuccess: (data) => {
          toast.success(`Citation #${data.citation_number} issued for ${plate}`, {
            description: `${validViolationItems.length} violation(s) charged · ${evidenceItems.length} evidence photo(s) · Total: ${formatPeso(totalAmount)}`,
          });
          setLastIssuedNumber(data.citation_number);
          setPlate("");
          setModel("");
          setViolationItems([
            {
              id: "item-1",
              offense: OFFENSES[0],
              amount: fineFor(OFFENSES[0]),
              isCustom: false,
              customText: "",
            },
          ]);
          setEvidenceItems([]);
          setSelectedEvidenceIndex(0);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  return (
    <div className="flex flex-col p-4 pb-20 max-w-xl mx-auto w-full min-h-screen bg-background border-x border-border">
      {/* Back Navigation Bar */}
      <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
        <Link
          to="/officer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-panel-elevated transition-colors"
        >
          <ArrowLeft className="size-3.5 text-primary" />
          Terminal
        </Link>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-panel-elevated transition-colors"
        >
          <LayoutDashboard className="size-3.5 text-subtle" />
          Command Center
        </Link>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <div className="grid size-9 place-items-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
          <FileSignature className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Issue Digital Citation (OVR)
          </h2>
          <p className="text-xs text-muted-foreground">Officer On-Site Traffic Violation Ticket</p>
        </div>
      </div>

      {lastIssuedNumber && (
        <div className="mb-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="size-5 text-emerald-400" />
            <div>
              <p className="font-bold text-foreground text-xs">Citation #{lastIssuedNumber} Issued</p>
              <p className="text-[10px] text-muted-foreground">Logged to QC Central LGU Ledger</p>
            </div>
          </div>
          <button
            onClick={() => setLastIssuedNumber(null)}
            className="text-[11px] font-bold text-emerald-400 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="panel rounded-3xl border border-border bg-panel p-5 sm:p-6 shadow-xl flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-subtle font-mono-tab">
            Vehicle License Plate *
          </label>
          <input
            type="text"
            required
            value={plate}
            onChange={(e) => setPlate(e.target.value.toUpperCase())}
            placeholder="e.g. NDB 8921"
            className="rounded-xl border border-border bg-panel-elevated px-3.5 py-2.5 text-sm font-mono-tab uppercase text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        {/* Live Vehicle & Citizen Motorist Lookup Banner */}
        {plate.trim().length >= 2 && (
          <div className="flex flex-col gap-2">
            {isLookingUpPlate ? (
              <div className="rounded-xl border border-border/60 bg-panel-elevated/50 p-2.5 flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                <Loader2 className="size-3.5 animate-spin text-primary" />
                <span>Checking vehicle registry & citizen motorist link…</span>
              </div>
            ) : lookedUpVehicle ? (
              <div className="flex flex-col gap-2">
                {/* LTO Alarm / Hold Warning Banner */}
                {(lookedUpVehicle.ltoAlarmTagged || lookedUpVehicle.riskLevel === "Flagged" || lookedUpVehicle.riskLevel === "Blocked") && (
                  <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-3 flex items-start gap-2.5 text-xs animate-in fade-in">
                    <ShieldAlert className="size-4 text-red-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold text-red-400">
                        {lookedUpVehicle.riskLevel === "Blocked" ? "VEHICLE BLOCKED FOR APPREHENSION" : "ACTIVE LTO ALARM / HOLD"}
                      </p>
                      <p className="text-[11px] text-red-200/80 mt-0.5">
                        This vehicle has {lookedUpVehicle.unpaidCitationsCount} outstanding notice(s) totaling {formatPeso(lookedUpVehicle.outstandingAmount)}. LTO registration renewal is held.
                      </p>
                    </div>
                  </div>
                )}

                {/* Citizen Motorist Profile Card */}
                {lookedUpVehicle.isCitizenRegistered ? (
                  <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 flex flex-col gap-2 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="size-4 text-emerald-400 shrink-0" />
                        <span className="font-bold text-xs text-emerald-400">
                          Verified Citizen Motorist Profile
                        </span>
                      </div>
                      <span className="rounded bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 font-mono-tab text-[9px] font-bold text-emerald-300 uppercase">
                        QC Citizen
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-emerald-500/20">
                      <div>
                        <span className="text-[9px] font-mono-tab uppercase text-subtle">Motorist Name</span>
                        <p className="font-bold text-foreground">{lookedUpVehicle.citizenName || lookedUpVehicle.registeredOwner}</p>
                      </div>
                      {lookedUpVehicle.citizenPhone && (
                        <div>
                          <span className="text-[9px] font-mono-tab uppercase text-subtle">Mobile Contact</span>
                          <p className="font-mono-tab text-foreground">{lookedUpVehicle.citizenPhone}</p>
                        </div>
                      )}
                      {lookedUpVehicle.citizenDriverLicense && (
                        <div>
                          <span className="text-[9px] font-mono-tab uppercase text-subtle">Driver's License</span>
                          <p className="font-mono-tab text-foreground">{lookedUpVehicle.citizenDriverLicense}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-[9px] font-mono-tab uppercase text-subtle">Vehicle Model</span>
                        <p className="font-semibold text-foreground">{lookedUpVehicle.makeModel}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border/80 bg-panel-elevated/60 p-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Car className="size-3.5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="font-semibold text-foreground text-xs">
                          {lookedUpVehicle.foundInDatabase ? lookedUpVehicle.registeredOwner : "Unregistered Vehicle"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {lookedUpVehicle.foundInDatabase
                            ? `Standard Motorist · ${lookedUpVehicle.makeModel}`
                            : "New record will be created in QC Vehicle Registry"}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono-tab text-muted-foreground uppercase px-2 py-0.5 rounded bg-panel border border-border">
                      {lookedUpVehicle.riskLevel || "Standard"}
                    </span>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-subtle font-mono-tab">
            Vehicle Model (Optional)
          </label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="e.g. Toyota Vios Silver"
            className="rounded-xl border border-border bg-panel-elevated px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        {/* Multi-Violation & Assessed Penalties Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-subtle font-mono-tab flex items-center gap-1.5">
                <Layers className="size-3.5 text-primary" />
                Charged Violations ({violationItems.length})
              </label>
              {violationItems.length > 1 && (
                <span className="rounded-full bg-primary/20 border border-primary/30 px-2 py-0.5 font-mono-tab text-[10px] font-bold text-primary">
                  Multi-Offense
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={addViolationItem}
              className="inline-flex items-center gap-1 rounded-lg border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary hover:bg-primary/20 transition-all shadow-sm"
            >
              <Plus className="size-3" />
              Add Violation
            </button>
          </div>

          {/* List of Violation Items */}
          <div className="flex flex-col gap-3">
            {violationItems.map((item, index) => (
              <div
                key={item.id}
                className="rounded-2xl border border-border bg-panel-elevated/80 p-4 shadow-sm flex flex-col gap-3 transition-all relative"
              >
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono-tab text-[10px] font-black text-foreground">
                      #{index + 1}
                    </span>
                    <span className="text-xs font-bold text-foreground truncate max-w-[200px]">
                      {item.isCustom
                        ? item.customText || "Custom Violation"
                        : item.offense}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateViolationItem(item.id, { isCustom: !item.isCustom })}
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

                    {violationItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeViolationItem(item.id)}
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
                      onChange={(e) => updateViolationItem(item.id, { customText: e.target.value })}
                      placeholder="e.g. Operating Colorum PUV / Ordinance SP-2957"
                      className="rounded-xl border border-primary/50 bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                    />
                    <span className="text-[10px] text-muted-foreground">
                      Custom local ordinance, MMDA regulation, or special citation code.
                    </span>
                  </div>
                ) : (
                  <select
                    value={item.offense}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "__custom__") {
                        updateViolationItem(item.id, { isCustom: true });
                      } else {
                        updateViolationItem(item.id, { offense: val });
                      }
                    }}
                    className="rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  >
                    {OFFENSES.map((o) => (
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
                      onChange={(e) => updateViolationItem(item.id, { amount: Number(e.target.value) })}
                      className="w-full rounded-xl border border-border bg-background pl-7 pr-3 py-1.5 text-xs font-mono-tab font-bold text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-1 flex-wrap pt-0.5">
                    {[500, 1000, 1500, 2000, 2500, 3000, 5000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => updateViolationItem(item.id, { amount: preset })}
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
            onClick={addViolationItem}
            className="w-full rounded-xl border border-dashed border-border py-2 text-xs font-bold text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-1.5"
          >
            <Plus className="size-3.5" />
            Add Another Violation to Citation Ticket
          </button>

          {/* Combined Total Summary Card */}
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3.5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-mono-tab text-[10px] font-bold uppercase tracking-widest text-subtle">
                Total Combined Statutory Penalty
              </span>
              <span className="text-[11px] text-muted-foreground">
                {violationItems.length} {violationItems.length === 1 ? "violation" : "violations"} charged on single citation slip
              </span>
            </div>
            <div className="text-right">
              <span className="font-mono-tab text-lg font-black text-primary">
                ₱{totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Evidence Photo Attachment (Multiple Frames) */}
        <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-panel-elevated/60 p-3.5">
          <div className="flex items-center justify-between">
            <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle font-bold flex items-center gap-1.5">
              <Camera className="size-3.5 text-primary" /> Body-Cam / Evidence Attachment
            </span>
            {evidenceItems.length > 0 && (
              <span className="text-[10px] font-mono-tab text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                {evidenceItems.length} {evidenceItems.length === 1 ? "Frame" : "Frames"} Attached ({totalEvidenceKb} KB)
              </span>
            )}
          </div>

          {evidenceItems.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {/* Active High-Definition Frame Preview */}
              <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black shadow-inner group">
                <img
                  src={evidenceItems[selectedEvidenceIndex]?.url}
                  alt={`Evidence frame ${selectedEvidenceIndex + 1}`}
                  className="size-full object-cover"
                />

                {/* Top Overlay Badge */}
                <div className="absolute inset-x-3 top-3 flex items-center justify-between pointer-events-none">
                  <span className="rounded bg-black/75 px-2 py-0.5 font-mono-tab text-[9px] font-bold text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    ● FRAME {selectedEvidenceIndex + 1} OF {evidenceItems.length} · {plate || "UNREGISTERED"}
                  </span>
                  <span className="rounded bg-black/75 px-2 py-0.5 font-mono-tab text-[9px] text-white/80 border border-white/10 truncate max-w-[140px]">
                    {evidenceItems[selectedEvidenceIndex]?.fileName}
                  </span>
                </div>

                {/* Left/Right Arrow Overlays when multiple frames exist */}
                {evidenceItems.length > 1 && (
                  <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedEvidenceIndex((prev) =>
                          prev > 0 ? prev - 1 : evidenceItems.length - 1
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
                        setSelectedEvidenceIndex((prev) =>
                          prev < evidenceItems.length - 1 ? prev + 1 : 0
                        )
                      }
                      className="pointer-events-auto rounded-full bg-black/70 hover:bg-black p-1.5 text-white shadow border border-white/10 transition-all"
                      title="Next frame"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                )}

                {/* Bottom Overlay Status */}
                <div className="absolute inset-x-4 bottom-3 rounded-lg border border-emerald-400/80 bg-black/80 p-2 backdrop-blur-sm pointer-events-none flex items-center justify-between text-[10px] font-mono-tab text-emerald-400">
                  <span className="font-bold">ANPR OCR: {plate || "PENDING"}</span>
                  <span className="font-bold">{evidenceItems[selectedEvidenceIndex]?.sizeKb} KB OPTIMIZED</span>
                </div>

                {/* Remove active frame */}
                <button
                  type="button"
                  onClick={() => removeEvidenceItem(evidenceItems[selectedEvidenceIndex]?.id)}
                  className="absolute right-3 bottom-3 rounded-lg bg-red-500/80 hover:bg-red-500 text-white p-1.5 shadow transition-all pointer-events-auto z-10"
                  title="Remove this frame"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>

              {/* Thumbnails Strip & Add Frame Button */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {evidenceItems.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedEvidenceIndex(idx)}
                    className={cn(
                      "relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all group",
                      selectedEvidenceIndex === idx
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border opacity-70 hover:opacity-100"
                    )}
                  >
                    <img src={item.url} alt={`Thumb ${idx + 1}`} className="size-full object-cover" />
                    <span className="absolute bottom-0.5 right-0.5 rounded bg-black/80 px-1 py-0.2 font-mono-tab text-[8px] font-bold text-white">
                      #{idx + 1}
                    </span>
                  </button>
                ))}

                {/* Add another photo frame */}
                <label className="cursor-pointer flex h-14 w-20 shrink-0 flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 text-primary hover:border-primary hover:bg-primary/10 transition-all">
                  <Plus className="size-4" />
                  <span className="text-[9px] font-bold mt-0.5">+ Photo</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleEvidenceUpload}
                    disabled={isCompressing}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-panel p-4 text-center hover:border-primary transition-all">
              <Upload className="size-5 text-primary" />
              <span className="text-xs font-semibold text-foreground">
                {isCompressing ? "Processing photo(s)..." : "Attach Evidence Photos / Body-Cam Frames"}
              </span>
              <span className="text-[10px] text-muted-foreground">
                Supports multiple frames (vehicle angle, plate close-up, driver perspective). Auto-optimized.
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleEvidenceUpload}
                disabled={isCompressing}
                className="hidden"
              />
            </label>
          )}
        </div>

        <button
          type="submit"
          disabled={createCitation.isPending || isUploading || !plate}
          className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-xs uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          {(createCitation.isPending || isUploading) && <Loader2 className="size-4 animate-spin" />}
          {isUploading
            ? `Uploading ${evidenceItems.length} Evidence Photo(s)...`
            : `Issue Digital Citation (${violationItems.length > 1 ? `${violationItems.length} Violations · ` : ""}${evidenceItems.length > 0 ? `${evidenceItems.length} Photo${evidenceItems.length > 1 ? "s" : ""} · ` : ""}${formatPeso(totalAmount).replace("PHP", "₱")})`}
        </button>
      </form>
    </div>
  );
}

