import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type EmergencyLevel = "Low" | "Moderate" | "Severe" | "Critical";

export type HotlineCall = {
  id: string;
  caller: string;
  phoneNumber: string;
  location: string;
  issue: string;
  level: EmergencyLevel;
  timeReceived: string;
  status: "Active" | "Resolved";
};

const MOCK_CALLS: HotlineCall[] = [
  {
    id: "CALL-9021",
    caller: "Maria Santos",
    phoneNumber: "0917-555-0192",
    location: "Visayas Ave Intersection",
    issue: "3-car collision, one flipped vehicle. Requesting medical & traffic enforcers.",
    level: "Critical",
    timeReceived: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    status: "Active",
  },
  {
    id: "CALL-9022",
    caller: "Juan Dela Cruz",
    phoneNumber: "0918-444-9988",
    location: "Tandang Sora near Palengke",
    issue: "Illegally parked delivery truck causing massive bottleneck.",
    level: "Moderate",
    timeReceived: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    status: "Active",
  },
  {
    id: "CALL-9015",
    caller: "Anonymous",
    phoneNumber: "Hidden",
    location: "Commonwealth Ave Northbound",
    issue: "Motorcycle hit and run. Plate number partial XZK-**.",
    level: "Severe",
    timeReceived: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    status: "Resolved",
  }
];

export function useHotlineCalls() {
  return useQuery({
    queryKey: ["hotline-calls"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("hazard_reports")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id.substring(0, 8).toUpperCase(),
            caller: d.reporter_name,
            phoneNumber: d.contact_number || "0917-000-0000",
            location: d.location,
            issue: `[${d.category}] ${d.description}`,
            level: (d.category.includes("Accident") || d.category.includes("Flooding") ? "Critical" : "Moderate") as EmergencyLevel,
            timeReceived: d.created_at,
            status: (d.status === "resolved" ? "Resolved" : "Active") as HotlineCall["status"],
          }));
        }
      } catch (err) {
        console.warn("Hotline calls query fallback:", err);
      }
      return MOCK_CALLS;
    }
  });
}
