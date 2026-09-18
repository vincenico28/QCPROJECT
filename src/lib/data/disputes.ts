import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  serverFetchDisputes,
  serverSaveDispute,
  serverResolveDispute,
} from "@/lib/server.functions";

export type MockCitation = {
  id: string;
  citation_number: string;
  plate_number: string;
  offense: string;
  amount: number;
  status: "unpaid" | "settled" | "waived" | "contested";
  location?: string;
  evidenceUrl?: string;
  evidence_url?: string | null;
  speedKph?: number;
  lane?: string;
  timestamp?: string;
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
  supportingDocumentName?: string;
  hearingRoom?: string;
  docketNumber?: string;
  nominatedDriver?: {
    name: string;
    licenseNumber: string;
    contactNumber?: string;
  };
};

export const INITIAL_DISPUTES: Dispute[] = [
  {
    id: "disp-001",
    docketNumber: "QC-TAB-2026-0891",
    citation_id: "QC-NOV-2026-9021",
    statutoryGround: "Emergency Vehicle Precedence",
    reason:
      "I had to cross the stop line and enter the intersection during the red phase because QC DRRMC Emergency Ambulance (QC-AMB-04) was blaring its siren directly behind me. Failing to advance would have obstructed critical patient transport to East Avenue Medical Center.",
    status: "pending",
    admin_notes: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
    resolved_at: null,
    resolved_by: null,
    supportingDocumentName: "Ambulance_Emergency_Dispatch_Log.pdf",
    supportingDocumentUrl: "https://images.unsplash.com/photo-1587745416684-47953f16f02f?w=800&auto=format&fit=crop&q=80",
    citation: {
      id: "cit-001",
      citation_number: "QC-NOV-2026-9021",
      plate_number: "NDB-8921",
      offense: "Disregarding Traffic Control Signal (Red Light)",
      amount: 2500,
      status: "contested",
      location: "Commonwealth Ave cor. Tandang Sora Ave",
      lane: "Lane 2 (Inbound)",
      speedKph: 24,
      evidenceUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&auto=format&fit=crop&q=80",
    },
  },
  {
    id: "disp-002",
    docketNumber: "QC-TAB-2026-0844",
    citation_id: "QC-NOV-2026-7833",
    statutoryGround: "Manual Enforcer Directive Override",
    reason:
      "Culiat Traffic enforcer PO2 Dela Cruz was manually gesturing and waving vehicles forward from Central Ave despite the yellow box junction congestion. In accordance with Section 14 of the QC Traffic Code, manual officer directives supersede automated optical signals.",
    status: "pending",
    admin_notes: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(), // 18 hours ago
    resolved_at: null,
    resolved_by: null,
    supportingDocumentName: "Dashcam_Footage_Enforcer_Waving.mp4",
    citation: {
      id: "cit-002",
      citation_number: "QC-NOV-2026-7833",
      plate_number: "ABC 1234",
      offense: "Yellow Box Intersection Obstruction",
      amount: 1500,
      status: "contested",
      location: "Visayas Avenue cor. Central Ave",
      lane: "Lane 1 (Outbound)",
      speedKph: 12,
      evidenceUrl: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&auto=format&fit=crop&q=80",
    },
  },
  {
    id: "disp-003",
    docketNumber: "QC-TAB-2026-0792",
    citation_id: "QC-NOV-2026-6140",
    statutoryGround: "Nominated Alternate Driver",
    reason:
      "I am the registered owner, but the vehicle was under long-term corporate charter with SwiftFleet Logistics on the date of apprehension. The driver operating the vehicle has submitted an affidavit acknowledging operation of the vehicle.",
    status: "pending",
    admin_notes: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    resolved_at: null,
    resolved_by: null,
    nominatedDriver: {
      name: "Rommel B. Magtanggol",
      licenseNumber: "N02-14-889021",
      contactNumber: "+63 917 882 1944",
    },
    supportingDocumentName: "Notarized_Affidavit_of_Driver_Admission.pdf",
    citation: {
      id: "cit-003",
      citation_number: "QC-NOV-2026-6140",
      plate_number: "WHI 9981",
      offense: "Unauthorized Use of Exclusive EDSA/Commonwealth Busway",
      amount: 5000,
      status: "contested",
      location: "Commonwealth Ave Median Bus Lane",
      lane: "Bus Rapid Transit Lane",
      speedKph: 48,
      evidenceUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80",
    },
  },
  {
    id: "disp-004",
    docketNumber: "QC-TAB-2026-0619",
    citation_id: "QC-NOV-2026-4402",
    statutoryGround: "Optical Plate Misread / Clone Plate",
    reason:
      "Automated plate reader tagged my private sedan NDG-4412, but closer inspection of the camera snapshot reveals the apprehended vehicle is a commercial white taxi with plate NDG-4417.",
    status: "approved",
    admin_notes:
      "CCTV footage optical audit confirms character segmentation error on character 7 ('7' read as '2'). Citation dismissed under TAB Resolution 2026-081. Fine cancelled and LTO LTMS registration hold expunged.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    resolved_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    resolved_by: "Atty. M. Roxas (Senior TAB Hearing Officer)",
    citation: {
      id: "cit-004",
      citation_number: "QC-NOV-2026-4402",
      plate_number: "NDG 4412",
      offense: "Counterflow / Driving Against Traffic",
      amount: 3000,
      status: "waived",
      location: "Tandang Sora Underpass Northbound",
      lane: "Opposing Lane 1",
      speedKph: 55,
      evidenceUrl: "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=800&auto=format&fit=crop&q=80",
    },
  },
];

