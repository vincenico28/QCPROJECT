import { useQuery } from "@tanstack/react-query";

export type SlaMetric = {
  id: string;
  name: string;
  target: string;
  actual: string;
  status: "Pass" | "Warning" | "Fail";
  trend: number; // positive means improving, negative means degrading
};

const MOCK_SLA_DATA: SlaMetric[] = [
  {
    id: "SLA-01",
    name: "Average Officer Dispatch Time",
    target: "< 5 mins",
    actual: "3.2 mins",
    status: "Pass",
    trend: 12.5, 
  },
  {
    id: "SLA-02",
    name: "AI Camera Uptime",
    target: "99.9%",
    actual: "99.98%",
    status: "Pass",
    trend: 0.05,
  },
  {
    id: "SLA-03",
    name: "Citizen Dispute Resolution",
    target: "< 48 hours",
    actual: "52 hours",
    status: "Warning",
    trend: -4.5,
  },
  {
    id: "SLA-04",
    name: "Automated Workflow Latency",
    target: "< 200ms",
    actual: "150ms",
    status: "Pass",
    trend: 2.1,
  },
  {
    id: "SLA-05",
    name: "EV Charger Availability",
    target: "> 95%",
    actual: "92%",
    status: "Warning",
    trend: -1.2,
  },
  {
    id: "SLA-06",
    name: "Command Center Network Latency",
    target: "< 20ms",
    actual: "45ms",
    status: "Fail",
    trend: -15.4,
  }
];

export function useSlaPerformance() {
  return useQuery({
    queryKey: ["sla-performance"],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return MOCK_SLA_DATA;
    }
  });
}
