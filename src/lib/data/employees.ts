import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  serverSaveOfficer,
  serverUpdateStaffMember,
  serverDeleteStaffMember,
} from "@/lib/server.functions";

export type EmployeeRole = "admin" | "dispatcher" | "officer" | "adjudicator" | "finance";
export type EmployeeStatus = "active" | "on_leave" | "suspended";

export type Employee = {
  id: string;
  badge_number: string;
  full_name: string;
  email: string;
  role: EmployeeRole;
  rank: string;
  unit: string;
  district: string;
  contact_number: string | null;
  status: EmployeeStatus;
  on_duty: boolean;
  citations_issued: number;
  created_at: string;
  last_active: string;
};

export type NewEmployeeInput = {
  full_name: string;
  email: string;
  password?: string;
  role: EmployeeRole;
  rank: string;
  unit: string;
  district: string;
  badge_number?: string;
  contact_number?: string;
};

/**
 * Baseline executive staff accounts (Super Admin & System Admin)
 * Ensure that Executive Command and Operations Administrators are always represented
 * even before external OAuth/auth users are synchronized.
 */
export const EXECUTIVE_COMMAND_STAFF: Employee[] = [
  {
    id: "EMP-ADMIN-001",
    badge_number: "BADGE-100",
    full_name: "Vincent Nico Escala",
    email: "escalavincenico28@gmail.com",
    role: "admin",
    rank: "Chief Operations Director",
    unit: "Executive Command",
    district: "Quezon City Central HQ",
    contact_number: "0917-000-0001",
    status: "active",
    on_duty: true,
    citations_issued: 0,
    created_at: "2026-05-01T08:00:00.000Z",
    last_active: new Date().toISOString(),
  },
  {
    id: "EMP-DISP-088",
    badge_number: "DSP-088",
    full_name: "Elena Bautista",
    email: "dispatcher.elena@quezoncity.gov.ph",
    role: "dispatcher",
    rank: "Senior Dispatcher Specialist",
    unit: "Emergency Communications",
    district: "HQ Dispatch Center",
    contact_number: "0919-456-7890",
    status: "active",
    on_duty: true,
    citations_issued: 0,
    created_at: "2026-07-15T08:00:00.000Z",
    last_active: new Date().toISOString(),
  },
  {
    id: "EMP-ADJ-012",
    badge_number: "ADJ-012",
    full_name: "Atty. Fernando Reyes",
    email: "adjudicator.reyes@quezoncity.gov.ph",
    role: "adjudicator",
    rank: "Legal Adjudicator",
    unit: "Disputes & Appeals Board",
    district: "Legal Affairs Office",
    contact_number: "0920-567-8901",
    status: "active",
    on_duty: true,
    citations_issued: 0,
    created_at: "2026-06-20T08:00:00.000Z",
    last_active: new Date().toISOString(),
  },
  {
    id: "EMP-FIN-005",
    badge_number: "FIN-005",
    full_name: "Clara Mendoza",
    email: "finance.mendoza@quezoncity.gov.ph",
    role: "finance",
    rank: "Treasury Officer",
    unit: "Revenue & Collections",
    district: "QC Treasury Main",
    contact_number: "0921-987-1122",
    status: "active",
    on_duty: true,
    citations_issued: 0,
    created_at: "2026-06-10T08:00:00.000Z",
    last_active: new Date().toISOString(),
  },
];

// In-memory registered staff storage for newly provisioned non-officers
let localProvisionedStaff: Employee[] = [];

