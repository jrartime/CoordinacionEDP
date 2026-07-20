-- Modulo de nominas, Fase 5: calculo a partir de los historiales laborales.
--
--   * calcular_nomina_devengos(historial_id, desde, hasta)
--       Devengos DEL PUESTO de ese historial: salario base, sus pluses de
--       convenio (nocturnidad/movilidad/dedicacion) y sus horas. Nada de lo que
--       es de la persona.
--   * calcular_nomina_persona(personal_id, desde, hasta)
--       La nomina REAL: suma los devengos de todos los puestos del periodo y
--       anade UNA SOLA VEZ lo que es de la persona (desplazamiento por dia
--       trabajado, complementos asignados, prorrateo de pagas extra), mas bases,
--       deducciones y liquido.
--
-- POR QUE ESTA PARTIDO ASI: una persona puede tener varios historiales
-- solapados con puestos distintos. Si cada nomina de puesto incluyera lo de la
-- persona, los complementos, el prorrateo y el desplazamiento se contarian una
-- vez por puesto. Y las horas se filtran por puesto_id, o cada puesto se
-- llevaria tambien las horas del otro.
--
-- SECURITY INVOKER: leen tablas admin-only (personal_confidencial,
-- personal_complementos, convenios_categorias_salarios); por RLS solo un admin
-- obtiene resultados completos, que es lo deseado para nomina.
--
-- CONVENCIONES:
--   * Salario diario = salario_mensual / 30.
--   * base = salario_mensual_puesto x (coeficiente/1000) x (dias_ventana / 30).
--   * Ventana = interseccion del periodo del historial con [desde, hasta]. Los
--     contratos indefinidos (fecha_baja null) exigen pasar el rango.
--   * DIAS EFECTIVAMENTE TRABAJADOS: dias distintos con registros de situacion
--     NORM o SUST, mas FEST solo si la hora es FTRAB. Fuera vacaciones, IT,
--     permisos, asuntos propios, jornada irregular. A nivel persona un dia
--     cuenta una sola vez aunque ese dia trabaje en dos puestos.
--   * Pagas extra: el NUMERO sale del convenio (pagas_anuales); las que exceden
--     de 12 son las extras. De personal_confidencial solo se lee si van
--     prorrateadas. Se emite UNA linea suma mas su desglose en filas con
--     detalle_de = 'prorrateo_extra' (base + cada complemento con el tick
--     prorratea_en_extra). Las filas con detalle_de NO suman al bruto.
--   * Tarifa de desplazamiento: la mayor entre los historiales del periodo que
--     tengan el plus. No la del historial predominante: su convenio puede no
--     tener tarifa aunque otro puesto de la persona si la tenga.
--   * Horas: HCOMP (2) y MONT (3) x get_puesto_precio_hora.
--   * FTRAB (4): se paga como "Plus festivo trabajado" (codigo de nomina 12) a
--     precio de hora de JORNADA COMPLETA (get_convenio_precio_hora_jc), no a
--     precio de hora complementaria. CUIDADO: registros.horas de las filas FTRAB
--     YA trae aplicado el x1,75 -- verificado contra el horario real de cada
--     registro, el cociente horas/(hora_fin-hora_inicio) es exactamente 1,75 en
--     175 de 187 filas de 2024-2026. Por eso NO se aplica aqui el multiplicador
--     de tipo_horas: seria cobrar el recargo dos veces.
--
-- LIMITACIONES CONOCIDAS:
--   * Los tipos de cotizacion y el convenio del total se toman del historial
--     predominante (el de mas dias en el rango). Con dos contratos de convenios
--     distintos, en la realidad habria dos cotizaciones separadas.
--   * Topes de cotizacion (min/max por grupo) no aplicados todavia.
--   * Registros cuyo puesto no tenga historial en el rango quedan fuera.
--
-- NOTA: las definiciones vigentes estan desplegadas en Supabase; este fichero se
-- regenera desde ellas con scripts/dump_nomina_funcs.py si vuelven a divergir.

drop function if exists public.calcular_nomina(bigint, date, date);
drop function if exists public.calcular_nomina_devengos(bigint, date, date);

