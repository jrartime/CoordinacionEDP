create table if not exists public.concilia_disponibilidad (
  id bigserial primary key,
  nombre text not null,
  nombre_normalizado text not null,
  observaciones text,
  semana_01 boolean not null default false,
  semana_02 boolean not null default false,
  semana_03 boolean not null default false,
  semana_04 boolean not null default false,
  semana_05 boolean not null default false,
  semana_06 boolean not null default false,
  semana_07 boolean not null default false,
  semana_08 boolean not null default false,
  semana_09 boolean not null default false,
  semana_10 boolean not null default false,
  semana_11 boolean not null default false,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint concilia_disponibilidad_nombre_normalizado_key unique (nombre_normalizado)
);

comment on column public.concilia_disponibilidad.semana_01 is 'Semana 01: 22/06 a 28/06';
comment on column public.concilia_disponibilidad.semana_02 is 'Semana 02: 29/06 a 05/07';
comment on column public.concilia_disponibilidad.semana_03 is 'Semana 03: 06/07 a 12/07';
comment on column public.concilia_disponibilidad.semana_04 is 'Semana 04: 13/07 a 19/07';
comment on column public.concilia_disponibilidad.semana_05 is 'Semana 05: 20/07 a 26/07';
comment on column public.concilia_disponibilidad.semana_06 is 'Semana 06: 27/07 a 02/08';
comment on column public.concilia_disponibilidad.semana_07 is 'Semana 07: 03/08 a 09/08';
comment on column public.concilia_disponibilidad.semana_08 is 'Semana 08: 10/08 a 16/08';
comment on column public.concilia_disponibilidad.semana_09 is 'Semana 09: 17/08 a 23/08';
comment on column public.concilia_disponibilidad.semana_10 is 'Semana 10: 24/08 a 30/08';
comment on column public.concilia_disponibilidad.semana_11 is 'Semana 11: 31/08 a 06/09';

create index if not exists concilia_disponibilidad_nombre_idx
on public.concilia_disponibilidad (nombre);

create or replace function public.set_concilia_disponibilidad_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_concilia_disponibilidad_updated_at on public.concilia_disponibilidad;
create trigger set_concilia_disponibilidad_updated_at
before update on public.concilia_disponibilidad
for each row
execute function public.set_concilia_disponibilidad_updated_at();

create or replace function public.save_concilia_disponibilidad(
  p_nombre text,
  p_semanas jsonb default '{}'::jsonb,
  p_observaciones text default null
)
returns table (
  id bigint,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_name text;
  name_key text;
begin
  clean_name := regexp_replace(btrim(coalesce(p_nombre, '')), '\s+', ' ', 'g');
  name_key := lower(clean_name);

  if length(clean_name) < 3 then
    raise exception 'El nombre debe tener al menos 3 caracteres.';
  end if;

  if length(clean_name) > 160 then
    raise exception 'El nombre es demasiado largo.';
  end if;

  return query
  insert into public.concilia_disponibilidad (
    nombre,
    nombre_normalizado,
    observaciones,
    semana_01,
    semana_02,
    semana_03,
    semana_04,
    semana_05,
    semana_06,
    semana_07,
    semana_08,
    semana_09,
    semana_10,
    semana_11
  )
  values (
    clean_name,
    name_key,
    nullif(btrim(coalesce(p_observaciones, '')), ''),
    coalesce((p_semanas->>'semana_01')::boolean, false),
    coalesce((p_semanas->>'semana_02')::boolean, false),
    coalesce((p_semanas->>'semana_03')::boolean, false),
    coalesce((p_semanas->>'semana_04')::boolean, false),
    coalesce((p_semanas->>'semana_05')::boolean, false),
    coalesce((p_semanas->>'semana_06')::boolean, false),
    coalesce((p_semanas->>'semana_07')::boolean, false),
    coalesce((p_semanas->>'semana_08')::boolean, false),
    coalesce((p_semanas->>'semana_09')::boolean, false),
    coalesce((p_semanas->>'semana_10')::boolean, false),
    coalesce((p_semanas->>'semana_11')::boolean, false)
  )
  on conflict (nombre_normalizado) do update set
    nombre = excluded.nombre,
    observaciones = excluded.observaciones,
    semana_01 = excluded.semana_01,
    semana_02 = excluded.semana_02,
    semana_03 = excluded.semana_03,
    semana_04 = excluded.semana_04,
    semana_05 = excluded.semana_05,
    semana_06 = excluded.semana_06,
    semana_07 = excluded.semana_07,
    semana_08 = excluded.semana_08,
    semana_09 = excluded.semana_09,
    semana_10 = excluded.semana_10,
    semana_11 = excluded.semana_11,
    updated_at = now()
  returning concilia_disponibilidad.id, concilia_disponibilidad.updated_at;
end;
$$;

revoke all on function public.save_concilia_disponibilidad(text, jsonb, text) from public;
grant execute on function public.save_concilia_disponibilidad(text, jsonb, text) to anon;
grant execute on function public.save_concilia_disponibilidad(text, jsonb, text) to authenticated;

alter table public.concilia_disponibilidad enable row level security;

grant select, delete on public.concilia_disponibilidad to authenticated;

do $$
declare
  id_sequence regclass;
begin
  id_sequence := pg_get_serial_sequence('public.concilia_disponibilidad', 'id')::regclass;

  if id_sequence is not null then
    execute format('grant usage, select on sequence %s to authenticated', id_sequence);
  end if;
end $$;

drop policy if exists "authenticated_can_read_concilia_disponibilidad" on public.concilia_disponibilidad;
create policy "authenticated_can_read_concilia_disponibilidad"
on public.concilia_disponibilidad
for select
to authenticated
using (true);

drop policy if exists "authenticated_can_delete_concilia_disponibilidad" on public.concilia_disponibilidad;
create policy "authenticated_can_delete_concilia_disponibilidad"
on public.concilia_disponibilidad
for delete
to authenticated
using (true);
