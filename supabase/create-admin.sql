-- شغّل هذا الملف بعد إنشاء مستخدم المدير من Supabase Authentication.
-- بدّل القيم بين الأقواس بما يناسب حسابك.

insert into public.admin_users (id, email, name, role)
values (
  'PUT_SUPABASE_AUTH_USER_ID_HERE',
  'PUT_ADMIN_EMAIL_HERE',
  'Super Admin',
  'super_admin'
)
on conflict (id) do update set
  email = excluded.email,
  name = excluded.name,
  role = excluded.role;
