import { useQuery } from "@tanstack/react-query";

export type TransportRoute = {
  id: string;
  name: string;
  type: "jeepney" | "bus" | "tricycle";
  activeVehicles: number;
  congestionLevel: "low" | "medium" | "high" | "critical";
  status: "active" | "suspended" | "rerouted";
  terminals: string[];
};

export type Terminal = {
  id: string;
  name: string;
  location: [number, number]; // lat, lng
  capacity: number;
  currentOccupancy: number;
  status: "normal" | "crowded" | "over-capacity" | "unauthorized";
  puvTypes: ("jeepney" | "bus" | "tricycle")[];
};

const MOCK_ROUTES: TransportRoute[] = [
  {
    id: "TR-001",
    name: "Philcoa - UP Campus (via Culiat)",
    type: "jeepney",
    activeVehicles: 45,
    congestionLevel: "medium",
    status: "active",
    terminals: ["TERM-1", "TERM-2"],
  },
  {
    id: "TR-002",
    name: "Tandang Sora - Visayas Ave",
    type: "jeepney",
    activeVehicles: 32,
    congestionLevel: "high",
    status: "active",
    terminals: ["TERM-3", "TERM-4"],
  },
  {
    id: "TR-003",
    name: "Commonwealth Ave - Fairview",
    type: "bus",
    activeVehicles: 15,
    congestionLevel: "critical",
    status: "active",
    terminals: ["TERM-5", "TERM-1"],
  },
  {
    id: "TR-004",
    name: "Culiat Inner Route (TODA)",
    type: "tricycle",
    activeVehicles: 120,
    congestionLevel: "medium",
    status: "active",
    terminals: ["TERM-6"],
  },
  {
    id: "TR-005",
    name: "Luzon Ave - Commonwealth",
    type: "jeepney",
    activeVehicles: 28,
    congestionLevel: "low",
    status: "active",
    terminals: ["TERM-4", "TERM-5"],
  },
];

const MOCK_TERMINALS: Terminal[] = [
  {
    id: "TERM-1",
    name: "Philcoa Central Terminal",
    location: [14.6548, 121.0536],
    capacity: 100,
    currentOccupancy: 85,
    status: "crowded",
    puvTypes: ["jeepney", "bus"],
  },
  {
    id: "TERM-2",
    name: "UP Campus Hub",
    location: [14.655, 121.066],
    capacity: 50,
    currentOccupancy: 20,
    status: "normal",
    puvTypes: ["jeepney"],
  },
  {
    id: "TERM-3",
    name: "Tandang Sora Intersection",
    location: [14.6713, 121.0475],
    capacity: 40,
    currentOccupancy: 45,
    status: "over-capacity",
    puvTypes: ["jeepney", "tricycle"],
  },
  {
    id: "TERM-4",
    name: "Visayas Ave Corner",
    location: [14.6644, 121.0425],
    capacity: 60,
    currentOccupancy: 30,
    status: "normal",
    puvTypes: ["jeepney"],
  },
  {
    id: "TERM-5",
    name: "Commonwealth Fairview Stop",
    location: [14.689, 121.077],
    capacity: 150,
    currentOccupancy: 160,
    status: "over-capacity",
    puvTypes: ["bus", "jeepney"],
  },
  {
    id: "TERM-6",
    name: "Culiat TODA Station (Illegal)",
    location: [14.6655, 121.052],
    capacity: 15,
    currentOccupancy: 40,
    status: "unauthorized",
    puvTypes: ["tricycle"],
  },
];

export function useTransportRoutes() {
  return useQuery({
    queryKey: ["transport-routes"],
    queryFn: async () => {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      return MOCK_ROUTES;
    },
  });
}

export function useTerminals() {
  return useQuery({
    queryKey: ["terminals"],
    queryFn: async () => {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      return MOCK_TERMINALS;
    },
  });
}
