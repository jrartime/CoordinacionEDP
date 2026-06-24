create table if not exists public.contrato_personal (
  contrato_id integer not null references public.contratos (id) on delete cascade,
  personal_id integer not null references public.personal (id) on delete cascade,
  activo boolean not null default true,
  fecha_inicio date,
  fecha_fin date,
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  removed_at timestamptz,
  primary key (contrato_id, personal_id),
  constraint contrato_personal_fechas_validas
    check (fecha_fin is null or fecha_inicio is null or fecha_fin >= fecha_inicio)
);

create table if not exists public.contrato_instalaciones (
  contrato_id integer not null references public.contratos (id) on delete cascade,
  instalacion_id integer not null references public.instalaciones (id) on delete cascade,
  activo boolean not null default true,
  fecha_inicio date,
  fecha_fin date,
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  removed_at timestamptz,
  primary key (contrato_id, instalacion_id),
  constraint contrato_instalaciones_fechas_validas
    check (fecha_fin is null or fecha_inicio is null or fecha_fin >= fecha_inicio)
);

create index if not exists contrato_personal_personal_id_idx
on public.contrato_personal (personal_id);

create index if not exists contrato_personal_activo_idx
on public.contrato_personal (contrato_id, activo);

create index if not exists contrato_instalaciones_instalacion_id_idx
on public.contrato_instalaciones (instalacion_id);

create index if not exists contrato_instalaciones_activo_idx
on public.contrato_instalaciones (contrato_id, activo);

create or replace function public.set_contrato_asignaciones_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_contrato_personal_updated_at on public.contrato_personal;
create trigger set_contrato_personal_updated_at
before update on public.contrato_personal
for each row
execute function public.set_contrato_asignaciones_updated_at();

drop trigger if exists set_contrato_instalaciones_updated_at on public.contrato_instalaciones;
create trigger set_contrato_instalaciones_updated_at
before update on public.contrato_instalaciones
for each row
execute function public.set_contrato_asignaciones_updated_at();

create or replace function public.is_contrato_assignment_current(
  p_activo boolean,
  p_fecha_inicio date,
  p_fecha_fin date,
  p_removed_at timestamptz
)
returns boolean
language sql
stable
as $$
  select coalesce(p_activo, false)
    and p_removed_at is null
    and (p_fecha_inicio is null or p_fecha_inicio <= current_date)
    and (p_fecha_fin is null or p_fecha_fin >= current_date);
$$;

create or replace function public.get_contrato_assignment_state(
  p_activo boolean,
  p_fecha_inicio date,
  p_fecha_fin date,
  p_removed_at timestamptz
)
returns text
language sql
stable
as $$
  select case
    when public.is_contrato_assignment_current(p_activo, p_fecha_inicio, p_fecha_fin, p_removed_at) then 'actual'
    when p_activo is null then 'sin_asignacion'
    else 'finalizada'
  end;
$$;

create or replace function public.can_manage_coordinacion_contrato(
  p_contrato_id integer,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.is_coordinacion_admin(p_user_id), false)
    or exists (
      select 1
      from public.coordinacion_usuario_servicios cus
      join public.servicios s
        on s.id = cus.servicio_id
      join public.coordinacion_usuarios cu
        on cu.user_id = cus.user_id
       and cu.activo = true
       and cu.rol in ('coordinator', 'area_coordinator')
      where cus.user_id = p_user_id
        and s.contrato_id = p_contrato_id
    );
$$;

revoke all on function public.can_manage_coordinacion_contrato(integer, uuid) from public;
grant execute on function public.can_manage_coordinacion_contrato(integer, uuid) to authenticated;

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

alter table public.contrato_personal enable row level security;
alter table public.contrato_instalaciones enable row level security;

grant select, insert, update, delete on public.contrato_personal to authenticated;
grant select, insert, update, delete on public.contrato_instalaciones to authenticated;

drop policy if exists "contrato_personal_can_read" on public.contrato_personal;
create policy "contrato_personal_can_read"
on public.contrato_personal
for select
to authenticated
using (public.can_access_coordinacion_contrato(contrato_id));

drop policy if exists "contrato_personal_can_write" on public.contrato_personal;
create policy "contrato_personal_can_write"
on public.contrato_personal
for all
to authenticated
using (public.can_manage_coordinacion_contrato(contrato_id))
with check (public.can_manage_coordinacion_contrato(contrato_id));

drop policy if exists "contrato_instalaciones_can_read" on public.contrato_instalaciones;
create policy "contrato_instalaciones_can_read"
on public.contrato_instalaciones
for select
to authenticated
using (public.can_access_coordinacion_contrato(contrato_id));

drop policy if exists "contrato_instalaciones_can_write" on public.contrato_instalaciones;
create policy "contrato_instalaciones_can_write"
on public.contrato_instalaciones
for all
to authenticated
using (public.can_manage_coordinacion_contrato(contrato_id))
with check (public.can_manage_coordinacion_contrato(contrato_id));
