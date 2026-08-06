import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Loader2, Search, UserCog } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { listSystemUsers, assignUserRole, type SystemUser } from "@/lib/admin.functions";
import { cn } from "@/lib/utils";
import { getRoleFromUser } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const role = getRoleFromUser(session?.user ?? null);
    
    // Quick frontend check (backend will do the real verification anyway)
    if (role !== "admin") {
      throw redirect({
        to: "/",
        search: { redirect: "/admin" },
      });
    }
    
    return { token: session?.access_token };
  },
  component: AdminUserManagement,
});

function AdminUserManagement() {
  const { token } = Route.useRouteContext();
  const qc = useQueryClient();
  const runList = useServerFn(listSystemUsers);
  const runAssign = useServerFn(assignUserRole);
  const [search, setSearch] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin_users"],
    queryFn: () => runList({ data: { token: token! } }),
    enabled: !!token,
  });

  const assignRole = useMutation({
    mutationFn: (input: { targetUserId: string; role: "admin" | "dispatcher" | "officer" | "citizen" }) =>
      runAssign({ data: { token: token!, targetUserId: input.targetUserId, role: input.role } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_users"] });
      toast.success("User role updated successfully");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to assign role");
    },
  });

  const filtered = users.filter((u) => u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <UserCog className="size-6 text-primary" />
            User Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage system access and grant operational roles to personnel.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-subtle" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email..."
            className="w-full rounded-xl border border-border bg-panel py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </header>

      <div className="rounded-2xl border border-border bg-panel overflow-hidden">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center gap-2 text-subtle">
            <Loader2 className="size-5 animate-spin" />
            Loading accounts...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-panel-elevated/50">
                <tr>
                  <th className="px-6 py-4 font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                    Email Address
                  </th>
                  <th className="px-6 py-4 font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                    User ID
                  </th>
                  <th className="px-6 py-4 font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                    Current Role
                  </th>
                  <th className="px-6 py-4 text-right font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((user) => (
                  <UserRow key={user.id} user={user} assignRole={assignRole} />
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function UserRow({ user, assignRole }: { user: SystemUser; assignRole: any }) {
  const currentRole = user.role || "citizen";
  const ROLES = ["admin", "dispatcher", "officer", "citizen"] as const;

  const roleStyles = {
    admin: "border-primary/30 bg-primary/10 text-primary",
    dispatcher: "border-warning/30 bg-warning/10 text-warning",
    officer: "border-success/30 bg-success/10 text-success",
    citizen: "border-border bg-panel-elevated text-subtle",
  };

  return (
    <tr className="transition-colors hover:bg-panel-elevated/20">
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 font-medium text-foreground">
          {user.role === "admin" && <ShieldCheck className="size-4 text-primary" />}
          {user.email}
        </div>
        <p className="mt-0.5 text-xs text-subtle">
          Joined {new Date(user.created_at).toLocaleDateString()}
        </p>
      </td>
      <td className="px-6 py-4">
        <code className="rounded bg-panel-elevated px-2 py-1 font-mono-tab text-[10px] text-muted-foreground">
          {user.id.split("-")[0]}...
        </code>
      </td>
      <td className="px-6 py-4">
        <span
          className={cn(
            "inline-flex rounded-full border px-2.5 py-1 font-mono-tab text-[10px] font-bold uppercase tracking-widest",
            roleStyles[currentRole as keyof typeof roleStyles]
          )}
        >
          {currentRole}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <select
          disabled={assignRole.isPending}
          value={currentRole}
          onChange={(e) => {
            const role = e.target.value;
            assignRole.mutate({ targetUserId: user.id, role });
          }}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-panel-elevated focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              Make {r}
            </option>
          ))}
        </select>
      </td>
    </tr>
  );
}
