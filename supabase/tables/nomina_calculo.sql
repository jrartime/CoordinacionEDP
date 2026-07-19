-- Modulo de nominas, Fase 5: calculo de una nomina a partir de un periodo de
-- historial laboral. Dos funciones de solo lectura:
--   * calcular_nomina_devengos -> lado de los ingresos, linea a linea.
--   * calcular_nomina          -> lo anterior + bases, deducciones y liquido.
--
-- Unidad de calculo = un periodo de historial_laboral (alta -> baja), decision
-- del usuario. Los contratos INDEFINIDOS (fecha_baja null) no tienen periodo
-- acotado: hay que pasar p_desde/p_hasta (tipicamente un mes).
--
-- SECURITY INVOKER: leen tablas admin-only (personal_confidencial,
-- personal_complementos, convenios_categorias_salarios); por RLS solo un admin
-- obtiene resultados completos, que es lo deseado para nomina.
--
-- CONVENCIONES (a afinar sobre numeros reales):
--   * Salario diario = salario_mensual / 30.
--   * base = salario_mensual_puesto x (coeficiente/1000) x (dias_ventana / 30).
--   * Pagas extra: el NUMERO de pagas sale del CONVENIO (pagas_anuales); las que
--     exceden de 12 son las extras (14 -> 2, 15 -> 3). De personal_confidencial
--     solo se lee si van prorrateadas (prorrateo_pagas).
--   * El prorrateo se emite como UNA linea suma ("Prorrateo pagas extra") mas su
--     desglose en lineas marcadas con detalle_de = 'prorrateo_extra' (salario
--     base + cada complemento con prorratea_en_extra). Las lineas de detalle NO
--     suman al bruto: solo la linea suma. Cada componente se redondea antes de
--     sumar para que el total sea exactamente lo que se muestra desglosado.
--   * Pluses del convenio: se activan con los flags tiene_* del historial y su
--     importe sale del convenio del puesto vigente en la fecha de calculo.
--       - transporte: plus_transporte x dias efectivamente trabajados (registros)
--       - nocturnidad: plus_hora_nocturna x horas_nocturnas (registros)
--       - movilidad:   complemento_movilidad_pct x base
--       - dedicacion:  complemento_dedicacion (mensual) x dias/30
--   * Horas de registros en la ventana:
--       - HCOMP (tipo 2) y MONT (tipo 3): horas x get_puesto_precio_hora.
--       - FTRAB (tipo 4, festivas): PENDIENTE, no hay precio/hora festivo definido.
--   * Complementos de personal_complementos vigentes:
--       - fijo mensual: importe x dias/30
--       - fijo diario:  importe x dias trabajados
--       - fijo por_hora: importe x horas de la medida (hoy solo horas_nocturnas)
--       - porcentaje:   porcentaje x base
--
-- AVISO: los complementos del convenio (movilidad, dedicacion, transporte,
-- nocturnidad) salen de los flags tiene_*, NO de personal_complementos. Si un
-- admin diera de alta uno de esos mismos conceptos tambien en
-- personal_complementos, se contaria dos veces. Es una consideracion de captura
-- de datos, no un caso que se deduplique aqui.

drop function if exists public.calcular_nomina_devengos(bigint, date, date);

