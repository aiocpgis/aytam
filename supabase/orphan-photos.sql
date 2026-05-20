-- Migration: Add Photo support for Orphans

-- 1. Create storage bucket for orphan photos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'orphan-photos', 
  'orphan-photos', 
  false, 
  5242880, -- 5MB in bytes
  '{"image/jpeg","image/png","image/webp"}'
)
on conflict (id) do nothing;

-- 2. Alter orphans table to add new columns
alter table public.orphans
add column if not exists photo_path text,
add column if not exists photo_uploaded_at timestamptz;

-- 3. Setup RLS policies on storage.objects for bucket "orphan-photos"
-- Enable RLS just in case (already enabled by default in storage.objects)
-- allow admin users to SELECT
create policy "Allow admins to read orphan photos"
on storage.objects for select
to authenticated
using (
  bucket_id = 'orphan-photos' 
  and (auth.uid() in (select id from public.admin_users))
);

-- allow admin users to INSERT
create policy "Allow admins to insert orphan photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'orphan-photos' 
  and (auth.uid() in (select id from public.admin_users))
);

-- allow admin users to UPDATE
create policy "Allow admins to update orphan photos"
on storage.objects for update
to authenticated
using (
  bucket_id = 'orphan-photos' 
  and (auth.uid() in (select id from public.admin_users))
);

-- allow admin users to DELETE
create policy "Allow admins to delete orphan photos"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'orphan-photos' 
  and (auth.uid() in (select id from public.admin_users))
);
