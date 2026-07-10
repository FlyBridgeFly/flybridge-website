create or replace function public.sync_portal_auth_state(
  mark_password_changed boolean default false,
  update_last_login boolean default true,
  login_time timestamptz default now()
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_profile public.profiles;
begin
  update public.profiles
  set
    must_change_password = case when mark_password_changed then false else must_change_password end,
    temporary_password_created_at = case when mark_password_changed then null else temporary_password_created_at end,
    last_login_at = case when update_last_login then coalesce(login_time, now()) else last_login_at end
  where id = auth.uid()
  returning * into updated_profile;

  if updated_profile.id is null then
    raise exception 'Portal profile not found for the current user.';
  end if;

  return updated_profile;
end;
$$;

revoke all on function public.sync_portal_auth_state(boolean, boolean, timestamptz) from public;
grant execute on function public.sync_portal_auth_state(boolean, boolean, timestamptz) to authenticated;
