import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Dispute = {
  id: string;
  citation_id: string;
  reason: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
};

export function useDisputes() {
  return useQuery({
    queryKey: ["disputes"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("disputes")
        .select(`
          *,
          citation:citations(*)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { citation_id: string; reason: string }) => {
      const { data, error } = await (supabase as any)
        .from("disputes")
        .insert({
          citation_id: input.citation_id,
          reason: input.reason,
          status: "pending",
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Dispute;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["citation"] });
      qc.invalidateQueries({ queryKey: ["disputes"] });
    },
  });
}

export function useUpdateDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; status: string; admin_notes?: string; resolved_by?: string }) => {
      const { data, error } = await (supabase as any)
        .from("disputes")
        .update({
          status: input.status,
          ...(input.admin_notes && { admin_notes: input.admin_notes }),
          ...(input.resolved_by && { resolved_by: input.resolved_by, resolved_at: new Date().toISOString() }),
        })
        .eq("id", input.id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Also update citation status if the dispute is resolved
      if (input.status === "approved") {
        await (supabase as any).from("citations").update({ status: "waived" }).eq("id", data.citation_id);
      } else if (input.status === "rejected") {
        await (supabase as any).from("citations").update({ status: "unpaid" }).eq("id", data.citation_id);
      }
      
      return data as Dispute;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["disputes"] });
      qc.invalidateQueries({ queryKey: ["citations"] });
    },
  });
}
