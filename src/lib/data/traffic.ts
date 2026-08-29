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

export let MOCK_OFFICERS: Officer[] = [];

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
      return { id, on_duty: !currentDuty };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["officers"] });
    },
  });
}

export let MOCK_VIOLATIONS: Violation[] = [];

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
        return (rows as Violation[]) || [];
      } catch {
        return [];
      }
    },
    staleTime: 5_000,
    refetchInterval: 15_000,
  });
}

export let MOCK_CITATIONS: Citation[] = [];

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
        return (rows as Citation[]) || [];
      } catch {
        return [];
      }
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
};

export function useCreateCitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewCitation) => {
      return await serverSaveCitation({
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
    },
    onSuccess: (_, { citationId }) => {
      qc.invalidateQueries({ queryKey: ["citations"] });
      qc.invalidateQueries({ queryKey: ["citation", citationId] });
    },
  });
}

export let MOCK_CAMERAS: Camera[] = [];

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
      return await serverSaveCamera({
        data: {
          code,
          location: input.location,
          lat: input.lat || 14.6563,
          lng: input.lng || 121.0697,
          status: "online",
        },
      });
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
