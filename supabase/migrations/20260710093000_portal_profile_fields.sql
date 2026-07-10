alter table public.profiles
add column if not exists must_change_password boolean not null default false;

alter table public.profiles
add column if not exists temporary_password_created_at timestamptz;

alter table public.profiles
add column if not exists last_login_at timestamptz;

alter table public.profiles
add column if not exists status text not null default 'active';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_status_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
    add constraint profiles_status_check
    check (status in ('active', 'inactive', 'suspended'));
  end if;
end
$$;
