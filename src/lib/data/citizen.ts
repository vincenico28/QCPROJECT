import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  serverSaveCitizenReport,
  serverFetchCitizenReports,
  serverUpdateCitationStatus,
  serverFetchCitizenProfile,
  serverSaveCitizenProfile,
  serverAddCitizenVehicle,
  serverRemoveCitizenVehicle,
  serverRedeemCitizenVoucher,
  serverSubmitDriverNomination,
} from "@/lib/server.functions";
import { supabase } from "@/integrations/supabase/client";

export type EvidenceFrame = {
  url: string;
  label: string;
  timestamp: string;
};

export type CitizenVehicle = {
  id: string;
  plateNumber: string;
  makeModel: string;
  type: string;
  status: "verified" | "pending";
  ltoExpiry?: string;
  ltoAlarmStatus: "CLEARED" | "WARNING_DUE_SOON" | "LTO_ALARM_ACTIVE";
  emissionValid?: boolean;
  clearanceValid?: boolean;
};

export type CitizenCitation = {
  id: string;
  novNumber: string;
  plateNumber: string;
  violation: string;
  ordinanceCode: string;
  location: string;
  date: string;
  dueDate: string;
  amount: number;
  surcharge: number;
  status: "unpaid" | "settled" | "appealed";
  ltoAlarmStatus: "CLEARED" | "WARNING_DUE_SOON" | "LTO_ALARM_ACTIVE";
  evidenceFrames: EvidenceFrame[];
  nominatedDriver?: {
    name: string;
    licenseNumber: string;
    submittedAt: string;
  };
  clearanceCertNumber?: string;
};

export type CitizenVoucher = {
  id: string;
  code: string;
  title: string;
  description: string;
  cost: number;
  claimedAt: string;
  status: "active" | "used";
};

export type CitizenHazardReport = {
  id: string;
  category: "Stalled Vehicle" | "Accident / Collision" | "Broken Traffic Light" | "Flooding / Obstruction" | "Illegal Parking";
  location: string;
  description: string;
  reportedAt: string;
  status: "Under Review" | "Officer Dispatched" | "Resolved";
};

export type CitizenProfile = {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  address: string;
  tokens: number;
  driverLicenseNumber?: string;
  vehicles: CitizenVehicle[];
  citations: CitizenCitation[];
  vouchers: CitizenVoucher[];
  hazards: CitizenHazardReport[];
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
  driverLicenseNumber?: string;
};

let inMemoryCitizens: CitizenProfile[] = [];
let inMemoryActiveId: string | null = null;
const DEFAULT_DEMO_CITIZEN_ID = "a0000000-0000-0000-0000-000000000001";

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
  if (typeof window === "undefined") return inMemoryActiveId || DEFAULT_DEMO_CITIZEN_ID;
  try {
    const saved = localStorage.getItem("qc_active_citizen_id");
    if (saved === "LOGGED_OUT") return null;
    return saved || inMemoryActiveId || DEFAULT_DEMO_CITIZEN_ID;
  } catch {
    return inMemoryActiveId || DEFAULT_DEMO_CITIZEN_ID;
  }
}

export function setStoredCitizenId(id: string | null) {
  inMemoryActiveId = id;
  if (typeof window === "undefined") return;
  try {
    if (id) {
      localStorage.setItem("qc_active_citizen_id", id);
    } else {
      localStorage.setItem("qc_active_citizen_id", "LOGGED_OUT");
    }
    // Broadcast event to notify all components
    window.dispatchEvent(new CustomEvent("qc-citizen-auth-change", { detail: id }));
  } catch (e) {
    console.warn("Storage error:", e);
  }
}

