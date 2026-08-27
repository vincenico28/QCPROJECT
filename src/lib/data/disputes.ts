import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type MockCitation = {
  id: string;
  citation_number: string;
  plate_number: string;
  offense: string;
  amount: number;
  status: "unpaid" | "settled" | "waived";
  location?: string;
  evidenceUrl?: string;
};

export type Dispute = {
  id: string;
  citation_id: string;
  reason: string;
  statutoryGround?: string;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  citation?: MockCitation;
  supportingDocumentUrl?: string;
  nominatedDriver?: {
    name: string;
    licenseNumber: string;
  };
};

let MOCK_DISPUTES: Dispute[] = [
  {
    id: "TAB-2026-0891",
    citation_id: "NOV-2026-QC-00142",
    statutoryGround: "Directed by On-Duty Traffic Enforcer (Manual Override)",
    reason: "A QC DPOS traffic enforcer was manually waving vehicles across the intersection during severe flash flooding on Tandang Sora Ave, overriding the red light signal.",
    status: "pending",
    admin_notes: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    resolved_at: null,
    resolved_by: null,
    supportingDocumentUrl: "/assets/violation-3.jpg",
    citation: {
      id: "CIT-00142",
      citation_number: "NOV-2026-QC-00142",
      plate_number: "XYZ-987",
      offense: "Counterflow / Disregarding Light",
      amount: 2500,
      status: "unpaid",
      location: "Tandang Sora Ave (Westbound)",
      evidenceUrl: "/assets/violation-3.jpg",
    },
  },
  {
    id: "TAB-2026-0894",
    citation_id: "NOV-2026-QC-00129",
    statutoryGround: "Medical / Humanitarian Emergency in Transit",
    reason: "Transporting pregnant passenger with acute complications to Diliman Doctors Hospital under hazard emergency lights.",
    status: "pending",
    admin_notes: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 42).toISOString(),
    resolved_at: null,
    resolved_by: null,
    supportingDocumentUrl: "/assets/violation-1.jpg",
    citation: {
      id: "CIT-00129",
      citation_number: "NOV-2026-QC-00129",
      plate_number: "NDB-8921",
      offense: "Red Light",
      amount: 2000,
      status: "unpaid",
      location: "Commonwealth Ave / Tandang Sora",
      evidenceUrl: "/assets/violation-1.jpg",
    },
  },
  {
    id: "TAB-2026-0888",
    citation_id: "NOV-2026-QC-00042",
    statutoryGround: "Yielding to Emergency Vehicle (Ambulance / Fire)",
    reason: "Moved forward into yellow grid to give way to oncoming Philippine Red Cross ambulance with active sirens.",
    status: "approved",
    admin_notes: "CCTV review confirmed ambulance siren audio and approach in rear camera angle. Apprehension dismissed under MMDA Reg 16-002 Section 4B.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    resolved_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    resolved_by: "Atty. M. Roxas (TAB Hearing Officer)",
    citation: {
      id: "CIT-00042",
      citation_number: "NOV-2026-QC-00042",
      plate_number: "CAR-9912",
      offense: "Yellow Box Infraction",
      amount: 1500,
      status: "waived",
      location: "Commonwealth Ave / Luzon Overpass",
    },
  },
];

export function useDisputes() {
  return useQuery({
    queryKey: ["disputes"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return [...MOCK_DISPUTES].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
  });
}

export function useCitizenDisputes() {
  return useQuery({
    queryKey: ["citizen-disputes"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return [...MOCK_DISPUTES].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
  });
}

export function useCreateDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      citation_id: string;
      reason: string;
      statutoryGround?: string;
    }) => {
      await new Promise((resolve) => setTimeout(resolve, 400));

      const newDispute: Dispute = {
        id: `TAB-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        citation_id: input.citation_id,
        statutoryGround: input.statutoryGround || "Factual / Signal Discrepancy",
        reason: input.reason,
        status: "pending",
        admin_notes: null,
        created_at: new Date().toISOString(),
        resolved_at: null,
        resolved_by: null,
        citation: {
          id: input.citation_id,
          citation_number: input.citation_id,
          plate_number: "UNKNOWN",
          offense: "Appealed Notice of Violation",
          amount: 2000,
          status: "unpaid",
        },
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
    mutationFn: async (input: {
      id: string;
      status: "approved" | "rejected";
      admin_notes?: string;
      resolved_by?: string;
    }) => {
      await new Promise((resolve) => setTimeout(resolve, 400));

      const idx = MOCK_DISPUTES.findIndex((d) => d.id === input.id);
      if (idx === -1) throw new Error("Dispute not found");

      MOCK_DISPUTES[idx] = {
        ...MOCK_DISPUTES[idx],
        status: input.status,
        ...(input.admin_notes && { admin_notes: input.admin_notes }),
        resolved_by: input.resolved_by || "Traffic Adjudication Board Hearing Officer",
        resolved_at: new Date().toISOString(),
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
      qc.invalidateQueries({ queryKey: ["citations"] });
    },
  });
}
