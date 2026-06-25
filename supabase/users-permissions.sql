-- ==========================================
-- Users & Permissions RBAC System
-- ==========================================

-- 1. Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trigger to sync new users from auth.users to profiles
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Roles Table
CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  label text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Insert Default Roles
INSERT INTO public.roles (name, label, description) VALUES
('super_admin', 'مدير النظام', 'صلاحيات كاملة مطلقة على النظام'),
('data_entry', 'مدخل بيانات', 'صلاحية إدخال وتعديل بيانات الأيتام فقط'),
('reviewer', 'مراجع ملفات', 'صلاحية مراجعة واعتماد الطلبات الجديدة'),
('viewer', 'قارئ', 'صلاحية عرض البيانات فقط دون تعديل'),
('custom', 'مخصص', 'صلاحيات مخصصة لكل مستخدم بشكل مستقل')
ON CONFLICT (name) DO NOTHING;

-- 3. User Roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id uuid REFERENCES public.roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- 4. Permissions Table
CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  label text NOT NULL,
  category text NOT NULL,
  description text
);

-- Insert Standard Permissions
INSERT INTO public.permissions (key, label, category, description) VALUES
('page.dashboard.view', 'عرض لوحة المؤشرات', 'Pages', 'رؤية الإحصائيات العامة'),
('page.orphans.view', 'عرض شؤون الأبناء', 'Pages', 'الدخول لقائمة الأيتام'),
('page.applications.view', 'عرض طلبات الكفالة', 'Pages', 'الدخول لطلبات الكفالة الجديدة'),
('page.import.view', 'عرض صفحة الاستيراد', 'Pages', 'استيراد من Excel'),
('page.users.view', 'عرض إدارة المستخدمين', 'Pages', 'إدارة مستخدمي النظام والصلاحيات'),
('page.settings.view', 'عرض الإعدادات', 'Pages', 'إعدادات النظام'),

('orphans.view', 'استعراض الأيتام', 'Orphans', 'رؤية بيانات الأيتام الأساسية'),
('orphans.create', 'إضافة يتيم', 'Orphans', 'إضافة سجل يتيم جديد'),
('orphans.update', 'تعديل يتيم', 'Orphans', 'تعديل بيانات يتيم حالي'),
('orphans.delete', 'حذف يتيم', 'Orphans', 'حذف سجل يتيم نهائيا'),
('orphans.import', 'استيراد أيتام', 'Orphans', 'استيراد من Excel'),
('orphans.export', 'تصدير أيتام', 'Orphans', 'تصدير إلى Excel'),
('orphans.view_sensitive', 'عرض البيانات الحساسة', 'Orphans', 'رؤية الجوال وبيانات الحساب والوصي'),
('orphans.view_documents', 'عرض الأوراق الثبوتية', 'Orphans', 'تنزيل أو رؤية الأوراق الخاصة'),
('orphans.upload_photo', 'رفع صورة اليتيم', 'Orphans', 'رفع وتحديث صورة الطفل'),

('applications.view', 'عرض الطلبات', 'Applications', 'رؤية الطلبات الجديدة'),
('applications.approve', 'اعتماد طلب', 'Applications', 'تحويل الطلب إلى يتيم'),
('applications.reject', 'رفض طلب', 'Applications', 'رفض وحذف الطلب'),
('applications.delete', 'حذف طلب', 'Applications', 'حذف الطلب نهائياً'),

('users.view', 'عرض المستخدمين', 'Users', 'رؤية قائمة النظام'),
('users.create', 'إنشاء مستخدم', 'Users', 'دعوة أو إنشاء مستخدم'),
('users.update', 'تعديل مستخدم', 'Users', 'إيقاف وتفعيل المستخدمين'),
('users.delete', 'حذف مستخدم', 'Users', 'حذف المستخدمين'),
('users.assign_permissions', 'تعيين صلاحيات', 'Users', 'تعديل الصلاحيات والأدوار'),

('security.read_only_mode', 'وضع القراءة فقط', 'Security', 'منع أي تعديل أو حفظ في الواجهة'),
('security.disable_export', 'منع التصدير', 'Security', 'منع أزرار التصدير والإكسيل'),
('security.disable_print', 'منع الطباعة', 'Security', 'منع اختصارات وأزرار الطباعة'),
('security.disable_copy', 'منع النسخ', 'Security', 'تفعيل تعطيل زر الفأرة الأيمن والتحديد')
ON CONFLICT (key) DO NOTHING;

-- 5. Role Permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id uuid REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id uuid REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Helper to assign all permissions to super_admin
DO $$
DECLARE
  super_admin_id uuid;
BEGIN
  SELECT id INTO super_admin_id FROM public.roles WHERE name = 'super_admin';
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT super_admin_id, id FROM public.permissions
  ON CONFLICT DO NOTHING;
END $$;

-- 6. User Permissions (Overrides)
CREATE TABLE IF NOT EXISTS public.user_permissions (
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  permission_id uuid REFERENCES public.permissions(id) ON DELETE CASCADE,
  effect text CHECK (effect IN ('allow', 'deny')),
  PRIMARY KEY (user_id, permission_id)
);

-- 7. Activity Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- ==========================================
-- Security Database Functions
-- ==========================================

