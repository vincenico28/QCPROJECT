import { useQuery } from "@tanstack/react-query";

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
      await new Promise((resolve) => setTimeout(resolve, 600));
      return MOCK_SHIFTS;
    },
  });
}
