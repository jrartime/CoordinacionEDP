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

-- p_historial_ids acota el calculo a unos periodos concretos. Sirve para el caso
-- de una persona con DOS vidas laborales que NO se solapan dentro del mismo mes
-- (alta, baja, y mas tarde otra alta): en la realidad son dos nominas separadas,
-- cada una con su alta y su baja en Seguridad Social, sus dias trabajados y sus
-- propios tipos de cotizacion, no una sola nomina por la suma. Pasando un solo
-- id se obtiene esa nomina; pasando los dos, la suma. Nulo = todos los del rango
-- (comportamiento de siempre).
--
-- Al acotar, los dias trabajados y las horas nocturnas se cuentan solo dentro de
-- las fechas de los periodos elegidos, no de todo el rango del filtro: si no, el
-- plus de transporte de una nomina se llevaria los dias de la otra.

-- NOMINA MANUAL (p_manual_*). Fija el salario a mano y se impone a todo lo que
-- se derivaria del historial y del convenio: sustituye los devengos por puesto
-- (salario base, plus de disponibilidad, complemento de puesto, horas
-- complementarias) por el importe indicado. Lo demas -- complementos de la
-- persona, plus de transporte, bases, cotizaciones y liquido -- se sigue
-- calculando igual.
--
--   p_manual_modo: 'periodo' (el importe es el del periodo entero),
--     'diario' (importe x dias naturales de alta dentro del rango) u
--     'hora' (importe x horas trabajadas del periodo).
--   p_manual_pagas_incluidas: si el importe YA lleva dentro la prorrata de las
--     pagas extra, se parte (12/pagas para el salario base, el resto es la
--     prorrata). Si no, la prorrata se calcula encima como siempre.
--   p_manual_complementos / p_manual_transporte: lo que YA va dentro del importe
--     y por tanto no se vuelve a sumar. Marcar la antiguedad no la borra, la da
--     por pagada dentro del salario indicado.
--
-- Ejemplo: 91 EUR/dia en julio con pagas incluidas, marcando antiguedad y
-- transporte, sobre alguien con 14 pagas y un complemento absorbible de 420,84:
--   91 x 31 = 2821 -> base 2821 x 12/14 = 2418,00 y prorrata 403,00
--   + 420,84 del complemento no marcado = 3241,84 de bruto.

drop function if exists public.calcular_nomina_persona(integer, date, date);
drop function if exists public.calcular_nomina_persona(integer, date, date, integer);
drop function if exists public.calcular_nomina_persona(integer, date, date, integer, text);
drop function if exists public.calcular_nomina_persona(integer, date, date, integer, text, text);
drop function if exists public.calcular_nomina_persona(integer, date, date, integer, text, text, bigint[]);
-- Firma sin cantidad/precio en el returns table (hasta 2026-07-23). Un
-- `create or replace` no puede cambiar el tipo de retorno: hay que dropear.
drop function if exists public.calcular_nomina_persona(integer, date, date, integer, text, text, bigint[], numeric, text, boolean, bigint[], boolean);

