import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type OfficerShift = {
  id: string;
  badgeNumber: string;
  shiftStart: string;
  shiftEnd: string | null;
  location: [number, number]; // lat, lng
  currentTask: string;
  batteryLevel: number;
};

const MOCK_SHIFTS: OfficerShift[] = [
  {
    id: "SH-101",
    badgeNumber: "BADGE-101",
    shiftStart: new Date(new Date().setHours(6, 0, 0, 0)).toISOString(),
    shiftEnd: null,
    location: [14.6548, 121.0536],
    currentTask: "Patrolling Philcoa Sector",
    batteryLevel: 85,
  },
  {
    id: "SH-102",
    badgeNumber: "BADGE-102",
    shiftStart: new Date(new Date().setHours(8, 0, 0, 0)).toISOString(),
    shiftEnd: null,
    location: [14.6713, 121.0475],
    currentTask: "Assisting Incident at Tandang Sora",
    batteryLevel: 62,
  },
  {
    id: "SH-103",
    badgeNumber: "BADGE-104",
    shiftStart: new Date(new Date().setHours(5, 30, 0, 0)).toISOString(),
    shiftEnd: null,
    location: [14.689, 121.077],
    currentTask: "Directing Traffic at Commonwealth Ave",
    batteryLevel: 94,
  }
];

export function useOfficerShifts() {
  return useQuery({
    queryKey: ["officer-shifts"],
    queryFn: async () => {
      try {
        const { data: officers } = await supabase
          .from("officers")
          .select("*")
          .eq("on_duty", true);

        if (officers && officers.length > 0) {
          return officers.map((o: any, i: number) => ({
            id: `SH-${o.id.substring(0, 6).toUpperCase()}`,
            badgeNumber: o.badge_number,
            shiftStart: new Date(new Date().setHours(7, 0, 0, 0)).toISOString(),
            shiftEnd: null,
            location: [
              14.6548 + (i * 0.008) * (i % 2 === 0 ? 1 : -1),
              121.0536 + (i * 0.006) * (i % 2 === 0 ? -1 : 1),
            ] as [number, number],
            currentTask: `Assigned to ${o.unit || "Sector Patrol"}`,
            batteryLevel: 75 + ((i * 7) % 25),
          }));
        }
      } catch (err) {
        console.warn(err);
      }
      return MOCK_SHIFTS;
    },
  });
}
