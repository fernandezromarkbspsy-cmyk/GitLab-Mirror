-- Realtime PostgreSQL changes require every subscribed table to be in this
-- publication. RLS select policies continue to determine each subscriber's
-- visible records.
alter publication supabase_realtime add table public.requests;
alter publication supabase_realtime add table public.intraday_dispatch;
