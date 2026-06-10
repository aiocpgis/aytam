-- Monthly sponsorship delivery tracking.
-- Run once in Supabase SQL Editor for existing deployments.

create table if not exists public.sponsorship_deliveries (
  id uuid primary key default gen_random_uuid(),
  orphan_id uuid not null references public.orphans(id) on delete cascade,
  period_month date not null,
  sponsorship_received boolean not null default false,
  received_at date,
  delivered_to_guardian boolean not null default false,
  delivered_at date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sponsorship_deliveries
  add column if not exists orphan_id uuid references public.orphans(id) on delete cascade,
  add column if not exists period_month date,
  add column if not exists sponsorship_received boolean not null default false,
  add column if not exists received_at date,
  add column if not exists delivered_to_guardian boolean not null default false,
  add column if not exists delivered_at date,
  add column if not exists notes text not null default '',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

update public.sponsorship_deliveries
set period_month = date_trunc('month', coalesce(period_month, current_date))::date
where period_month is null or period_month <> date_trunc('month', period_month)::date;

alter table public.sponsorship_deliveries
  alter column orphan_id set not null,
  alter column period_month set not null;

create unique index if not exists sponsorship_deliveries_orphan_month_key
on public.sponsorship_deliveries (orphan_id, period_month);

create index if not exists sponsorship_deliveries_period_month_idx
on public.sponsorship_deliveries (period_month desc);

create index if not exists sponsorship_deliveries_orphan_id_idx
on public.sponsorship_deliveries (orphan_id);

alter table public.sponsorship_deliveries
  drop constraint if exists sponsorship_deliveries_period_month_first_day_check;

alter table public.sponsorship_deliveries
  add constraint sponsorship_deliveries_period_month_first_day_check
  check (period_month = date_trunc('month', period_month)::date);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists sponsorship_deliveries_set_updated_at on public.sponsorship_deliveries;

create trigger sponsorship_deliveries_set_updated_at
before update on public.sponsorship_deliveries
for each row execute function public.set_updated_at();

alter table public.sponsorship_deliveries enable row level security;

drop policy if exists "Sponsorship Deliveries Select Policy" on public.sponsorship_deliveries;
drop policy if exists "Sponsorship Deliveries Insert Policy" on public.sponsorship_deliveries;
drop policy if exists "Sponsorship Deliveries Update Policy" on public.sponsorship_deliveries;
drop policy if exists "Sponsorship Deliveries Delete Policy" on public.sponsorship_deliveries;

create policy "Sponsorship Deliveries Select Policy"
on public.sponsorship_deliveries
for select
to authenticated
using (public.has_permission('orphans.view'));

create policy "Sponsorship Deliveries Insert Policy"
on public.sponsorship_deliveries
for insert
to authenticated
with check (public.has_permission('orphans.update'));

create policy "Sponsorship Deliveries Update Policy"
on public.sponsorship_deliveries
for update
to authenticated
using (public.has_permission('orphans.update'))
with check (public.has_permission('orphans.update'));

create policy "Sponsorship Deliveries Delete Policy"
on public.sponsorship_deliveries
for delete
to authenticated
using (public.has_permission('orphans.delete'));
