create extension if not exists "pgcrypto";

create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text not null,
  registration_date date not null default current_date,
  candidate_status text not null default 'Pendiente' check (
    candidate_status in ('Pendiente', 'Preseleccionado', 'Descartado', 'Contratado')
  ),
  job_roles text[] not null check (cardinality(job_roles) > 0),
  sport_specialties text[] not null default '{}',
  tags text[] not null default '{}',
  notes text not null default '',
  observations text not null default '',
  attachment_name text,
  attachment_path text,
  attachment_mime_type text,
  privacy_accepted boolean not null default false,
  vacancy_consent boolean not null default false,
  source text not null default 'private' check (source in ('public', 'private')),
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.candidates
  add column if not exists registration_date date not null default current_date,
  add column if not exists candidate_status text not null default 'Pendiente',
  add column if not exists sport_specialties text[] not null default '{}',
  add column if not exists tags text[] not null default '{}',
  add column if not exists notes text not null default '',
  add column if not exists observations text not null default '',
  add column if not exists attachment_name text,
  add column if not exists attachment_path text,
  add column if not exists attachment_mime_type text,
  add column if not exists privacy_accepted boolean not null default false,
  add column if not exists vacancy_consent boolean not null default false,
  add column if not exists source text not null default 'private';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'candidates_candidate_status_check'
      and conrelid = 'public.candidates'::regclass
  ) then
    alter table public.candidates
      add constraint candidates_candidate_status_check
      check (candidate_status in ('Pendiente', 'Preseleccionado', 'Descartado', 'Contratado'));
  end if;
end $$;

comment on table public.candidates is 'Candidaturas registradas desde los paneles de Curriculos EDP.';

alter table public.candidates enable row level security;

drop policy if exists "anon_can_insert_public_candidates" on public.candidates;
create policy "anon_can_insert_public_candidates"
on public.candidates
for insert
to anon
with check (
  source = 'public'
  and privacy_accepted = true
);

drop policy if exists "authenticated_can_read_candidates" on public.candidates;
create policy "authenticated_can_read_candidates"
on public.candidates
for select
to authenticated
using (true);

drop policy if exists "authenticated_can_insert_candidates" on public.candidates;
create policy "authenticated_can_insert_candidates"
on public.candidates
for insert
to authenticated
with check (true);

drop policy if exists "authenticated_can_update_candidates" on public.candidates;
create policy "authenticated_can_update_candidates"
on public.candidates
for update
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated_can_delete_candidates" on public.candidates;
create policy "authenticated_can_delete_candidates"
on public.candidates
for delete
to authenticated
using (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'candidate-cvs',
  'candidate-cvs',
  false,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.oasis.opendocument.text',
    'application/rtf',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do nothing;

drop policy if exists "anon_can_upload_candidate_cvs" on storage.objects;
create policy "anon_can_upload_candidate_cvs"
on storage.objects
for insert
to anon
with check (bucket_id = 'candidate-cvs');

drop policy if exists "authenticated_can_manage_candidate_cvs" on storage.objects;
create policy "authenticated_can_manage_candidate_cvs"
on storage.objects
for all
to authenticated
using (bucket_id = 'candidate-cvs')
with check (bucket_id = 'candidate-cvs');
