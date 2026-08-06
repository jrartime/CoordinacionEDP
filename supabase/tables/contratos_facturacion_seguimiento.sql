-- ============================================================================
--  Fase 5 de facturacion: RPCs de seguimiento para el panel de control por
--  contrato. Ambas reutilizan registros_detalle.estado_facturacion (Fase 2)
--  en vez de repetir la logica de contratos_facturacion_lineas/_preparaciones,
--  para no tener dos criterios distintos de lo mismo.
--  SECURITY INVOKER: registros_detalle ya es security_invoker, así que el RLS
--  de registros (alcance por contrato) se respeta igual a traves del RPC.
--  Filtran por contrato_facturable_id (Fase 6: registros_facturacion_destino),
--  no por contrato_id a secas, para que el seguimiento de un contrato incluya
--  las horas que se le redirigen desde otro. Nota: si quien consulta gestiona
--  el contrato destino pero NO el contrato donde se trabajo de verdad, el RLS
--  de "registros" seguira ocultando esas filas (esta pensado para quien
--  gestiona ambos, que es a quien se le permite crear la redireccion).
--  Requiere registros_detalle_apuntes.sql (estado_facturacion,
--  contrato_facturable_id) y contratos_facturacion_preparaciones.sql.
-- ============================================================================

create or replace function public.get_facturacion_seguimiento_mensual(
  p_contrato_id integer,
  p_desde date default null,
  p_hasta date default null
)
returns table (
  mes date,
  estado_facturacion text,
  registros bigint,
  horas numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    date_trunc('month', rd.fecha)::date as mes,
    rd.estado_facturacion,
    count(*) as registros,
    coalesce(sum(rd.horas), 0) as horas
  from public.registros_detalle rd
  where rd.contrato_facturable_id = p_contrato_id
    and (p_desde is null or rd.fecha >= p_desde)
    and (p_hasta is null or rd.fecha <= p_hasta)
  group by 1, 2
  order by 1, 2;
$$;

revoke all on function public.get_facturacion_seguimiento_mensual(integer, date, date) from public;
grant execute on function public.get_facturacion_seguimiento_mensual(integer, date, date) to authenticated;

-- Desglose de las horas ya facturadas por factura real, para poder responder
-- "en que factura entro este tramo" sin tener que abrir cada preparacion.
create or replace function public.get_facturacion_horas_por_factura(
  p_contrato_id integer,
  p_desde date default null,
  p_hasta date default null
)
returns table (
  contrato_facturacion_id bigint,
  registros bigint,
  horas numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    rd.facturacion_factura_id as contrato_facturacion_id,
    count(*) as registros,
    coalesce(sum(rd.horas), 0) as horas
  from public.registros_detalle rd
  where rd.contrato_facturable_id = p_contrato_id
    and rd.estado_facturacion = 'Facturado'
    and (p_desde is null or rd.fecha >= p_desde)
    and (p_hasta is null or rd.fecha <= p_hasta)
  group by 1
  order by 1;
$$;

revoke all on function public.get_facturacion_horas_por_factura(integer, date, date) from public;
grant execute on function public.get_facturacion_horas_por_factura(integer, date, date) to authenticated;
