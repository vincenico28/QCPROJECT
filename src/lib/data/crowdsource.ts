import { useQuery } from "@tanstack/react-query";

export type CrowdsourceReport = {
  id: string;
  submitter: string;
  location: string;
  violationType: "Reckless Driving" | "Illegal Parking" | "Counter-flow" | "Hit and Run";
  status: "Pending Review" | "Verified - Citation Issued" | "Rejected";
  confidenceScore: number;
  timestamp: string;
};

const MOCK_CROWDSOURCE: CrowdsourceReport[] = [
  {
    id: "REP-24-001",
    submitter: "Citizen #4412 (Verified User)",
    location: "Katipunan Ave",
    violationType: "Reckless Driving",
    status: "Pending Review",
    confidenceScore: 88, // AI pre-verification score
    timestamp: new Date().toISOString(),
  },
  {
    id: "REP-24-002",
    submitter: "Citizen #9182 (Verified User)",
    location: "EDSA - Quezon Ave",
    violationType: "Counter-flow",
    status: "Verified - Citation Issued",
    confidenceScore: 99,
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "REP-24-003",
    submitter: "Anonymous Upload",
    location: "Timog Ave",
    violationType: "Illegal Parking",
    status: "Rejected", // AI flagged as invalid/too blurry
    confidenceScore: 12,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  }
];

export function useCrowdsourceReports() {
  return useQuery({
    queryKey: ["crowdsource-reports"],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 350));
      return MOCK_CROWDSOURCE;
    }
  });
}
