-- Archivos adjuntos de cada factura: el PDF de la factura y el justificante de
-- pago. Se guardan en el bucket privado "facturas", en la ruta
--   <contrato_id>/<factura_id>/factura-<marca>.<ext>
--   <contrato_id>/<factura_id>/justificante-<marca>.<ext>
-- y la ruta se anota en contratos_facturacion.factura_archivo /
-- justificante_archivo. Escrito para el esquema coordinacion (Portal Laboral).
--
-- El alcance de los archivos es el mismo que el de la factura: lectura para
-- quien puede leer el contrato y escritura para quien puede gestionarlo
-- (el administrador, sin límite). Las políticas solo tocan el bucket
-- "facturas": no afectan a los demás buckets del proyecto.

alter table coordinacion.contratos_facturacion
  add column if not exists factura_archivo text,
  add column if not exists justificante_archivo text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'facturas', 'facturas', false, 20971520,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "facturas lectura" on storage.objects;
create policy "facturas lectura" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'facturas'
    and (select coordinacion.is_coordinacion_user())
    and (storage.foldername(name))[1] ~ '^[0-9]+$'
    and (
      (select coordinacion.is_coordinacion_admin())
      or ((storage.foldername(name))[1])::int in (select coordinacion.coordinacion_readable_contrato_ids())
    )
  );

drop policy if exists "facturas alta" on storage.objects;
create policy "facturas alta" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'facturas'
    and (select coordinacion.is_coordinacion_user())
    and (storage.foldername(name))[1] ~ '^[0-9]+$'
    and (
      (select coordinacion.is_coordinacion_admin())
      or ((storage.foldername(name))[1])::int in (select coordinacion.coordinacion_manageable_contrato_ids())
    )
  );

drop policy if exists "facturas cambio" on storage.objects;
create policy "facturas cambio" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'facturas'
    and (select coordinacion.is_coordinacion_user())
    and (storage.foldername(name))[1] ~ '^[0-9]+$'
    and (
      (select coordinacion.is_coordinacion_admin())
      or ((storage.foldername(name))[1])::int in (select coordinacion.coordinacion_manageable_contrato_ids())
    )
  );

drop policy if exists "facturas baja" on storage.objects;
create policy "facturas baja" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'facturas'
    and (select coordinacion.is_coordinacion_user())
    and (storage.foldername(name))[1] ~ '^[0-9]+$'
    and (
      (select coordinacion.is_coordinacion_admin())
      or ((storage.foldername(name))[1])::int in (select coordinacion.coordinacion_manageable_contrato_ids())
    )
  );
