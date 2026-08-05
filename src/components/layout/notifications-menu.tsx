import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, AlertTriangle, Radio, VideoOff, CheckCheck } from "lucide-react";
import { useCameras, useViolations, timeAgo } from "@/lib/data/traffic";
import { useDispatches } from "@/lib/data/dispatch";
import { cn } from "@/lib/utils";

type Alert = {
  id: string;
  kind: "violation" | "dispatch" | "camera";
  title: string;
  detail: string;
  at: string;
  severity: "critical" | "warning" | "info";
  to: string;
};

const READ_KEY = "qc-alerts-read-at";

export function NotificationsMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [readAt, setReadAt] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    return Number(window.localStorage.getItem(READ_KEY) ?? 0);
  });

  const { data: violations = [] } = useViolations(40);
  const { data: dispatches = [] } = useDispatches(30);
  const { data: cameras = [] } = useCameras();

  const alerts = useMemo<Alert[]>(() => {
    const items: Alert[] = [];

    for (const v of violations) {
      if (v.status !== "pending") continue;
      const conf = Number(v.confidence);
      items.push({
        id: `v-${v.id}`,
        kind: "violation",
        title: `${v.violation_type} · ${v.plate_number}`,
        detail: `${v.location} · ${conf.toFixed(1)}% confidence`,
        at: v.detected_at,
        severity: conf >= 92 ? "critical" : "warning",
        to: "/violations",
      });
    }

    for (const d of dispatches) {
      if (d.status !== "queued" && d.status !== "en_route") continue;
      items.push({
        id: `d-${d.id}`,
        kind: "dispatch",
        title: `${d.priority === "critical" ? "Critical " : ""}Dispatch ${d.reference}`,
        detail: `${d.location} · ${d.officer_name ?? "Unassigned"}`,
        at: d.created_at,
        severity: d.priority === "critical" ? "critical" : "info",
        to: "/dispatch",
      });
    }

    for (const c of cameras) {
      if (c.status === "online") continue;
      items.push({
        id: `c-${c.id}`,
        kind: "camera",
        title: `Node ${c.code} ${c.status}`,
        detail: c.location,
        at: new Date().toISOString(),
        severity: "warning",
        to: `/cameras/${c.code}`,
      });
    }

    return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 20);
  }, [violations, dispatches, cameras]);

  const unread = alerts.filter((a) => new Date(a.at).getTime() > readAt).length;

  const markRead = () => {
    const now = Date.now();
    setReadAt(now);
    if (typeof window !== "undefined") window.localStorage.setItem(READ_KEY, String(now));
  };

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) markRead();
      }}
    >
      <PopoverTrigger asChild>
        <button
          className="relative grid size-10 place-items-center rounded-xl border border-border bg-panel text-subtle transition-colors hover:text-foreground"
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        >
          <Bell className="size-4" strokeWidth={2} />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-danger px-1 font-mono-tab text-[9px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[22rem] border-border bg-panel p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="font-mono-tab text-[11px] font-semibold uppercase tracking-widest text-subtle">
            Live Alerts
          </span>
          <span className="font-mono-tab text-[10px] text-muted-foreground">
            {alerts.length} active
          </span>
        </div>

        <div className="max-h-[24rem] divide-y divide-border overflow-y-auto">
          {alerts.length === 0 && (
            <div className="flex flex-col items-center gap-2 p-8 text-center text-sm text-subtle">
              <CheckCheck className="size-5 text-success" />
              All clear — no open alerts.
            </div>
          )}

          {alerts.map((a) => {
            const Icon =
              a.kind === "dispatch" ? Radio : a.kind === "camera" ? VideoOff : AlertTriangle;
            const tone =
              a.severity === "critical"
                ? "text-danger"
                : a.severity === "warning"
                  ? "text-warning"
                  : "text-primary";
            return (
              <button
                key={a.id}
                onClick={() => {
                  setOpen(false);
                  void navigate({ to: a.to });
                }}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-panel-elevated"
              >
                <Icon className={cn("mt-0.5 size-4 shrink-0", tone)} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">{a.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{a.detail}</div>
                </div>
                <span className="shrink-0 font-mono-tab text-[10px] text-subtle">
                  {timeAgo(a.at)}
                </span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
