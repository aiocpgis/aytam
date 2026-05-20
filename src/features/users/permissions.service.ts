import { supabase } from "../../lib/supabase";

export async function getCurrentUserPermissions(): Promise<string[]> {
  const { data: authUser, error: authError } = await supabase.auth.getUser();
  if (authError || !authUser.user) return [];

  // We can call a specialized RPC or query tables.
  // Actually, we can fetch from a materialized view or custom RPC to get flattened permissions.
  // Since we created `has_permission` function, checking a list requires either multiple calls or a new RPC.
  // Let's create an RPC `get_user_permissions()` that returns all keys, or we can fetch manually.
  
  // As a workaround, we'll fetch roles and permissions directly.
  const { data: roles } = await supabase
    .from("user_roles")
    .select("roles!inner(name)")
    .eq("user_id", authUser.user.id);
    
  const isSuperAdmin = roles?.some((r: any) => r.roles.name === "super_admin");

  if (isSuperAdmin) {
    // Return all permissions
    const { data: allPerms } = await supabase.from("permissions").select("key");
    return allPerms?.map((p: any) => p.key) || [];
  }

  // Fetch role permissions
  const { data: rolePerms } = await supabase
    .from("user_roles")
    .select("roles!inner(role_permissions!inner(permissions(key)))")
    .eq("user_id", authUser.user.id);

  let perms = new Set<string>();
  
  if (rolePerms) {
    rolePerms.forEach((ur: any) => {
      ur.roles.role_permissions.forEach((rp: any) => {
        perms.add(rp.permissions.key);
      });
    });
  }

  // Fetch overrides
  const { data: userPerms } = await supabase
    .from("user_permissions")
    .select("effect, permissions!inner(key)")
    .eq("user_id", authUser.user.id);

  if (userPerms) {
    userPerms.forEach((up: any) => {
      if (up.effect === "allow") {
        perms.add(up.permissions.key);
      } else if (up.effect === "deny") {
        perms.delete(up.permissions.key);
      }
    });
  }

  return Array.from(perms);
}

export async function checkIsSuperAdmin(): Promise<boolean> {
  const { data: authUser } = await supabase.auth.getUser();
  if (!authUser.user) return false;

  const { data } = await supabase.rpc("is_super_admin", { check_user_id: authUser.user.id });
  return !!data;
}

export async function getAllRoles() {
  const { data, error } = await supabase.from("roles").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getAllPermissions() {
  const { data, error } = await supabase.from("permissions").select("*").order("category");
  if (error) throw error;
  return data;
}

export async function getUserSpecificPermissions(userId: string) {
  const { data, error } = await supabase
    .from("user_permissions")
    .select("effect, permissions(id, key)")
    .eq("user_id", userId);
  
  if (error) throw error;
  return data;
}

export async function setUserPermission(userId: string, permissionId: string, effect: "allow" | "deny" | null) {
  if (effect === null) {
    await supabase.from("user_permissions").delete().match({ user_id: userId, permission_id: permissionId });
  } else {
    await supabase.from("user_permissions").upsert({
      user_id: userId,
      permission_id: permissionId,
      effect
    });
  }
}
