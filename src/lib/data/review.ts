import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type Citation, type Violation } from "./traffic";
import {
  serverSaveViolation,
  serverUpdateViolationStatus,
  serverSaveCitation,
} from "@/lib/server.functions";

/** Standard QC LGU fine schedule (PHP) by offense type. */
export const FINE_SCHEDULE: Record<string, number> = {
  "Red Light": 2000,
  "Red Light Jump": 3500,
  "Overspeeding": 3000,
  "No Entry Zone": 5000,
  "Counterflow": 2500,
  "Obstruction": 2000,
  "Illegal Parking": 1000,
  "No Helmet": 1500,
  "Number Coding": 500,
  "Yellow Box Infraction": 1500,
  "Bus Lane Violation": 5000,
};

export function fineFor(offense: string) {
  return FINE_SCHEDULE[offense] ?? 1000;
}

export function nextCitationNumber() {
  const seq = Math.floor(10000 + Math.random() * 89999);
  return `NOV-2026-QC-${seq}`;
}

export function useReviewViolation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: "confirmed" | "dismissed" | "pending";
    }) => {
      await serverUpdateViolationStatus({ data: { id, status } });

      try {
        const { supabase } = await import("@/integrations/supabase/client");
        await supabase.from("audit_logs").insert({
          actor_name: "Violation Review Officer",
          actor_role: "admin",
          action: `VIOLATION_REVIEW_${status.toUpperCase()}`,
          target_resource: `Violation ID: ${id}`,
          details: `Status updated to ${status}`,
        });
      } catch (err) {
        console.warn(err);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["violations"] });
    },
  });
}

export function useBulkReviewViolations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ids,
      status,
    }: {
      ids: string[];
      status: "confirmed" | "dismissed";
    }) => {
      for (const id of ids) {
        await serverUpdateViolationStatus({ data: { id, status } });
      }

      try {
        const { supabase } = await import("@/integrations/supabase/client");
        await supabase.from("audit_logs").insert({
          actor_name: "Violation Review Officer",
          actor_role: "admin",
          action: `VIOLATION_BULK_${status.toUpperCase()}`,
          target_resource: `${ids.length} Violations`,
          details: `Bulk marked ${ids.length} items as ${status}`,
        });
      } catch (err) {
        console.warn(err);
      }

      return { count: ids.length, status };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["violations"] });
      qc.invalidateQueries({ queryKey: ["citations"] });
    },
  });
}

export type IssueCitationInput = {
  violation: Violation;
  offense: string;
  amount: number;
  officerName: string | null;
  vehicleModel: string | null;
};

export function useIssueCitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: IssueCitationInput) => {
      const row = await serverSaveCitation({
        data: {
          violation_id: input.violation.id,
          plate_number: input.violation.plate_number,
          vehicle_model: input.vehicleModel,
          offense: input.offense,
          amount: input.amount,
          officer_name: input.officerName,
          status: "unpaid",
        },
      });

      await serverUpdateViolationStatus({
        data: { id: input.violation.id, status: "confirmed" },
      });

      try {
        const { supabase } = await import("@/integrations/supabase/client");
        await supabase.from("audit_logs").insert({
          actor_name: input.officerName || "Adjudication Officer",
          actor_role: "admin",
          action: "CITATION_ISSUED_FROM_VIOLATION",
          target_resource: `Plate: ${input.violation.plate_number}`,
          details: `Offense: ${input.offense}, Amount: PHP ${input.amount}, Violation ID: ${input.violation.id}`,
        });
      } catch (err) {
        console.warn(err);
      }

      return row as Citation;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["citations"] });
      qc.invalidateQueries({ queryKey: ["violations"] });
    },
  });
}

export function useAddManualViolation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      plate_number: string;
      violation_type: string;
      location: string;
      camera_code?: string;
      evidence_url?: string;
    }) => {
      // Save to real database
      const row = await serverSaveViolation({
        data: {
          plate_number: input.plate_number.toUpperCase().trim(),
          violation_type: input.violation_type,
          location: input.location,
          confidence: 1.0,
          ai_detected: false,
          camera_code: input.camera_code || "FIELD-OFFICER",
          evidence_url: input.evidence_url || "/assets/violation-1.jpg",
          status: "pending",
        },
      });

      return row as Violation;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["violations"] });
    },
  });
}
