-- Fase 1 del plan "catalogo de conceptos de nomina" (ver memoria
-- nominas-conceptos-catalogo): renombrar nomina_complementos_catalogo a
-- nomina_conceptos_catalogo y ampliar su alcance mas alla de los 8
-- complementos/pluses *asignables* documentados en nomina_complementos.sql.
--
-- A fecha de esta migracion la tabla en produccion ya tenia 16 filas (no solo
-- las 8 sembradas en el repo): alguien habia anadido a mano Plus de Festivos,
-- Horas complementarias, Descuento Absentismo, Plus de disponibilidad, Parte
-- Proporcional de vacaciones, Liquidacion Vacaciones no Disfrutadas,
-- Complemento personal, Prestacion enfermedad Cargo Empresa y Enfermedad --
-- estas 4 ultimas tocan el terreno de IT/Finiquito que el usuario decidio
-- dejar diferido como Fase 4 (ver nominas-incapacidad-transitoria-pendiente y
-- nominas-finiquito-pendiente), pero como catalogo ya existian y son
-- asignables a mano igual que el resto -- no se tocan mas alla de clasificarlas.
--
-- Esta fase NO cambia ningun calculo: solo renombra, anade columnas de
-- metadatos (naturaleza/categoria/asignable) y relaja el check de coherencia
-- para permitir en el futuro (Fase 2) filas no asignables (salario base,
-- deducciones/cotizaciones, IRPF) que hoy no existen en la tabla.

alter table public.nomina_complementos_catalogo
  rename to nomina_conceptos_catalogo;

comment on table public.nomina_conceptos_catalogo is
  'Diccionario de conceptos de nomina y su codigo en el programa externo de la empresa. asignable=true son complementos/pluses que se pueden asignar a una persona (Fase 3, personal_complementos) o anadir a mano a una nomina concreta; asignable=false (a partir de la Fase 2) son conceptos que calcula el motor y nunca se asignan (salario base, cotizaciones, IRPF...).';

-- ============================================================================
-- Columnas nuevas: metadatos de clasificacion, no afectan a ningun calculo.
-- ============================================================================

alter table public.nomina_conceptos_catalogo
  add column if not exists naturaleza text not null default 'devengo',
  add column if not exists categoria text,
  add column if not exists asignable boolean not null default true;

alter table public.nomina_conceptos_catalogo
  drop constraint if exists nomina_conceptos_naturaleza_chk,
  add constraint nomina_conceptos_naturaleza_chk
    check (naturaleza in ('devengo', 'deduccion', 'ajuste'));

alter table public.nomina_conceptos_catalogo
  drop constraint if exists nomina_conceptos_categoria_chk,
  add constraint nomina_conceptos_categoria_chk
    check (categoria in ('salario_base', 'plus', 'complemento', 'cotizacion', 'irpf', 'ajuste', 'especial'));

comment on column public.nomina_conceptos_catalogo.naturaleza is
  'devengo/deduccion/ajuste: mismo vocabulario que nomina_lineas.seccion. Es el valor documental por defecto -- el motor sigue decidiendo la seccion real linea a linea en calcular_nomina_persona/emitir_nomina.';
comment on column public.nomina_conceptos_catalogo.categoria is
  'Agrupacion del concepto: salario_base, plus, complemento, cotizacion, irpf, ajuste (anticipos/reintegros/descuentos que no son salario), especial (enfermedad, finiquito -- ver memoria nominas-incapacidad-transitoria-pendiente y nominas-finiquito-pendiente).';
comment on column public.nomina_conceptos_catalogo.asignable is
  'Si tiene sentido asignarlo a mano a una persona (Configuracion > Complementos y pluses, o "+ Anadir complemento" en Gestion). false para conceptos que solo calcula el motor y nunca se asignan (Fase 2).';

-- ============================================================================
-- Backfill de categoria para las 16 filas ya sembradas hoy (todas devengo,
-- todas asignables -- eso no cambia). Criterio: sigue el nombre literal ya
-- existente ("Plus de..." -> plus, "Complemento..." -> complemento);
-- Descuento Absentismo -> ajuste (reduce el devengo pero no es salario/plus/
-- complemento); las 4 de IT/Finiquito -> especial.
-- ============================================================================

