import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { serverFetchFinanceAnalytics } from "@/lib/server.functions";

export type MonthlyRevenue = {
  month: string;
  citations: number;
  towing: number;
  evCharging: number;
};

export type BudgetAllocation = {
  category: string;
  amount: number;
};

export type LiveFinancialMetrics = {
  totalPaidCitationsCount: number;
  totalCitationsIssuedCount: number;
  liveCitationsRevenue: number;
  livePaymentsRevenue: number;
  verifiedPaymentsCount: number;
  pendingPaymentsCount: number;
};

export type FinanceAnalyticsResult = {
  revenue: MonthlyRevenue[];
  budget: BudgetAllocation[];
  ytdTotal: number;
  projectedSavings: number;
  liveMetrics: LiveFinancialMetrics | null;
};

const MOCK_REVENUE_DATA: MonthlyRevenue[] = [
  { month: "Jan", citations: 1250000, towing: 350000, evCharging: 45000 },
  { month: "Feb", citations: 1100000, towing: 320000, evCharging: 52000 },
  { month: "Mar", citations: 950000, towing: 280000, evCharging: 68000 },
  { month: "Apr", citations: 1050000, towing: 310000, evCharging: 80000 },
  { month: "May", citations: 880000, towing: 250000, evCharging: 95000 },
  { month: "Jun", citations: 750000, towing: 200000, evCharging: 115000 },
];

const MOCK_BUDGET: BudgetAllocation[] = [
  { category: "Command Center Ops", amount: 4500000 },
  { category: "IoT & Cameras", amount: 2800000 },
  { category: "EV Infrastructure", amount: 1500000 },
  { category: "Officer Gear", amount: 1200000 },
];

export function useFinanceAnalytics() {
  const qc = useQueryClient();

  // Setup live Supabase Realtime listeners for payments and citations
  useEffect(() => {
    try {
      const channel = supabase
        .channel(`realtime-finance-analytics_${Math.random().toString(36).slice(2, 8)}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => {
          qc.invalidateQueries({ queryKey: ["finance-analytics"] });
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "citations" }, () => {
          qc.invalidateQueries({ queryKey: ["finance-analytics"] });
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "revenue_reports" }, () => {
          qc.invalidateQueries({ queryKey: ["finance-analytics"] });
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "budget_allocations" }, () => {
          qc.invalidateQueries({ queryKey: ["finance-analytics"] });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn("[Finance Realtime Subscription Warning]:", err);
    }
  }, [qc]);

  return useQuery({
    queryKey: ["finance-analytics"],
    queryFn: async (): Promise<FinanceAnalyticsResult> => {
      const data = await serverFetchFinanceAnalytics();
      const rawRev = data.revenue || [];
      const rawBud = data.budget || [];

      let revenue: MonthlyRevenue[] = rawRev.map((r: any) => ({
        month: r.month,
        citations: Number(r.citations),
        towing: Number(r.towing),
        evCharging: Number(r.ev_charging),
      }));

      // Fallback if table is completely empty
      if (revenue.length === 0) {
        revenue = MOCK_REVENUE_DATA;
      }

      let budget: BudgetAllocation[] = rawBud.map((b: any) => ({
        category: b.category,
        amount: Number(b.amount),
      }));

      if (budget.length === 0) {
        budget = MOCK_BUDGET;
      }

      const ytdTotal = revenue.reduce((sum, r) => sum + r.citations + r.towing + r.evCharging, 0);

      return {
        revenue,
        budget,
        ytdTotal,
        projectedSavings: 2400000,
        liveMetrics: (data as any).liveMetrics || null,
      };
    },
    staleTime: 5000,
  });
}
