import { useQuery } from "@tanstack/react-query";

export type InfrastructureNode = {
  id: string;
  type: "Traffic Light" | "AI Camera" | "Server Node" | "Environmental Sensor";
  location: string;
  healthPercent: number;
  status: "Healthy" | "Degraded" | "Critical";
  predictedFailure: string;
  lastMaintenance: string;
};

const MOCK_INFRASTRUCTURE: InfrastructureNode[] = [
  {
    id: "TL-N-012",
    type: "Traffic Light",
    location: "Commonwealth - Tandang Sora Intersection",
    healthPercent: 98,
    status: "Healthy",
    predictedFailure: "> 12 months",
    lastMaintenance: "2026-03-15",
  },
  {
    id: "CAM-Q-144",
    type: "AI Camera",
    location: "Quezon Ave (Eastbound)",
    healthPercent: 65,
    status: "Degraded",
    predictedFailure: "In 3 weeks",
    lastMaintenance: "2025-11-20",
  },
  {
    id: "SRV-CC-02",
    type: "Server Node",
    location: "Command Center Datacenter",
    healthPercent: 99,
    status: "Healthy",
    predictedFailure: "> 24 months",
    lastMaintenance: "2026-07-01",
  },
  {
    id: "ENV-S-05",
    type: "Environmental Sensor",
    location: "EDSA - Cubao",
    healthPercent: 12,
    status: "Critical",
    predictedFailure: "Imminent (Within 48h)",
    lastMaintenance: "2024-05-10",
  }
];

export function useInfrastructureHealth() {
  return useQuery({
    queryKey: ["infrastructure-health"],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 400));
      return MOCK_INFRASTRUCTURE;
    }
  });
}
