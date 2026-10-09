-- Access-request notifications are updated by Laravel; keep this additive so
-- already-applied installations can upgrade safely.
alter table public.notifications add column if not exists updated_at timestamptz not null default now();
