-- Nomina completa de la PERSONA (complemento de nomina_calculo.sql).
--
-- Suma los devengos de todos los puestos que la persona tenga en el periodo
-- (cada uno ya viene filtrado por su puesto desde calcular_nomina_devengos) y
-- anade UNA SOLA VEZ lo que es de la persona:
--   * Desplazamiento: 1 por dia efectivamente trabajado. Si trabaja en dos
--     puestos el mismo dia, ese dia cuenta una vez (decision del usuario: el
--     desplazamiento no se reparte por puesto, va solo en este total).
--   * Complementos asignados a la persona (personal_complementos).
--   * Prorrateo de pagas extra (linea suma + desglose con detalle_de).
-- Y cierra con bases de cotizacion, deducciones y liquido.
--
-- La tarifa de desplazamiento se toma como la MAYOR entre los historiales del
-- periodo que tengan el plus: la del historial predominante puede ser nula
-- aunque otro puesto de la persona si tenga tarifa (caso real: Monitorado con
-- convenio de instalaciones + Conc. Monitorado con convenio de ocio educativo,
-- que no lleva plus_transporte).
--
-- Los tipos de cotizacion y el numero de pagas salen del historial predominante
-- (el de mas dias en el rango). Con dos contratos de convenios distintos, en la
-- realidad habria dos cotizaciones separadas: limitacion conocida.
--
-- p_empresa_id acota la nomina a una empresa del grupo (EDP / INTECA). Sin el,
-- una persona con contrato simultaneo en las dos obtiene UNA nomina con los
-- devengos fundidos, que no corresponde a ninguna nomina real. La pestana
-- Gestion arranca filtrada por EDP justo por esto.
--
-- LIMITACION que el parametro NO resuelve: los complementos de
-- personal_complementos son de la PERSONA, no de la empresa, asi que se imputan
-- enteros a la nomina de cualquier empresa que se pida. Por eso, con pluriempleo,
-- la suma de las dos nominas por empresa es MAYOR que el calculo sin filtro:
-- complementos y desplazamiento se cuentan en ambas. Repartirlos exige decidir
-- que parte va a cada empresa.

drop function if exists public.calcular_nomina_persona(integer, date, date);
drop function if exists public.calcular_nomina_persona(integer, date, date, integer);
drop function if exists public.calcular_nomina_persona(integer, date, date, integer, text);

create or replace function public.calcular_nomina_persona(
  p_personal_id integer, p_desde date, p_hasta date,
  p_empresa_id integer default null,
  -- Sobrescribe el base_calculo de la tarifa de convenio para TODOS los puestos
  -- del calculo. Vacio = cada convenio manda con el suyo.
  p_base_calculo text default null,
  -- Que hacer con la diferencia entre horas REG y jornada teorica:
  -- 'exceso' (por defecto), 'ambos' (tambien descuenta el defecto), 'ninguno'.
  p_ajuste_jornada text default null
)
returns table (
  orden integer, seccion text, concepto text, detalle text,
  base numeric, tipo numeric, importe numeric, detalle_de text
)
language plpgsql stable security invoker set search_path = public
as $$
declare
  hp record;
  v_conv public.convenios_categorias_salarios;
  v_convenio_id integer;
  v_irpf numeric; v_prorrateo boolean;
  v_pagas integer; v_extras integer;
  v_dias_trab integer := 0; v_horas_noct numeric := 0;
  v_base_total numeric := 0; v_dev_puestos numeric := 0;
  v_tarifa_transp numeric := 0; v_transporte numeric := 0;
  v_compl_total numeric := 0;
  v_pe_base numeric := 0; v_pe_compl numeric := 0;
  v_bruto numeric; v_base_cc numeric; v_base_cp numeric; v_base_irpf numeric;
  v_d_comunes numeric; v_d_mei numeric; v_d_desempleo numeric;
  v_d_formacion numeric; v_d_irpf numeric; v_ded_total numeric;
