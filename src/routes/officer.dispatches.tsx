import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, MapPin, CheckCircle2, ArrowLeft, LayoutDashboard, RadioReceiver } from "lucide-react";
import { toast } from "sonner";
import { timeAgo } from "@/lib/data/traffic";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/officer/dispatches")({
  head: () => ({
    meta: [{ title: "My Dispatches · Culiat Traffic Ops" }],
  }),
  component: DispatchesPage,
});

const MOCK_DISPATCHES = [
  {
    id: "DSP-001",
    location: "Commonwealth Ave & Tandang Sora",
    status: "assigned",
    instructions: "Respond to reported collision blocking 2 lanes.",
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    officer_id: "104",
    violation: { violation_type: "Accident / Obstruction", plate_number: "UNKNOWN" }
  },
  {
    id: "DSP-002",
    location: "Quezon Memorial Circle",
    status: "in_progress",
    instructions: "Direct traffic, broken traffic light.",
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    officer_id: "104",
    violation: null
  }
];

function DispatchesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: dispatches = [], isLoading } = useQuery({
    queryKey: ["my_dispatches", user?.id],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 500));
      return MOCK_DISPATCHES;
    },
  });

  const updateDispatch = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await new Promise(r => setTimeout(r, 400));
      const d = MOCK_DISPATCHES.find(x => x.id === id);
      if (d) d.status = status;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my_dispatches"] });
      toast.success("Dispatch status updated");
    },
    onError: (err) => toast.error(err.message),
  });

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
                    dispatch.status === "assigned"
                      ? "bg-warning"
                      : dispatch.status === "in_progress"
                      ? "bg-primary"
                      : "bg-success"
                  )}
                >
                  {dispatch.status.replace("_", " ")}
                </span>
              </div>

              <div className="py-2 text-sm text-foreground">
                <p>{dispatch.instructions || "No specific instructions provided."}</p>
                {dispatch.violation && (
                  <div className="mt-3 rounded-lg bg-panel-elevated p-3">
                    <p className="font-mono text-[10px] font-semibold text-subtle uppercase">Target Violation</p>
                    <p className="text-xs font-bold">{dispatch.violation.violation_type}</p>
                    <p className="text-xs">{dispatch.violation.plate_number}</p>
                  </div>
                )}
              </div>

              {dispatch.status !== "resolved" && (
                <div className="mt-4 flex gap-2">
                  {dispatch.status === "assigned" && (
                    <button
                      onClick={() => updateDispatch.mutate({ id: dispatch.id, status: "in_progress" })}
                      disabled={updateDispatch.isPending}
                      className="flex flex-1 items-center justify-center rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20"
                    >
                      Accept
                    </button>
                  )}
                  {dispatch.status === "in_progress" && (
                    <button
                      onClick={() => updateDispatch.mutate({ id: dispatch.id, status: "resolved" })}
                      disabled={updateDispatch.isPending}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-success py-2.5 text-sm font-semibold text-success-foreground shadow-lg shadow-success/20"
                    >
                      <CheckCircle2 className="size-4" />
                      Complete
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
