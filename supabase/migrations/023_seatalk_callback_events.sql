create table if not exists public.seatalk_callback_events (
  event_id text primary key,
  provider_item_id text not null,
  request_id uuid references public.requests(id) on delete set null,
  employee_code text not null,
  action text not null check (action in ('approve', 'reject')),
  status text not null,
  correlation_id uuid,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists seatalk_callback_item_received_idx
  on public.seatalk_callback_events (provider_item_id, received_at);
create index if not exists seatalk_callback_request_status_idx
  on public.seatalk_callback_events (request_id, status);
