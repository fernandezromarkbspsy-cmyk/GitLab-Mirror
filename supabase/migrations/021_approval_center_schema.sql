-- Approval Center metadata is additive. Keep legacy request_status values so
-- historical requests and request_events remain readable.
alter type public.request_status add value if not exists 'REQUESTED';
alter type public.request_status add value if not exists 'REROUTED';
alter type public.request_status add value if not exists 'DOCKING';

alter table public.requests
  add column if not exists approval_status text,
  add column if not exists approved_by uuid,
  add column if not exists approved_at timestamptz,
  add column if not exists approval_source text,
  add column if not exists rejected_by uuid,
  add column if not exists rejected_at timestamptz,
  add column if not exists approval_version bigint,
  add column if not exists approval_correlation_id uuid;

update public.requests
set approval_status = case
  when status::text in ('APPROVED', 'REQUESTED', 'ASSIGNED', 'DOCKING', 'DOCKED', 'FOR_DOCKING', 'CONFIRMED') then 'APPROVED'
  when status::text = 'REJECTED_BY_MM' then 'REJECTED'
  when status::text = 'CANCELLED' then 'CANCELLED'
  else 'PENDING'
end
where approval_status is null;

update public.requests
set approval_version = 0
where approval_version is null;

alter table public.requests
  alter column approval_status set default 'PENDING',
  alter column approval_status set not null,
  alter column approval_version set default 0,
  alter column approval_version set not null;

alter table public.requests
  drop constraint if exists requests_approval_status_check,
  drop constraint if exists requests_approval_source_check,
  drop constraint if exists requests_approval_version_check;

alter table public.requests
  add constraint requests_approval_status_check
    check (approval_status in ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  add constraint requests_approval_source_check
    check (approval_source is null or approval_source in ('WEB', 'SEATALK')),
  add constraint requests_approval_version_check
    check (approval_version >= 0);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'requests_approved_by_fkey'
  ) then
    alter table public.requests
      add constraint requests_approved_by_fkey
      foreign key (approved_by) references public.profiles(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'requests_rejected_by_fkey'
  ) then
    alter table public.requests
      add constraint requests_rejected_by_fkey
      foreign key (rejected_by) references public.profiles(id) on delete set null;
  end if;
end;
$$;

create index if not exists requests_approval_pending_idx
  on public.requests (updated_at desc, id)
  where approval_status = 'PENDING';
create index if not exists requests_approval_correlation_idx
  on public.requests (approval_correlation_id);

create table if not exists public.seatalk_approval_items (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.requests(id) on delete cascade,
  provider_item_id text unique,
  provider_response_id text,
  status text not null default 'PENDING',
  failure_reason text,
  correlation_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seatalk_approval_items_status_check
    check (status in ('PENDING', 'ACTIVE', 'APPROVED', 'REJECTED', 'CLOSED', 'FAILED'))
);

create index if not exists seatalk_approval_items_status_updated_idx
  on public.seatalk_approval_items (status, updated_at desc);
create index if not exists seatalk_approval_items_correlation_idx
  on public.seatalk_approval_items (correlation_id);

create table if not exists public.seatalk_approval_assignments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  seatalk_approval_item_id uuid not null references public.seatalk_approval_items(id) on delete cascade,
  fte_user_id uuid not null references public.profiles(id) on delete restrict,
  sequence integer not null check (sequence > 0),
  status text not null default 'PENDING',
  sent_at timestamptz,
  expires_at timestamptz,
  responded_at timestamptz,
  seatalk_message_id text,
  provider_response_id text,
  approval_token_hash text,
  failure_reason text,
  correlation_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seatalk_approval_assignments_status_check
    check (status in ('PENDING', 'ACTIVE', 'EXPIRED', 'APPROVED', 'REJECTED', 'CLOSED', 'FAILED'))
);

create unique index if not exists seatalk_active_assignment_request_uidx
  on public.seatalk_approval_assignments (request_id)
  where status in ('PENDING', 'ACTIVE');
create index if not exists seatalk_assignments_expiry_idx
  on public.seatalk_approval_assignments (status, expires_at)
  where status in ('PENDING', 'ACTIVE');
create index if not exists seatalk_assignments_employee_idx
  on public.seatalk_approval_assignments (fte_user_id, status);
create index if not exists seatalk_assignments_request_sequence_idx
  on public.seatalk_approval_assignments (request_id, sequence);
create index if not exists seatalk_assignments_correlation_idx
  on public.seatalk_approval_assignments (correlation_id);

alter table public.seatalk_approval_items enable row level security;
alter table public.seatalk_approval_assignments enable row level security;

drop trigger if exists seatalk_approval_items_updated_at on public.seatalk_approval_items;
create trigger seatalk_approval_items_updated_at
before update on public.seatalk_approval_items
for each row execute function public.set_updated_at();

drop trigger if exists seatalk_approval_assignments_updated_at on public.seatalk_approval_assignments;
create trigger seatalk_approval_assignments_updated_at
before update on public.seatalk_approval_assignments
for each row execute function public.set_updated_at();