-- Precio de la hora a jornada completa segun convenio.
--
-- Convencion confirmada por el usuario (2026-07-20): salario ANUAL a jornada
-- completa entre las horas anuales a jornada completa. Las horas del ano se
-- cuentan tomando TODOS los dias de lunes a viernes (52 semanas x 5 + 1 = 261),
-- festivos y vacaciones incluidos, por la jornada diaria (jornada_maxima / 5).
-- Da 2088 h para 40 h semanales y 2009,7 h para 38,5 h, que son los divisores
-- que usa el programa de nominas.
--
-- Es un precio CONSTANTE todo el ano: no depende de los dias laborables que
-- tenga cada mes. Se descarto la variante mensual (salario_mensual entre dias
-- L-V del mes x jornada diaria), que daba ~13% menos y un precio distinto cada
-- mes.
--
-- salario_anual esta vacio en la mayoria de categorias, asi que se deriva de
-- salario_mensual x pagas_anuales cuando falta (comprobado que cuadra donde
-- estan los dos: 1221 x 14 = 17094).
create or replace function public.get_convenio_precio_hora_jc(
  p_convenio_categoria_id integer,
  p_jornada_maxima numeric,
  p_fecha date default current_date
)
returns numeric
language sql stable security invoker set search_path = public
as $$
  select case
    when coalesce(p_jornada_maxima, 0) <= 0 then null
    else coalesce(cs.salario_anual, cs.salario_mensual * cs.pagas_anuales)
         / (261 * p_jornada_maxima / 5.0)
  end
  from public.get_convenio_salario_vigente(p_convenio_categoria_id, p_fecha) cs;
$$;

revoke all on function public.get_convenio_precio_hora_jc(integer, numeric, date) from public;
grant execute on function public.get_convenio_precio_hora_jc(integer, numeric, date) to authenticated;

create or replace function public.calcular_nomina_devengos(
  p_historial_id bigint,
  p_desde date default null,
  p_hasta date default null
)
returns table (
  orden integer, concepto text, detalle text,
  base numeric, cantidad numeric, precio numeric, importe numeric, detalle_de text
)
language plpgsql stable security invoker set search_path = public
as $$
declare
  h public.historiales_laborales;
  v_fecha_ref date; v_desde date; v_hasta date;
  v_sal record; v_conv public.convenios_categorias_salarios;
  v_coef numeric; v_dias integer; v_base numeric;
  v_dias_trab integer; v_horas_noct numeric; v_convenio_id integer;
  v_precio_hora_jc numeric;
