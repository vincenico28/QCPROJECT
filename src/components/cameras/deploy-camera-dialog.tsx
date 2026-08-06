import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, X, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useCreateCamera } from "@/lib/data/traffic";
import { cn } from "@/lib/utils";

export function DeployCameraDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  
  const createCamera = useCreateCamera();

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) return;

    createCamera.mutate(
      {
        location,
        lat: lat ? parseFloat(lat) : undefined,
        lng: lng ? parseFloat(lng) : undefined,
      },
      {
        onSuccess: (cam) => {
          toast.success(`Camera ${cam.code} deployed at ${cam.location}`);
          setOpen(false);
          setLocation("");
          setLat("");
          setLng("");
        },
        onError: (err) => {
          toast.error(err.message || "Failed to deploy camera");
        },
      }
    );
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-xl border border-border bg-panel p-6 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold tracking-tight">Deploy IoT Camera</Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-full p-2 text-subtle hover:bg-panel-elevated hover:text-foreground">
                <X className="size-4" />
                <span className="sr-only">Close</span>
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-1.5 text-sm text-subtle">
            Register a new enforcement camera node to the operations grid.
          </Dialog.Description>

          <form onSubmit={handleDeploy} className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="location" className="text-sm font-medium text-foreground">
                Intersection / Location Name
              </label>
              <input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Quezon Ave cor. EDSA"
                required
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="lat" className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <MapPin className="size-3.5 text-subtle" />
                  Latitude
                </label>
                <input
                  id="lat"
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="14.6500"
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="lng" className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <MapPin className="size-3.5 text-subtle" />
                  Longitude
                </label>
                <input
                  id="lng"
                  type="number"
                  step="any"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="121.0500"
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
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
                disabled={createCamera.isPending || !location.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50"
              >
                {createCamera.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                Deploy Node
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
