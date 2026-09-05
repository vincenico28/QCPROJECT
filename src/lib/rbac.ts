export type SystemRole = 
  | "super_admin" 
  | "admin" 
  | "dispatcher" 
  | "officer" 
  | "finance" 
  | "adjudicator" 
  | "citizen";

export type RoleDefinition = {
  key: SystemRole;
  label: string;
  department: string;
  badgeColor: string;
  description: string;
  portal: "command" | "citizen" | "field";
};

export const SYSTEM_ROLES: Record<SystemRole, RoleDefinition> = {
  super_admin: {
    key: "super_admin",
    label: "Super Administrator",
    department: "Executive Traffic Command",
    badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    description: "Full unconstrained administrative access across all LGU operations, security logs, settings, and database management.",
    portal: "command",
  },
  admin: {
    key: "admin",
    label: "Command Center Admin",
    department: "Barangay Culiat Traffic Ops",
    badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    description: "Full oversight of violations, citations, cameras, GIS mapping, dispatches, and reports.",
    portal: "command",
  },
  dispatcher: {
    key: "dispatcher",
    label: "Rapid Incident Dispatcher",
    department: "QC 911 / Emergency Dispatch",
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    description: "Real-time CCTV monitoring, road incident escalation, unit dispatching, and field communication.",
    portal: "command",
  },
  officer: {
    key: "officer",
    label: "Field Traffic Enforcer",
    department: "Culiat On-Street Patrol Unit",
    badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    description: "On-street mobile terminal access, QR ticket scanning, digital citation issuance, and field incident receipt.",
    portal: "field",
  },
  finance: {
    key: "finance",
    label: "Treasury & Finance Cashier",
    department: "QC Treasury / Revenue Dept",
    badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    description: "Over-the-counter and digital payment verification, refund processing, and daily cash drawer reconciliation.",
    portal: "command",
  },
  adjudicator: {
    key: "adjudicator",
    label: "TAB Hearing Adjudicator",
    department: "Traffic Adjudication Board",
    badgeColor: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    description: "Reviews citizen NOV appeals, evidentiary photos/videos, and issues binding dismissal or affirmation orders.",
    portal: "command",
  },
  citizen: {
    key: "citizen",
    label: "Registered Motorist",
    department: "Public Citizen Portal",
    badgeColor: "bg-neutral-500/20 text-neutral-300 border-neutral-500/30",
    description: "Self-service plate verification, citation settlements, electronic receipts, dispute filings, and vehicle garage.",
    portal: "citizen",
  },
};

/**
 * Route access permissions mapping
 */
export const ROUTE_PERMISSIONS: Record<string, SystemRole[]> = {
  // Executive & Admin Only
  "/settings": ["super_admin", "admin"],
  "/audit-logs": ["super_admin", "admin"],
  "/employees": ["super_admin", "admin"],
  "/ai-training": ["super_admin", "admin"],
  "/developer": ["super_admin"],

  // Finance & Treasury
  "/finance": ["super_admin", "admin", "finance"],
  "/finance-analytics": ["super_admin", "admin", "finance"],

  // Traffic Adjudication Board
  "/disputes": ["super_admin", "admin", "adjudicator"],

  // Field Officer Portal
  "/officer": ["super_admin", "admin", "officer", "dispatcher"],
  "/officer/issue": ["super_admin", "admin", "officer"],
  "/officer/scan": ["super_admin", "admin", "officer"],
  "/officer/dispatches": ["super_admin", "admin", "officer", "dispatcher"],

  // Dispatch & Hotline
  "/dispatch": ["super_admin", "admin", "dispatcher"],
  "/dispatch-hotline": ["super_admin", "admin", "dispatcher"],

  // Command Operations (Shared)
  "/dashboard": ["super_admin", "admin", "dispatcher", "finance", "adjudicator"],
  "/violations": ["super_admin", "admin", "dispatcher", "adjudicator"],
  "/citations": ["super_admin", "admin", "finance", "adjudicator", "dispatcher"],
  "/cameras": ["super_admin", "admin", "dispatcher"],
  "/map": ["super_admin", "admin", "dispatcher"],
  "/vehicles": ["super_admin", "admin", "dispatcher", "finance", "adjudicator"],
  "/officers": ["super_admin", "admin", "dispatcher"],
  "/transport": ["super_admin", "admin", "dispatcher"],
  "/reports": ["super_admin", "admin", "finance", "adjudicator"],
  "/analytics": ["super_admin", "admin", "dispatcher", "finance"],
  "/analytics/heatmaps": ["super_admin", "admin", "dispatcher"],
  "/communications": ["super_admin", "admin", "dispatcher", "adjudicator"],
  "/iot": ["super_admin", "admin", "dispatcher"],
  "/infrastructure": ["super_admin", "admin", "dispatcher"],
  "/automation": ["super_admin", "admin", "dispatcher"],
  "/advisories": ["super_admin", "admin", "dispatcher"],

  // Public / Citizen Portal
  "/citizen": ["super_admin", "admin", "citizen"],
  "/lookup": ["super_admin", "admin", "citizen", "officer", "dispatcher", "finance", "adjudicator"],
  "/portal/pay": ["super_admin", "admin", "citizen", "finance"],
  "/portal/receipt": ["super_admin", "admin", "citizen", "finance"],
};

/**
 * Checks if a given role has clearance to access a specific route
 */
export function hasRoleAccess(role: SystemRole, pathname: string): boolean {
  // Super admin always has access to everything
  if (role === "super_admin") return true;

  // Exact route match
  if (ROUTE_PERMISSIONS[pathname]) {
    return ROUTE_PERMISSIONS[pathname].includes(role);
  }

  // Prefix match (e.g. /cameras/CAM-042 or /vehicles/NDB-8921)
  const matchedKey = Object.keys(ROUTE_PERMISSIONS).find(
    (key) => pathname === key || pathname.startsWith(`${key}/`)
  );

  if (matchedKey) {
    return ROUTE_PERMISSIONS[matchedKey].includes(role);
  }

  // Default allow if unspecified
  return true;
}
