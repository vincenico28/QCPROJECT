import { createFileRoute, Link, ClientOnly } from "@tanstack/react-router";
import { Suspense, lazy, useState, useMemo } from "react";
import { useOfficers } from "@/lib/data/traffic";
import { useOfficerShifts } from "@/lib/data/officer-shifts";
import {
  Loader2,
  MapPin,
  Battery,
  Clock,
  Radio,
  Activity,
  Search,
  ShieldCheck,
  Zap,
  Filter,
  UserCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { QC_CENTER } from "@/lib/data/gis";
import { cn } from "@/lib/utils";

// Lazy load dedicated Leaflet map component (Browser-only via ClientOnly)
const OfficerShiftsMap = lazy(() => import("@/components/officers/officer-shifts-map"));

export const Route = createFileRoute("/officers/shifts")({
  head: () => ({
    meta: [
      { title: "Officer Shifts & Live GPS Tracking · Culiat Traffic Ops" },
      {
        name: "description",
        content:
          "Live GPS coordinates, active patrol shifts, battery levels, and tactical radio dispatch for field officers across Barangay Culiat, Quezon City.",
      },
      { property: "og:title", content: "Officer Shifts & Live GPS Tracking · Culiat Traffic Ops" },
      {
        property: "og:description",
        content: "Live telemetry and GPS tracking for Barangay Culiat, Quezon City field enforcement officers.",
      },
    ],
  }),
  component: OfficerShiftsPage,
});

function OfficerShiftsPage() {
  const { data: officers = [], isLoading: loadingOfficers } = useOfficers();
  const { data: shifts = [], isLoading: loadingShifts } = useOfficerShifts();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);

  const isLoading = loadingOfficers || loadingShifts;

  const filteredShifts = useMemo(() => {
    return shifts.filter((shift) => {
      const officer = officers.find((o) => o.badge_number === shift.badgeNumber);
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        shift.badgeNumber.toLowerCase().includes(q) ||
        (officer?.full_name ?? "").toLowerCase().includes(q) ||
        (officer?.unit ?? "").toLowerCase().includes(q) ||
        shift.currentTask.toLowerCase().includes(q)
      );
    });
  }, [shifts, officers, searchQuery]);

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-primary/20 px-2 py-0.5 font-mono-tab text-[10px] font-bold text-primary border border-primary/30">
              TACTICAL GPS TELEMETRY
            </span>
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight mt-1">
            Officer Shifts & Live Tracking
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Monitor active shifts, body-worn GPS coordinates, battery levels, and field deployment assignments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl bg-panel border border-border px-3.5 py-2 font-mono-tab text-xs">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-subtle">Active Units:</span>
            <span className="font-bold text-foreground">{shifts.length} Deployed</span>
          </div>
          <Link
            to="/officers"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-panel-elevated transition-colors"
          >
            <UserCheck className="size-3.5" />
            Officer Directory
          </Link>
        </div>
      </div>

      {/* Main Grid: Sidebar List + GPS Map */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Active Shifts Sidebar */}
        <div className="panel flex flex-col gap-4 rounded-3xl border border-border bg-panel p-5 lg:col-span-4 h-[650px] shadow-xl">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="flex items-center gap-2 text-sm font-bold text-foreground uppercase tracking-wider">
              <Radio className="size-4 text-primary" />
              Active Patrol Units ({filteredShifts.length})
            </h2>
            <span className="font-mono-tab text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
              LIVE
            </span>
          </div>

          {/* Search Filter */}
          <div className="relative">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
            <input
              type="text"
              placeholder="Search badge, officer, task..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-panel-elevated pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-subtle focus:outline-none focus:border-primary"
            />
          </div>

          {isLoading ? (
            <div className="grid flex-1 place-items-center">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 overflow-y-auto custom-scrollbar flex-1 pr-1">
              {filteredShifts.map((shift) => {
                const officer = officers.find((o) => o.badge_number === shift.badgeNumber);
                if (!officer) return null;
                const isSelected = selectedBadge === shift.badgeNumber;

                return (
                  <div
                    key={shift.id}
                    onClick={() => setSelectedBadge(shift.badgeNumber)}
                    className={cn(
                      "flex flex-col gap-2.5 rounded-2xl border p-4 cursor-pointer transition-all",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                        : "border-border bg-panel-elevated/60 hover:bg-panel-elevated hover:border-border/80",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm text-foreground">{officer.full_name}</p>
                        <p className="font-mono-tab text-xs text-muted-foreground mt-0.5">
                          Badge #{officer.badge_number} &bull; {officer.unit}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <Activity className="size-3" />
                        <span className="font-mono-tab text-[9px] font-bold uppercase tracking-wider">
                          Online
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 font-mono-tab text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="size-3 text-subtle" />
                        {new Date(shift.shiftStart).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="flex items-center gap-1 justify-end">
                        <Battery
                          className={cn(
                            "size-3",
                            shift.batteryLevel > 50
                              ? "text-emerald-400"
                              : shift.batteryLevel > 20
                              ? "text-amber-400"
                              : "text-red-400",
                          )}
                        />
                        <span>{shift.batteryLevel}%</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 pt-2 border-t border-border/50">
                      <MapPin className="size-3.5 shrink-0 text-primary mt-0.5" />
                      <span className="text-xs text-foreground/90 leading-snug">{shift.currentTask}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-subtle font-mono-tab">
                        Sector: {officer.district || "Culiat Corridor"}
                      </span>
                      <Link
                        to="/officers/$badge"
                        params={{ badge: officer.badge_number }}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5"
                      >
                        Profile <ChevronRight className="size-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}

              {filteredShifts.length === 0 && (
                <div className="p-8 text-center text-xs text-subtle">
                  No active units matching search query
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live GPS Map */}
        <div className="panel lg:col-span-8 overflow-hidden rounded-3xl border border-border bg-panel relative z-0 h-[650px] shadow-2xl">
          <ClientOnly fallback={<div className="grid h-full place-items-center bg-background"><Loader2 className="size-8 animate-spin text-primary" /></div>}>
            <Suspense fallback={<div className="grid h-full place-items-center bg-background"><Loader2 className="size-8 animate-spin text-primary" /></div>}>
              <OfficerShiftsMap
                shifts={shifts}
                officers={officers}
                center={QC_CENTER}
                zoom={14}
                selectedBadge={selectedBadge}
                onSelectOfficer={(badge) => setSelectedBadge(badge)}
              />
            </Suspense>
          </ClientOnly>

          {/* Map Top Badge */}
          <div className="absolute top-4 left-4 z-[400] rounded-full border border-border bg-background/80 px-4 py-2 backdrop-blur-md shadow-lg">
            <span className="flex items-center gap-2 font-mono-tab text-xs font-bold text-foreground tracking-widest uppercase">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full bg-primary"></span>
              </span>
              Live GPS Feed &bull; CartoDB GIS
            </span>
          </div>

          {/* Map Bottom Legend */}
          <div className="absolute bottom-4 left-4 right-4 z-[400] flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-background/85 p-3 backdrop-blur-md">
            <div className="flex items-center gap-4 text-xs font-mono-tab">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-emerald-400" />
                <span className="text-subtle">Active Patrol</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-primary" />
                <span className="text-subtle">Selected Unit</span>
              </div>
            </div>
            <span className="font-mono-tab text-[10px] text-subtle">
              Click officer card or pin to focus camera
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
