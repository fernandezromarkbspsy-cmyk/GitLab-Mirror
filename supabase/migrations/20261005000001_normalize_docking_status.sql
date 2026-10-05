update public.requests
set status = 'DOCKING'
where status::text = 'FOR_DOCKING';
