import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Scale, CheckCircle2, XCircle, Clock, Loader2, ArrowRight } from "lucide-react";
import { useDisputes, useUpdateDispute, type Dispute } from "@/lib/data/disputes";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/data/traffic";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";

export const Route = createFileRoute("/disputes")({
  head: () => ({
    meta: [{ title: "Dispute Queue · Culiat Traffic Ops" }],
  }),
  component: DisputesPage,
});

function DisputesPage() {
  const { data: disputes = [], isLoading } = useDisputes();
  const [filter, setFilter] = useState<"all" | "pending" | "resolved">("pending");

  const filtered = (disputes as Dispute[]).filter((d) => {
    if (filter === "pending") return d.status === "pending";
    if (filter === "resolved") return d.status === "approved" || d.status === "rejected";
    return true;
  });

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dispute Queue</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review and resolve motorist appeals for automated citations.
          </p>
        </div>
        <div className="flex rounded-lg border border-border bg-panel p-1">
          {(["pending", "resolved", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                filter === f ? "bg-primary/10 text-primary" : "text-subtle hover:text-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-20 text-subtle">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-panel/30 py-20 text-center text-sm text-subtle">
          <Scale className="mb-3 size-6 opacity-20" />
          No {filter === "all" ? "" : filter} disputes found in the queue.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filtered.map((dispute) => (
            <DisputeCard key={dispute.id} dispute={dispute} />
          ))}
        </div>
      )}
    </div>
  );
}

function DisputeCard({ dispute }: { dispute: Dispute }) {
  const { user } = useAuth();
  const update = useUpdateDispute();
  const [notes, setNotes] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"approved" | "rejected" | null>(null);

  const citation = dispute.citation;

  const handleResolve = async () => {
    if (!actionType) return;
    update.mutate(
      {
        id: dispute.id,
        status: actionType,
        admin_notes: notes,
        resolved_by: user?.id,
      },
      {
        onSuccess: () => {
          toast.success(`Dispute ${actionType}`);
          setModalOpen(false);
        },
      }
    );
  };

  return (
    <article className="panel flex flex-col gap-4 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono-tab text-[10px] font-bold uppercase tracking-widest text-primary">
              {citation?.citation_number || "UNKNOWN"}
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 font-mono-tab text-[9px] font-bold uppercase tracking-widest text-background",
                dispute.status === "pending"
                  ? "bg-warning text-warning-foreground"
                  : dispute.status === "approved"
                  ? "bg-success text-success-foreground"
                  : "bg-danger text-danger-foreground"
              )}
            >
              {dispute.status}
            </span>
          </div>
          <p className="mt-1 font-mono-tab text-xs font-semibold text-foreground">
            {citation?.plate_number} · {citation?.offense}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">Filed</p>
          <p className="font-mono-tab text-xs font-medium text-foreground">{timeAgo(dispute.created_at)}</p>
        </div>
      </div>

      <div className="flex-1">
        <p className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">Motorist Reason</p>
        <p className="mt-1.5 rounded-lg border border-border/50 bg-background/50 p-3 text-sm leading-relaxed text-foreground">
          {dispute.reason}
        </p>
      </div>

      {dispute.status !== "pending" && dispute.admin_notes && (
        <div>
          <p className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">Admin Resolution</p>
          <p className="mt-1.5 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm leading-relaxed text-foreground">
            {dispute.admin_notes}
          </p>
        </div>
      )}

      {dispute.status === "pending" && (
        <div className="mt-2 flex items-center gap-3 border-t border-border pt-4">
          <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
            <Dialog.Trigger asChild>
              <button
                onClick={() => setActionType("approved")}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-success/15 px-3 py-2 text-xs font-bold uppercase tracking-widest text-success transition-colors hover:bg-success hover:text-success-foreground"
              >
                <CheckCircle2 className="size-4" /> Approve & Waive
              </button>
            </Dialog.Trigger>
            <Dialog.Trigger asChild>
              <button
                onClick={() => setActionType("rejected")}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-danger/15 px-3 py-2 text-xs font-bold uppercase tracking-widest text-danger transition-colors hover:bg-danger hover:text-danger-foreground"
              >
                <XCircle className="size-4" /> Reject Appeal
              </button>
            </Dialog.Trigger>
            
            {/* Resolution Modal */}
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" />
              <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-xl border border-border bg-panel p-6 shadow-2xl">
                <Dialog.Title className="text-lg font-semibold text-foreground">
                  {actionType === "approved" ? "Approve Appeal" : "Reject Appeal"}
                </Dialog.Title>
                <Dialog.Description className="mt-2 text-sm text-muted-foreground">
                  {actionType === "approved" 
                    ? "This will waive the citation and notify the motorist." 
                    : "This will uphold the citation and require the motorist to pay."}
                </Dialog.Description>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter notes for the motorist..."
                  rows={4}
                  className="mt-4 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <div className="mt-4 flex justify-end gap-3">
                  <Dialog.Close asChild>
                    <button className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-panel-elevated">
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    onClick={handleResolve}
                    disabled={update.isPending}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white",
                      actionType === "approved" ? "bg-success hover:bg-success/90" : "bg-danger hover:bg-danger/90"
                    )}
                  >
                    {update.isPending ? <Loader2 className="size-4 animate-spin" /> : "Confirm Resolution"}
                  </button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      )}
    </article>
  );
}
