import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Map as MapIcon,
  Video,
  FileText,
  Car,
  Users,
  CreditCard,
  LogOut,
  Search,
  Command,
  Loader2,
  BarChart3,
  Radio,
  UserCog,
  Scale,
  Settings2,
  Landmark,
  Bus,
  Mail,
  Server,
  ShieldAlert,
  BrainCircuit,
  Flame,
  Smartphone,
  PhoneCall,
  TrendingUp,
  ShieldCheck,
  ChevronDown,
  Lock,
  ArrowLeft,
  Code2,
  Wrench,
  Bot,
  PanelLeftClose,
  PanelLeftOpen,
  Megaphone,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { SignInScreen } from "@/components/auth/sign-in-screen";
import { supabase } from "@/integrations/supabase/client";
import { DispatchDialog } from "@/components/dispatch/dispatch-dialog";
import { NotificationsMenu } from "@/components/layout/notifications-menu";
import { CommandPalette, useCommandPalette } from "@/components/layout/command-palette";
import { SYSTEM_ROLES, hasRoleAccess, type SystemRole } from "@/lib/rbac";
import * as Popover from "@radix-ui/react-popover";

type NavItem = {
  to: string;
  label: string;
  icon: any;
  badge?: string;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Operations",
    items: [
      { to: "/dashboard", label: "Command Center", icon: LayoutDashboard },
      { to: "/violations", label: "AI Violations", icon: FileText },
      { to: "/citations", label: "Citations & NOV", icon: CreditCard },
      { to: "/cameras", label: "Camera Grid", icon: Video },
      { to: "/map", label: "GIS Operations Map", icon: MapIcon },
      { to: "/vehicles", label: "Vehicle Registry", icon: Car },
      { to: "/advisories", label: "Public Advisories", icon: Megaphone },
    ],
  },
  {
    title: "Field & Response",
    items: [
      { to: "/dispatch", label: "Tactical Dispatch", icon: Radio },
      { to: "/officers/shifts", label: "Officer Shifts & GPS", icon: Users },
      { to: "/officers", label: "Personnel Roster", icon: Users },
      { to: "/dispatch-hotline", label: "Emergency Hotline", icon: PhoneCall },
      { to: "/transport", label: "Public Transport", icon: Bus },
      { to: "/officer", label: "Enforcer Terminal", icon: Smartphone },
    ],
  },
  {
    title: "Intelligence & AI",
    items: [
      { to: "/analytics/heatmaps", label: "Predictive Heatmaps", icon: Flame },
      { to: "/analytics", label: "Traffic Analytics", icon: BarChart3 },
      { to: "/ai-training", label: "YOLOv11 AI Training", icon: BrainCircuit },
      { to: "/infrastructure", label: "Infrastructure Health", icon: Wrench },
      { to: "/iot", label: "IoT Edge Nodes", icon: Server },
      { to: "/automation", label: "Automated Rules", icon: Bot },
    ],
  },
  {
    title: "Treasury & Legal",
    items: [
      { to: "/finance", label: "Treasury Cashier", icon: Landmark },
      { to: "/finance-analytics", label: "Executive Analytics", icon: TrendingUp },
      { to: "/disputes", label: "TAB Disputes", icon: Scale },
      { to: "/reports", label: "Statutory Reports", icon: FileText },
    ],
  },
  {
    title: "System & Security",
    items: [
      { to: "/communications", label: "Official Notices", icon: Mail },
      { to: "/developer", label: "Developer API", icon: Code2 },
      { to: "/employees", label: "Staff Directory", icon: UserCog },
      { to: "/audit-logs", label: "Security Audit Logs", icon: ShieldAlert },
      { to: "/settings", label: "Settings & RBAC", icon: Settings2 },
    ],
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { session, loading, user, role, roleDef, setSimulatedRole } = useAuth();
  const email = user?.email ?? null;
  const palette = useCommandPalette();
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Public pages render without the operations chrome or auth gate.
  if (
    pathname === "/" ||
    pathname === "/tv-display" ||
    pathname.startsWith("/lookup") ||
    pathname.startsWith("/citizen") ||
    pathname.startsWith("/portal")
  ) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return <SignInScreen />;

  // Check RBAC clearance for the current path
  const isAuthorized = hasRoleAccess(role, pathname);

  // Filter navigation groups accessible to the active role
  const accessibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => hasRoleAccess(role, item.to)),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      {/* Enhanced Collapsible / Expandable Sidebar */}
      <aside
        className={cn(
          "sticky top-0 flex h-dvh shrink-0 flex-col border-r border-border bg-panel transition-all duration-300 z-30",
          isCollapsed ? "w-20 items-center py-6" : "w-64 p-4 justify-between"
        )}
      >
        {/* Sidebar Header */}
        <div className={cn("flex items-center", isCollapsed ? "flex-col gap-4" : "justify-between px-2 pb-3 border-b border-border/60")}>
          <Link
            to="/dashboard"
            className="flex items-center gap-3 group"
            aria-label="Barangay Culiat, Quezon City Traffic Ops"
          >
            <div className="grid size-10 place-items-center overflow-hidden rounded-xl bg-panel-elevated border border-border shadow-lg shadow-primary/25 transition-transform group-hover:scale-105">
              <img src="/favico2.png" alt="QC Logo" className="size-full object-contain" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="text-xs font-bold tracking-tight text-white leading-tight">
                  Culiat Traffic Ops
                </p>
                <p className="font-mono-tab text-[9px] uppercase tracking-widest text-primary font-semibold">
                  QC Flow Guardian
                </p>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="rounded-lg p-1.5 text-subtle hover:bg-panel-elevated hover:text-foreground transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
        </div>

        {/* Quick Search Shortcut inside Sidebar when Expanded */}
        {!isCollapsed && (
          <button
            type="button"
            onClick={() => palette.setOpen(true)}
            className="my-3 flex items-center justify-between rounded-xl border border-border bg-panel-elevated px-3 py-2 text-xs text-subtle hover:border-primary/40 hover:text-foreground transition-all shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Search className="size-3.5" />
              <span>Quick Search...</span>
            </div>
            <span className="flex items-center gap-0.5 rounded bg-background px-1.5 py-0.5 font-mono-tab text-[9px] text-muted-foreground border border-border">
              <Command className="size-2.5" /> K
            </span>
          </button>
        )}

        {/* Navigation Categories */}
        <nav
          className={cn(
            "flex w-full flex-1 flex-col overflow-y-auto overflow-x-hidden py-2 custom-scrollbar",
            isCollapsed ? "items-center gap-2 [&::-webkit-scrollbar]:hidden" : "gap-5"
          )}
          style={{ scrollbarWidth: isCollapsed ? "none" : "thin" }}
        >
          {accessibleGroups.map((group) => (
            <div key={group.title} className="w-full flex flex-col gap-1">
              {!isCollapsed && (
                <span className="px-3 font-mono-tab text-[9px] font-bold uppercase tracking-widest text-muted-foreground/80 mb-1">
                  {group.title}
                </span>
              )}
              {group.items.map((item) => {
                const active = pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to));
                const Icon = item.icon;

                if (isCollapsed) {
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      aria-label={item.label}
                      className={cn(
                        "group relative grid size-10 place-items-center rounded-xl transition-all",
                        active
                          ? "bg-primary/15 text-primary font-bold shadow-sm"
                          : "text-subtle hover:bg-panel-elevated hover:text-foreground",
                      )}
                    >
                      <Icon className="size-5" strokeWidth={active ? 2 : 1.75} />
                      {active && (
                        <span className="absolute -left-3 h-6 w-1 rounded-full bg-primary shadow-glow" />
                      )}
                      <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md border border-border bg-panel-elevated px-2.5 py-1 text-xs font-semibold opacity-0 shadow-2xl transition-opacity group-hover:opacity-100 z-50">
                        {item.label}
                      </span>
                    </Link>
                  );
                }

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "group relative flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all",
                      active
                        ? "bg-primary/15 text-primary border border-primary/30 shadow-sm"
                        : "text-subtle hover:bg-panel-elevated hover:text-foreground",
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={cn("size-4 shrink-0 transition-transform group-hover:scale-110", active ? "text-primary" : "text-subtle")} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {active && (
                      <span className="size-1.5 rounded-full bg-primary shadow-glow shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Profile & Sign Out Footer */}
        <div className={cn("mt-auto pt-3 border-t border-border/60", isCollapsed ? "flex flex-col items-center gap-3" : "flex flex-col gap-2")}>
          {!isCollapsed ? (
            <div className="flex items-center justify-between rounded-xl bg-panel-elevated p-2.5 border border-border">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-lg bg-panel font-mono-tab text-xs font-bold text-foreground ring-2 relative",
                    role === "super_admin" ? "ring-purple-500/60" :
                    role === "admin" ? "ring-primary/60" :
                    role === "dispatcher" ? "ring-emerald-500/60" :
                    role === "officer" ? "ring-amber-500/60" :
                    role === "finance" ? "ring-cyan-500/60" : "ring-border"
                  )}
                >
                  {(email?.[0] ?? "Q").toUpperCase()}
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 size-2 rounded-full border border-panel",
                      role === "super_admin" ? "bg-purple-500" :
                      role === "admin" ? "bg-primary" :
                      role === "dispatcher" ? "bg-emerald-500" :
                      role === "officer" ? "bg-amber-500" :
                      role === "finance" ? "bg-cyan-500" : "bg-subtle"
                    )}
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-foreground truncate leading-tight">
                    {email?.split("@")[0] || "Operator"}
                  </span>
                  <span className="font-mono-tab text-[9px] uppercase tracking-wider text-muted-foreground truncate">
                    {roleDef.label}
                  </span>
                </div>
              </div>

              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = "/";
                }}
                className="rounded-lg p-1.5 text-subtle hover:bg-panel hover:text-danger transition-colors shrink-0"
                title="Sign out"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = "/";
                }}
                className="grid size-10 place-items-center rounded-xl text-subtle transition-colors hover:bg-panel-elevated hover:text-danger"
                title="Sign out"
              >
                <LogOut className="size-5" strokeWidth={1.75} />
              </button>
              <div
                className={cn(
                  "grid size-10 place-items-center rounded-full bg-panel-elevated font-mono-tab text-[11px] font-bold text-foreground ring-2 relative",
                  role === "super_admin" ? "ring-purple-500/60 shadow-[0_0_10px_rgba(168,85,247,0.3)]" :
                  role === "admin" ? "ring-primary/60 shadow-[0_0_10px_var(--color-primary)]/20" :
                  role === "dispatcher" ? "ring-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.3)]" :
                  role === "officer" ? "ring-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.3)]" :
                  role === "finance" ? "ring-cyan-500/60 shadow-[0_0_10px_rgba(6,182,212,0.3)]" :
                  "ring-border"
                )}
                title={`${email ?? "Signed in"} (${roleDef.label})`}
              >
                {(email?.[0] ?? "Q").toUpperCase()}
                <span
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-panel",
                    role === "super_admin" ? "bg-purple-500" :
                    role === "admin" ? "bg-primary" :
                    role === "dispatcher" ? "bg-emerald-500" :
                    role === "officer" ? "bg-amber-500" :
                    role === "finance" ? "bg-cyan-500" :
                    role === "adjudicator" ? "bg-indigo-500" : "bg-subtle"
                  )}
                />
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-6 backdrop-blur-md sm:h-20 sm:px-8">
          <div className="hidden min-w-0 flex-1 sm:block">
            <PageHeading pathname={pathname} />
          </div>

          <div className="ml-auto flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => palette.setOpen(true)}
              aria-label="Open search"
              className="relative hidden lg:flex w-64 items-center rounded-lg border border-border bg-panel py-2 pl-9 pr-14 text-left text-sm text-subtle transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <Search className="pointer-events-none absolute left-3 size-4 text-subtle" />
              Search plate, officer, location…
              <span className="pointer-events-none absolute right-2 flex items-center gap-1 rounded-md border border-border bg-panel-elevated px-1.5 py-0.5 font-mono-tab text-[10px] text-subtle">
                <Command className="size-3" /> K
              </span>
            </button>

            {/* Interactive RBAC Role Clearance Switcher */}
            <Popover.Root open={roleSwitcherOpen} onOpenChange={setRoleSwitcherOpen}>
              <Popover.Trigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-1.5 shadow-sm transition-colors hover:border-primary/50",
                    roleDef.badgeColor
                  )}
                >
                  <ShieldCheck className="size-4 shrink-0" />
                  <div className="flex flex-col text-left">
                    <span className="font-mono-tab text-[9px] uppercase tracking-widest opacity-70 leading-none">
                      Active Clearance
                    </span>
                    <span className="font-mono-tab text-xs font-bold leading-tight">
                      {roleDef.label}
                    </span>
                  </div>
                  <ChevronDown className="size-3.5 opacity-60 ml-0.5" />
                </button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  align="end"
                  sideOffset={8}
                  className="z-50 w-80 rounded-2xl border border-border bg-panel p-3 shadow-2xl backdrop-blur-xl"
                >
                  <div className="mb-2.5 px-2 pt-1">
                    <span className="font-mono-tab text-[10px] font-bold uppercase tracking-widest text-primary">
                      Role-Based Access Control (RBAC)
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Switch active security clearance to test role-scoped permissions:
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    {(Object.keys(SYSTEM_ROLES) as SystemRole[]).map((rKey) => {
                      const r = SYSTEM_ROLES[rKey];
                      const isCurrent = role === rKey;
                      return (
                        <button
                          key={rKey}
                          onClick={() => {
                            setSimulatedRole(rKey);
                            setRoleSwitcherOpen(false);
                          }}
                          className={cn(
                            "flex items-start gap-2.5 rounded-xl p-2.5 text-left transition-colors",
                            isCurrent
                              ? "bg-panel-elevated border border-border/80"
                              : "hover:bg-panel-elevated/60"
                          )}
                        >
                          <span
                            className={cn(
                              "mt-0.5 size-2.5 rounded-full shrink-0",
                              rKey === "super_admin" ? "bg-purple-500" :
                              rKey === "admin" ? "bg-blue-500" :
                              rKey === "dispatcher" ? "bg-emerald-500" :
                              rKey === "officer" ? "bg-amber-500" :
                              rKey === "finance" ? "bg-cyan-500" :
                              rKey === "adjudicator" ? "bg-indigo-500" : "bg-neutral-400"
                            )}
                          />
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-foreground">
                                {r.label}
                              </span>
                              {isCurrent && (
                                <span className="rounded bg-primary/20 px-1.5 py-0.2 text-[9px] font-mono-tab text-primary">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground line-clamp-1">
                              {r.department}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>

            <div className="hidden md:flex flex-col items-end">
              <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                System
              </span>
              <span className="font-mono-tab text-xs font-medium text-foreground">
                Quezon City · Culiat
              </span>
            </div>

            <DispatchDialog
              trigger={
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                >
                  <Radio className="size-3.5" />
                  <span className="hidden sm:inline">Dispatch</span>
                </button>
              }
            />
            <NotificationsMenu />
          </div>
        </header>

        {/* Dynamic Route Body or RBAC Restricted Clearance Screen */}
        <main className="flex-1">
          {isAuthorized ? (
            children
          ) : (
            <AccessDeniedScreen roleDef={roleDef} pathname={pathname} />
          )}
        </main>
      </div>

      <CommandPalette
        open={palette.open}
        onOpenChange={palette.setOpen}
      />
    </div>
  );
}

function AccessDeniedScreen({ roleDef, pathname }: { roleDef: any; pathname: string }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-8 text-center">
      <div className="grid size-16 place-items-center rounded-2xl bg-danger/10 text-danger border border-danger/20 mb-4 shadow-xl">
        <Lock className="size-8" />
      </div>
      <span className="font-mono-tab text-xs uppercase tracking-widest text-danger font-bold">
        Government Restricted Area · 403 Forbidden
      </span>
      <h2 className="text-2xl font-bold tracking-tight text-foreground mt-2">
        Access Clearance Required
      </h2>
      <p className="max-w-md text-sm text-muted-foreground mt-2">
        Your current active role <span className="font-semibold text-foreground">"{roleDef.label}"</span> does not have security authorization to access <code className="bg-panel-elevated px-1.5 py-0.5 rounded text-primary font-mono">{pathname}</code>.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105"
        >
          <ArrowLeft className="size-4" />
          Return to Command Dashboard
        </Link>
      </div>
    </div>
  );
}

function PageHeading({ pathname }: { pathname: string }) {
  if (pathname.startsWith("/violations")) {
    return (
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">AI Violations Review</h1>
        <p className="text-xs text-subtle">
          Real-time YOLOv11 camera detections, confidence scoring, and citation verification.
        </p>
      </div>
    );
  }
  if (pathname.startsWith("/citations")) {
    return (
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">Digital Citations & NOV Ledger</h1>
        <p className="text-xs text-subtle">
          Notices of Violation (NOV), penalty settlement status, and LTO clearance certificates.
        </p>
      </div>
    );
  }
  if (pathname.startsWith("/cameras")) {
    return (
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">Live Camera Grid & ANPR</h1>
        <p className="text-xs text-subtle">
          Real-time CCTV optical feeds, speed enforcement nodes, and IoT sensor health.
        </p>
      </div>
    );
  }
  if (pathname.startsWith("/map")) {
    return (
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">GIS Spatial Operations Map</h1>
        <p className="text-xs text-subtle">
          Live incident clustering, camera telemetry overlays, and active field officer GPS tracking.
        </p>
      </div>
    );
  }
  if (pathname.startsWith("/vehicles")) {
    return (
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">Motorist Vehicle Registry</h1>
        <p className="text-xs text-subtle">
          LTO LTMS database integration, repeat offender records, and hotlist registration alarms.
        </p>
      </div>
    );
  }
  if (pathname.startsWith("/officers/shifts")) {
    return (
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">Officer Shifts & Live GPS</h1>
        <p className="text-xs text-subtle">
          Real-time patrol unit coordinates, battery telemetry, and sector assignments.
        </p>
      </div>
    );
  }
  if (pathname.startsWith("/officers")) {
    return (
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">Field Enforcers & Personnel</h1>
        <p className="text-xs text-subtle">
          Duty roster, enforcer service records, and citation performance metrics.
        </p>
      </div>
    );
  }
  if (pathname.startsWith("/dispatch-hotline")) {
    return (
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">911 Emergency Hotline Intake</h1>
        <p className="text-xs text-subtle">
          Citizen distress call queue, priority triage, and rapid response unit deployments.
        </p>
      </div>
    );
  }
  if (pathname.startsWith("/dispatch")) {
    return (
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">Tactical Incident Dispatch</h1>
        <p className="text-xs text-subtle">
          Incident response coordination, unit assignments, and field status telemetry.
        </p>
      </div>
    );
  }
  if (pathname.startsWith("/disputes")) {
    return (
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">Traffic Adjudication Board (TAB)</h1>
        <p className="text-xs text-subtle">
          Citizen citation appeals, evidence deliberations, and formal resolution docket orders.
        </p>
      </div>
    );
  }
  if (pathname.startsWith("/transport")) {
    return (
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">Public Transport Coordination</h1>
        <p className="text-xs text-subtle">
          PUV route capacity, jeepney and bus terminal flow, and illegal terminal detection.
        </p>
      </div>
    );
  }
  if (pathname.startsWith("/finance-analytics")) {
    return (
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">Executive Financial Analytics</h1>
        <p className="text-xs text-subtle">
          Multi-stream revenue forecasting, collection trends, and municipal budget allocations.
        </p>
      </div>
    );
  }
  if (pathname.startsWith("/finance")) {
    return (
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">Treasury & Cashier Reconciliations</h1>
        <p className="text-xs text-subtle">
          Over-the-counter payments, cashier drawer balancing, and daily settlement audits.
        </p>
      </div>
    );
  }
  if (pathname.startsWith("/reports")) {
    return (
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">Statutory Executive Reports</h1>
        <p className="text-xs text-subtle">
          Quezon City statutory violation logs, revenue audit summaries, and official CSV exports.
        </p>
      </div>
    );
  }
  if (pathname.startsWith("/analytics/heatmaps")) {
    return (
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">Predictive Spatial AI Heatmaps</h1>
        <p className="text-xs text-subtle">
          GIS incident density calculations, 24-hour predictive traffic risk zones, and choke-point forecasts.
        </p>
      </div>
    );
  }
  if (pathname.startsWith("/analytics")) {
    return (
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">Operational Traffic Analytics</h1>
        <p className="text-xs text-subtle">
          Corridor velocity trends, violation distribution charts, and hourly congestion index.
        </p>
      </div>
    );
  }
  if (pathname.startsWith("/ai-training")) {
    return (
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">YOLOv11 AI Training & Fine-Tuning</h1>
        <p className="text-xs text-subtle">
          Dataset annotation, model fine-tuning checkpoints, and inference accuracy benchmarks.
        </p>
      </div>
    );
  }
  if (pathname.startsWith("/infrastructure")) {
    return (
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">Predictive Infrastructure Health</h1>
        <p className="text-xs text-subtle">
          Traffic light controllers, sensor loop degradation, and automated maintenance work orders.
        </p>
      </div>
    );
  }
  if (pathname.startsWith("/iot")) {
    return (
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">IoT Edge Nodes & Telemetry</h1>
        <p className="text-xs text-subtle">
          Edge compute nodes, live camera telemetry streaming, and remote hardware reboot watchdogs.
        </p>
      </div>
    );
  }
  if (pathname.startsWith("/automation")) {
    return (
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">Automated Rules Engine</h1>
        <p className="text-xs text-subtle">
          Autonomous IF-THIS-THEN-THAT protocols for instant dispatches and motorist advisories.
        </p>
      </div>
    );
  }
  if (pathname.startsWith("/developer")) {
    return (
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">Developer API Portal</h1>
        <p className="text-xs text-subtle">
          API token management, webhook feeds for Waze and MMDA, and integration documentation.
        </p>
      </div>
    );
  }
  if (pathname.startsWith("/communications")) {
    return (
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">Official Communications Dispatcher</h1>
        <p className="text-xs text-subtle">
          Automated email notices of violation, official electronic receipts, and emergency broadcast dispatch.
        </p>
      </div>
    );
  }
  if (pathname.startsWith("/employees")) {
    return (
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">Staff Directory & Access Control</h1>
        <p className="text-xs text-subtle">
          Personnel directory, RBAC credential provisioning, and security clearance management.
        </p>
      </div>
    );
  }
  if (pathname.startsWith("/audit-logs")) {
    return (
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">Enterprise Security & Audit Logs</h1>
        <p className="text-xs text-subtle">
          Immutable audit trail, administrative action tracking, and real-time security events.
        </p>
      </div>
    );
  }
  if (pathname.startsWith("/settings")) {
    return (
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">System Settings & Security Matrix</h1>
        <p className="text-xs text-subtle">
          RBAC permission clearance matrix, AI threshold calibrations, and fine penalty schedules.
        </p>
      </div>
    );
  }
  if (pathname.startsWith("/officer")) {
    return (
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">Field Enforcer Terminal</h1>
        <p className="text-xs text-subtle">
          On-street citation issuance, QR citation verification, and tactical dispatch queue.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-lg font-bold tracking-tight text-foreground">Command Center</h1>
      <p className="text-xs text-subtle">
        Barangay Culiat, Quezon City · AI Traffic Enforcement & Analytics Platform
      </p>
    </div>
  );
}
