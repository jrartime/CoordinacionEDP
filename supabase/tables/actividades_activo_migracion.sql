-- Migración puntual para incorporar el estado activo en Actividades.
-- Ejecutar una sola vez en el editor SQL de Supabase.

begin;

alter table public.actividades
add column if not exists activo boolean not null default true;

drop view if exists public.actividades_detalle;

create view public.actividades_detalle as
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
  a.activo,
  a.dias_semana,
  a.horarios_personalizados,
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

commit;
