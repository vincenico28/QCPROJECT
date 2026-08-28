import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useViolations, useCitations, formatPeso, timeAgo } from "@/lib/data/traffic";
import { verifyVehicleRegistrationLTO } from "@/lib/server.functions";
import { cn } from "@/lib/utils";
import {
  Search,
  Car,
  AlertTriangle,
  ShieldAlert,
  Ban,
  Plus,
  FileSpreadsheet,
  CheckCircle2,
  X,
  Loader2,
  ShieldCheck,
  Building2,
  ExternalLink,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/vehicles/")({
  head: () => ({
    meta: [
      { title: "Vehicle Registry & LTO Database · Culiat Traffic Ops" },
      {
        name: "description",
        content:
          "Barangay Culiat, Quezon City vehicle monitoring registry integrated with LTO LTMS, offender records, and blacklist watchlist tags.",
      },
    ],
  }),
  component: VehiclesPage,
});

type VehicleRow = {
  plate: string;
  model: string | null;
  owner?: string;
  violations: number;
  citations: number;
  unpaid: number;
  outstanding: number;
  totalBilled: number;
  lastSeen: string;
  lastOffense: string;
  risk: "clean" | "watch" | "flagged" | "blocked";
  ltoAlarm?: boolean;
};

const RISKS = ["all", "clean", "watch", "flagged", "blocked"] as const;
type RiskFilter = (typeof RISKS)[number];