update public.nomina_conceptos_catalogo set categoria = case nombre
  when 'Plus de transporte' then 'plus'
  when 'Plus de nocturnidad' then 'plus'
  when 'Plus de Festivos' then 'plus'
  when 'Plus de disponibilidad' then 'plus'
  when 'Complemento de movilidad' then 'complemento'
  when 'Complemento de dedicación' then 'complemento'
  when 'Complemento de antigüedad' then 'complemento'
  when 'Complemento salarial' then 'complemento'
  when 'Complemento de puesto' then 'complemento'
  when 'Complemento personal' then 'complemento'
  when 'Horas complementarias' then 'complemento'
  when 'Descuento Absentismo' then 'ajuste'
  when 'Parte Proporcional de vacaciones' then 'especial'
  when 'Liquidación Vacaciones no Disfrutadas' then 'especial'
  when 'Prestación enfermedad Cargo Empresa' then 'especial'
  when 'Enfermedad' then 'especial'
  else categoria
end
where categoria is null;

-- Si aparece una fila que el criterio de arriba no cubre, mejor fallar aqui
-- que dejarla en NULL silenciosamente.
do $$
declare v_sin_clasificar integer;
begin
  select count(*) into v_sin_clasificar
  from public.nomina_conceptos_catalogo where categoria is null;
  if v_sin_clasificar > 0 then
    raise exception
      'Quedan % filas de nomina_conceptos_catalogo sin categoria tras el backfill -- revisar antes de forzar NOT NULL.',
      v_sin_clasificar;
  end if;
end $$;

alter table public.nomina_conceptos_catalogo
  alter column categoria set not null;

-- ============================================================================
-- Relajar tipo/coherencia para permitir filas NO asignables (Fase 2).
-- ============================================================================

alter table public.nomina_conceptos_catalogo
  drop constraint if exists nomina_complementos_tipo_chk;
alter table public.nomina_conceptos_catalogo
  add constraint nomina_conceptos_tipo_chk
  check (
    (asignable and tipo in ('fijo', 'porcentaje', 'variable'))
    or (not asignable and tipo is null)
  );

alter table public.nomina_conceptos_catalogo
  drop constraint if exists nomina_complementos_coherencia_chk;
alter table public.nomina_conceptos_catalogo
  add constraint nomina_conceptos_coherencia_chk
  check (
    (tipo = 'fijo' and unidad is not null and bases_aplicables is null)
    or
    (tipo = 'porcentaje' and unidad is null and medida_horas is null
      and bases_aplicables is not null and cardinality(bases_aplicables) > 0)
    or
    (tipo = 'variable' and unidad is null and medida_horas is null and bases_aplicables is null)
    or
    (tipo is null and unidad is null and medida_horas is null and bases_aplicables is null and not asignable)
  );

-- ============================================================================
-- Politicas RLS: mismo criterio de siempre (admin-only), renombradas para
-- reflejar la tabla nueva.
-- ============================================================================

drop policy if exists "nomina_complementos_catalogo_admin_can_read" on public.nomina_conceptos_catalogo;
create policy "nomina_conceptos_catalogo_admin_can_read"
on public.nomina_conceptos_catalogo for select to authenticated
using (public.is_coordinacion_admin());

drop policy if exists "nomina_complementos_catalogo_admin_can_insert" on public.nomina_conceptos_catalogo;
create policy "nomina_conceptos_catalogo_admin_can_insert"
on public.nomina_conceptos_catalogo for insert to authenticated
with check (public.is_coordinacion_admin());

drop policy if exists "nomina_complementos_catalogo_admin_can_update" on public.nomina_conceptos_catalogo;
create policy "nomina_conceptos_catalogo_admin_can_update"
on public.nomina_conceptos_catalogo for update to authenticated
using (public.is_coordinacion_admin())
with check (public.is_coordinacion_admin());

drop policy if exists "nomina_complementos_catalogo_admin_can_delete" on public.nomina_conceptos_catalogo;
create policy "nomina_conceptos_catalogo_admin_can_delete"
on public.nomina_conceptos_catalogo for delete to authenticated
using (public.is_coordinacion_admin());

