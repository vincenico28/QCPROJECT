import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useTerminals, useTransportRoutes } from "@/lib/data/transport";
import {
  Bus,
  CarFront,
  Loader2,
  MapPin,
  AlertTriangle,
  ShieldAlert,
  Activity,
  CheckCircle2,
  Users,
  Navigation,
  Sparkles,
  Sliders,
  Filter,
  Radio,
  Send,
  Search,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DispatchDialog } from "@/components/dispatch/dispatch-dialog";

export const Route = createFileRoute("/transport")({
  head: () => ({
    meta: [
      { title: "Public Transport Coordination · Culiat Traffic Ops" },
      {
        name: "description",
        content:
          "Monitor PUV route congestion, terminal capacity, unauthorized stations, and city bus lanes across Barangay Culiat, Quezon City.",
      },
    ],
  }),
  component: TransportPage,
});

export function TransportPage() {
  const { data: routes = [], isLoading: loadingRoutes } = useTransportRoutes();
  const { data: terminals = [], isLoading: loadingTerminals } = useTerminals();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRoutes = useMemo(() => {
    return routes.filter((r) => {
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return r.name.toLowerCase().includes(q) || r.type.toLowerCase().includes(q);
    });
  }, [routes, typeFilter, searchQuery]);

  const stats = useMemo(() => {
    const totalVehicles = routes.reduce((sum, r) => sum + r.activeVehicles, 0);
    const criticalRoutes = routes.filter(
      (r) => r.congestionLevel === "critical" || r.congestionLevel === "high"
    ).length;
    const alertTerminals = terminals.filter(
      (t) => t.status === "unauthorized" || t.status === "over-capacity"
    ).length;
    return {
      totalVehicles,
      criticalRoutes,
      alertTerminals,
      activeTerminals: terminals.length,
    };
  }, [routes, terminals]);

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-primary/20 px-2 py-0.5 font-mono-tab text-[10px] font-bold text-primary border border-primary/30">
              PUV FLEET TELEMETRY
            </span>
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-xs text-subtle">· LTFRB & QC Transport Registry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight mt-1">
            Public Transport Coordination
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Monitor PUV route congestion, terminal passenger loads, and unauthorized colorum stations across Culiat corridors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/map"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-panel-elevated transition-colors"
          >
            <Navigation className="size-3.5 text-primary" />
            GIS Corridor Map
          </Link>
        </div>
      </div>

      {/* KPI Ribbons */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="panel rounded-3xl border border-border bg-panel p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="font-mono-tab text-[10px] font-bold uppercase tracking-widest text-subtle">
              Active PUV Fleet
            </span>
            <div className="grid size-8 place-items-center rounded-xl bg-panel-elevated text-primary">
              <Bus className="size-4" />
            </div>
          </div>
          <p className="mt-2 font-mono-tab text-3xl font-black text-foreground">{stats.totalVehicles} Units</p>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">Jeepneys, buses & tricycles</span>
        </div>

        <div className="panel rounded-3xl border border-border bg-panel p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="font-mono-tab text-[10px] font-bold uppercase tracking-widest text-subtle">
              High Congestion Routes
            </span>
            <div className="grid size-8 place-items-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Activity className="size-4" />
            </div>
          </div>
          <p className="mt-2 font-mono-tab text-3xl font-black text-amber-400">{stats.criticalRoutes} Corridors</p>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">Exceeding standard flow capacity</span>
        </div>

        <div className="panel rounded-3xl border border-border bg-panel p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="font-mono-tab text-[10px] font-bold uppercase tracking-widest text-subtle">
              Terminal Alerts
            </span>
            <div className="grid size-8 place-items-center rounded-xl bg-danger/10 text-danger border border-danger/20">
              <ShieldAlert className="size-4" />
            </div>
          </div>
          <p className="mt-2 font-mono-tab text-3xl font-black text-danger">{stats.alertTerminals} Flagged</p>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">Unauthorized or over capacity</span>
        </div>

        <div className="panel rounded-3xl border border-border bg-panel p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="font-mono-tab text-[10px] font-bold uppercase tracking-widest text-subtle">
              Monitored Stations
            </span>
            <div className="grid size-8 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <MapPin className="size-4" />
            </div>
          </div>
          <p className="mt-2 font-mono-tab text-3xl font-black text-emerald-400">{stats.activeTerminals} Hubs</p>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">Sensory capacity telemetry active</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="panel flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-border bg-background p-1">
            {(["all", "jeepney", "bus", "uv", "tricycle"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={cn(
                  "rounded-lg px-3 py-1 font-mono-tab text-xs font-bold uppercase tracking-wider transition-colors",
                  typeFilter === t ? "bg-primary text-white shadow-sm" : "text-subtle hover:text-foreground"
                )}
              >
                {t === "all" ? "All PUVs" : t === "uv" ? "UV Express" : t}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search route or corridor..."
            className="w-full rounded-xl border border-border bg-background px-3.5 py-1.5 text-xs text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none font-mono"
          />
        </div>
      </div>

      {/* Main Grid: Routes (8 cols) + Terminals (4 cols) */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Routes Panel */}
        <div className="flex flex-col gap-4 lg:col-span-8">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Bus className="size-4 text-primary" />
              Active PUV Arteries ({filteredRoutes.length})
            </h2>
            <span className="font-mono-tab text-[10px] text-subtle">Real-Time Flow</span>
          </div>

          {loadingRoutes ? (
            <div className="grid h-64 place-items-center">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : filteredRoutes.length === 0 ? (
            <div className="panel flex flex-col items-center justify-center rounded-2xl border border-border p-12 text-center text-xs text-subtle">
              <Bus className="size-8 text-muted-foreground mb-2 opacity-40" />
              No transport routes match the selected filter.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredRoutes.map((route) => {
                const isHeavy = route.congestionLevel === "high" || route.congestionLevel === "critical";
                return (
                  <div
                    key={route.id}
                    className="panel flex flex-col justify-between rounded-2xl border border-border bg-panel p-4 shadow-lg hover:bg-panel-elevated transition-colors"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="grid size-10 place-items-center rounded-xl bg-panel-elevated text-primary border border-border">
                            {route.type === "jeepney" ? (
                              <CarFront className="size-5" />
                            ) : route.type === "bus" ? (
                              <Bus className="size-5" />
                            ) : (
                              <Activity className="size-5" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-foreground text-sm">{route.name}</h3>
                            <p className="text-[11px] text-muted-foreground capitalize mt-0.5">
                              {route.type} &bull;{" "}
                              <span className="font-mono-tab text-foreground font-semibold">
                                {route.activeVehicles} active units
                              </span>
                            </p>
                          </div>
                        </div>

                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono-tab text-[9px] font-bold uppercase tracking-wider border",
                            route.congestionLevel === "low" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
                            route.congestionLevel === "medium" && "bg-amber-500/10 text-amber-400 border-amber-500/30",
                            route.congestionLevel === "high" && "bg-orange-500/10 text-orange-400 border-orange-500/30",
                            route.congestionLevel === "critical" && "bg-danger/20 text-danger border-danger/40 animate-pulse"
                          )}
                        >
                          {route.congestionLevel}
                        </span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                      <span className="font-mono-tab text-[10px] text-subtle">
                        Corridor ID: {route.id}
                      </span>
                      {isHeavy ? (
                        <DispatchDialog
                          defaultLocation={route.name}
                          defaultPriority="high"
                          defaultInstructions={`Alleviate ${route.congestionLevel.toUpperCase()} congestion along ${route.name}. Regulate PUV passenger loading bottlenecks.`}
                          trigger={
                            <button className="inline-flex items-center gap-1 rounded-lg bg-primary/20 border border-primary/40 px-2.5 py-1 text-[10px] font-bold text-primary hover:bg-primary hover:text-white transition-colors">
                              <Radio className="size-3" /> Deploy Marshal
                            </button>
                          }
                        />
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-mono-tab font-medium">
                          Flow Nominal
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Terminals Panel */}
        <div className="flex flex-col gap-4 lg:col-span-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <MapPin className="size-4 text-primary" />
              Terminal Status ({terminals.length})
            </h2>
            <span className="font-mono-tab text-[10px] text-subtle">Capacity Telemetry</span>
          </div>

          {loadingTerminals ? (
            <div className="grid h-48 place-items-center">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {terminals.map((term) => {
                const occupancyPct = Math.min(
                  100,
                  Math.round((term.currentOccupancy / term.capacity) * 100)
                );
                return (
                  <div
                    key={term.id}
                    className="panel flex flex-col gap-3 rounded-2xl border border-border bg-panel p-4 shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-foreground text-sm">{term.name}</p>
                        <span className="text-[10px] font-mono-tab text-subtle capitalize">
                          Status: {term.status.replace("-", " ")}
                        </span>
                      </div>
                      {term.status === "unauthorized" ? (
                        <div className="flex items-center gap-1 bg-danger/10 text-danger px-2 py-0.5 rounded-full text-[10px] font-mono-tab font-bold border border-danger/30">
                          <ShieldAlert className="size-3" />
                          COLORUM
                        </div>
                      ) : term.status === "over-capacity" ? (
                        <div className="flex items-center gap-1 bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full text-[10px] font-mono-tab font-bold border border-amber-500/30">
                          <AlertTriangle className="size-3" />
                          OVERLOAD
                        </div>
                      ) : (
                        <span className="text-emerald-400 font-mono-tab text-[10px] font-bold">NORMAL</span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-panel-elevated overflow-hidden border border-border">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            term.status === "normal"
                              ? "bg-emerald-500"
                              : term.status === "crowded"
                              ? "bg-amber-400"
                              : "bg-danger"
                          )}
                          style={{ width: `${occupancyPct}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono-tab font-bold text-foreground shrink-0">
                        {term.currentOccupancy} / {term.capacity} ({occupancyPct}%)
                      </span>
                    </div>

                    {/* Action Button for Terminal Alerts */}
                    {term.status === "unauthorized" ? (
                      <div className="pt-2 border-t border-border/60 flex justify-end">
                        <DispatchDialog
                          defaultLocation={term.name}
                          defaultPriority="critical"
                          defaultInstructions={`Intercept unauthorized colorum terminal operations at ${term.name}. Check LTFRB franchise CPC and impound non-registered vehicles.`}
                          trigger={
                            <button className="inline-flex items-center gap-1.5 rounded-lg bg-red-600/20 border border-red-500/40 px-3 py-1 text-[10px] font-bold text-red-400 hover:bg-red-600 hover:text-white transition-colors">
                              <ShieldAlert className="size-3" /> Dispatch Anti-Colorum Intercept
                            </button>
                          }
                        />
                      </div>
                    ) : term.status === "over-capacity" ? (
                      <div className="pt-2 border-t border-border/60 flex justify-end">
                        <DispatchDialog
                          defaultLocation={term.name}
                          defaultPriority="high"
                          defaultInstructions={`Terminal overload (${term.currentOccupancy}/${term.capacity} pax) at ${term.name}. Manage passenger queues and expedite PUV departure cycles.`}
                          trigger={
                            <button className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 px-3 py-1 text-[10px] font-bold text-amber-400 hover:bg-amber-500 hover:text-white transition-colors">
                              <Radio className="size-3" /> Dispatch Queue Marshal
                            </button>
                          }
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
