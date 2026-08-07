import { useQuery } from "@tanstack/react-query";

export type CitizenVehicle = {
  id: string;
  plateNumber: string;
  makeModel: string;
  type: string;
  status: "verified" | "pending";
};

export type CitizenCitation = {
  id: string;
  plateNumber: string;
  violation: string;
  date: string;
  amount: number;
  status: "unpaid" | "settled" | "appealed";
};

export type CitizenProfile = {
  id: string;
  fullName: string;
  email: string;
  address: string;
  vehicles: CitizenVehicle[];
  citations: CitizenCitation[];
};

const MOCK_CITIZEN: CitizenProfile = {
  id: "CZT-1092",
  fullName: "Juan Dela Cruz",
  email: "juan.delacruz@example.com",
  address: "Block 4, Lot 12, Culiat, Quezon City",
  vehicles: [
    { id: "v1", plateNumber: "ABC-1234", makeModel: "Toyota Vios 2021", type: "Sedan", status: "verified" },
    { id: "v2", plateNumber: "XYZ-987", makeModel: "Honda Click 125i", type: "Motorcycle", status: "pending" },
  ],
  citations: [
    { id: "CIT-00129", plateNumber: "ABC-1234", violation: "Illegal Parking", date: "2026-08-01T14:30:00Z", amount: 1500, status: "unpaid" },
    { id: "CIT-00042", plateNumber: "XYZ-987", violation: "No Helmet", date: "2026-07-15T09:15:00Z", amount: 1000, status: "settled" },
  ]
};

export function useCitizenProfile() {
  return useQuery({
    queryKey: ["citizen-profile"],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
      return MOCK_CITIZEN;
    }
  });
}