begin
  select h.*, (least(coalesce(h.fecha_baja, p_hasta), p_hasta) - greatest(h.fecha_alta, p_desde) + 1) as dias_solape
    into hp
  from public.historiales_laborales h
  where h.personal_id = p_personal_id
    and (p_empresa_id is null or h.empresa_id = p_empresa_id)
    and h.fecha_alta <= p_hasta and (h.fecha_baja is null or h.fecha_baja >= p_desde)
  order by dias_solape desc, h.id limit 1;
  if hp.id is null then return; end if;

  select pu.convenio_id into v_convenio_id from public.puestos pu where pu.id = hp.puesto_id;
  if v_convenio_id is not null then
    select * into v_conv from public.get_convenio_salario_vigente(v_convenio_id, greatest(hp.fecha_alta, p_desde));
  end if;

  select pc.irpf, pc.prorrateo_pagas into v_irpf, v_prorrateo
  from public.personal_confidencial pc where pc.personal_id = p_personal_id;

  v_pagas := coalesce(v_conv.pagas_anuales, 12)::integer;
  v_extras := greatest(v_pagas - 12, 0);

  select count(distinct r.fecha) into v_dias_trab
  from public.registros r
  join public.situaciones s on s.id = r.situacion_id
  left join public.tipo_horas th on th.id = r.tipo_hora_id
  where r.personal_id = p_personal_id and r.fecha >= p_desde and r.fecha <= p_hasta
    and (p_empresa_id is null or r.empresa_id = p_empresa_id)
    and (s.situacion in ('NORM','SUST') or (s.situacion='FEST' and th.tipo_hora='FTRAB'));

  select coalesce(sum(r.horas_nocturnas),0)::numeric into v_horas_noct
  from public.registros r
  where r.personal_id = p_personal_id and r.fecha >= p_desde and r.fecha <= p_hasta
    and (p_empresa_id is null or r.empresa_id = p_empresa_id);

  select coalesce(sum(x.importe) filter (where x.concepto = 'Salario base'), 0),
         coalesce(sum(x.importe), 0)
    into v_base_total, v_dev_puestos
  from (
    select d.concepto, sum(d.importe) as importe
    from public.historiales_laborales h
    cross join lateral public.calcular_nomina_devengos(h.id, p_desde, p_hasta, p_base_calculo, p_ajuste_jornada) d
    where h.personal_id = p_personal_id
      and (p_empresa_id is null or h.empresa_id = p_empresa_id)
      and h.fecha_alta <= p_hasta and (h.fecha_baja is null or h.fecha_baja >= p_desde)
    group by d.concepto
  ) x;

  select coalesce(max(cs.plus_transporte), 0) into v_tarifa_transp
  from public.historiales_laborales h
  join public.puestos pu on pu.id = h.puesto_id
  cross join lateral public.get_convenio_salario_vigente(pu.convenio_id, greatest(h.fecha_alta, p_desde)) cs
  where h.personal_id = p_personal_id and h.tiene_plus_transporte
    and (p_empresa_id is null or h.empresa_id = p_empresa_id)
    and h.fecha_alta <= p_hasta and (h.fecha_baja is null or h.fecha_baja >= p_desde);

  if v_tarifa_transp > 0 then
    v_transporte := round(v_tarifa_transp * v_dias_trab, 2);
  end if;

  select coalesce(sum(round(
    case c.tipo when 'porcentaje' then v_base_total * c.porcentaje
      else case c.unidad
        when 'mensual' then c.importe
        when 'diario' then c.importe * v_dias_trab
        when 'por_hora' then c.importe * (case c.medida_horas when 'horas_nocturnas' then v_horas_noct else 0 end)
        else c.importe end end, 2)), 0)
    into v_compl_total
  from public.get_personal_complementos_vigentes(p_personal_id, p_desde) c;

  -- La prorrata de pagas extra se calcula SIEMPRE, tenga o no prorrateo: si la
  -- persona NO las tiene prorrateadas no se devenga (no la cobra este mes), pero
  -- igualmente COTIZA (art. 147 LGSS), asi que suma a la base de la Seguridad
  -- Social aunque no al bruto ni a la base de IRPF.
  if v_extras > 0 then
    v_pe_base := round(v_base_total * v_extras / 12.0, 2);
    select coalesce(sum(round(c.importe * v_extras / 12.0, 2)), 0) into v_pe_compl
    from public.get_personal_complementos_vigentes(p_personal_id, p_desde) c
    where c.prorratea_en_extra and c.tipo = 'fijo' and c.unidad = 'mensual';
  end if;

  return query
  select x.orden, 'devengo'::text, x.concepto, null::text, null::numeric, null::numeric,
         round(x.importe, 2), null::text
  from (
    select min(d.orden) as orden, d.concepto, sum(d.importe) as importe
    from public.historiales_laborales h
    cross join lateral public.calcular_nomina_devengos(h.id, p_desde, p_hasta, p_base_calculo, p_ajuste_jornada) d
    where h.personal_id = p_personal_id
      and (p_empresa_id is null or h.empresa_id = p_empresa_id)
      and h.fecha_alta <= p_hasta and (h.fecha_baja is null or h.fecha_baja >= p_desde)
    group by d.concepto
  ) x;

  if v_transporte <> 0 then
    return query select 30, 'devengo'::text, 'Plus de transporte'::text,
      format('%s€ × %s días trabajados (toda la persona)', v_tarifa_transp, v_dias_trab),
      null::numeric, null::numeric, v_transporte, null::text;
  end if;

  return query
  select (100 + row_number() over (order by c.orden_calculo, c.nombre))::integer,
    'devengo'::text, c.nombre,
    case c.tipo when 'porcentaje' then format('%s%% sobre base', round(c.porcentaje*100,2))
      else case c.unidad
        when 'diario' then format('%s€ × %s días', c.importe, v_dias_trab)
        when 'por_hora' then format('%s€ × horas %s', c.importe, c.medida_horas)
        else format('%s€/mes', c.importe) end end,
    null::numeric, null::numeric,
    round(case c.tipo when 'porcentaje' then v_base_total * c.porcentaje
      else case c.unidad
        when 'mensual' then c.importe
        when 'diario' then c.importe * v_dias_trab
        when 'por_hora' then c.importe * (case c.medida_horas when 'horas_nocturnas' then v_horas_noct else 0 end)
        else c.importe end end, 2),
    null::text
  from public.get_personal_complementos_vigentes(p_personal_id, p_desde) c;

  -- Solo se devenga si la persona tiene las pagas prorrateadas.
  if coalesce(v_prorrateo, false) and (v_pe_base + v_pe_compl) <> 0 then
    return query select 20, 'devengo'::text, 'Prorrateo pagas extra'::text,
      format('%s pagas/año (12 + %s extra) → %s/12', v_pagas, v_extras, v_extras),
      null::numeric, null::numeric, v_pe_base + v_pe_compl, null::text;
    return query select 21, 'devengo'::text, 'Salario base'::text,
      format('%s€ × %s/12', round(v_base_total,2), v_extras),
      null::numeric, null::numeric, v_pe_base, 'prorrateo_extra'::text;
    return query
    select (22 + row_number() over (order by c.orden_calculo, c.nombre))::integer,
      'devengo'::text, c.nombre, format('%s€ × %s/12', c.importe, v_extras),
      null::numeric, null::numeric, round(c.importe * v_extras / 12.0, 2), 'prorrateo_extra'::text
    from public.get_personal_complementos_vigentes(p_personal_id, p_desde) c
    where c.prorratea_en_extra and c.tipo = 'fijo' and c.unidad = 'mensual';
  end if;

  -- El bruto solo incluye la prorrata si se devenga (pagas prorrateadas).
  v_bruto := v_dev_puestos + v_transporte + v_compl_total
    + (case when coalesce(v_prorrateo, false) then v_pe_base + v_pe_compl else 0 end);

  -- Bases: la de Seguridad Social siempre lleva la prorrata de pagas extra. Si
  -- se devengo ya va dentro del bruto; si no, se suma aqui. La de IRPF es el
  -- devengado real, sin la prorrata no cobrada.
  v_base_cc := v_bruto
    + (case when coalesce(v_prorrateo, false) then 0 else v_pe_base + v_pe_compl end);
  v_base_cp := v_base_cc;
  v_base_irpf := v_bruto;

  v_d_comunes   := round(v_base_cc  * coalesce(hp.cotizacion_comunes_pct, 0), 2);
  v_d_mei       := round(v_base_cc  * coalesce(hp.cotizacion_mei_pct, 0), 2);
  v_d_desempleo := round(v_base_cp  * coalesce(hp.cotizacion_desempleo_pct, 0), 2);
  v_d_formacion := round(v_base_cp  * coalesce(hp.cotizacion_formacion_pct, 0), 2);
  v_d_irpf      := round(v_base_irpf * coalesce(v_irpf, 0), 2);
  v_ded_total   := v_d_comunes + v_d_mei + v_d_desempleo + v_d_formacion + v_d_irpf;

  return query select 500, 'total'::text, 'Total devengado (bruto)'::text, null::text, null::numeric, null::numeric, round(v_bruto,2), null::text;
  if not coalesce(v_prorrateo, false) and (v_pe_base + v_pe_compl) <> 0 then
    return query select 599, 'base'::text, 'P.P. pagas extra (solo cotiza)'::text,
      format('%s pagas/año → %s/12 · no se devenga, suma a la base de S.S.', v_pagas, v_extras),
      null::numeric, null::numeric, v_pe_base + v_pe_compl, null::text;
  end if;
  return query select 600, 'base'::text, 'Base contingencias comunes'::text, null::text, null::numeric, null::numeric, round(v_base_cc,2), null::text;
  return query select 601, 'base'::text, 'Base contingencias profesionales'::text, null::text, null::numeric, null::numeric, round(v_base_cp,2), null::text;
  return query select 602, 'base'::text, 'Base IRPF'::text, null::text, null::numeric, null::numeric, round(v_base_irpf,2), null::text;
  return query select 700, 'deduccion'::text, 'Contingencias comunes'::text,
    format('%s%% sobre %s€', round(coalesce(hp.cotizacion_comunes_pct,0)*100,3), round(v_base_cc,2)),
    round(v_base_cc,2), hp.cotizacion_comunes_pct, v_d_comunes, null::text;
  return query select 701, 'deduccion'::text, 'MEI'::text,
    format('%s%% sobre %s€', round(coalesce(hp.cotizacion_mei_pct,0)*100,3), round(v_base_cc,2)),
    round(v_base_cc,2), hp.cotizacion_mei_pct, v_d_mei, null::text;
  return query select 702, 'deduccion'::text, 'Desempleo'::text,
    format('%s%% sobre %s€', round(coalesce(hp.cotizacion_desempleo_pct,0)*100,3), round(v_base_cp,2)),
    round(v_base_cp,2), hp.cotizacion_desempleo_pct, v_d_desempleo, null::text;
  return query select 703, 'deduccion'::text, 'Formación profesional'::text,
    format('%s%% sobre %s€', round(coalesce(hp.cotizacion_formacion_pct,0)*100,3), round(v_base_cp,2)),
    round(v_base_cp,2), hp.cotizacion_formacion_pct, v_d_formacion, null::text;
  return query select 704, 'deduccion'::text, 'IRPF'::text,
    format('%s%% sobre %s€', round(coalesce(v_irpf,0)*100,3), round(v_base_irpf,2)),
    round(v_base_irpf,2), v_irpf, v_d_irpf, null::text;
  return query select 800, 'total'::text, 'Total deducciones'::text, null::text, null::numeric, null::numeric, v_ded_total, null::text;
  return query select 810, 'total'::text, 'Líquido a percibir'::text, null::text, null::numeric, null::numeric, round(v_bruto - v_ded_total, 2), null::text;
  return;
end;
$$;

revoke all on function public.calcular_nomina_persona(integer, date, date, integer, text, text) from public;
grant execute on function public.calcular_nomina_persona(integer, date, date, integer, text, text) to authenticated;
