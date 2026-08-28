import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  serverFetchViolations,
  serverSaveViolation,
  serverUpdateViolationStatus,
  serverFetchCitations,
  serverSaveCitation,
  serverUpdateCitationStatus,
  serverFetchOfficers,
  serverSaveOfficer,
  serverToggleOfficerDuty,
  serverFetchCameras,
  serverSaveCamera,
  serverUpdateCamera,
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
  issued_at: string;
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

export let MOCK_OFFICERS: Officer[] = [
  { id: "101", badge_number: "BADGE-101", full_name: "Juan Dela Cruz", rank: "Sergeant", unit: "Traffic Management", district: "District 6 (Culiat)", contact_number: "0917-123-4567", status: "active", on_duty: true, citations_issued: 145 },
  { id: "102", badge_number: "BADGE-102", full_name: "Maria Santos", rank: "Officer II", unit: "Patrol / Commonwealth Grid", district: "District 6 (Culiat)", contact_number: "0920-555-1234", status: "active", on_duty: true, citations_issued: 89 },
  { id: "103", badge_number: "BADGE-103", full_name: "Ramon Valderama", rank: "Master Sergeant", unit: "Mobile Interceptor Unit", district: "District 6 (Tandang Sora)", contact_number: "0919-444-9876", status: "active", on_duty: true, citations_issued: 210 },
  { id: "104", badge_number: "BADGE-104", full_name: "Gabriel Mendoza", rank: "Officer I", unit: "DPOS Rapid Response", district: "District 6 (Visayas Ave)", contact_number: "0918-987-6543", status: "active", on_duty: false, citations_issued: 42 },
  { id: "105", badge_number: "BADGE-105", full_name: "Corazon Aquino-Lim", rank: "Inspector", unit: "Traffic Supervision", district: "District 6 (Culiat)", contact_number: "0917-888-2345", status: "active", on_duty: true, citations_issued: 68 },
];

export function useOfficers() {
  const qc = useQueryClient();

  useEffect(() => {
    try {
      const channel = supabase
        .channel("realtime-officers")
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
        if (rows && rows.length > 0) {
          return rows as Officer[];
        }
      } catch {
        // Fallback
      }
      return MOCK_OFFICERS;
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
      const saved = await serverSaveOfficer({ data: input });
      const off: Officer = {
        id: (saved as any)?.id || `OFF-${Date.now()}`,
        badge_number: input.badge_number,
        full_name: input.full_name,
        rank: input.rank,
        unit: input.unit,
        district: input.district,
        contact_number: input.contact_number || null,
        status: "active",
        on_duty: true,
        citations_issued: 0,
      };
      MOCK_OFFICERS.unshift(off);
      return off;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["officers"] });
    },
  });
}

export function useToggleOfficerDuty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const o = MOCK_OFFICERS.find((x) => x.id === id);
      if (o) {
        o.on_duty = !o.on_duty;
        await serverToggleOfficerDuty({ data: { id, on_duty: o.on_duty } });
      }
      return o;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["officers"] });
    },
  });
}

