import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
export type UserRole = "admin" | "dispatcher" | "officer" | "citizen";

export function getRoleFromUser(user: User | null): UserRole {
  if (!user?.email) return "citizen";
  if (user.email.startsWith("officer")) return "officer";
  if (
    user.email.startsWith("admin") ||
    user.email.includes("qc.gov.ph") ||
    user.email === "escalavincenico28@gmail.com"
  ) {
    return "admin";
  }
  return "citizen";
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

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

  const user = session?.user ?? null;
  const role = getRoleFromUser(user);

  return { session, loading, user, role };
}