export function useEmployees() {
  const qc = useQueryClient();

  // Setup live Supabase Realtime subscriptions to react immediately to database updates
  useEffect(() => {
    try {
      const channel = supabase
        .channel(`realtime-employees-directory_${Math.random().toString(36).slice(2, 8)}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "officers" }, () => {
          qc.invalidateQueries({ queryKey: ["employees"] });
          qc.invalidateQueries({ queryKey: ["officers"] });
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "user_roles" }, () => {
          qc.invalidateQueries({ queryKey: ["employees"] });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn("[Realtime Staff Subscription Warning]:", err);
    }
  }, [qc]);

  return useQuery({
    queryKey: ["employees"],
    queryFn: async (): Promise<Employee[]> => {
      // 1. Fetch live officers from database
      let dbOfficers: any[] = [];
      try {
        const { data, error } = await supabase
          .from("officers")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data) {
          dbOfficers = data;
        }
      } catch (err) {
        console.warn("[Staff Directory] Error querying officers:", err);
      }

      // Convert DB officers to unified Employee schema
      const officerEmployees: Employee[] = dbOfficers.map((o: any) => {
        const email = `${o.full_name.toLowerCase().trim().replace(/[^a-z0-9]+/g, ".")}@quezoncity.gov.ph`;
        return {
          id: o.id,
          badge_number: o.badge_number || "BADGE-000",
          full_name: o.full_name,
          email,
          role: "officer",
          rank: o.rank || "Officer I",
          unit: o.unit || "Traffic Enforcement",
          district: o.district || "District 6 (Culiat)",
          contact_number: o.contact_number,
          status: (o.status as EmployeeStatus) || "active",
          on_duty: !!o.on_duty,
          citations_issued: Number(o.citations_issued || 0),
          created_at: o.created_at,
          last_active: o.updated_at || o.created_at,
        };
      });

      // 2. Fetch live user_roles to match any administrative/specialized personnel
      let assignedRoles: any[] = [];
      try {
        const { data: rolesData, error: rolesErr } = await (supabase as any)
          .from("user_roles")
          .select("*");
        if (!rolesErr && rolesData) {
          assignedRoles = rolesData;
        }
      } catch (err) {
        console.warn("[Staff Directory] Error querying user_roles:", err);
      }

      // 3. Assemble baseline executive accounts
      const nonOfficers: Employee[] = [...EXECUTIVE_COMMAND_STAFF];

      // Merge locally provisioned staff that are not in DB officers yet
      for (const prov of localProvisionedStaff) {
        if (!nonOfficers.some((e) => e.id === prov.id) && !officerEmployees.some((e) => e.id === prov.id)) {
          nonOfficers.push(prov);
        }
      }

      // Combine all personnel
      const allEmployees = [...nonOfficers, ...officerEmployees];

      // Deduplicate by ID and badge_number
      const seenIds = new Set<string>();
      const seenBadges = new Set<string>();
      const deduped: Employee[] = [];

      for (const emp of allEmployees) {
        if (emp.id && seenIds.has(emp.id)) continue;
        if (emp.badge_number && seenBadges.has(emp.badge_number.toUpperCase())) continue;
        if (emp.id) seenIds.add(emp.id);
        if (emp.badge_number) seenBadges.add(emp.badge_number.toUpperCase());
        deduped.push(emp);
      }

      return deduped;
    },
    staleTime: 5000,
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewEmployeeInput): Promise<Employee> => {
      const badge =
        input.badge_number?.trim() ||
        (input.role === "officer"
          ? `BADGE-${Math.floor(100 + Math.random() * 900)}`
          : input.role === "dispatcher"
          ? `DSP-${Math.floor(10 + Math.random() * 90)}`
          : input.role === "adjudicator"
          ? `ADJ-${Math.floor(10 + Math.random() * 90)}`
          : input.role === "finance"
          ? `FIN-${Math.floor(10 + Math.random() * 90)}`
          : `ADM-${Math.floor(10 + Math.random() * 90)}`);

      let createdId = `EMP-${Date.now()}`;

      // 1. If role is officer, persist row directly into public.officers in PostgreSQL
      if (input.role === "officer") {
        try {
          const row = await serverSaveOfficer({
            data: {
              badge_number: badge,
              full_name: input.full_name,
              rank: input.rank || "Officer I",
              unit: input.unit || "Traffic Management",
              district: input.district || "District 6 (Culiat)",
              contact_number: input.contact_number || null,
            },
          });
          if (row?.id) createdId = row.id;
        } catch (err) {
          console.error("[Staff Directory] Error saving officer to database:", err);
          throw err;
        }
      }

      // 2. If email & password are provided, register Supabase Auth user & user_roles
      try {
        if (input.password && input.email) {
          const { data: signUpData } = await supabase.auth.signUp({
            email: input.email.trim(),
            password: input.password,
            options: {
              data: {
                full_name: input.full_name,
                role: input.role,
                badge_number: badge,
                rank: input.rank,
                unit: input.unit,
                district: input.district,
              },
            },
          });

          if (signUpData?.user?.id) {
            createdId = signUpData.user.id;
            try {
              await (supabase as any).from("user_roles").upsert(
                {
                  user_id: signUpData.user.id,
                  role: input.role,
                },
                { onConflict: "user_id,role" }
              );
            } catch (roleSyncErr) {
              console.warn("Could not save to user_roles table:", roleSyncErr);
            }
          }
        }
      } catch (authErr) {
        console.warn("[Staff Directory] Auth signUp note:", authErr);
      }

      const newEmp: Employee = {
        id: createdId,
        badge_number: badge,
        full_name: input.full_name,
        email: input.email.toLowerCase().trim(),
        role: input.role,
        rank: input.rank,
        unit: input.unit,
        district: input.district,
        contact_number: input.contact_number || null,
        status: "active",
        on_duty: input.role === "officer",
        citations_issued: 0,
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
      };

      // Add to local state cache
      localProvisionedStaff.unshift(newEmp);

      // Audit log entry
      try {
        await supabase.from("audit_logs").insert({
          actor_name: "Executive Staff Admin",
          actor_role: "admin",
          action: "EMPLOYEE_PROVISIONED",
          target_resource: `${input.full_name} (${badge})`,
          details: `Role: ${input.role}, Unit: ${input.unit}, District: ${input.district}`,
        });
      } catch (logErr) {
        console.warn("[Staff Directory] Audit log skipped:", logErr);
      }

      return newEmp;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      qc.invalidateQueries({ queryKey: ["officers"] });
    },
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      role?: EmployeeRole;
      status?: EmployeeStatus;
      rank?: string;
      unit?: string;
      district?: string;
      contact_number?: string;
    }) => {
      // 1. Call server function to persist into PostgreSQL officers / user_roles
      try {
        await serverUpdateStaffMember({
          data: {
            id: input.id,
            role: input.role,
            status: input.status,
            rank: input.rank,
            unit: input.unit,
            district: input.district,
            contact_number: input.contact_number,
          },
        });
      } catch (serverErr) {
        console.warn("[Staff Directory] Server update fallback attempt:", serverErr);
        // Direct client fallback if running in client context
        if (input.status || input.rank || input.unit || input.district) {
          const payload: any = { updated_at: new Date().toISOString() };
          if (input.status) payload.status = input.status;
          if (input.rank) payload.rank = input.rank;
          if (input.unit) payload.unit = input.unit;
          if (input.district) payload.district = input.district;
          if (input.contact_number !== undefined) payload.contact_number = input.contact_number;

          await supabase.from("officers").update(payload).eq("id", input.id);
        }
      }

      // Update executive or local provisioned staff if found
      const execIdx = EXECUTIVE_COMMAND_STAFF.findIndex((e) => e.id === input.id);
      if (execIdx !== -1) {
        EXECUTIVE_COMMAND_STAFF[execIdx] = {
          ...EXECUTIVE_COMMAND_STAFF[execIdx],
          ...(input.role && { role: input.role }),
          ...(input.status && { status: input.status }),
          ...(input.rank && { rank: input.rank }),
          ...(input.unit && { unit: input.unit }),
          ...(input.district && { district: input.district }),
          ...(input.contact_number !== undefined && { contact_number: input.contact_number }),
        };
      }

      const provIdx = localProvisionedStaff.findIndex((e) => e.id === input.id);
      if (provIdx !== -1) {
        localProvisionedStaff[provIdx] = {
          ...localProvisionedStaff[provIdx],
          ...(input.role && { role: input.role }),
          ...(input.status && { status: input.status }),
          ...(input.rank && { rank: input.rank }),
          ...(input.unit && { unit: input.unit }),
          ...(input.district && { district: input.district }),
          ...(input.contact_number !== undefined && { contact_number: input.contact_number }),
        };
      }

      return input;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      qc.invalidateQueries({ queryKey: ["officers"] });
    },
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // 1. Call server function to delete from officers table and user_roles
      try {
        await serverDeleteStaffMember({ data: { id } });
      } catch (serverErr) {
        console.warn("[Staff Directory] Server delete fallback:", serverErr);
        await supabase.from("officers").delete().eq("id", id);
      }

      // Remove from local provisioned cache
      localProvisionedStaff = localProvisionedStaff.filter((e) => e.id !== id);

      const execIdx = EXECUTIVE_COMMAND_STAFF.findIndex((e) => e.id === id);
      if (execIdx !== -1) {
        EXECUTIVE_COMMAND_STAFF.splice(execIdx, 1);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      qc.invalidateQueries({ queryKey: ["officers"] });
    },
  });
}
