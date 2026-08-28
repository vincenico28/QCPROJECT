import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type InfrastructureNode = {
  id: string;
  type: "Traffic Light" | "AI Camera" | "Server Node" | "Environmental Sensor";
  location: string;
  healthPercent: number;
  status: "Healthy" | "Degraded" | "Critical";
  predictedFailure: string;
  lastMaintenance: string;
};

const DEFAULT_INFRASTRUCTURE: InfrastructureNode[] = [
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
  },
];

export function useInfrastructureHealth() {
  return useQuery({
    queryKey: ["infrastructure-health"],
    queryFn: async (): Promise<InfrastructureNode[]> => {
      try {
        const { data, error } = await supabase
          .from("infrastructure_assets")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id.substring(0, 8).toUpperCase(),
            type: d.asset_type.includes("Camera") || d.asset_type.includes("ANPR") ? "AI Camera" :
                  d.asset_type.includes("Controller") || d.asset_type.includes("Light") ? "Traffic Light" :
                  d.asset_type.includes("Loop") ? "Environmental Sensor" : "Server Node",
            location: d.location,
            healthPercent: d.status === "operational" ? 96 : d.status === "maintenance" ? 65 : 20,
            status: d.status === "operational" ? "Healthy" : d.status === "maintenance" ? "Degraded" : "Critical",
            predictedFailure: d.status === "operational" ? "> 12 months" : "Scheduled Maintenance",
            lastMaintenance: d.last_inspected ? new Date(d.last_inspected).toISOString().split("T")[0] : "2026-06-01",
          }));
        }
      } catch {
        // fallback
      }
      return DEFAULT_INFRASTRUCTURE;
    },
  });
}

export function useCreateInfrastructureAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; assetType: string; location: string; status: string }) => {
      await supabase.from("infrastructure_assets").insert({
        name: input.name,
        asset_type: input.assetType,
        location: input.location,
        status: input.status,
      });
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["infrastructure-health"] });
    },
  });
}
