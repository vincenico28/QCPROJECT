import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  plate: z.string().trim().min(3).max(12),
  reference: z.string().trim().min(4).max(32),
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

/**
 * Public motorist lookup. Requires BOTH the plate number and the exact citation
 * reference, so a citation can only be read by someone already holding the
 * ticket. Only non-sensitive columns are returned (no officer, no violation id).
 */
export const lookupCitation = createServerFn({ method: "POST" })
  .validator((data: unknown) => schema.parse(data))
  .handler(async ({ data }): Promise<PublicCitation | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("citations")
      .select("id, citation_number, plate_number, offense, amount, status, issued_at, vehicle_model")
      .eq("citation_number", data.reference.toUpperCase())
      .ilike("plate_number", data.plate.replace(/\s+/g, ""))
      .maybeSingle();

    if (error) throw new Error("Lookup failed. Please try again.");
    return (row as PublicCitation | null) ?? null;
  });
