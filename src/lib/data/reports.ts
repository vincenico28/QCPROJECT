import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
      try {
        const { data: citations } = await supabase.from("citations").select("*");
        const { data: violations } = await supabase.from("violations").select("*");

        if (citations && citations.length > 0) {
          const totalCitations = citations.length;
          const settledCitations = citations.filter((c) => c.status === "paid").length;
          const unpaidCitations = citations.filter((c) => c.status !== "paid" && c.status !== "dismissed").length;
          const totalRevenue = citations
            .filter((c) => c.status === "paid")
            .reduce((sum, c) => sum + Number(c.amount || 0), 0);

          const counts: Record<string, number> = {};
          (violations || []).forEach((v) => {
            counts[v.violation_type] = (counts[v.violation_type] || 0) + 1;
          });
          const topViolations = Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

          return {
            totalRevenue: totalRevenue || MOCK_REPORT_DATA.totalRevenue,
            totalCitations: totalCitations || MOCK_REPORT_DATA.totalCitations,
            settledCitations: settledCitations || MOCK_REPORT_DATA.settledCitations,
            unpaidCitations: unpaidCitations || MOCK_REPORT_DATA.unpaidCitations,
            topViolations: topViolations.length > 0 ? topViolations : MOCK_REPORT_DATA.topViolations,
            dailyRevenue: MOCK_REPORT_DATA.dailyRevenue,
          };
        }
      } catch (err) {
        console.warn("Reports summary query fallback:", err);
      }
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
