-- Cotejo de Bajas médicas contra Registros (situaciones IT / LG).
-- Escrito para el esquema coordinacion (Portal Laboral). Solo lectura.
--
-- Fase 1 del proyecto de Incapacidad Transitoria (ver memoria
-- nominas-incapacidad-transitoria-pendiente): antes de calcular nada en Gestión
-- hay que saber si lo que dicen las bajas (personal_bajas, el expediente) y lo
-- que dicen los registros (días programados marcados IT/LG) cuentan lo mismo.
-- Esta función NO corrige nada: enumera las discrepancias para revisarlas.
--
-- Categorías devueltas:
--   it_sin_baja         días IT en Registros que ninguna baja cubre (en tramos).
--   lg_sin_cobertura    días LG que ninguna baja ni ningún permiso cubre.
--   baja_sin_registros  baja sin un solo día IT/LG en Registros dentro de su
--                       rango (puede ser legítimo si la persona no tenía
--                       actividad programada: es un aviso, no un error).
--   trabajo_en_baja     baja con registros de trabajo (NORM/SUST) dentro de su
--                       rango: o la baja está mal fechada o el registro lo está.
--   bajas_solapadas     dos bajas de la misma persona que se pisan.
-- (Hubo una séptima, tipo_estimado, para las bajas con el tipo puesto como
-- estimación al reconciliar el 2026-09-03. Se retiró el 2026-10-31 al dar por
-- buenos esos tipos y vaciar la nota; ver personal_bajas_obs_backup_20261031.)
--
-- Registros solo existe en días con actividad programada, no cada día natural,
-- así que los días sueltos se agrupan en tramos con p_tolerancia días de hueco
-- (14 por defecto, el mismo criterio que la reconciliación del 2026-09-03).
-- Una baja abierta (fecha_fin null) cubre desde su inicio sin límite.
--
-- SECURITY INVOKER: respeta el RLS de registros, personal_bajas y
-- personal_permisos (alcance por contrato asignado).

create or replace function coordinacion.get_bajas_cotejo(
  p_desde date,
  p_hasta date,
  p_personal_id integer default null,
  p_tolerancia integer default 14
)
returns table (
  categoria text,
  personal_id integer,
  personal text,
  fecha_desde date,
  fecha_hasta date,
  dias integer,
  detalle text,
  baja_id bigint
)
language sql stable security invoker
set search_path = coordinacion, extensions
as $$
  with
  bajas as (
    select b.id, b.personal_id, b.tipo_id, bt.tipo,
           b.fecha_inicio, coalesce(b.fecha_fin, date '2999-01-01') as fin,
           b.fecha_fin, b.observacion
    from coordinacion.personal_bajas b
    join coordinacion.personal_bajas_tipo bt on bt.id = b.tipo_id
    where b.fecha_inicio <= p_hasta
      and coalesce(b.fecha_fin, date '2999-01-01') >= p_desde
      and (p_personal_id is null or b.personal_id = p_personal_id)
  ),
  dias_reg as (
    select distinct r.personal_id, r.fecha, s.situacion
    from coordinacion.registros r
    join coordinacion.situaciones s on s.id = r.situacion_id
    where s.situacion in ('IT', 'LG')
      and r.fecha between p_desde and p_hasta
      and (p_personal_id is null or r.personal_id = p_personal_id)
  ),
  sin_cobertura as (
    select d.*
    from dias_reg d
    where not exists (
        select 1 from coordinacion.personal_bajas b
        where b.personal_id = d.personal_id
          and d.fecha between b.fecha_inicio and coalesce(b.fecha_fin, date '2999-01-01'))
      and (d.situacion = 'IT' or not exists (
        select 1 from coordinacion.personal_permisos pp
        where pp.personal_id = d.personal_id
          and d.fecha between pp.fecha_inicio and coalesce(pp.fecha_fin, date '2999-01-01')))
  ),
  con_previo as (
    select sc.*,
      lag(sc.fecha) over (partition by sc.personal_id, sc.situacion order by sc.fecha) as previo
    from sin_cobertura sc
  ),
  marcados as (
    select cp.*,
      sum(case when cp.previo is not null and cp.fecha - cp.previo > p_tolerancia then 1 else 0 end)
        over (partition by cp.personal_id, cp.situacion order by cp.fecha) as isla
    from con_previo cp
  ),
  tramos as (
    select personal_id, situacion, isla,
           min(fecha) as desde, max(fecha) as hasta, count(*)::integer as n
    from marcados
    group by personal_id, situacion, isla
  ),
  nombres as (
    select p.id, p.personal from coordinacion.personal p
  ),
  r_sin_cobertura as (
    select case t.situacion when 'IT' then 'it_sin_baja' else 'lg_sin_cobertura' end as categoria,
           t.personal_id, n.personal, t.desde, t.hasta, t.n as dias,
           format('%s días %s en Registros sin baja%s que los cubra',
                  t.n, t.situacion,
                  case when t.situacion = 'LG' then ' ni permiso' else '' end) as detalle,
           null::bigint as baja_id
    from tramos t join nombres n on n.id = t.personal_id
  ),
  r_baja_sin_reg as (
    select 'baja_sin_registros', b.personal_id, n.personal, b.fecha_inicio, b.fecha_fin,
           (least(b.fin, p_hasta) - greatest(b.fecha_inicio, p_desde) + 1)::integer,
           b.tipo || ': ningún día IT/LG en Registros dentro de la baja', b.id
    from bajas b join nombres n on n.id = b.personal_id
    where not exists (
      select 1 from dias_reg d
      where d.personal_id = b.personal_id and d.fecha between b.fecha_inicio and b.fin)
  ),
  r_trabajo as (
    select 'trabajo_en_baja', b.personal_id, n.personal, min(r.fecha), max(r.fecha),
           count(distinct r.fecha)::integer,
           format('%s: %s días con registros de trabajo (NORM/SUST) dentro de la baja',
                  b.tipo, count(distinct r.fecha)),
           b.id
    from bajas b
    join coordinacion.registros r
      on r.personal_id = b.personal_id
     and r.fecha between greatest(b.fecha_inicio, p_desde) and least(b.fin, p_hasta)
    join coordinacion.situaciones s on s.id = r.situacion_id and s.situacion in ('NORM', 'SUST')
    join nombres n on n.id = b.personal_id
    group by b.id, b.personal_id, n.personal, b.tipo
  ),
  r_solape as (
    select 'bajas_solapadas', a.personal_id, n.personal,
           greatest(a.fecha_inicio, b.fecha_inicio),
           case when least(a.fin, b.fin) = date '2999-01-01' then null else least(a.fin, b.fin) end,
           (least(a.fin, b.fin, p_hasta) - greatest(a.fecha_inicio, b.fecha_inicio, p_desde) + 1)::integer,
           format('%s (baja %s) y %s (baja %s) se solapan', a.tipo, a.id, b.tipo, b.id),
           a.id
    from bajas a
    join bajas b on b.personal_id = a.personal_id and a.id < b.id
                and a.fecha_inicio <= b.fin and b.fecha_inicio <= a.fin
    join nombres n on n.id = a.personal_id
  )
  select * from r_sin_cobertura
  union all select * from r_baja_sin_reg
  union all select * from r_trabajo
  union all select * from r_solape
  order by 1, 3, 4;
$$;

revoke all on function coordinacion.get_bajas_cotejo(date, date, integer, integer) from public;
grant execute on function coordinacion.get_bajas_cotejo(date, date, integer, integer) to authenticated;