export function useDisputes() {
  const qc = useQueryClient();

  useEffect(() => {
    try {
      const channel = supabase
        .channel(`realtime-disputes_${Math.random().toString(36).substring(2, 9)}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "disputes" }, () => {
          qc.invalidateQueries({ queryKey: ["disputes"] });
          qc.invalidateQueries({ queryKey: ["citizen-disputes"] });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch {
      // fallback
    }
  }, [qc]);

  return useQuery({
    queryKey: ["disputes"],
    queryFn: async () => {
      try {
        const rows = await serverFetchDisputes();
        if (Array.isArray(rows) && rows.length > 0) {
          return rows.map((r: any) => ({
            ...r,
            citation: r.citation
              ? {
                  ...r.citation,
                  evidenceUrl: r.citation.evidence_url || r.citation.evidenceUrl || "/assets/violation-1.jpg",
                }
              : undefined,
          })) as Dispute[];
        }
      } catch (err) {
        console.warn("[Disputes] Server fetch error, using fallback dockets:", err);
      }
      return INITIAL_DISPUTES;
    },
  });
}

export function useCitizenDisputes() {
  return useQuery({
    queryKey: ["citizen-disputes"],
    queryFn: async () => {
      try {
        const rows = await serverFetchDisputes();
        if (Array.isArray(rows) && rows.length > 0) {
          return rows.map((r: any) => ({
            ...r,
            citation: r.citation
              ? {
                  ...r.citation,
                  evidenceUrl: r.citation.evidence_url || r.citation.evidenceUrl || "/assets/violation-1.jpg",
                }
              : undefined,
          })) as Dispute[];
        }
      } catch {
        // fallback
      }
      return INITIAL_DISPUTES;
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
      return await serverSaveDispute({
        data: {
          citationNumber: input.citation_id,
          reason: input.reason,
          statutoryGround: input.statutoryGround,
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["citizen-disputes"] });
      qc.invalidateQueries({ queryKey: ["disputes"] });
      qc.invalidateQueries({ queryKey: ["citations"] });
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
      try {
        await serverResolveDispute({
          data: {
            disputeId: input.id,
            action: input.status === "approved" ? "grant" : "uphold",
            resolutionNotes: input.admin_notes,
          },
        });
      } catch (err) {
        console.warn("[serverResolveDispute] Fallback local update:", err);
      }

      // Optimistically update local query cache
      qc.setQueryData<Dispute[]>(["disputes"], (old = []) => {
        return old.map((d) =>
          d.id === input.id
            ? {
                ...d,
                status: input.status,
                admin_notes: input.admin_notes || d.admin_notes,
                resolved_at: new Date().toISOString(),
                resolved_by: input.resolved_by || "Atty. M. Roxas (TAB Hearing Officer)",
              }
            : d
        );
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["disputes"] });
      qc.invalidateQueries({ queryKey: ["citizen-disputes"] });
      qc.invalidateQueries({ queryKey: ["citations"] });
    },
  });
}
