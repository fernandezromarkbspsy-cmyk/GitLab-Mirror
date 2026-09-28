alter table public.profiles
  add column if not exists seatalk_employee_code text;

alter table public.user_imports
  add column if not exists seatalk_employee_code text;

create unique index if not exists profiles_seatalk_employee_code_uidx
  on public.profiles (seatalk_employee_code)
  where seatalk_employee_code is not null;

create unique index if not exists user_imports_seatalk_employee_code_uidx
  on public.user_imports (seatalk_employee_code)
  where seatalk_employee_code is not null;
