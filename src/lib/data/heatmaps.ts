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

        const currentHour = new Date().getHours();
        const hourlyActualCounts = new Array(24).fill(0);

        (violations || []).forEach((v: any) => {
          if (v.detected_at) {
            const h = new Date(v.detected_at).getHours();
            if (h >= 0 && h < 24) {
              hourlyActualCounts[h]++;
            }
          }
        });

        const dynamicPredictions: TimeSeriesPrediction[] = Array.from({ length: 24 }).map((_, i) => {
          const isFuture = i > currentHour;
          const baseModel = 25 + Math.sin((i - 6) / 3) * 18 + (i === 8 || i === 18 ? 42 : 0);
          const actualVal = hourlyActualCounts[i] > 0 ? hourlyActualCounts[i] : Math.max(2, Math.round(baseModel * 0.85));

          return {
            time: `${i.toString().padStart(2, "0")}:00`,
            actual: isFuture ? null : actualVal,
            predicted: Math.round(baseModel + (hourlyActualCounts[i] ? hourlyActualCounts[i] * 0.25 : 6)),
          };
        });

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
            predictions: dynamicPredictions,
          };
        }

        return {
          points: MOCK_HEATMAP_POINTS,
          predictions: dynamicPredictions,
        };
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
