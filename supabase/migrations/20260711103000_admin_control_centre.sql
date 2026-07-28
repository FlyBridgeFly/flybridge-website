alter table public.profiles
  add column if not exists phone text,
  add column if not exists subjects text[] not null default '{}'::text[],
  add column if not exists key_stages text[] not null default '{}'::text[];

alter table public.students
  add column if not exists status text not null default 'active',
  add column if not exists target_grade text;

comment on column public.profiles.phone is 'Optional contact number for tutor or parent portal accounts.';
comment on column public.profiles.subjects is 'Subjects assigned to a tutor profile for admin management.';
comment on column public.profiles.key_stages is 'Key stages assigned to a tutor profile for admin management.';
comment on column public.students.target_grade is 'Admin-managed target grade shown in portal reporting and admin overview.';

alter table public.profiles
  drop constraint if exists profiles_status_check;

alter table public.profiles
  add constraint profiles_status_check
  check (status in ('active', 'inactive', 'suspended', 'archived'));

alter table public.students
  drop constraint if exists students_status_check;

alter table public.students
  add constraint students_status_check
  check (status in ('active', 'inactive', 'suspended', 'archived'));

create index if not exists profiles_role_status_idx on public.profiles(role, status);
create index if not exists profiles_last_login_at_idx on public.profiles(last_login_at desc nulls last);
create index if not exists students_status_idx on public.students(status);

create table if not exists public.admin_notes (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  note text not null,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_notes_entity_type_check check (entity_type in ('tutor', 'parent', 'student'))
);

comment on table public.admin_notes is 'Plain-text internal notes visible only to FlyBridge admins.';
comment on column public.admin_notes.note is 'Internal admin-only note. Never exposed to tutor or parent portals.';

create index if not exists admin_notes_entity_idx on public.admin_notes(entity_type, entity_id);
create index if not exists admin_notes_created_at_idx on public.admin_notes(created_at desc);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.audit_logs is 'Admin audit trail for sensitive portal-management actions.';
comment on column public.audit_logs.metadata is 'Structured context for the audit entry. Avoid secrets and plaintext passwords.';

create index if not exists audit_logs_entity_idx on public.audit_logs(entity_type, entity_id, created_at desc);
create index if not exists audit_logs_actor_idx on public.audit_logs(actor_id, created_at desc);
create index if not exists audit_logs_action_idx on public.audit_logs(action, created_at desc);

alter table public.admin_notes enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "admins manage admin notes" on public.admin_notes;
create policy "admins manage admin notes"
on public.admin_notes
for all
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "admins read audit logs" on public.audit_logs;
create policy "admins read audit logs"
on public.audit_logs
for select
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "admins insert audit logs" on public.audit_logs;
create policy "admins insert audit logs"
on public.audit_logs
for insert
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);
