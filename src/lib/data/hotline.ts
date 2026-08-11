import { useQuery } from "@tanstack/react-query";

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
      await new Promise(resolve => setTimeout(resolve, 300));
      return MOCK_CALLS;
    }
  });
}
