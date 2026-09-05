import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Users,
  ShieldCheck,
  Activity,
  Search,
  Phone,
  Plus,
  Radio,
  MapPin,
  CheckCircle2,
  XCircle,
  UserPlus,
  Loader2,
  X,
  Award,
} from "lucide-react";
import { useOfficers, useAddOfficer, useToggleOfficerDuty, type Officer } from "@/lib/data/traffic";
import { cn } from "@/lib/utils";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/officers/")({
  head: () => ({
    meta: [
      { title: "Personnel Directory · Culiat Traffic Ops" },
      {
        name: "description",
        content:
          "Barangay Culiat, Quezon City traffic enforcement personnel roster with duty status, unit assignment, and citation output per officer.",
      },
      { property: "og:title", content: "Personnel Directory · Culiat Traffic Ops" },
      {
        property: "og:description",
        content: "Enforcement personnel roster: duty status, districts, units and citation output.",
      },
    ],
  }),
  component: OfficersPage,
});

const FILTERS = ["all", "on_duty", "active", "on_leave", "suspended"] as const;
type OfficerFilter = (typeof FILTERS)[number];

const LABELS: Record<OfficerFilter, string> = {
  all: "All",
  on_duty: "On duty",
  active: "Active",
  on_leave: "On leave",
  suspended: "Suspended",
};

