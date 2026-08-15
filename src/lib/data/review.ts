import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type Citation, type Violation, MOCK_VIOLATIONS, MOCK_CITATIONS } from "./traffic";

/** Standard QC LGU fine schedule (PHP) by offense type. */
export const FINE_SCHEDULE: Record<string, number> = {
  "Red Light Jump": 3500,
  Overspeeding: 3000,
  "No Entry Zone": 5000,
  Counterflow: 2500,
  Obstruction: 2000,
  "Illegal Parking": 1000,
  "No Helmet": 1500,
  "Number Coding": 500,
};

export function fineFor(offense: string) {
  return FINE_SCHEDULE[offense] ?? 1000;
}

export function nextCitationNumber() {
  const seq = Math.floor(10000 + Math.random() * 89999);
  return `QC-${seq}`;
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
      await new Promise(r => setTimeout(r, 400));
      const v = MOCK_VIOLATIONS.find(x => x.id === id);
      if (v) v.status = status;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["violations"] });
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
      await new Promise(r => setTimeout(r, 600));
      const c: Citation = {
          id: `CIT-${Date.now()}`,
          citation_number: nextCitationNumber(),
          violation_id: input.violation.id,
          plate_number: input.violation.plate_number,
          vehicle_model: input.vehicleModel,
          offense: input.offense,
          amount: input.amount,
          officer_name: input.officerName,
          status: "unpaid",
          issued_at: new Date().toISOString(),
      };
      MOCK_CITATIONS.unshift(c);

      const v = MOCK_VIOLATIONS.find(x => x.id === input.violation.id);
      if (v) v.status = "confirmed";

      return c;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["violations"] });
      qc.invalidateQueries({ queryKey: ["citations"] });
    },
  });
}
