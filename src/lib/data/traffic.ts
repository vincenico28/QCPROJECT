import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  serverFetchViolations,
  serverSaveViolation,
  serverUpdateViolationStatus,
  serverFetchCitations,
  serverFetchCitationById,
  serverSaveCitation,
  serverUpdateCitationStatus,
  serverFetchOfficers,
  serverSaveOfficer,
  serverToggleOfficerDuty,
  serverFetchCameras,
  serverSaveCamera,
  serverUpdateCamera,
  serverFetchCommandDashboardMetrics,
  serverRegisterVehicle,
  serverFetchRegisteredVehicles,
  serverLookupVehicleDetails,
  type RegisteredVehicleRecord,
  type VehicleLookupResult,
} from "@/lib/server.functions";

export type Violation = {
  id: string;
  plate_number: string;
  violation_type: string;
  location: string;
  confidence: number;
  status: string;
  evidence_url: string | null;
  ai_detected: boolean;
  camera_code: string | null;
  detected_at: string;
};

export type Citation = {
  id: string;
  citation_number: string;
  violation_id: string | null;
  plate_number: string;
  vehicle_model: string | null;
  offense: string;
  amount: number;
  status: string;
  officer_name: string | null;
  evidence_url?: string | null;
  issued_at: string;
  isCitizenRegistered?: boolean;
  citizenName?: string;
  citizenEmail?: string;
  citizenPhone?: string;
  registeredOwner?: string;
  location?: string;
  ltoAlarmTagged?: boolean;
  riskLevel?: "Clean" | "Watch" | "Flagged" | "Blocked";
};

export type Camera = {
  id: string;
  code: string;
  location: string;
  status: string;
  lat: number | null;
  lng: number | null;
};

export type Officer = {
  id: string;
  badge_number: string;
  full_name: string;
  rank: string;
  unit: string;
  district: string;
  contact_number: string | null;
  status: string;
  on_duty: boolean;
  citations_issued: number;
};

export let MOCK_OFFICERS: Officer[] = [];

