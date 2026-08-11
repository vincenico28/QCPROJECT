import { useQuery } from "@tanstack/react-query";

export type ParkingStatus = "Available" | "Full" | "Maintenance";

export type ParkingLot = {
  id: string;
  name: string;
  location: string;
  totalSpots: number;
  availableSpots: number;
  status: ParkingStatus;
  lastUpdated: string;
};

const MOCK_PARKING: ParkingLot[] = [
  {
    id: "LOT-01",
    name: "QC Hall Main Parking",
    location: "Elliptical Road",
    totalSpots: 150,
    availableSpots: 12,
    status: "Available",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "LOT-02",
    name: "Culiat LGU Hub",
    location: "Visayas Ave",
    totalSpots: 45,
    availableSpots: 0,
    status: "Full",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "LOT-03",
    name: "Commonwealth Ave P3",
    location: "Commonwealth Ave",
    totalSpots: 200,
    availableSpots: 145,
    status: "Available",
    lastUpdated: new Date().toISOString(),
  }
];

export function useParkingLots() {
  return useQuery({
    queryKey: ["parking-lots"],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return MOCK_PARKING;
    }
  });
}
