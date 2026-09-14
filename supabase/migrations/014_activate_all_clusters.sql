-- Reactivate imported cluster lookup rows so the linehaul create-row search can
-- return every known cluster.
update public.clusters
set active = true
where active is distinct from true;
