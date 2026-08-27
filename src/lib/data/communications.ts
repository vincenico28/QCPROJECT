import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type EmailLog = {
  id: string;
  recipient: string;
  subject: string;
  type: "Citation Notice" | "Payment Receipt" | "Warning Reminder" | "TAB Appeal Resolution" | "Emergency Advisory";
  status: "Delivered" | "Bounced" | "Pending";
  timestamp: string;
  citationNumber?: string;
  plateNumber?: string;
  previewBody?: string;
};

let MOCK_EMAILS: EmailLog[] = [
  {
    id: "MSG-00195",
    recipient: "juan.delacruz@gmail.com",
    subject: "QC LGU & MMDA NCAP: Official Notice of Violation (NOV-2026-QC-00129)",
    type: "Citation Notice",
    status: "Delivered",
    citationNumber: "NOV-2026-QC-00129",
    plateNumber: "NDB-8921",
    timestamp: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
    previewBody: "An automated traffic violation was recorded for vehicle NDB-8921 (Red Light Jump) on Commonwealth Ave. Settle within 10 days to avoid LTO LTMS registration hold.",
  },
  {
    id: "MSG-00194",
    recipient: "maria.santos@yahoo.com",
    subject: "Official Electronic Receipt & LTO Clearance: NOV-2026-QC-00135",
    type: "Payment Receipt",
    status: "Delivered",
    citationNumber: "NOV-2026-QC-00135",
    plateNumber: "ABC-1234",
    timestamp: new Date(Date.now() - 1000 * 60 * 38).toISOString(),
    previewBody: "Your payment of PHP 1,500.00 via GCash has been verified. Your vehicle registration hold is lifted and your Certificate of Traffic Clearance is active.",
  },
  {
    id: "MSG-00193",
    recipient: "roberto.santos@outlook.com",
    subject: "Traffic Adjudication Board: Resolution Order on Docket TAB-2026-0891",
    type: "TAB Appeal Resolution",
    status: "Delivered",
    citationNumber: "NOV-2026-QC-00142",
    plateNumber: "XYZ-987",
    timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    previewBody: "Your appeal regarding flash flood manual enforcer override has been reviewed by the Traffic Adjudication Board. Status: Pending Formal Order.",
  },
  {
    id: "MSG-00192",
    recipient: "driver.warning@domain.ph",
    subject: "URGENT WARNING: 7 Days Remaining to Settle NOV-2026-QC-00150",
    type: "Warning Reminder",
    status: "Delivered",
    citationNumber: "NOV-2026-QC-00150",
    plateNumber: "CAS-3901",
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    previewBody: "Notice of Violation NOV-2026-QC-00150 is due in 7 calendar days. Unsettled notices will trigger an automatic LTO LTMS vehicle registration alarm.",
  },
  {
    id: "MSG-00191",
    recipient: "invalid.recipient@notfound.xyz",
    subject: "QC Traffic Enforcement: Notice of Violation (NOV-2026-QC-00099)",
    type: "Citation Notice",
    status: "Bounced",
    citationNumber: "NOV-2026-QC-00099",
    plateNumber: "WXY-1122",
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    previewBody: "Delivery failed: Recipient mailbox not found. Dispatching physical postal mail notice via Barangay Culiat courier.",
  },
];

export function useEmailLogs() {
  return useQuery({
    queryKey: ["email-logs"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return MOCK_EMAILS;
    },
  });
}

export function useSendNotificationEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      recipient: string;
      subject: string;
      type: EmailLog["type"];
      citationNumber?: string;
      plateNumber?: string;
      body: string;
    }) => {
      await new Promise((r) => setTimeout(r, 400));
      const newEmail: EmailLog = {
        id: `MSG-${Math.floor(10000 + Math.random() * 90000)}`,
        recipient: input.recipient,
        subject: input.subject,
        type: input.type,
        status: "Delivered",
        citationNumber: input.citationNumber,
        plateNumber: input.plateNumber,
        timestamp: new Date().toISOString(),
        previewBody: input.body,
      };
      MOCK_EMAILS.unshift(newEmail);
      return newEmail;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email-logs"] });
    },
  });
}
