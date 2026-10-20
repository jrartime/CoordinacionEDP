-- Pestaña Formación · botón DEA: personal con el DEA caducado, a punto de caducar o sin él.
--
-- Una fila por persona. SECURITY INVOKER, como get_personal_estadisticas: respeta el RLS de
-- personal, historiales_laborales, registros y formacion_personal, así que cada usuario ve solo
-- lo que ya ve en las demás pestañas.
--
-- QUIÉN ENTRA: personal que pertenece a la empresa = persona = true y vinculacion_id en
-- (1 Activo, 2 No activo), el mismo criterio que el filtro «Pertenece» de Personal.
--
-- POR QUÉ ENTRA (`motivo`):
--   · 'historial'  su historial laboral tiene (o tuvo) un puesto con puestos.dea = true y su DEA
--                  está caducado, caduca en p_meses_aviso meses o no consta ninguno.
--   · 'puntual'    su historial NO tiene puesto DEA, pero en los últimos p_registros_dias días
--                  (hasta hoy) figura en registros activos con un puesto DEA, y su DEA está
--                  caducado, por caducar o no consta. Con el DEA en vigor no sale.
--
-- QUÉ ES TENER DEA: una fila de formacion_personal con la titulación 'DEA', con fecha y que no
-- esté Planificada ni No superada (mismo criterio que la columna Renovación de la pestaña).
-- Caducidad = última fecha + formacion_titulaciones.renovacion_anios. No se exige tiene_titulo.
--
-- ESTADO (`estado_dea`): 'caducado', 'por_caducar' o 'sin_dea'.
create or replace function coordinacion.get_formacion_dea(
  p_meses_aviso integer default 6,
  p_registros_dias integer default 365
)
returns table (
  personal_id integer,
  personal text,
  dni text,
  vinculacion_id integer,
  motivo text,
  estado_dea text,
  ultima_fecha date,
  caducidad date,
  dias integer,
  puestos jsonb,
  registros jsonb
)
language sql
stable
security invoker
set search_path = coordinacion, extensions
as $$
  with params as (
    select current_date as hoy,
           (current_date + make_interval(months => greatest(coalesce(p_meses_aviso, 6), 0)))::date as limite,
           (current_date - greatest(coalesce(p_registros_dias, 365), 1))::date as desde
  ),
  titulacion as (
    select id, renovacion_anios from formacion_titulaciones where titulacion = 'DEA' limit 1
  ),
  dea as (
    select fp.personal_id,
           max(fp.fecha) as ultima_fecha,
           (max(fp.fecha) + make_interval(years => t.renovacion_anios))::date as caducidad
      from formacion_personal fp
      join titulacion t on t.id = fp.titulacion
     where fp.fecha is not null
       and coalesce(fp.estado, 'Realizado') not in ('Planificado', 'No superado')
     group by fp.personal_id, t.renovacion_anios
  ),
  puestos_historial as (
    select h.personal_id, q.id as puesto_id, q.puesto,
           bool_or(h.fecha_baja is null or h.fecha_baja >= (select hoy from params)) as vigente,
           max(coalesce(h.fecha_baja, (select hoy from params))) as hasta
      from historiales_laborales h
      join puestos q on q.id = h.puesto_id and q.dea
     group by h.personal_id, q.id, q.puesto
  ),
  puestos_registros as (
    select r.personal_id, q.id as puesto_id, q.puesto,
           count(*) as n, max(r.fecha) as ultimo
      from registros r
      join puestos q on q.id = r.puesto_id and q.dea
      join params on r.fecha between params.desde and params.hoy
     where r.activo is true
     group by r.personal_id, q.id, q.puesto
  ),
  candidatos as (
    select pe.id, pe.personal, pe.dni, pe.vinculacion_id,
           d.ultima_fecha, d.caducidad,
           case
             when d.caducidad is null then 'sin_dea'
             when d.caducidad < (select hoy from params) then 'caducado'
             when d.caducidad <= (select limite from params) then 'por_caducar'
           end as estado_dea,
           case
             when exists (select 1 from puestos_historial ph where ph.personal_id = pe.id) then 'historial'
             when exists (select 1 from puestos_registros pr where pr.personal_id = pe.id) then 'puntual'
           end as motivo
      from personal pe
      left join dea d on d.personal_id = pe.id
     where pe.persona is true
       and pe.vinculacion_id in (1, 2)
  )
  select c.id, c.personal, c.dni, c.vinculacion_id, c.motivo, c.estado_dea,
         c.ultima_fecha, c.caducidad,
         case when c.caducidad is null then null else c.caducidad - (select hoy from params) end,
         coalesce((select jsonb_agg(jsonb_build_object('id', ph.puesto_id, 'puesto', ph.puesto,
                                                       'vigente', ph.vigente, 'hasta', ph.hasta)
                                    order by ph.vigente desc, ph.puesto)
                     from puestos_historial ph where ph.personal_id = c.id), '[]'::jsonb),
         coalesce((select jsonb_agg(jsonb_build_object('id', pr.puesto_id, 'puesto', pr.puesto,
                                                       'registros', pr.n, 'ultimo', pr.ultimo)
                                    order by pr.n desc)
                     from puestos_registros pr where pr.personal_id = c.id), '[]'::jsonb)
    from candidatos c
   where c.estado_dea is not null and c.motivo is not null
   order by c.caducidad nulls last, c.personal;
$$;

revoke all on function coordinacion.get_formacion_dea(integer, integer) from public, anon;
grant execute on function coordinacion.get_formacion_dea(integer, integer) to authenticated, service_role;

notify pgrst, 'reload schema';
