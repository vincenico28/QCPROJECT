import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const authSchema = z.object({
  token: z.string(),
});

/**
 * Ensures the caller is authenticated AND has the 'admin' role in the DB.
 */
async function verifyAdminCaller(token: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  
  // 1. Verify token
  const { data: authData, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !authData.user) throw new Error("Unauthorized");

  const userId = authData.user.id;

  // 2. Verify admin role
  const { data: roleData, error: roleErr } = await (supabaseAdmin as any)
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (roleErr || !roleData) throw new Error("Forbidden: Requires admin role");
  
  return { supabaseAdmin, user: authData.user };
}

export type SystemUser = {
  id: string;
  email: string;
  role: string | null;
  created_at: string;
};

export const listSystemUsers = createServerFn({ method: "POST" })
  .validator((data: unknown) => authSchema.parse(data))
  .handler(async ({ data }): Promise<SystemUser[]> => {
    const { supabaseAdmin } = await verifyAdminCaller(data.token);

    // Fetch all auth users
    const { data: authUsers, error: usersErr } = await supabaseAdmin.auth.admin.listUsers();
    if (usersErr) throw new Error("Failed to fetch users");

    // Fetch all roles
    const { data: roles, error: rolesErr } = await (supabaseAdmin as any)
      .from("user_roles")
      .select("*");
    if (rolesErr) throw new Error("Failed to fetch roles");

    const roleMap = new Map(roles.map((r: any) => [r.user_id, r.role]));

    return authUsers.users.map(u => ({
      id: u.id,
      email: u.email || "",
      role: (roleMap.get(u.id) as string | undefined) || null,
      created_at: u.created_at,
    }));
  });

const assignRoleSchema = z.object({
  token: z.string(),
  targetUserId: z.string(),
  role: z.enum(["admin", "dispatcher", "officer", "citizen"]),
});

export const assignUserRole = createServerFn({ method: "POST" })
  .validator((data: unknown) => assignRoleSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await verifyAdminCaller(data.token);

    if (data.role === "citizen") {
      // "citizen" means no special privileges, so we delete any assigned role.
      const { error } = await (supabaseAdmin as any)
        .from("user_roles")
        .delete()
        .eq("user_id", data.targetUserId);
      if (error) throw new Error("Failed to revoke role");
      return { success: true };
    }

    // Since we have a compound unique constraint on (user_id, role), and a user 
    // can only have one primary role in our simplified UI, we should first clear 
    // existing roles for this user, then insert the new one.
    
    // Clear existing roles
    await (supabaseAdmin as any)
      .from("user_roles")
      .delete()
      .eq("user_id", data.targetUserId);

    // Insert the new role
    const { error } = await (supabaseAdmin as any)
      .from("user_roles")
      .insert({
        user_id: data.targetUserId,
        role: data.role,
      });

    if (error) throw new Error("Failed to assign role");
    return { success: true };
  });
