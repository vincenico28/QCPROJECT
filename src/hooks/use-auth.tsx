import { useEffect, useState, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  SYSTEM_ROLES,
  DEFAULT_ROLE_PERMISSIONS,
  type SystemRole,
  resolveFallbackRole,
} from "@/lib/rbac";

export type { SystemRole as UserRole };

/**
 * Resolves fallback role for backwards compatibility
 */
export function getRoleFromUser(user: User | null): SystemRole {
  if (!user) return "citizen";
  const metadataRole = (user.user_metadata?.role || user.app_metadata?.role) as string | undefined;
  return resolveFallbackRole(user.email, metadataRole);
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbRole, setDbRole] = useState<SystemRole | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isDbSynced, setIsDbSynced] = useState(false);
  const [roleSource, setRoleSource] = useState<"database" | "metadata" | "fallback">("fallback");

  // Keep simulatedRole for development inspection if explicitly initiated, but default is null (DB active)
  const [simulatedRole, setSimulatedRoleState] = useState<SystemRole | null>(null);

  // Two-Factor Authentication (2FA) verification state for active session
  const [isTwoFactorVerified, setIsTwoFactorVerifiedState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("qc_2fa_session_verified") === "true";
    }
    return false;
  });

  const setTwoFactorVerified = useCallback((verified: boolean) => {
    setIsTwoFactorVerifiedState(verified);
    if (typeof window !== "undefined") {
      if (verified) {
        sessionStorage.setItem("qc_2fa_session_verified", "true");
      } else {
        sessionStorage.removeItem("qc_2fa_session_verified");
      }
    }
  }, []);

  // 1. Listen for Supabase auth state & active session
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) {
        setDbRole(null);
        setPermissions([]);
        setIsDbSynced(false);
        setLoading(false);
        setTwoFactorVerified(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, [setTwoFactorVerified]);

  // 2. Fetch and synchronize Role & Permissions automatically from the database
  const syncRoleFromDatabase = useCallback(async (activeUser: User) => {
    try {
      // Step A: Fetch user's registered role from public.user_roles
      const { data: roleRow, error: roleErr } = await (supabase as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", activeUser.id)
        .maybeSingle();

      let verifiedRole: SystemRole | null = null;

      if (!roleErr && roleRow?.role && roleRow.role in SYSTEM_ROLES) {
        verifiedRole = roleRow.role as SystemRole;
        setRoleSource("database");
        setIsDbSynced(true);
      } else {
        // Step B: Determine baseline role from user metadata, officer registry, or initial email
        const metadataRole = activeUser.user_metadata?.role || activeUser.app_metadata?.role;
        verifiedRole = resolveFallbackRole(activeUser.email, metadataRole);

        // Check if user is an officer in the officers directory
        if (verifiedRole === "citizen" && activeUser.email) {
          try {
            const prefix = activeUser.email.split("@")[0].toLowerCase();
            const { data: officerMatch } = await supabase
              .from("officers")
              .select("id")
              .ilike("full_name", `%${prefix.replace(".", " ")}%`)
              .limit(1);

            if (officerMatch && officerMatch.length > 0) {
              verifiedRole = "officer";
            }
          } catch {
            // Ignore officers check error
          }
        }

        setRoleSource(metadataRole ? "metadata" : "fallback");

        // Step C: Auto-persist determined role into public.user_roles in database
        try {
          await (supabase as any)
            .from("user_roles")
            .upsert(
              { user_id: activeUser.id, role: verifiedRole },
              { onConflict: "user_id,role" }
            );
          setIsDbSynced(true);
        } catch (saveErr) {
          console.warn("[RBAC Auto-Sync Warning]: Could not persist user role to DB:", saveErr);
        }
      }

      setDbRole(verifiedRole);

      // Step D: Fetch dynamic permissions for this role from public.role_permissions
      try {
        const { data: permsData, error: permsErr } = await (supabase as any)
          .from("role_permissions")
          .select("permission")
          .eq("role", verifiedRole);

        if (!permsErr && permsData && permsData.length > 0) {
          setPermissions(permsData.map((p: any) => p.permission));
        } else {
          setPermissions(DEFAULT_ROLE_PERMISSIONS[verifiedRole] || []);
        }
      } catch {
        setPermissions(DEFAULT_ROLE_PERMISSIONS[verifiedRole] || []);
      }
    } catch (err) {
      console.error("[RBAC] Error querying user role from database:", err);
      const fallback = resolveFallbackRole(activeUser.email);
      setDbRole(fallback);
      setPermissions(DEFAULT_ROLE_PERMISSIONS[fallback] || []);
    } finally {
      setLoading(false);
    }
  }, []);

  // 3. Trigger database synchronization when user changes
  useEffect(() => {
    if (!session?.user) {
      if (!session) setLoading(false);
      return;
    }

    syncRoleFromDatabase(session.user);

    // 4. Realtime subscription to live changes on user_roles for this user
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      const channelId = `rbac_user_role_${session.user.id}_${Math.random().toString(36).substring(2, 9)}`;
      channel = supabase
        .channel(channelId)
        .on(
          "postgres_changes" as any,
          {
            event: "*",
            schema: "public",
            table: "user_roles",
            filter: `user_id=eq.${session.user.id}`,
          },
          (payload: any) => {
            if (payload.new && payload.new.role && payload.new.role in SYSTEM_ROLES) {
              const updatedRole = payload.new.role as SystemRole;
              setDbRole(updatedRole);
              setIsDbSynced(true);
              setRoleSource("database");
              setPermissions(DEFAULT_ROLE_PERMISSIONS[updatedRole] || []);
            }
          }
        )
        .subscribe();
    } catch (realtimeErr) {
      console.warn("[RBAC] Realtime subscription notice:", realtimeErr);
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [session?.user, syncRoleFromDatabase]);

  const setSimulatedRole = useCallback((newRole: SystemRole | null) => {
    setSimulatedRoleState(newRole);
  }, []);

  const refreshRole = useCallback(async () => {
    if (session?.user) {
      setLoading(true);
      await syncRoleFromDatabase(session.user);
    }
  }, [session?.user, syncRoleFromDatabase]);

  const user = session?.user ?? null;
  const baseRole = dbRole || getRoleFromUser(user);
  const role: SystemRole = simulatedRole || baseRole;
  const roleDef = SYSTEM_ROLES[role] || SYSTEM_ROLES.admin;

  return {
    session,
    loading,
    user,
    role,
    baseRole,
    roleDef,
    permissions,
    isDbSynced,
    roleSource,
    refreshRole,
    simulatedRole,
    setSimulatedRole,
    isTwoFactorVerified,
    setTwoFactorVerified,
  };
}
