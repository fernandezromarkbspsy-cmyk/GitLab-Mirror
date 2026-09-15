-- Support date-window analytics and the common status/date dashboard filters.
create index if not exists requests_request_timestamp_idx
  on public.requests(request_timestamp desc);

create index if not exists requests_status_request_timestamp_idx
  on public.requests(status, request_timestamp desc); 