-- ============================================================================
-- Funciones que referenciaban la tabla por su nombre literal en el cuerpo:
-- se recrean identicas, solo con el nombre de la tabla actualizado. Sin
-- cambios de logica ni de firma (comprobado contra pg_proc.prosrc antes de
-- escribir esta migracion -- eran las 4 unicas).
-- ============================================================================

create or replace function public.set_personal_complemento_tipo()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
declare
  v_catalogo public.nomina_conceptos_catalogo;
begin
  select * into v_catalogo
  from public.nomina_conceptos_catalogo
  where id = new.complemento_id;

  if v_catalogo.id is null then
    raise exception 'complemento_id % no existe en nomina_conceptos_catalogo', new.complemento_id;
  end if;

  if v_catalogo.tipo = 'variable' then
    if new.tipo is null then
      raise exception
        '"%" es un complemento de tipo variable: indica si esta asignacion es fija o porcentual.',
        v_catalogo.nombre;
    end if;
  else
    new.tipo := v_catalogo.tipo;
    new.unidad := v_catalogo.unidad;
    new.medida_horas := v_catalogo.medida_horas;
    new.bases_aplicables := v_catalogo.bases_aplicables;
  end if;

  return new;
end;
$function$;

create or replace function public.get_codigo_nomina_concepto(p_concepto text)
returns integer
language sql
stable
set search_path to 'public'
as $function$
  select coalesce(
    (select c.codigo_nomina
       from public.nomina_conceptos_catalogo c
      where lower(c.nombre) = lower(trim(p_concepto))
      limit 1),
    case lower(trim(coalesce(p_concepto, '')))
      when 'plus de disponibilidad' then 93
      when 'horas complementarias' then 67
      when 'horas complementarias de otro puesto' then 67
      when 'montaje de otro puesto' then 60
      when 'plus festivo trabajado' then 12
      when 'descuento por absentismo' then 790
      when 'prorrateo pagas extra' then 30
      when 'p.p. pagas extra (solo cotiza)' then 30
      else null
    end);
$function$;

create or replace function public.get_personal_complementos_vigentes(p_personal_id integer, p_fecha date default current_date)
returns table(id bigint, complemento_id bigint, nombre text, codigo_nomina integer, tipo text, unidad text, medida_horas text, bases_aplicables text[], importe numeric, porcentaje numeric, prorratea_en_extra boolean, orden_calculo integer, fecha_desde date, fecha_hasta date, cotiza_en text[])
language sql
stable
set search_path to 'public'
as $function$
  select
    pc.id,
    pc.complemento_id,
    c.nombre,
    c.codigo_nomina,
    pc.tipo,
    pc.unidad,
    pc.medida_horas,
    pc.bases_aplicables,
    pc.importe,
    pc.porcentaje,
    pc.prorratea_en_extra,
    c.orden_calculo,
    pc.fecha_desde,
    pc.fecha_hasta,
    c.cotiza_en
  from public.personal_complementos pc
  join public.nomina_conceptos_catalogo c on c.id = pc.complemento_id
  where pc.personal_id = p_personal_id
    and pc.fecha_desde <= p_fecha
    and (pc.fecha_hasta is null or pc.fecha_hasta >= p_fecha)
  order by c.orden_calculo, c.nombre;
$function$;