export let MOCK_VIOLATIONS: Violation[] = [
  {
    id: "V-101",
    plate_number: "NDB-8921",
    violation_type: "Red Light",
    location: "Commonwealth Ave / Tandang Sora",
    confidence: 96,
    status: "pending",
    evidence_url: "/assets/violation-1.jpg",
    ai_detected: true,
    camera_code: "QC-CAM-1002",
    detected_at: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
  },
  {
    id: "V-102",
    plate_number: "ABC-1234",
    violation_type: "Illegal Parking",
    location: "Visayas Ave near Central Market",
    confidence: 94,
    status: "pending",
    evidence_url: "/assets/violation-2.jpg",
    ai_detected: true,
    camera_code: "QC-CAM-1001",
    detected_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: "V-103",
    plate_number: "XYZ-987",
    violation_type: "Counterflow",
    location: "Tandang Sora Ave (Westbound)",
    confidence: 91,
    status: "pending",
    evidence_url: "/assets/violation-3.jpg",
    ai_detected: true,
    camera_code: "QC-CAM-1003",
    detected_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: "V-104",
    plate_number: "NBP-5412",
    violation_type: "Yellow Box Infraction",
    location: "Commonwealth Ave / Luzon Overpass",
    confidence: 89,
    status: "pending",
    evidence_url: "/assets/violation-1.jpg",
    ai_detected: true,
    camera_code: "QC-CAM-1004",
    detected_at: new Date(Date.now() - 1000 * 60 * 52).toISOString(),
  },
  {
    id: "V-105",
    plate_number: "CAS-3901",
    violation_type: "Bus Lane Violation",
    location: "EDSA Northbound QC Corridor",
    confidence: 97,
    status: "confirmed",
    evidence_url: "/assets/violation-2.jpg",
    ai_detected: true,
    camera_code: "QC-CAM-1005",
    detected_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: "V-106",
    plate_number: "WXY-1122",
    violation_type: "No Helmet",
    location: "Visayas Ave Intersection",
    confidence: 72,
    status: "dismissed",
    evidence_url: "/assets/violation-3.jpg",
    ai_detected: true,
    camera_code: "QC-CAM-1001",
    detected_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
];

export function useViolations(limit = 50) {
  const qc = useQueryClient();

  useEffect(() => {
    try {
      const channel = supabase
        .channel("realtime-violations")
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
      try {
        const rows = await serverFetchViolations({ data: limit });
        if (rows && rows.length > 0) {
          return rows as Violation[];
        }
      } catch {
        // Fallback
      }
      return MOCK_VIOLATIONS.slice(0, limit);
    },
    staleTime: 5_000,
    refetchInterval: 15_000,
  });
}

export let MOCK_CITATIONS: Citation[] = [
  {
    id: "CIT-00129",
    citation_number: "NOV-2026-QC-00129",
    violation_id: "V-101",
    plate_number: "NDB-8921",
    vehicle_model: "Toyota Vios 1.3E (Silver)",
    offense: "Red Light",
    amount: 2000,
    status: "unpaid",
    officer_name: "AI Auto-Validator",
    issued_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: "CIT-00135",
    citation_number: "NOV-2026-QC-00135",
    violation_id: "V-102",
    plate_number: "ABC-1234",
    vehicle_model: "Mitsubishi Mirage G4 (Gray)",
    offense: "Illegal Parking",
    amount: 1500,
    status: "paid",
    officer_name: "AI Auto-Validator",
    issued_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: "CIT-00142",
    citation_number: "NOV-2026-QC-00142",
    violation_id: "V-103",
    plate_number: "XYZ-987",
    vehicle_model: "Honda Civic 1.5 RS",
    offense: "Counterflow",
    amount: 2500,
    status: "contested",
    officer_name: "AI Auto-Validator",
    issued_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
  {
    id: "CIT-00150",
    citation_number: "NOV-2026-QC-00150",
    violation_id: "V-106",
    plate_number: "CAS-3901",
    vehicle_model: "Toyota Fortuner (Black)",
    offense: "Bus Lane Violation",
    amount: 5000,
    status: "overdue",
    officer_name: "AI Auto-Validator",
    issued_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(),
  },
  {
    id: "CIT-00164",
    citation_number: "NOV-2026-QC-00164",
    violation_id: "V-104",
    plate_number: "NBP-5412",
    vehicle_model: "Hyundai Tucson (White)",
    offense: "Yellow Box Infraction",
    amount: 1500,
    status: "paid",
    officer_name: "AI Auto-Validator",
    issued_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
];

export function useCitations(limit = 50) {
  const qc = useQueryClient();

  useEffect(() => {
    try {
      const channel = supabase
        .channel("realtime-citations")
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
      try {
        const rows = await serverFetchCitations({ data: limit });
        if (rows && rows.length > 0) {
          return rows as Citation[];
        }
      } catch {
        // Fallback
      }
      return MOCK_CITATIONS.slice(0, limit);
    },
    staleTime: 5_000,
  });
}

export function useCitation(citationNumber: string) {
  return useQuery({
    queryKey: ["citation", citationNumber],
    queryFn: async () => {
      try {
        const rows = await serverFetchCitations({ data: 100 });
        const found = rows?.find((c: any) => c.citation_number === citationNumber);
        if (found) return found as Citation;
      } catch {
        // fallback
      }
      const cit = MOCK_CITATIONS.find((c) => c.citation_number === citationNumber);
      if (!cit) throw new Error("Citation not found");
      return cit;
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
};

export function useCreateCitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewCitation) => {
      const row = await serverSaveCitation({
        data: {
          violation_id: input.violation_id || null,
          plate_number: input.plate_number,
          vehicle_model: input.vehicle_model || null,
          offense: input.offense,
          amount: input.amount,
          status: "unpaid",
          officer_name: input.officer_name || "QC Enforcer",
        },
      });

      const c: Citation = {
        id: (row as any)?.id || "CIT-" + Math.floor(10000 + Math.random() * 90000),
        citation_number: (row as any)?.citation_number || `NOV-2026-QC-${Math.floor(10000 + Math.random() * 90000)}`,
        violation_id: input.violation_id ?? null,
        plate_number: input.plate_number.toUpperCase(),
        vehicle_model: input.vehicle_model ?? null,
        offense: input.offense,
        amount: input.amount,
        status: "unpaid",
        issued_at: (row as any)?.issued_at || new Date().toISOString(),
        officer_name: input.officer_name ?? "QC Enforcer",
      };

      MOCK_CITATIONS.unshift(c);
      return c;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["citations"] });
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

      const idx = MOCK_CITATIONS.findIndex((c) => c.citation_number === citationId);
      if (idx !== -1) {
        MOCK_CITATIONS[idx].status = status as any;
      }
    },
    onSuccess: (_, { citationId }) => {
      qc.invalidateQueries({ queryKey: ["citations"] });
      qc.invalidateQueries({ queryKey: ["citation", citationId] });
    },
  });
}

