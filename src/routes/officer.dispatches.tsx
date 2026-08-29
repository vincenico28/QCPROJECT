import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, MapPin, CheckCircle2, ArrowLeft, LayoutDashboard, RadioReceiver } from "lucide-react";
import { toast } from "sonner";
import { timeAgo } from "@/lib/data/traffic";
import { cn } from "@/lib/utils";

import { useDispatches, useUpdateDispatchStatus, DispatchStatus } from "@/lib/data/dispatch";

export const Route = createFileRoute("/officer/dispatches")({
  head: () => ({
    meta: [{ title: "My Dispatches · Culiat Traffic Ops" }],
  }),
  component: DispatchesPage,
});

function DispatchesPage() {
  const { user } = useAuth();
  const { data: dispatches = [], isLoading } = useDispatches(20);
  const updateDispatch = useUpdateDispatchStatus();

  if (isLoading) {
    return (
      <div className="grid h-full place-items-center py-20">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 pb-20 max-w-2xl mx-auto w-full">
      {/* Back Navigation Bar */}
      <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
        <Link
          to="/officer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-panel-elevated transition-colors"
        >
          <ArrowLeft className="size-3.5 text-primary" />
          Back to Terminal
        </Link>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-panel-elevated transition-colors"
        >
          <LayoutDashboard className="size-3.5 text-subtle" />
          Command Center
        </Link>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <div className="grid size-8 place-items-center rounded-lg bg-emerald-500/20 text-emerald-500">
          <RadioReceiver className="size-4" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Active Dispatches</h2>
      </div>

      {dispatches.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center text-center text-subtle">
          <MapPin className="mb-3 size-8 opacity-20" />
          <p>You have no active dispatches.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {dispatches.map((dispatch: any) => (
            <div key={dispatch.id} className="panel rounded-2xl border border-border bg-panel p-5 shadow-lg">
              <div className="mb-3 flex items-start justify-between border-b border-border pb-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-subtle">
                    {timeAgo(dispatch.created_at)}
                  </p>
                  <p className="font-mono text-sm font-bold text-foreground">
                    {dispatch.location}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-white",
                    dispatch.status === "queued"
                      ? "bg-amber-500/80"
                      : dispatch.status === "en_route"
                      ? "bg-blue-600"
                      : dispatch.status === "on_scene"
                      ? "bg-purple-600"
                      : "bg-emerald-600"
                  )}
                >
                  {dispatch.status.replace("_", " ")}
                </span>
              </div>

              <div className="py-2 text-sm text-foreground">
                <p>{dispatch.instructions || "No specific instructions provided."}</p>
                {dispatch.officer_name && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Assigned: <span className="text-white font-medium">{dispatch.officer_name}</span> (Badge #{dispatch.badge_number || "N/A"})
                  </p>
                )}
              </div>

              {dispatch.status !== "resolved" && dispatch.status !== "cancelled" && (
                <div className="mt-4 flex gap-2">
                  {dispatch.status === "queued" && (
                    <button
                      onClick={() => updateDispatch.mutate({ id: dispatch.id, status: "en_route" })}
                      disabled={updateDispatch.isPending}
                      className="flex flex-1 items-center justify-center rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
                    >
                      Acknowledge & En Route
                    </button>
                  )}
                  {dispatch.status === "en_route" && (
                    <button
                      onClick={() => updateDispatch.mutate({ id: dispatch.id, status: "on_scene" })}
                      disabled={updateDispatch.isPending}
                      className="flex flex-1 items-center justify-center rounded-lg bg-purple-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/20 hover:bg-purple-500 transition-colors"
                    >
                      Mark Arrived On Scene
                    </button>
                  )}
                  {dispatch.status === "on_scene" && (
                    <button
                      onClick={() => updateDispatch.mutate({ id: dispatch.id, status: "resolved" })}
                      disabled={updateDispatch.isPending}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-colors"
                    >
                      <CheckCircle2 className="size-4" />
                      Resolve Incident
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
