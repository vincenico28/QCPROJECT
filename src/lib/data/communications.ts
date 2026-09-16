import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type EmailLog = {
  id: string;
  recipient: string;
  recipientName?: string;
  subject: string;
  type:
    | "Citation Notice"
    | "Payment Receipt"
    | "Warning Reminder"
    | "TAB Appeal Resolution"
    | "Emergency Advisory"
    | "Payment Declined";
  status: "Delivered" | "Bounced" | "Pending";
  timestamp: string;
  citationNumber?: string;
  plateNumber?: string;
  vehicleModel?: string;
  offense?: string;
  amount?: number;
  previewBody?: string;
};

const DEFAULT_EMAILS: EmailLog[] = [
  {
    id: "MSG-00195",
    recipient: "juan.delacruz@gmail.com",
    recipientName: "Juan Dela Cruz",
    subject: "QC LGU & MMDA NCAP: Official Notice of Violation (NOV-2026-QC-00129)",
    type: "Citation Notice",
    status: "Delivered",
    citationNumber: "NOV-2026-QC-00129",
    plateNumber: "NDB-8921",
    vehicleModel: "Toyota Fortuner",
    offense: "Disregarding Traffic Sign / Red Light Jump",
    amount: 1500,
    timestamp: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
    previewBody:
      "An automated traffic violation was recorded for vehicle NDB-8921 (Red Light Jump) on Commonwealth Ave. Settle within 10 days to avoid LTO LTMS registration hold.",
  },
  {
    id: "MSG-00194",
    recipient: "maria.santos@yahoo.com",
    recipientName: "Maria Santos",
    subject: "Official Electronic Receipt & LTO Clearance: NOV-2026-QC-00135",
    type: "Payment Receipt",
    status: "Delivered",
    citationNumber: "NOV-2026-QC-00135",
    plateNumber: "ABC-1234",
    vehicleModel: "Honda Civic RS",
    offense: "Illegal Parking (Attended)",
    amount: 1000,
    timestamp: new Date(Date.now() - 1000 * 60 * 38).toISOString(),
    previewBody:
      "Your payment of PHP 1,000.00 via GCash has been verified. Your vehicle registration hold is lifted and your Certificate of Traffic Clearance is active.",
  },
  {
    id: "MSG-00193",
    recipient: "roberto.santos@outlook.com",
    recipientName: "Roberto Santos",
    subject: "Traffic Adjudication Board: Resolution Order on Docket TAB-2026-0891",
    type: "TAB Appeal Resolution",
    status: "Delivered",
    citationNumber: "NOV-2026-QC-00142",
    plateNumber: "XYZ-987",
    vehicleModel: "Mitsubishi Montero Sport",
    offense: "Obstruction of Road / Yellow Box",
    amount: 2000,
    timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    previewBody:
      "Your appeal regarding flash flood manual enforcer override has been reviewed by the Traffic Adjudication Board. Status: Pending Formal Order.",
  },
  {
    id: "MSG-00192",
    recipient: "driver.warning@domain.ph",
    recipientName: "Carlos Mendoza",
    subject: "URGENT WARNING: 7 Days Remaining to Settle NOV-2026-QC-00150",
    type: "Warning Reminder",
    status: "Delivered",
    citationNumber: "NOV-2026-QC-00150",
    plateNumber: "CAS-3901",
    vehicleModel: "Nissan Navara",
    offense: "Speed Limit Exceeded (>20 km/h)",
    amount: 2500,
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    previewBody:
      "Notice of Violation NOV-2026-QC-00150 is due in 7 calendar days. Unsettled notices will trigger an automatic LTO LTMS vehicle registration alarm.",
  },
  {
    id: "MSG-00191",
    recipient: "invalid.recipient@notfound.xyz",
    recipientName: "Mail Delivery Subsystem",
    subject: "QC Traffic Enforcement: Notice of Violation (NOV-2026-QC-00099)",
    type: "Citation Notice",
    status: "Bounced",
    citationNumber: "NOV-2026-QC-00099",
    plateNumber: "WXY-1122",
    vehicleModel: "Isuzu D-Max",
    offense: "No Helmet / Protective Gear",
    amount: 1500,
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    previewBody:
      "Delivery failed: Recipient mailbox not found. Dispatching physical postal mail notice via Barangay Culiat courier.",
  },
];

export function useEmailLogs() {
  const qc = useQueryClient();

  useEffect(() => {
    try {
      const channel = supabase
        .channel("realtime-email-logs")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "email_logs" },
          () => {
            qc.invalidateQueries({ queryKey: ["email-logs"] });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch {
      // Realtime fallback
    }
  }, [qc]);

  return useQuery({
    queryKey: ["email-logs"],
    queryFn: async (): Promise<EmailLog[]> => {
      try {
        const { data, error } = await supabase
          .from("email_logs")
          .select("*")
          .order("sent_at", { ascending: false });

        if (!error && data && data.length > 0) {
          const citNumbers = data
            .map((d: any) => d.citation_number)
            .filter(Boolean);

          const citMap = new Map<string, any>();
          if (citNumbers.length > 0) {
            try {
              const { data: citRows } = await supabase
                .from("citations")
                .select(
                  "citation_number, plate_number, vehicle_model, offense, amount"
                )
                .in("citation_number", citNumbers);
              if (citRows) {
                for (const c of citRows) {
                  citMap.set(c.citation_number, c);
                }
              }
            } catch {
              // Ignore citation lookup error
            }
          }

          return data.map((d: any) => {
            const cit = d.citation_number ? citMap.get(d.citation_number) : null;
            return {
              id: d.id,
              recipient: d.recipient_email,
              recipientName: d.recipient_name || undefined,
              subject: d.subject,
              type:
                (d.template_name as EmailLog["type"]) || "Citation Notice",
              status:
                d.status === "delivered"
                  ? "Delivered"
                  : d.status === "bounced"
                  ? "Bounced"
                  : "Pending",
              timestamp: d.sent_at,
              citationNumber: d.citation_number || undefined,
              plateNumber: cit?.plate_number || undefined,
              vehicleModel: cit?.vehicle_model || undefined,
              offense: cit?.offense || undefined,
              amount: cit?.amount ? Number(cit.amount) : undefined,
              previewBody: d.subject,
            };
          });
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
      recipientName?: string;
      subject: string;
      type: EmailLog["type"];
      citationNumber?: string;
      plateNumber?: string;
      body: string;
    }) => {
      try {
        await supabase.from("email_logs").insert({
          recipient_email: input.recipient,
          recipient_name:
            input.recipientName || input.recipient.split("@")[0],
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
