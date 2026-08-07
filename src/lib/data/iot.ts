import { useQuery } from "@tanstack/react-query";

export type EdgeNode = {
  id: string;
  name: string;
  status: "Online" | "Offline" | "Degraded";
  aiVersion: string;
  cpuTemp: number;
  latency: number;
  uptime: string;
};

export type InferenceEvent = {
  id: string;
  nodeId: string;
  timestamp: string;
  objectType: "Car" | "Motorcycle" | "Bus" | "Jeepney";
  confidence: number;
  flagged: boolean;
};

const MOCK_NODES: EdgeNode[] = [
  { id: "NODE-QC-01", name: "Philcoa Intersection (N)", status: "Online", aiVersion: "v11.4-TRF", cpuTemp: 45.2, latency: 12, uptime: "45d 12h" },
  { id: "NODE-QC-02", name: "Philcoa Intersection (S)", status: "Online", aiVersion: "v11.4-TRF", cpuTemp: 48.7, latency: 15, uptime: "45d 12h" },
  { id: "NODE-QC-05", name: "Tandang Sora Overpass", status: "Degraded", aiVersion: "v11.2-TRF", cpuTemp: 78.1, latency: 154, uptime: "12d 4h" },
  { id: "NODE-QC-09", name: "Luzon Ave Flyover", status: "Offline", aiVersion: "v11.4-TRF", cpuTemp: 0, latency: 0, uptime: "0d 0h" },
];

export function useIotNodes() {
  return useQuery({
    queryKey: ["iot-nodes"],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
      return MOCK_NODES;
    }
  });
}

// Simulated real-time hook
import { useEffect, useState } from "react";

export function useInferenceStream() {
  const [events, setEvents] = useState<InferenceEvent[]>([]);

  useEffect(() => {
    const types: InferenceEvent["objectType"][] = ["Car", "Motorcycle", "Bus", "Jeepney"];
    const interval = setInterval(() => {
      const isViolation = Math.random() > 0.85;
      const newEvent: InferenceEvent = {
        id: `INF-${Math.random().toString(36).substr(2, 9)}`,
        nodeId: `NODE-QC-0${Math.floor(Math.random() * 4) + 1}`,
        timestamp: new Date().toISOString(),
        objectType: types[Math.floor(Math.random() * types.length)],
        confidence: isViolation ? 0.85 + Math.random() * 0.14 : 0.6 + Math.random() * 0.25,
        flagged: isViolation,
      };
      
      setEvents(prev => [newEvent, ...prev].slice(0, 50));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return events;
}
