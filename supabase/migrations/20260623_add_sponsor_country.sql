-- Migration: Add sponsor_country column to orphans and orphan_applications, and update approve_orphan_application_v1

-- 1. Add column to public.orphans if not exists
alter table public.orphans add column if not exists sponsor_country text not null default '';

-- 2. Add column to public.orphan_applications if not exists
alter table public.orphan_applications add column if not exists sponsor_country text not null default '';

-- 3. Update the approve_orphan_application_v1 function to support the new column
CREATE OR REPLACE FUNCTION public.approve_orphan_application_v1(
  app_id uuid,
  orphan_data jsonb
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Insert into orphans
  INSERT INTO public.orphans (
    child_full_name,
    birth_date,
    sponsor_name,
    sponsor_country,
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
  ) VALUES (
    (orphan_data->>'child_full_name'),
    CASE WHEN (orphan_data->>'birth_date') IS NOT NULL AND (orphan_data->>'birth_date') != '' THEN (orphan_data->>'birth_date')::date ELSE NULL END,
    COALESCE(orphan_data->>'sponsor_name', ''),
    COALESCE(orphan_data->>'sponsor_country', ''),
    CASE WHEN (orphan_data->>'sponsorship_amount') IS NOT NULL AND (orphan_data->>'sponsorship_amount') != '' THEN (orphan_data->>'sponsorship_amount')::numeric ELSE NULL END,
    COALESCE(orphan_data->>'sponsor_phone', ''),
    COALESCE(orphan_data->>'guardian_name', ''),
    COALESCE(orphan_data->>'guardian_relation', ''),
    COALESCE(orphan_data->>'guardian_phone', ''),
    COALESCE(orphan_data->>'orphan_type', 'غير محدد'),
    COALESCE(orphan_data->>'address', ''),
    COALESCE(orphan_data->>'transfer_account_name', ''),
    COALESCE(orphan_data->>'transfer_account_number', ''),
    COALESCE(orphan_data->>'documents_status', ''),
    COALESCE(orphan_data->>'governorate_city', ''),
    COALESCE(orphan_data->>'gender', 'غير محدد'),
    COALESCE(orphan_data->>'sponsorship_status', 'غير مكفول'),
    'مقبول',
    COALESCE(orphan_data->>'currency', 'غير محدد'),
    COALESCE(orphan_data->'documents', '[]'::jsonb),
    COALESCE(orphan_data->>'notes', ''),
    'public_form'
  );

  -- Update application status
  UPDATE public.orphan_applications
  SET file_status = 'مقبول', updated_at = now()
  WHERE id = app_id;
END;
$$;
