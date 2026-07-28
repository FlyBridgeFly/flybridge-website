alter table if exists public.profiles
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid,
  add column if not exists previous_status text;

alter table if exists public.students
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid,
  add column if not exists previous_status text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_archived_by_fkey'
  ) then
    alter table public.profiles
      add constraint profiles_archived_by_fkey
      foreign key (archived_by)
      references public.profiles (id)
      on delete set null;
  end if;
end $$;

create index if not exists profiles_status_archived_at_idx on public.profiles(status, archived_at desc);
create index if not exists profiles_archived_by_idx on public.profiles(archived_by);
create index if not exists students_status_archived_at_idx on public.students(status, archived_at desc);
create index if not exists students_archived_by_idx on public.students(archived_by);

comment on column public.profiles.archived_at is 'When the portal profile was archived. Archived profiles retain links and history but should not appear in active admin directories.';
comment on column public.profiles.archived_by is 'Admin profile ID that archived the portal profile. Archive should preserve the Auth user and block access through profile status checks.';
comment on column public.profiles.previous_status is 'Status held before the profile was archived so restore flows can safely return it to active use.';

comment on column public.students.archived_at is 'When the student was archived. Student archive preserves linked parents, tutors, lessons, reports, assessments and targets.';
comment on column public.students.archived_by is 'Admin profile ID that archived the student record.';
comment on column public.students.previous_status is 'Status held before the student was archived so restore flows can reactivate the record without losing history.';
