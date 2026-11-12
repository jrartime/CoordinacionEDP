-- Periodo de facturación de cada factura (esquema coordinacion, Portal Laboral).
--
-- Una factura tiene su fecha de emisión, pero corresponde a la facturación de
-- un periodo que casi nunca coincide con ella: periodo_desde / periodo_hasta
-- (ambos inclusive; un mes natural es del día 1 al último día, pero puede ser
-- un tramo de un mes —«1 al 26 jun 26»— o varios meses —«jun, jul, ago, sep 26»—).
--
-- Cómo se rellenaron las facturas existentes (por orden de prioridad):
--   1. Generada desde una preparación: el periodo de la preparación.
--   2. El mes (o meses) que dice la propia referencia: «AFD - sep 2026»,
--      «Apertura Colegios - jun, jul, ago, sep 26», «CB Teatinos - 1 al 26 jun 26».
--   3. Rectificativa (serie R..., «F.Rectif. F26/113»): el periodo de la factura
--      que rectifica.
--   4. Por la fecha: de finales de mes (día 16 en adelante) es de ese mismo mes;
--      de principios (hasta el día 15), del mes anterior.
-- No se guarda de cuál de las cuatro vías salió: las de la 4 son una suposición
-- y se corrigen a mano desde el formulario de la factura.

alter table coordinacion.contratos_facturacion
  add column if not exists periodo_desde date,
  add column if not exists periodo_hasta date;

alter table coordinacion.contratos_facturacion
  drop constraint if exists contratos_facturacion_periodo_check;
alter table coordinacion.contratos_facturacion
  add constraint contratos_facturacion_periodo_check
  check (periodo_hasta is null or periodo_desde is null or periodo_hasta >= periodo_desde);

comment on column coordinacion.contratos_facturacion.periodo_desde is
  'Primer día del periodo que factura esta factura (distinto de la fecha de emisión).';
comment on column coordinacion.contratos_facturacion.periodo_hasta is
  'Último día (inclusive) del periodo que factura esta factura.';

create index if not exists contratos_facturacion_periodo_idx
  on coordinacion.contratos_facturacion (periodo_desde);

-- Las facturas generadas desde una preparación heredan su periodo.
create or replace function coordinacion.crear_factura_desde_preparacion(
  p_preparacion_id bigint,
  p_fecha date default null,
  p_presupuesto_id bigint default null
) returns bigint
language plpgsql
set search_path to 'coordinacion', 'extensions'
as $function$
declare
  v_prep record;
  v_factura_id bigint;
begin
  select * into v_prep
  from coordinacion.contratos_facturacion_preparaciones
  where id = p_preparacion_id;

  if v_prep.id is null then
    raise exception 'La preparación #% no existe.', p_preparacion_id;
  end if;
  if v_prep.estado <> 'vigente' then
    raise exception 'La preparación #% no está vigente; no se puede facturar.', p_preparacion_id;
  end if;
  if v_prep.contrato_facturacion_id is not null then
    raise exception 'La preparación #% ya tiene una factura vinculada (#%).', p_preparacion_id, v_prep.contrato_facturacion_id;
  end if;

  if p_presupuesto_id is not null and not exists (
    select 1 from coordinacion.contratos_presupuestos
    where id = p_presupuesto_id and contrato_id = v_prep.contrato_id
  ) then
    raise exception 'El presupuesto indicado no pertenece al contrato de la preparación.';
  end if;

  insert into coordinacion.contratos_facturacion (
    fecha, contrato_id, base_imponible, iva, total, presupuesto_id, observacion,
    periodo_desde, periodo_hasta
  ) values (
    coalesce(p_fecha, v_prep.fecha_hasta, current_date),
    v_prep.contrato_id, v_prep.base_imponible, v_prep.iva, v_prep.total, p_presupuesto_id,
    'Generada desde la preparación #' || v_prep.id,
    v_prep.fecha_desde, v_prep.fecha_hasta
  )
  returning id into v_factura_id;

  update coordinacion.contratos_facturacion_preparaciones
  set contrato_facturacion_id = v_factura_id
  where id = p_preparacion_id;

  update coordinacion.contratos_facturacion_lineas
  set contrato_facturacion_id = v_factura_id
  where preparacion_id = p_preparacion_id;

  return v_factura_id;
end;
$function$;

-- ---------------------------------------------------------------- relleno inicial
-- Solo toca facturas sin periodo, así que se puede reejecutar sin pisar lo
-- corregido a mano.

