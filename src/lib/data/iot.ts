import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

let MOCK_NODES: EdgeNode[] = [
  { id: "NODE-QC-01", name: "Philcoa Intersection (N)", status: "Online", aiVersion: "v11.4-TRF", cpuTemp: 45.2, latency: 12, uptime: "45d 12h" },
  { id: "NODE-QC-02", name: "Philcoa Intersection (S)", status: "Online", aiVersion: "v11.4-TRF", cpuTemp: 48.7, latency: 15, uptime: "45d 12h" },
  { id: "NODE-QC-05", name: "Tandang Sora Overpass", status: "Degraded", aiVersion: "v11.2-TRF", cpuTemp: 78.1, latency: 154, uptime: "12d 4h" },
  { id: "NODE-QC-09", name: "Luzon Ave Flyover", status: "Offline", aiVersion: "v11.4-TRF", cpuTemp: 0, latency: 0, uptime: "0d 0h" },
];

export function useIotNodes() {
  return useQuery({
    queryKey: ["iot-nodes"],
    queryFn: async () => {
      try {
        const { data: cameras } = await supabase.from("cameras").select("*");
        if (cameras && cameras.length > 0) {
          return cameras.map((c: any, i: number) => ({
            id: c.code || `NODE-${c.id.slice(0, 8)}`,
            name: c.location || `Camera Node ${i + 1}`,
            status: c.status === "online" ? "Online" : c.status === "maintenance" ? "Degraded" : "Offline",
            aiVersion: "v11.4-TRF",
            cpuTemp: c.status === "online" ? 44.5 + (i * 2.3) : 0,
            latency: c.status === "online" ? 14 + (i * 3) : 0,
            uptime: c.status === "online" ? `${30 + i}d 14h` : "0d 0h",
          }));
        }
      } catch (err) {
        console.warn(err);
      }
      return MOCK_NODES;
    },
  });
}

export function useRebootNode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      try {
        await supabase.from("audit_logs").insert({
          actor_name: "Network Ops Engineer",
          actor_role: "admin",
          action: "IOT_NODE_REBOOT_TRIGGERED",
          target_resource: `Node: ${name} (${id})`,
          details: "Initiated remote cold-restart & hardware watchdog handshake.",
        });
      } catch (err) {
        console.warn(err);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["iot-nodes"] });
    },
  });
}

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
