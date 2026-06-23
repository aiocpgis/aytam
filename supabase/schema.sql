-- Supabase setup for orphan-care-supabase
-- Run this file inside Supabase SQL Editor after creating the project.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null default 'Super Admin',
  role text not null default 'super_admin' check (role in ('super_admin', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.orphans (
  id uuid primary key default gen_random_uuid(),
  child_full_name text not null,
  birth_date date,
  sponsor_name text not null default '',
  sponsor_country text not null default '',
  sponsorship_amount numeric,
  sponsor_phone text not null default '',
  guardian_name text not null default '',
  guardian_relation text not null default '',
  guardian_phone text not null default '',
  orphan_type text not null default 'غير محدد' check (orphan_type in ('يتيم الأب', 'يتيم الأم', 'يتيم الأبوين', 'غير محدد')),
  address text not null default '',
  transfer_account_name text not null default '',
  transfer_account_number text not null default '',
  documents_status text not null default '',
  governorate_city text not null default '',
  gender text not null default 'غير محدد' check (gender in ('ذكر', 'أنثى', 'غير محدد')),
  sponsorship_status text not null default 'غير مكفول' check (sponsorship_status in ('غير مكفول', 'بانتظار كافل', 'مكفول', 'متوقف')),
  file_status text not null default 'جديد' check (file_status in ('جديد', 'جديد بانتظار المراجعة', 'قيد المراجعة', 'مقبول', 'مرفوض', 'مكتمل')),
  currency text not null default 'غير محدد' check (currency in ('شيكل', 'دولار', 'دينار', 'غير محدد')),
  documents jsonb not null default '[]'::jsonb,
  notes text not null default '',
  source text not null default 'admin_form' check (source in ('public_form', 'admin_form', 'excel_import')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orphan_applications (
  id uuid primary key default gen_random_uuid(),
  child_full_name text not null,
  birth_date date,
  sponsor_name text not null default '',
  sponsor_country text not null default '',
  sponsorship_amount numeric,
  sponsor_phone text not null default '',
  guardian_name text not null default '',
  guardian_relation text not null default '',
  guardian_phone text not null default '',
  orphan_type text not null default 'غير محدد' check (orphan_type in ('يتيم الأب', 'يتيم الأم', 'يتيم الأبوين', 'غير محدد')),
  address text not null default '',
  transfer_account_name text not null default '',
  transfer_account_number text not null default '',
  documents_status text not null default '',
  governorate_city text not null default '',
  gender text not null default 'غير محدد' check (gender in ('ذكر', 'أنثى', 'غير محدد')),
  sponsorship_status text not null default 'غير مكفول' check (sponsorship_status in ('غير مكفول', 'بانتظار كافل', 'مكفول', 'متوقف')),
  file_status text not null default 'جديد بانتظار المراجعة' check (file_status in ('جديد', 'جديد بانتظار المراجعة', 'قيد المراجعة', 'مقبول', 'مرفوض', 'مكتمل')),
  currency text not null default 'غير محدد' check (currency in ('شيكل', 'دولار', 'دينار', 'غير محدد')),
  documents jsonb not null default '[]'::jsonb,
  notes text not null default '',
  source text not null default 'public_form' check (source in ('public_form', 'admin_form', 'excel_import')),
  storage_folder_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orphans_child_full_name_idx on public.orphans using gin (to_tsvector('simple', child_full_name));
create index if not exists orphans_sponsorship_status_idx on public.orphans (sponsorship_status);
create index if not exists orphans_file_status_idx on public.orphans (file_status);
create index if not exists orphan_applications_file_status_idx on public.orphan_applications (file_status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_orphans_updated_at on public.orphans;
create trigger set_orphans_updated_at
before update on public.orphans
for each row execute function public.set_updated_at();

drop trigger if exists set_orphan_applications_updated_at on public.orphan_applications;
create trigger set_orphan_applications_updated_at
before update on public.orphan_applications
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where id = auth.uid()
  );
$$;

alter table public.admin_users enable row level security;
alter table public.orphans enable row level security;
alter table public.orphan_applications enable row level security;

-- Keep this script rerunnable.
drop policy if exists "admin_users_select_self" on public.admin_users;
drop policy if exists "orphans_admin_select" on public.orphans;
drop policy if exists "orphans_admin_insert" on public.orphans;
drop policy if exists "orphans_admin_update" on public.orphans;
drop policy if exists "orphans_admin_delete" on public.orphans;
drop policy if exists "orphan_applications_public_insert" on public.orphan_applications;
drop policy if exists "orphan_applications_admin_select" on public.orphan_applications;
drop policy if exists "orphan_applications_admin_update" on public.orphan_applications;
drop policy if exists "orphan_applications_admin_delete" on public.orphan_applications;
drop policy if exists "orphan_documents_public_insert" on storage.objects;
drop policy if exists "orphan_documents_admin_select" on storage.objects;
drop policy if exists "orphan_documents_admin_update" on storage.objects;
drop policy if exists "orphan_documents_admin_delete" on storage.objects;

-- Admin users table
create policy "admin_users_select_self"
on public.admin_users
for select
to authenticated
using (id = auth.uid());

-- Orphans: only admins can access official records.
create policy "orphans_admin_select"
on public.orphans
for select
to authenticated
using (public.is_admin());

create policy "orphans_admin_insert"
on public.orphans
for insert
to authenticated
with check (public.is_admin());

create policy "orphans_admin_update"
on public.orphans
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "orphans_admin_delete"
on public.orphans
for delete
to authenticated
using (public.is_admin());

-- Public applications: anonymous visitors may submit only validated public applications.
create policy "orphan_applications_public_insert"
on public.orphan_applications
for insert
to anon, authenticated
with check (
  source = 'public_form'
  and file_status = 'جديد بانتظار المراجعة'
  and sponsorship_status in ('غير مكفول', 'مكفول')
  and child_full_name is not null
  and length(trim(child_full_name)) >= 3
  and birth_date is not null
  and birth_date <= current_date
  and birth_date > (current_date - interval '16 years')
  and guardian_phone is not null
  and length(trim(guardian_phone)) >= 7
  and transfer_account_name in ('بنك فلسطين', 'بال باي', 'جوال باي')
  and transfer_account_number is not null
  and length(trim(transfer_account_number)) >= 7
  and (
    sponsorship_status = 'غير مكفول'
    or length(trim(coalesce(sponsor_name, ''))) >= 3
  )
);

create policy "orphan_applications_admin_select"
on public.orphan_applications
for select
to authenticated
using (public.is_admin());

create policy "orphan_applications_admin_update"
on public.orphan_applications
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "orphan_applications_admin_delete"
on public.orphan_applications
for delete
to authenticated
using (public.is_admin());

-- Storage bucket for documents. Keep it private.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'orphan-documents',
  'orphan-documents',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Anonymous public form can upload documents into public-applications folder only.
create policy "orphan_documents_public_insert"
on storage.objects
for insert
to anon, authenticated
with check (
  bucket_id = 'orphan-documents'
  and (storage.foldername(name))[1] = 'public-applications'
);

-- Only admins can read/update/delete stored documents.
create policy "orphan_documents_admin_select"
on storage.objects
for select
to authenticated
using (bucket_id = 'orphan-documents' and public.is_admin());

create policy "orphan_documents_admin_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'orphan-documents' and public.is_admin())
with check (bucket_id = 'orphan-documents' and public.is_admin());

create policy "orphan_documents_admin_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'orphan-documents' and public.is_admin());

-- Optional but recommended: enable realtime change events for the dashboard.
do $$
begin
  alter publication supabase_realtime add table public.orphans;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.orphan_applications;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
