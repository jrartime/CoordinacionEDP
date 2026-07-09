create table if not exists public.actividades (
  id bigserial primary key,
  personal_id integer not null references public.personal (id),
  contrato_id integer not null references public.contratos (id),
  servicio_id bigint references public.servicios (id),
  empresa_id integer not null references public.empresas (id),
  instalacion_id integer not null references public.instalaciones (id),
  puesto_id integer not null references public.puestos (id),
  funcion_id integer references public.funciones (id),
  modalidad_id integer references public.modalidades (id),
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

alter table public.actividades
add column if not exists servicio_id bigint references public.servicios (id);

alter table public.actividades
add column if not exists funcion_id integer;

alter table public.actividades
add column if not exists modalidad_id integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'actividades_funcion_id_fkey'
      and conrelid = 'public.actividades'::regclass
  ) then
    alter table public.actividades
      add constraint actividades_funcion_id_fkey
      foreign key (funcion_id)
      references public.funciones (id)
      not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'actividades_modalidad_id_fkey'
      and conrelid = 'public.actividades'::regclass
  ) then
    alter table public.actividades
      add constraint actividades_modalidad_id_fkey
      foreign key (modalidad_id)
      references public.modalidades (id)
      not valid;
  end if;
end $$;

create index if not exists actividades_personal_id_idx
on public.actividades (personal_id);

create index if not exists actividades_contrato_id_idx
on public.actividades (contrato_id);

create index if not exists actividades_servicio_id_idx
on public.actividades (servicio_id);

create index if not exists actividades_empresa_id_idx
on public.actividades (empresa_id);

create index if not exists actividades_instalacion_id_idx
on public.actividades (instalacion_id);

create index if not exists actividades_puesto_id_idx
on public.actividades (puesto_id);

create index if not exists actividades_funcion_id_idx
on public.actividades (funcion_id);

create index if not exists actividades_modalidad_id_idx
on public.actividades (modalidad_id);

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

drop table if exists public.actividades_personal;
drop table if exists public.actividades_instalaciones;

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

create or replace function public.validate_actividades_servicio_contrato()
returns trigger
language plpgsql
as $$
declare
  service_contract_id integer;
begin
  if new.servicio_id is null then
    return new;
  end if;

  select s.contrato_id
    into service_contract_id
  from public.servicios s
  where s.id = new.servicio_id;

  if service_contract_id is null then
    raise exception 'El servicio indicado no existe.';
  end if;

  if new.contrato_id is distinct from service_contract_id then
    raise exception 'El servicio indicado no pertenece al contrato de la actividad.';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_actividades_servicio_contrato on public.actividades;
create trigger validate_actividades_servicio_contrato
before insert or update of contrato_id, servicio_id on public.actividades
for each row
execute function public.validate_actividades_servicio_contrato();

drop view if exists public.actividades_detalle;

create or replace view public.actividades_detalle as
select
  a.id,
  a.personal_id,
  p.personal,
  p.dni,
  case when public.is_coordinacion_admin() then pc.fecha_nacimiento end as fecha_nacimiento,
  case when public.is_coordinacion_admin() then pc.ss end as ss,
  a.contrato_id,
  c.contrato,
  a.servicio_id,
  se.servicio,
  a.empresa_id,
  e.empresa,
  a.instalacion_id,
  i.instalacion,
  a.puesto_id,
  pu.puesto,
  a.funcion_id,
  f.funcion,
  a.modalidad_id,
  m.modalidad,
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
  public.is_contrato_assignment_current(
    cp.activo,
    cp.fecha_inicio,
    cp.fecha_fin,
    cp.removed_at
  ) as personal_asignado_actualmente,
  public.get_contrato_assignment_state(
    cp.activo,
    cp.fecha_inicio,
    cp.fecha_fin,
    cp.removed_at
  ) as personal_asignacion_estado,
  public.is_contrato_assignment_current(
    ci.activo,
    ci.fecha_inicio,
    ci.fecha_fin,
    ci.removed_at
  ) as instalacion_asignada_actualmente,
  public.get_contrato_assignment_state(
    ci.activo,
    ci.fecha_inicio,
    ci.fecha_fin,
    ci.removed_at
  ) as instalacion_asignacion_estado,
  a.created_at,
  a.updated_at
from public.actividades a
join public.personal p
  on p.id = a.personal_id
left join public.personal_confidencial pc
  on pc.personal_id = p.id
join public.contratos c
  on c.id = a.contrato_id
left join public.servicios se
  on se.id = a.servicio_id
join public.empresas e
  on e.id = a.empresa_id
join public.instalaciones i
  on i.id = a.instalacion_id
join public.puestos pu
  on pu.id = a.puesto_id
left join public.funciones f
  on f.id = a.funcion_id
left join public.modalidades m
  on m.id = a.modalidad_id
join public.situaciones s
  on s.id = a.situacion_id
join public.tipo_horas th
  on th.id = a.tipo_hora_id
left join public.contrato_personal cp
  on cp.contrato_id = a.contrato_id
 and cp.personal_id = a.personal_id
left join public.contrato_instalaciones ci
  on ci.contrato_id = a.contrato_id
 and ci.instalacion_id = a.instalacion_id;

alter view public.actividades_detalle set (security_invoker = true);

grant select on public.actividades_detalle to authenticated;

alter table public.actividades enable row level security;

drop policy if exists "authenticated_can_read_actividades" on public.actividades;
create policy "authenticated_can_read_actividades"
on public.actividades
for select
to authenticated
using (public.can_access_coordinacion_actividad(contrato_id, servicio_id));

drop policy if exists "authenticated_can_insert_actividades" on public.actividades;
create policy "authenticated_can_insert_actividades"
on public.actividades
for insert
to authenticated
with check (public.can_manage_coordinacion_actividad(servicio_id));

drop policy if exists "authenticated_can_update_actividades" on public.actividades;
create policy "authenticated_can_update_actividades"
on public.actividades
for update
to authenticated
using (public.can_manage_coordinacion_actividad(servicio_id))
with check (public.can_manage_coordinacion_actividad(servicio_id));

drop policy if exists "authenticated_can_delete_actividades" on public.actividades;
create policy "authenticated_can_delete_actividades"
on public.actividades
for delete
to authenticated
using (public.can_manage_coordinacion_actividad(servicio_id));