create or replace function public.calcular_nomina_persona(
  p_personal_id integer, p_desde date, p_hasta date,
  p_empresa_id integer default null,
  -- Sobrescribe el base_calculo de la tarifa de convenio para TODOS los puestos
  -- del calculo. Vacio = cada convenio manda con el suyo.
  p_base_calculo text default null,
  -- Que hacer con la diferencia entre horas REG y jornada teorica:
  -- 'exceso' (por defecto), 'ambos' (tambien descuenta el defecto), 'ninguno'.
  p_ajuste_jornada text default null,
  -- Periodos de historial laboral a incluir. Nulo = todos los del rango.
  p_historial_ids bigint[] default null,
  -- Nomina manual: importe del salario. Nulo = calculo normal.
  p_manual_importe numeric default null,
  p_manual_modo text default null,
  p_manual_pagas_incluidas boolean default false,
  p_manual_complementos bigint[] default null,
  p_manual_transporte boolean default false
)
-- cantidad/precio acompanan a cada linea con las UNIDADES y el PRECIO UNITARIO
-- que la produjeron (dias x tarifa de transporte, horas x precio, importe fijo).
-- El texto de `detalle` dice lo mismo en prosa, pero solo esto es explotable:
-- las nominas emitidas lo guardan para poder auditar de que sale cada concepto.
returns table (
  orden integer, seccion text, concepto text, detalle text,
  base numeric, tipo numeric, cantidad numeric, precio numeric,
  importe numeric, detalle_de text
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
  v_manual boolean := p_manual_importe is not null;
  v_manual_excl bigint[] := coalesce(p_manual_complementos, '{}'::bigint[]);
  v_manual_dias integer := 0; v_manual_horas numeric := 0;
  v_manual_total numeric := 0; v_manual_detalle text;
begin
  select h.*, (least(coalesce(h.fecha_baja, p_hasta), p_hasta) - greatest(h.fecha_alta, p_desde) + 1) as dias_solape
    into hp
  from public.historiales_laborales h
  where h.personal_id = p_personal_id
    and (p_empresa_id is null or h.empresa_id = p_empresa_id)
    and (p_historial_ids is null or h.id = any(p_historial_ids))
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
    and (p_historial_ids is null or exists (
      select 1 from public.historiales_laborales h2
      where h2.id = any(p_historial_ids) and h2.personal_id = p_personal_id
        and r.fecha >= h2.fecha_alta and (h2.fecha_baja is null or r.fecha <= h2.fecha_baja)))
    and (s.situacion in ('NORM','SUST') or (s.situacion='FEST' and th.tipo_hora='FTRAB'));

  select coalesce(sum(r.horas_nocturnas),0)::numeric into v_horas_noct
  from public.registros r
  where r.personal_id = p_personal_id and r.fecha >= p_desde and r.fecha <= p_hasta
    and (p_empresa_id is null or r.empresa_id = p_empresa_id)
    and (p_historial_ids is null or exists (
      select 1 from public.historiales_laborales h2
      where h2.id = any(p_historial_ids) and h2.personal_id = p_personal_id
        and r.fecha >= h2.fecha_alta and (h2.fecha_baja is null or r.fecha <= h2.fecha_baja)));

  -- Multiplicadores de la nomina manual. Los dias son los naturales de alta
  -- dentro del rango (julio entero con un contrato abierto = 31, no los 30 del
  -- mes comercial que usa el calculo por convenio: aqui manda lo que se teclea).
  if v_manual then
    select coalesce(sum(least(coalesce(h.fecha_baja, p_hasta), p_hasta)
                        - greatest(h.fecha_alta, p_desde) + 1), 0)
      into v_manual_dias
    from public.historiales_laborales h
    where h.personal_id = p_personal_id
      and (p_empresa_id is null or h.empresa_id = p_empresa_id)
      and (p_historial_ids is null or h.id = any(p_historial_ids))
      and h.fecha_alta <= p_hasta and (h.fecha_baja is null or h.fecha_baja >= p_desde);

    select coalesce(sum(r.horas), 0)::numeric into v_manual_horas
    from public.registros r
    join public.situaciones s on s.id = r.situacion_id
    left join public.tipo_horas th on th.id = r.tipo_hora_id
    where r.personal_id = p_personal_id and r.fecha >= p_desde and r.fecha <= p_hasta
      and (p_empresa_id is null or r.empresa_id = p_empresa_id)
      and (p_historial_ids is null or exists (
        select 1 from public.historiales_laborales h2
        where h2.id = any(p_historial_ids) and h2.personal_id = p_personal_id
          and r.fecha >= h2.fecha_alta and (h2.fecha_baja is null or r.fecha <= h2.fecha_baja)))
      and (s.situacion in ('NORM','SUST') or (s.situacion='FEST' and th.tipo_hora='FTRAB'));

    v_manual_total := round(p_manual_importe * case p_manual_modo
      when 'diario' then v_manual_dias
      when 'hora' then v_manual_horas
      else 1 end, 2);
    v_manual_detalle := case p_manual_modo
      when 'diario' then format('manual: %s€ × %s días', p_manual_importe, v_manual_dias)
      when 'hora' then format('manual: %s€ × %s horas', p_manual_importe, v_manual_horas)
      else format('manual: %s€ del periodo', p_manual_importe) end;
  end if;

  select coalesce(sum(x.importe) filter (where x.concepto = 'Salario base'), 0),
         coalesce(sum(x.importe), 0)
    into v_base_total, v_dev_puestos
  from (
    select d.concepto, sum(d.importe) as importe
    from public.historiales_laborales h
    cross join lateral public.calcular_nomina_devengos(h.id, p_desde, p_hasta, p_base_calculo, p_ajuste_jornada) d
    where h.personal_id = p_personal_id
      and (p_empresa_id is null or h.empresa_id = p_empresa_id)
      and (p_historial_ids is null or h.id = any(p_historial_ids))
      and h.fecha_alta <= p_hasta and (h.fecha_baja is null or h.fecha_baja >= p_desde)
    group by d.concepto
  ) x;

  -- El importe manual sustituye por completo a los devengos por puesto.
  if v_manual then
    if p_manual_pagas_incluidas and v_pagas > 12 then
      v_base_total := round(v_manual_total * 12.0 / v_pagas, 2);
    else
      v_base_total := v_manual_total;
    end if;
    v_dev_puestos := v_base_total;
  end if;

  select coalesce(max(cs.plus_transporte), 0) into v_tarifa_transp
  from public.historiales_laborales h
  join public.puestos pu on pu.id = h.puesto_id
  cross join lateral public.get_convenio_salario_vigente(pu.convenio_id, greatest(h.fecha_alta, p_desde)) cs
  where h.personal_id = p_personal_id and h.tiene_plus_transporte
    and (p_empresa_id is null or h.empresa_id = p_empresa_id)
    and (p_historial_ids is null or h.id = any(p_historial_ids))
    and h.fecha_alta <= p_hasta and (h.fecha_baja is null or h.fecha_baja >= p_desde);

  -- Marcado como incluido en la nomina manual: ya va dentro del importe.
  if p_manual_transporte then
    v_tarifa_transp := 0;
  end if;
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
  from public.get_personal_complementos_vigentes(p_personal_id, p_desde) c
  where not (c.id = any(v_manual_excl));

  -- La prorrata de pagas extra se calcula SIEMPRE, tenga o no prorrateo: si la
  -- persona NO las tiene prorrateadas no se devenga (no la cobra este mes), pero
  -- igualmente COTIZA (art. 147 LGSS), asi que suma a la base de la Seguridad
  -- Social aunque no al bruto ni a la base de IRPF.
  if v_extras > 0 then
    -- Con el importe manual llevando ya la prorrata dentro, esta es el resto de
    -- partir el total; si no, se calcula encima del salario base como siempre.
    if v_manual and p_manual_pagas_incluidas then
      v_pe_base := v_manual_total - v_base_total;
    else
      v_pe_base := round(v_base_total * v_extras / 12.0, 2);
    end if;
    select coalesce(sum(round(c.importe * v_extras / 12.0, 2)), 0) into v_pe_compl
    from public.get_personal_complementos_vigentes(p_personal_id, p_desde) c
    where not (c.id = any(v_manual_excl)) and c.prorratea_en_extra and c.tipo = 'fijo' and c.unidad = 'mensual';
  end if;

  if v_manual then
    return query select 10, 'devengo'::text, 'Salario base'::text, v_manual_detalle,
      null::numeric, null::numeric,
      case p_manual_modo when 'diario' then v_manual_dias::numeric
                         when 'hora' then v_manual_horas else 1 end,
      p_manual_importe, v_base_total, null::text;
  else
    -- La cantidad se suma entre puestos (p.ej. las horas complementarias de los
    -- dos); el precio solo se conserva si TODOS coinciden, porque un precio
    -- promediado seria mentira.
    return query
    select x.orden, 'devengo'::text, x.concepto, null::text, null::numeric, null::numeric,
           x.cantidad, x.precio, round(x.importe, 2), null::text
    from (
      select min(d.orden) as orden, d.concepto, sum(d.importe) as importe,
             sum(d.cantidad) as cantidad,
             case when count(distinct d.precio) = 1 then min(d.precio) end as precio
      from public.historiales_laborales h
      cross join lateral public.calcular_nomina_devengos(h.id, p_desde, p_hasta, p_base_calculo, p_ajuste_jornada) d
      where h.personal_id = p_personal_id
        and (p_empresa_id is null or h.empresa_id = p_empresa_id)
        and (p_historial_ids is null or h.id = any(p_historial_ids))
        and h.fecha_alta <= p_hasta and (h.fecha_baja is null or h.fecha_baja >= p_desde)
      group by d.concepto
    ) x;
  end if;

  if v_transporte <> 0 then
    return query select 30, 'devengo'::text, 'Plus de transporte'::text,
      format('%s€ × %s días trabajados (toda la persona)', v_tarifa_transp, v_dias_trab),
      null::numeric, null::numeric, v_dias_trab::numeric, v_tarifa_transp,
      v_transporte, null::text;
  end if;

  return query
  select (100 + row_number() over (order by c.orden_calculo, c.nombre))::integer,
    'devengo'::text, c.nombre,
    case c.tipo when 'porcentaje' then format('%s%% sobre base', round(c.porcentaje*100,2))
      else case c.unidad
        when 'diario' then format('%s€ × %s días', c.importe, v_dias_trab)
        when 'por_hora' then format('%s€ × horas %s', c.importe, c.medida_horas)
        else format('%s€/mes', c.importe) end end,
    -- Un porcentaje se explica con base + tipo; un importe fijo, con cantidad
    -- (dias u horas, 1 si es mensual) + precio unitario.
    case c.tipo when 'porcentaje' then round(v_base_total, 2) end,
    case c.tipo when 'porcentaje' then c.porcentaje end,
    case c.tipo when 'porcentaje' then null::numeric
      else case c.unidad
        when 'diario' then v_dias_trab::numeric
        when 'por_hora' then (case c.medida_horas when 'horas_nocturnas' then v_horas_noct else 0 end)
        else 1 end end,
    case c.tipo when 'porcentaje' then null::numeric else c.importe end,
    round(case c.tipo when 'porcentaje' then v_base_total * c.porcentaje
      else case c.unidad
        when 'mensual' then c.importe
        when 'diario' then c.importe * v_dias_trab
        when 'por_hora' then c.importe * (case c.medida_horas when 'horas_nocturnas' then v_horas_noct else 0 end)
        else c.importe end end, 2),
    null::text
  from public.get_personal_complementos_vigentes(p_personal_id, p_desde) c
  where not (c.id = any(v_manual_excl));

  -- Solo se devenga si la persona tiene las pagas prorrateadas.
  if coalesce(v_prorrateo, false) and (v_pe_base + v_pe_compl) <> 0 then
    -- El prorrateo se explica con base (sobre qué) y tipo (la fracción
    -- extras/12), no con cantidad x precio.
    return query select 20, 'devengo'::text, 'Prorrateo pagas extra'::text,
      format('%s pagas/año (12 + %s extra) → %s/12', v_pagas, v_extras, v_extras),
      null::numeric, round(v_extras / 12.0, 6), null::numeric, null::numeric,
      v_pe_base + v_pe_compl, null::text;
    return query select 21, 'devengo'::text, 'Salario base'::text,
      case when v_manual and p_manual_pagas_incluidas
        then format('%s€ − %s€ (ya incluida en el importe manual)', v_manual_total, round(v_base_total,2))
        else format('%s€ × %s/12', round(v_base_total,2), v_extras) end,
      round(v_base_total, 2), round(v_extras / 12.0, 6), null::numeric, null::numeric,
      v_pe_base, 'prorrateo_extra'::text;
    return query
    select (22 + row_number() over (order by c.orden_calculo, c.nombre))::integer,
      'devengo'::text, c.nombre, format('%s€ × %s/12', c.importe, v_extras),
      c.importe, round(v_extras / 12.0, 6), null::numeric, null::numeric,
      round(c.importe * v_extras / 12.0, 2), 'prorrateo_extra'::text
    from public.get_personal_complementos_vigentes(p_personal_id, p_desde) c
    where not (c.id = any(v_manual_excl)) and c.prorratea_en_extra and c.tipo = 'fijo' and c.unidad = 'mensual';
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

  return query select 500, 'total'::text, 'Total devengado (bruto)'::text, null::text, null::numeric, null::numeric, null::numeric, null::numeric, round(v_bruto,2), null::text;
  if not coalesce(v_prorrateo, false) and (v_pe_base + v_pe_compl) <> 0 then
    return query select 599, 'base'::text, 'P.P. pagas extra (solo cotiza)'::text,
      format('%s pagas/año → %s/12 · no se devenga, suma a la base de S.S.', v_pagas, v_extras),
      null::numeric, round(v_extras / 12.0, 6), null::numeric, null::numeric,
      v_pe_base + v_pe_compl, null::text;
  end if;
  return query select 600, 'base'::text, 'Base contingencias comunes'::text, null::text, null::numeric, null::numeric, null::numeric, null::numeric, round(v_base_cc,2), null::text;
  return query select 601, 'base'::text, 'Base contingencias profesionales'::text, null::text, null::numeric, null::numeric, null::numeric, null::numeric, round(v_base_cp,2), null::text;
  return query select 602, 'base'::text, 'Base IRPF'::text, null::text, null::numeric, null::numeric, null::numeric, null::numeric, round(v_base_irpf,2), null::text;
  return query select 700, 'deduccion'::text, 'Contingencias comunes'::text,
    format('%s%% sobre %s€', round(coalesce(hp.cotizacion_comunes_pct,0)*100,3), round(v_base_cc,2)),
    round(v_base_cc,2), hp.cotizacion_comunes_pct, null::numeric, null::numeric, v_d_comunes, null::text;
  return query select 701, 'deduccion'::text, 'MEI'::text,
    format('%s%% sobre %s€', round(coalesce(hp.cotizacion_mei_pct,0)*100,3), round(v_base_cc,2)),
    round(v_base_cc,2), hp.cotizacion_mei_pct, null::numeric, null::numeric, v_d_mei, null::text;
  return query select 702, 'deduccion'::text, 'Desempleo'::text,
    format('%s%% sobre %s€', round(coalesce(hp.cotizacion_desempleo_pct,0)*100,3), round(v_base_cp,2)),
    round(v_base_cp,2), hp.cotizacion_desempleo_pct, null::numeric, null::numeric, v_d_desempleo, null::text;
  return query select 703, 'deduccion'::text, 'Formación profesional'::text,
    format('%s%% sobre %s€', round(coalesce(hp.cotizacion_formacion_pct,0)*100,3), round(v_base_cp,2)),
    round(v_base_cp,2), hp.cotizacion_formacion_pct, null::numeric, null::numeric, v_d_formacion, null::text;
  return query select 704, 'deduccion'::text, 'IRPF'::text,
    format('%s%% sobre %s€', round(coalesce(v_irpf,0)*100,3), round(v_base_irpf,2)),
    round(v_base_irpf,2), v_irpf, null::numeric, null::numeric, v_d_irpf, null::text;
  return query select 800, 'total'::text, 'Total deducciones'::text, null::text, null::numeric, null::numeric, null::numeric, null::numeric, v_ded_total, null::text;
  return query select 810, 'total'::text, 'Líquido a percibir'::text, null::text, null::numeric, null::numeric, null::numeric, null::numeric, round(v_bruto - v_ded_total, 2), null::text;
  return;
end;
$$;

revoke all on function public.calcular_nomina_persona(integer, date, date, integer, text, text, bigint[], numeric, text, boolean, bigint[], boolean) from public;
grant execute on function public.calcular_nomina_persona(integer, date, date, integer, text, text, bigint[], numeric, text, boolean, bigint[], boolean) to authenticated;
