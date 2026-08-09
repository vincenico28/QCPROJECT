import { useQuery } from "@tanstack/react-query";

export type DisputeStatus = "Submitted" | "Under Review" | "Evidence Requested" | "Resolved";

export type CitizenDispute = {
  id: string;
  citationId: string;
  dateSubmitted: string;
  status: DisputeStatus;
  reason: string;
  officerNotes?: string;
};

const MOCK_DISPUTES: CitizenDispute[] = [
  {
    id: "DSP-2023-0891",
    citationId: "CIT-00129",
    dateSubmitted: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    status: "Under Review",
    reason: "I was not driving the vehicle at the time. It was stolen, police report attached.",
  },
  {
    id: "DSP-2023-0895",
    citationId: "CIT-00135",
    dateSubmitted: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    status: "Evidence Requested",
    reason: "The traffic light was yellow when I crossed. I have dashcam footage.",
    officerNotes: "Please upload the unedited dashcam footage showing the intersection crossing.",
  }
];

export function useCitizenDisputes() {
  return useQuery({
    queryKey: ["citizen-disputes"],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return MOCK_DISPUTES;
    }
  });
}
