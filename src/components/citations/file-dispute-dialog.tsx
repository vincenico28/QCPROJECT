import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Scale, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCreateDispute } from "@/lib/data/disputes";

export function FileDisputeDialog({ citationId, citationNumber }: { citationId: string; citationNumber: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const createDispute = useCreateDispute();

  const handleDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    createDispute.mutate(
      { citation_id: citationId, reason },
      {
        onSuccess: () => {
          toast.success("Dispute filed successfully");
          setOpen(false);
          setReason("");
        },
        onError: (err) => {
          toast.error(err.message || "Failed to file dispute");
        },
      }
    );
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-panel px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-panel-elevated">
          <Scale className="size-4" />
          Contest Citation
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-xl border border-border bg-panel p-6 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold tracking-tight">File Dispute</Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-full p-2 text-subtle hover:bg-panel-elevated hover:text-foreground">
                <X className="size-4" />
                <span className="sr-only">Close</span>
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-1.5 text-sm text-subtle">
            Submit a formal dispute for citation {citationNumber}. Our enforcement officers will review your case.
          </Dialog.Description>

          <form onSubmit={handleDispute} className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="reason" className="text-sm font-medium text-foreground">
                Reason for dispute
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please describe why this citation is incorrect..."
                required
                rows={4}
                className="resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-panel-elevated"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={createDispute.isPending || !reason.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50"
              >
                {createDispute.isPending ? <Loader2 className="size-4 animate-spin" /> : "Submit"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
