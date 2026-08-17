import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

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
  phone?: string;
  address: string;
  vehicles: CitizenVehicle[];
  citations: CitizenCitation[];
};

export type SignUpCitizenInput = {
  fullName: string;
  email: string;
  password?: string;
  phone?: string;
  address?: string;
  plateNumber?: string;
  makeModel?: string;
  vehicleType?: string;
};

export let MOCK_CITIZENS: CitizenProfile[] = [
  {
    id: "CZT-1092",
    fullName: "Juan Dela Cruz",
    email: "juan.delacruz@example.com",
    phone: "0917-123-4567",
    address: "Block 4, Lot 12, Culiat, Quezon City",
    vehicles: [
      { id: "v1", plateNumber: "ABC-1234", makeModel: "Toyota Vios 2021", type: "Sedan", status: "verified" },
      { id: "v2", plateNumber: "XYZ-987", makeModel: "Honda Click 125i", type: "Motorcycle", status: "pending" },
    ],
    citations: [
      { id: "CIT-00129", plateNumber: "ABC-1234", violation: "Illegal Parking", date: "2026-08-01T14:30:00Z", amount: 1500, status: "unpaid" },
      { id: "CIT-00042", plateNumber: "XYZ-987", violation: "No Helmet", date: "2026-07-15T09:15:00Z", amount: 1000, status: "settled" },
    ],
  },
  {
    id: "CZT-2045",
    fullName: "Maria Clara Santos",
    email: "maria.santos@example.com",
    phone: "0918-999-8888",
    address: "Tandang Sora Ave, Barangay Culiat, QC",
    vehicles: [
      { id: "v3", plateNumber: "NDB-8921", makeModel: "Mitsubishi Xpander", type: "MPV", status: "verified" },
    ],
    citations: [
      { id: "CIT-00135", plateNumber: "NDB-8921", violation: "Red Light", date: "2026-08-05T11:20:00Z", amount: 2000, status: "unpaid" },
    ],
  },
];

let activeCitizenId: string | null = "CZT-1092";

function getStoredCitizenId(): string | null {
  if (typeof window === "undefined") return activeCitizenId;
  try {
    const saved = localStorage.getItem("qc_active_citizen_id");
    return saved || activeCitizenId;
  } catch {
    return activeCitizenId;
  }
}

function setStoredCitizenId(id: string | null) {
  activeCitizenId = id;
  if (typeof window === "undefined") return;
  try {
    if (id) {
      localStorage.setItem("qc_active_citizen_id", id);
    } else {
      localStorage.removeItem("qc_active_citizen_id");
    }
  } catch (e) {
    console.warn("Storage error:", e);
  }
}

export function useCitizenProfile() {
  return useQuery({
    queryKey: ["citizen-profile", activeCitizenId],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const currentId = getStoredCitizenId();
      if (!currentId) return null;
      const citizen = MOCK_CITIZENS.find((c) => c.id === currentId);
      return citizen || MOCK_CITIZENS[0];
    },
  });
}

export function useCitizenAuth() {
  const qc = useQueryClient();
  const [currentId, setCurrentId] = useState<string | null>(getStoredCitizenId());

  useEffect(() => {
    setCurrentId(getStoredCitizenId());
  }, []);

  const citizen = MOCK_CITIZENS.find((c) => c.id === currentId) || null;
  const isAuthenticated = !!citizen;

  const login = async (email: string) => {
    await new Promise((r) => setTimeout(r, 500));
    const cleanEmail = email.trim().toLowerCase();
    let found = MOCK_CITIZENS.find((c) => c.email.toLowerCase() === cleanEmail);

    if (!found) {
      // Auto-create citizen profile for any new valid email login
      const namePart = cleanEmail.split("@")[0].replace(".", " ");
      const formattedName = namePart
        .split(" ")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ");

      found = {
        id: `CZT-${Math.floor(1000 + Math.random() * 9000)}`,
        fullName: formattedName || "Registered Citizen",
        email: cleanEmail,
        address: "Barangay Culiat, Quezon City",
        vehicles: [
          { id: `v-${Date.now()}`, plateNumber: "QC-2026", makeModel: "Registered Vehicle", type: "Sedan", status: "verified" },
        ],
        citations: [],
      };
      MOCK_CITIZENS.push(found);
    }

    setStoredCitizenId(found.id);
    setCurrentId(found.id);
    qc.invalidateQueries({ queryKey: ["citizen-profile"] });
    return found;
  };

  const signup = async (input: SignUpCitizenInput) => {
    await new Promise((r) => setTimeout(r, 600));
    const cleanEmail = input.email.trim().toLowerCase();

    const existing = MOCK_CITIZENS.find((c) => c.email.toLowerCase() === cleanEmail);
    if (existing) {
      setStoredCitizenId(existing.id);
      setCurrentId(existing.id);
      qc.invalidateQueries({ queryKey: ["citizen-profile"] });
      return existing;
    }

    const newCitizen: CitizenProfile = {
      id: `CZT-${Math.floor(1000 + Math.random() * 9000)}`,
      fullName: input.fullName.trim(),
      email: cleanEmail,
      phone: input.phone || undefined,
      address: input.address || "Barangay Culiat, Quezon City",
      vehicles: input.plateNumber
        ? [
            {
              id: `v-${Date.now()}`,
              plateNumber: input.plateNumber.toUpperCase().trim(),
              makeModel: input.makeModel || "Standard Vehicle",
              type: input.vehicleType || "Sedan",
              status: "verified",
            },
          ]
        : [],
      citations: [],
    };

    MOCK_CITIZENS.unshift(newCitizen);
    setStoredCitizenId(newCitizen.id);
    setCurrentId(newCitizen.id);
    qc.invalidateQueries({ queryKey: ["citizen-profile"] });
    return newCitizen;
  };

  const logout = () => {
    setStoredCitizenId(null);
    setCurrentId(null);
    qc.invalidateQueries({ queryKey: ["citizen-profile"] });
  };

  return {
    citizen,
    isAuthenticated,
    login,
    signup,
    logout,
  };
}

export function useAddCitizenVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { plateNumber: string; makeModel: string; type: string }) => {
      await new Promise((r) => setTimeout(r, 400));
      const currentId = getStoredCitizenId();
      const citizen = MOCK_CITIZENS.find((c) => c.id === currentId);
      if (!citizen) throw new Error("Not authenticated");

      const newVehicle: CitizenVehicle = {
        id: `v-${Date.now()}`,
        plateNumber: input.plateNumber.toUpperCase().trim(),
        makeModel: input.makeModel,
        type: input.type,
        status: "verified",
      };

      citizen.vehicles.push(newVehicle);
      return newVehicle;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["citizen-profile"] });
    },
  });
}
