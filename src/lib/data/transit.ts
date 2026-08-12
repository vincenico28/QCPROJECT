import { useQuery } from "@tanstack/react-query";

export type BusStatus = "On Time" | "Delayed" | "Out of Service";

export type TransitBus = {
  id: string;
  route: string;
  currentStop: string;
  nextStop: string;
  status: BusStatus;
  delayMinutes: number;
  occupancyPercent: number;
  lastUpdated: string;
};

const MOCK_TRANSIT: TransitBus[] = [
  {
    id: "QCB-101",
    route: "Route 1: QC Hall - Commonwealth",
    currentStop: "Technohub",
    nextStop: "Tandang Sora",
    status: "Delayed",
    delayMinutes: 12,
    occupancyPercent: 85,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "QCB-102",
    route: "Route 2: Cubao - Fairview",
    currentStop: "Philcoa",
    nextStop: "UP Diliman",
    status: "On Time",
    delayMinutes: 0,
    occupancyPercent: 42,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "QCB-105",
    route: "Route 3: SM North - Novaliches",
    currentStop: "Trinoma Terminal",
    nextStop: "Mindanao Ave",
    status: "Out of Service",
    delayMinutes: 0,
    occupancyPercent: 0,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  }
];

export function useTransitBuses() {
  return useQuery({
    queryKey: ["transit-buses"],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 350));
      return MOCK_TRANSIT;
    }
  });
}