export let MOCK_CAMERAS: Camera[] = [
  { id: "CAM-1", code: "QC-CAM-1001", location: "Commonwealth Ave cor. Tandang Sora", status: "online", lat: 14.6563, lng: 121.0697 },
  { id: "CAM-2", code: "QC-CAM-1002", location: "Commonwealth Ave (Luzon Overpass Eastbound)", status: "online", lat: 14.6723, lng: 121.0507 },
  { id: "CAM-3", code: "QC-CAM-1003", location: "Visayas Ave near Central Market", status: "online", lat: 14.6623, lng: 121.0423 },
  { id: "CAM-4", code: "QC-CAM-1004", location: "Mindanao Ave / Congressional Ext", status: "maintenance", lat: 14.6789, lng: 121.0345 },
  { id: "CAM-5", code: "QC-CAM-1005", location: "EDSA Northbound QC Busway Corridor", status: "online", lat: 14.6512, lng: 121.0334 },
  { id: "CAM-6", code: "QC-CAM-1006", location: "Culiat Elementary School Safety Zone", status: "offline", lat: 14.6645, lng: 121.0542 },
];

export function useCameras() {
  const qc = useQueryClient();

  useEffect(() => {
    try {
      const channel = supabase
        .channel("realtime-cameras")
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
        if (rows && rows.length > 0) {
          return rows as Camera[];
        }
      } catch {
        // fallback
      }
      return MOCK_CAMERAS;
    },
  });
}

export function useCreateCamera() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { location: string; lat?: number; lng?: number }) => {
      const code = `QC-CAM-${Math.floor(1000 + Math.random() * 9000)}`;
      const row = await serverSaveCamera({
        data: {
          code,
          location: input.location,
          lat: input.lat || 14.6563,
          lng: input.lng || 121.0697,
          status: "online",
        },
      });

      const c: Camera = {
        id: (row as any)?.id || code,
        code,
        location: input.location,
        lat: input.lat || 14.6563,
        lng: input.lng || 121.0697,
        status: "online",
      };

      MOCK_CAMERAS.push(c);
      return c;
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

      const cam = MOCK_CAMERAS.find((c) => c.id === input.id);
      if (cam) {
        if (input.status) cam.status = input.status;
        if (input.location) cam.location = input.location;
      }
      return cam;
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