-- Check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(check_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = check_user_id AND r.name = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check exact permission taking overrides into account
CREATE OR REPLACE FUNCTION public.has_permission(check_permission_key text)
RETURNS boolean AS $$
DECLARE
  user_uid uuid;
  perm_id uuid;
  deny_exists boolean;
  allow_exists boolean;
  role_allows boolean;
BEGIN
  user_uid := auth.uid();
  IF user_uid IS NULL THEN
    RETURN false;
  END IF;

  -- Super admin has all permissions automatically
  IF public.is_super_admin(user_uid) THEN
    RETURN true;
  END IF;

  -- Get permission id
  SELECT id INTO perm_id FROM public.permissions WHERE key = check_permission_key;
  IF perm_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check direct deny
  SELECT EXISTS (
    SELECT 1 FROM public.user_permissions 
    WHERE user_id = user_uid AND permission_id = perm_id AND effect = 'deny'
  ) INTO deny_exists;
  
  IF deny_exists THEN
    RETURN false;
  END IF;

  -- Check direct allow
  SELECT EXISTS (
    SELECT 1 FROM public.user_permissions 
    WHERE user_id = user_uid AND permission_id = perm_id AND effect = 'allow'
  ) INTO allow_exists;

  IF allow_exists THEN
    RETURN true;
  END IF;

  -- Check role permissions
  SELECT EXISTS (
    SELECT 1 FROM public.role_permissions rp
    JOIN public.user_roles ur ON rp.role_id = ur.role_id
    WHERE ur.user_id = user_uid AND rp.permission_id = perm_id
  ) INTO role_allows;

  RETURN role_allows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- RLS Policies
-- ==========================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- We don't overwrite orphan tables entirely but we apply updates to their RLS
-- Assuming orphans table exists
ALTER TABLE public.orphans ENABLE ROW LEVEL SECURITY;

-- Drop existing orphan policies if any to prevent conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON public.orphans;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.orphans;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.orphans;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.orphans;
-- Recreate based on permissions
CREATE POLICY "Orphans Select Policy" ON public.orphans FOR SELECT TO authenticated
USING (public.has_permission('orphans.view'));

CREATE POLICY "Orphans Insert Policy" ON public.orphans FOR INSERT TO authenticated
WITH CHECK (public.has_permission('orphans.create'));

CREATE POLICY "Orphans Update Policy" ON public.orphans FOR UPDATE TO authenticated
USING (public.has_permission('orphans.update'));

CREATE POLICY "Orphans Delete Policy" ON public.orphans FOR DELETE TO authenticated
USING (public.has_permission('orphans.delete'));


-- Admin tables RLS (profiles, user_roles, roles, permissions)
-- Everyone can read their own profile, or if they have users.view they can read all
CREATE POLICY "Profiles Select Policy" ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id OR public.has_permission('users.view'));

-- Only users with users.update can update profiles
CREATE POLICY "Profiles Update Policy" ON public.profiles FOR UPDATE TO authenticated
USING (public.has_permission('users.update'));

CREATE POLICY "Roles Select Policy" ON public.roles FOR SELECT TO authenticated
USING (public.has_permission('users.view'));

CREATE POLICY "Permissions Select Policy" ON public.permissions FOR SELECT TO authenticated
USING (public.has_permission('users.view'));

CREATE POLICY "Role_Permissions Select Policy" ON public.role_permissions FOR SELECT TO authenticated
USING (public.has_permission('users.view'));

CREATE POLICY "User_Roles Select Policy" ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_permission('users.view'));

CREATE POLICY "User_Roles Insert/Update Policy" ON public.user_roles FOR ALL TO authenticated
USING (public.has_permission('users.assign_permissions'))
WITH CHECK (public.has_permission('users.assign_permissions'));

CREATE POLICY "User_Permissions Select Policy" ON public.user_permissions FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_permission('users.view'));

CREATE POLICY "User_Permissions Insert/Update/Delete Policy" ON public.user_permissions FOR ALL TO authenticated
USING (public.has_permission('users.assign_permissions'))
WITH CHECK (public.has_permission('users.assign_permissions'));

CREATE POLICY "Activity_Logs Insert Policy" ON public.activity_logs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Activity_Logs Select Policy" ON public.activity_logs FOR SELECT TO authenticated
USING (public.has_permission('users.view'));

-- Update Storage RLS from previous turn (orphan-photos) to use functions
DROP POLICY IF EXISTS "Allow admins to read orphan photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to insert orphan photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to update orphan photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to delete orphan photos" ON storage.objects;

create policy "Orphan Photos Select" on storage.objects for select to authenticated
using (bucket_id = 'orphan-photos' and public.has_permission('orphans.view_documents'));

create policy "Orphan Photos Insert" on storage.objects for insert to authenticated
with check (bucket_id = 'orphan-photos' and public.has_permission('orphans.upload_photo'));

create policy "Orphan Photos Update" on storage.objects for update to authenticated
using (bucket_id = 'orphan-photos' and public.has_permission('orphans.upload_photo'));

create policy "Orphan Photos Delete" on storage.objects for delete to authenticated
using (bucket_id = 'orphan-photos' and public.has_permission('orphans.upload_photo'));
