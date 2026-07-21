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
--   * base = salario_mensual_puesto x (coeficiente/1000) x (dias_nomina / 30).
--   * DIAS DE NOMINA (dias_nomina): un mes natural COMPLETO cuenta 30 dias
--     aunque tenga 28 o 31; los tramos parciales cuentan sus dias reales.
--     Confirmado contra la nomina real de Javier Cortavitarte de mayo de 2026
--     (31 dias naturales, pagados como "30,00 x 40,700 = 1.221,00"). Antes se
--     usaba (fecha_hasta - fecha_desde + 1) y los meses de 31 dias cobraban
--     31/30 de la mensualidad.
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
--   * EMPRESA: los registros de un historial son los de SU empresa. Sin ese
--     filtro, una persona con el mismo puesto en EDP y en INTECA (caso real:
--     Javier Cortavitarte, puesto 2 en las dos) se llevaba en cada historial las
--     horas de la otra. Es la misma fuga que ya se corrigio con puesto_id.
--     calcular_nomina_persona acepta ademas p_empresa_id para emitir la nomina
--     de UNA empresa: sin el, el pluriempleo sale fundido en un solo calculo que
--     no corresponde a ninguna nomina real.
--   * BASE DE CALCULO: convenios_categorias_salarios.base_calculo dice si la
--     base sale del salario mensual (mensual/30 x dias_nomina), del diario
--     (salario_diario x dias_nomina) o de la hora (salario_hora x horas REG
--     realmente trabajadas). p_base_calculo lo sobrescribe puntualmente desde la
--     pestana Gestion, para comparar sin tocar las tarifas.
--     EL COEFICIENTE DE TEMPORALIDAD SOLO SE APLICA EN MENSUAL Y DIARIO: esas
--     tarifas son a jornada completa y hay que reducirlas por la jornada de la
--     persona. En el modo hora se multiplica por horas reales, que ya llevan la
--     parcialidad dentro; aplicar el coeficiente la descontaria dos veces.
--     Si falta la tarifa del modo pedido se cae a mensual y se dice en el
--     detalle, en vez de devolver 0 en silencio.
--   * COMPLEMENTO DE PUESTO (codigo 60, orden 65): exceso de horas REG sobre la
--     jornada teorica del periodo (horas_teoricas_jornada). p_ajuste_jornada
--     decide: 'exceso' (por defecto) solo paga lo trabajado de mas, 'ambos'
--     ademas descuenta el defecto, 'ninguno' no emite la linea. La pestana
--     Gestion lo expone como filtro "Ajuste de jornada".
--   * DESCUENTO POR ABSENTISMO (codigo 790, orden 90): horas PNR (tipo 5) a
--     hora_complementaria del convenio, en negativo.
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

-- Dias a efectos de nomina: un mes natural COMPLETO cuenta 30 dias aunque tenga
-- 28 o 31; los tramos parciales cuentan sus dias reales. Ver la nota de
-- cabecera: sale de la nomina real de mayo de 2026.
create or replace function public.dias_nomina(p_desde date, p_hasta date)
returns integer
language sql
immutable
set search_path = public
as $$
  select coalesce(sum(
    case
      -- El tramo cubre el mes natural entero: 30 por convencion.
      when greatest(p_desde, m.ini) = m.ini and least(p_hasta, m.fin) = m.fin then 30
      else (least(p_hasta, m.fin) - greatest(p_desde, m.ini) + 1)
    end
  )::integer, 0)
  from (
    select d::date as ini,
           (d + interval '1 month' - interval '1 day')::date as fin
    from generate_series(
      date_trunc('month', p_desde::timestamp),
      date_trunc('month', p_hasta::timestamp),
      interval '1 month'
    ) d
  ) m
  where p_desde <= m.fin and p_hasta >= m.ini;
$$;

revoke all on function public.dias_nomina(date, date) from public;
grant execute on function public.dias_nomina(date, date) to authenticated;

-- Horas que "tocaba" trabajar en el periodo segun la jornada semanal del
-- contrato. Por cada mes natural que toque el periodo:
--   dias de lunes a viernes del mes x (jornada / 5) x proporcion de dias
--   naturales del mes que cubre el periodo.
-- Julio 2026 tiene 23 dias L-V: a jornada completa de 40 h son 23 x 8 = 184 h;
-- a 20 h/semana, 92 h; y 5 dias naturales de julio a JC son 184 x 5/31 =
-- 29,6774 h. Reproduce la hoja "horas mes.xlsx" del usuario (40 celdas).
create or replace function public.horas_teoricas_jornada(
  p_desde date, p_hasta date, p_jornada numeric
)
returns numeric
language sql
immutable
set search_path = public
as $$
  select coalesce(sum(
    (
      select count(*)
      from generate_series(m.ini, m.fin, interval '1 day') d
      where extract(isodow from d) < 6
    )::numeric
    * (coalesce(p_jornada, 0) / 5.0)
    * ((least(p_hasta, m.fin) - greatest(p_desde, m.ini) + 1)::numeric
       / (m.fin - m.ini + 1)::numeric)
  ), 0)
  from (
    select d::date as ini,
           (d + interval '1 month' - interval '1 day')::date as fin
    from generate_series(
      date_trunc('month', p_desde::timestamp),
      date_trunc('month', p_hasta::timestamp),
      interval '1 month'
    ) d
  ) m
  where p_desde <= m.fin and p_hasta >= m.ini;
