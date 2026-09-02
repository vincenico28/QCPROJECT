import { createFileRoute, Link } from "@tanstack/react-router";
import {
  QrCode,
  FileSignature,
  RadioReceiver,
  ShieldCheck,
  LogOut,
  LayoutDashboard,
  Power,
  FileCheck2,
  MapPin,
  Clock,
  Battery,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useDispatches } from "@/lib/data/dispatch";
import { useOfficers, useToggleOfficerDuty, useCitations } from "@/lib/data/traffic";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/officer/")({
  head: () => ({
    meta: [{ title: "Field Officer Mobile Terminal · Culiat Traffic Ops" }],
  }),
  component: OfficerTerminalHome,
});

function OfficerTerminalHome() {
  const { user } = useAuth();
  const { data: officers = [] } = useOfficers();
  const { data: dispatches = [] } = useDispatches();
  const { data: citations = [] } = useCitations(100);
  const toggleDuty = useToggleOfficerDuty();

  const currentOfficer =
    officers.find(
      (o) => o.badge_number.toLowerCase() === user?.email?.split("@")[0].toLowerCase()
    ) || officers[0];

  const isOnDuty = currentOfficer ? Boolean(currentOfficer.on_duty) : true;

  const activeDispatchesCount = dispatches.filter(
    (d) => d.status === "queued" || d.status === "en_route" || d.status === "on_scene"
  ).length;

  const todayCitationsCount = citations.filter((c) =>
    c.officer_name?.toLowerCase().includes(user?.email?.split("@")[0].toLowerCase() || "enforcer")
  ).length;

  const handleToggleDuty = () => {
    if (!currentOfficer) return;
    toggleDuty.mutate(
      { id: currentOfficer.id, currentDuty: isOnDuty },
      {
        onSuccess: (res) => {
          toast.success(
            res.on_duty
              ? "Status changed to ON DUTY. GPS Telemetry Active."
              : "Status changed to OFF DUTY. Rest Shift Logged."
          );
        },
        onError: () => toast.error("Failed to update duty status"),
      }
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground max-w-xl mx-auto border-x border-border shadow-2xl">
      {/* Mobile Terminal Top Bar */}
      <header className="flex items-center justify-between border-b border-border bg-panel p-4 shadow-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-2xl bg-primary/20 text-primary border border-primary/30">
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground leading-tight">Field Terminal</h1>
            <p className="text-xs font-mono-tab text-muted-foreground">
              {currentOfficer
                ? `${currentOfficer.full_name} · #${currentOfficer.badge_number}`
                : `Officer ${user?.email?.split("@")[0] || "Badge 104"}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel-elevated px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-panel transition-colors"
            title="Return to Command Dashboard"
          >
            <LayoutDashboard className="size-3.5 text-primary" />
            <span className="hidden sm:inline">HQ Center</span>
          </Link>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              toast.success("Terminal session ended");
              window.location.href = "/";
            }}
            className="grid size-9 place-items-center rounded-xl bg-danger/10 text-danger transition-colors hover:bg-danger/20 border border-danger/20"
            title="Exit Terminal"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </header>

      {/* Main Terminal Workspace */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Officer Shift Telemetry Card */}
        <div
          className={cn(
            "rounded-3xl border p-5 transition-all shadow-xl",
            isOnDuty
              ? "border-emerald-500/40 bg-emerald-500/10 shadow-emerald-500/5"
              : "border-amber-500/40 bg-amber-500/10 shadow-amber-500/5"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono-tab text-[10px] font-bold uppercase tracking-wider text-subtle">
              Shift Telemetry Link
            </span>
            <button
              onClick={handleToggleDuty}
              disabled={toggleDuty.isPending}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono-tab text-xs font-bold transition-all shadow-sm",
                isOnDuty
                  ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/25"
                  : "bg-amber-500 text-black hover:bg-amber-600 shadow-amber-500/25"
              )}
            >
              <Power className="size-3" />
              {isOnDuty ? "ON DUTY (ACTIVE)" : "OFF DUTY (REST)"}
            </button>
          </div>

          <h2 className="mt-3 text-2xl font-black text-foreground">
            {isOnDuty ? "ACTIVE PATROL · ONLINE" : "OFF DUTY / STANDBY"}
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-muted-foreground font-mono-tab">
            <span>Sector: {currentOfficer?.district || "District 6 - Culiat"}</span>
            <span>&bull;</span>
            <span>Unit: {currentOfficer?.unit || "QC-ENF"}</span>
            <span>&bull;</span>
            <span className="text-emerald-400 font-bold">GPS: Connected</span>
          </div>
        </div>

        {/* Primary Action Tiles */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            to="/officer/scan"
            className="panel flex flex-col items-center gap-3 rounded-3xl border border-border bg-panel p-6 text-center shadow-lg transition-all hover:bg-panel-elevated hover:border-primary/40 active:scale-95"
          >
            <div className="grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <QrCode className="size-7" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-sm">Scan QR Notice</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Verify Citation & OVR</p>
            </div>
          </Link>

          <Link
            to="/officer/issue"
            className="panel flex flex-col items-center gap-3 rounded-3xl border border-border bg-panel p-6 text-center shadow-lg transition-all hover:bg-panel-elevated hover:border-amber-500/40 active:scale-95"
          >
            <div className="grid size-14 place-items-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/25">
              <FileSignature className="size-7" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-sm">Issue Citation</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Manual Traffic Ticket</p>
            </div>
          </Link>
        </div>

        {/* Dispatches Banner Tile */}
        <Link
          to="/officer/dispatches"
          className="panel flex items-center justify-between rounded-3xl border border-border bg-panel p-5 shadow-lg transition-all hover:bg-panel-elevated hover:border-primary/40 active:scale-98"
        >
          <div className="flex items-center gap-4">
            <div className="grid size-12 place-items-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <RadioReceiver className="size-6" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-sm">HQ Dispatches</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeDispatchesCount} active incident {activeDispatchesCount === 1 ? "call" : "calls"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-mono-tab font-bold text-white shadow-md shadow-emerald-500/30">
              {activeDispatchesCount}
            </span>
            <ChevronRight className="size-4 text-subtle" />
          </div>
        </Link>

        {/* Today's Activity Ledger Summary */}
        <div className="panel rounded-3xl border border-border bg-panel p-5 shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <FileCheck2 className="size-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">Unit Activity</h4>
              <p className="text-xs text-muted-foreground">Digital citations issued today</p>
            </div>
          </div>
          <span className="font-mono-tab text-2xl font-black text-primary">
            {todayCitationsCount}
          </span>
        </div>
      </main>
    </div>
  );
}
