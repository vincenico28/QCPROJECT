import { useQuery } from "@tanstack/react-query";

export type EmailLog = {
  id: string;
  recipient: string;
  subject: string;
  type: "Citation Notice" | "Payment Receipt" | "Warning Reminder";
  status: "Delivered" | "Bounced" | "Pending";
  timestamp: string;
};

const MOCK_EMAILS: EmailLog[] = [
  {
    id: "MSG-00192",
    recipient: "juan.delacruz@example.com",
    subject: "QC Traffic Enforcement: Notice of Violation (CIT-00129)",
    type: "Citation Notice",
    status: "Delivered",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: "MSG-00191",
    recipient: "maria.santos@example.com",
    subject: "Official Receipt for Citation CIT-00088",
    type: "Payment Receipt",
    status: "Delivered",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "MSG-00190",
    recipient: "invalid.email@fake.com",
    subject: "QC Traffic Enforcement: Notice of Violation (CIT-00127)",
    type: "Citation Notice",
    status: "Bounced",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "MSG-00189",
    recipient: "pedro.penduko@example.com",
    subject: "FINAL WARNING: Unpaid Citation CIT-00045",
    type: "Warning Reminder",
    status: "Pending",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  }
];

export function useEmailLogs() {
  return useQuery({
    queryKey: ["email-logs"],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 600));
      return MOCK_EMAILS;
    }
  });
}
