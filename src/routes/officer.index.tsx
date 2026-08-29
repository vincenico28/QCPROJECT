import { createFileRoute, Link } from "@tanstack/react-router";
import { QrCode, FileSignature, RadioReceiver, ShieldCheck, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useDispatches } from "@/lib/data/dispatch";

export const Route = createFileRoute("/officer/")({
  head: () => ({
    meta: [{ title: "Field Officer Terminal — QC Flow Guardian" }],
  }),
  component: OfficerTerminalHome,
});

function OfficerTerminalHome() {
  const { user } = useAuth();
  const { data: dispatches = [] } = useDispatches();
  const activeDispatchesCount = dispatches.filter(
    (d) => d.status === "queued" || d.status === "en_route" || d.status === "on_scene"
  ).length;
  
  return (
    <div className="flex h-screen flex-col bg-[#0b0c10] text-white">
      {/* Mobile App Header */}
      <header className="flex items-center justify-between border-b border-white/10 bg-[#12141a] p-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-full bg-blue-500/20 text-blue-400">
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Field Terminal</h1>
            <p className="text-xs text-muted-foreground">Officer {user?.email?.split('@')[0] || 'Badge 104'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            title="Return to Command Dashboard"
          >
            <LayoutDashboard className="size-4 text-blue-400" />
            <span className="hidden sm:inline">Command Center</span>
          </Link>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              toast.success("Terminal session ended");
              window.location.href = "/";
            }}
            className="grid size-10 place-items-center rounded-lg bg-red-500/10 text-red-500 transition-colors hover:bg-red-500/20"
            title="Exit Terminal"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </header>

      {/* Main Actions */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
         <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">Current Status</p>
            <h2 className="mt-1 text-2xl font-black text-white">ON PATROL</h2>
            <p className="text-sm text-muted-foreground mt-1">Sector: Commonwealth Ave</p>
         </div>

         <div className="grid grid-cols-2 gap-4">
            <Link 
              to="/officer/scan" 
              className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-[#12141a] p-6 text-center shadow-lg transition-colors hover:bg-white/5 active:scale-95"
            >
              <div className="grid size-14 place-items-center rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/20">
                <QrCode className="size-6" />
              </div>
              <div>
                <h3 className="font-bold text-white">Scan QR</h3>
                <p className="text-[10px] text-muted-foreground mt-1">Verify License / Apprehension</p>
              </div>
            </Link>

            <Link 
              to="/officer/issue" 
              className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-[#12141a] p-6 text-center shadow-lg transition-colors hover:bg-white/5 active:scale-95"
            >
              <div className="grid size-14 place-items-center rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/20">
                <FileSignature className="size-6" />
              </div>
              <div>
                <h3 className="font-bold text-white">Issue Ticket</h3>
                <p className="text-[10px] text-muted-foreground mt-1">Manual OVR Issuance</p>
              </div>
            </Link>
         </div>

         <Link 
            to="/officer/dispatches" 
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#12141a] p-4 shadow-lg transition-colors hover:bg-white/5"
         >
            <div className="flex items-center gap-4">
              <div className="grid size-12 place-items-center rounded-full bg-emerald-500/20 text-emerald-500">
                <RadioReceiver className="size-6" />
              </div>
              <div>
                <h3 className="font-bold text-white">Active Dispatches</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activeDispatchesCount} pending {activeDispatchesCount === 1 ? "task" : "tasks"} from HQ
                </p>
              </div>
            </div>
            <div className="flex size-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
              {activeDispatchesCount}
            </div>
         </Link>
      </main>
    </div>
  );
}
