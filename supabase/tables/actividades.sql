create table if not exists public.actividades (
  id bigserial primary key,
  personal_id integer not null references public.personal (id),
  contrato_id integer not null references public.contratos (id),
  empresa_id integer not null references public.empresas (id),
  instalacion_id integer not null references public.instalaciones (id),
  puesto_id integer not null references public.puestos (id),
  situacion_id integer not null references public.situaciones (id),
  tipo_hora_id integer not null references public.tipo_horas (id),
  dias_semana integer[] not null default '{}',
  fecha_inicio date not null,
  fecha_fin date not null,
  hora_inicio time without time zone not null,
  hora_fin time without time zone not null,
  llamamiento_enviado boolean not null default false,
  respuesta_llamamiento text,
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint actividades_fechas_validas
    check (fecha_fin >= fecha_inicio),
  constraint actividades_horas_validas
    check (
      fecha_fin > fecha_inicio
      or hora_fin > hora_inicio
    ),
  constraint actividades_dias_semana_validos
    check (
      dias_semana <@ array[1, 2, 3, 4, 5, 6, 7]
    ),
  constraint actividades_respuesta_llamamiento_valida
    check (
      respuesta_llamamiento is null
      or respuesta_llamamiento in ('aceptado', 'rechazado')
    )
);

create index if not exists actividades_personal_id_idx
on public.actividades (personal_id);

create index if not exists actividades_contrato_id_idx
on public.actividades (contrato_id);

create index if not exists actividades_empresa_id_idx
on public.actividades (empresa_id);

create index if not exists actividades_instalacion_id_idx
on public.actividades (instalacion_id);

create index if not exists actividades_puesto_id_idx
on public.actividades (puesto_id);

create index if not exists actividades_situacion_id_idx
on public.actividades (situacion_id);

create index if not exists actividades_tipo_hora_id_idx
on public.actividades (tipo_hora_id);

create index if not exists actividades_fecha_inicio_idx
on public.actividades (fecha_inicio);

create index if not exists actividades_fecha_hora_idx
on public.actividades (fecha_inicio desc, hora_inicio asc);

create index if not exists actividades_filtros_fecha_idx
on public.actividades (contrato_id, personal_id, instalacion_id, fecha_inicio desc);

create table if not exists public.actividades_personal (
  personal_id integer primary key references public.personal (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.actividades_instalaciones (
  instalacion_id integer primary key references public.instalaciones (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists actividades_personal_created_at_idx
on public.actividades_personal (created_at);

create index if not exists actividades_instalaciones_created_at_idx
on public.actividades_instalaciones (created_at);

alter table public.actividades
add column if not exists dias_semana integer[] not null default '{}';

alter table public.actividades
drop constraint if exists actividades_dias_semana_validos;

alter table public.actividades
add constraint actividades_dias_semana_validos
check (dias_semana <@ array[1, 2, 3, 4, 5, 6, 7]);

alter table public.actividades
add column if not exists llamamiento_enviado boolean not null default false;

alter table public.actividades
add column if not exists respuesta_llamamiento text;

alter table public.actividades
drop constraint if exists actividades_respuesta_llamamiento_valida;

alter table public.actividades
add constraint actividades_respuesta_llamamiento_valida
check (
  respuesta_llamamiento is null
  or respuesta_llamamiento in ('aceptado', 'rechazado')
);

create or replace function public.set_actividades_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_actividades_updated_at on public.actividades;
create trigger set_actividades_updated_at
before update on public.actividades
for each row
execute function public.set_actividades_updated_at();

drop view if exists public.actividades_detalle;

create or replace view public.actividades_detalle as
select
  a.id,
  a.personal_id,
  p.personal,
  p.dni,
  p.fecha_nacimiento,
  p.ss,
  a.contrato_id,
  c.contrato,
  a.empresa_id,
  e.empresa,
  a.instalacion_id,
  i.instalacion,
  a.puesto_id,
  pu.puesto,
  a.situacion_id,
  s.situacion,
  a.tipo_hora_id,
  th.tipo_hora,
  a.dias_semana,
  a.fecha_inicio,
  a.fecha_fin,
  a.hora_inicio,
  a.hora_fin,
  a.llamamiento_enviado,
  a.respuesta_llamamiento,
  a.observaciones,
  a.created_at,
  a.updated_at
from public.actividades a
join public.personal p
  on p.id = a.personal_id
join public.contratos c
  on c.id = a.contrato_id
join public.empresas e
  on e.id = a.empresa_id
join public.instalaciones i
  on i.id = a.instalacion_id
join public.puestos pu
  on pu.id = a.puesto_id
join public.situaciones s
  on s.id = a.situacion_id
join public.tipo_horas th
  on th.id = a.tipo_hora_id;

alter table public.actividades enable row level security;
alter table public.actividades_personal enable row level security;
alter table public.actividades_instalaciones enable row level security;

drop policy if exists "authenticated_can_read_actividades" on public.actividades;
create policy "authenticated_can_read_actividades"
on public.actividades
for select
to authenticated
using (true);

drop policy if exists "authenticated_can_insert_actividades" on public.actividades;
create policy "authenticated_can_insert_actividades"
on public.actividades
for insert
to authenticated
with check (true);

drop policy if exists "authenticated_can_update_actividades" on public.actividades;
create policy "authenticated_can_update_actividades"
on public.actividades
for update
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated_can_delete_actividades" on public.actividades;
create policy "authenticated_can_delete_actividades"
on public.actividades
for delete
to authenticated
using (true);

drop policy if exists "authenticated_can_read_actividades_personal" on public.actividades_personal;
create policy "authenticated_can_read_actividades_personal"
on public.actividades_personal
for select
to authenticated
using (true);

drop policy if exists "authenticated_can_write_actividades_personal" on public.actividades_personal;
create policy "authenticated_can_write_actividades_personal"
on public.actividades_personal
for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated_can_read_actividades_instalaciones" on public.actividades_instalaciones;
create policy "authenticated_can_read_actividades_instalaciones"
on public.actividades_instalaciones
for select
to authenticated
using (true);

drop policy if exists "authenticated_can_write_actividades_instalaciones" on public.actividades_instalaciones;
create policy "authenticated_can_write_actividades_instalaciones"
on public.actividades_instalaciones
for all
to authenticated
using (true)
with check (true);
