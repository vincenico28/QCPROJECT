import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QC_CENTER } from "./gis";

export type HeatmapPoint = {
  id: string;
  lat: number;
  lng: number;
  intensity: number; // 0 to 1
  predictedViolations: number;
  label: string;
};

export type TimeSeriesPrediction = {
  time: string;
  actual: number | null;
  predicted: number;
};

const MOCK_HEATMAP_POINTS: HeatmapPoint[] = Array.from({ length: 40 }).map((_, i) => ({
  id: `HP-${i}`,
  lat: QC_CENTER[0] + (Math.random() - 0.5) * 0.04,
  lng: QC_CENTER[1] + (Math.random() - 0.5) * 0.04,
  intensity: Math.random(),
  predictedViolations: Math.floor(Math.random() * 50) + 10,
  label: `Sector ${i+1}`
}));

const MOCK_PREDICTIONS: TimeSeriesPrediction[] = Array.from({ length: 24 }).map((_, i) => {
  const isFuture = i > 12; // 12 PM is current time in mock
  const base = 50 + Math.sin(i / 3) * 30 + (i === 8 || i === 17 ? 80 : 0); // Rush hour spikes
  
  return {
    time: `${i.toString().padStart(2, '0')}:00`,
    actual: isFuture ? null : Math.floor(base + (Math.random() - 0.5) * 20),
    predicted: Math.floor(base)
  };
});

export function useHeatmapData() {
  return useQuery({
    queryKey: ["analytics-heatmap"],
    queryFn: async () => {
      try {
        const { data: cameras } = await supabase.from("cameras").select("*");
        const { data: violations } = await supabase.from("violations").select("*");

        if (cameras && cameras.length > 0) {
          const points: HeatmapPoint[] = cameras.map((c: any, i: number) => {
            const count = violations?.filter((v: any) => v.camera_code === c.code).length || 5;
            return {
              id: c.id,
              lat: c.lat || (QC_CENTER[0] + (Math.random() - 0.5) * 0.03),
              lng: c.lng || (QC_CENTER[1] + (Math.random() - 0.5) * 0.03),
              intensity: Math.min(1, 0.3 + (count * 0.08)),
              predictedViolations: Math.floor(count * 2.5) + 8,
              label: c.location || `Sector ${i + 1}`,
            };
          });

          return {
            points: points.length > 0 ? points : MOCK_HEATMAP_POINTS,
            predictions: MOCK_PREDICTIONS,
          };
        }
      } catch (err) {
        console.warn(err);
      }
      return {
        points: MOCK_HEATMAP_POINTS,
        predictions: MOCK_PREDICTIONS,
      };
    },
  });
}