export function useCitizenProfile() {
  const qc = useQueryClient();

  useEffect(() => {
    try {
      const channel = supabase
        .channel("realtime-citizen-sync")
        .on("postgres_changes", { event: "*", schema: "public", table: "citations" }, () => {
          qc.invalidateQueries({ queryKey: ["citizen-profile"] });
          qc.invalidateQueries({ queryKey: ["citations"] });
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "citizen_vehicles" }, () => {
          qc.invalidateQueries({ queryKey: ["citizen-profile"] });
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "citizen_profiles" }, () => {
          qc.invalidateQueries({ queryKey: ["citizen-profile"] });
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "citizen_vouchers" }, () => {
          qc.invalidateQueries({ queryKey: ["citizen-profile"] });
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "hazard_reports" }, () => {
          qc.invalidateQueries({ queryKey: ["citizen-profile"] });
          qc.invalidateQueries({ queryKey: ["citizen-hazard-reports"] });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn("Citizen Realtime Channel Error:", err);
    }
  }, [qc]);

  return useQuery({
    queryKey: ["citizen-profile"],
    queryFn: async () => {
      const currentId = getStoredCitizenId();
      if (!currentId) return null;

      try {
        const remote = await serverFetchCitizenProfile({ data: { id: currentId } });
        if (remote) {
          const all = loadCitizensFromStorage();
          const idx = all.findIndex((c) => c.id === remote.id);
          if (idx >= 0) all[idx] = remote as CitizenProfile;
          else all.unshift(remote as CitizenProfile);
          saveCitizensToStorage(all);
          return remote as CitizenProfile;
        }
      } catch (err) {
        console.warn("Failed to fetch remote citizen profile, using local cache:", err);
      }

      const all = loadCitizensFromStorage();
      return all.find((c) => c.id === currentId) || null;
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

    syncState();

    return () => {
      window.removeEventListener("qc-citizen-auth-change", syncState);
      window.removeEventListener("storage", syncState);
    };
  }, [qc]);

  const allCitizens = loadCitizensFromStorage();
  const citizen = allCitizens.find((c) => c.id === currentId) || null;
  const isAuthenticated = !!currentId && currentId !== "LOGGED_OUT";

  const login = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const remote = await serverFetchCitizenProfile({ data: { email: cleanEmail } });
      if (remote) {
        setStoredCitizenId(remote.id);
        setCurrentId(remote.id);
        await qc.invalidateQueries({ queryKey: ["citizen-profile"] });
        return remote as CitizenProfile;
      }
    } catch (err) {
      console.warn("Remote login check error:", err);
    }

    const namePart = cleanEmail.split("@")[0].replace(".", " ");
    const formattedName =
      namePart
        .split(" ")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ") || "Registered Citizen";

    const saved = await serverSaveCitizenProfile({
      data: {
        fullName: formattedName,
        email: cleanEmail,
        address: "Barangay Culiat, Quezon City",
        tokens: 850,
        driverLicenseNumber: `N02-${Math.floor(10 + Math.random() * 89)}-${Math.floor(100000 + Math.random() * 899999)}`,
      },
    });

    const citizenId = saved?.id || `CZT-${Math.floor(1000 + Math.random() * 9000)}`;
    setStoredCitizenId(citizenId);
    setCurrentId(citizenId);
    await qc.invalidateQueries({ queryKey: ["citizen-profile"] });

    const fresh = await serverFetchCitizenProfile({ data: { id: citizenId } });
    return fresh as CitizenProfile;
  };

  const signup = async (input: SignUpCitizenInput) => {
    const cleanEmail = input.email.trim().toLowerCase();
    const saved = await serverSaveCitizenProfile({
      data: {
        fullName: input.fullName.trim(),
        email: cleanEmail,
        phone: input.phone,
        address: input.address || "Barangay Culiat, Quezon City",
        tokens: 1000,
        driverLicenseNumber: input.driverLicenseNumber || `N02-${Math.floor(10 + Math.random() * 89)}-${Math.floor(100000 + Math.random() * 899999)}`,
      },
    });

    const citizenId = saved.id;
    if (input.plateNumber) {
      try {
        await serverAddCitizenVehicle({
          data: {
            citizen_id: citizenId,
            plate_number: input.plateNumber,
            make_model: input.makeModel || "Standard Vehicle",
            vehicle_type: input.vehicleType || "Sedan",
          },
        });
      } catch (err) {
        console.warn("Failed registering initial vehicle in database:", err);
      }
    }

    setStoredCitizenId(citizenId);
    setCurrentId(citizenId);
    await qc.invalidateQueries({ queryKey: ["citizen-profile"] });

    const fresh = await serverFetchCitizenProfile({ data: { id: citizenId } });
    return fresh as CitizenProfile;
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

export function useCitizenHazardReports() {
  const { citizen } = useCitizenAuth();

  return useQuery({
    queryKey: ["citizen-hazard-reports", citizen?.id],
    queryFn: async () => {
      try {
        const rows = await serverFetchCitizenReports();
        if (rows && rows.length > 0) {
          return rows.map((row: any) => ({
            id: row.id,
            category: row.category,
            location: row.location,
            description: row.description,
            reportedAt: row.created_at,
            status: row.status === "resolved" ? "Resolved" : row.status === "dispatched" ? "Officer Dispatched" : "Under Review",
          })) as CitizenHazardReport[];
        }
      } catch (err) {
        console.error("Error fetching hazard reports", err);
      }
      return citizen?.hazards || [];
    },
    enabled: !!citizen,
  });
}

export function useAddCitizenVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { plateNumber: string; makeModel: string; type: string }) => {
      const currentId = getStoredCitizenId();
      if (!currentId) throw new Error("Not authenticated");

      const cleanPlate = input.plateNumber.toUpperCase().trim();
      const res = await serverAddCitizenVehicle({
        data: {
          citizen_id: currentId,
          plate_number: cleanPlate,
          make_model: input.makeModel.trim(),
          vehicle_type: input.type,
        },
      });

      try {
        await supabase.from("audit_logs").insert({
          actor_name: "Citizen Portal",
          actor_role: "citizen",
          action: "CITIZEN_VEHICLE_REGISTERED",
          target_resource: `Plate: ${cleanPlate}`,
          details: `Make: ${input.makeModel}, Type: ${input.type}`,
        });
      } catch (err) {
        console.warn(err);
      }

      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["citizen-profile"] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["registered-vehicles"] });
      qc.invalidateQueries({ queryKey: ["command-dashboard-metrics"] });
    },
  });
}

