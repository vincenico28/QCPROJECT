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
  Target,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { SignInScreen } from "@/components/auth/sign-in-screen";
import { supabase } from "@/integrations/supabase/client";
import { DispatchDialog } from "@/components/dispatch/dispatch-dialog";
import { NotificationsMenu } from "@/components/layout/notifications-menu";
import { CommandPalette, useCommandPalette } from "@/components/layout/command-palette";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
};

const NAV: NavItem[] = [
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
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/analytics/heatmaps", label: "AI Heatmaps", icon: Flame },
  { to: "/ai-training", label: "AI Training", icon: BrainCircuit },
  { to: "/communications", label: "Communications", icon: Mail },
  { to: "/dispatch-hotline", label: "Emergency Hotline", icon: PhoneCall },
  { to: "/iot", label: "IoT Edge Nodes", icon: Server },
  { to: "/officer", label: "Officer Terminal", icon: Smartphone },
  { to: "/audit-logs", label: "Audit Logs", icon: ShieldAlert },
  { to: "/settings", label: "Settings", icon: Settings2 },
  { to: "/finance-analytics", label: "Executive Analytics", icon: TrendingUp },
  { to: "/sla-performance", label: "System SLA", icon: Target },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { session, loading, user, role } = useAuth();
  const email = user?.email ?? null;
  const palette = useCommandPalette();

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
          {(role === "admin" ? [...NAV, { to: "/employees", label: "Employees", icon: UserCog }] : NAV).map((item) => {
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
              role === "admin" ? "ring-primary/60 shadow-[0_0_10px_var(--color-primary)]/20" :
              role === "dispatcher" ? "ring-warning/60 shadow-[0_0_10px_var(--color-warning)]/20" :
              role === "officer" ? "ring-success/60 shadow-[0_0_10px_var(--color-success)]/20" : "ring-border"
            )}
            title={`${email ?? "Signed in"} (${role.toUpperCase()})`}
          >
            {(email?.[0] ?? "Q").toUpperCase()}
            <span
              className={cn(
                "absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-panel",
                role === "admin" ? "bg-primary" :
                role === "dispatcher" ? "bg-warning" :
                role === "officer" ? "bg-success" : "bg-subtle"
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
              className="relative hidden lg:flex w-72 items-center rounded-lg border border-border bg-panel py-2 pl-9 pr-14 text-left text-sm text-subtle transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <Search className="pointer-events-none absolute left-3 size-4 text-subtle" />
              Search plate, officer, location…
              <span className="pointer-events-none absolute right-2 flex items-center gap-1 rounded-md border border-border bg-panel-elevated px-1.5 py-0.5 font-mono-tab text-[10px] text-subtle">
                <Command className="size-3" /> K
              </span>
            </button>

            {/* Operator Role Tag */}
            <div className="hidden sm:flex items-center gap-2.5 rounded-lg border border-border bg-panel px-3 py-1.5 shadow-sm">
              <span
                className={cn(
                  "size-2 rounded-full",
                  role === "admin"
                    ? "bg-primary shadow-[0_0_8px_var(--color-primary)]"
                    : role === "dispatcher"
                    ? "bg-warning shadow-[0_0_8px_var(--color-warning)]"
                    : role === "officer"
                    ? "bg-success shadow-[0_0_8px_var(--color-success)]"
                    : "bg-subtle"
                )}
              />
              <div className="flex flex-col text-left">
                <span className="font-mono-tab text-[9px] uppercase tracking-widest text-subtle leading-none">
                  Account Role
                </span>
                <span className="font-mono-tab text-xs font-bold text-foreground leading-tight">
                  {role === "admin"
                    ? "Administrator"
                    : role === "dispatcher"
                    ? "Dispatcher"
                    : role === "officer"
                    ? "Field Officer"
                    : "Citizen"}
                </span>
              </div>
            </div>

            <div className="hidden md:flex flex-col items-end">
              <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                System
              </span>
              <span className="flex items-center gap-1.5 font-mono-tab text-[11px] font-medium text-success">
                <span className="size-1.5 animate-pulse rounded-full bg-success" />
                OPERATIONAL
              </span>
            </div>

            <NotificationsMenu />

            <DispatchDialog
              trigger={
                <button className="hidden sm:inline-flex items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90">
                  Dispatch Officer
                </button>
              }
            />
          </div>
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <CommandPalette open={palette.open} onOpenChange={palette.setOpen} />
    </div>
  );
}

function PageHeading({ pathname }: { pathname: string }) {
  const match = NAV.find((n) => pathname.startsWith(n.to));
  const title =
    match?.to === "/dashboard"
      ? "Traffic Operations Command"
      : (match?.label ?? "Traffic Operations Command");
  return (
    <div className="min-w-0">
      <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">{title}</h1>
      <p className="font-mono-tab text-[11px] uppercase tracking-widest text-subtle">
        Sector · Barangay Culiat, Quezon City Central District
      </p>
    </div>
  );
}
