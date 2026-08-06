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

export function useOfficers() {
  return useQuery({
    queryKey: ["officers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("officers")
        .select("*")
        .order("citations_issued", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Officer[];
    },
  });
}

export function useViolations(limit = 20) {
  return useQuery({
    queryKey: ["violations", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("violations")
        .select("*")
        .order("detected_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as Violation[];
    },
    refetchInterval: 15_000,
  });
}

export function useCitations(limit = 20) {
  return useQuery({
    queryKey: ["citations", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("citations")
        .select("*")
        .order("issued_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as Citation[];
    },
  });
}

export function useCitation(citationNumber: string) {
  return useQuery({
    queryKey: ["citation", citationNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("citations")
        .select("*")
        .eq("citation_number", citationNumber)
        .single();
      if (error) throw error;
      return data as Citation;
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
      const citation_number = `QC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const { data, error } = await supabase
        .from("citations")
        .insert({
          ...input,
          citation_number,
          status: "pending",
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Citation;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["citations"] });
    },
  });
}

export function useCameras() {
  return useQuery({
    queryKey: ["cameras"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cameras").select("*").order("code");
      if (error) throw error;
      return (data ?? []) as Camera[];
    },
  });
}

export function useCreateCamera() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { location: string; lat?: number; lng?: number }) => {
      const code = `QC-CAM-${Math.floor(1000 + Math.random() * 9000)}`;
      const { data, error } = await supabase
        .from("cameras")
        .insert({
          code,
          location: input.location,
          lat: input.lat || null,
          lng: input.lng || null,
          status: "offline",
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Camera;
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
      const { data, error } = await supabase
        .from("cameras")
        .update({
          ...(input.status && { status: input.status }),
          ...(input.location && { location: input.location }),
        })
        .eq("id", input.id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Camera;
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
