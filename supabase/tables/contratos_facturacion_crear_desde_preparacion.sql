-- ============================================================================
--  crear_factura_desde_preparacion: Fase 3 de facturacion. Convierte una
--  preparacion vigente (aun sin factura) en una fila real de
--  contratos_facturacion, y vincula atomicamente la preparacion y sus lineas
--  a esa factura (contrato_facturacion_id), para que la trazabilidad
--  registro -> preparacion -> factura quede completa de un solo golpe.
-- ----------------------------------------------------------------------------
--  Deja serie/n_documento/cliente/cod_cliente/referencia sin rellenar: esos
--  datos vienen del sistema de facturacion externo y se completan a mano
--  despues, en el dialogo de "Facturas" que ya existia.
--  Requiere contratos_facturacion_preparaciones.sql.
-- ============================================================================

create or replace function public.crear_factura_desde_preparacion(
  p_preparacion_id bigint,
  p_fecha date default null,
  p_presupuesto_id bigint default null
)
returns bigint
language plpgsql
volatile
security invoker
set search_path = public
as $$
declare
  v_prep record;
  v_factura_id bigint;
begin
  select * into v_prep
  from public.contratos_facturacion_preparaciones
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
    select 1 from public.contratos_presupuestos
    where id = p_presupuesto_id and contrato_id = v_prep.contrato_id
  ) then
    raise exception 'El presupuesto indicado no pertenece al contrato de la preparación.';
  end if;

  insert into public.contratos_facturacion (
    fecha, contrato_id, base_imponible, iva, total, presupuesto_id, observacion
  ) values (
    coalesce(p_fecha, v_prep.fecha_hasta, current_date),
    v_prep.contrato_id, v_prep.base_imponible, v_prep.iva, v_prep.total, p_presupuesto_id,
    'Generada desde la preparación #' || v_prep.id
  )
  returning id into v_factura_id;

  update public.contratos_facturacion_preparaciones
  set contrato_facturacion_id = v_factura_id
  where id = p_preparacion_id;

  update public.contratos_facturacion_lineas
  set contrato_facturacion_id = v_factura_id
  where preparacion_id = p_preparacion_id;

  return v_factura_id;
end;
$$;

revoke all on function public.crear_factura_desde_preparacion(bigint, date, bigint) from public;
grant execute on function public.crear_factura_desde_preparacion(bigint, date, bigint) to authenticated;
