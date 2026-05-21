-- =========================================================================
-- Setup system_settings table and RLS policies
-- =========================================================================

-- 1. Create table if not exists
CREATE TABLE IF NOT EXISTS public.system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS set_system_settings_updated_at ON public.system_settings;
CREATE TRIGGER set_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
DROP POLICY IF EXISTS "Allow select access for everyone" ON public.system_settings;
DROP POLICY IF EXISTS "System_Settings Select Policy" ON public.system_settings;
CREATE POLICY "System_Settings Select Policy" ON public.system_settings 
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "System_Settings Write Policy" ON public.system_settings;
CREATE POLICY "System_Settings Write Policy" ON public.system_settings 
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.has_permission('users.assign_permissions'))
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.has_permission('users.assign_permissions'));

-- 4. Seed Default Maintenance Mode if not present
INSERT INTO public.system_settings (key, value)
VALUES ('maintenance_mode', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 5. Add default settings for platform details
INSERT INTO public.system_settings (key, value)
VALUES 
  ('platform_name', '"منصة رِفْق لرعاية الأيتام"'::jsonb),
  ('contact_email', '"info@refq.org"'::jsonb),
  ('contact_phone', '"+970 599 123 456"'::jsonb),
  ('whatsapp_url', '"https://wa.me/970599123456"'::jsonb),
  ('social_links', '{"facebook": "", "twitter": "", "instagram": ""}'::jsonb),
  ('max_file_size', '10'::jsonb),
  ('allowed_extensions', '["pdf", "png", "jpg", "jpeg"]'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 6. Add settings to real-time replication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.system_settings;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;
