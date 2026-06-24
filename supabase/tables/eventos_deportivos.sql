create table if not exists public.eventos_deportivos (
  id bigserial primary key,
  nombre text not null,
  instalacion_id integer not null references public.instalaciones (id),
  fecha_inicio date not null,
  fecha_fin date not null,
  observaciones text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint eventos_deportivos_fechas_validas
    check (fecha_fin >= fecha_inicio)
);

alter table public.eventos_deportivos
add column if not exists archived_at timestamptz;

create table if not exists public.eventos_cronograma (
  id bigserial primary key,
  evento_id bigint not null references public.eventos_deportivos (id) on delete cascade,
  fecha date not null,
  hora_inicio time without time zone not null,
  hora_fin time without time zone not null,
  actividad text not null,
  necesita_transporte boolean not null default false,
  transporte_detalle text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint eventos_cronograma_horas_validas
    check (hora_fin > hora_inicio)
);

alter table public.eventos_cronograma
add column if not exists necesita_transporte boolean not null default false;

alter table public.eventos_cronograma
add column if not exists transporte_detalle text;

alter table public.eventos_cronograma
drop constraint if exists eventos_cronograma_horas_validas;

alter table public.eventos_cronograma
add constraint eventos_cronograma_horas_validas
check (hora_fin <> hora_inicio);

create table if not exists public.eventos_cronograma_personal (
  id bigserial primary key,
  cronograma_id bigint not null references public.eventos_cronograma (id) on delete cascade,
  personal_id integer not null references public.personal (id),
  hora_inicio time without time zone not null,
  hora_fin time without time zone not null,
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint eventos_cronograma_personal_horas_validas
    check (hora_fin > hora_inicio),
  constraint eventos_cronograma_personal_unico
    unique (cronograma_id, personal_id)
);

alter table public.eventos_cronograma_personal
drop constraint if exists eventos_cronograma_personal_horas_validas;

alter table public.eventos_cronograma_personal
add constraint eventos_cronograma_personal_horas_validas
check (hora_fin <> hora_inicio);

create table if not exists public.eventos_montaje_personal (
  personal_id integer primary key references public.personal (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.eventos_instalaciones (
  instalacion_id integer primary key references public.instalaciones (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists eventos_deportivos_instalacion_id_idx
on public.eventos_deportivos (instalacion_id);

create index if not exists eventos_deportivos_fecha_inicio_idx
on public.eventos_deportivos (fecha_inicio);

create index if not exists eventos_deportivos_archived_at_idx
on public.eventos_deportivos (archived_at);

create index if not exists eventos_cronograma_evento_id_idx
on public.eventos_cronograma (evento_id);

create index if not exists eventos_cronograma_fecha_idx
on public.eventos_cronograma (fecha);

create index if not exists eventos_cronograma_personal_cronograma_id_idx
on public.eventos_cronograma_personal (cronograma_id);

create index if not exists eventos_cronograma_personal_personal_id_idx
on public.eventos_cronograma_personal (personal_id);

create index if not exists eventos_montaje_personal_created_at_idx
on public.eventos_montaje_personal (created_at);

create index if not exists eventos_instalaciones_created_at_idx
on public.eventos_instalaciones (created_at);

create or replace function public.set_eventos_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_eventos_deportivos_updated_at on public.eventos_deportivos;
create trigger set_eventos_deportivos_updated_at
before update on public.eventos_deportivos
for each row
execute function public.set_eventos_updated_at();

drop trigger if exists set_eventos_cronograma_updated_at on public.eventos_cronograma;
create trigger set_eventos_cronograma_updated_at
before update on public.eventos_cronograma
for each row
execute function public.set_eventos_updated_at();

drop trigger if exists set_eventos_cronograma_personal_updated_at on public.eventos_cronograma_personal;
create trigger set_eventos_cronograma_personal_updated_at
before update on public.eventos_cronograma_personal
for each row
execute function public.set_eventos_updated_at();

drop view if exists public.eventos_cronograma_detalle;

create or replace view public.eventos_cronograma_detalle as
select
  c.id,
  c.evento_id,
  e.nombre as evento,
  e.instalacion_id,
  i.instalacion,
  c.fecha,
  c.hora_inicio,
  c.hora_fin,
  c.actividad,
  c.necesita_transporte,
  c.transporte_detalle,
  cp.id as asignacion_id,
  cp.personal_id,
  p.personal,
  cp.hora_inicio as personal_hora_inicio,
  cp.hora_fin as personal_hora_fin,
  cp.observaciones as personal_observaciones
from public.eventos_cronograma c
join public.eventos_deportivos e
  on e.id = c.evento_id
join public.instalaciones i
  on i.id = e.instalacion_id
left join public.eventos_cronograma_personal cp
  on cp.cronograma_id = c.id
left join public.personal p
  on p.id = cp.personal_id;

alter table public.eventos_deportivos enable row level security;
alter table public.eventos_cronograma enable row level security;
alter table public.eventos_cronograma_personal enable row level security;
alter table public.eventos_montaje_personal enable row level security;
alter table public.eventos_instalaciones enable row level security;

drop policy if exists "authenticated_can_read_eventos_deportivos" on public.eventos_deportivos;
create policy "authenticated_can_read_eventos_deportivos"
on public.eventos_deportivos
for select
to authenticated
using (true);

drop policy if exists "authenticated_can_write_eventos_deportivos" on public.eventos_deportivos;
create policy "authenticated_can_write_eventos_deportivos"
on public.eventos_deportivos
for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated_can_read_eventos_cronograma" on public.eventos_cronograma;
create policy "authenticated_can_read_eventos_cronograma"
on public.eventos_cronograma
for select
to authenticated
using (true);

drop policy if exists "authenticated_can_write_eventos_cronograma" on public.eventos_cronograma;
create policy "authenticated_can_write_eventos_cronograma"
on public.eventos_cronograma
for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated_can_read_eventos_cronograma_personal" on public.eventos_cronograma_personal;
create policy "authenticated_can_read_eventos_cronograma_personal"
on public.eventos_cronograma_personal
for select
to authenticated
using (true);

drop policy if exists "authenticated_can_write_eventos_cronograma_personal" on public.eventos_cronograma_personal;
create policy "authenticated_can_write_eventos_cronograma_personal"
on public.eventos_cronograma_personal
for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated_can_read_eventos_montaje_personal" on public.eventos_montaje_personal;
create policy "authenticated_can_read_eventos_montaje_personal"
on public.eventos_montaje_personal
for select
to authenticated
using (true);

drop policy if exists "authenticated_can_write_eventos_montaje_personal" on public.eventos_montaje_personal;
create policy "authenticated_can_write_eventos_montaje_personal"
on public.eventos_montaje_personal
for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated_can_read_eventos_instalaciones" on public.eventos_instalaciones;
create policy "authenticated_can_read_eventos_instalaciones"
on public.eventos_instalaciones
for select
to authenticated
using (true);

drop policy if exists "authenticated_can_write_eventos_instalaciones" on public.eventos_instalaciones;
create policy "authenticated_can_write_eventos_instalaciones"
on public.eventos_instalaciones
for all
to authenticated
using (true)
with check (true);
