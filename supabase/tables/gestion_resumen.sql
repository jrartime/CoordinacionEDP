-- ============================================================================
--  Agregados para la pestaña Gestión.
-- ----------------------------------------------------------------------------
--  La pestaña Registros solo carga las primeras 5000 filas (RECORDS_LOAD_LIMIT)
--  y su resumen suma unicamente lo cargado, por lo que sub-cuenta en intervalos
--  grandes. Gestión agrega en el servidor (sin limite de filas) para dar totales
--  exactos. Ambas funciones son SECURITY INVOKER + STABLE, de modo que el RLS de
--  registros acota por contrato asignado igual que en el resto de la app.
--  Se acota a contratos activos para replicar el alcance por defecto de Registros.
-- ============================================================================

create or replace function public.get_gestion_personal(
  p_desde date default null,
  p_hasta date default null
)
returns table (
  personal_id integer,
  personal text
)
language sql
stable
set search_path = public
as $$
  select distinct r.personal_id, p.personal
  from public.registros r
  join public.contratos c
    on c.id = r.contrato_id
   and c.activo = true
  left join public.personal p
    on p.id = r.personal_id
  where (p_desde is null or r.fecha >= p_desde)
    and (p_hasta is null or r.fecha <= p_hasta)
    and r.personal_id is not null
  order by p.personal;
$$;

create or replace function public.get_gestion_registros_resumen(
  p_desde date default null,
  p_hasta date default null,
  p_personal_id integer default null
)
returns table (
  puesto_id integer,
  puesto text,
  situacion_id integer,
  situacion text,
  tipo_hora_id integer,
  tipo_hora text,
  total_horas numeric
)
language sql
stable
set search_path = public
as $$
  select
    r.puesto_id,
    pu.puesto,
    r.situacion_id,
    s.situacion,
    r.tipo_hora_id,
    th.tipo_hora,
    sum(r.horas) as total_horas
  from public.registros r
  join public.contratos c
    on c.id = r.contrato_id
   and c.activo = true
  left join public.puestos pu on pu.id = r.puesto_id
  left join public.situaciones s on s.id = r.situacion_id
  left join public.tipo_horas th on th.id = r.tipo_hora_id
  where (p_desde is null or r.fecha >= p_desde)
    and (p_hasta is null or r.fecha <= p_hasta)
    and (p_personal_id is null or r.personal_id = p_personal_id)
  group by r.puesto_id, pu.puesto, r.situacion_id, s.situacion, r.tipo_hora_id, th.tipo_hora;
$$;

revoke all on function public.get_gestion_personal(date, date) from public;
revoke all on function public.get_gestion_registros_resumen(date, date, integer) from public;
grant execute on function public.get_gestion_personal(date, date) to authenticated;
grant execute on function public.get_gestion_registros_resumen(date, date, integer) to authenticated;
