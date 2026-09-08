import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { serverSaveCitizenReport, serverFetchCitizenReports, serverUpdateCitationStatus } from "@/lib/server.functions";
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
      if (!citizen) return null;

      // Realtime command center sync for all registered plates:
      if (citizen.vehicles && citizen.vehicles.length > 0) {
        try {
          const plates = citizen.vehicles.map((v) => v.plateNumber.toUpperCase().trim());
          const { data: cmdCitations } = await supabase
            .from("citations")
            .select("*")
            .in("plate_number", plates);

          if (cmdCitations && cmdCitations.length > 0) {
            if (!citizen.citations) citizen.citations = [];
            let updated = false;

            for (const cmd of cmdCitations) {
              const cleanPlate = cmd.plate_number.toUpperCase().trim();
              const isPaid = cmd.status === "paid" || cmd.status === "settled";
              const existing = citizen.citations.find(
                (c) => c.novNumber === cmd.citation_number || c.id === cmd.id
              );

              if (!existing) {
                updated = true;
                citizen.citations.unshift({
                  id: cmd.id,
                  novNumber: cmd.citation_number,
                  plateNumber: cleanPlate,
                  violation: cmd.offense,
                  ordinanceCode: "QC Traffic Ordinance SP-2938 / MMDA NCAP",
                  location: "Quezon City Active Corridor (Captured by Optical Sentinel)",
                  date: cmd.issued_at,
                  dueDate: new Date(new Date(cmd.issued_at).getTime() + 10 * 86400000).toISOString(),
                  amount: Number(cmd.amount) || 2000,
                  surcharge: 0,
                  status: isPaid ? "settled" : "unpaid",
                  ltoAlarmStatus: isPaid ? "CLEARED" : "WARNING_DUE_SOON",
                  evidenceFrames: [
                    {
                      url: "/assets/violation-1.jpg",
                      label: `Optical Sentinel Capture: ${cmd.offense}`,
                      timestamp: new Date(cmd.issued_at).toLocaleTimeString(),
                    },
                    {
                      url: "/assets/violation-2.jpg",
                      label: `ANPR Plate Confirmation: ${cleanPlate}`,
                      timestamp: "Confidence 99.4%",
                    },
                  ],
                });
              } else {
                if (isPaid && existing.status !== "settled") {
                  existing.status = "settled";
                  existing.ltoAlarmStatus = "CLEARED";
                  updated = true;
                }
              }
            }

            // Sync vehicles LTO alarm statuses
            citizen.vehicles.forEach((v) => {
              const hasUnpaid = citizen.citations.some(
                (c) => c.plateNumber === v.plateNumber && c.status === "unpaid"
              );
              v.ltoAlarmStatus = hasUnpaid ? "WARNING_DUE_SOON" : "CLEARED";
            });

            if (updated) {
              saveCitizensToStorage(all);
            }
          }
        } catch (err) {
          console.warn("Background command center citations sync:", err);
        }
      }

      return citizen;
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
    await new Promise((r) => setTimeout(r, 200));
    const cleanEmail = email.trim().toLowerCase();
    const all = loadCitizensFromStorage();
    let found = all.find((c) => c.email.toLowerCase() === cleanEmail);

    if (!found) {
      const namePart = cleanEmail.split("@")[0].replace(".", " ");
      const formattedName = namePart
        .split(" ")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ");

      const sampleNov = `NOV-2026-QC-${Math.floor(10000 + Math.random() * 89999)}`;
      const sampleCert = `MMDA-QC-CLR-${Math.floor(10000 + Math.random() * 89999)}`;

      found = {
        id: `CZT-${Math.floor(1000 + Math.random() * 9000)}`,
        fullName: formattedName || "Registered Citizen",
        email: cleanEmail,
        address: "Barangay Culiat, Quezon City",
        tokens: 850,
        driverLicenseNumber: `N02-${Math.floor(10 + Math.random() * 89)}-${Math.floor(100000 + Math.random() * 899999)}`,
        vehicles: [
          {
            id: `v-${Date.now()}`,
            plateNumber: "NDB-8921",
            makeModel: "Toyota Corolla Cross 2023",
            type: "SUV",
            status: "verified",
            ltoExpiry: "2027-03-15",
            ltoAlarmStatus: "WARNING_DUE_SOON",
            emissionValid: true,
            clearanceValid: true,
          },
        ],
        citations: [
          {
            id: "CIT-00135",
            novNumber: sampleNov,
            plateNumber: "NDB-8921",
            violation: "Red Light / Beating the Traffic Signal",
            ordinanceCode: "MMDA Reg. 16-002 / QC Ord. SP-2938",
            location: "Commonwealth Ave — Tandang Sora Intersection (Cam #04)",
            date: new Date(Date.now() - 3 * 86400000).toISOString(),
            dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
            amount: 2000,
            surcharge: 0,
            status: "unpaid",
            ltoAlarmStatus: "WARNING_DUE_SOON",
            evidenceFrames: [
              {
                url: "/assets/violation-1.jpg",
                label: "Frame 01: Vehicle approaching intersection on Amber light (38 km/h)",
                timestamp: "T-2.1s before red signal",
              },
              {
                url: "/assets/violation-2.jpg",
                label: "Frame 02: Full intersection crossing after 1.8s Red Phase",
                timestamp: "T+1.8s active red light",
              },
              {
                url: "/assets/violation-3.jpg",
                label: "Frame 03: Optical Character ANPR Plate Verification (NDB-8921)",
                timestamp: "Confidence: 99.4%",
              },
            ],
            clearanceCertNumber: sampleCert,
          },
        ],
        vouchers: [],
        hazards: [],
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
    await new Promise((r) => setTimeout(r, 300));
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
      tokens: 1000,
      driverLicenseNumber: input.driverLicenseNumber || `N02-${Math.floor(10 + Math.random() * 89)}-${Math.floor(100000 + Math.random() * 899999)}`,
      vehicles: input.plateNumber
        ? [
            {
              id: `v-${Date.now()}`,
              plateNumber: input.plateNumber.toUpperCase().trim(),
              makeModel: input.makeModel || "Standard Vehicle",
              type: input.vehicleType || "Sedan",
              status: "verified",
              ltoExpiry: "2027-08-20",
              ltoAlarmStatus: "CLEARED",
              emissionValid: true,
              clearanceValid: true,
            },
          ]
        : [],
      citations: [],
      vouchers: [],
      hazards: [],
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

export function useCitizenHazardReports() {
  const { citizen } = useCitizenAuth();
  
  return useQuery({
    queryKey: ["citizen-hazard-reports", citizen?.id],
    queryFn: async () => {
      try {
        const rows = await serverFetchCitizenReports();
        if (rows) {
          // Filter by the current citizen's name (since we don't have a real citizen_id in the hazard_reports table yet)
          // In a real app, hazard_reports would have a citizen_id foreign key.
          return rows.filter((r: any) => r.reporter_name === citizen?.fullName).map((row: any) => ({
            id: row.id,
            category: row.category,
            location: row.location,
            description: row.description,
            reportedAt: row.created_at,
            status: row.status,
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
      await new Promise((r) => setTimeout(r, 200));
      const currentId = getStoredCitizenId();
      const all = loadCitizensFromStorage();
      const citizen = all.find((c) => c.id === currentId);
      if (!citizen) throw new Error("Not authenticated");

      const cleanPlate = input.plateNumber.toUpperCase().trim();
      const newVehicle: CitizenVehicle = {
        id: `v-${Date.now()}`,
        plateNumber: cleanPlate,
        makeModel: input.makeModel.trim(),
        type: input.type,
        status: "verified",
        ltoExpiry: "2027-11-30",
        ltoAlarmStatus: "CLEARED",
        emissionValid: true,
        clearanceValid: true,
      };

      if (!citizen.vehicles) citizen.vehicles = [];
      const existingIdx = citizen.vehicles.findIndex((v) => v.plateNumber === cleanPlate);
      if (existingIdx >= 0) {
        citizen.vehicles[existingIdx] = newVehicle;
      } else {
        citizen.vehicles.push(newVehicle);
      }

      // Sync with command center: inspect citations for this plate
      try {
        const { data: cmdCitations } = await supabase
          .from("citations")
          .select("*")
          .eq("plate_number", cleanPlate);

        if (cmdCitations && cmdCitations.length > 0) {
          if (!citizen.citations) citizen.citations = [];
          let hasUnpaid = false;

          for (const cmd of cmdCitations) {
            const isPaid = cmd.status === "paid" || cmd.status === "settled";
            if (!isPaid) hasUnpaid = true;
            const existing = citizen.citations.find(
              (c) => c.novNumber === cmd.citation_number || c.id === cmd.id
            );

            if (!existing) {
              citizen.citations.unshift({
                id: cmd.id,
                novNumber: cmd.citation_number,
                plateNumber: cleanPlate,
                violation: cmd.offense,
                ordinanceCode: "QC Traffic Ordinance SP-2938 / MMDA NCAP",
                location: "Quezon City Active Corridor (Captured by Optical Sentinel)",
                date: cmd.issued_at,
                dueDate: new Date(new Date(cmd.issued_at).getTime() + 10 * 86400000).toISOString(),
                amount: Number(cmd.amount) || 2000,
                surcharge: 0,
                status: isPaid ? "settled" : "unpaid",
                ltoAlarmStatus: isPaid ? "CLEARED" : "WARNING_DUE_SOON",
                evidenceFrames: [
                  {
                    url: "/assets/violation-1.jpg",
                    label: `Optical Sentinel Capture: ${cmd.offense}`,
                    timestamp: new Date(cmd.issued_at).toLocaleTimeString(),
                  },
                  {
                    url: "/assets/violation-2.jpg",
                    label: `ANPR Plate Confirmation: ${cleanPlate}`,
                    timestamp: "Confidence 99.4%",
                  },
                ],
              });
            }
          }

          if (hasUnpaid) {
            newVehicle.ltoAlarmStatus = "WARNING_DUE_SOON";
          }
        }
      } catch (err) {
        console.warn("Could not query command center citations for plate:", err);
      }

      saveCitizensToStorage(all);
      return newVehicle;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["citizen-profile"] });
    },
  });
}

export function useRemoveCitizenVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vehicleId: string) => {
      await new Promise((r) => setTimeout(r, 200));
      const currentId = getStoredCitizenId();
      const all = loadCitizensFromStorage();
      const citizen = all.find((c) => c.id === currentId);
      if (!citizen) throw new Error("Not authenticated");

      citizen.vehicles = citizen.vehicles.filter((v) => v.id !== vehicleId);
      saveCitizensToStorage(all);
      return vehicleId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["citizen-profile"] });
    },
  });
}

