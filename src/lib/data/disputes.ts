import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type MockCitation = {
  id: string;
  citation_number: string;
  plate_number: string;
  offense: string;
  amount: number;
  status: "unpaid" | "settled" | "waived";
};

export type Dispute = {
  id: string;
  citation_id: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  citation?: MockCitation;
};

// Global in-memory mock data
let MOCK_DISPUTES: Dispute[] = [
  {
    id: "DSP-2023-0891",
    citation_id: "CIT-00129",
    reason: "I was not driving the vehicle at the time. It was stolen, police report attached.",
    status: "pending",
    admin_notes: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    resolved_at: null,
    resolved_by: null,
    citation: { id: "CIT-00129", citation_number: "CIT-00129", plate_number: "ABC-1234", offense: "Illegal Parking", amount: 1500, status: "unpaid" }
  },
  {
    id: "DSP-2023-0895",
    citation_id: "CIT-00135",
    reason: "The traffic light was yellow when I crossed. I have dashcam footage.",
    status: "rejected",
    admin_notes: "Reviewed intersection footage. Light was red for 2.4s before crossing.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    resolved_at: new Date().toISOString(),
    resolved_by: "Admin",
    citation: { id: "CIT-00135", citation_number: "CIT-00135", plate_number: "XYZ-987", offense: "Red Light", amount: 2000, status: "unpaid" }
  }
];

export function useDisputes() {
  return useQuery({
    queryKey: ["disputes"],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return [...MOCK_DISPUTES].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
  });
}

export function useCitizenDisputes() {
  return useQuery({
    queryKey: ["citizen-disputes"],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return [...MOCK_DISPUTES].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
  });
}

export function useCreateDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { citation_id: string; reason: string }) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newDispute: Dispute = {
        id: `DSP-${Math.floor(Math.random() * 10000)}`,
        citation_id: input.citation_id,
        reason: input.reason,
        status: "pending",
        admin_notes: null,
        created_at: new Date().toISOString(),
        resolved_at: null,
        resolved_by: null,
        citation: { id: input.citation_id, citation_number: input.citation_id, plate_number: "UNKNOWN", offense: "Appealed Violation", amount: 1000, status: "unpaid" }
      };

      MOCK_DISPUTES = [newDispute, ...MOCK_DISPUTES];
      return newDispute;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["citizen-disputes"] });
      qc.invalidateQueries({ queryKey: ["disputes"] });
    },
  });
}

export function useUpdateDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; status: "approved" | "rejected"; admin_notes?: string; resolved_by?: string }) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const idx = MOCK_DISPUTES.findIndex(d => d.id === input.id);
      if (idx === -1) throw new Error("Dispute not found");

      MOCK_DISPUTES[idx] = {
        ...MOCK_DISPUTES[idx],
        status: input.status,
        ...(input.admin_notes && { admin_notes: input.admin_notes }),
        ...(input.resolved_by && { resolved_by: input.resolved_by }),
        resolved_at: new Date().toISOString()
      };

      if (MOCK_DISPUTES[idx].citation) {
        if (input.status === "approved") MOCK_DISPUTES[idx].citation!.status = "waived";
        if (input.status === "rejected") MOCK_DISPUTES[idx].citation!.status = "unpaid";
      }

      return MOCK_DISPUTES[idx];
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["disputes"] });
      qc.invalidateQueries({ queryKey: ["citizen-disputes"] });
    },
  });
}
