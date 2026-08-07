import { useQuery } from "@tanstack/react-query";

export type ReportSummary = {
  totalRevenue: number;
  totalCitations: number;
  settledCitations: number;
  unpaidCitations: number;
  topViolations: { name: string; count: number }[];
  dailyRevenue: { date: string; amount: number }[];
};

const MOCK_REPORT_DATA: ReportSummary = {
  totalRevenue: 1245000,
  totalCitations: 843,
  settledCitations: 512,
  unpaidCitations: 331,
  topViolations: [
    { name: "Illegal Parking", count: 320 },
    { name: "No Helmet", count: 215 },
    { name: "Red Light Running", count: 180 },
    { name: "Over Speeding", count: 85 },
    { name: "Counterflow", count: 43 },
  ],
  dailyRevenue: Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return {
      date: d.toISOString().split("T")[0],
      amount: Math.floor(Math.random() * 50000) + 20000,
    };
  }),
};

export function useReportSummary(dateRange: { from: Date; to: Date }) {
  return useQuery({
    queryKey: ["reports", dateRange],
    queryFn: async () => {
      // Simulate network calculation based on dates
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return MOCK_REPORT_DATA;
    },
  });
}

// Generate CSV string logic for mock export
export function generateReportCsv(data: ReportSummary): string {
  const headers = "Metric,Value\n";
  const rows = [
    `Total Revenue,${data.totalRevenue}`,
    `Total Citations Issued,${data.totalCitations}`,
    `Settled Citations,${data.settledCitations}`,
    `Unpaid Citations,${data.unpaidCitations}`,
  ].join("\n");
  
  return headers + rows + "\n\nTop Violations\nViolation,Count\n" + data.topViolations.map(v => `${v.name},${v.count}`).join("\n");
}