$$;

revoke all on function public.horas_teoricas_jornada(date, date, numeric) from public;
grant execute on function public.horas_teoricas_jornada(date, date, numeric) to authenticated;

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
-- DISCREPANCIA CONOCIDA CON EL PROGRAMA DE NOMINAS (2026-07-21): la nomina real
-- de Javier Cortavitarte de mayo de 2026 paga el concepto 12 "Plus festivos y
-- domingos" a 239,12 = 24,5 h x 9,76, y 9,76 es la hora_complementaria del
-- convenio, no este precio de jornada completa (8,1868 para 40 h). Es decir, el
-- programa de nominas usa la hora complementaria.
--
-- DECISION DEL USUARIO: la formula anual es la correcta y lo que esta mal es el
-- programa de nominas. NO cambiar a hora_complementaria. Si en el futuro se
-- revisa, el cambio seria usar cs.hora_complementaria en la linea del plus de
-- festivo de calcular_nomina_devengos.
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
  p_hasta date default null,
  p_base_calculo text default null,
  p_ajuste_jornada text default 'exceso'
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
  v_modo text; v_horas_reg numeric; v_tarifa_dia numeric; v_detalle_base text;
  v_horas_teoricas numeric; v_dif_jornada numeric; v_precio_jornada numeric;
  v_extras integer; v_ajuste text; v_horas_pnr numeric;
  v_camb_id integer;
