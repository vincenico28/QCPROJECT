import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type Citation, type Violation, MOCK_VIOLATIONS, MOCK_CITATIONS } from "./traffic";
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
      // Store in real database
      await serverUpdateViolationStatus({ data: { id, status } });

      const v = MOCK_VIOLATIONS.find((x) => x.id === id);
      if (v) v.status = status;
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
        // Persist status update to database
        await serverUpdateViolationStatus({ data: { id, status } });

        const v = MOCK_VIOLATIONS.find((x) => x.id === id);
        if (v) {
          v.status = status;
          if (status === "confirmed") {
            // Save citation in real database
            await serverSaveCitation({
              data: {
                violation_id: v.id,
                plate_number: v.plate_number,
                vehicle_model: "Auto-Verified Vehicle",
                offense: v.violation_type,
                amount: fineFor(v.violation_type),
                officer_name: "AI Auto-Validator",
                status: "unpaid",
              },
            });

            const c: Citation = {
              id: `CIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              citation_number: nextCitationNumber(),
              violation_id: v.id,
              plate_number: v.plate_number,
              vehicle_model: "Auto-Verified Vehicle",
              offense: v.violation_type,
              amount: fineFor(v.violation_type),
              officer_name: "AI Auto-Validator",
              status: "unpaid",
              issued_at: new Date().toISOString(),
            };
            MOCK_CITATIONS.unshift(c);
          }
        }
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
      // Save citation to real database
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

      // Update violation status to confirmed
      await serverUpdateViolationStatus({
        data: { id: input.violation.id, status: "confirmed" },
      });

      const c: Citation = {
        id: (row as any)?.id || `CIT-${Date.now()}`,
        citation_number: (row as any)?.citation_number || nextCitationNumber(),
        violation_id: input.violation.id,
        plate_number: input.violation.plate_number,
        vehicle_model: input.vehicleModel,
        offense: input.offense,
        amount: input.amount,
        officer_name: input.officerName,
        status: "unpaid",
        issued_at: (row as any)?.issued_at || new Date().toISOString(),
      };
      MOCK_CITATIONS.unshift(c);

      const v = MOCK_VIOLATIONS.find((x) => x.id === input.violation.id);
      if (v) v.status = "confirmed";

      return c;
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

      const newV: Violation = {
        id: (row as any)?.id || `V-${Date.now()}`,
        plate_number: input.plate_number.toUpperCase().trim(),
        violation_type: input.violation_type,
        location: input.location,
        confidence: 1.0,
        status: "pending",
        evidence_url: input.evidence_url || "/assets/violation-1.jpg",
        ai_detected: false,
        camera_code: input.camera_code || "FIELD-OFFICER",
        detected_at: (row as any)?.detected_at || new Date().toISOString(),
      };

      MOCK_VIOLATIONS.unshift(newV);
      return newV;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["violations"] });
    },
  });
}
