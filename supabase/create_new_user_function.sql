-- =========================================================================
-- Supabase Migration: Create New User Function and System Settings (Maintenance Mode)
-- =========================================================================

-- 1. Create System Settings Table
CREATE TABLE IF NOT EXISTS public.system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone (public and authenticated) to read settings
DROP POLICY IF EXISTS "System Settings Select Policy" ON public.system_settings;
CREATE POLICY "System Settings Select Policy" ON public.system_settings 
FOR SELECT TO anon, authenticated
USING (true);

-- Allow administrators to update settings
DROP POLICY IF EXISTS "System Settings Update Policy" ON public.system_settings;
CREATE POLICY "System Settings Update Policy" ON public.system_settings 
FOR ALL TO authenticated
USING (public.has_permission('users.assign_permissions'))
WITH CHECK (public.has_permission('users.assign_permissions'));

-- Seed default maintenance state
INSERT INTO public.system_settings (key, value)
VALUES ('maintenance_mode', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 2. Create Security Definer function to allow authenticated administrators
-- to create new auth.users without logging out or needing the admin service role client.
CREATE OR REPLACE FUNCTION public.create_new_user_v1(
  user_email text,
  user_password text,
  user_full_name text
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  new_user_id uuid;
  encrypted_pw text;
BEGIN
  -- Check if caller has permission
  IF NOT public.has_permission('users.create') THEN
    RAISE EXCEPTION 'صلاحيات غير كافية لإنشاء مستخدم جديد.';
  END IF;

  -- Validate inputs
  IF user_email IS NULL OR user_email = '' THEN
    RAISE EXCEPTION 'البريد الإلكتروني مطلوب.';
  END IF;
  IF user_password IS NULL OR length(user_password) < 6 THEN
    RAISE EXCEPTION 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.';
  END IF;

  -- Generate new ID
  new_user_id := gen_random_uuid();
  
  -- Encrypt password using pgcrypto bf algorithm
  encrypted_pw := crypt(user_password, gen_salt('bf'));

  -- Insert into auth.users (triggers profile creation after insert)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    user_email,
    encrypted_pw,
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('full_name', user_full_name),
    'authenticated',
    'authenticated',
    now(),
    now()
  );

  -- Also insert into admin_users to keep legacy session validation compatible
  INSERT INTO public.admin_users (id, email, name, role)
  VALUES (new_user_id, user_email, user_full_name, 'admin')
  ON CONFLICT (id) DO NOTHING;

  -- Return the new user ID
  RETURN new_user_id;
END;
$$;
