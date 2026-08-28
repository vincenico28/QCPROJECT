import { useEffect, useState, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { SYSTEM_ROLES, type SystemRole } from "@/lib/rbac";

export type { SystemRole as UserRole };

export function getRoleFromUser(user: User | null): SystemRole {
  if (!user?.email) return "admin";
  const email = user.email.toLowerCase();

  if (
    email === "escalavincenico28@gmail.com" ||
    email.startsWith("superadmin") ||
    email.includes("super.admin")
  ) {
    return "super_admin";
  }

  if (email.startsWith("dispatcher") || email.includes("dispatch")) {
    return "dispatcher";
  }

  if (email.startsWith("officer") || email.includes("enforcer")) {
    return "officer";
  }

  if (email.startsWith("finance") || email.startsWith("cashier") || email.includes("treasury")) {
    return "finance";
  }

  if (email.startsWith("tab") || email.startsWith("adjudicat") || email.includes("legal")) {
    return "adjudicator";
  }

  if (email.startsWith("admin") || email.includes("qc.gov.ph")) {
    return "admin";
  }

  return "citizen";
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulatedRole, setSimulatedRoleState] = useState<SystemRole | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("qc_simulated_role");
      return (saved as SystemRole) || null;
    }
    return null;
  });

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const setSimulatedRole = useCallback((newRole: SystemRole | null) => {
    setSimulatedRoleState(newRole);
    if (typeof window !== "undefined") {
      if (newRole) {
        localStorage.setItem("qc_simulated_role", newRole);
      } else {
        localStorage.removeItem("qc_simulated_role");
      }
    }
  }, []);

  const user = session?.user ?? null;
  const baseRole = getRoleFromUser(user);
  const role: SystemRole = simulatedRole || baseRole;
  const roleDef = SYSTEM_ROLES[role] || SYSTEM_ROLES.admin;

  return { 
    session, 
    loading, 
    user, 
    role, 
    baseRole,
    roleDef,
    simulatedRole, 
    setSimulatedRole 
  };
}
