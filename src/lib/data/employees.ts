import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type EmployeeRole = "admin" | "dispatcher" | "officer" | "adjudicator";
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

export let MOCK_EMPLOYEES: Employee[] = [
  {
    id: "EMP-001",
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
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(),
    last_active: new Date().toISOString(),
  },
  {
    id: "EMP-002",
    badge_number: "BADGE-101",
    full_name: "Juan Dela Cruz",
    email: "officer.delacruz@quezoncity.gov.ph",
    role: "officer",
    rank: "Sergeant",
    unit: "Traffic Enforcement",
    district: "District 1 - Culiat Central",
    contact_number: "0917-123-4567",
    status: "active",
    on_duty: true,
    citations_issued: 145,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
    last_active: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: "EMP-003",
    badge_number: "BADGE-102",
    full_name: "Maria Santos",
    email: "officer.santos@quezoncity.gov.ph",
    role: "officer",
    rank: "Officer II",
    unit: "Mobile Patrol",
    district: "District 2 - Commonwealth",
    contact_number: "0917-234-5678",
    status: "active",
    on_duty: false,
    citations_issued: 89,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    last_active: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    id: "EMP-004",
    badge_number: "BADGE-104",
    full_name: "Field Officer Ramos",
    email: "officer.ramos@quezoncity.gov.ph",
    role: "officer",
    rank: "Officer I",
    unit: "Traffic Management",
    district: "District 1 - Culiat Central",
    contact_number: "0918-987-6543",
    status: "active",
    on_duty: true,
    citations_issued: 42,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    last_active: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: "EMP-005",
    badge_number: "DSP-088",
    full_name: "Elena Bautista",
    email: "dispatcher.elena@quezoncity.gov.ph",
    role: "dispatcher",
    rank: "Senior Dispatcher",
    unit: "Emergency Communications",
    district: "HQ Dispatch Center",
    contact_number: "0919-456-7890",
    status: "active",
    on_duty: true,
    citations_issued: 0,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
    last_active: new Date().toISOString(),
  },
  {
    id: "EMP-006",
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
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 75).toISOString(),
    last_active: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
];

export function useEmployees() {
  return useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 300));
      return [...MOCK_EMPLOYEES];
    },
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewEmployeeInput) => {
      await new Promise((r) => setTimeout(r, 600));

      const id = `EMP-${String(MOCK_EMPLOYEES.length + 1).padStart(3, "0")}`;
      const badge =
        input.badge_number?.trim() ||
        (input.role === "officer"
          ? `BADGE-${Math.floor(100 + Math.random() * 900)}`
          : input.role === "dispatcher"
          ? `DSP-${Math.floor(10 + Math.random() * 90)}`
          : input.role === "adjudicator"
          ? `ADJ-${Math.floor(10 + Math.random() * 90)}`
          : `ADM-${Math.floor(10 + Math.random() * 90)}`);

      const newEmp: Employee = {
        id,
        badge_number: badge,
        full_name: input.full_name,
        email: input.email.toLowerCase(),
        role: input.role,
        rank: input.rank,
        unit: input.unit,
        district: input.district,
        contact_number: input.contact_number || null,
        status: "active",
        on_duty: false,
        citations_issued: 0,
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
      };

      MOCK_EMPLOYEES.unshift(newEmp);

      // Attempt to register in Supabase Auth if connected (non-blocking)
      try {
        if (input.password) {
          await supabase.auth.signUp({
            email: input.email,
            password: input.password,
            options: {
              data: {
                full_name: input.full_name,
                role: input.role,
                badge_number: badge,
              },
            },
          });
        }
      } catch (err) {
        console.warn("Supabase auth user creation fallback:", err);
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
      await new Promise((r) => setTimeout(r, 400));
      const idx = MOCK_EMPLOYEES.findIndex((e) => e.id === input.id);
      if (idx === -1) throw new Error("Employee not found");

      MOCK_EMPLOYEES[idx] = {
        ...MOCK_EMPLOYEES[idx],
        ...(input.role && { role: input.role }),
        ...(input.status && { status: input.status }),
        ...(input.rank && { rank: input.rank }),
        ...(input.unit && { unit: input.unit }),
        ...(input.district && { district: input.district }),
        ...(input.contact_number !== undefined && { contact_number: input.contact_number }),
      };

      return MOCK_EMPLOYEES[idx];
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
      await new Promise((r) => setTimeout(r, 400));
      MOCK_EMPLOYEES = MOCK_EMPLOYEES.filter((e) => e.id !== id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      qc.invalidateQueries({ queryKey: ["officers"] });
    },
  });
}
