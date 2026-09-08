import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { serverSaveDispatch } from "@/lib/server.functions";

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
  triageCode?: "Code 1 Stall" | "Code 2 Collision" | "Code 3 Casualty" | "Code 4 Assault" | "Code 5 Flash Flood";
  audioDuration?: string;
  audioWaveformData?: number[];
  nearestCamera?: { id: string; name: string };
  gpsCoords?: [number, number];
  holdTimeSec?: number;
};

const MOCK_CALLS: HotlineCall[] = [
  {
    id: "CALL-9021",
    caller: "Maria Santos",
    phoneNumber: "0917-555-0192",
    location: "Commonwealth Ave cor. Tandang Sora",
    issue: "3-car multi-vehicle pileup with heavy coolant leak, one UV Express overturned. Center 3 lanes blocked. Requesting medical & DPOS enforcers immediately.",
    level: "Critical",
    timeReceived: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    status: "Active",
    triageCode: "Code 2 Collision",
    audioDuration: "00:42",
    audioWaveformData: [25, 45, 80, 95, 60, 40, 85, 100, 75, 45, 90, 85, 30, 20, 65, 80, 70, 50, 90, 60, 30, 15],
    nearestCamera: { id: "CAM-042", name: "Commonwealth / Tandang Sora Optical Node" },
    gpsCoords: [14.6563, 121.0697],
    holdTimeSec: 108,
  },
  {
    id: "CALL-9022",
    caller: "Juan Dela Cruz",
    phoneNumber: "0918-444-9988",
    location: "Visayas Ave cor. Central Ave",
    issue: "Overloaded 10-wheeler gravel truck stalled on left-turning slot towards Culiat. Heavy vehicular bottleneck building towards Elliptical.",
    level: "Moderate",
    timeReceived: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    status: "Active",
    triageCode: "Code 1 Stall",
    audioDuration: "00:28",
    audioWaveformData: [20, 30, 45, 60, 50, 40, 55, 65, 40, 35, 50, 45, 25, 30, 40, 50, 35, 20],
    nearestCamera: { id: "CAM-088", name: "Visayas Ave Central Intersection" },
    gpsCoords: [14.6612, 121.0498],
    holdTimeSec: 42,
  },
  {
    id: "CALL-9023",
    caller: "Engr. Ricardo Gomez",
    phoneNumber: "0920-881-2301",
    location: "Quirino Highway (Balintawak Bound)",
    issue: "Sudden gutter-deep flash flooding following cloudburst at Culiat creek tributary. Tricycles and private sedans cannot traverse.",
    level: "Critical",
    timeReceived: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
    status: "Active",
    triageCode: "Code 5 Flash Flood",
    audioDuration: "00:36",
    audioWaveformData: [35, 55, 70, 85, 90, 65, 80, 85, 60, 70, 90, 95, 70, 55, 40, 30, 65, 50, 35],
    nearestCamera: { id: "CAM-105", name: "Quirino Highway North Gate" },
    gpsCoords: [14.6732, 121.0345],
    holdTimeSec: 85,
  },
  {
    id: "CALL-9015",
    caller: "Anonymous Barangay Tanod",
    phoneNumber: "Hidden (Caller ID Restricted)",
    location: "Katipunan Ave Beltway (Ateneo Overpass)",
    issue: "Motorcycle hit and run involving delivery rider. Plate number partial XZK-**. Victim conscious on shoulder lane.",
    level: "Severe",
    timeReceived: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    status: "Resolved",
    triageCode: "Code 3 Casualty",
    audioDuration: "01:05",
    audioWaveformData: [15, 25, 60, 85, 90, 75, 50, 70, 65, 40, 30, 20, 15],
    nearestCamera: { id: "CAM-019", name: "Katipunan Ave Beltway South" },
    gpsCoords: [14.6412, 121.0745],
    holdTimeSec: 15,
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
          return data.map((d: any, index: number) => ({
            id: d.id.substring(0, 8).toUpperCase(),
            caller: d.reporter_name,
            phoneNumber: d.contact_number || "0917-000-0000",
            location: d.location,
            issue: `[${d.category}] ${d.description}`,
            level: (d.category?.includes("Accident") || d.category?.includes("Flooding") ? "Critical" : "Moderate") as EmergencyLevel,
            timeReceived: d.created_at,
            status: (d.status === "resolved" ? "Resolved" : "Active") as HotlineCall["status"],
            triageCode: (d.category?.includes("Accident") ? "Code 2 Collision" : d.category?.includes("Flooding") ? "Code 5 Flash Flood" : "Code 1 Stall") as HotlineCall["triageCode"],
            audioDuration: "00:35",
            audioWaveformData: [30, 45, 75, 90, 60, 40, 70, 85, 60, 40, 30],
            nearestCamera: { id: `CAM-0${index + 20}`, name: `${d.location} CCTV Sentinel` },
            gpsCoords: [14.656 + (index * 0.003), 121.055 + (index * 0.002)] as [number, number],
            holdTimeSec: 60 + (index * 15),
          }));
        }
      } catch (err) {
        console.warn("Hotline calls query fallback:", err);
      }
      return MOCK_CALLS;
    }
  });
}

export function useDispatchHotlineCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (call: HotlineCall) => {
      await serverSaveDispatch({
        data: {
          location: call.location,
          priority: call.level === "Critical" ? "critical" : "high",
          instructions: `[Hotline Incident - ${call.caller}]: ${call.issue}`,
          officer_id: null,
          officer_name: null,
          badge_number: null,
        },
      });

      try {
        await supabase.from("audit_logs").insert({
          actor_name: "Hotline 911 Dispatcher",
          actor_role: "dispatcher",
          action: "HOTLINE_EMERGENCY_DISPATCHED",
          target_resource: `Caller: ${call.caller} (${call.phoneNumber})`,
          details: `Location: ${call.location}, Level: ${call.level}`,
        });
      } catch (err) {
        console.warn(err);
      }
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hotline-calls"] });
      qc.invalidateQueries({ queryKey: ["dispatches"] });
    },
  });
}
