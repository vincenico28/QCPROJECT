import { useQuery } from "@tanstack/react-query";

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

const MOCK_DATASETS: TrainingDataset[] = [
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
      await new Promise(resolve => setTimeout(resolve, 600));
      return MOCK_DATASETS;
    }
  });
}

export function useAiMetrics() {
  return useQuery({
    queryKey: ["ai-metrics"],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
      return MOCK_METRICS;
    }
  });
}
