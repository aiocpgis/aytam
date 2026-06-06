-- Adds public sponsorship request fields and accepts the new public sponsorship statuses.
-- Run this file once in Supabase SQL Editor for existing deployments.

alter table public.orphans
  add column if not exists notes text not null default '';

alter table public.orphan_applications
  add column if not exists notes text not null default '';

alter table public.orphans
  alter column sponsorship_status set default 'غير مكفول';

alter table public.orphan_applications
  alter column sponsorship_status set default 'غير مكفول';

alter table public.orphans
  drop constraint if exists orphans_sponsorship_status_check;

alter table public.orphans
  add constraint orphans_sponsorship_status_check
  check (sponsorship_status in ('غير مكفول', 'بانتظار كافل', 'مكفول', 'متوقف'));

alter table public.orphan_applications
  drop constraint if exists orphan_applications_sponsorship_status_check;

alter table public.orphan_applications
  add constraint orphan_applications_sponsorship_status_check
  check (sponsorship_status in ('غير مكفول', 'بانتظار كافل', 'مكفول', 'متوقف'));

drop policy if exists "orphan_applications_public_insert" on public.orphan_applications;

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

create or replace function public.approve_orphan_application_v1(
  app_id uuid,
  orphan_data jsonb
)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.orphans (
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
  ) values (
    (orphan_data->>'child_full_name'),
    case when (orphan_data->>'birth_date') is not null and (orphan_data->>'birth_date') != '' then (orphan_data->>'birth_date')::date else null end,
    coalesce(orphan_data->>'sponsor_name', ''),
    case when (orphan_data->>'sponsorship_amount') is not null and (orphan_data->>'sponsorship_amount') != '' then (orphan_data->>'sponsorship_amount')::numeric else null end,
    coalesce(orphan_data->>'sponsor_phone', ''),
    coalesce(orphan_data->>'guardian_name', ''),
    coalesce(orphan_data->>'guardian_relation', ''),
    coalesce(orphan_data->>'guardian_phone', ''),
    coalesce(orphan_data->>'orphan_type', 'غير محدد'),
    coalesce(orphan_data->>'address', ''),
    coalesce(orphan_data->>'transfer_account_name', ''),
    coalesce(orphan_data->>'transfer_account_number', ''),
    coalesce(orphan_data->>'documents_status', ''),
    coalesce(orphan_data->>'governorate_city', ''),
    coalesce(orphan_data->>'gender', 'غير محدد'),
    coalesce(orphan_data->>'sponsorship_status', 'غير مكفول'),
    'مقبول',
    coalesce(orphan_data->>'currency', 'غير محدد'),
    coalesce(orphan_data->'documents', '[]'::jsonb),
    coalesce(orphan_data->>'notes', ''),
    'public_form'
  );

  update public.orphan_applications
  set file_status = 'مقبول', updated_at = now()
  where id = app_id;
end;
$$;
