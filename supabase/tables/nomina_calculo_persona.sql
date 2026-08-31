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

-- COMPLEMENTOS ANADIDOS A MANO (p_complementos_extra). Lista
-- [{"complemento_id": 15, "importe": 95.00}] con los conceptos que se suman
-- SOLO a esta nomina, sin tocar la ficha de la persona. Si la persona ya tiene
-- ese complemento asignado, salen las dos lineas y se suman las dos: es lo
-- pedido, no se sustituyen. Se emiten con orden 300+ (tras los asignados).

-- NOMINA MANUAL Y CONCEPTOS DEL PUESTO (2026-07-28). El importe manual sustituye
-- al SALARIO BASE, pero antes se llevaba por delante tambien el resto de lo que
-- genera el puesto (montaje, complementarias, disponibilidad, nocturnidad,
-- festivo, absentismo) sin que apareciera en ninguna parte: Denilson Santiago
-- perdia 439,84 EUR de montaje al fijarle un importe. Ahora esos conceptos SE
-- PAGAN APARTE por defecto y la lista "Complementos y pluses" del panel de
-- Gestion los muestra uno a uno (get_conceptos_puesto_nomina); marcarlos
-- significa "ya van dentro del importe" y entonces no se suman.

-- HORAS EN UN PUESTO SIN HISTORIAL (2026-07-27, revisado el 2026-07-29). Si
-- alguien cubre un servicio distinto del suyo, calcular_nomina_devengos descarta
-- esas horas al filtrar por r.puesto_id = h.puesto_id y se perdian en silencio
-- (caso real: Miguel Antonio Rodriguez, 5 horas complementarias como socorrista
-- con contrato de monitor). Las HCOMP y MONT se recogen aqui con
-- get_horas_sin_historial, a la tarifa del puesto DONDE se hicieron, en lineas
-- de orden 200+.
--
-- Las REG siguen sin pagarse como linea propia, por lo mismo de siempre: son
-- jornada y su salario base ya se cobra por el historial. Pero el 2026-07-27 se
-- decidio ademas NO CONTARLAS, y eso estaba mal en las modalidades que ajustan
-- por horas: alli la jornada realizada se compara con la teorica, asi que una
-- hora que no se cuenta no es que no se pague, es que RESTA. Manuel Enrique
-- Fernandez (julio 2026) hizo 169 h de 161 teoricas y cobro un descuento de
-- 123,87 EUR porque el motor solo veia las 145 h de su puesto.
--
-- Desde p_horas_otros_puestos (por defecto true) esas REG suman a la jornada
-- del historial PREDOMINANTE, que es quien aporta cotizaciones y pagas. No se
-- reparten entre todos los solapados: eso las pagaria una vez por puesto.
-- Desmarcarlo recupera el comportamiento anterior, que es lo que procede cuando
-- el puesto del registro esta mal elegido (un error de dato, no una cobertura).

-- BASES DE COTIZACION POR CONCEPTO (2026-07-25). Antes las bases se calculaban
-- como "bruto menos excepciones". Ahora cada concepto declara a que bases suma
-- en nomina_complementos_catalogo.cotiza_en y aqui se acumulan una a una:
--   v_b_comunes / v_b_mei / v_b_desempleo / v_b_formacion / v_b_irpf.
-- Lo que no es complemento del catalogo (salario base, pluses de convenio,
-- disponibilidad, horas...) cotiza y tributa por TODO, que es el comportamiento
-- de siempre. El plus de transporte, aunque venga de la tarifa del convenio y
-- no de una asignacion, lee su cotiza_en del catalogo por codigo_nomina = 398.
--
-- Cada linea devuelve su cotiza_en para que la nomina emitida lo congele y
-- pueda explicar por si sola por que su base es la que es.
--
-- Las lineas 600/601/602 siguen siendo las tres bases visibles; si formacion
-- cotizara sobre una base distinta a desempleo, la 601 lo dice en su detalle y
-- cada deduccion lleva su base real en la columna `base`.

