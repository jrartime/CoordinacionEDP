create table if not exists public.asignaciones (
  id bigserial primary key,
  instalacion_id integer not null references public.instalaciones (id),
  semana_01 integer[] not null default '{}',
  semana_02 integer[] not null default '{}',
  semana_03 integer[] not null default '{}',
  semana_04 integer[] not null default '{}',
  semana_05 integer[] not null default '{}',
  semana_06 integer[] not null default '{}',
  semana_07 integer[] not null default '{}',
  semana_08 integer[] not null default '{}',
  semana_09 integer[] not null default '{}',
  semana_10 integer[] not null default '{}',
  semana_11 integer[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint asignaciones_instalacion_key unique (instalacion_id),
  constraint asignaciones_semana_01_max check (cardinality(semana_01) <= 20),
  constraint asignaciones_semana_02_max check (cardinality(semana_02) <= 20),
  constraint asignaciones_semana_03_max check (cardinality(semana_03) <= 20),
  constraint asignaciones_semana_04_max check (cardinality(semana_04) <= 20),
  constraint asignaciones_semana_05_max check (cardinality(semana_05) <= 20),
  constraint asignaciones_semana_06_max check (cardinality(semana_06) <= 20),
  constraint asignaciones_semana_07_max check (cardinality(semana_07) <= 20),
  constraint asignaciones_semana_08_max check (cardinality(semana_08) <= 20),
  constraint asignaciones_semana_09_max check (cardinality(semana_09) <= 20),
  constraint asignaciones_semana_10_max check (cardinality(semana_10) <= 20),
  constraint asignaciones_semana_11_max check (cardinality(semana_11) <= 20)
);

comment on column public.asignaciones.semana_01 is 'Semana 01: 22/06 a 28/06';
comment on column public.asignaciones.semana_02 is 'Semana 02: 29/06 a 05/07';
comment on column public.asignaciones.semana_03 is 'Semana 03: 06/07 a 12/07';
comment on column public.asignaciones.semana_04 is 'Semana 04: 13/07 a 19/07';
comment on column public.asignaciones.semana_05 is 'Semana 05: 20/07 a 26/07';
comment on column public.asignaciones.semana_06 is 'Semana 06: 27/07 a 02/08';
comment on column public.asignaciones.semana_07 is 'Semana 07: 03/08 a 09/08';
comment on column public.asignaciones.semana_08 is 'Semana 08: 10/08 a 16/08';
comment on column public.asignaciones.semana_09 is 'Semana 09: 17/08 a 23/08';
comment on column public.asignaciones.semana_10 is 'Semana 10: 24/08 a 30/08';
comment on column public.asignaciones.semana_11 is 'Semana 11: 31/08 a 06/09';

create index if not exists asignaciones_instalacion_id_idx
on public.asignaciones (instalacion_id);

create or replace function public.set_asignaciones_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_asignaciones_updated_at on public.asignaciones;
create trigger set_asignaciones_updated_at
before update on public.asignaciones
for each row
execute function public.set_asignaciones_updated_at();

create or replace function public.validate_asignaciones_personal_ids()
returns trigger
language plpgsql
as $$
declare
  personal_ids integer[];
  missing_id integer;
begin
  personal_ids :=
    coalesce(new.semana_01, '{}') ||
    coalesce(new.semana_02, '{}') ||
    coalesce(new.semana_03, '{}') ||
    coalesce(new.semana_04, '{}') ||
    coalesce(new.semana_05, '{}') ||
    coalesce(new.semana_06, '{}') ||
    coalesce(new.semana_07, '{}') ||
    coalesce(new.semana_08, '{}') ||
    coalesce(new.semana_09, '{}') ||
    coalesce(new.semana_10, '{}') ||
    coalesce(new.semana_11, '{}');

  select personal_id
  into missing_id
  from unnest(personal_ids) as ids(personal_id)
  where not exists (
    select 1
    from public.personal p
    where p.id = personal_id
  )
  limit 1;

  if missing_id is not null then
    raise exception 'El id % no existe en personal', missing_id;
  end if;

  return new;
end;
$$;

drop trigger if exists validate_asignaciones_personal_ids on public.asignaciones;
create trigger validate_asignaciones_personal_ids
before insert or update on public.asignaciones
for each row
execute function public.validate_asignaciones_personal_ids();

drop view if exists public.asignaciones_detalle;

create view public.asignaciones_detalle as
select
  a.id,
  a.instalacion_id,
  i.instalacion,
  a.semana_01,
  a.semana_02,
  a.semana_03,
  a.semana_04,
  a.semana_05,
  a.semana_06,
  a.semana_07,
  a.semana_08,
  a.semana_09,
  a.semana_10,
  a.semana_11,
  a.created_at,
  a.updated_at
from public.asignaciones a
join public.instalaciones i
  on i.id = a.instalacion_id;

alter table public.asignaciones enable row level security;

drop policy if exists "authenticated_can_read_asignaciones" on public.asignaciones;
create policy "authenticated_can_read_asignaciones"
on public.asignaciones
for select
to authenticated
using (true);

drop policy if exists "authenticated_can_insert_asignaciones" on public.asignaciones;
create policy "authenticated_can_insert_asignaciones"
on public.asignaciones
for insert
to authenticated
with check (true);

drop policy if exists "authenticated_can_update_asignaciones" on public.asignaciones;
create policy "authenticated_can_update_asignaciones"
on public.asignaciones
for update
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated_can_delete_asignaciones" on public.asignaciones;
create policy "authenticated_can_delete_asignaciones"
on public.asignaciones
for delete
to authenticated
using (true);
