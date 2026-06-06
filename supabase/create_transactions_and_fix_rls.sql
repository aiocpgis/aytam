-- =========================================================================
-- Supabase RPC Transactions and Legacy RLS cleanup
-- =========================================================================

-- 1. Atomic Transaction Function for approving an application and creating an orphan record.
CREATE OR REPLACE FUNCTION public.approve_orphan_application_v1(
  app_id uuid,
  orphan_data jsonb
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Insert into orphans
  INSERT INTO public.orphans (
    child_full_name,
    birth_date,
    sponsor_name,
    sponsorship_amount,
    sponsor_phone,
    guardian_name,
    guardian_relation,
    guardian_phone,
    orphan_type,
    address,
    transfer_account_name,
    transfer_account_number,
    documents_status,
    governorate_city,
    gender,
    sponsorship_status,
    file_status,
    currency,
    documents,
    notes,
    source
  ) VALUES (
    (orphan_data->>'child_full_name'),
    CASE WHEN (orphan_data->>'birth_date') IS NOT NULL AND (orphan_data->>'birth_date') != '' THEN (orphan_data->>'birth_date')::date ELSE NULL END,
    COALESCE(orphan_data->>'sponsor_name', ''),
    CASE WHEN (orphan_data->>'sponsorship_amount') IS NOT NULL AND (orphan_data->>'sponsorship_amount') != '' THEN (orphan_data->>'sponsorship_amount')::numeric ELSE NULL END,
    COALESCE(orphan_data->>'sponsor_phone', ''),
    COALESCE(orphan_data->>'guardian_name', ''),
    COALESCE(orphan_data->>'guardian_relation', ''),
    COALESCE(orphan_data->>'guardian_phone', ''),
    COALESCE(orphan_data->>'orphan_type', 'غير محدد'),
    COALESCE(orphan_data->>'address', ''),
    COALESCE(orphan_data->>'transfer_account_name', ''),
    COALESCE(orphan_data->>'transfer_account_number', ''),
    COALESCE(orphan_data->>'documents_status', ''),
    COALESCE(orphan_data->>'governorate_city', ''),
    COALESCE(orphan_data->>'gender', 'غير محدد'),
    COALESCE(orphan_data->>'sponsorship_status', 'غير مكفول'),
    'مقبول',
    COALESCE(orphan_data->>'currency', 'غير محدد'),
    COALESCE(orphan_data->'documents', '[]'::jsonb),
    COALESCE(orphan_data->>'notes', ''),
    'public_form'
  );

  -- Update application status
  UPDATE public.orphan_applications
  SET file_status = 'مقبول', updated_at = now()
  WHERE id = app_id;
END;
$$;

-- 2. Atomic Transaction Function for updating user roles and overrides without wiping permissions.
CREATE OR REPLACE FUNCTION public.update_user_roles_and_permissions_v1(
  target_user_id uuid,
  role_ids text[],
  permission_overrides jsonb
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  override_record record;
  role_uuid_ids uuid[];
BEGIN
  -- Safely cast text array of IDs to uuid array
  role_uuid_ids := role_ids::uuid[];

  -- A. Update User Roles
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  IF array_length(role_uuid_ids, 1) > 0 THEN
    INSERT INTO public.user_roles (user_id, role_id)
    SELECT target_user_id, unnest(role_uuid_ids);
  END IF;

  -- B. Update Permission Overrides
  DELETE FROM public.user_permissions WHERE user_id = target_user_id;
  IF jsonb_array_length(permission_overrides) > 0 THEN
    FOR override_record IN
      SELECT * FROM jsonb_to_recordset(permission_overrides) AS x(permission_id uuid, effect text)
    LOOP
      INSERT INTO public.user_permissions (user_id, permission_id, effect)
      VALUES (target_user_id, override_record.permission_id, override_record.effect);
    END LOOP;
  END IF;
END;
$$;

-- 3. Clean up legacy admin policies that conflict with fine-grained RBAC permissions.
DROP POLICY IF EXISTS "orphans_admin_select" ON public.orphans;
DROP POLICY IF EXISTS "orphans_admin_insert" ON public.orphans;
DROP POLICY IF EXISTS "orphans_admin_update" ON public.orphans;
DROP POLICY IF EXISTS "orphans_admin_delete" ON public.orphans;

DROP POLICY IF EXISTS "orphan_applications_admin_select" ON public.orphan_applications;
DROP POLICY IF EXISTS "orphan_applications_admin_update" ON public.orphan_applications;
DROP POLICY IF EXISTS "orphan_applications_admin_delete" ON public.orphan_applications;
