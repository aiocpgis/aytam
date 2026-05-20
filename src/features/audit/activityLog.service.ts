import { supabase } from "../../lib/supabase";

export async function logActivity(action: string, entityType?: string, entityId?: string, metadata?: any) {
  try {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser.user) return;

    await supabase.from("activity_logs").insert({
      user_id: authUser.user.id,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}