begin
  select * into h from public.historiales_laborales where id = p_historial_id;
  if h.id is null then return; end if;

  v_desde := greatest(h.fecha_alta, coalesce(p_desde, h.fecha_alta));
  v_hasta := least(
    coalesce(h.fecha_baja, coalesce(p_hasta, current_date)),
    coalesce(p_hasta, coalesce(h.fecha_baja, current_date))
  );
  if v_hasta < v_desde then return; end if;

  v_fecha_ref := v_desde;
  v_dias := (v_hasta - v_desde) + 1;
  v_coef := coalesce(h.coeficiente_temporalidad_miles, 1000) / 1000.0;

  select * into v_sal from public.get_puesto_salario_efectivo(h.puesto_id, v_fecha_ref);
  v_base := coalesce(v_sal.salario_mensual, 0) * v_coef * v_dias / 30.0;

  select pu.convenio_id into v_convenio_id from public.puestos pu where pu.id = h.puesto_id;
  if v_convenio_id is not null then
    select * into v_conv from public.get_convenio_salario_vigente(v_convenio_id, v_fecha_ref);
  end if;

  -- Dias y horas SOLO del puesto de este historial (si no, dos historiales
  -- solapados con puestos distintos se llevarian cada uno las horas del otro).
  select count(distinct r.fecha)
    into v_dias_trab
  from public.registros r
  join public.situaciones s on s.id = r.situacion_id
  left join public.tipo_horas th on th.id = r.tipo_hora_id
  where r.personal_id = h.personal_id
    and r.puesto_id = h.puesto_id
    and r.fecha >= v_desde and r.fecha <= v_hasta
    and (s.situacion in ('NORM','SUST') or (s.situacion='FEST' and th.tipo_hora='FTRAB'));

  select coalesce(sum(r.horas_nocturnas), 0)::numeric
    into v_horas_noct
  from public.registros r
  where r.personal_id = h.personal_id
    and r.puesto_id = h.puesto_id
    and r.fecha >= v_desde and r.fecha <= v_hasta;

  return query select 10, 'Salario base'::text,
    format('%s€/mes × coef %s × %s/30 días', round(coalesce(v_sal.salario_mensual, 0), 2), round(v_coef, 3), v_dias),
    null::numeric, null::numeric, null::numeric, round(v_base, 2), null::text;

  if coalesce(h.tiene_nocturnidad, false) and coalesce(v_conv.plus_hora_nocturna, 0) > 0 then
    return query select 40, 'Plus de nocturnidad'::text,
      format('%s€ × %s h nocturnas', v_conv.plus_hora_nocturna, round(v_horas_noct, 2)),
      null::numeric, v_horas_noct, v_conv.plus_hora_nocturna,
      round(v_conv.plus_hora_nocturna * v_horas_noct, 2), null::text;
  end if;

  if coalesce(h.tiene_complemento_movilidad, false) and coalesce(v_conv.complemento_movilidad_pct, 0) > 0 then
    return query select 50, 'Complemento de movilidad'::text,
      format('%s%% sobre base', round(v_conv.complemento_movilidad_pct * 100, 2)),
      round(v_base, 2), null::numeric, v_conv.complemento_movilidad_pct,
      round(v_base * v_conv.complemento_movilidad_pct, 2), null::text;
  end if;

  if coalesce(h.tiene_complemento_dedicacion, false) and coalesce(v_conv.complemento_dedicacion, 0) > 0 then
    return query select 60, 'Complemento de dedicación'::text,
      format('%s€/mes × %s/30 días', v_conv.complemento_dedicacion, v_dias),
      null::numeric, null::numeric, null::numeric,
      round(v_conv.complemento_dedicacion * v_dias / 30.0, 2), null::text;
  end if;

  return query
  select
    (70 + row_number() over (order by th.id))::integer,
    ('Horas ' || th.tipo_hora)::text,
    format('%s h × %s€/h', round(sum(r.horas)::numeric, 2), round(public.get_puesto_precio_hora(h.puesto_id, th.id, v_fecha_ref), 4)),
    null::numeric,
    round(sum(r.horas)::numeric, 2),
    round(public.get_puesto_precio_hora(h.puesto_id, th.id, v_fecha_ref), 4),
    round(sum(r.horas)::numeric * public.get_puesto_precio_hora(h.puesto_id, th.id, v_fecha_ref), 2),
    null::text
  from public.registros r
  join public.tipo_horas th on th.id = r.tipo_hora_id
  where r.personal_id = h.personal_id
    and r.puesto_id = h.puesto_id
    and r.fecha >= v_desde and r.fecha <= v_hasta and th.id in (2, 3)
  group by th.id, th.tipo_hora having sum(r.horas) > 0;

  -- Festivo trabajado (codigo de nomina 12). registros.horas de las filas FTRAB
  -- YA trae aplicado el x1,75, asi que aqui NO se aplica el multiplicador de
  -- tipo_horas: seria cobrar el recargo dos veces.
  v_precio_hora_jc := public.get_convenio_precio_hora_jc(
    v_convenio_id, h.jornada_maxima, v_fecha_ref
  );

  if coalesce(v_precio_hora_jc, 0) > 0 then
    return query
    select 80,
      'Plus festivo trabajado'::text,
      format('%s h festivas (×1,75 incluido) × %s€/h a jornada completa',
             round(sum(r.horas)::numeric, 2), round(v_precio_hora_jc, 4)),
      null::numeric,
      round(sum(r.horas)::numeric, 2),
      round(v_precio_hora_jc, 4),
      round(sum(r.horas)::numeric * v_precio_hora_jc, 2),
      null::text
    from public.registros r
    where r.personal_id = h.personal_id
      and r.puesto_id = h.puesto_id
      and r.fecha >= v_desde and r.fecha <= v_hasta
      and r.tipo_hora_id = 4
    having sum(r.horas) > 0;
  end if;

  return;
end;
$$;

revoke all on function public.calcular_nomina_devengos(bigint, date, date) from public;
grant execute on function public.calcular_nomina_devengos(bigint, date, date) to authenticated;
