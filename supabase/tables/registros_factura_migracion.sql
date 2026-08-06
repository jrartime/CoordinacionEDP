-- ============================================================================
--  Migracion unica: traslada registros.factura (texto libre "serie/n_documento"
--  o "serie_n_documento") a contratos_facturacion_lineas y retira la columna.
-- ----------------------------------------------------------------------------
--  Requiere contratos_facturacion_preparaciones.sql ya aplicado. Es un paso de
--  una sola vez: en un despliegue nuevo, registros.sql ya crea la tabla sin la
--  columna, asi que el bloque no hace nada (comprueba que exista antes).
-- ============================================================================

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'registros' and column_name = 'factura'
  ) then
    insert into public.contratos_facturacion_lineas (
      contrato_id, contrato_facturacion_id, registro_id,
      instalacion_id, funcion_id, horas_diurnas, horas_nocturnas
    )
    select
      r.contrato_id,
      cf.id,
      r.id,
      r.instalacion_id,
      r.funcion_id,
      coalesce(r.horas_diurnas, r.horas, 0),
      coalesce(r.horas_nocturnas, 0)
    from public.registros r
    join public.contratos_facturacion cf
      on cf.serie = split_part(replace(r.factura, '_', '/'), '/', 1)
     and cf.n_documento = split_part(replace(r.factura, '_', '/'), '/', 2)
     and cf.contrato_id = r.contrato_id
    where r.factura is not null and btrim(r.factura) <> ''
      and not exists (
        select 1 from public.contratos_facturacion_lineas l where l.registro_id = r.id
      );

    drop view if exists public.registros_detalle;

    alter table public.registros drop column factura;
  end if;
end $$;
