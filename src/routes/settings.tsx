import { createFileRoute } from "@tanstack/react-router";
import { Settings2, Shield, BrainCircuit, Users, Save, BellRing } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [{ title: "System Settings — Culiat Traffic Ops" }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const handleSave = () => {
    toast.success("Settings saved securely.");
  };

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">System Settings</h1>
          <p className="text-sm text-muted-foreground">Configure global AI parameters, security policies, and notification rules.</p>
        </div>
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary/90"
        >
          <Save className="size-4" />
          Save Changes
        </button>
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

        {/* User Management */}
        <div className="panel flex flex-col gap-6 rounded-2xl border border-border/50 p-6 shadow-lg">
          <div className="flex items-center gap-3 border-b border-border/50 pb-4">
            <div className="grid size-10 place-items-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <Users className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Role Management</h2>
              <p className="text-xs text-muted-foreground">Control system access levels</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between rounded-lg border border-border bg-background/50 p-3">
              <div>
                <p className="font-medium text-white text-sm">Super Administrator</p>
                <p className="text-xs text-muted-foreground">Full system access (3 active)</p>
              </div>
              <button className="text-xs font-semibold text-primary hover:underline">Manage</button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-background/50 p-3">
              <div>
                <p className="font-medium text-white text-sm">Traffic Dispatcher</p>
                <p className="text-xs text-muted-foreground">Operations console access (8 active)</p>
              </div>
              <button className="text-xs font-semibold text-primary hover:underline">Manage</button>
            </div>
             <div className="flex items-center justify-between rounded-lg border border-border bg-background/50 p-3">
              <div>
                <p className="font-medium text-white text-sm">Field Officer</p>
                <p className="text-xs text-muted-foreground">Mobile app access only (45 active)</p>
              </div>
              <button className="text-xs font-semibold text-primary hover:underline">Manage</button>
            </div>
          </div>
        </div>
        
        {/* Rules & Fines */}
        <div className="panel flex flex-col gap-6 rounded-2xl border border-border/50 p-6 shadow-lg lg:col-span-2">
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
