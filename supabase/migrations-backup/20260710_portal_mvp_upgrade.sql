alter table if exists public.profiles
  add column if not exists must_change_password boolean not null default false,
  add column if not exists temporary_password_created_at timestamptz,
  add column if not exists last_login_at timestamptz,
  add column if not exists status text not null default 'active';

alter table if exists public.students
  add column if not exists progress_status text not null default 'settling_in',
  add column if not exists progress_status_note text,
  add column if not exists recall_average numeric,
  add column if not exists active boolean not null default true;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'students_progress_status_check'
  ) then
    alter table public.students
      add constraint students_progress_status_check
      check (progress_status in ('settling_in', 'below_target', 'on_track', 'above_target', 'needs_attention'));
  end if;
end $$;

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  tutor_id uuid references public.profiles(id) on delete set null,
  lesson_title text,
  subject text,
  lesson_date date,
  start_time time,
  duration_minutes integer not null default 60,
  status text not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lessons_status_check check (status in ('scheduled', 'completed', 'cancelled', 'missed'))
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text,
  author_id uuid references public.profiles(id) on delete set null,
  status text not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint articles_status_check check (status in ('draft', 'published'))
);

alter table public.lessons enable row level security;
alter table public.articles enable row level security;

drop policy if exists "admins manage lessons" on public.lessons;
create policy "admins manage lessons"
on public.lessons
for all
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

drop policy if exists "tutors view assigned lessons" on public.lessons;
create policy "tutors view assigned lessons"
on public.lessons
for select
using (
  tutor_id = auth.uid()
  or exists (
    select 1
    from public.tutor_student_links
    where tutor_student_links.tutor_id = auth.uid()
      and tutor_student_links.student_id = lessons.student_id
  )
);

drop policy if exists "tutors manage own lessons" on public.lessons;
create policy "tutors manage own lessons"
on public.lessons
for all
using (tutor_id = auth.uid())
with check (tutor_id = auth.uid());

drop policy if exists "parents view linked completed lessons" on public.lessons;
create policy "parents view linked completed lessons"
on public.lessons
for select
using (
  status = 'completed'
  and exists (
    select 1
    from public.parent_student_links
    where parent_student_links.parent_id = auth.uid()
      and parent_student_links.student_id = lessons.student_id
  )
);

drop policy if exists "admins manage articles" on public.articles;
create policy "admins manage articles"
on public.articles
for all
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

drop policy if exists "tutors manage own articles" on public.articles;
create policy "tutors manage own articles"
on public.articles
for all
using (
  author_id = auth.uid()
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role in ('tutor', 'admin')
  )
)
with check (
  author_id = auth.uid()
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role in ('tutor', 'admin')
  )
);

drop policy if exists "public read published articles" on public.articles;
create policy "public read published articles"
on public.articles
for select
using (status = 'published');
