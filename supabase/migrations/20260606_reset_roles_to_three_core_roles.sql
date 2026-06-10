-- Reset admin roles to exactly three practical roles:
-- 1) super_admin  = مدير النظام
-- 2) data_entry   = مدخل بيانات
-- 3) viewer       = مشاهد
--
-- Run once in Supabase SQL Editor.
-- This script keeps users, removes old role assignments, and clears direct permission overrides to reduce permission conflicts.

-- 1. Ensure required permissions exist.
insert into public.permissions (key, label, category, description) values
  ('page.sponsorships.view', 'عرض متابعة الكفالات', 'Pages', 'الدخول إلى صفحة متابعة وصول وتسليم الكفالات'),
  ('page.duplicates.view', 'عرض فحص التكرار', 'Pages', 'الدخول إلى صفحة فحص التكرار'),
  ('sponsorships.view', 'استعراض متابعة الكفالات', 'Sponsorships', 'رؤية سجلات وصول وتسليم الكفالات'),
  ('sponsorships.update', 'تعديل متابعة الكفالات', 'Sponsorships', 'تعديل وصول الكفالة والتسليم والقيمة والملاحظات'),
  ('sponsorships.export', 'تصدير متابعة الكفالات', 'Sponsorships', 'تصدير تقارير متابعة الكفالات')
on conflict (key) do update set
  label = excluded.label,
  category = excluded.category,
  description = excluded.description;

-- 2. Ensure the three roles exist with final Arabic wording.
insert into public.roles (name, label, description) values
  ('super_admin', 'مدير النظام', 'صلاحيات كاملة على النظام'),
  ('data_entry', 'مدخل بيانات', 'إدخال وتعديل ومراجعة البيانات والكفالات بدون إدارة المستخدمين أو الحذف'),
  ('viewer', 'مشاهد', 'عرض البيانات فقط دون أي تعديل')
on conflict (name) do update set
  label = excluded.label,
  description = excluded.description;

-- 3. Move users from old roles into one of the three roles before deleting old assignments.
do $$
declare
  data_entry_role_id uuid;
  viewer_role_id uuid;
begin
  select id into data_entry_role_id from public.roles where name = 'data_entry';
  select id into viewer_role_id from public.roles where name = 'viewer';

  -- Old reviewer/custom roles become data entry by default.
  insert into public.user_roles (user_id, role_id)
  select distinct ur.user_id, data_entry_role_id
  from public.user_roles ur
  join public.roles r on r.id = ur.role_id
  where r.name in ('reviewer', 'custom')
  on conflict do nothing;

  -- Any legacy viewer role stays viewer.
  insert into public.user_roles (user_id, role_id)
  select distinct ur.user_id, viewer_role_id
  from public.user_roles ur
  join public.roles r on r.id = ur.role_id
  where r.name = 'viewer'
  on conflict do nothing;
end $$;

-- 4. Remove role assignments to any role outside the final three.
delete from public.user_roles ur
using public.roles r
where ur.role_id = r.id
  and r.name not in ('super_admin', 'data_entry', 'viewer');

-- 5. Remove old roles entirely to avoid confusion in the UI and future assignments.
delete from public.roles
where name not in ('super_admin', 'data_entry', 'viewer');

-- 6. Clear direct overrides. Roles are now the source of truth.
delete from public.user_permissions;

-- 7. Reset role permissions for the three roles.
delete from public.role_permissions rp
using public.roles r
where rp.role_id = r.id
  and r.name in ('super_admin', 'data_entry', 'viewer');

-- Super admin: all permissions.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name = 'super_admin'
on conflict do nothing;

-- Data entry: daily operational work, no users management, no deletion, no security controls.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key in (
  'page.dashboard.view',
  'page.orphans.view',
  'page.applications.view',
  'page.import.view',
  'page.sponsorships.view',
  'page.duplicates.view',
  'orphans.view',
  'orphans.create',
  'orphans.update',
  'orphans.import',
  'orphans.export',
  'orphans.view_sensitive',
  'orphans.view_documents',
  'orphans.upload_photo',
  'applications.view',
  'applications.approve',
  'applications.reject',
  'sponsorships.view',
  'sponsorships.update',
  'sponsorships.export'
)
where r.name = 'data_entry'
on conflict do nothing;

-- Viewer: read-only access.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key in (
  'page.dashboard.view',
  'page.orphans.view',
  'page.applications.view',
  'page.sponsorships.view',
  'page.duplicates.view',
  'orphans.view',
  'applications.view',
  'sponsorships.view'
)
where r.name = 'viewer'
on conflict do nothing;

-- 8. Update sponsorship delivery RLS to use sponsorship-specific permissions.
alter table public.sponsorship_deliveries enable row level security;

drop policy if exists "Sponsorship Deliveries Select Policy" on public.sponsorship_deliveries;
drop policy if exists "Sponsorship Deliveries Insert Policy" on public.sponsorship_deliveries;
drop policy if exists "Sponsorship Deliveries Update Policy" on public.sponsorship_deliveries;
drop policy if exists "Sponsorship Deliveries Delete Policy" on public.sponsorship_deliveries;

create policy "Sponsorship Deliveries Select Policy"
on public.sponsorship_deliveries
for select
to authenticated
using (
  public.has_permission('sponsorships.view')
  or public.has_permission('sponsorships.update')
  or public.has_permission('users.view')
);

create policy "Sponsorship Deliveries Insert Policy"
on public.sponsorship_deliveries
for insert
to authenticated
with check (
  public.has_permission('sponsorships.update')
  or public.has_permission('users.view')
);

create policy "Sponsorship Deliveries Update Policy"
on public.sponsorship_deliveries
for update
to authenticated
using (
  public.has_permission('sponsorships.update')
  or public.has_permission('users.view')
)
with check (
  public.has_permission('sponsorships.update')
  or public.has_permission('users.view')
);

create policy "Sponsorship Deliveries Delete Policy"
on public.sponsorship_deliveries
for delete
to authenticated
using (public.has_permission('users.view'));
