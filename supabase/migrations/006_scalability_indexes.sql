-- Support the default FTE/doc request feed, which orders all visible requests
-- by newest first without a status or creator predicate.
create index if not exists requests_created_idx on public.requests(created_at desc, id desc);

-- Support dashboard status aggregation without scanning every request row.
create index if not exists requests_status_idx on public.requests(status);
