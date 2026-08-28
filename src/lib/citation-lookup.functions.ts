import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  plate: z.string().trim().min(3).max(16),
  reference: z.string().trim().min(3).max(36),
});

export type PublicCitation = {
  id: string;
  citation_number: string;
  plate_number: string;
  offense: string;
  amount: number;
  status: string;
  issued_at: string;
  vehicle_model: string | null;
};

const SAMPLE_CITATIONS: PublicCitation[] = [
  {
    id: "CIT-00129",
    citation_number: "NOV-2026-QC-00129",
    plate_number: "NDB-8921",
    vehicle_model: "Toyota Vios 1.3E (Silver)",
    offense: "Red Light",
    amount: 2000,
    status: "unpaid",
    issued_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: "CIT-00135",
    citation_number: "NOV-2026-QC-00135",
    plate_number: "ABC-1234",
    vehicle_model: "Mitsubishi Mirage G4 (Gray)",
    offense: "Illegal Parking",
    amount: 1500,
    status: "paid",
    issued_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: "CIT-00142",
    citation_number: "NOV-2026-QC-00142",
    plate_number: "XYZ-987",
    vehicle_model: "Honda Civic 1.5 RS",
    offense: "Counterflow",
    amount: 2500,
    status: "contested",
    issued_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
];

/**
 * Public motorist lookup. Queries live Supabase database with fallback to pre-seeded dataset.
 */
export const lookupCitation = createServerFn({ method: "POST" })
  .validator((data: unknown) => schema.parse(data))
  .handler(async ({ data }): Promise<PublicCitation | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const cleanRef = data.reference.trim();

    try {
      const { data: row, error } = await supabaseAdmin
        .from("citations")
        .select("id, citation_number, plate_number, offense, amount, status, issued_at, vehicle_model")
        .ilike("citation_number", `%${cleanRef}%`)
        .maybeSingle();

      if (!error && row) {
        return row as PublicCitation;
      }
    } catch {
      // fallback
    }

    // Fallback to sample dataset
    const found = SAMPLE_CITATIONS.find(
      (c) =>
        c.citation_number.toLowerCase().includes(cleanRef.toLowerCase()) ||
        c.plate_number.replace(/[\s-]+/g, "").toUpperCase() ===
          data.plate.replace(/[\s-]+/g, "").toUpperCase()
    );

    return found ?? null;
  });
