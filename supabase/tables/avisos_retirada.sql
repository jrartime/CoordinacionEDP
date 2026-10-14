-- ============================================================================
--  Retirada completa del sistema de Avisos (14/10/2026).
--  Sustituye a avisos.sql, avisos_motor.sql y policies/avisos_scope.sql, que se
--  borraron del repo. Solo había datos de prueba (1 aviso, 2 reglas semilla).
--  No quedaban adjuntos ni objetos en Storage bajo el prefijo avisos/.
-- ============================================================================

-- Triggers de las tablas origen del motor.
drop trigger if exists trg_aviso_from_personal_bajas on public.personal_bajas;
drop trigger if exists trg_aviso_from_personal_permisos on public.personal_permisos;

-- Vistas.
drop view if exists public.avisos_detalle;
drop view if exists public.coordinacion_usuarios_directorio;

-- Tablas (hijas primero).
drop table if exists public.avisos_lecturas;
drop table if exists public.avisos_adjuntos;
drop table if exists public.avisos_destinatarios;
drop table if exists public.avisos;
drop table if exists public.avisos_reglas;

-- Funciones.
drop function if exists public.trg_aviso_from_personal_bajas();
drop function if exists public.trg_aviso_from_personal_permisos();
drop function if exists public.generar_aviso_regla(text, jsonb);
drop function if exists public.renderizar_plantilla_aviso(text, jsonb);
drop function if exists public.can_view_aviso(bigint, uuid);
drop function if exists public.can_manage_aviso(bigint, uuid);
drop function if exists public.set_avisos_reglas_updated_at();

-- Pestaña "avisos": accesos concedidos, catálogo y check de claves válidas.
delete from public.coordinacion_usuario_pestanas where pestana = 'avisos';
delete from public.coordinacion_pestanas where pestana = 'avisos';

alter table public.coordinacion_pestanas
  drop constraint if exists coordinacion_pestanas_key_check;
alter table public.coordinacion_pestanas
  add constraint coordinacion_pestanas_key_check
  check (
    pestana = any (array[
      'programming', 'control', 'events', 'search', 'contracts', 'personal',
      'settings', 'concilia', 'actividades', 'registros', 'historial',
      'gestion', 'contabilidad', 'facturacion', 'bajas_conciliacion'
    ]::text[])
  );