-- 1. Desde la preparación vinculada.
update coordinacion.contratos_facturacion f
set periodo_desde = p.fecha_desde, periodo_hasta = p.fecha_hasta
from coordinacion.contratos_facturacion_preparaciones p
where p.contrato_facturacion_id = f.id
  and f.periodo_desde is null;

-- 2. Meses que dice la referencia.
with mes as (select array['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'] m),
tok as (
  select f.id,
    regexp_match(
      lower(f.referencia),
      '((?:(?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)[a-zñ]*\.?\s*(?:,|\sy\s|-|/)\s*)*)(?:(\d{1,2})\s*al\s*(\d{1,2})\s*(?:de\s+)?)?(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)[a-zñ]*\.?\s*(?:de\s+)?(20\d\d|\d\d)(?!\d)'
    ) g
  from coordinacion.contratos_facturacion f
  where f.periodo_desde is null and f.referencia is not null
),
parsed as (
  select t.id,
    array_position(mes.m, t.g[4]) as m_fin,
    array_position(mes.m, substring(t.g[1] from '(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)')) as m_ini,
    case when length(t.g[5]) = 2 then 2000 + t.g[5]::int else t.g[5]::int end as anio,
    t.g[2]::int as d_ini, t.g[3]::int as d_fin
  from tok t, mes
  where t.g is not null
),
rangos as (
  select id, anio, m_fin, d_ini, d_fin,
    coalesce(m_ini, m_fin) as m_ini,
    -- «oct, nov, dic, ene 26»: el primer mes es del año anterior
    case when coalesce(m_ini, m_fin) > m_fin then anio - 1 else anio end as anio_ini
  from parsed
)
update coordinacion.contratos_facturacion f
set periodo_desde = make_date(r.anio_ini, r.m_ini, case when r.d_ini between 1 and 28 then r.d_ini else 1 end),
    periodo_hasta = case
      when r.d_fin between 1 and 31
        then least(make_date(r.anio, r.m_fin, 1) + interval '1 month' - interval '1 day',
                   make_date(r.anio, r.m_fin, r.d_fin))::date
      else (make_date(r.anio, r.m_fin, 1) + interval '1 month' - interval '1 day')::date
    end
from rangos r
where r.id = f.id
  and r.m_fin between 1 and 12 and r.m_ini between 1 and 12;

-- 3 (previo). Por la fecha, para las que no son rectificativas.
update coordinacion.contratos_facturacion f
set periodo_desde = case when extract(day from f.fecha) <= 15
      then (date_trunc('month', f.fecha) - interval '1 month')::date
      else date_trunc('month', f.fecha)::date end,
    periodo_hasta = case when extract(day from f.fecha) <= 15
      then (date_trunc('month', f.fecha) - interval '1 day')::date
      else (date_trunc('month', f.fecha) + interval '1 month' - interval '1 day')::date end
where f.periodo_desde is null
  and coalesce(f.serie, '') !~* '^r'
  and coalesce(f.referencia, '') !~* '(rectif|anulaci)';

-- 4. Rectificativas: el periodo de la factura que rectifican («F.Rectif. F26/113»).
update coordinacion.contratos_facturacion r
set periodo_desde = o.periodo_desde, periodo_hasta = o.periodo_hasta
from (
  select r2.id,
    (regexp_matches(r2.referencia, 'F\.?\s*(\d{2})\s*[/_-]\s*(\d+)', 'g'))[1] as serie,
    (regexp_matches(r2.referencia, 'F\.?\s*(\d{2})\s*[/_-]\s*(\d+)', 'g'))[2] as num
  from coordinacion.contratos_facturacion r2
  where r2.periodo_desde is null
) k
join lateral (
  select o.periodo_desde, o.periodo_hasta
  from coordinacion.contratos_facturacion o
  where o.serie = k.serie and o.n_documento = k.num and o.periodo_desde is not null
  order by (o.contrato_id is not distinct from (select contrato_id from coordinacion.contratos_facturacion where id = k.id)) desc
  limit 1
) o on true
where r.id = k.id and r.periodo_desde is null;

-- Lo que quede (rectificativas sin original localizable): por la fecha.
update coordinacion.contratos_facturacion f
set periodo_desde = case when extract(day from f.fecha) <= 15
      then (date_trunc('month', f.fecha) - interval '1 month')::date
      else date_trunc('month', f.fecha)::date end,
    periodo_hasta = case when extract(day from f.fecha) <= 15
      then (date_trunc('month', f.fecha) - interval '1 day')::date
      else (date_trunc('month', f.fecha) + interval '1 month' - interval '1 day')::date end
where f.periodo_desde is null;
