import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AdvisorySeverity = "Info" | "Warning" | "Critical";

export type Advisory = {
  id: string;
  title: string;
  message: string;
  severity: AdvisorySeverity;
  active: boolean;
  publishedAt: string;
};

const DEFAULT_ADVISORIES: Advisory[] = [
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
    queryFn: async (): Promise<Advisory[]> => {
      try {
        const { data, error } = await supabase
          .from("traffic_advisories")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id,
            title: d.title,
            message: d.message,
            severity: (d.severity === "critical" ? "Critical" : d.severity === "warning" ? "Warning" : "Info") as AdvisorySeverity,
            active: d.is_active,
            publishedAt: d.created_at,
          }));
        }
      } catch {
        // fallback
      }
      return DEFAULT_ADVISORIES;
    },
  });
}

export function useCreateAdvisory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; message: string; severity: string; corridor: string }) => {
      await supabase.from("traffic_advisories").insert({
        title: input.title,
        message: input.message,
        severity: input.severity.toLowerCase(),
        affected_corridor: input.corridor || "All Corridors",
        is_active: true,
      });

      try {
        await supabase.from("audit_logs").insert({
          actor_name: "Public Information Officer",
          actor_role: "admin",
          action: "TRAFFIC_ADVISORY_BROADCAST",
          target_resource: input.title,
          details: `Severity: ${input.severity}, Corridor: ${input.corridor || "All Corridors"}`,
        });
      } catch (err) {
        console.warn(err);
      }
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["advisories"] });
    },
  });
}

export function useToggleAdvisoryStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active, title }: { id: string; active: boolean; title?: string }) => {
      await supabase
        .from("traffic_advisories")
        .update({ is_active: active })
        .eq("id", id);

      try {
        await supabase.from("audit_logs").insert({
          actor_name: "Public Information Officer",
          actor_role: "admin",
          action: active ? "TRAFFIC_ADVISORY_ACTIVATED" : "TRAFFIC_ADVISORY_ARCHIVED",
          target_resource: title || id,
          details: `Status set to ${active ? "Live" : "Archived"}`,
        });
      } catch (err) {
        console.warn(err);
      }
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["advisories"] });
    },
  });
}
