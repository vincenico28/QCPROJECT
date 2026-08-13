import { useQuery } from "@tanstack/react-query";

export type EvpStatus = "Active" | "Standby" | "Completed";

export type EmergencyVehicle = {
  id: string;
  type: "Ambulance" | "Fire Truck" | "Police Convoy";
  location: string;
  destination: string;
  status: EvpStatus;
  speed: string;
  eta: string;
  lightsControlled: number;
};

const MOCK_EVP_DATA: EmergencyVehicle[] = [
  {
    id: "MED-09",
    type: "Ambulance",
    location: "Commonwealth Ave (Southbound)",
    destination: "Philippine Heart Center",
    status: "Active",
    speed: "65 km/h",
    eta: "4 mins",
    lightsControlled: 3, // Number of traffic lights ahead turned green
  },
  {
    id: "FIRE-QC-01",
    type: "Fire Truck",
    location: "Quezon Ave Intersection",
    destination: "Timog Ave Commercial District",
    status: "Standby",
    speed: "0 km/h",
    eta: "--",
    lightsControlled: 0,
  },
  {
    id: "POL-VIP-1",
    type: "Police Convoy",
    location: "East Avenue",
    destination: "Batasang Pambansa",
    status: "Completed",
    speed: "0 km/h",
    eta: "Arrived",
    lightsControlled: 5,
  }
];

export function useEvpTracking() {
  return useQuery({
    queryKey: ["evp-tracking"],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return MOCK_EVP_DATA;
    }
  });
}
