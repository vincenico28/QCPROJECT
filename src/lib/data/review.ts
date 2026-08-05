import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Citation, Violation } from "./traffic";

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
      const { error } = await supabase.from("violations").update({ status }).eq("id", id);
      if (error) throw error;
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
      const { data, error } = await supabase
        .from("citations")
        .insert({
          citation_number: nextCitationNumber(),
          violation_id: input.violation.id,
          plate_number: input.violation.plate_number,
          vehicle_model: input.vehicleModel,
          offense: input.offense,
          amount: input.amount,
          officer_name: input.officerName,
          status: "pending",
        })
        .select()
        .single();
      if (error) throw error;

      const { error: vErr } = await supabase
        .from("violations")
        .update({ status: "confirmed" })
        .eq("id", input.violation.id);
      if (vErr) throw vErr;

      return data as Citation;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["violations"] });
      qc.invalidateQueries({ queryKey: ["citations"] });
    },
  });
}