drop function if exists public.calcular_nomina_persona(integer, date, date);
drop function if exists public.calcular_nomina_persona(integer, date, date, integer);
drop function if exists public.calcular_nomina_persona(integer, date, date, integer, text);
drop function if exists public.calcular_nomina_persona(integer, date, date, integer, text, text);
drop function if exists public.calcular_nomina_persona(integer, date, date, integer, text, text, bigint[]);
-- Firma sin cantidad/precio en el returns table (hasta 2026-07-23). Un
-- `create or replace` no puede cambiar el tipo de retorno: hay que dropear.
drop function if exists public.calcular_nomina_persona(integer, date, date, integer, text, text, bigint[], numeric, text, boolean, bigint[], boolean);
-- Idem al anadir cotiza_en al returns table y p_complementos_extra (2026-07-25).
drop function if exists public.calcular_nomina_persona(integer, date, date, integer, text, text, bigint[], numeric, text, boolean, bigint[], boolean, jsonb);
-- Idem al anadir p_manual_conceptos_dentro (2026-07-28).
drop function if exists public.calcular_nomina_persona(integer, date, date, integer, text, text, bigint[], numeric, text, boolean, bigint[], boolean, jsonb, text[]);
-- Idem al anadir p_horas_otros_puestos (2026-07-29).
drop function if exists public.calcular_nomina_persona(integer, date, date, integer, text, text, bigint[], numeric, text, boolean, bigint[], boolean, jsonb, text[], boolean);

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
  p_manual_transporte boolean default false,
  -- Complementos anadidos a mano para ESTA nomina, sin tocar la ficha de la
  -- persona: [{"complemento_id": 15, "importe": 95.00}, ...]. Se suman al bruto
  -- ademas de los que la persona ya tenga asignados (si coinciden, van los dos).
  p_complementos_extra jsonb default null,
  -- Conceptos del puesto que se dan por INCLUIDOS en el importe manual y
  -- por tanto no se pagan aparte. Vacio = todos se pagan aparte.
  p_manual_conceptos_dentro text[] default null,
  -- Contar como jornada las horas hechas en un puesto que la persona no tiene
  -- contratado. Por defecto SI: son horas trabajadas y no contarlas no solo
  -- deja de pagarlas, en modalidad Horas totales las convierte en descuento.
  -- Se desmarca cuando el puesto del registro esta mal elegido (error de dato).
  p_horas_otros_puestos boolean default true
)
-- cantidad/precio acompanan a cada linea con las UNIDADES y el PRECIO UNITARIO
-- que la produjeron. cotiza_en dice a que bases suma esa linea.
returns table (
  orden integer, seccion text, concepto text, detalle text,
  base numeric, tipo numeric, cantidad numeric, precio numeric,
  importe numeric, detalle_de text, cotiza_en text[]
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
  v_transp_cotiza text[];
  v_compl_total numeric := 0; v_extra_total numeric := 0;
  v_huerf_total numeric := 0;
  v_manual_fuera numeric := 0;
  v_pe_base numeric := 0; v_pe_compl numeric := 0;
  v_bruto numeric; v_base_cc numeric; v_base_cp numeric; v_base_irpf numeric;
  v_b_comunes numeric := 0; v_b_mei numeric := 0;
  v_b_desempleo numeric := 0; v_b_formacion numeric := 0; v_b_irpf numeric := 0;
  v_d_comunes numeric; v_d_mei numeric; v_d_desempleo numeric;
  v_d_formacion numeric; v_d_irpf numeric; v_ded_total numeric;
  v_manual boolean := p_manual_importe is not null;
  v_manual_excl bigint[] := coalesce(p_manual_complementos, '{}'::bigint[]);
  v_manual_dias integer := 0; v_manual_horas numeric := 0;
  v_manual_total numeric := 0; v_manual_detalle text;
  v_todas text[] := array['comunes','mei','desempleo','formacion','irpf']::text[];
  v_tope public.cotizacion_topes;
  v_tope_dias integer; v_tope_min numeric; v_tope_max numeric; v_coef_jornada numeric;
  r record;
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

  select count(distinct r2.fecha) into v_dias_trab
  from public.registros r2
  join public.situaciones s on s.id = r2.situacion_id
  left join public.tipo_horas th on th.id = r2.tipo_hora_id
  where r2.personal_id = p_personal_id and r2.fecha >= p_desde and r2.fecha <= p_hasta
    and (p_empresa_id is null or r2.empresa_id = p_empresa_id)
    and (p_historial_ids is null or exists (
      select 1 from public.historiales_laborales h2
      where h2.id = any(p_historial_ids) and h2.personal_id = p_personal_id
        and r2.fecha >= h2.fecha_alta and (h2.fecha_baja is null or r2.fecha <= h2.fecha_baja)))
    and (s.situacion in ('NORM','SUST') or (s.situacion='FEST' and th.tipo_hora='FTRAB'));

  select coalesce(sum(r2.horas_nocturnas),0)::numeric into v_horas_noct
  from public.registros r2
  where r2.personal_id = p_personal_id and r2.fecha >= p_desde and r2.fecha <= p_hasta
    and (p_empresa_id is null or r2.empresa_id = p_empresa_id)
    and (p_historial_ids is null or exists (
      select 1 from public.historiales_laborales h2
      where h2.id = any(p_historial_ids) and h2.personal_id = p_personal_id
        and r2.fecha >= h2.fecha_alta and (h2.fecha_baja is null or r2.fecha <= h2.fecha_baja)));

  if v_manual then
    select coalesce(sum(least(coalesce(h.fecha_baja, p_hasta), p_hasta)
                        - greatest(h.fecha_alta, p_desde) + 1), 0)
      into v_manual_dias
    from public.historiales_laborales h
    where h.personal_id = p_personal_id
      and (p_empresa_id is null or h.empresa_id = p_empresa_id)
      and (p_historial_ids is null or h.id = any(p_historial_ids))
      and h.fecha_alta <= p_hasta and (h.fecha_baja is null or h.fecha_baja >= p_desde);

    select coalesce(sum(r2.horas), 0)::numeric into v_manual_horas
    from public.registros r2
    join public.situaciones s on s.id = r2.situacion_id
    left join public.tipo_horas th on th.id = r2.tipo_hora_id
    where r2.personal_id = p_personal_id and r2.fecha >= p_desde and r2.fecha <= p_hasta
      and (p_empresa_id is null or r2.empresa_id = p_empresa_id)
      and (p_historial_ids is null or exists (
        select 1 from public.historiales_laborales h2
        where h2.id = any(p_historial_ids) and h2.personal_id = p_personal_id
          and r2.fecha >= h2.fecha_alta and (h2.fecha_baja is null or r2.fecha <= h2.fecha_baja)))
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
    -- Las horas de un puesto sin contratar se suman SOLO al historial
    -- predominante (hp): repartirlas entre todos los solapados las pagaria
    -- tantas veces como puestos tenga la persona.
    cross join lateral public.calcular_nomina_devengos(
      h.id, p_desde, p_hasta, p_base_calculo, p_ajuste_jornada,
      p_horas_otros_puestos and h.id = hp.id) d
    where h.personal_id = p_personal_id
      and (p_empresa_id is null or h.empresa_id = p_empresa_id)
      and (p_historial_ids is null or h.id = any(p_historial_ids))
      and h.fecha_alta <= p_hasta and (h.fecha_baja is null or h.fecha_baja >= p_desde)
    group by d.concepto
  ) x;

  if v_manual then
    if p_manual_pagas_incluidas and v_pagas > 12 then
      v_base_total := round(v_manual_total * 12.0 / v_pagas, 2);
    else
      v_base_total := v_manual_total;
    end if;
    -- Los conceptos del puesto (montaje, complementarias, disponibilidad,
    -- nocturnidad...) ya NO se pierden al fijar un importe manual: se pagan
    -- aparte, salvo los que se marquen como incluidos en ese importe.
    select coalesce(sum(cp.importe), 0) into v_manual_fuera
    from public.get_conceptos_puesto_nomina(
           p_personal_id, p_desde, p_hasta, p_empresa_id, p_historial_ids,
           p_base_calculo, p_ajuste_jornada) cp
    where not (cp.concepto = any(coalesce(p_manual_conceptos_dentro, '{}'::text[])));

    v_dev_puestos := v_base_total + v_manual_fuera;
  end if;

  -- Los devengos del puesto (salario base, pluses de convenio, disponibilidad,
  -- horas...) cotizan y tributan por todo: es el comportamiento de siempre.
  v_b_comunes := v_dev_puestos; v_b_mei := v_dev_puestos;
  v_b_desempleo := v_dev_puestos; v_b_formacion := v_dev_puestos;
  v_b_irpf := v_dev_puestos;

  select coalesce(max(cs.plus_transporte), 0) into v_tarifa_transp
  from public.historiales_laborales h
  join public.puestos pu on pu.id = h.puesto_id
  cross join lateral public.get_convenio_salario_vigente(pu.convenio_id, greatest(h.fecha_alta, p_desde)) cs
  where h.personal_id = p_personal_id and h.tiene_plus_transporte
    and (p_empresa_id is null or h.empresa_id = p_empresa_id)
    and (p_historial_ids is null or h.id = any(p_historial_ids))
    and h.fecha_alta <= p_hasta and (h.fecha_baja is null or h.fecha_baja >= p_desde);

  if p_manual_transporte then
    v_tarifa_transp := 0;
  end if;
  if v_tarifa_transp > 0 then
    v_transporte := round(v_tarifa_transp * v_dias_trab, 2);
  end if;

  -- El transporte es tarifa de convenio, no complemento asignado, pero su
  -- comportamiento de cotizacion sale igualmente del catalogo (codigo 398).
  select c.cotiza_en into v_transp_cotiza
  from public.nomina_complementos_catalogo c where c.codigo_nomina = 398 limit 1;
  v_transp_cotiza := coalesce(v_transp_cotiza, v_todas);
  if v_transporte <> 0 then
    if 'comunes'   = any(v_transp_cotiza) then v_b_comunes   := v_b_comunes   + v_transporte; end if;
    if 'mei'       = any(v_transp_cotiza) then v_b_mei       := v_b_mei       + v_transporte; end if;
    if 'desempleo' = any(v_transp_cotiza) then v_b_desempleo := v_b_desempleo + v_transporte; end if;
    if 'formacion' = any(v_transp_cotiza) then v_b_formacion := v_b_formacion + v_transporte; end if;
    if 'irpf'      = any(v_transp_cotiza) then v_b_irpf      := v_b_irpf      + v_transporte; end if;
  end if;

  -- Complementos asignados a la persona: cada uno suma a las bases que declare
  -- su fila del catalogo.
  for r in
    select c.*, round(
      case c.tipo when 'porcentaje' then v_base_total * c.porcentaje
        else case c.unidad
          when 'mensual' then c.importe
          when 'diario' then c.importe * v_dias_trab
          when 'por_hora' then c.importe * (case c.medida_horas when 'horas_nocturnas' then v_horas_noct else 0 end)
          else c.importe end end, 2) as imp
    from public.get_personal_complementos_vigentes(p_personal_id, p_desde) c
    where not (c.id = any(v_manual_excl))
  loop
    v_compl_total := v_compl_total + r.imp;
    if 'comunes'   = any(coalesce(r.cotiza_en, v_todas)) then v_b_comunes   := v_b_comunes   + r.imp; end if;
    if 'mei'       = any(coalesce(r.cotiza_en, v_todas)) then v_b_mei       := v_b_mei       + r.imp; end if;
    if 'desempleo' = any(coalesce(r.cotiza_en, v_todas)) then v_b_desempleo := v_b_desempleo + r.imp; end if;
    if 'formacion' = any(coalesce(r.cotiza_en, v_todas)) then v_b_formacion := v_b_formacion + r.imp; end if;
    if 'irpf'      = any(coalesce(r.cotiza_en, v_todas)) then v_b_irpf      := v_b_irpf      + r.imp; end if;
  end loop;

  -- Complementos anadidos a mano para esta nomina.
  if p_complementos_extra is not null and jsonb_typeof(p_complementos_extra) = 'array' then
    for r in
      select c.id, c.nombre, c.codigo_nomina, c.orden_calculo, c.cotiza_en,
             round(coalesce((e->>'importe')::numeric, 0), 2) as imp
      from jsonb_array_elements(p_complementos_extra) e
      join public.nomina_complementos_catalogo c on c.id = (e->>'complemento_id')::bigint
    loop
      v_extra_total := v_extra_total + r.imp;
      if 'comunes'   = any(coalesce(r.cotiza_en, v_todas)) then v_b_comunes   := v_b_comunes   + r.imp; end if;
      if 'mei'       = any(coalesce(r.cotiza_en, v_todas)) then v_b_mei       := v_b_mei       + r.imp; end if;
      if 'desempleo' = any(coalesce(r.cotiza_en, v_todas)) then v_b_desempleo := v_b_desempleo + r.imp; end if;
      if 'formacion' = any(coalesce(r.cotiza_en, v_todas)) then v_b_formacion := v_b_formacion + r.imp; end if;
      if 'irpf'      = any(coalesce(r.cotiza_en, v_todas)) then v_b_irpf      := v_b_irpf      + r.imp; end if;
    end loop;
  end if;

  -- Horas HCOMP/MONT hechas en un puesto que la persona no tiene en su
  -- historial (cubrio otro servicio). calcular_nomina_devengos las descarta al
  -- filtrar por puesto, asi que se recogen aqui a la tarifa del puesto DONDE se
  -- hicieron. Las REG no: son jornada y su salario base ya se cobra por el
  -- historial, asi que sumarlas seria pagar dos veces (solo se avisa en Gestion).
  select coalesce(sum(round(hs.horas * coalesce(
           public.get_puesto_precio_hora(hs.puesto_id, hs.tipo_hora_id, p_desde), 0), 2)), 0)
    into v_huerf_total
  from public.get_horas_sin_historial(
         p_personal_id, p_desde, p_hasta, p_empresa_id, p_historial_ids) hs
  where hs.tipo_hora_id in (2, 3) and not hs.sin_ningun_historial;

  v_b_comunes   := v_b_comunes   + v_huerf_total;
  v_b_mei       := v_b_mei       + v_huerf_total;
  v_b_desempleo := v_b_desempleo + v_huerf_total;
  v_b_formacion := v_b_formacion + v_huerf_total;
  v_b_irpf      := v_b_irpf      + v_huerf_total;

  if v_extras > 0 then
    if v_manual and p_manual_pagas_incluidas then
      v_pe_base := v_manual_total - v_base_total;
    else
      v_pe_base := public.prorrata_pagas_extra(v_base_total, v_extras);
    end if;
    select coalesce(sum(public.prorrata_pagas_extra(c.importe, v_extras)), 0) into v_pe_compl
    from public.get_personal_complementos_vigentes(p_personal_id, p_desde) c
    where not (c.id = any(v_manual_excl)) and c.prorratea_en_extra and c.tipo = 'fijo' and c.unidad = 'mensual';
  end if;

  -- La prorrata de pagas extra SIEMPRE cotiza (art. 147 LGSS), se devengue o no.
  -- Al IRPF solo va si se devenga (es el devengado real).
  v_b_comunes   := v_b_comunes   + v_pe_base + v_pe_compl;
  v_b_mei       := v_b_mei       + v_pe_base + v_pe_compl;
  v_b_desempleo := v_b_desempleo + v_pe_base + v_pe_compl;
  v_b_formacion := v_b_formacion + v_pe_base + v_pe_compl;
  if coalesce(v_prorrateo, false) then
    v_b_irpf := v_b_irpf + v_pe_base + v_pe_compl;
  end if;

  if v_manual then
    return query select 10, 'devengo'::text, 'Salario base'::text, v_manual_detalle,
      null::numeric, null::numeric,
      case p_manual_modo when 'diario' then v_manual_dias::numeric
                         when 'hora' then v_manual_horas else 1 end,
      p_manual_importe, v_base_total, null::text, v_todas;
    return query
    select cp.orden, 'devengo'::text, cp.concepto,
      'no incluido en el importe manual'::text,
      null::numeric, null::numeric, null::numeric, null::numeric,
      cp.importe, null::text, v_todas
    from public.get_conceptos_puesto_nomina(
           p_personal_id, p_desde, p_hasta, p_empresa_id, p_historial_ids,
           p_base_calculo, p_ajuste_jornada) cp
    where not (cp.concepto = any(coalesce(p_manual_conceptos_dentro, '{}'::text[])));
  else
    return query
    select x.orden, 'devengo'::text, x.concepto, null::text, null::numeric, null::numeric,
           x.cantidad, x.precio, round(x.importe, 2), null::text, v_todas
    from (
      select min(d.orden) as orden, d.concepto, sum(d.importe) as importe,
             sum(d.cantidad) as cantidad,
             case when count(distinct d.precio) = 1 then min(d.precio) end as precio
      from public.historiales_laborales h
      cross join lateral public.calcular_nomina_devengos(
        h.id, p_desde, p_hasta, p_base_calculo, p_ajuste_jornada,
        p_horas_otros_puestos and h.id = hp.id) d
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
      v_transporte, null::text, v_transp_cotiza;
  end if;

  return query
  select (100 + row_number() over (order by c.orden_calculo, c.nombre))::integer,
    'devengo'::text, c.nombre,
    case c.tipo when 'porcentaje' then format('%s%% sobre base', round(c.porcentaje*100,2))
      else case c.unidad
        when 'diario' then format('%s€ × %s días', c.importe, v_dias_trab)
        when 'por_hora' then format('%s€ × horas %s', c.importe, c.medida_horas)
        else format('%s€/mes', c.importe) end end,
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
    null::text, coalesce(c.cotiza_en, v_todas)
  from public.get_personal_complementos_vigentes(p_personal_id, p_desde) c
  where not (c.id = any(v_manual_excl));

  -- Los anadidos a mano, tras los asignados. Si coinciden en concepto salen las
  -- dos lineas: es lo pedido (se suman, no se sustituyen).
  if p_complementos_extra is not null and jsonb_typeof(p_complementos_extra) = 'array' then
    return query
    select (300 + row_number() over (order by c.orden_calculo, c.nombre))::integer,
      'devengo'::text, c.nombre, 'añadido a mano en esta nómina'::text,
      null::numeric, null::numeric, null::numeric, null::numeric,
      round(coalesce((e->>'importe')::numeric, 0), 2), null::text,
      coalesce(c.cotiza_en, v_todas)
    from jsonb_array_elements(p_complementos_extra) e
    join public.nomina_complementos_catalogo c on c.id = (e->>'complemento_id')::bigint;
  end if;

  return query
  select (200 + row_number() over (order by hs.tipo_hora, hs.puesto))::integer,
    'devengo'::text,
    case hs.tipo_hora_id when 2 then 'Horas complementarias de otro puesto'
                         else 'Montaje de otro puesto' end,
    format('%s h como %s × %s€/h (sin contrato de ese puesto)',
           round(hs.horas, 2), hs.puesto,
           round(coalesce(public.get_puesto_precio_hora(hs.puesto_id, hs.tipo_hora_id, p_desde), 0), 4)),
    null::numeric, null::numeric,
    round(hs.horas, 2),
    round(coalesce(public.get_puesto_precio_hora(hs.puesto_id, hs.tipo_hora_id, p_desde), 0), 4),
    round(hs.horas * coalesce(
      public.get_puesto_precio_hora(hs.puesto_id, hs.tipo_hora_id, p_desde), 0), 2),
    null::text, v_todas
  from public.get_horas_sin_historial(
         p_personal_id, p_desde, p_hasta, p_empresa_id, p_historial_ids) hs
  where hs.tipo_hora_id in (2, 3) and not hs.sin_ningun_historial;

  if coalesce(v_prorrateo, false) and (v_pe_base + v_pe_compl) <> 0 then
    return query select 20, 'devengo'::text, 'Prorrateo pagas extra'::text,
      format('%s pagas/año (12 + %s extra) · %s × 8,333%% de cada concepto', v_pagas, v_extras, v_extras),
      null::numeric, round(v_extras * 0.08333, 6), null::numeric, null::numeric,
      v_pe_base + v_pe_compl, null::text, v_todas;
    return query select 21, 'devengo'::text, 'Salario base'::text,
      case when v_manual and p_manual_pagas_incluidas
        then format('%s€ − %s€ (ya incluida en el importe manual)', v_manual_total, round(v_base_total,2))
        else format('%s × 8,333%% de %s€', v_extras, round(v_base_total,2)) end,
      round(v_base_total, 2), round(v_extras * 0.08333, 6), null::numeric, null::numeric,
      v_pe_base, 'prorrateo_extra'::text, v_todas;
    return query
    select (22 + row_number() over (order by c.orden_calculo, c.nombre))::integer,
      'devengo'::text, c.nombre, format('%s × 8,333%% de %s€', v_extras, c.importe),
      c.importe, round(v_extras * 0.08333, 6), null::numeric, null::numeric,
      public.prorrata_pagas_extra(c.importe, v_extras), 'prorrateo_extra'::text, v_todas
    from public.get_personal_complementos_vigentes(p_personal_id, p_desde) c
    where not (c.id = any(v_manual_excl)) and c.prorratea_en_extra and c.tipo = 'fijo' and c.unidad = 'mensual';
  end if;

  v_bruto := v_dev_puestos + v_transporte + v_compl_total + v_extra_total + v_huerf_total
    + (case when coalesce(v_prorrateo, false) then v_pe_base + v_pe_compl else 0 end);

  -- TOPES DE COTIZACION (2026-08-14). Bases minima/maxima por grupo de
  -- cotizacion (BOE, cotizacion_topes), grupo del historial PREDOMINANTE (hp) --
  -- mismo criterio que el resto de datos "de la persona" (tipos de cotizacion,
  -- numero de pagas). Solo topan comunes/mei/desempleo/formacion; el IRPF
  -- NUNCA se topa (no es una base de Seguridad Social).
  --
  -- "Dias de alta" para prorratear el tope = los mismos que ya usa el salario
  -- base (dias_nomina: base 30 si el mes esta cubierto desde el dia 1, dias
  -- reales si entra a mitad) -- decision del usuario, para no introducir un
  -- tercer criterio de dias distinto de los dos que ya conviven en el motor.
  -- Grupos 1-7 cotizan en €/mes (se prorratea /30 igual que el salario base);
  -- grupos 8-11 en €/dia (el tope del periodo es la tarifa diaria x dias, sin
  -- dividir entre 30).
  --
  -- Si el historial no tiene grupo_cotizacion asignado, NO se topa nada --
  -- decision del usuario: no bloquear la nomina ni inventar un grupo, solo
  -- avisar (linea 603 mas abajo). A 2026-08-14 el 60% de los historiales
  -- vigentes no lo tienen asignado todavia.
  --
  -- MINIMO Y JORNADA PARCIAL (2026-08-28, corregido 2026-08-31). El maximo no
  -- se prorratea por jornada -- es un techo unico del sistema (por eso el
  -- maximo mensual de cotizacion_topes es identico en los grupos 1-7).
  --
  -- El minimo si distingue tiempo completo de tiempo parcial, pero NO con un
  -- prorrateo simple del minimo mensual por el coeficiente de jornada -- la
  -- SS fija para tiempo parcial una tarifa MINIMA POR HORA propia (BOE,
  -- columna "Tiempo Parcial", cotizacion_topes.tiempo_parcial_hora), sobre las
  -- horas teoricas del periodo (horas_teoricas_jornada, la misma funcion que
  -- ya usa el ajuste de jornada en nomina_calculo.sql) redondeadas al entero
  -- mas cercano. La primera version (coeficiente_temporalidad_miles) parecia
  -- correcta con Pelayo Fernandez (historial 4164, grupo 6, 17h/40h, agosto
  -- 2026: bruto 701,29€ > minimo prorrateado 605,37€, no topa en ningun caso)
  -- pero ese caso no discrimina entre formulas -- ambas dan "no topa". La
  -- diferencia aparecio y se verifico al centimo contra el a3nom real con
  -- Vanesa Garcia Isidro (historial 5482, 7,5h/40h: horas teoricas 31,5 -> 32h
  -- x 8,58€ = 274,56€), Santiago Puerta (historial 4882, 28,5h/40h: 119,7 ->
  -- 120h x 8,58€ = 1.029,60€) y Maria Eugenia de Ugarriza (historial 5913,
  -- 32h/40h: 134,4 -> 134h x 8,58€ = 1.149,72€) -- las tres coincidian con el
  -- coeficiente y solo la formula por horas daba el importe real.
  if hp.grupo_cotizacion is not null then
    select t.* into v_tope
    from public.cotizacion_topes t
    where t.grupo_cotizacion = hp.grupo_cotizacion
      and t.vigente_desde <= p_hasta
    order by t.vigente_desde desc
    limit 1;

    if v_tope.id is not null then
      v_tope_dias := public.dias_nomina(
        greatest(hp.fecha_alta, p_desde),
        least(coalesce(hp.fecha_baja, p_hasta), p_hasta),
        public.tiene_alta_continua_desde_inicio_mes(hp.personal_id, greatest(hp.fecha_alta, p_desde), hp.empresa_id));
      v_coef_jornada := coalesce(hp.coeficiente_temporalidad_miles, 1000) / 1000.0;

      if v_tope.unidad = 'mensual' then
        if v_coef_jornada < 1 and v_tope.tiempo_parcial_hora is not null then
          v_tope_min := round(v_tope.tiempo_parcial_hora * round(public.horas_teoricas_jornada(
            greatest(hp.fecha_alta, p_desde),
            least(coalesce(hp.fecha_baja, p_hasta), p_hasta),
            hp.jornada
          )), 2);
        else
          v_tope_min := round(v_tope.base_minima_mensual * v_tope_dias / 30.0, 2);
        end if;
        v_tope_max := round(v_tope.base_maxima_mensual * v_tope_dias / 30.0, 2);
      else
        -- Grupos 8-11 (unidad diaria): sin caso real verificado todavia, se
        -- mantiene el prorrateo por coeficiente de jornada de la version
        -- anterior. Revisar si aparece un caso real de tiempo parcial en
        -- estos grupos.
        v_tope_min := round(v_tope.base_minima_diaria * v_tope_dias * v_coef_jornada, 2);
        v_tope_max := round(v_tope.base_maxima_diaria * v_tope_dias, 2);
      end if;

      v_b_comunes   := least(greatest(v_b_comunes,   v_tope_min), v_tope_max);
      v_b_mei       := least(greatest(v_b_mei,       v_tope_min), v_tope_max);
      v_b_desempleo := least(greatest(v_b_desempleo, v_tope_min), v_tope_max);
      v_b_formacion := least(greatest(v_b_formacion, v_tope_min), v_tope_max);
    end if;
  end if;

  -- Las bases ya vienen sumadas concepto a concepto segun su cotiza_en.
  v_base_cc := v_b_comunes;
  v_base_cp := v_b_desempleo;
  v_base_irpf := v_b_irpf;

  v_d_comunes   := round(v_b_comunes   * coalesce(hp.cotizacion_comunes_pct, 0), 2);
  v_d_mei       := round(v_b_mei       * coalesce(hp.cotizacion_mei_pct, 0), 2);
  v_d_desempleo := round(v_b_desempleo * coalesce(hp.cotizacion_desempleo_pct, 0), 2);
  v_d_formacion := round(v_b_formacion * coalesce(hp.cotizacion_formacion_pct, 0), 2);
  v_d_irpf      := round(v_b_irpf      * coalesce(v_irpf, 0), 2);
  v_ded_total   := v_d_comunes + v_d_mei + v_d_desempleo + v_d_formacion + v_d_irpf;

  return query select 500, 'total'::text, 'Total devengado (bruto)'::text, null::text, null::numeric, null::numeric, null::numeric, null::numeric, round(v_bruto,2), null::text, null::text[];
  if hp.grupo_cotizacion is null then
    return query select 603, 'base'::text, 'Grupo de cotización sin asignar'::text,
      'Esta persona no tiene grupo de cotización en su historial laboral: no se han comprobado los topes de cotización de este periodo.'::text,
      null::numeric, null::numeric, null::numeric, null::numeric, 0::numeric, null::text, null::text[];
  end if;
  if not coalesce(v_prorrateo, false) and (v_pe_base + v_pe_compl) <> 0 then
    return query select 599, 'base'::text, 'P.P. pagas extra (solo cotiza)'::text,
      format('%s pagas/año · %s × 8,333%% · no se devenga, suma a la base de S.S.', v_pagas, v_extras),
      null::numeric, round(v_extras * 0.08333, 6), null::numeric, null::numeric,
      v_pe_base + v_pe_compl, null::text, null::text[];
  end if;
  return query select 600, 'base'::text, 'Base contingencias comunes'::text, null::text, null::numeric, null::numeric, null::numeric, null::numeric, round(v_base_cc,2), null::text, null::text[];
  return query select 601, 'base'::text, 'Base contingencias profesionales'::text,
    case when v_b_formacion <> v_b_desempleo
      then format('formación cotiza sobre %s€', round(v_b_formacion,2)) end,
    null::numeric, null::numeric, null::numeric, null::numeric, round(v_base_cp,2), null::text, null::text[];
  return query select 602, 'base'::text, 'Base IRPF'::text, null::text, null::numeric, null::numeric, null::numeric, null::numeric, round(v_base_irpf,2), null::text, null::text[];
  return query select 700, 'deduccion'::text, 'Contingencias comunes'::text,
    format('%s%% sobre %s€', round(coalesce(hp.cotizacion_comunes_pct,0)*100,3), round(v_b_comunes,2)),
    round(v_b_comunes,2), hp.cotizacion_comunes_pct, null::numeric, null::numeric, v_d_comunes, null::text, null::text[];
  return query select 701, 'deduccion'::text, 'MEI'::text,
    format('%s%% sobre %s€', round(coalesce(hp.cotizacion_mei_pct,0)*100,3), round(v_b_mei,2)),
    round(v_b_mei,2), hp.cotizacion_mei_pct, null::numeric, null::numeric, v_d_mei, null::text, null::text[];
  return query select 702, 'deduccion'::text, 'Desempleo'::text,
    format('%s%% sobre %s€', round(coalesce(hp.cotizacion_desempleo_pct,0)*100,3), round(v_b_desempleo,2)),
    round(v_b_desempleo,2), hp.cotizacion_desempleo_pct, null::numeric, null::numeric, v_d_desempleo, null::text, null::text[];
  return query select 703, 'deduccion'::text, 'Formación profesional'::text,
    format('%s%% sobre %s€', round(coalesce(hp.cotizacion_formacion_pct,0)*100,3), round(v_b_formacion,2)),
    round(v_b_formacion,2), hp.cotizacion_formacion_pct, null::numeric, null::numeric, v_d_formacion, null::text, null::text[];
  return query select 704, 'deduccion'::text, 'IRPF'::text,
    format('%s%% sobre %s€', round(coalesce(v_irpf,0)*100,3), round(v_b_irpf,2)),
    round(v_b_irpf,2), v_irpf, null::numeric, null::numeric, v_d_irpf, null::text, null::text[];
  return query select 800, 'total'::text, 'Total deducciones'::text, null::text, null::numeric, null::numeric, null::numeric, null::numeric, v_ded_total, null::text, null::text[];
  return query select 810, 'total'::text, 'Líquido a percibir'::text, null::text, null::numeric, null::numeric, null::numeric, null::numeric, round(v_bruto - v_ded_total, 2), null::text, null::text[];
  return;
end;
$$;

revoke all on function public.calcular_nomina_persona(integer, date, date, integer, text, text, bigint[], numeric, text, boolean, bigint[], boolean, jsonb, text[], boolean) from public;
grant execute on function public.calcular_nomina_persona(integer, date, date, integer, text, text, bigint[], numeric, text, boolean, bigint[], boolean, jsonb, text[], boolean) to authenticated;
