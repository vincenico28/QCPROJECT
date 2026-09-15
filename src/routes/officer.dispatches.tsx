import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import {
  Loader2,
  MapPin,
  CheckCircle2,
  ArrowLeft,
  LayoutDashboard,
  RadioReceiver,
  Navigation,
  Clock,
  AlertTriangle,
  Siren,
  ShieldCheck,
  Truck,
  Ambulance,
  Bell,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { timeAgo } from "@/lib/data/traffic";
import { cn } from "@/lib/utils";
import {
  useDispatches,
  useUpdateDispatchStatus,
  useRequestDispatchSupport,
  calculateDispatchEta,
  parseSupportUnits,
  type Dispatch,
  type DispatchStatus,
  type SupportUnitType,
} from "@/lib/data/dispatch";
import { soundEffects } from "@/lib/sound-effects";

export const Route = createFileRoute("/officer/dispatches")({
  head: () => ({
    meta: [{ title: "My Field Dispatches · Culiat Traffic Ops" }],
  }),
  component: DispatchesPage,
});

function DispatchesPage() {
  const { user } = useAuth();
  const { data: dispatches = [], isLoading } = useDispatches(30);
  const updateDispatch = useUpdateDispatchStatus();
  const requestSupport = useRequestDispatchSupport();

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleUpdate = async (id: string, status: DispatchStatus, label: string) => {
    soundEffects.playDispatchTone();
    try {
      await updateDispatch.mutateAsync({ id, status });
      toast.success(`Dispatch marked as ${label}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update dispatch");
    }
  };

  const handleRequestSupport = async (dispatchId: string, type: SupportUnitType) => {
    soundEffects.playDispatchTone();
    try {
      await requestSupport.mutateAsync({
        dispatchId,
        supportType: type,
        action: "request",
      });
      if (type === "wrecker") {
        toast.success("MMDA Tow Truck Requested!", {
          description: "Heavy wrecker inbound to your patrol coordinates.",
        });
      } else {
        toast.error("QC 911 Ambulance Requested!", {
          description: "Medical paramedic team rolling with priority siren.",
        });
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to request emergency support");
    }
  };

  return (
    <div className="flex flex-col p-4 pb-20 max-w-xl mx-auto w-full min-h-screen bg-background border-x border-border text-foreground">
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
        <div className="grid size-9 place-items-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          <RadioReceiver className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">HQ Incident Dispatches</h2>
          <p className="text-xs text-muted-foreground">Tactical directives routed to your patrol sector</p>
        </div>
      </div>

      {dispatches.length === 0 ? (
        <div className="panel mt-8 flex flex-col items-center justify-center rounded-3xl border border-border p-12 text-center text-subtle">
          <MapPin className="mb-3 size-8 opacity-40 text-primary" />
          <p className="font-bold text-foreground">No active dispatches</p>
          <p className="text-xs text-muted-foreground mt-1">Standby in your assigned patrol corridor.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {dispatches.map((dispatch: any) => {
            const isResolved = dispatch.status === "resolved";
            const isCritical = dispatch.priority === "critical";
            const etaInfo = calculateDispatchEta(dispatch);
            const supportUnits = parseSupportUnits(dispatch.instructions);

            return (
              <div
                key={dispatch.id}
                className={cn(
                  "panel rounded-3xl border p-5 shadow-xl transition-all",
                  isCritical
                    ? "border-danger/40 bg-gradient-to-r from-danger/10 via-panel to-panel"
                    : "border-border bg-panel"
                )}
              >
                <div className="mb-3 flex items-start justify-between border-b border-border pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-tab text-xs font-bold text-foreground">
                        {dispatch.reference}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 font-mono-tab text-[9px] font-bold uppercase",
                          isCritical
                            ? "bg-danger/20 text-danger border border-danger/40 animate-pulse"
                            : "bg-panel-elevated text-subtle border border-border"
                        )}
                      >
                        {dispatch.priority || "Normal"}
                      </span>
                    </div>
                    <p className="font-medium text-xs text-foreground mt-1 flex items-center gap-1">
                      <MapPin className="size-3.5 text-primary shrink-0" />
                      <span>{dispatch.location}</span>
                    </p>

                    {/* Live Dynamic ETA Badge */}
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono-tab text-[9px] font-bold border",
                          etaInfo.stage === "en_route"
                            ? "bg-primary/20 text-primary border-primary/40 animate-pulse"
                            : etaInfo.stage === "on_scene"
                            ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                            : etaInfo.stage === "resolved"
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        )}
                      >
                        <Clock className="size-2.5" />
                        <span>{etaInfo.label}</span>
                        <span className="opacity-75 font-normal text-[8px]">
                          · {etaInfo.subLabel}
                        </span>
                      </span>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 font-mono-tab text-[10px] font-bold uppercase tracking-wider border",
                      dispatch.status === "queued"
                        ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                        : dispatch.status === "en_route"
                        ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                        : dispatch.status === "on_scene"
                        ? "bg-purple-500/15 text-purple-400 border-purple-500/30"
                        : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    )}
                  >
                    {dispatch.status.replace("_", " ")}
                  </span>
                </div>

                <div className="py-1 text-xs text-foreground/90 leading-relaxed">
                  <span className="text-[10px] font-mono-tab text-subtle uppercase block mb-0.5">Directives:</span>
                  <p>{dispatch.instructions || "Investigate obstruction and report status to Central Dispatch."}</p>

                  {/* Active Support Units Inbound to Officer */}
                  {supportUnits.length > 0 && (
                    <div className="mt-2.5 flex flex-col gap-1.5">
                      {supportUnits.map((u) => (
                        <div
                          key={u.type}
                          className={cn(
                            "flex items-center justify-between rounded-xl px-2.5 py-1.5 text-[11px] font-medium border shadow-sm",
                            u.type === "medic"
                              ? "bg-red-950/40 text-red-300 border-red-500/40"
                              : "bg-amber-950/40 text-amber-300 border-amber-500/40"
                          )}
                        >
                          <span className="flex items-center gap-1.5">
                            {u.type === "medic" ? (
                              <Ambulance className="size-3.5 text-red-400 animate-pulse" />
                            ) : (
                              <Truck className="size-3.5 text-amber-400 animate-pulse" />
                            )}
                            <span className="font-bold font-mono-tab">{u.label}</span>
                          </span>
                          <span className="font-mono-tab text-[10px] font-bold">
                            {u.status === "on_scene" ? "ON SCENE" : `ETA ${u.eta}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-2.5 flex items-center justify-between font-mono-tab text-[10px] text-muted-foreground pt-2 border-t border-border/50">
                    <span>Assigned: {dispatch.officer_name || "Nearest Unit"}</span>
                    <span>{timeAgo(dispatch.created_at)}</span>
                  </div>
                </div>

                {/* Mobile Emergency Support Request Row */}
                {!isResolved && dispatch.status !== "cancelled" && (
                  <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2 text-[10px]">
                    <span className="text-muted-foreground font-mono-tab text-[9px] uppercase tracking-wider">
                      Request Field Backup:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleRequestSupport(dispatch.id, "wrecker")}
                        disabled={requestSupport.isPending}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-panel-elevated border border-border text-[10px] font-mono-tab font-semibold text-amber-400 hover:bg-panel transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <Truck className="size-3" /> Tow Truck
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRequestSupport(dispatch.id, "medic")}
                        disabled={requestSupport.isPending}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-panel-elevated border border-border text-[10px] font-mono-tab font-semibold text-red-400 hover:bg-panel transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <Ambulance className="size-3" /> 911 Medic
                      </button>
                    </div>
                  </div>
                )}

                {/* Status Progression Stepper */}
                {!isResolved && dispatch.status !== "cancelled" && (
                  <div className="mt-3 flex gap-2 pt-2">
                    {dispatch.status === "queued" && (
                      <button
                        onClick={() => handleUpdate(dispatch.id, "en_route", "En Route")}
                        disabled={updateDispatch.isPending}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <Navigation className="size-3.5" />
                        Acknowledge & En Route (10-76)
                      </button>
                    )}

                    {dispatch.status === "en_route" && (
                      <button
                        onClick={() => handleUpdate(dispatch.id, "on_scene", "Arrived On Scene")}
                        disabled={updateDispatch.isPending}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-600/25 hover:bg-purple-500 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <MapPin className="size-3.5" />
                        Mark Arrived On Scene (10-97)
                      </button>
                    )}

                    {dispatch.status === "on_scene" && (
                      <button
                        onClick={() => handleUpdate(dispatch.id, "resolved", "Resolved")}
                        disabled={updateDispatch.isPending}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <CheckCircle2 className="size-3.5" />
                        Resolve & Clear Incident (10-8)
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
