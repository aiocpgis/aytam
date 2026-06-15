-- =========================================================================
-- Supabase Migration: Create Safe Delete User Function
-- =========================================================================

CREATE OR REPLACE FUNCTION public.delete_system_user_v1(target_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Check if caller has permission
  IF NOT public.has_permission('users.delete') THEN
    RAISE EXCEPTION 'صلاحيات غير كافية لحذف مستخدم.';
  END IF;

  -- Prevent deleting oneself
  IF auth.uid() = target_user_id THEN
    RAISE EXCEPTION 'لا يمكنك حذف حسابك الشخصي.';
  END IF;

  -- Delete from auth.users (cascade will delete from profiles, admin_users, user_roles, user_permissions)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;
