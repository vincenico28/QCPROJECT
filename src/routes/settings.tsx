import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Settings2, Shield, BrainCircuit, Users, Save, CheckCircle2, XCircle, Lock, ShieldCheck, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { SYSTEM_ROLES, type SystemRole } from "@/lib/rbac";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [{ title: "System Settings & RBAC — Culiat Traffic Ops" }],
  }),
  component: SettingsPage,
});

const MODULES = [
  { name: "Command Operations Dashboard", key: "dashboard", super_admin: true, admin: true, dispatcher: true, officer: false, finance: true, adjudicator: true, citizen: false },
  { name: "AI Violation Review & Auto-Validation", key: "violations", super_admin: true, admin: true, dispatcher: true, officer: false, finance: false, adjudicator: true, citizen: false },
  { name: "Notice of Violation Ledger & Citations", key: "citations", super_admin: true, admin: true, dispatcher: true, officer: false, finance: true, adjudicator: true, citizen: false },
  { name: "Live IoT Camera Grid & Health Feeds", key: "cameras", super_admin: true, admin: true, dispatcher: true, officer: false, finance: false, adjudicator: false, citizen: false },
  { name: "GIS Spatial Incident Mapping", key: "map", super_admin: true, admin: true, dispatcher: true, officer: false, finance: false, adjudicator: false, citizen: false },
  { name: "Motorist Vehicle Registry & LTO Alarms", key: "vehicles", super_admin: true, admin: true, dispatcher: true, officer: false, finance: true, adjudicator: true, citizen: false },
  { name: "On-Street Field Enforcer Terminal", key: "officer", super_admin: true, admin: true, dispatcher: true, officer: true, finance: false, adjudicator: false, citizen: false },
  { name: "Rapid Unit Dispatch & 911 Hotline", key: "dispatch", super_admin: true, admin: true, dispatcher: true, officer: true, finance: false, adjudicator: false, citizen: false },
  { name: "Traffic Adjudication Board (TAB)", key: "disputes", super_admin: true, admin: true, dispatcher: false, officer: false, finance: false, adjudicator: true, citizen: false },
  { name: "Finance, Treasury & Cashier Drawers", key: "finance", super_admin: true, admin: true, dispatcher: false, officer: false, finance: true, adjudicator: false, citizen: false },
  { name: "YOLOv11 AI Training & Fine-Tuning", key: "ai_training", super_admin: true, admin: true, dispatcher: false, officer: false, finance: false, adjudicator: false, citizen: false },
  { name: "Citizen Motorist Self-Service Portal", key: "citizen", super_admin: true, admin: true, dispatcher: false, officer: false, finance: false, adjudicator: false, citizen: true },
  { name: "Security Audit Logs & Ledger", key: "audit", super_admin: true, admin: true, dispatcher: false, officer: false, finance: false, adjudicator: false, citizen: false },
  { name: "System Settings & RBAC Configuration", key: "settings", super_admin: true, admin: true, dispatcher: false, officer: false, finance: false, adjudicator: false, citizen: false },
];

