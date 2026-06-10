-- Fix RLS policies for sponsorship delivery upsert from the admin dashboard.
-- Run once in Supabase SQL Editor after creating sponsorship_deliveries.

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
  public.has_permission('orphans.view')
  or public.has_permission('orphans.update')
  or public.has_permission('applications.approve')
  or public.has_permission('users.view')
);

create policy "Sponsorship Deliveries Insert Policy"
on public.sponsorship_deliveries
for insert
to authenticated
with check (
  public.has_permission('orphans.update')
  or public.has_permission('applications.approve')
  or public.has_permission('users.view')
);

create policy "Sponsorship Deliveries Update Policy"
on public.sponsorship_deliveries
for update
to authenticated
using (
  public.has_permission('orphans.update')
  or public.has_permission('applications.approve')
  or public.has_permission('users.view')
)
with check (
  public.has_permission('orphans.update')
  or public.has_permission('applications.approve')
  or public.has_permission('users.view')
);

create policy "Sponsorship Deliveries Delete Policy"
on public.sponsorship_deliveries
for delete
to authenticated
using (
  public.has_permission('orphans.delete')
  or public.has_permission('users.view')
);
