import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Search,
  Loader2,
  ShieldAlert,
  Radio,
  Scale,
  Phone,
  Lock,
  Mail,
  Trash2,
  KeyRound,
  CheckCircle2,
  X,
} from "lucide-react";
import {
  useEmployees,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
  type Employee,
  type EmployeeRole,
  type EmployeeStatus,
} from "@/lib/data/employees";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";

export const Route = createFileRoute("/employees")({
  head: () => ({
    meta: [
      { title: "Employee Directory & Access Control · Culiat Traffic Ops" },
      {
        name: "description",
        content: "Admin-only employee provisioning, user access control, and personnel roster management.",
      },
    ],
  }),
  component: EmployeesPage,
});

const ROLE_TABS = ["all", "admin", "dispatcher", "officer", "adjudicator"] as const;
type RoleTab = (typeof ROLE_TABS)[number];

const ROLE_LABELS: Record<RoleTab, string> = {
  all: "All Roles",
  admin: "Admins",
  dispatcher: "Dispatchers",
  officer: "Field Officers",
  adjudicator: "Adjudicators",
};

function EmployeesPage() {
  const { role, user } = useAuth();
  const { data: employees = [], isLoading } = useEmployees();
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleTab>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<EmployeeRole>("officer");
  const [rank, setRank] = useState("Officer I");
  const [unit, setUnit] = useState("Traffic Enforcement");
  const [district, setDistrict] = useState("District 1 - Culiat Central");
  const [badgeNumber, setBadgeNumber] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (roleFilter !== "all" && emp.role !== roleFilter) return false;
      if (statusFilter !== "all" && emp.status !== statusFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        emp.full_name.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        emp.badge_number.toLowerCase().includes(q) ||
        emp.unit.toLowerCase().includes(q) ||
        emp.district.toLowerCase().includes(q)
      );
    });
  }, [employees, roleFilter, statusFilter, search]);

  const counts = useMemo(
    () => ({
      total: employees.length,
      admins: employees.filter((e) => e.role === "admin").length,
      dispatchers: employees.filter((e) => e.role === "dispatcher").length,
      officers: employees.filter((e) => e.role === "officer").length,
      adjudicators: employees.filter((e) => e.role === "adjudicator").length,
      active: employees.filter((e) => e.status === "active").length,
    }),
    [employees],
  );

  // Role Access Guard - ADMIN & SUPER ADMIN ONLY
  if (role !== "admin" && role !== "super_admin") {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
        <div className="grid size-16 place-items-center rounded-2xl border border-danger/30 bg-danger/10 text-danger shadow-xl">
          <ShieldAlert className="size-8" />
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
          Access Restricted: Admin Clearance Required
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          The Employees module and account registration system are restricted exclusively to authorized Operations Administrators.
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
        >
          Return to Command Dashboard
        </Link>
      </div>
    );
  }

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) {
      toast.error("Please fill in the required fields");
      return;
    }

    createEmployee.mutate(
      {
        full_name: fullName,
        email,
        password: password || "P@ssword123",
        role: selectedRole,
        rank,
        unit,
        district,
        badge_number: badgeNumber,
        contact_number: contactNumber,
      },
      {
        onSuccess: (newEmp) => {
          toast.success(`Account provisioned for ${newEmp.full_name} (${newEmp.role.toUpperCase()})`);
          setIsRegisterOpen(false);
          // Reset form
          setFullName("");
          setEmail("");
          setPassword("");
          setSelectedRole("officer");
          setRank("Officer I");
          setUnit("Traffic Enforcement");
          setDistrict("District 1 - Culiat Central");
          setBadgeNumber("");
          setContactNumber("");
        },
        onError: (err) => {
          toast.error(err.message || "Failed to create employee account");
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono-tab text-[10px] font-bold uppercase tracking-widest text-primary">
              Admin Exclusive
            </span>
            <span className="font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
              Operations Control
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="size-7 text-primary" />
            Personnel & Account Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Provision staff credentials, manage employee roles, and oversee departmental permissions.
          </p>
        </div>

        {/* Register Dialog Trigger */}
        <Dialog.Root open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
          <Dialog.Trigger asChild>
            <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all">
              <UserPlus className="size-4" />
              Register New Employee
            </button>
          </Dialog.Trigger>

          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-panel p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b border-border pb-4">
                <div>
                  <Dialog.Title className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <UserPlus className="size-5 text-primary" />
                    Register New Employee
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-muted-foreground">
                    Provision operational credentials and assign specific clearance roles for LGU personnel.
                  </Dialog.Description>
                </div>
                <Dialog.Close asChild>
                  <button className="rounded-lg p-1.5 text-subtle hover:bg-panel-elevated hover:text-foreground transition-colors">
                    <X className="size-5" />
                  </button>
                </Dialog.Close>
              </div>

              <form onSubmit={handleRegisterSubmit} className="mt-6 flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                      Full Name *
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Officer Juan Dela Cruz"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                      Official Email *
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="officer@quezoncity.gov.ph"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                      Initial Password
                    </span>
                    <input
                      type="password"
                      placeholder="Default: P@ssword123"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                      Clearance Role *
                    </span>
                    <select
                      value={selectedRole}
                      onChange={(e) => {
                        const r = e.target.value as EmployeeRole;
                        setSelectedRole(r);
                        if (r === "officer") {
                          setRank("Officer I");
                          setUnit("Traffic Enforcement");
                        } else if (r === "dispatcher") {
                          setRank("Dispatcher Specialist");
                          setUnit("Central 911 Dispatch");
                        } else if (r === "adjudicator") {
                          setRank("Legal Adjudicator");
                          setUnit("Appeals & Adjudication");
                        } else if (r === "admin") {
                          setRank("Operations Administrator");
                          setUnit("Executive Command");
                        }
                      }}
                      className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="officer">Field Officer (Scanner & Tickets)</option>
                      <option value="dispatcher">Dispatcher (911 & Deployments)</option>
                      <option value="adjudicator">Adjudicator (Dispute Review)</option>
                      <option value="admin">Administrator (Full Access)</option>
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                      Rank / Title
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. Sergeant / Officer I"
                      value={rank}
                      onChange={(e) => setRank(e.target.value)}
                      className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                      Department / Unit
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. Traffic Enforcement"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                      District / Sector
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. District 1 - Culiat Central"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                      Badge # / ID (Optional)
                    </span>
                    <input
                      type="text"
                      placeholder="Auto-generated if blank"
                      value={badgeNumber}
                      onChange={(e) => setBadgeNumber(e.target.value.toUpperCase())}
                      className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-1.5">
                  <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
                    Contact Phone Number
                  </span>
                  <input
                    type="tel"
                    placeholder="e.g. 0917-123-4567"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </label>

                <div className="mt-4 flex items-center justify-end gap-3 border-t border-border pt-4">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-panel-elevated hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    type="submit"
                    disabled={createEmployee.isPending}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 disabled:opacity-50 transition-all"
                  >
                    {createEmployee.isPending && <Loader2 className="size-4 animate-spin" />}
                    Complete Registration
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Staff & Accounts" value={counts.total} icon={Users} tone="primary" />
        <KpiCard label="Field Officers" value={counts.officers} icon={ShieldCheck} tone="success" sub="Field Terminal Access" />
        <KpiCard label="Dispatchers & Legal" value={counts.dispatchers + counts.adjudicators} icon={Radio} tone="warning" sub="911 & Dispute Queue" />
        <KpiCard label="Active Personnel" value={counts.active} icon={CheckCircle2} tone="success" sub={`${counts.admins} System Admins`} />
      </div>

      {/* Filters & Search Toolbar */}
      <div className="panel flex flex-col gap-4 rounded-2xl p-4 border border-border sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 overflow-x-auto">
          {ROLE_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setRoleFilter(tab)}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 font-mono-tab text-[11px] font-semibold uppercase tracking-widest transition-colors",
                roleFilter === tab
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-subtle hover:bg-panel-elevated hover:text-foreground border border-transparent",
              )}
            >
              {ROLE_LABELS[tab]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="on_leave">On Leave</option>
            <option value="suspended">Suspended</option>
          </select>

          <label className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 size-4 text-subtle" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, badge, unit…"
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-64"
            />
          </label>
        </div>
      </div>

      {/* Employee Roster Table */}
      <div className="panel overflow-hidden rounded-2xl border border-border bg-panel shadow-sm">
        {isLoading ? (
          <div className="grid h-64 place-items-center text-sm text-subtle">
            <div className="flex items-center gap-2">
              <Loader2 className="size-5 animate-spin text-primary" />
              Loading employee roster...
            </div>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="grid h-64 place-items-center text-sm text-subtle text-center p-6">
            <Users className="size-8 opacity-20 mb-2" />
            No employee records match the search and filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-panel-elevated/50 font-mono-tab text-[10px] uppercase tracking-widest text-subtle">
                  <th className="px-6 py-4 font-medium">Employee Name & Email</th>
                  <th className="px-6 py-4 font-medium">Badge / ID</th>
                  <th className="px-6 py-4 font-medium">Role & Clearance</th>
                  <th className="px-6 py-4 font-medium">Unit & District</th>
                  <th className="px-6 py-4 font-medium">Contact</th>
                  <th className="px-6 py-4 font-medium">Account Status</th>
                  <th className="px-6 py-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredEmployees.map((emp) => (
                  <EmployeeRow
                    key={emp.id}
                    employee={emp}
                    onUpdateRole={(newRole) => {
                      updateEmployee.mutate(
                        { id: emp.id, role: newRole },
                        { onSuccess: () => toast.success(`Updated ${emp.full_name}'s role to ${newRole}`) },
                      );
                    }}
                    onUpdateStatus={(newStatus) => {
                      updateEmployee.mutate(
                        { id: emp.id, status: newStatus },
                        { onSuccess: () => toast.success(`Updated ${emp.full_name}'s status to ${newStatus}`) },
                      );
                    }}
                    onDelete={() => {
                      if (confirm(`Are you sure you want to deactivate and remove ${emp.full_name}?`)) {
                        deleteEmployee.mutate(emp.id, {
                          onSuccess: () => toast.success(`Removed ${emp.full_name}`),
                        });
                      }
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function EmployeeRow({
  employee,
  onUpdateRole,
  onUpdateStatus,
  onDelete,
}: {
  employee: Employee;
  onUpdateRole: (role: EmployeeRole) => void;
  onUpdateStatus: (status: EmployeeStatus) => void;
  onDelete: () => void;
}) {
  const roleStyles = {
    admin: "border-primary/40 bg-primary/10 text-primary",
    dispatcher: "border-warning/40 bg-warning/10 text-warning",
    officer: "border-success/40 bg-success/10 text-success",
    adjudicator: "border-purple-500/40 bg-purple-500/10 text-purple-400",
  };

  const statusStyles = {
    active: "bg-success/10 text-success border-success/30",
    on_leave: "bg-warning/10 text-warning border-warning/30",
    suspended: "bg-danger/10 text-danger border-danger/30",
  };

  const initials = employee.full_name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <tr className="transition-colors hover:bg-panel-elevated/40">
      {/* Name & Email */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-panel-elevated font-mono-tab text-xs font-bold text-foreground ring-1 ring-border">
            {initials}
            {employee.status === "active" && (
              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-panel bg-success" />
            )}
          </div>
          <div>
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              {employee.full_name}
              {employee.role === "admin" && <ShieldCheck className="size-3.5 text-primary" />}
            </p>
            <p className="font-mono-tab text-xs text-muted-foreground">{employee.email}</p>
          </div>
        </div>
      </td>

      {/* Badge / ID */}
      <td className="px-6 py-4 font-mono-tab text-xs font-bold text-foreground">
        {employee.badge_number}
      </td>

      {/* Role */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex rounded-md border px-2.5 py-1 font-mono-tab text-[10px] font-bold uppercase tracking-wider",
              roleStyles[employee.role],
            )}
          >
            {employee.role}
          </span>
          <select
            value={employee.role}
            onChange={(e) => onUpdateRole(e.target.value as EmployeeRole)}
            className="rounded border border-border bg-background px-2 py-1 text-[11px] font-medium text-subtle hover:text-foreground focus:outline-none"
            title="Change Role"
          >
            <option value="officer">Officer</option>
            <option value="dispatcher">Dispatcher</option>
            <option value="adjudicator">Adjudicator</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </td>

      {/* Unit & District */}
      <td className="px-6 py-4">
        <p className="text-xs font-medium text-foreground">{employee.unit}</p>
        <p className="font-mono-tab text-[10px] text-muted-foreground">{employee.district}</p>
      </td>

      {/* Contact */}
      <td className="px-6 py-4">
        {employee.contact_number ? (
          <span className="flex items-center gap-1.5 font-mono-tab text-xs text-muted-foreground">
            <Phone className="size-3 text-subtle" />
            {employee.contact_number}
          </span>
        ) : (
          <span className="text-subtle text-xs">—</span>
        )}
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <select
          value={employee.status}
          onChange={(e) => onUpdateStatus(e.target.value as EmployeeStatus)}
          className={cn(
            "rounded-md border px-2.5 py-1 font-mono-tab text-[10px] font-bold uppercase tracking-wider focus:outline-none",
            statusStyles[employee.status],
          )}
        >
          <option value="active">Active</option>
          <option value="on_leave">On Leave</option>
          <option value="suspended">Suspended</option>
        </select>
      </td>

      {/* Actions */}
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => toast.success(`Password reset link dispatched to ${employee.email}`)}
            className="rounded-lg border border-border p-2 text-subtle hover:bg-panel-elevated hover:text-foreground transition-colors"
            title="Send Password Reset Link"
          >
            <KeyRound className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg border border-border p-2 text-subtle hover:bg-danger/10 hover:text-danger hover:border-danger/30 transition-colors"
            title="Deactivate Account"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  sub,
}: {
  label: string;
  value: string | number;
  icon: any;
  tone?: "primary" | "success" | "warning";
  sub?: string;
}) {
  const toneStyles = {
    primary: "text-primary bg-primary/10",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
  };

  return (
    <div className="panel rounded-2xl border border-border p-5 bg-panel shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <span className="font-mono-tab text-[10px] font-semibold uppercase tracking-widest text-subtle">
            {label}
          </span>
          <p className="mt-2 font-mono-tab text-3xl font-bold text-foreground">{value}</p>
          {sub && <p className="mt-1 font-mono-tab text-[11px] text-muted-foreground">{sub}</p>}
        </div>
        <div className={cn("grid size-10 place-items-center rounded-xl", toneStyles[tone])}>
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}
