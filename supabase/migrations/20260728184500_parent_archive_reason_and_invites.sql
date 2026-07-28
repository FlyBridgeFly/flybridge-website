alter table if exists public.profiles
  add column if not exists archive_reason text;

alter table if exists public.students
  add column if not exists archive_reason text;

alter table if exists public.parent_invites
  add column if not exists status text not null default 'pending',
  add column if not exists revoked_at timestamptz,
  add column if not exists revoked_by uuid,
  add column if not exists archive_reason text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'parent_invites'
      and column_name = 'revoked_by'
  ) and not exists (
    select 1
    from pg_constraint
    where conname = 'parent_invites_revoked_by_fkey'
  ) then
    alter table public.parent_invites
      add constraint parent_invites_revoked_by_fkey
      foreign key (revoked_by)
      references public.profiles (id)
      on delete set null;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'parent_invites'
      and column_name = 'status'
  ) then
    alter table public.parent_invites
      drop constraint if exists parent_invites_status_check;

    alter table public.parent_invites
      add constraint parent_invites_status_check
      check (status in ('pending', 'generated', 'sent', 'accepted', 'expired', 'revoked', 'archived'));
  end if;
end $$;

create index if not exists profiles_parent_archive_status_idx
  on public.profiles(role, status, archived_at desc);

create index if not exists parent_invites_status_idx
  on public.parent_invites(status);

create index if not exists parent_invites_revoked_at_idx
  on public.parent_invites(revoked_at)
  where revoked_at is not null;

comment on column public.profiles.archive_reason is 'Optional admin-entered reason for archiving a portal profile. Used to preserve context while login access is removed.';
comment on column public.students.archive_reason is 'Optional admin-entered reason for archiving a student record while preserving educational history.';
comment on column public.parent_invites.status is 'Lifecycle state for parent invitation records. Archive and delete workflows should revoke outstanding invites rather than removing historical rows.';
comment on column public.parent_invites.revoked_at is 'When the invitation was revoked because the linked parent account was archived or removed.';
comment on column public.parent_invites.revoked_by is 'Admin profile that revoked the invitation.';
comment on column public.parent_invites.archive_reason is 'Reason captured when an outstanding parent invitation was revoked during archive or deletion workflows.';
