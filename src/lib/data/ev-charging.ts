import { useQuery } from "@tanstack/react-query";

export type EvStatus = "Available" | "Charging" | "Offline";

export type EvStation = {
  id: string;
  name: string;
  location: string;
  status: EvStatus;
  currentDrawKw: number;
  totalSessionKw: number;
  user: string | null;
  lastMaintained: string;
};

const MOCK_STATIONS: EvStation[] = [
  {
    id: "EV-001",
    name: "QC Hall Fast Charger A",
    location: "QC Hall Main Parking",
    status: "Charging",
    currentDrawKw: 45.2,
    totalSessionKw: 12.5,
    user: "Juan Dela Cruz (Plate: ABC-123)",
    lastMaintained: new Date().toISOString(),
  },
  {
    id: "EV-002",
    name: "QC Hall Fast Charger B",
    location: "QC Hall Main Parking",
    status: "Available",
    currentDrawKw: 0,
    totalSessionKw: 0,
    user: null,
    lastMaintained: new Date().toISOString(),
  },
  {
    id: "EV-003",
    name: "Culiat LGU Standard Charger",
    location: "Visayas Ave",
    status: "Offline",
    currentDrawKw: 0,
    totalSessionKw: 0,
    user: null,
    lastMaintained: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
  }
];

export function useEvStations() {
  return useQuery({
    queryKey: ["ev-stations"],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 350));
      return MOCK_STATIONS;
    }
  });
}
