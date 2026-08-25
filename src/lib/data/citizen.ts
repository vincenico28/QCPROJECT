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

let inMemoryCitizens: CitizenProfile[] = [];
let inMemoryActiveId: string | null = null;

function loadCitizensFromStorage(): CitizenProfile[] {
  if (typeof window === "undefined") return inMemoryCitizens;
  try {
    const raw = localStorage.getItem("qc_citizens_db");
    if (raw) {
      inMemoryCitizens = JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Error reading citizens DB from storage:", err);
  }
  return inMemoryCitizens;
}

function saveCitizensToStorage(list: CitizenProfile[]) {
  inMemoryCitizens = list;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("qc_citizens_db", JSON.stringify(list));
  } catch (err) {
    console.warn("Error saving citizens DB:", err);
  }
}

export function getStoredCitizenId(): string | null {
  if (typeof window === "undefined") return inMemoryActiveId;
  try {
    const saved = localStorage.getItem("qc_active_citizen_id");
    return saved || inMemoryActiveId;
  } catch {
    return inMemoryActiveId;
  }
}

export function setStoredCitizenId(id: string | null) {
  inMemoryActiveId = id;
  if (typeof window === "undefined") return;
  try {
    if (id) {
      localStorage.setItem("qc_active_citizen_id", id);
    } else {
      localStorage.removeItem("qc_active_citizen_id");
    }
    // Broadcast event to notify all components
    window.dispatchEvent(new CustomEvent("qc-citizen-auth-change", { detail: id }));
  } catch (e) {
    console.warn("Storage error:", e);
  }
}

export function useCitizenProfile() {
  return useQuery({
    queryKey: ["citizen-profile"],
    queryFn: async () => {
      const currentId = getStoredCitizenId();
      if (!currentId) return null;
      const all = loadCitizensFromStorage();
      const citizen = all.find((c) => c.id === currentId);
      return citizen || null;
    },
  });
}

export function useCitizenAuth() {
  const qc = useQueryClient();
  const [currentId, setCurrentId] = useState<string | null>(getStoredCitizenId());

  useEffect(() => {
    const syncState = () => {
      const id = getStoredCitizenId();
      setCurrentId(id);
      qc.invalidateQueries({ queryKey: ["citizen-profile"] });
    };

    window.addEventListener("qc-citizen-auth-change", syncState);
    window.addEventListener("storage", syncState);

    // Initial sync
    syncState();

    return () => {
      window.removeEventListener("qc-citizen-auth-change", syncState);
      window.removeEventListener("storage", syncState);
    };
  }, [qc]);

  const allCitizens = loadCitizensFromStorage();
  const citizen = allCitizens.find((c) => c.id === currentId) || null;
  const isAuthenticated = !!citizen;

  const login = async (email: string) => {
    await new Promise((r) => setTimeout(r, 300));
    const cleanEmail = email.trim().toLowerCase();
    const all = loadCitizensFromStorage();
    let found = all.find((c) => c.email.toLowerCase() === cleanEmail);

    if (!found) {
      // Auto-create citizen profile for valid email login
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
          {
            id: `v-${Date.now()}`,
            plateNumber: "NDB-8921",
            makeModel: "Registered Vehicle",
            type: "Sedan",
            status: "verified",
          },
        ],
        citations: [],
      };
      all.push(found);
      saveCitizensToStorage(all);
    }

    setStoredCitizenId(found.id);
    setCurrentId(found.id);
    await qc.invalidateQueries({ queryKey: ["citizen-profile"] });
    return found;
  };

  const signup = async (input: SignUpCitizenInput) => {
    await new Promise((r) => setTimeout(r, 400));
    const cleanEmail = input.email.trim().toLowerCase();
    const all = loadCitizensFromStorage();

    const existing = all.find((c) => c.email.toLowerCase() === cleanEmail);
    if (existing) {
      setStoredCitizenId(existing.id);
      setCurrentId(existing.id);
      await qc.invalidateQueries({ queryKey: ["citizen-profile"] });
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

    all.unshift(newCitizen);
    saveCitizensToStorage(all);

    setStoredCitizenId(newCitizen.id);
    setCurrentId(newCitizen.id);
    await qc.invalidateQueries({ queryKey: ["citizen-profile"] });
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
      await new Promise((r) => setTimeout(r, 300));
      const currentId = getStoredCitizenId();
      const all = loadCitizensFromStorage();
      const citizen = all.find((c) => c.id === currentId);
      if (!citizen) throw new Error("Not authenticated");

      const newVehicle: CitizenVehicle = {
        id: `v-${Date.now()}`,
        plateNumber: input.plateNumber.toUpperCase().trim(),
        makeModel: input.makeModel,
        type: input.type,
        status: "verified",
      };

      citizen.vehicles.push(newVehicle);
      saveCitizensToStorage(all);
      return newVehicle;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["citizen-profile"] });
    },
  });
}