function VehiclesPage() {
  const { data: violations = [], isLoading: vLoading } = useViolations(500);
  const { data: citations = [], isLoading: cLoading } = useCitations(500);
  const [risk, setRisk] = useState<RiskFilter>("all");
  const [q, setQ] = useState("");
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

  // Form State
  const [plateInput, setPlateInput] = useState("");
  const [makeModel, setMakeModel] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [color, setColor] = useState("Silver");
  const [vehType, setVehType] = useState("Private Sedan");
  const [chassis, setChassis] = useState("");
  const [isLookingUpLTO, setIsLookingUpLTO] = useState(false);

  // Manual registered vehicles storage
  const [customVehicles, setCustomVehicles] = useState<VehicleRow[]>([]);

  const vehicles = useMemo<VehicleRow[]>(() => {
    const map = new Map<string, VehicleRow>();

    for (const v of violations) {
      const row =
        map.get(v.plate_number) ??
        ({
          plate: v.plate_number,
          model: null,
          violations: 0,
          citations: 0,
          unpaid: 0,
          outstanding: 0,
          totalBilled: 0,
          lastSeen: v.detected_at,
          lastOffense: v.violation_type,
          risk: "clean",
          ltoAlarm: false,
        } as VehicleRow);
      row.violations += 1;
      if (new Date(v.detected_at) >= new Date(row.lastSeen)) {
        row.lastSeen = v.detected_at;
        row.lastOffense = v.violation_type;
      }
      map.set(v.plate_number, row);
    }

    for (const c of citations) {
      const row =
        map.get(c.plate_number) ??
        ({
          plate: c.plate_number,
          model: c.vehicle_model,
          violations: 0,
          citations: 0,
          unpaid: 0,
          outstanding: 0,
          totalBilled: 0,
          lastSeen: c.issued_at,
          lastOffense: c.offense,
          risk: "clean",
          ltoAlarm: false,
        } as VehicleRow);
      row.model = row.model ?? c.vehicle_model;
      row.citations += 1;
      row.totalBilled += Number(c.amount);
      if (c.status === "unpaid" || c.status === "overdue") {
        row.unpaid += 1;
        row.outstanding += Number(c.amount);
      }
      if (new Date(c.issued_at) >= new Date(row.lastSeen)) {
        row.lastSeen = c.issued_at;
        row.lastOffense = c.offense;
      }
      map.set(c.plate_number, row);
    }

    for (const cv of customVehicles) {
      if (!map.has(cv.plate)) {
        map.set(cv.plate, cv);
      }
    }

    const rows = Array.from(map.values()).map((r) => {
      const total = r.violations + r.citations;
      let risk: VehicleRow["risk"] = "clean";
      let ltoAlarm = false;

      if (r.outstanding >= 5000 || r.unpaid >= 3) {
        risk = "blocked";
        ltoAlarm = true;
      } else if (total >= 4 || r.outstanding > 0) {
        risk = "flagged";
      } else if (total >= 2) {
        risk = "watch";
      }
      return { ...r, risk, ltoAlarm };
    });

    rows.sort(
      (a, b) =>
        b.outstanding - a.outstanding || b.violations + b.citations - (a.violations + a.citations),
    );
    return rows;
  }, [violations, citations, customVehicles]);

  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      if (risk !== "all" && v.risk !== risk) return false;
      if (!q) return true;
      const n = q.toLowerCase();
      return (
        v.plate.toLowerCase().includes(n) ||
        (v.model ?? "").toLowerCase().includes(n) ||
        (v.owner ?? "").toLowerCase().includes(n) ||
        v.lastOffense.toLowerCase().includes(n)
      );
    });
  }, [vehicles, risk, q]);

  const counts = useMemo(() => {
    return {
      all: vehicles.length,
      clean: vehicles.filter((v) => v.risk === "clean").length,
      watch: vehicles.filter((v) => v.risk === "watch").length,
      flagged: vehicles.filter((v) => v.risk === "flagged").length,
      blocked: vehicles.filter((v) => v.risk === "blocked").length,
    } as Record<RiskFilter, number>;
  }, [vehicles]);

  const totalOutstanding = vehicles.reduce((s, v) => s + v.outstanding, 0);
  const isLoading = vLoading || cLoading;

  const handleLtoLookup = async () => {
    if (!plateInput) return;
    setIsLookingUpLTO(true);
    try {
      const record = await verifyVehicleRegistrationLTO({ data: { plateNumber: plateInput } });
      setMakeModel(record.makeModel);
      setOwnerName(record.registeredOwner);
      setColor(record.color);
      setChassis(record.chassisNumber);
      toast.success("LTO LTMS Record Located", {
        description: `${record.makeModel} · Owner: ${record.registeredOwner}`,
      });
    } catch {
      toast.error("LTO lookup failed");
    } finally {
      setIsLookingUpLTO(false);
    }
  };

  const handleRegisterVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateInput) return;
    const cleanP = plateInput.toUpperCase().trim();
    const newV: VehicleRow = {
      plate: cleanP,
      model: makeModel || "Registered Vehicle",
      owner: ownerName || "Registered Owner",
      violations: 0,
      citations: 0,
      unpaid: 0,
      outstanding: 0,
      totalBilled: 0,
      lastSeen: new Date().toISOString(),
      lastOffense: "None (Clean Record)",
      risk: "clean",
      ltoAlarm: false,
    };

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      await supabase.from("vehicles").insert({
        plate_number: cleanP,
        make_model: makeModel || "Registered Vehicle",
        registered_owner: ownerName || "Registered Owner",
        color: color || "Silver",
        chassis_number: chassis || null,
        registration_status: "CURRENT",
        risk_level: "Clean",
        lto_alarm_tagged: false,
      });
    } catch {
      // fallback
    }

    setCustomVehicles((prev) => [newV, ...prev]);
    toast.success(`Vehicle ${cleanP} Registered`, {
      description: `Added to QC Barangay Culiat enforcement database.`,
    });
    setRegisterModalOpen(false);
    setPlateInput("");
    setMakeModel("");
    setOwnerName("");
    setChassis("");
  };

  const handleExportCSV = () => {
    const headers = "Plate Number,Make & Model,Violations,Citations,Unpaid Fines,Outstanding Balance,Last Offense,Risk Level\n";
    const rows = filtered
      .map(
        (v) =>
          `"${v.plate}","${v.model || "N/A"}",${v.violations},${v.citations},${v.unpaid},${v.outstanding},"${v.lastOffense}","${v.risk.toUpperCase()}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `QC_Vehicle_Registry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Vehicle registry exported to CSV");
  };

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-primary/20 px-2 py-0.5 font-mono-tab text-[10px] font-bold text-primary border border-primary/30">
              QC LGU & LTO LTMS REGISTRY
            </span>
            <span className="text-xs text-subtle">· Motor Vehicle Database</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            Vehicle Registry & Watchlist
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Monitor registered motorists, track persistent repeat offenders, and manage LTO LTMS vehicle alarm hold tags.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-panel-elevated transition-colors"
          >
            <FileSpreadsheet className="size-3.5 text-emerald-400" />
            Export CSV
          </button>

          {/* Register Vehicle Modal */}
          <Dialog.Root open={registerModalOpen} onOpenChange={setRegisterModalOpen}>
            <Dialog.Trigger asChild>
              <button className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all">
                <Plus className="size-3.5" />
                Register Vehicle
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-panel p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95">
                <div className="flex items-start justify-between border-b border-border pb-3">
                  <Dialog.Title className="text-base font-bold text-white flex items-center gap-2">
                    <Car className="size-4 text-primary" />
                    Register Motor Vehicle (LTO Verified)
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button className="rounded p-1 text-muted-foreground hover:text-foreground">
                      <X className="size-4" />
                    </button>
                  </Dialog.Close>
                </div>

                <form onSubmit={handleRegisterVehicle} className="mt-4 flex flex-col gap-3.5 text-xs">
                  <div className="flex gap-2">
                    <label className="flex flex-col gap-1 flex-1">
                      <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                        License Plate Number *
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. NDB-8921"
                        value={plateInput}
                        onChange={(e) => setPlateInput(e.target.value.toUpperCase())}
                        className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono-tab uppercase text-white focus:border-primary focus:outline-none"
                      />
                    </label>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleLtoLookup}
                        disabled={isLookingUpLTO || !plateInput}
                        className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/20 disabled:opacity-50"
                      >
                        {isLookingUpLTO ? <Loader2 className="size-3.5 animate-spin" /> : "Lookup LTO"}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1">
                      <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                        Make & Model
                      </span>
                      <input
                        type="text"
                        placeholder="Toyota Vios 1.3E"
                        value={makeModel}
                        onChange={(e) => setMakeModel(e.target.value)}
                        className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                        Vehicle Classification
                      </span>
                      <select
                        value={vehType}
                        onChange={(e) => setVehType(e.target.value)}
                        className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                      >
                        <option value="Private Sedan">Private Sedan</option>
                        <option value="SUV / AUV">SUV / AUV</option>
                        <option value="Motorcycle">Motorcycle</option>
                        <option value="Public Utility Jeepney">Public Utility Jeepney (PUJ)</option>
                        <option value="City Bus">City Bus</option>
                        <option value="Heavy Truck">Heavy Truck</option>
                      </select>
                    </label>
                  </div>

                  <label className="flex flex-col gap-1">
                    <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                      Registered Owner Name
                    </span>
                    <input
                      type="text"
                      placeholder="Juan Dela Cruz"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1">
                      <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                        Vehicle Color
                      </span>
                      <input
                        type="text"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                        Chassis / VIN
                      </span>
                      <input
                        type="text"
                        placeholder="NCP150-XXXXXXX"
                        value={chassis}
                        onChange={(e) => setChassis(e.target.value)}
                        className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono-tab text-white focus:border-primary focus:outline-none"
                      />
                    </label>
                  </div>

                  <div className="mt-3 flex justify-end gap-2 border-t border-border pt-3">
                    <Dialog.Close asChild>
                      <button className="rounded-lg px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-panel-elevated">
                        Cancel
                      </button>
                    </Dialog.Close>
                    <button
                      type="submit"
                      disabled={!plateInput}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 disabled:opacity-50"
                    >
                      <CheckCircle2 className="size-3.5" />
                      Save to Registry
                    </button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat
          icon={Car}
          label="Vehicles Tracked"
          value={counts.all.toLocaleString()}
          tone="primary"
          sub="Indexed in QC grid"
        />
        <MiniStat
          icon={AlertTriangle}
          label="Watchlist & Flagged"
          value={counts.flagged.toLocaleString()}
          tone="warning"
          sub="Unsettled violations"
        />
        <MiniStat
          icon={Ban}
          label="LTO Alarm / Blocked"
          value={counts.blocked.toLocaleString()}
          tone="danger"
          sub="Registration hold active"
        />
        <MiniStat
          icon={ShieldAlert}
          label="Outstanding Fines"
          value={formatPeso(totalOutstanding)}
          tone="warning"
          sub="Cumulative balance due"
        />
      </div>

      {/* Filter Toolbar */}
      <div className="panel flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-border bg-background p-1">
          {RISKS.map((s) => {
            const active = risk === s;
            return (
              <button
                key={s}
                onClick={() => setRisk(s)}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-1.5 font-mono-tab text-xs font-bold uppercase tracking-wider transition-colors",
                  active ? "bg-primary text-white shadow-sm" : "text-subtle hover:text-foreground"
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

        <label className="relative flex items-center w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 size-4 text-subtle" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search plate, vehicle model, offense…"
            className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none"
          />
        </label>
      </div>

      {/* Table */}
      <div className="panel overflow-hidden rounded-2xl border border-border shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-black/20">
                {[
                  "License Plate",
                  "Make & Model",
                  "Violations",
                  "Citations",
                  "Outstanding Fines",
                  "Last Offense",
                  "Last Timestamp",
                  "LTO Status & Risk",
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
                  <td colSpan={8} className="p-8 text-center text-sm text-subtle">
                    <Loader2 className="size-6 animate-spin text-primary inline-block mr-2" />
                    Aggregating vehicle registry…
                  </td>
                </tr>
              )}
              {!isLoading &&
                filtered.map((v) => (
                  <tr key={v.plate} className="text-sm transition-colors hover:bg-panel-elevated/40">
                    <td className="px-5 py-4">
                      <Link
                        to="/vehicles/$plate"
                        params={{ plate: v.plate }}
                        className="font-mono-tab font-black text-white hover:text-primary transition-colors text-xs"
                      >
                        {v.plate}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">{v.model ?? "—"}</td>
                    <td className="px-5 py-4 font-mono-tab text-xs font-bold text-white">{v.violations}</td>
                    <td className="px-5 py-4 font-mono-tab text-xs text-white">
                      {v.citations}
                      {v.unpaid > 0 && (
                        <span className="ml-1 font-mono-tab text-[10px] text-amber-400 font-bold">
                          ({v.unpaid} unpaid)
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-mono-tab text-xs">
                      {v.outstanding > 0 ? (
                        <span className="text-amber-400 font-bold">{formatPeso(v.outstanding)}</span>
                      ) : (
                        <span className="text-emerald-400 font-medium">₱0 (Clean)</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-white/90">{v.lastOffense}</td>
                    <td className="px-5 py-4">
                      <div className="text-white text-xs">{timeAgo(v.lastSeen)}</div>
                      <div className="font-mono-tab text-[10px] text-subtle">
                        {new Date(v.lastSeen).toLocaleDateString("en-PH")}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono-tab text-[9px] font-bold uppercase",
                            v.risk === "clean"
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                              : v.risk === "watch"
                              ? "bg-primary/20 text-primary border-primary/30"
                              : v.risk === "flagged"
                              ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                              : "bg-red-500/20 text-red-400 border-red-500/30"
                          )}
                        >
                          {v.risk}
                        </span>

                        {v.ltoAlarm && (
                          <span className="rounded bg-red-950/40 border border-red-500/40 px-1.5 py-0.2 text-[8px] font-mono-tab text-red-400 font-bold uppercase">
                            LTO Hold
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-sm text-subtle">
                    No vehicles match your search or filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  tone,
  sub,
}: {
  icon: typeof Car;
  label: string;
  value: string;
  tone: "primary" | "warning" | "danger";
  sub?: string;
}) {
  const toneCls =
    tone === "danger"
      ? "text-red-400 bg-red-500/10 border-red-500/30"
      : tone === "warning"
      ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
      : "text-primary bg-primary/10 border-primary/30";

  return (
    <div className="panel rounded-2xl p-5 border border-border">
      <div className="flex items-start justify-between">
        <div>
          <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
            {label}
          </span>
          <p className="mt-2 font-mono-tab text-2xl font-black text-white">{value}</p>
          {sub && <span className="text-[10px] text-muted-foreground mt-0.5 block">{sub}</span>}
        </div>
        <div className={cn("grid size-10 place-items-center rounded-xl border", toneCls)}>
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}
