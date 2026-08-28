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
  icon: typeof LayoutDashboard;
};

const ALL_NAV: NavItem[] = [
  { to: "/dashboard", label: "Command", icon: LayoutDashboard },
  { to: "/violations", label: "Violations", icon: FileText },
  { to: "/citations", label: "Citations", icon: CreditCard },
  { to: "/cameras", label: "Cameras", icon: Video },
  { to: "/map", label: "GIS Map", icon: MapIcon },
  { to: "/vehicles", label: "Vehicles", icon: Car },
  { to: "/officers", label: "Officers", icon: Users },
  { to: "/dispatch", label: "Dispatch", icon: Radio },
  { to: "/disputes", label: "Disputes", icon: Scale },
  { to: "/transport", label: "Transport", icon: Bus },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/finance", label: "Finance", icon: Landmark },
  { to: "/finance-analytics", label: "Executive Finance", icon: TrendingUp },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/analytics/heatmaps", label: "AI Heatmaps", icon: Flame },
  { to: "/ai-training", label: "AI Training", icon: BrainCircuit },
  { to: "/communications", label: "Communications", icon: Mail },
  { to: "/dispatch-hotline", label: "Emergency Hotline", icon: PhoneCall },
  { to: "/iot", label: "IoT Edge Nodes", icon: Server },
  { to: "/officer", label: "Officer Terminal", icon: Smartphone },
  { to: "/employees", label: "Employees", icon: UserCog },
  { to: "/audit-logs", label: "Audit Logs", icon: ShieldAlert },
  { to: "/settings", label: "Settings", icon: Settings2 },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { session, loading, user, role, roleDef, setSimulatedRole } = useAuth();
  const email = user?.email ?? null;
  const palette = useCommandPalette();
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);

  // Public pages render without the operations chrome or auth gate.
  if (pathname === "/" || pathname.startsWith("/lookup") || pathname.startsWith("/citizen") || pathname.startsWith("/portal")) return <>{children}</>;

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

  // Filter navigation items accessible to the active role
  const visibleNav = ALL_NAV.filter((item) => hasRoleAccess(role, item.to));

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      {/* Sidebar */}
      <aside className="sticky top-0 flex h-dvh w-20 shrink-0 flex-col items-center gap-8 border-r border-border bg-panel py-6">
        <Link
          to="/dashboard"
          className="grid size-10 place-items-center overflow-hidden rounded-xl shadow-lg shadow-primary/30"
          aria-label="Barangay Culiat, Quezon City Traffic Ops"
        >
          <img src="/favico2.png" alt="QC Logo" className="size-full object-contain" />
        </Link>

        <nav 
          className="flex w-full flex-1 flex-col items-center gap-2 overflow-y-auto overflow-x-hidden pb-4 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {visibleNav.map((item) => {
            const active = pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-label={item.label}
                className={cn(
                  "group relative grid size-10 place-items-center rounded-xl transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-subtle hover:bg-panel-elevated hover:text-foreground",
                )}
              >
                <Icon className="size-5" strokeWidth={1.75} />
                {active && (
                  <span className="absolute -left-3 h-6 w-0.5 rounded-full bg-primary shadow-glow" />
                )}
                <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md border border-border bg-panel-elevated px-2 py-1 text-xs font-medium opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col items-center gap-3">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/";
            }}
            className="grid size-10 place-items-center rounded-xl text-subtle transition-colors hover:bg-panel-elevated hover:text-danger"
            aria-label="Sign out"
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
        <h1 className="text-lg font-bold tracking-tight text-foreground">Violations Review</h1>
        <p className="text-xs text-subtle">
          Automated camera detections awaiting review and verification.
        </p>
      </div>
    );
  }
  if (pathname.startsWith("/citations")) {
    return (
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">Digital Citations</h1>
        <p className="text-xs text-subtle">
          Notices of Violation (NOV), payment tracking, and digital clearance records.
        </p>
      </div>
    );
  }
  if (pathname.startsWith("/cameras")) {
    return (
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">Camera Grid</h1>
        <p className="text-xs text-subtle">
          Real-time CCTV optical feeds and detection nodes across Barangay Culiat.
        </p>
      </div>
    );
  }
  if (pathname.startsWith("/map")) {
    return (
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">GIS Operations Map</h1>
        <p className="text-xs text-subtle">
          Live spatial monitoring of cameras, incidents, and enforcers on duty.
        </p>
      </div>
    );
  }
  if (pathname.startsWith("/vehicles")) {
    return (
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">Vehicle Registry</h1>
        <p className="text-xs text-subtle">
          LTO database integration, repeated offenders, and registration alarms.
        </p>
      </div>
    );
  }
  if (pathname.startsWith("/officers")) {
    return (
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">Personnel & Shifts</h1>
        <p className="text-xs text-subtle">
          Field traffic enforcers, active shift logs, and citation performance.
        </p>
      </div>
    );
  }
  if (pathname.startsWith("/dispatch")) {
    return (
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">Incident Dispatch</h1>
        <p className="text-xs text-subtle">
          Live incident queue, officer dispatching, and rapid response coordination.
        </p>
      </div>
    );
  }
  if (pathname.startsWith("/disputes")) {
    return (
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">Traffic Adjudication Board</h1>
        <p className="text-xs text-subtle">
          Citizen citation appeals, contest reviews, and formal resolution orders.
        </p>
      </div>
    );
  }
  if (pathname.startsWith("/finance")) {
    return (
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">Finance & Treasury</h1>
        <p className="text-xs text-subtle">
          Over-the-counter payments, cashier reconciliation, and revenue auditing.
        </p>
      </div>
    );
  }
  if (pathname.startsWith("/reports")) {
    return (
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">Executive Reports</h1>
        <p className="text-xs text-subtle">
          Audit-ready financial summaries, enforcement metrics, and CSV exports.
        </p>
      </div>
    );
  }
  if (pathname.startsWith("/settings")) {
    return (
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">System Settings</h1>
        <p className="text-xs text-subtle">
          Fine schedules, AI confidence thresholds, and system preferences.
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
