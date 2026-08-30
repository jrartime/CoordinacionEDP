-- ============================================================================
--  Backfill actividades.horarios_personalizados  (PASO 1 de la migracion)
-- ----------------------------------------------------------------------------
--  Antes de poder personalizar el horario dia a dia, el horario de una
--  actividad vivia solo en hora_inicio/hora_fin (un unico rango para todos
--  los dias marcados en dias_semana). Este script copia ese horario general
--  a horarios_personalizados para cada dia marcado que todavia no tenga una
--  entrada propia, dejando el terreno listo para el paso 2 (eliminar
--  hora_inicio/hora_fin) mas adelante.
--
--  - Solo rellena los dias que faltan: si una actividad ya tiene algun dia
--    personalizado (837 de 869 no lo tenian; 2 estaban parcialmente
--    personalizadas), esos dias no se tocan.
--  - Usa el formato HH:MM (sin segundos) porque es el que ya escribe la app
--    en horarios_personalizados (hora_inicio/hora_fin en la tabla son type
--    time y llevan segundos).
--  - Idempotente: una segunda ejecucion no encuentra dias pendientes y no
--    actualiza ninguna fila.
--  - NO toca ni borra hora_inicio/hora_fin (eso es el paso 2, aparte).
--  Aplicado el 30/08/2026: 837 filas actualizadas.
-- ============================================================================
update public.actividades
set horarios_personalizados = (
  select jsonb_object_agg(
    d::text,
    jsonb_build_object(
      'hora_inicio', to_char(hora_inicio, 'HH24:MI'),
      'hora_fin', to_char(hora_fin, 'HH24:MI')
    )
  )
  from unnest(dias_semana) as d
) || horarios_personalizados
where dias_semana <> '{}'
  and exists (
    select 1
    from unnest(dias_semana) as d
    where not (horarios_personalizados ? d::text)
  );
