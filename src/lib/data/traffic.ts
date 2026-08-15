import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  { id: "101", badge_number: "BADGE-101", full_name: "Juan Dela Cruz", rank: "Sergeant", unit: "Traffic Management", district: "District 1", contact_number: "0917-123-4567", status: "active", on_duty: true, citations_issued: 145 },
  { id: "102", badge_number: "BADGE-102", full_name: "Maria Santos", rank: "Officer II", unit: "Patrol", district: "District 2", contact_number: null, status: "active", on_duty: false, citations_issued: 89 },
  { id: "104", badge_number: "BADGE-104", full_name: "Field Officer", rank: "Officer I", unit: "Traffic Management", district: "District 1", contact_number: "0918-987-6543", status: "active", on_duty: true, citations_issued: 42 },
];

export function useOfficers() {
  return useQuery({
    queryKey: ["officers"],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 400));
      return MOCK_OFFICERS;
    },
  });
}

export let MOCK_VIOLATIONS: Violation[] = [
  { id: "V-001", plate_number: "ABC-1234", violation_type: "Illegal Parking", location: "Tandang Sora Ave", confidence: 0.95, status: "verified", evidence_url: null, ai_detected: true, camera_code: "QC-CAM-1001", detected_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { id: "V-002", plate_number: "XYZ-987", violation_type: "Red Light", location: "Commonwealth Ave", confidence: 0.88, status: "pending", evidence_url: null, ai_detected: true, camera_code: "QC-CAM-1002", detected_at: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  { id: "V-003", plate_number: "DEF-456", violation_type: "No Helmet", location: "Visayas Ave", confidence: 0.92, status: "rejected", evidence_url: null, ai_detected: true, camera_code: "QC-CAM-1001", detected_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
];

export function useViolations(limit = 20) {
  return useQuery({
    queryKey: ["violations", limit],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 400));
      return MOCK_VIOLATIONS.slice(0, limit);
    },
    refetchInterval: 15_000,
  });
}

export let MOCK_CITATIONS: Citation[] = [
  {
    id: "CIT-00129",
    citation_number: "CIT-00129",
    violation_id: "V-001",
    plate_number: "ABC-1234",
    vehicle_model: "Toyota Vios",
    offense: "Illegal Parking",
    amount: 1500,
    status: "unpaid",
    officer_name: "AI Cam",
    issued_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
  },
  {
    id: "CIT-00135",
    citation_number: "CIT-00135",
    violation_id: "V-002",
    plate_number: "XYZ-987",
    vehicle_model: "Honda Civic",
    offense: "Red Light",
    amount: 2000,
    status: "unpaid",
    officer_name: "Field Officer",
    issued_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString()
  }
];

export function useCitations(limit = 20) {
  return useQuery({
    queryKey: ["citations", limit],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 400));
      return MOCK_CITATIONS.slice(0, limit);
    },
  });
}

export function useCitation(citationNumber: string) {
  return useQuery({
    queryKey: ["citation", citationNumber],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 400));
      const cit = MOCK_CITATIONS.find(c => c.citation_number === citationNumber);
      if (!cit) throw new Error("Not found");
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
};

export function useCreateCitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewCitation) => {
      await new Promise((r) => setTimeout(r, 800));
      const id = "CIT-" + Math.floor(Math.random() * 100000).toString().padStart(5, "0");
      const c: Citation = {
        id,
        citation_number: id,
        violation_id: input.violation_id ?? null,
        plate_number: input.plate_number,
        vehicle_model: null,
        offense: input.offense,
        amount: input.amount,
        status: "unpaid",
        issued_at: new Date().toISOString(),
        officer_name: input.officer_name ?? null,
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
      await new Promise((r) => setTimeout(r, 600));
      const idx = MOCK_CITATIONS.findIndex((c) => c.citation_number === citationId);
      if (idx !== -1) {
        MOCK_CITATIONS[idx].status = status as any;
      } else {
        throw new Error("Citation not found");
      }
    },
    onSuccess: (_, { citationId }) => {
      qc.invalidateQueries({ queryKey: ["citations"] });
      qc.invalidateQueries({ queryKey: ["citation", citationId] });
    },
  });
}

export let MOCK_CAMERAS: Camera[] = [
  { id: "CAM-1", code: "QC-CAM-1001", location: "Commonwealth Ave", status: "online", lat: 14.6563, lng: 121.0697 },
  { id: "CAM-2", code: "QC-CAM-1002", location: "Tandang Sora Intersection", status: "online", lat: 14.6723, lng: 121.0507 },
  { id: "CAM-3", code: "QC-CAM-1003", location: "Visayas Ave", status: "maintenance", lat: 14.6623, lng: 121.0423 },
  { id: "CAM-4", code: "QC-CAM-1004", location: "Mindanao Ave", status: "offline", lat: 14.6789, lng: 121.0345 },
];

export function useCameras() {
  return useQuery({
    queryKey: ["cameras"],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 400));
      return MOCK_CAMERAS;
    },
  });
}

export function useCreateCamera() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { location: string; lat?: number; lng?: number }) => {
      await new Promise(r => setTimeout(r, 600));
      const code = `QC-CAM-${Math.floor(1000 + Math.random() * 9000)}`;
      const c: Camera = {
        id: code,
        code,
        location: input.location,
        lat: input.lat || null,
        lng: input.lng || null,
        status: "offline",
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
      await new Promise(r => setTimeout(r, 400));
      const cam = MOCK_CAMERAS.find((c) => c.id === input.id);
      if (!cam) throw new Error("Not found");
      if (input.status) cam.status = input.status;
      if (input.location) cam.location = input.location;
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
    maximumFractionDigits: 0,
  }).format(amount);
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