export function useRemoveCitizenVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vehicleId: string) => {
      await serverRemoveCitizenVehicle({
        data: { vehicle_id: vehicleId },
      });
      return vehicleId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["citizen-profile"] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["registered-vehicles"] });
      qc.invalidateQueries({ queryKey: ["command-dashboard-metrics"] });
    },
  });
}

export function useSettleCitizenCitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (citationId: string) => {
      const clearanceCert = `MMDA-QC-CLR-${Math.floor(10000 + Math.random() * 89999)}`;

      await serverUpdateCitationStatus({
        data: {
          citationNumber: citationId,
          status: "paid",
        },
      });

      try {
        await supabase
          .from("citations")
          .update({ status: "paid" })
          .or(`id.eq.${citationId},citation_number.eq.${citationId}`);

        await supabase.from("audit_logs").insert({
          actor_name: "Citizen Online Settlement",
          actor_role: "citizen",
          action: "CITIZEN_CITATION_SETTLED_ONLINE",
          target_resource: `Notice: ${citationId}`,
          details: `Status: CLEARED, Clearance Certificate: ${clearanceCert}`,
        });
      } catch (err) {
        console.warn("Command center payment sync error:", err);
      }

      return citationId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["citizen-profile"] });
      qc.invalidateQueries({ queryKey: ["citations"] });
      qc.invalidateQueries({ queryKey: ["violations"] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["registered-vehicles"] });
      qc.invalidateQueries({ queryKey: ["command-dashboard-metrics"] });
    },
  });
}

export function useNominateActualDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ citationId, name, licenseNumber }: { citationId: string; name: string; licenseNumber: string }) => {
      const currentId = getStoredCitizenId();
      const res = await serverSubmitDriverNomination({
        data: {
          citation_id: citationId,
          citizen_id: currentId || undefined,
          nominee_name: name,
          nominee_license: licenseNumber,
        },
      });

      try {
        await supabase
          .from("citations")
          .update({ status: "contested" })
          .eq("id", citationId);

        await supabase.from("audit_logs").insert({
          actor_name: name,
          actor_role: "citizen",
          action: "DRIVER_NOMINATION_SUBMITTED",
          target_resource: `Citation: ${citationId}`,
          details: `Nominated Driver: ${name} (License: ${licenseNumber})`,
        });
      } catch (err) {
        console.warn(err);
      }

      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["citizen-profile"] });
      qc.invalidateQueries({ queryKey: ["citations"] });
      qc.invalidateQueries({ queryKey: ["command-dashboard-metrics"] });
    },
  });
}

export function useRedeemEcoReward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ title, description, cost }: { title: string; description: string; cost: number }) => {
      const currentId = getStoredCitizenId();
      if (!currentId) throw new Error("Not authenticated");

      const voucherCode = `QC-ECO-${Math.floor(1000 + Math.random() * 9000)}`;
      const res = await serverRedeemCitizenVoucher({
        data: {
          citizen_id: currentId,
          code: voucherCode,
          title,
          cost,
          description,
        },
      });

      try {
        await supabase.from("audit_logs").insert({
          actor_name: "Citizen",
          actor_role: "citizen",
          action: "ECO_REWARD_VOUCHER_REDEEMED",
          target_resource: `Voucher: ${voucherCode} (${title})`,
          details: `Cost: ${cost} tokens`,
        });
      } catch (err) {
        console.warn(err);
      }

      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["citizen-profile"] });
      qc.invalidateQueries({ queryKey: ["command-dashboard-metrics"] });
    },
  });
}

export function useSubmitHazardReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { category: CitizenHazardReport["category"]; location: string; description: string }) => {
      const currentId = getStoredCitizenId();
      const all = loadCitizensFromStorage();
      const citizen = all.find((c) => c.id === currentId);

      const reporterName = citizen?.fullName || "Verified Citizen";
      const row = await serverSaveCitizenReport({
        data: {
          reporter_name: reporterName,
          category: input.category,
          location: input.location,
          description: input.description,
        },
      });

      const report: CitizenHazardReport = {
        id: (row as any)?.id || `RPT-${Math.floor(1000 + Math.random() * 9000)}`,
        category: input.category,
        location: input.location,
        description: input.description,
        reportedAt: (row as any)?.created_at || new Date().toISOString(),
        status: (row as any)?.status || "Under Review",
      };

      try {
        const { supabase } = await import("@/integrations/supabase/client");
        await supabase.from("audit_logs").insert({
          actor_name: reporterName,
          actor_role: "citizen",
          action: "CITIZEN_HAZARD_REPORT_SUBMITTED",
          target_resource: input.category,
          details: `Location: ${input.location}, Description: ${input.description}`,
        });
      } catch (err) {
        console.warn(err);
      }

      return report;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["citizen-hazard-reports"] });
      qc.invalidateQueries({ queryKey: ["citizen-profile"] });
      qc.invalidateQueries({ queryKey: ["command-dashboard-metrics"] });
    },
  });
}
