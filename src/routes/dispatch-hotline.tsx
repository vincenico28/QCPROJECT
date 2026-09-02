import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useHotlineCalls, useDispatchHotlineCall, type HotlineCall } from "@/lib/data/hotline";
import {
  Loader2,
  PhoneCall,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  PhoneForwarded,
  Clock,
  MapPin,
  Radio,
  User,
  Volume2,
  PhoneIncoming,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DispatchDialog } from "@/components/dispatch/dispatch-dialog";

export const Route = createFileRoute("/dispatch-hotline")({
  head: () => ({
    meta: [
      { title: "Emergency Dispatch Hotline (911/122) · Culiat Traffic Ops" },
      {
        name: "description",
        content:
          "Live emergency distress call intake, rapid patrol unit routing, and citizen incident dispatch for Barangay Culiat, Quezon City.",
      },
    ],
  }),
  component: DispatchHotlinePage,
});

export function DispatchHotlinePage() {
  const { data: calls = [], isLoading } = useHotlineCalls();
  const dispatchCall = useDispatchHotlineCall();
  const [selectedCall, setSelectedCall] = useState<HotlineCall | null>(null);

  const activeCalls = calls.filter((c) => c.status === "Active");
  const resolvedCalls = calls.filter((c) => c.status === "Resolved");

  const handleDispatch = (call: HotlineCall) => {
    dispatchCall.mutate(call, {
      onSuccess: () => {
        toast.success(`Unit Dispatched for Call #${call.id}!`, {
          description: `Rapid response unit routed to ${call.location}.`,
        });
      },
    });
  };

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-danger/20 px-2 py-0.5 font-mono-tab text-[10px] font-bold text-danger border border-danger/30">
              QC 122 / 911 INTAKE
            </span>
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-danger"></span>
            </span>
            <span className="text-xs text-subtle">· Live Citizen Distress Feed</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight mt-1 flex items-center gap-2.5">
            <PhoneCall className="size-6 text-danger" />
            Emergency Dispatch Hotline
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Intake urgent traffic distress calls, triage collision severity, and route rapid response intercept units.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-danger/40 bg-danger/10 px-3.5 py-1.5 text-xs font-bold text-danger animate-pulse shadow-sm">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-danger"></span>
            </span>
            {activeCalls.length} Active Distress Lines
          </div>

          <Link
            to="/dispatch"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-panel-elevated transition-colors"
          >
            <Radio className="size-3.5 text-primary" />
            Dispatch Queue
          </Link>
        </div>
      </div>

      {/* Main Grid: Active Calls Intake + History */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Active Incoming Calls */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <PhoneIncoming className="size-4 text-danger animate-bounce" />
              Active Incident Distress Calls ({activeCalls.length})
            </h2>
            <span className="font-mono-tab text-[10px] text-subtle">Live VoIP Stream Active</span>
          </div>

          {isLoading ? (
            <div className="grid h-64 place-items-center">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : activeCalls.length === 0 ? (
            <div className="panel flex flex-col items-center justify-center rounded-2xl border border-border p-12 text-center text-sm text-subtle">
              <CheckCircle2 className="size-8 text-emerald-400 mb-2 opacity-80" />
              <p className="font-bold text-foreground">All emergency lines cleared</p>
              <p className="text-xs text-muted-foreground mt-1">No pending distress calls currently in queue.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {activeCalls.map((call) => {
                const isCritical = call.level === "Critical";
                return (
                  <div
                    key={call.id}
                    className={cn(
                      "panel rounded-3xl border p-5 sm:p-6 shadow-xl relative overflow-hidden transition-all",
                      isCritical
                        ? "border-danger/50 bg-gradient-to-r from-danger/10 via-panel to-panel shadow-danger/10"
                        : "border-warning/40 bg-gradient-to-r from-warning/10 via-panel to-panel shadow-warning/5"
                    )}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div
                          className={cn(
                            "grid size-12 shrink-0 place-items-center rounded-2xl shadow-lg border",
                            isCritical
                              ? "bg-danger/20 text-danger border-danger/40 shadow-danger/20"
                              : "bg-warning/20 text-warning border-warning/40 shadow-warning/20"
                          )}
                        >
                          {isCritical ? (
                            <ShieldAlert className="size-6" />
                          ) : (
                            <AlertTriangle className="size-6" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-foreground text-base sm:text-lg">
                              {call.caller}
                            </h3>
                            <span className="font-mono-tab text-xs text-muted-foreground bg-panel-elevated px-2.5 py-0.5 rounded-full border border-border">
                              {call.phoneNumber}
                            </span>
                            <span
                              className={cn(
                                "font-mono-tab text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border",
                                isCritical
                                  ? "bg-danger/20 text-danger border-danger/40 animate-pulse"
                                  : "bg-warning/20 text-warning border-warning/40"
                              )}
                            >
                              {call.level} Priority
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-foreground font-medium">
                            <MapPin className="size-3.5 text-primary shrink-0" />
                            <span>{call.location}</span>
                          </div>

                          <div className="mt-3 rounded-2xl border border-border bg-panel-elevated/70 p-3.5 text-xs text-foreground/90 leading-relaxed border-l-4 border-l-primary">
                            <span className="text-[9px] font-mono-tab text-subtle uppercase block mb-1">
                              Citizen Statement Transcript:
                            </span>
                            "{call.issue}"
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 shrink-0 border-t md:border-t-0 border-border pt-3 md:pt-0">
                        <div className="text-left md:text-right">
                          <p className="text-[10px] font-mono-tab uppercase tracking-wider text-subtle">
                            Queue Hold Time
                          </p>
                          <p className="text-sm font-mono-tab font-bold text-danger mt-0.5 flex items-center md:justify-end gap-1">
                            <Clock className="size-3" /> 00:01:48
                          </p>
                        </div>

                        <button
                          onClick={() => handleDispatch(call)}
                          disabled={dispatchCall.isPending}
                          className="inline-flex items-center gap-2 justify-center rounded-xl bg-danger px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-danger/90 shadow-lg shadow-danger/25 active:scale-95 disabled:opacity-50"
                        >
                          {dispatchCall.isPending ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <PhoneForwarded className="size-3.5" />
                          )}
                          Dispatch Intercept
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recently Resolved Log */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-400" />
              Recently Resolved ({resolvedCalls.length})
            </h2>
            <span className="font-mono-tab text-[10px] text-emerald-400">Archived</span>
          </div>

          <div className="flex flex-col gap-3">
            {resolvedCalls.map((call) => (
              <div
                key={call.id}
                className="panel rounded-2xl border border-border bg-panel-elevated/40 p-4 transition-all hover:bg-panel-elevated hover:border-border/80"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-foreground">{call.location}</h4>
                  <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{call.issue}</p>
                <div className="mt-3 flex items-center justify-between font-mono-tab text-[10px] text-subtle pt-2 border-t border-border/50">
                  <span>Caller: {call.caller}</span>
                  <span>{new Date(call.timeReceived).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
            ))}

            {resolvedCalls.length === 0 && (
              <div className="p-8 text-center text-xs text-subtle">
                No resolved incidents logged yet today.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