begin
  select * into h from public.historiales_laborales where id = p_historial_id;
  if h.id is null then return; end if;

  -- Situacion CAMB ("Cambio de actividad"): el turno le tocaba a esta persona
  -- pero lo cubrio OTRA, asi que NO ha trabajado esas horas y no cuentan en
  -- ninguna medida. Caso real (Katherine Fernandez, 04/06/2026): NORM 15:30-22:30
  -- en la Piscina de la Corredoria y CAMB 16:00-23:30 en Fozaneldi, horarios
  -- solapados. Aparece con REG, HCOMP y PNR, de ahi que el filtro se repita.
  select s.id into v_camb_id from public.situaciones s where s.situacion = 'CAMB';

  v_desde := greatest(h.fecha_alta, coalesce(p_desde, h.fecha_alta));
  v_hasta := least(
    coalesce(h.fecha_baja, coalesce(p_hasta, current_date)),
    coalesce(p_hasta, coalesce(h.fecha_baja, current_date))
  );
  if v_hasta < v_desde then return; end if;

  v_fecha_ref := v_desde;
  v_dias := public.dias_nomina(v_desde, v_hasta);
  v_coef := coalesce(h.coeficiente_temporalidad_miles, 1000) / 1000.0;
  v_ajuste := coalesce(nullif(trim(p_ajuste_jornada), ''), 'exceso');

  select * into v_sal from public.get_puesto_salario_efectivo(h.puesto_id, v_fecha_ref);

  select pu.convenio_id into v_convenio_id from public.puestos pu where pu.id = h.puesto_id;
  if v_convenio_id is not null then
    select * into v_conv from public.get_convenio_salario_vigente(v_convenio_id, v_fecha_ref);
  end if;

  v_extras := greatest(coalesce(v_conv.pagas_anuales, 12)::integer - 12, 0);

  -- Dias y horas SOLO del puesto de este historial (si no, dos historiales
  -- solapados con puestos distintos se llevarian cada uno las horas del otro).
  select count(distinct r.fecha)
    into v_dias_trab
  from public.registros r
  join public.situaciones s on s.id = r.situacion_id
  left join public.tipo_horas th on th.id = r.tipo_hora_id
  where r.personal_id = h.personal_id
    and r.puesto_id = h.puesto_id
    and (h.empresa_id is null or r.empresa_id = h.empresa_id)
    and r.fecha >= v_desde and r.fecha <= v_hasta
    and (s.situacion in ('NORM','SUST') or (s.situacion='FEST' and th.tipo_hora='FTRAB'));

  select coalesce(sum(r.horas_nocturnas), 0)::numeric
    into v_horas_noct
  from public.registros r
  where r.personal_id = h.personal_id
    and r.puesto_id = h.puesto_id
    and (h.empresa_id is null or r.empresa_id = h.empresa_id)
    and r.situacion_id is distinct from v_camb_id
    and r.fecha >= v_desde and r.fecha <= v_hasta;

  -- Horas ordinarias (REG) del puesto y empresa: la cantidad del modo hora.
  select coalesce(sum(r.horas), 0)::numeric
    into v_horas_reg
  from public.registros r
  where r.personal_id = h.personal_id
    and r.puesto_id = h.puesto_id
    and (h.empresa_id is null or r.empresa_id = h.empresa_id)
    and r.situacion_id is distinct from v_camb_id
    and r.fecha >= v_desde and r.fecha <= v_hasta
    and r.tipo_hora_id = 1;

  select coalesce(sum(r.horas), 0)::numeric
    into v_horas_pnr
  from public.registros r
  where r.personal_id = h.personal_id
    and r.puesto_id = h.puesto_id
    and (h.empresa_id is null or r.empresa_id = h.empresa_id)
    and r.situacion_id is distinct from v_camb_id
    and r.fecha >= v_desde and r.fecha <= v_hasta
    and r.tipo_hora_id = 5;

  v_modo := coalesce(nullif(trim(p_base_calculo), ''), v_conv.base_calculo, 'mensual');

  if v_modo = 'hora' and coalesce(v_conv.salario_hora, 0) > 0 then
    -- Sin coeficiente: las horas reales ya llevan la parcialidad dentro.
    v_base := v_conv.salario_hora * v_horas_reg;
    v_detalle_base := format('%s h REG × %s€/h', round(v_horas_reg, 2), v_conv.salario_hora);
  elsif v_modo = 'diario' and coalesce(coalesce(v_conv.salario_diario, v_sal.salario_mensual / 30.0), 0) > 0 then
    v_tarifa_dia := coalesce(v_conv.salario_diario, v_sal.salario_mensual / 30.0);
    v_base := v_tarifa_dia * v_coef * v_dias;
    v_detalle_base := format('%s€/día × coef %s × %s días%s',
      round(v_tarifa_dia, 4), round(v_coef, 3), v_dias,
      case when v_conv.salario_diario is null then ' (día = mensual/30)' else '' end);
  else
    v_base := coalesce(v_sal.salario_mensual, 0) * v_coef * v_dias / 30.0;
    v_detalle_base := format('%s€/mes × coef %s × %s/30 días%s',
      round(coalesce(v_sal.salario_mensual, 0), 2), round(v_coef, 3), v_dias,
      case when v_modo <> 'mensual' then format(' · sin tarifa %s, se usa mensual', v_modo) else '' end);
  end if;

  return query select 10, 'Salario base'::text, v_detalle_base,
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

  -- Complemento de puesto (60): exceso de horas REG sobre la jornada teorica.
  -- Se valora al precio hora del propio contrato INCLUYENDO la parte de pagas
  -- extra, y esa parte va siempre, tenga o no prorrateo (decision del usuario).
  --   (base + base x extras/12) / horas_teoricas
  -- Ejemplo: 1221 EUR/mes, 14 pagas, 184 h teoricas de julio -> 7,7418 EUR/h;
  -- 188 h trabajadas = 4 de exceso = 30,97 EUR.
  v_horas_teoricas := public.horas_teoricas_jornada(v_desde, v_hasta, h.jornada);
  if v_ajuste <> 'ninguno' and v_horas_teoricas > 0 then
    v_dif_jornada := v_horas_reg - v_horas_teoricas;
    v_precio_jornada := (v_base * (1 + v_extras / 12.0)) / v_horas_teoricas;
    if v_dif_jornada > 0 or (v_ajuste = 'ambos' and v_dif_jornada <> 0) then
      return query select 65, 'Complemento de puesto'::text,
        format('%s h REG − %s h teóricas = %s h × %s€/h (base + %s/12 pagas)',
               round(v_horas_reg, 2), round(v_horas_teoricas, 2),
               round(v_dif_jornada, 2), round(v_precio_jornada, 4), v_extras),
        null::numeric, round(v_dif_jornada, 2), round(v_precio_jornada, 4),
        round(v_dif_jornada * v_precio_jornada, 2), null::text;
    end if;
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
    and (h.empresa_id is null or r.empresa_id = h.empresa_id)
    and r.situacion_id is distinct from v_camb_id
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
      and (h.empresa_id is null or r.empresa_id = h.empresa_id)
      and r.situacion_id is distinct from v_camb_id
      and r.fecha >= v_desde and r.fecha <= v_hasta
      and r.tipo_hora_id = 4
    having sum(r.horas) > 0;
  end if;

  -- Descuento por absentismo (790): horas PNR (permiso no retribuido, tipo 5)
  -- valoradas a hora_complementaria del convenio, en NEGATIVO.
  if v_horas_pnr > 0 and coalesce(v_conv.hora_complementaria, 0) > 0 then
    return query select 90, 'Descuento por absentismo'::text,
      format('%s h PNR × %s€/h', round(v_horas_pnr, 2), v_conv.hora_complementaria),
      null::numeric, round(v_horas_pnr, 2), v_conv.hora_complementaria,
      round(-1 * v_horas_pnr * v_conv.hora_complementaria, 2), null::text;
  end if;

  return;
end;
$$;

drop function if exists public.calcular_nomina_devengos(bigint, date, date);
drop function if exists public.calcular_nomina_devengos(bigint, date, date, text);

revoke all on function public.calcular_nomina_devengos(bigint, date, date, text, text) from public;
grant execute on function public.calcular_nomina_devengos(bigint, date, date, text, text) to authenticated;
