alter table public.requests
  add column if not exists driver_assigned_at timestamptz,
  add column if not exists linehaul_trip_at timestamptz;
