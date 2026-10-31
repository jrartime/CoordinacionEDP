-- Horas teoricas descontando los permisos que suspenden el contrato
-- (personal_permisos_tipo.tratamiento_nomina = 'suspendido': maternidad/
-- paternidad, excedencia). Escrito para el esquema coordinacion (Portal Laboral).
--
-- Problema: calcular_nomina_devengos ya descontaba los dias suspendidos del
-- salario base (dias_nomina_con_permisos), pero las horas teoricas con las que
-- se compara la jornada real seguian siendo las del mes entero. En modalidad
-- "Horas totales" (ajuste 'ambos') eso fabricaba un deficit de horas durante el
-- permiso y un precio/hora artificialmente bajo (valor de jornada prorrateado
-- entre horas sin prorratear).
-- Caso de referencia: Eladio Alonso Suarez (personal 1192, historial 5945),
-- paternidad 01/09-12/10/2026, octubre 2026: 135,5 h reales contra 176 teoricas
-- -> "Plus de disponibilidad" de -207,60 EUR. Horas teoricas correctas: las del
-- tramo 13-31/10 (107,87 h).
--
-- horas_teoricas_jornada es proporcional por dias naturales dentro de cada mes,
-- asi que es aditiva: restar las horas teoricas de cada tramo suspendido da
-- exactamente las del resto. Asume (igual que dias_suspendidos_periodo) que los
-- permisos 'suspendido' de una misma persona no se solapan entre si.
--
-- Afecta a nominas calculadas/emitidas a partir de ahora; las ya emitidas
-- quedan congeladas. NO se toca el tope minimo de cotizacion a tiempo parcial
-- (nomina_calculo_persona.sql): tampoco descuenta los dias suspendidos en
-- v_tope_dias y habria que decidirlo junto.

create or replace function coordinacion.horas_teoricas_jornada_con_permisos(
  p_personal_id integer, p_desde date, p_hasta date, p_jornada numeric
)
returns numeric
language sql stable security invoker
set search_path = coordinacion, extensions
as $$
  select coordinacion.horas_teoricas_jornada(p_desde, p_hasta, p_jornada)
    - coalesce((
      select sum(coordinacion.horas_teoricas_jornada(
        greatest(p_desde, pp.fecha_inicio),
        least(p_hasta, coalesce(pp.fecha_fin, p_hasta)),
        p_jornada))
      from coordinacion.personal_permisos pp
      join coordinacion.personal_permisos_tipo ppt on ppt.id = pp.tipo_id
      where pp.personal_id = p_personal_id
        and ppt.tratamiento_nomina = 'suspendido'
        and pp.fecha_inicio <= p_hasta
        and coalesce(pp.fecha_fin, p_hasta) >= p_desde
    ), 0);
$$;

revoke all on function coordinacion.horas_teoricas_jornada_con_permisos(integer, date, date, numeric) from public;
grant execute on function coordinacion.horas_teoricas_jornada_con_permisos(integer, date, date, numeric) to authenticated;

-- Contadores "Horas teoricas" de Gestion y de Registros (los dos usan este RPC).
create or replace function coordinacion.get_gestion_horas_teoricas(
  p_desde date, p_hasta date, p_personal_id integer default null, p_empresa_id integer default null
)
returns numeric
language sql stable
set search_path to 'coordinacion', 'extensions'
as $$
  select coalesce(sum(coordinacion.horas_teoricas_jornada_con_permisos(
      h.personal_id,
      greatest(h.fecha_alta, p_desde),
      least(coalesce(h.fecha_baja, p_hasta), p_hasta),
      h.jornada)), 0)
  from coordinacion.historiales_laborales h
  where h.fecha_alta <= p_hasta
    and (h.fecha_baja is null or h.fecha_baja >= p_desde)
    and (p_personal_id is null or h.personal_id = p_personal_id)
    and (p_empresa_id is null or h.empresa_id = p_empresa_id);
$$;

-- Motor y contexto congelado: se parchean in situ (una unica llamada exacta en
-- cada una) para no reescribir funciones de cientos de lineas. Aborta si el
-- texto esperado no aparece exactamente una vez.
do $$
declare
  v_fn text;
  v_old constant text := 'coordinacion.horas_teoricas_jornada(v_desde, v_hasta, h.jornada)';
  v_new constant text := 'coordinacion.horas_teoricas_jornada_con_permisos(h.personal_id, v_desde, v_hasta, h.jornada)';
  v_oid oid;
begin
  for v_oid in
    select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'coordinacion'
      and p.proname in ('calcular_nomina_devengos', 'get_nomina_contexto_historial')
  loop
    v_fn := pg_get_functiondef(v_oid);
    if (length(v_fn) - length(replace(v_fn, v_old, ''))) / length(v_old) <> 1 then
      raise exception 'Patron no encontrado exactamente una vez en %', v_oid::regprocedure;
    end if;
    execute replace(v_fn, v_old, v_new);
  end loop;
end $$;
