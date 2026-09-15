drop policy if exists intraday_dispatch_authenticated_read on public.intraday_dispatch;

create policy intraday_dispatch_authenticated_read
  on public.intraday_dispatch
  for select
  to authenticated
  using (public.current_role() in ('fte_ops', 'fte_mm'));