export function useOfficers() {
  const qc = useQueryClient();

  useEffect(() => {
    try {
      const channel = supabase
        .channel(`realtime-officers_${Math.random().toString(36).substring(2, 9)}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "officers" }, () => {
          qc.invalidateQueries({ queryKey: ["officers"] });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch {
      // Supabase realtime fallback
    }
  }, [qc]);

  return useQuery({
    queryKey: ["officers"],
    queryFn: async () => {
      try {
        const rows = await serverFetchOfficers();
        return (rows as Officer[]) || [];
      } catch {
        return [];
      }
    },
  });
}

export function useAddOfficer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      full_name: string;
      badge_number: string;
      rank: string;
      unit: string;
      district: string;
      contact_number?: string;
    }) => {
      return await serverSaveOfficer({ data: input });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["officers"] });
    },
  });
}

export function useToggleOfficerDuty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, currentDuty }: { id: string, currentDuty: boolean }) => {
      await serverToggleOfficerDuty({ data: { id, on_duty: !currentDuty } });

      try {
        await supabase.from("audit_logs").insert({
          actor_name: "Enforcer Dispatch System",
          actor_role: "officer",
          action: !currentDuty ? "OFFICER_STATUS_ON_DUTY" : "OFFICER_STATUS_OFF_DUTY",
          target_resource: `Officer ID: ${id}`,
          details: `Shift status changed to ${!currentDuty ? "ON DUTY (ACTIVE PATROL)" : "OFF DUTY"}`,
        });
      } catch (err) {
        console.warn(err);
      }

      return { id, on_duty: !currentDuty };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["officers"] });
    },
  });
}

export let MOCK_VIOLATIONS: Violation[] = [];

export function useViolations(limit = 500) {
  const qc = useQueryClient();

  useEffect(() => {
    try {
      const channel = supabase
        .channel(`realtime-violations_${Math.random().toString(36).substring(2, 9)}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "violations" }, () => {
          qc.invalidateQueries({ queryKey: ["violations"] });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch {
      // Realtime fallback
    }
  }, [qc]);

  return useQuery({
    queryKey: ["violations", limit],
    queryFn: async () => {
      // 1. Direct client Supabase query (fastest, direct DB stream, guaranteed delivery)
      try {
        const { data, error } = await supabase
          .from("violations")
          .select("*")
          .order("detected_at", { ascending: false })
          .limit(limit);
        if (!error && data && data.length > 0) {
          return data as Violation[];
        }
      } catch (err) {
        console.warn("[useViolations] Direct Supabase fetch warning, trying server function fallback:", err);
      }

      // 2. Server function fallback
      try {
        const rows = await serverFetchViolations({ data: Number(limit) || 500 });
        if (rows && rows.length > 0) return rows as Violation[];
      } catch {
        // fallback
      }
      return [];
    },
    staleTime: 5_000,
    refetchInterval: 15_000,
  });
}

export let MOCK_CITATIONS: Citation[] = [];

export function useCitations(limit = 500) {
  const qc = useQueryClient();

  useEffect(() => {
    try {
      const channel = supabase
        .channel(`realtime-citations_${Math.random().toString(36).substring(2, 9)}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "citations" }, () => {
          qc.invalidateQueries({ queryKey: ["citations"] });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch {
      // Realtime fallback
    }
  }, [qc]);

  return useQuery({
    queryKey: ["citations", limit],
    queryFn: async () => {
      // 1. Direct Supabase query with citizen profiles & vehicles cross-reference
      try {
        const [citsRes, cvRes, profRes, vehRes] = await Promise.all([
          supabase
            .from("citations")
            .select("*, violations(evidence_url, location, camera_code)")
            .order("issued_at", { ascending: false })
            .limit(limit),
          supabase.from("citizen_vehicles").select("*"),
          supabase.from("citizen_profiles").select("*"),
          supabase.from("vehicles").select("plate_number, registered_owner, risk_level, lto_alarm_tagged"),
        ]);

        if (!citsRes.error && citsRes.data && citsRes.data.length > 0) {
          const profileById = new Map<string, any>();
          for (const p of profRes.data || []) {
            profileById.set(p.id, p);
          }

          const citizenByPlate = new Map<string, any>();
          for (const cv of cvRes.data || []) {
            const norm = (cv.plate_number || "").replace(/[\s-]/g, "").toUpperCase();
            const prof = cv.citizen_id ? profileById.get(cv.citizen_id) : null;
            citizenByPlate.set(norm, { cv, prof });
          }

          const vehByPlate = new Map<string, any>();
          for (const v of vehRes.data || []) {
            const norm = (v.plate_number || "").replace(/[\s-]/g, "").toUpperCase();
            vehByPlate.set(norm, v);
          }

          const seenIds = new Set<string>();
          const seenCitationNumbers = new Set<string>();
          const uniqueList: any[] = [];

          for (const c of citsRes.data) {
            if (c.id && seenIds.has(c.id)) continue;
            if (c.citation_number && seenCitationNumbers.has(c.citation_number)) continue;
            if (c.id) seenIds.add(c.id);
            if (c.citation_number) seenCitationNumbers.add(c.citation_number);
            uniqueList.push(c);
          }

          return uniqueList.map((c: any) => {
            const normPlate = (c.plate_number || "").replace(/[\s-]/g, "").toUpperCase();
            const citizenMatch = citizenByPlate.get(normPlate);
            const vehMatch = vehByPlate.get(normPlate);

            return {
              ...c,
              location: c.violations?.location || c.location || "Commonwealth Ave",
              evidence_url: c.evidence_url || c.violations?.evidence_url || "/assets/violation-1.jpg",
              isCitizenRegistered: !!citizenMatch,
              citizenName: citizenMatch?.prof?.full_name || vehMatch?.registered_owner || undefined,
              citizenEmail: citizenMatch?.prof?.email || undefined,
              citizenPhone: citizenMatch?.prof?.phone || undefined,
              registeredOwner: vehMatch?.registered_owner || citizenMatch?.prof?.full_name || undefined,
              ltoAlarmTagged: vehMatch?.lto_alarm_tagged ?? false,
              riskLevel: (vehMatch?.risk_level as any) || "Clean",
            } as Citation;
          });
        }
      } catch (err) {
        console.warn("[useCitations] Direct Supabase fetch warning, trying server function fallback:", err);
      }

      // 2. Server function fallback
      try {
        const rows = await serverFetchCitations({ data: Number(limit) || 500 });
        if (rows && rows.length > 0) return rows as Citation[];
      } catch {
        // fallback
      }
      return [];
    },
    staleTime: 5_000,
  });
}

export function useCitation(citationNumber: string) {
  return useQuery({
    queryKey: ["citation", citationNumber],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("citations")
          .select("*, violations(evidence_url, location, camera_code)")
          .or(`citation_number.eq.${citationNumber},id.eq.${citationNumber}`)
          .maybeSingle();
        if (!error && data) return data as Citation;
      } catch {
        // fallback
      }
      try {
        const direct = await serverFetchCitationById({ data: citationNumber });
        if (direct) return direct as Citation;
      } catch {
        // fallback
      }
      try {
        const rows = await serverFetchCitations({ data: 100 });
        const found = rows?.find((c: any) => c.citation_number === citationNumber || c.id === citationNumber);
        if (found) return found as Citation;
      } catch {
        // fallback
      }
      throw new Error("Citation not found");
    },
    enabled: !!citationNumber,
  });
}


export type NewCitation = {
  violation_id?: string | null;
  plate_number: string;
  offense: string;
  amount: number;
  officer_name?: string | null;
  vehicle_model?: string | null;
  evidence_url?: string | null;
  location?: string | null;
};

export function useCreateCitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewCitation) => {
      let violationId = input.violation_id || null;
      if (!violationId && input.evidence_url) {
        try {
          const vio = await serverSaveViolation({
            data: {
              plate_number: input.plate_number,
              violation_type: input.offense,
              location: input.location || "Field Officer Apprehension Point",
              confidence: 100,
              camera_code: "FIELD-BODYCAM",
              ai_detected: false,
              evidence_url: input.evidence_url,
              status: "confirmed",
            },
          });
          violationId = vio.id;
        } catch (err) {
          console.warn("[Citation] Could not create linked violation record for evidence", err);
        }
      }

      const res = await serverSaveCitation({
        data: {
          violation_id: violationId,
          plate_number: input.plate_number,
          vehicle_model: input.vehicle_model || null,
          offense: input.offense,
          amount: input.amount,
          status: "unpaid",
          officer_name: input.officer_name || "QC Enforcer",
          evidence_url: input.evidence_url || null,
        },
      });

      try {
        await supabase.from("audit_logs").insert({
          actor_name: input.officer_name || "QC Enforcer",
          actor_role: "officer",
          action: "CITATION_ISSUED",
          target_resource: `Plate: ${input.plate_number}`,
          details: `Offense: ${input.offense}, Amount: PHP ${input.amount}, Vehicle: ${input.vehicle_model || "N/A"}`,
        });
      } catch (err) {
        console.warn(err);
      }

      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["citations"] });
      qc.invalidateQueries({ queryKey: ["violations"] });
    },
  });
}

export function useUpdateCitationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ citationId, status }: { citationId: string; status: string }) => {
      await serverUpdateCitationStatus({
        data: { citationNumber: citationId, status },
      });

      try {
        await supabase.from("audit_logs").insert({
          actor_name: "Adjudication Officer",
          actor_role: "admin",
          action: "CITATION_STATUS_UPDATED",
          target_resource: `Citation: ${citationId}`,
          details: `Status set to ${status.toUpperCase()}`,
        });
      } catch (err) {
        console.warn(err);
      }
    },
    onSuccess: (_, { citationId }) => {
      qc.invalidateQueries({ queryKey: ["citations"] });
      qc.invalidateQueries({ queryKey: ["citation", citationId] });
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["registered-vehicles"] });
      qc.invalidateQueries({ queryKey: ["citizen-vehicles"] });
      qc.invalidateQueries({ queryKey: ["finance-queue"] });
    },
  });
}

export let MOCK_CAMERAS: Camera[] = [];

export function useCameras() {
  const qc = useQueryClient();

  useEffect(() => {
    try {
      const channel = supabase
        .channel(`realtime-cameras_${Math.random().toString(36).substring(2, 9)}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "cameras" }, () => {
          qc.invalidateQueries({ queryKey: ["cameras"] });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch {
      // Realtime fallback
    }
  }, [qc]);

  return useQuery({
    queryKey: ["cameras"],
    queryFn: async () => {
      try {
        const rows = await serverFetchCameras();
        return (rows as Camera[]) || [];
      } catch {
        return [];
      }
    },
  });
}

export function useCreateCamera() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { location: string; lat?: number; lng?: number }) => {
      const code = `QC-CAM-${Math.floor(1000 + Math.random() * 9000)}`;
      const res = await serverSaveCamera({
        data: {
          code,
          location: input.location,
          lat: input.lat || 14.6563,
          lng: input.lng || 121.0697,
          status: "online",
        },
      });

      try {
        await supabase.from("audit_logs").insert({
          actor_name: "Grid Operations Engineer",
          actor_role: "admin",
          action: "CAMERA_NODE_DEPLOYED",
          target_resource: `Node: ${code}`,
          details: `Location: ${input.location} (Lat: ${input.lat || 14.6563}, Lng: ${input.lng || 121.0697})`,
        });
      } catch (err) {
        console.warn(err);
      }

      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cameras"] });
    },
  });
}

