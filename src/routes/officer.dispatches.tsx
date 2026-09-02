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
} from "lucide-react";
import { toast } from "sonner";
import { timeAgo } from "@/lib/data/traffic";
import { cn } from "@/lib/utils";
import { useDispatches, useUpdateDispatchStatus, DispatchStatus } from "@/lib/data/dispatch";

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

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleUpdate = async (id: string, status: DispatchStatus, label: string) => {
    try {
      await updateDispatch.mutateAsync({ id, status });
      toast.success(`Dispatch marked as ${label}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update dispatch");
    }
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

                  <div className="mt-2.5 flex items-center justify-between font-mono-tab text-[10px] text-muted-foreground pt-2 border-t border-border/50">
                    <span>Assigned: {dispatch.officer_name || "Nearest Unit"}</span>
                    <span>{timeAgo(dispatch.created_at)}</span>
                  </div>
                </div>

                {!isResolved && dispatch.status !== "cancelled" && (
                  <div className="mt-4 flex gap-2 pt-2">
                    {dispatch.status === "queued" && (
                      <button
                        onClick={() => handleUpdate(dispatch.id, "en_route", "En Route")}
                        disabled={updateDispatch.isPending}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all disabled:opacity-50"
                      >
                        <Navigation className="size-3.5" />
                        Acknowledge & En Route
                      </button>
                    )}

                    {dispatch.status === "en_route" && (
                      <button
                        onClick={() => handleUpdate(dispatch.id, "on_scene", "Arrived On Scene")}
                        disabled={updateDispatch.isPending}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-600/25 hover:bg-purple-500 transition-all disabled:opacity-50"
                      >
                        <MapPin className="size-3.5" />
                        Mark Arrived On Scene
                      </button>
                    )}

                    {dispatch.status === "on_scene" && (
                      <button
                        onClick={() => handleUpdate(dispatch.id, "resolved", "Resolved")}
                        disabled={updateDispatch.isPending}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 transition-all disabled:opacity-50"
                      >
                        <CheckCircle2 className="size-3.5" />
                        Resolve & Clear Incident
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
