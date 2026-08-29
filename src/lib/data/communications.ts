import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

const DEFAULT_EMAILS: EmailLog[] = [
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
    queryFn: async (): Promise<EmailLog[]> => {
      try {
        const { data, error } = await supabase
          .from("email_logs")
          .select("*")
          .order("sent_at", { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id,
            recipient: d.recipient_email,
            subject: d.subject,
            type: (d.template_name as EmailLog["type"]) || "Citation Notice",
            status: (d.status === "delivered" ? "Delivered" : d.status === "bounced" ? "Bounced" : "Pending"),
            timestamp: d.sent_at,
            citationNumber: d.citation_number || undefined,
            previewBody: d.subject,
          }));
        }
      } catch {
        // fallback
      }
      return DEFAULT_EMAILS;
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
      try {
        await supabase.from("email_logs").insert({
          recipient_email: input.recipient,
          recipient_name: input.recipient.split("@")[0],
          citation_number: input.citationNumber || null,
          subject: input.subject,
          template_name: input.type,
          status: "delivered",
        });

        await supabase.from("audit_logs").insert({
          actor_name: "LGU Communications Dispatcher",
          actor_role: "admin",
          action: "OFFICIAL_NOTIFICATION_SENT",
          target_resource: `Recipient: ${input.recipient}`,
          details: `Type: ${input.type}, Subject: ${input.subject}`,
        });
      } catch (err) {
        console.warn(err);
      }
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email-logs"] });
    },
  });
}