export function useUpdateCamera() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; status?: string; location?: string }) => {
      await serverUpdateCamera({ data: input });

      try {
        await supabase.from("audit_logs").insert({
          actor_name: "Grid Operations Engineer",
          actor_role: "admin",
          action: "CAMERA_NODE_UPDATED",
          target_resource: `Camera ID: ${input.id}`,
          details: `Status: ${input.status || "unchanged"}, Location: ${input.location || "unchanged"}`,
        });
      } catch (err) {
        console.warn(err);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cameras"] });
    },
  });
}

export function formatPeso(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export type CommandDashboardMetrics = {
  dailyViolations: number;
  totalViolations?: number;
  activeOfficers: number;
  totalOfficers: number;
  settlementRevenue: number;
  pendingCitations: number;
  activeCameras: number;
  totalCameras: number;
  cameras: Camera[];
  recentViolations: Violation[];
  recentCitations: Citation[];
};

export function useCommandDashboardMetrics() {
  const qc = useQueryClient();

  useEffect(() => {
    try {
      const channel = supabase
        .channel(`realtime-command-metrics_${Math.random().toString(36).substring(2, 9)}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "violations" }, () => {
          qc.invalidateQueries({ queryKey: ["command-dashboard-metrics"] });
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "citations" }, () => {
          qc.invalidateQueries({ queryKey: ["command-dashboard-metrics"] });
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "officers" }, () => {
          qc.invalidateQueries({ queryKey: ["command-dashboard-metrics"] });
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "cameras" }, () => {
          qc.invalidateQueries({ queryKey: ["command-dashboard-metrics"] });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch {
      // realtime fallback
    }
  }, [qc]);

  return useQuery({
    queryKey: ["command-dashboard-metrics"],
    queryFn: async (): Promise<CommandDashboardMetrics> => {
      // 1. Direct client Supabase query first for resilience, instant load, and zero drop
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayStartIso = todayStart.toISOString();

        const [vRes, cRes, oRes, camRes, allCitationsAggRes, todayVioCountRes] = await Promise.all([
          supabase.from("violations").select("id, status, confidence, detected_at, created_at, violation_type, location, plate_number, evidence_url, camera_code", { count: "exact" }).order("detected_at", { ascending: false }).limit(20),
          supabase.from("citations").select("id, citation_number, status, amount, issued_at, offense, plate_number, vehicle_model, officer_name", { count: "exact" }).order("issued_at", { ascending: false }).limit(25),
          supabase.from("officers").select("id, full_name, badge_number, rank, unit, district, on_duty, citations_issued"),
          supabase.from("cameras").select("*"),
          // Comprehensive dataset of all citations for accurate revenue & pending status aggregation
          supabase.from("citations").select("amount, status, issued_at"),
          // Exact count of violations captured today
          supabase.from("violations").select("id", { count: "exact", head: true }).gte("detected_at", todayStartIso),
        ]);

        if (!vRes.error && !cRes.error && ((vRes.data && vRes.data.length > 0) || (cRes.data && cRes.data.length > 0) || (allCitationsAggRes.data && allCitationsAggRes.data.length > 0))) {
          const violationsList = vRes.data || [];
          const citationsList = cRes.data || [];
          const officersList = oRes.data || [];
          const camerasList = camRes.data || [];
          const allCitations = allCitationsAggRes.data || [];

          const totalViolationsCount = vRes.count ?? violationsList.length;
          const todayViolationsCount = todayVioCountRes.count ?? violationsList.filter((v: any) => {
            const d = v.detected_at || v.created_at;
            return d && new Date(d) >= todayStart;
          }).length;

          const activeOfficers = officersList.filter((o: any) => o.on_duty !== false).length;
          const totalOfficers = officersList.length || 10;

          const settlementRevenue = allCitations
            .filter((c: any) => c.status === "paid" || c.status === "settled")
            .reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);

          const pendingCitations = allCitations
            .filter((c: any) => c.status === "unpaid" || c.status === "pending" || c.status === "issued" || c.status === "overdue" || c.status === "payment_pending").length;

          const activeCameras = camerasList.filter((c: any) => c.status !== "offline").length;

          return {
            dailyViolations: todayViolationsCount > 0 ? todayViolationsCount : (totalViolationsCount > 0 ? totalViolationsCount : violationsList.length),
            totalViolations: totalViolationsCount,
            activeOfficers,
            totalOfficers,
            settlementRevenue,
            pendingCitations,
            activeCameras: activeCameras > 0 ? activeCameras : (camerasList.length || 6),
            totalCameras: camerasList.length || 6,
            cameras: camerasList as any,
            recentViolations: violationsList as any,
            recentCitations: citationsList as any,
          };
        }
      } catch (err) {
        console.warn("[useCommandDashboardMetrics] Direct query warning, trying server function fallback:", err);
      }

      // 2. Server function fallback
      try {
        const data = await serverFetchCommandDashboardMetrics();
        return data as unknown as CommandDashboardMetrics;
      } catch (err) {
        console.error("Failed to fetch command dashboard metrics:", err);
        return {
          dailyViolations: 0,
          activeOfficers: 0,
          totalOfficers: 0,
          settlementRevenue: 0,
          pendingCitations: 0,
          activeCameras: 0,
          totalCameras: 0,
          cameras: [],
          recentViolations: [],
          recentCitations: [],
        };
      }
    },
    staleTime: 5_000,
    refetchInterval: 15_000,
  });
}

// -------------------------------------------------------------
// MOTORIST VEHICLE REGISTRY HOOKS
// -------------------------------------------------------------
export function useRegisteredVehicles() {
  const qc = useQueryClient();
  useEffect(() => {
    try {
      const channel = supabase
        .channel(`realtime-vehicles-registry_${Math.random().toString(36).substring(2, 9)}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "vehicles" }, () => {
          qc.invalidateQueries({ queryKey: ["registered-vehicles"] });
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "citations" }, () => {
          qc.invalidateQueries({ queryKey: ["registered-vehicles"] });
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "violations" }, () => {
          qc.invalidateQueries({ queryKey: ["registered-vehicles"] });
        })
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    } catch (e) {
      console.warn(e);
    }
  }, [qc]);

  return useQuery({
    queryKey: ["registered-vehicles"],
    queryFn: async () => {
      return await serverFetchRegisteredVehicles();
    },
  });
}

export function useRegisterVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      plateNumber: string;
      makeModel: string;
      registeredOwner: string;
      ownerEmail?: string;
      color?: string;
      vehicleType?: string;
      chassisNumber?: string;
    }) => {
      return await serverRegisterVehicle({ data: input });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["registered-vehicles"] });
      qc.invalidateQueries({ queryKey: ["citizen-profile"] });
      qc.invalidateQueries({ queryKey: ["command-dashboard-metrics"] });
      qc.invalidateQueries({ queryKey: ["citations"] });
      qc.invalidateQueries({ queryKey: ["violations"] });
    },
  });
}

export function useVehicleLookup(plateNumber: string) {
  const clean = (plateNumber || "").trim();
  return useQuery({
    queryKey: ["vehicle-lookup", clean.toUpperCase()],
    queryFn: async () => {
      if (!clean || clean.length < 2) return null;
      return await serverLookupVehicleDetails({ data: { plateNumber: clean } });
    },
    enabled: clean.length >= 2,
    staleTime: 30000,
  });
}

export type { RegisteredVehicleRecord, VehicleLookupResult };

