-- Add monthly sponsorship amount support to sponsorship deliveries.
-- Run once in Supabase SQL Editor after the sponsorship_deliveries table exists.

alter table public.sponsorship_deliveries
  add column if not exists sponsorship_amount numeric(12,2),
  add column if not exists currency text not null default 'غير محدد';

update public.sponsorship_deliveries
set currency = 'غير محدد'
where currency is null or btrim(currency) = '';

alter table public.sponsorship_deliveries
  drop constraint if exists sponsorship_deliveries_amount_non_negative_check;

alter table public.sponsorship_deliveries
  add constraint sponsorship_deliveries_amount_non_negative_check
  check (sponsorship_amount is null or sponsorship_amount >= 0);