function OfficersPage() {
  const { data: officers = [], isLoading } = useOfficers();
  const addOfficer = useAddOfficer();
  const toggleDuty = useToggleOfficerDuty();

  const [filter, setFilter] = useState<OfficerFilter>("all");
  const [q, setQ] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Form State
  const [fullName, setFullName] = useState("");
  const [badgeNumber, setBadgeNumber] = useState("");
  const [rank, setRank] = useState("Officer I");
  const [unit, setUnit] = useState("Traffic Management");
  const [district, setDistrict] = useState("District 6 (Culiat)");
  const [contactNumber, setContactNumber] = useState("");

  const counts = useMemo(
    () =>
      ({
        all: officers.length,
        on_duty: officers.filter((o) => o.on_duty).length,
        active: officers.filter((o) => o.status === "active").length,
        on_leave: officers.filter((o) => o.status === "on_leave").length,
        suspended: officers.filter((o) => o.status === "suspended").length,
      }) as Record<OfficerFilter, number>,
    [officers],
  );

  const totalCitations = useMemo(
    () => officers.reduce((sum, o) => sum + o.citations_issued, 0),
    [officers],
  );

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return officers.filter((o) => {
      if (filter === "on_duty" && !o.on_duty) return false;
      if (filter !== "all" && filter !== "on_duty" && o.status !== filter) return false;
      if (!needle) return true;
      return (
        o.full_name.toLowerCase().includes(needle) ||
        o.badge_number.toLowerCase().includes(needle) ||
        o.unit.toLowerCase().includes(needle) ||
        o.district.toLowerCase().includes(needle)
      );
    });
  }, [officers, filter, q]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !badgeNumber) return;
    addOfficer.mutate(
      {
        full_name: fullName,
        badge_number: badgeNumber.toUpperCase().trim(),
        rank,
        unit,
        district,
        contact_number: contactNumber || undefined,
      },
      {
        onSuccess: (off) => {
          toast.success(`Officer ${off.rank} ${off.full_name} Registered`, {
            description: `Badge ${off.badge_number} assigned to ${off.unit}`,
          });
          setAddModalOpen(false);
          setFullName("");
          setBadgeNumber("");
          setContactNumber("");
        },
      }
    );
  };

  const handleToggleDuty = (officer: Officer) => {
    toggleDuty.mutate(
      { id: officer.id, currentDuty: !!officer.on_duty },
      {
        onSuccess: () => {
          toast.success(
            `${officer.rank} ${officer.full_name} is now ${officer.on_duty ? "OFF DUTY" : "ON DUTY"}`
          );
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-primary/20 px-2 py-0.5 font-mono-tab text-[10px] font-bold text-primary border border-primary/30">
              QC DPOS / BARANGAY CULIAT
            </span>
            <span className="text-xs text-subtle">· Enforcement Division</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            Personnel Directory & Field Enforcers
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage active traffic enforcers, switch duty statuses, and monitor citation performance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Register Officer Modal */}
          <Dialog.Root open={addModalOpen} onOpenChange={setAddModalOpen}>
            <Dialog.Trigger asChild>
              <button className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all">
                <UserPlus className="size-3.5" />
                Register Officer
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-panel p-6 shadow-2xl animate-in fade-in zoom-in-95">
                <div className="flex items-start justify-between border-b border-border pb-3">
                  <Dialog.Title className="text-base font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="size-4 text-primary" />
                    Register New Enforcement Officer
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button className="rounded p-1 text-muted-foreground hover:text-foreground">
                      <X className="size-4" />
                    </button>
                  </Dialog.Close>
                </div>

                <form onSubmit={handleRegister} className="mt-4 flex flex-col gap-3.5">
                  <label className="flex flex-col gap-1">
                    <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                      Full Name *
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Juan Dela Cruz"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1">
                      <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                        Badge Number *
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="BADGE-106"
                        value={badgeNumber}
                        onChange={(e) => setBadgeNumber(e.target.value.toUpperCase())}
                        className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono-tab uppercase text-white focus:border-primary focus:outline-none"
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                        Rank
                      </span>
                      <select
                        value={rank}
                        onChange={(e) => setRank(e.target.value)}
                        className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                      >
                        <option value="Officer I">Officer I</option>
                        <option value="Officer II">Officer II</option>
                        <option value="Sergeant">Sergeant</option>
                        <option value="Master Sergeant">Master Sergeant</option>
                        <option value="Inspector">Inspector</option>
                      </select>
                    </label>
                  </div>

                  <label className="flex flex-col gap-1">
                    <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                      Unit Assignment
                    </span>
                    <input
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                      District / Beat
                    </span>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                      Contact Mobile
                    </span>
                    <input
                      type="text"
                      placeholder="0917-xxx-xxxx"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                    />
                  </label>

                  <div className="mt-3 flex justify-end gap-2 border-t border-border pt-3">
                    <Dialog.Close asChild>
                      <button className="rounded-lg px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-panel-elevated">
                        Cancel
                      </button>
                    </Dialog.Close>
                    <button
                      type="submit"
                      disabled={addOfficer.isPending || !fullName || !badgeNumber}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 disabled:opacity-50"
                    >
                      {addOfficer.isPending && <Loader2 className="size-3.5 animate-spin" />}
                      Register Enforcer
                    </button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          <Link
            to="/officers/shifts"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-panel px-4 py-2 text-xs font-semibold text-white hover:bg-panel-elevated transition-colors"
          >
            <Activity className="size-3.5 text-emerald-400" />
            Live GPS Tracking
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Total Personnel" value={officers.length} icon={Users} tone="primary" />
        <Kpi label="On Duty Now" value={counts.on_duty} icon={Activity} tone="success" sub="Active on street beat" />
        <Kpi
          label="Citations Issued"
          value={totalCitations}
          icon={ShieldCheck}
          tone="primary"
          sub="Cumulative officer output"
        />
        <Kpi
          label="Avg Output / Officer"
          value={officers.length ? Math.round(totalCitations / officers.length) : 0}
          icon={Award}
          tone="warning"
          sub="Citations per enforcer"
        />
      </div>

      {/* Filters Bar */}
      <div className="panel flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-border bg-background p-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 font-mono-tab text-xs font-bold uppercase tracking-wider transition-colors",
                filter === f ? "bg-primary text-white shadow-sm" : "text-subtle hover:text-foreground",
              )}
            >
              {LABELS[f]}
              <span className="ml-1.5 rounded-full bg-black/40 px-1.5 py-0.2 text-[9px] text-white/80">
                {counts[f]}
              </span>
            </button>
          ))}
        </div>
        <label className="relative flex items-center w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 size-4 text-subtle" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, badge, unit, beat…"
            className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none"
          />
        </label>
      </div>

      {/* Officers Table */}
      {isLoading ? (
        <div className="panel grid h-64 place-items-center rounded-2xl text-sm text-subtle">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel grid h-64 place-items-center rounded-2xl text-sm text-subtle">
          No officers match the current filters.
        </div>
      ) : (
        <div className="panel overflow-hidden rounded-2xl border border-border shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-black/20">
                  <th className="px-5 py-3 font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                    Officer & Rank
                  </th>
                  <th className="px-5 py-3 font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                    Badge #
                  </th>
                  <th className="px-5 py-3 font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                    Unit Assignment
                  </th>
                  <th className="px-5 py-3 font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                    District / Beat
                  </th>
                  <th className="px-5 py-3 font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                    Duty Status
                  </th>
                  <th className="px-5 py-3 font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                    Output
                  </th>
                  <th className="px-5 py-3 text-right font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((o) => (
                  <tr key={o.id} className="transition-colors hover:bg-panel-elevated/40">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-white">{o.full_name}</div>
                      <div className="text-xs text-muted-foreground">{o.rank}</div>
                    </td>
                    <td className="px-5 py-4 font-mono-tab font-bold text-white text-xs">
                      {o.badge_number}
                    </td>
                    <td className="px-5 py-4 text-xs text-white/90">{o.unit}</td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">{o.district}</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleToggleDuty(o)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono-tab text-[10px] font-bold uppercase transition-all hover:scale-105",
                          o.on_duty
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-white/10 text-white/50 border border-white/10"
                        )}
                        title="Click to toggle duty status"
                      >
                        <span className={cn("size-1.5 rounded-full", o.on_duty ? "bg-emerald-400 animate-pulse" : "bg-white/40")} />
                        {o.on_duty ? "ON DUTY" : "OFF DUTY"}
                      </button>
                    </td>
                    <td className="px-5 py-4 font-mono-tab text-xs font-bold text-white">
                      {o.citations_issued} citations
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {o.contact_number && (
                          <a
                            href={`tel:${o.contact_number}`}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-panel-elevated hover:text-white"
                            title={`Call ${o.contact_number}`}
                          >
                            <Phone className="size-3.5" />
                          </a>
                        )}
                        <Link
                          to="/dispatch"
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-panel px-2.5 py-1 text-xs font-medium text-foreground hover:bg-panel-elevated hover:text-white"
                        >
                          <Radio className="size-3" />
                          Dispatch
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  icon: Icon,
  tone = "primary",
  sub,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  tone?: "primary" | "success" | "warning";
  sub?: string;
}) {
  const toneCls =
    tone === "success"
      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
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
