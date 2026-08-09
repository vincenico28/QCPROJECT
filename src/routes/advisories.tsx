import { createFileRoute } from "@tanstack/react-router";
import { useAdvisories } from "@/lib/data/advisories";
import { Loader2, Megaphone, Plus, AlertTriangle, Info, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/advisories")({
  head: () => ({
    meta: [{ title: "Public Advisories — Culiat Traffic Ops" }],
  }),
  component: AdvisoriesPage,
});

function AdvisoriesPage() {
  const { data: advisories, isLoading } = useAdvisories();

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Megaphone className="size-6 text-blue-500" />
            Public Advisories
          </h1>
          <p className="text-sm text-muted-foreground">Broadcast live traffic updates and road closures to the Citizen Portal.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90">
          <Plus className="size-4" />
          New Broadcast
        </button>
      </div>

      {isLoading || !advisories ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4">
          {advisories.map((advisory) => {
            const Icon = advisory.severity === "Critical" ? ShieldAlert : advisory.severity === "Warning" ? AlertTriangle : Info;
            return (
              <div 
                key={advisory.id} 
                className={cn(
                  "panel flex flex-col gap-2 rounded-2xl border p-5 shadow-lg transition-colors",
                  advisory.severity === "Critical" ? "border-red-500/30 bg-red-500/5" :
                  advisory.severity === "Warning" ? "border-orange-500/30 bg-orange-500/5" :
                  "border-blue-500/30 bg-blue-500/5"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "grid size-10 place-items-center rounded-lg",
                      advisory.severity === "Critical" ? "bg-red-500/20 text-red-500" :
                      advisory.severity === "Warning" ? "bg-orange-500/20 text-orange-500" :
                      "bg-blue-500/20 text-blue-500"
                    )}>
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{advisory.title}</h3>
                      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded font-bold",
                          advisory.severity === "Critical" ? "bg-red-500/20 text-red-400" :
                          advisory.severity === "Warning" ? "bg-orange-500/20 text-orange-400" :
                          "bg-blue-500/20 text-blue-400"
                        )}>
                          {advisory.severity}
                        </span>
                        <span>{new Date(advisory.publishedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="relative flex size-2">
                       <span className={cn(
                         "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                         advisory.active ? "bg-emerald-400" : "bg-neutral-500"
                       )}></span>
                       <span className={cn(
                         "relative inline-flex size-2 rounded-full",
                         advisory.active ? "bg-emerald-500" : "bg-neutral-600"
                       )}></span>
                    </span>
                    <span className="text-xs font-semibold text-white">{advisory.active ? "Live" : "Archived"}</span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-white/80 pl-13">
                  {advisory.message}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
