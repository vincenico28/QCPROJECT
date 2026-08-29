import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { QrCode, FilePlus2, Map as MapIcon, LogOut, Loader2, LayoutDashboard } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { SignInScreen } from "@/components/auth/sign-in-screen";
import { supabase } from "@/integrations/supabase/client";

import { SYSTEM_ROLES, hasRoleAccess, type SystemRole } from "@/lib/rbac";

const NAV = [
  { to: "/officer", label: "Terminal", icon: LayoutDashboard, exact: true },
  { to: "/officer/scan", label: "Scan", icon: QrCode, exact: false },
  { to: "/officer/issue", label: "Issue", icon: FilePlus2, exact: false },
  { to: "/officer/dispatches", label: "Dispatches", icon: MapIcon, exact: false },
];

export function OfficerShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { session, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return <SignInScreen />;

  const isAllowed = hasRoleAccess(role, pathname) || ["super_admin", "admin", "officer", "dispatcher"].includes(role);

  if (!isAllowed) {
    // Basic protection
    return (
      <div className="grid min-h-dvh place-items-center bg-background text-center px-6">
        <div className="max-w-md panel p-8 rounded-2xl border border-border">
          <h2 className="text-xl font-bold text-foreground">Unauthorized Access</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your current role (<span className="font-semibold text-primary">{role}</span>) does not have field officer privileges.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto rounded-lg bg-panel-elevated border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-panel"
            >
              Command Center
            </Link>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/";
              }}
              className="w-full sm:w-auto rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground pb-16 sm:pb-0 sm:pl-20">
      {/* Mobile Top Bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md sm:hidden">
        <div className="flex items-center gap-2">
          <img src="/favico2.png" alt="QC Logo" className="size-6 object-contain" />
          <span className="font-semibold tracking-tight">QC Field Ops</span>
        </div>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = "/";
          }}
          className="grid size-8 place-items-center rounded-full bg-panel-elevated text-subtle hover:text-danger"
          aria-label="Sign out"
        >
          <LogOut className="size-4" />
        </button>
      </header>

      {/* Desktop Sidebar (Optional fallback if viewed on desktop) */}
      <aside className="fixed inset-y-0 left-0 hidden w-20 flex-col items-center gap-8 border-r border-border bg-panel py-6 sm:flex">
        <div className="grid size-10 place-items-center overflow-hidden rounded-xl shadow-lg shadow-primary/30">
          <img src="/favico2.png" alt="QC Logo" className="size-full object-contain" />
        </div>
        <nav className="flex flex-col gap-2">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
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
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-3">
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
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex h-16 items-center justify-around border-t border-border bg-panel px-2 pb-safe sm:hidden">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1",
                active ? "text-primary" : "text-subtle",
              )}
            >
              <div className={cn("grid size-8 place-items-center rounded-full transition-colors", active && "bg-primary/15")}>
                <Icon className="size-5" strokeWidth={active ? 2 : 1.75} />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