function SettingsPage() {
  const { role, setSimulatedRole } = useAuth();
  const [selectedRoleForDetail, setSelectedRoleForDetail] = useState<SystemRole>("admin");

  const handleSave = async () => {
    try {
      await supabase.from("audit_logs").insert({
        actor_name: "Chief Security Officer",
        actor_role: role,
        action: "SYSTEM_SETTINGS_UPDATED",
        target_resource: "RBAC & Fine Penalty Matrix",
        details: "Updated AI confidence thresholds and discount penalty rules.",
      });
    } catch (err) {
      console.warn(err);
    }
    toast.success("Security policies & RBAC matrix updated successfully.");
  };

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Settings2 className="size-6 text-primary" />
            System Settings & Security Matrix
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure Role-Based Access Control (RBAC), AI threshold calibrations, and fine penalty schedules.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:scale-105"
        >
          <Save className="size-4" />
          Save Configurations
        </button>
      </div>

      {/* Role-Based Access Control (RBAC) Management Matrix */}
      <div className="panel flex flex-col gap-6 rounded-2xl border border-border/60 p-6 shadow-xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Role-Based Access Control (RBAC) Clearance Matrix</h2>
              <p className="text-xs text-muted-foreground">Strict permission boundary definitions for Command and Citizen portals</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono-tab text-[10px] uppercase tracking-widest text-muted-foreground">
              Current Active Clearance:
            </span>
            <span className={cn("rounded-lg border px-2.5 py-1 text-xs font-bold", SYSTEM_ROLES[role].badgeColor)}>
              {SYSTEM_ROLES[role].label}
            </span>
          </div>
        </div>

        {/* Roles Quick Selection Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {(Object.keys(SYSTEM_ROLES) as SystemRole[]).map((rKey) => {
            const r = SYSTEM_ROLES[rKey];
            const isSelected = selectedRoleForDetail === rKey;
            return (
              <button
                key={rKey}
                onClick={() => setSelectedRoleForDetail(rKey)}
                className={cn(
                  "flex flex-col p-3 rounded-xl border text-left transition-all",
                  isSelected
                    ? "bg-panel-elevated border-primary shadow-md"
                    : "border-border/60 hover:bg-panel-elevated/40"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn("size-2 rounded-full", 
                    rKey === "super_admin" ? "bg-purple-500" :
                    rKey === "admin" ? "bg-blue-500" :
                    rKey === "dispatcher" ? "bg-emerald-500" :
                    rKey === "officer" ? "bg-amber-500" :
                    rKey === "finance" ? "bg-cyan-500" :
                    rKey === "adjudicator" ? "bg-indigo-500" : "bg-neutral-400"
                  )} />
                  <span className="font-mono-tab text-[9px] uppercase tracking-widest text-subtle">
                    {r.portal}
                  </span>
                </div>
                <span className="font-bold text-xs text-foreground mt-2 line-clamp-1">
                  {r.label}
                </span>
                <span className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                  {r.department}
                </span>
              </button>
            );
          })}
        </div>

        {/* Interactive Clearance Table */}
        <div className="overflow-hidden rounded-xl border border-border/60 bg-black/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-white">
              <thead className="bg-panel-elevated text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">System Module / Portal View</th>
                  <th className="px-3 py-3 text-center">Super Admin</th>
                  <th className="px-3 py-3 text-center">Admin</th>
                  <th className="px-3 py-3 text-center">Dispatcher</th>
                  <th className="px-3 py-3 text-center">Enforcer</th>
                  <th className="px-3 py-3 text-center">Finance</th>
                  <th className="px-3 py-3 text-center">Adjudicator</th>
                  <th className="px-3 py-3 text-center">Citizen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {MODULES.map((m) => (
                  <tr key={m.key} className="transition-colors hover:bg-white/5">
                    <td className="px-5 py-3 font-medium text-foreground flex items-center gap-2">
                      <Lock className="size-3 text-muted-foreground" />
                      {m.name}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {m.super_admin ? <CheckCircle2 className="size-4 text-emerald-400 mx-auto" /> : <XCircle className="size-4 text-neutral-600 mx-auto" />}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {m.admin ? <CheckCircle2 className="size-4 text-emerald-400 mx-auto" /> : <XCircle className="size-4 text-neutral-600 mx-auto" />}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {m.dispatcher ? <CheckCircle2 className="size-4 text-emerald-400 mx-auto" /> : <XCircle className="size-4 text-neutral-600 mx-auto" />}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {m.officer ? <CheckCircle2 className="size-4 text-emerald-400 mx-auto" /> : <XCircle className="size-4 text-neutral-600 mx-auto" />}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {m.finance ? <CheckCircle2 className="size-4 text-emerald-400 mx-auto" /> : <XCircle className="size-4 text-neutral-600 mx-auto" />}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {m.adjudicator ? <CheckCircle2 className="size-4 text-emerald-400 mx-auto" /> : <XCircle className="size-4 text-neutral-600 mx-auto" />}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {m.citizen ? <CheckCircle2 className="size-4 text-emerald-400 mx-auto" /> : <XCircle className="size-4 text-neutral-600 mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Role Summary Callout */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <UserCheck className="size-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-white text-sm">
                Clearance Details: {SYSTEM_ROLES[selectedRoleForDetail].label}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
                {SYSTEM_ROLES[selectedRoleForDetail].description}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSimulatedRole(selectedRoleForDetail);
              toast.success(`Active clearance switched to: ${SYSTEM_ROLES[selectedRoleForDetail].label}`);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 px-3 py-1.5 text-xs font-bold transition-colors shrink-0"
          >
            Simulate This Role
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* AI Configuration */}
        <div className="panel flex flex-col gap-6 rounded-2xl border border-border/50 p-6 shadow-lg">
          <div className="flex items-center gap-3 border-b border-border/50 pb-4">
            <div className="grid size-10 place-items-center rounded-lg bg-blue-500/10 text-blue-500">
              <BrainCircuit className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold text-white">AI Detection Engine</h2>
              <p className="text-xs text-muted-foreground">Configure YOLOv11 confidence thresholds</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <label className="text-white">Auto-Ticketing Threshold</label>
                <span className="text-primary font-mono-tab">85%</span>
              </div>
              <input type="range" min="50" max="99" defaultValue="85" className="w-full accent-primary" />
              <p className="text-xs text-muted-foreground">Detections above this confidence score automatically generate a pending citation.</p>
            </div>
            
            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-sm font-medium">
                <label className="text-white">Manual Review Threshold</label>
                <span className="text-orange-500 font-mono-tab">60%</span>
              </div>
              <input type="range" min="30" max="84" defaultValue="60" className="w-full accent-orange-500" />
              <p className="text-xs text-muted-foreground">Detections within this range are sent to Dispatchers for manual verification.</p>
            </div>
          </div>
        </div>

        {/* Rules & Fines */}
        <div className="panel flex flex-col gap-6 rounded-2xl border border-border/50 p-6 shadow-lg">
          <div className="flex items-center gap-3 border-b border-border/50 pb-4">
            <div className="grid size-10 place-items-center rounded-lg bg-yellow-500/10 text-yellow-500">
              <Shield className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Traffic Rules & Penalties</h2>
              <p className="text-xs text-muted-foreground">Configure standard fines and discount windows</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Early Settlement Discount</label>
              <div className="relative">
                <input type="number" defaultValue="20" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-white outline-none focus:border-primary/50" />
                <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Discount applied if paid within 7 days.</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Late Penalty Rate</label>
              <div className="relative">
                <input type="number" defaultValue="5" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-white outline-none focus:border-primary/50" />
                <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Applied monthly after 30 days unpaid.</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Appeal Window</label>
              <div className="relative">
                <input type="number" defaultValue="15" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-white outline-none focus:border-primary/50" />
                <span className="absolute right-3 top-2.5 text-muted-foreground">days</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Time limit to contest a citation.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