export function useSettleCitizenCitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (citationId: string) => {
      await new Promise((r) => setTimeout(r, 300));
      const currentId = getStoredCitizenId();
      const all = loadCitizensFromStorage();
      const citizen = all.find((c) => c.id === currentId);
      if (!citizen) throw new Error("Not authenticated");

      const citation = citizen.citations.find((c) => c.id === citationId || c.novNumber === citationId);
      const clearanceCert = `MMDA-QC-CLR-${Math.floor(10000 + Math.random() * 89999)}`;

      if (citation) {
        citation.status = "settled";
        citation.ltoAlarmStatus = "CLEARED";
        citation.clearanceCertNumber = clearanceCert;
      }

      // Update vehicle alarm status
      if (citation && citizen.vehicles) {
        const vehicle = citizen.vehicles.find((v) => v.plateNumber === citation.plateNumber);
        if (vehicle) {
          const remainingUnpaidForPlate = citizen.citations.some(
            (c) => c.plateNumber === citation.plateNumber && c.status === "unpaid" && c.id !== citationId && c.novNumber !== citationId
          );
          if (!remainingUnpaidForPlate) {
            vehicle.ltoAlarmStatus = "CLEARED";
          }
        }
      }

      saveCitizensToStorage(all);

      // FULL SYNC WITH COMMAND CENTER DATABASE:
      try {
        const refNumber = citation?.novNumber || citationId;
        await serverUpdateCitationStatus({
          data: {
            citationNumber: refNumber,
            status: "paid",
          },
        });

        // Create official audit log
        await supabase.from("audit_logs").insert({
          actor_name: citizen.fullName,
          actor_role: "citizen",
          action: "CITIZEN_CITATION_SETTLED_ONLINE",
          target_resource: `Notice: ${refNumber} (${citation?.plateNumber})`,
          details: `Amount: PHP ${citation?.amount || 2000}, Status: CLEARED, Cert: ${clearanceCert}`,
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
    },
  });
}

