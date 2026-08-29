import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TrainingDataset = {
  id: string;
  name: string;
  images: number;
  classes: string[];
  status: "Ready" | "Training" | "Failed";
  lastTrained: string;
};

export type ModelMetric = {
  epoch: number;
  map50: number;
  map95: number;
  loss: number;
};

let MOCK_DATASETS: TrainingDataset[] = [
  { id: "DS-001", name: "QC Jeepneys v2", images: 14500, classes: ["jeepney", "passenger"], status: "Ready", lastTrained: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() },
  { id: "DS-002", name: "Tricycles - Culiat", images: 8200, classes: ["tricycle", "driver"], status: "Training", lastTrained: new Date().toISOString() },
  { id: "DS-003", name: "Night Vision Plates", images: 22100, classes: ["plate_number", "car"], status: "Ready", lastTrained: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString() },
];

const MOCK_METRICS: ModelMetric[] = Array.from({ length: 20 }).map((_, i) => ({
  epoch: i + 1,
  map50: Math.min(0.95, 0.4 + (i * 0.03) + (Math.random() * 0.05)),
  map95: Math.min(0.85, 0.2 + (i * 0.02) + (Math.random() * 0.05)),
  loss: Math.max(0.05, 1.5 - (i * 0.07) + (Math.random() * 0.1)),
}));

export function useAiDatasets() {
  return useQuery({
    queryKey: ["ai-datasets"],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return [...MOCK_DATASETS];
    }
  });
}

export function useCreateAiDataset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; images: number; classes: string[] }) => {
      const newDataset: TrainingDataset = {
        id: `DS-${String(MOCK_DATASETS.length + 1).padStart(3, "0")}`,
        name: input.name,
        images: input.images,
        classes: input.classes,
        status: "Ready",
        lastTrained: new Date().toISOString(),
      };
      MOCK_DATASETS.unshift(newDataset);

      try {
        await supabase.from("audit_logs").insert({
          actor_name: "AI Engineer",
          actor_role: "admin",
          action: "AI_DATASET_UPLOADED",
          target_resource: `Dataset: ${input.name} (${input.images} frames)`,
          details: `Classes: ${input.classes.join(", ")}`,
        });
      } catch (err) {
        console.warn(err);
      }
      return newDataset;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai-datasets"] });
    },
  });
}

export function useAiMetrics() {
  return useQuery({
    queryKey: ["ai-metrics"],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return MOCK_METRICS;
    }
  });
}
