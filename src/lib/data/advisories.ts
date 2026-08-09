import { useQuery } from "@tanstack/react-query";

export type AdvisorySeverity = "Info" | "Warning" | "Critical";

export type Advisory = {
  id: string;
  title: string;
  message: string;
  severity: AdvisorySeverity;
  active: boolean;
  publishedAt: string;
};

const MOCK_ADVISORIES: Advisory[] = [
  {
    id: "ADV-101",
    title: "Heavy Traffic on Commonwealth Ave",
    message: "Expect 30-minute delays northbound due to ongoing roadworks near Philcoa.",
    severity: "Warning",
    active: true,
    publishedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "ADV-102",
    title: "Accident Cleared on EDSA North",
    message: "Traffic is returning to normal flow. All lanes are now open.",
    severity: "Info",
    active: true,
    publishedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: "ADV-103",
    title: "Typhoon Protocol Active",
    message: "Due to heavy flooding, Visayas Ave is completely impassable. Re-route immediately.",
    severity: "Critical",
    active: true,
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

export function useAdvisories() {
  return useQuery({
    queryKey: ["advisories"],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 400));
      return MOCK_ADVISORIES;
    }
  });
}