export function useNominateActualDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ citationId, name, licenseNumber }: { citationId: string; name: string; licenseNumber: string }) => {
      await new Promise((r) => setTimeout(r, 300));
      const currentId = getStoredCitizenId();
      const all = loadCitizensFromStorage();
      const citizen = all.find((c) => c.id === currentId);
      if (!citizen) throw new Error("Not authenticated");

      const citation = citizen.citations.find((c) => c.id === citationId);
      if (!citation) throw new Error("Citation not found");

      citation.nominatedDriver = {
        name,
        licenseNumber,
        submittedAt: new Date().toISOString(),
      };
      citation.status = "appealed";

      saveCitizensToStorage(all);
      return citation;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["citizen-profile"] });
    },
  });
}

export function useRedeemEcoReward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ title, description, cost }: { title: string; description: string; cost: number }) => {
      await new Promise((r) => setTimeout(r, 250));
      const currentId = getStoredCitizenId();
      const all = loadCitizensFromStorage();
      const citizen = all.find((c) => c.id === currentId);
      if (!citizen) throw new Error("Not authenticated");
      if (citizen.tokens < cost) throw new Error("Insufficient Eco-Reward tokens");

      citizen.tokens -= cost;
      const voucher: CitizenVoucher = {
        id: `VCH-${Date.now()}`,
        code: `QC-ECO-${Math.floor(1000 + Math.random() * 9000)}`,
        title,
        description,
        cost,
        claimedAt: new Date().toISOString(),
        status: "active",
      };

      if (!citizen.vouchers) citizen.vouchers = [];
      citizen.vouchers.unshift(voucher);
      saveCitizensToStorage(all);
      return voucher;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["citizen-profile"] });
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
      if (!citizen) throw new Error("Not authenticated");

      const row = await serverSaveCitizenReport({
        data: {
          reporter_name: citizen.fullName,
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
      
      // Give 50 eco-reward tokens for reporting traffic hazards
      citizen.tokens = (citizen.tokens || 0) + 50;
      saveCitizensToStorage(all);

      try {
        const { supabase } = await import("@/integrations/supabase/client");
        await supabase.from("audit_logs").insert({
          actor_name: citizen.fullName,
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
    },
  });
}