create or replace function public.calcular_nomina_devengos(
  p_historial_id bigint,
  p_desde date default null,
  p_hasta date default null
)
returns table (
  orden integer,
  concepto text,
  detalle text,
  base numeric,
  cantidad numeric,
  precio numeric,
  importe numeric,
  detalle_de text
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  h public.historiales_laborales;
  v_fecha_ref date;
  v_desde date;
  v_hasta date;
  v_sal record;
  v_conv public.convenios_categorias_salarios;
  v_coef numeric;
  v_dias integer;
  v_base numeric;
  v_prorrateo boolean;
  v_pagas_anuales integer;
  v_num_extras integer;
  v_dias_trab integer;
  v_horas_noct numeric;
  v_convenio_id integer;
  v_pe_base numeric := 0;
  v_pe_compl numeric := 0;
begin
  select * into h from public.historiales_laborales where id = p_historial_id;
  if h.id is null then
    return;
  end if;

  -- Ventana efectiva: interseccion del periodo del historial con el rango pedido.
  v_desde := greatest(h.fecha_alta, coalesce(p_desde, h.fecha_alta));
  v_hasta := least(
    coalesce(h.fecha_baja, coalesce(p_hasta, current_date)),
    coalesce(p_hasta, coalesce(h.fecha_baja, current_date))
  );
  if v_hasta < v_desde then
    return;
  end if;

  v_fecha_ref := v_desde;
  v_dias := (v_hasta - v_desde) + 1;
  v_coef := coalesce(h.coeficiente_temporalidad_miles, 1000) / 1000.0;

  select * into v_sal from public.get_puesto_salario_efectivo(h.puesto_id, v_fecha_ref);
  v_base := coalesce(v_sal.salario_mensual, 0) * v_coef * v_dias / 30.0;

  select pu.convenio_id into v_convenio_id from public.puestos pu where pu.id = h.puesto_id;
  if v_convenio_id is not null then
    select * into v_conv from public.get_convenio_salario_vigente(v_convenio_id, v_fecha_ref);
  end if;

  select pc.prorrateo_pagas into v_prorrateo
  from public.personal_confidencial pc where pc.personal_id = h.personal_id;

  v_pagas_anuales := coalesce(v_conv.pagas_anuales, 12)::integer;
  v_num_extras := greatest(v_pagas_anuales - 12, 0);

  select count(distinct r.fecha), coalesce(sum(r.horas_nocturnas), 0)::numeric
    into v_dias_trab, v_horas_noct
  from public.registros r
  where r.personal_id = h.personal_id and r.fecha >= v_desde and r.fecha <= v_hasta;

  -- Componentes del prorrateo de pagas extra (base + complementos con el tick).
  if coalesce(v_prorrateo, false) and v_num_extras > 0 then
    v_pe_base := round(v_base * v_num_extras / 12.0, 2);
    select coalesce(sum(round(t.imp * v_num_extras / 12.0, 2)), 0)
      into v_pe_compl
    from (
      select
        case c.tipo
          when 'porcentaje' then v_base * c.porcentaje
          else case c.unidad
            when 'mensual' then c.importe * v_dias / 30.0
            when 'diario' then c.importe * v_dias_trab
            when 'por_hora' then c.importe * (case c.medida_horas when 'horas_nocturnas' then v_horas_noct else 0 end)
            else c.importe
          end
        end as imp
      from public.get_personal_complementos_vigentes(h.personal_id, v_fecha_ref) c
      where c.prorratea_en_extra
    ) t;
  end if;

  -- 1. Salario base
  return query select 10, 'Salario base'::text,
    format('%s€/mes × coef %s × %s/30 días', round(coalesce(v_sal.salario_mensual, 0), 2), round(v_coef, 3), v_dias),
    null::numeric, null::numeric, null::numeric, round(v_base, 2), null::text;

  -- 2. Prorrateo pagas extra: linea suma + desglose (detalle_de).
  if coalesce(v_prorrateo, false) and v_num_extras > 0 and (v_pe_base + v_pe_compl) <> 0 then
    return query select 20, 'Prorrateo pagas extra'::text,
      format('%s pagas/año (12 + %s extra) → %s/12', v_pagas_anuales, v_num_extras, v_num_extras),
      null::numeric, null::numeric, null::numeric, v_pe_base + v_pe_compl, null::text;

    return query select 21, 'Salario base'::text,
      format('%s€ × %s/12', round(v_base, 2), v_num_extras),
      null::numeric, null::numeric, null::numeric, v_pe_base, 'prorrateo_extra'::text;

    return query
    select
      (22 + row_number() over (order by t.orden_calculo, t.nombre))::integer,
      t.nombre,
      format('%s€ × %s/12', round(t.imp, 2), v_num_extras),
      null::numeric, null::numeric, null::numeric,
      round(t.imp * v_num_extras / 12.0, 2),
      'prorrateo_extra'::text
    from (
      select
        c.nombre, c.orden_calculo,
        case c.tipo
          when 'porcentaje' then v_base * c.porcentaje
          else case c.unidad
            when 'mensual' then c.importe * v_dias / 30.0
            when 'diario' then c.importe * v_dias_trab
            when 'por_hora' then c.importe * (case c.medida_horas when 'horas_nocturnas' then v_horas_noct else 0 end)
            else c.importe
          end
        end as imp
      from public.get_personal_complementos_vigentes(h.personal_id, v_fecha_ref) c
      where c.prorratea_en_extra
    ) t
    where t.imp is not null and t.imp <> 0;
  end if;

  -- 3. Plus de transporte
  if coalesce(h.tiene_plus_transporte, false) and coalesce(v_conv.plus_transporte, 0) > 0 then
    return query select 30, 'Plus de transporte'::text,
      format('%s€ × %s días trabajados', v_conv.plus_transporte, v_dias_trab),
      null::numeric, v_dias_trab::numeric, v_conv.plus_transporte,
      round(v_conv.plus_transporte * v_dias_trab, 2), null::text;
  end if;

  -- 4. Plus de nocturnidad
  if coalesce(h.tiene_nocturnidad, false) and coalesce(v_conv.plus_hora_nocturna, 0) > 0 then
    return query select 40, 'Plus de nocturnidad'::text,
      format('%s€ × %s h nocturnas', v_conv.plus_hora_nocturna, round(v_horas_noct, 2)),
      null::numeric, v_horas_noct, v_conv.plus_hora_nocturna,
      round(v_conv.plus_hora_nocturna * v_horas_noct, 2), null::text;
  end if;

  -- 5. Complemento de movilidad (%)
  if coalesce(h.tiene_complemento_movilidad, false) and coalesce(v_conv.complemento_movilidad_pct, 0) > 0 then
    return query select 50, 'Complemento de movilidad'::text,
      format('%s%% sobre base', round(v_conv.complemento_movilidad_pct * 100, 2)),
      round(v_base, 2), null::numeric, v_conv.complemento_movilidad_pct,
      round(v_base * v_conv.complemento_movilidad_pct, 2), null::text;
  end if;

  -- 6. Complemento de dedicacion (fijo mensual del convenio, prorrateado)
  if coalesce(h.tiene_complemento_dedicacion, false) and coalesce(v_conv.complemento_dedicacion, 0) > 0 then
    return query select 60, 'Complemento de dedicación'::text,
      format('%s€/mes × %s/30 días', v_conv.complemento_dedicacion, v_dias),
      null::numeric, null::numeric, null::numeric,
      round(v_conv.complemento_dedicacion * v_dias / 30.0, 2), null::text;
  end if;

  -- 7-8. Horas complementarias (2) y montaje (3) de registros
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
  where r.personal_id = h.personal_id and r.fecha >= v_desde and r.fecha <= v_hasta and th.id in (2, 3)
  group by th.id, th.tipo_hora having sum(r.horas) > 0;

  -- 9. Complementos asignados a la persona
  return query
  select
    (100 + row_number() over (order by c.orden_calculo, c.nombre))::integer,
    c.nombre,
    case c.tipo
      when 'porcentaje' then format('%s%% sobre base', round(c.porcentaje * 100, 2))
      else case c.unidad
        when 'mensual' then format('%s€/mes × %s/30 días', c.importe, v_dias)
        when 'diario' then format('%s€ × %s días trabajados', c.importe, v_dias_trab)
        when 'por_hora' then format('%s€ × horas %s', c.importe, c.medida_horas)
        else format('%s€', c.importe)
      end
    end,
    case when c.tipo = 'porcentaje' then round(v_base, 2) else null::numeric end,
    null::numeric, null::numeric,
    round(
      case c.tipo
        when 'porcentaje' then v_base * c.porcentaje
        else case c.unidad
          when 'mensual' then c.importe * v_dias / 30.0
          when 'diario' then c.importe * v_dias_trab
          when 'por_hora' then c.importe * (case c.medida_horas when 'horas_nocturnas' then v_horas_noct else 0 end)
          else c.importe
        end
      end, 2),
    null::text
  from public.get_personal_complementos_vigentes(h.personal_id, v_fecha_ref) c;

  return;
end;
$$;

revoke all on function public.calcular_nomina_devengos(bigint, date, date) from public;
grant execute on function public.calcular_nomina_devengos(bigint, date, date) to authenticated;


-- ============================================================================
-- Nomina completa = devengos + bases separadas + deducciones -> liquido.
--
-- Bases de cotizacion separadas (modelo espanol):
--   * Base Contingencias Comunes (BCCC) = devengos que cotizan por comunes,
--     EXCLUYENDO horas extra. Sirve para comunes y MEI.
--   * Base Contingencias Profesionales (BCCP) = BCCC + horas extra. Sirve para
--     desempleo y formacion.
--   * Base IRPF = devengos sujetos a IRPF.
--
-- Decisiones del usuario: el plus de transporte COTIZA y TRIBUTA como el resto
-- (no exento); los topes de cotizacion (min/max por grupo) NO se aplican todavia.
-- Con los conceptos actuales todo cotiza y no hay horas extra, asi que las tres
-- bases coinciden con el bruto; la estructura queda montada para cuando aparezcan.
-- ============================================================================

drop function if exists public.calcular_nomina(bigint, date, date);

create or replace function public.calcular_nomina(
  p_historial_id bigint,
  p_desde date default null,
  p_hasta date default null
)
returns table (
  orden integer,
  seccion text,
  concepto text,
  detalle text,
  base numeric,
  tipo numeric,
  importe numeric,
  detalle_de text
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  h record;
  v_irpf numeric;
  v_bruto numeric;
  v_base_cc numeric;
  v_base_cp numeric;
  v_base_irpf numeric;
  v_d_comunes numeric;
  v_d_mei numeric;
  v_d_desempleo numeric;
  v_d_formacion numeric;
  v_d_irpf numeric;
  v_ded_total numeric;
begin
  select cotizacion_comunes_pct, cotizacion_mei_pct, cotizacion_formacion_pct,
         cotizacion_desempleo_pct, personal_id
    into h
  from public.historiales_laborales
  where id = p_historial_id;
  if not found then
    return;
  end if;

  select pc.irpf into v_irpf
  from public.personal_confidencial pc
  where pc.personal_id = h.personal_id;

  -- Las lineas con detalle_de son desglose de otra linea (p.ej. los componentes
  -- del prorrateo de pagas extra): NO suman, o se contarian dos veces.
  select
    coalesce(sum(d.importe) filter (where d.detalle_de is null), 0),
    coalesce(sum(d.importe) filter (where d.detalle_de is null and d.concepto not ilike 'Horas extra%'), 0),
    coalesce(sum(d.importe) filter (where d.detalle_de is null), 0),
    coalesce(sum(d.importe) filter (where d.detalle_de is null), 0)
  into v_bruto, v_base_cc, v_base_cp, v_base_irpf
  from public.calcular_nomina_devengos(p_historial_id, p_desde, p_hasta) d;

  v_d_comunes   := round(v_base_cc  * coalesce(h.cotizacion_comunes_pct, 0), 2);
  v_d_mei       := round(v_base_cc  * coalesce(h.cotizacion_mei_pct, 0), 2);
  v_d_desempleo := round(v_base_cp  * coalesce(h.cotizacion_desempleo_pct, 0), 2);
  v_d_formacion := round(v_base_cp  * coalesce(h.cotizacion_formacion_pct, 0), 2);
  v_d_irpf      := round(v_base_irpf * coalesce(v_irpf, 0), 2);
  v_ded_total   := v_d_comunes + v_d_mei + v_d_desempleo + v_d_formacion + v_d_irpf;

  return query
  select d.orden, 'devengo'::text, d.concepto, d.detalle, null::numeric, null::numeric, d.importe, d.detalle_de
  from public.calcular_nomina_devengos(p_historial_id, p_desde, p_hasta) d;

  return query select 500, 'total'::text, 'Total devengado (bruto)'::text, null::text, null::numeric, null::numeric, round(v_bruto, 2), null::text;

  return query select 600, 'base'::text, 'Base contingencias comunes'::text, null::text, null::numeric, null::numeric, round(v_base_cc, 2), null::text;
  return query select 601, 'base'::text, 'Base contingencias profesionales'::text, null::text, null::numeric, null::numeric, round(v_base_cp, 2), null::text;
  return query select 602, 'base'::text, 'Base IRPF'::text, null::text, null::numeric, null::numeric, round(v_base_irpf, 2), null::text;

  return query select 700, 'deduccion'::text, 'Contingencias comunes'::text,
    format('%s%% sobre %s€', round(coalesce(h.cotizacion_comunes_pct,0)*100, 3), round(v_base_cc,2)),
    round(v_base_cc,2), h.cotizacion_comunes_pct, v_d_comunes, null::text;
  return query select 701, 'deduccion'::text, 'MEI'::text,
    format('%s%% sobre %s€', round(coalesce(h.cotizacion_mei_pct,0)*100, 3), round(v_base_cc,2)),
    round(v_base_cc,2), h.cotizacion_mei_pct, v_d_mei, null::text;
  return query select 702, 'deduccion'::text, 'Desempleo'::text,
    format('%s%% sobre %s€', round(coalesce(h.cotizacion_desempleo_pct,0)*100, 3), round(v_base_cp,2)),
    round(v_base_cp,2), h.cotizacion_desempleo_pct, v_d_desempleo, null::text;
  return query select 703, 'deduccion'::text, 'Formación profesional'::text,
    format('%s%% sobre %s€', round(coalesce(h.cotizacion_formacion_pct,0)*100, 3), round(v_base_cp,2)),
    round(v_base_cp,2), h.cotizacion_formacion_pct, v_d_formacion, null::text;
  return query select 704, 'deduccion'::text, 'IRPF'::text,
    format('%s%% sobre %s€', round(coalesce(v_irpf,0)*100, 3), round(v_base_irpf,2)),
    round(v_base_irpf,2), v_irpf, v_d_irpf, null::text;

  return query select 800, 'total'::text, 'Total deducciones'::text, null::text, null::numeric, null::numeric, v_ded_total, null::text;
  return query select 810, 'total'::text, 'Líquido a percibir'::text, null::text, null::numeric, null::numeric, round(v_bruto - v_ded_total, 2), null::text;

  return;
end;
$$;

revoke all on function public.calcular_nomina(bigint, date, date) from public;
grant execute on function public.calcular_nomina(bigint, date, date) to authenticated;
