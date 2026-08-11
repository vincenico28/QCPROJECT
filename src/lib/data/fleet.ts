import { useQuery } from "@tanstack/react-query";

export type AssetType = "Cruiser" | "Tow Truck" | "Drone";
export type AssetStatus = "Deployed" | "Standby" | "Maintenance";

export type FleetAsset = {
  id: string;
  name: string;
  type: AssetType;
  status: AssetStatus;
  location: string;
  fuelBatteryLevel: number;
  lastMaintained: string;
};

const MOCK_FLEET: FleetAsset[] = [
  {
    id: "UNIT-01",
    name: "Cruiser Alpha",
    type: "Cruiser",
    status: "Deployed",
    location: "Commonwealth Ave",
    fuelBatteryLevel: 65,
    lastMaintained: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
  {
    id: "UNIT-02",
    name: "Heavy Tow Truck 1",
    type: "Tow Truck",
    status: "Standby",
    location: "Culiat Command HQ",
    fuelBatteryLevel: 90,
    lastMaintained: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
  },
  {
    id: "DRN-001",
    name: "AeroEye Drone X1",
    type: "Drone",
    status: "Deployed",
    location: "EDSA North (Aerial)",
    fuelBatteryLevel: 32,
    lastMaintained: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  }
];

export function useFleetAssets() {
  return useQuery({
    queryKey: ["fleet-assets"],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 400));
      return MOCK_FLEET;
    }
  });
}
