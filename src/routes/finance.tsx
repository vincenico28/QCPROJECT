import { createFileRoute } from "@tanstack/react-router";
import { useFinanceQueue } from "@/lib/data/finance";
import { formatPeso } from "@/lib/data/traffic";
import { Loader2, DollarSign, ArrowRightLeft, Landmark, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/finance")({
  head: () => ({
    meta: [{ title: "Finance & Cashier — Culiat Traffic Ops" }],
  }),
  component: FinanceDashboard,
});

function FinanceDashboard() {
  const { data, isLoading } = useFinanceQueue();

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Finance & Cashier</h1>
          <p className="text-sm text-muted-foreground">Manage daily cash drawer, verify payments, and process refunds.</p>
        </div>
      </div>

      {isLoading || !data ? (
        <div className="grid h-64 place-items-center">
           <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
             <div className="panel flex flex-col justify-center rounded-2xl border border-border bg-panel p-6 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-full bg-emerald-500/10 text-emerald-500">
                    <Landmark className="size-5" />
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground">Verified Today</p>
                </div>
                <p className="mt-4 font-mono-tab text-3xl font-bold text-white">
                  {formatPeso(data.dailyDrawer.totalVerified)}
                </p>
             </div>
             
              <div className="panel flex flex-col justify-center rounded-2xl border border-border bg-panel p-6 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-full bg-yellow-500/10 text-yellow-500">
                    <Clock className="size-5" />
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground">Pending Verification</p>
                </div>
                <p className="mt-4 font-mono-tab text-3xl font-bold text-white">
                  {formatPeso(data.dailyDrawer.pendingAmount)}
                </p>
             </div>
             
              <div className="panel flex flex-col justify-center rounded-2xl border border-border bg-panel p-6 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-full bg-orange-500/10 text-orange-500">
                    <ArrowRightLeft className="size-5" />
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground">Pending Refunds</p>
                </div>
                <p className="mt-4 font-mono-tab text-3xl font-bold text-white">
                  {formatPeso(data.dailyDrawer.refundAmount)}
                </p>
             </div>
          </div>
          
          <div className="grid gap-6 lg:grid-cols-2 mt-2">
             <div className="panel flex flex-col gap-4 rounded-2xl border border-border bg-panel p-6 shadow-lg h-[500px] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                  <h2 className="font-semibold text-white flex items-center gap-2">
                     <DollarSign className="size-5 text-emerald-500" />
                     Payment Verification Queue
                  </h2>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-500">
                    {data.pendingPayments.length} Pending
                  </span>
                </div>
                
                <div className="flex flex-col gap-3">
                   {data.pendingPayments.map(p => (
                      <div key={p.id} className="flex flex-col gap-3 rounded-lg border border-border bg-background/50 p-4">
                         <div className="flex items-start justify-between">
                            <div>
                               <p className="font-bold text-white">{p.citationId}</p>
                               <p className="text-xs text-muted-foreground mt-0.5">Plate: <span className="font-mono-tab">{p.plateNumber}</span> • {p.method}</p>
                            </div>
                            <span className="font-mono-tab font-bold text-emerald-400">{formatPeso(p.amount)}</span>
                         </div>
                         <div className="flex gap-2">
                            <button className="flex-1 rounded border border-emerald-500/50 bg-emerald-500/10 py-1.5 text-xs font-medium text-emerald-500 hover:bg-emerald-500/20 transition-colors">
                               Verify Payment
                            </button>
                            <button className="flex-1 rounded border border-border bg-background py-1.5 text-xs font-medium text-white hover:bg-white/5 transition-colors">
                               View Receipt
                            </button>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
             
              <div className="panel flex flex-col gap-4 rounded-2xl border border-border bg-panel p-6 shadow-lg h-[500px] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                  <h2 className="font-semibold text-white flex items-center gap-2">
                     <ArrowRightLeft className="size-5 text-orange-500" />
                     Refund Queue
                  </h2>
                  <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-xs font-bold text-orange-500">
                    {data.pendingRefunds.length} Pending
                  </span>
                </div>
                
                 <div className="flex flex-col gap-3">
                   {data.pendingRefunds.map(r => (
                      <div key={r.id} className="flex flex-col gap-3 rounded-lg border border-border bg-background/50 p-4">
                         <div className="flex items-start justify-between">
                            <div>
                               <p className="font-bold text-white">{r.citationId}</p>
                               <p className="text-xs text-muted-foreground mt-0.5">Reason: {r.reason}</p>
                            </div>
                            <span className="font-mono-tab font-bold text-orange-400">{formatPeso(r.amount)}</span>
                         </div>
                         <div className="flex gap-2">
                            <button className="flex-1 rounded border border-orange-500/50 bg-orange-500/10 py-1.5 text-xs font-medium text-orange-500 hover:bg-orange-500/20 transition-colors">
                               Process Refund
                            </button>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </>
      )}
    </div>
  );
}