create or replace function public.calcular_nomina_persona(p_personal_id integer, p_desde date, p_hasta date, p_empresa_id integer default null::integer, p_base_calculo text default null::text, p_ajuste_jornada text default null::text, p_historial_ids bigint[] default null::bigint[], p_manual_importe numeric default null::numeric, p_manual_modo text default null::text, p_manual_pagas_incluidas boolean default false, p_manual_complementos bigint[] default null::bigint[], p_manual_transporte boolean default false, p_complementos_extra jsonb default null::jsonb, p_manual_conceptos_dentro text[] default null::text[], p_horas_otros_puestos boolean default true, p_aplicar_topes_cotizacion boolean default true)
returns table(orden integer, seccion text, concepto text, detalle text, base numeric, tipo numeric, cantidad numeric, precio numeric, importe numeric, detalle_de text, cotiza_en text[])
language plpgsql
stable
set search_path to 'public'
as $function$
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
    select coalesce(sum(cp.importe), 0) into v_manual_fuera
    from public.get_conceptos_puesto_nomina(
           p_personal_id, p_desde, p_hasta, p_empresa_id, p_historial_ids,
           p_base_calculo, p_ajuste_jornada) cp
    where not (cp.concepto = any(coalesce(p_manual_conceptos_dentro, '{}'::text[])));

    v_dev_puestos := v_base_total + v_manual_fuera;
  end if;

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

  select c.cotiza_en into v_transp_cotiza
  from public.nomina_conceptos_catalogo c where c.codigo_nomina = 398 limit 1;
  v_transp_cotiza := coalesce(v_transp_cotiza, v_todas);
  if v_transporte <> 0 then
    if 'comunes'   = any(v_transp_cotiza) then v_b_comunes   := v_b_comunes   + v_transporte; end if;
    if 'mei'       = any(v_transp_cotiza) then v_b_mei       := v_b_mei       + v_transporte; end if;
    if 'desempleo' = any(v_transp_cotiza) then v_b_desempleo := v_b_desempleo + v_transporte; end if;
    if 'formacion' = any(v_transp_cotiza) then v_b_formacion := v_b_formacion + v_transporte; end if;
    if 'irpf'      = any(v_transp_cotiza) then v_b_irpf      := v_b_irpf      + v_transporte; end if;
  end if;

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

  if p_complementos_extra is not null and jsonb_typeof(p_complementos_extra) = 'array' then
    for r in
      select c.id, c.nombre, c.codigo_nomina, c.orden_calculo, c.cotiza_en,
             round(coalesce((e->>'importe')::numeric, 0), 2) as imp
      from jsonb_array_elements(p_complementos_extra) e
      join public.nomina_conceptos_catalogo c on c.id = (e->>'complemento_id')::bigint
    loop
      v_extra_total := v_extra_total + r.imp;
      if 'comunes'   = any(coalesce(r.cotiza_en, v_todas)) then v_b_comunes   := v_b_comunes   + r.imp; end if;
      if 'mei'       = any(coalesce(r.cotiza_en, v_todas)) then v_b_mei       := v_b_mei       + r.imp; end if;
      if 'desempleo' = any(coalesce(r.cotiza_en, v_todas)) then v_b_desempleo := v_b_desempleo + r.imp; end if;
      if 'formacion' = any(coalesce(r.cotiza_en, v_todas)) then v_b_formacion := v_b_formacion + r.imp; end if;
      if 'irpf'      = any(coalesce(r.cotiza_en, v_todas)) then v_b_irpf      := v_b_irpf      + r.imp; end if;
    end loop;
  end if;

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

  if p_complementos_extra is not null and jsonb_typeof(p_complementos_extra) = 'array' then
    return query
    select (300 + row_number() over (order by c.orden_calculo, c.nombre))::integer,
      'devengo'::text, c.nombre, 'añadido a mano en esta nómina'::text,
      null::numeric, null::numeric, null::numeric, null::numeric,
      round(coalesce((e->>'importe')::numeric, 0), 2), null::text,
      coalesce(c.cotiza_en, v_todas)
    from jsonb_array_elements(p_complementos_extra) e
    join public.nomina_conceptos_catalogo c on c.id = (e->>'complemento_id')::bigint;
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

  if p_aplicar_topes_cotizacion and hp.grupo_cotizacion is not null then
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
        v_tope_min := round(v_tope.base_minima_diaria * v_tope_dias * v_coef_jornada, 2);
        v_tope_max := round(v_tope.base_maxima_diaria * v_tope_dias, 2);
      end if;

      v_b_comunes   := least(greatest(v_b_comunes,   v_tope_min), v_tope_max);
      v_b_mei       := least(greatest(v_b_mei,       v_tope_min), v_tope_max);
      v_b_desempleo := least(greatest(v_b_desempleo, v_tope_min), v_tope_max);
      v_b_formacion := least(greatest(v_b_formacion, v_tope_min), v_tope_max);
    end if;
  end if;

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
  if p_aplicar_topes_cotizacion and hp.grupo_cotizacion is null then
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
$function$;

-- Sin revoke/grant aqui a proposito: CREATE OR REPLACE FUNCTION conserva el
-- ACL que ya tuviera cada funcion (comprobado en pg_proc.proacl antes de
-- escribir esta migracion). Tocar permisos no es parte de esta fase.
