-- ============================================================================
--  Deprecar el horario general de actividades (PASO 1 de la migracion)
-- ----------------------------------------------------------------------------
--  Desde que existe horarios_personalizados, hora_inicio/hora_fin solo servian
--  de valor por defecto para los dias marcados sin horario propio. Tras el
--  backfill de actividades_horarios_personalizados_backfill.sql (30/08/2026,
--  837 filas) ninguna actividad depende ya de ese fallback, y el frontend deja
--  de pedirlo y de escribirlo (formulario, validacion, asignacion masiva).
--
--  Este paso solo quita la obligatoriedad para no romper nada si algo se
--  escapa: las columnas siguen existiendo (las filas antiguas conservan su
--  valor) pero ya no son NOT NULL, asi que las actividades nuevas pueden
--  guardarse sin ellas.
--
--  actividades_horas_validas (fecha_fin > fecha_inicio or hora_fin >
--  hora_inicio) queda vestigial pero inofensiva: con las columnas a NULL la
--  comparacion "NULL > NULL" no es false, asi que la fila pasa igualmente.
--  Se retira en el paso 2, junto con las columnas.
--
--  Paso 2 (mas adelante, no en este script): quitar hora_inicio/hora_fin de
--  los select() de actividades_detalle en el frontend, de la propia vista, la
--  constraint actividades_horas_validas, y finalmente las columnas.
-- ============================================================================
alter table public.actividades
  alter column hora_inicio drop not null,
  alter column hora_fin drop not null;
