import { useQuery } from "@tanstack/react-query";

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

const MOCK_REVENUE_DATA: MonthlyRevenue[] = [
  { month: "Jan", citations: 1250000, towing: 350000, evCharging: 45000 },
  { month: "Feb", citations: 1100000, towing: 320000, evCharging: 52000 },
  { month: "Mar", citations: 950000, towing: 280000, evCharging: 68000 },
  { month: "Apr", citations: 1050000, towing: 310000, evCharging: 80000 },
  { month: "May", citations: 880000, towing: 250000, evCharging: 95000 },
  { month: "Jun", citations: 750000, towing: 200000, evCharging: 115000 }, // Downward trend in citations due to better compliance!
];

const MOCK_BUDGET: BudgetAllocation[] = [
  { category: "Command Center Ops", amount: 4500000 },
  { category: "IoT & Cameras", amount: 2800000 },
  { category: "EV Infrastructure", amount: 1500000 },
  { category: "Officer Gear", amount: 1200000 },
];

export function useFinanceAnalytics() {
  return useQuery({
    queryKey: ["finance-analytics"],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 400));
      return {
        revenue: MOCK_REVENUE_DATA,
        budget: MOCK_BUDGET,
        ytdTotal: 6690000,
        projectedSavings: 2400000,
      };
    }
  });
}
