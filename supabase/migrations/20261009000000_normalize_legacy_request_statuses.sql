-- Keep deployed Supabase request data aligned with the current workflow
-- status contract used by the Laravel API.
--
-- This is intentionally a new forward-only migration. Earlier migrations may
-- already be recorded as applied in staging or production and must not be
-- edited in place.
update public.requests
set status = case status::text
  when 'APPROVED' then 'REQUESTED'
  when 'REJECTED_BY_MM' then 'CANCELLED'
  when 'FOR_DOCKING' then 'DOCKING'
  when 'CONFIRMED' then 'DOCKED'
  else status::text
end::public.request_status
where status::text in ('APPROVED', 'REJECTED_BY_MM', 'FOR_DOCKING', 'CONFIRMED');
