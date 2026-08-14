-- ============================================================================
-- Limpieza de columnas muertas de registros (2026-08-14)
-- ----------------------------------------------------------------------------
-- Pendiente citado desde el rediseno del modelo de horas (ver
-- modelo-horas-apuntes): "SOLO DESPUES la limpieza (drop columnas vacias...)".
-- Confirmado antes de borrar (frontend sin ninguna lectura ni escritura,
-- ninguna funcion/vista de calculo las usa salvo el propio passthrough de
-- registros_detalle, que ya se actualizo en registros_detalle_apuntes.sql):
--
--   hc, hf, hm, clases, horas_2  -> 0 filas no nulas/no cero en todo el
--                                   sistema (349.326 filas comprobadas).
--   festivo                     -> 0 filas a true; el "festivo trabajado" real
--                                   es el tipo_hora_id FTRAB (multiplicador
--                                   x1,75), no esta columna.
--   hd                          -> solo 4 filas con valor, resto de una
--                                   escritura vestigial del frontend (PNR): la
--                                   devolucion real de PNR vive en
--                                   registro_apuntes (par DEVENGO/
--                                   DEVOLUCION_HD, ver
--                                   registro_apuntes_sync_trigger.sql) desde
--                                   el rediseno de la Fase 2. Nunca se lee.
--   bolsa_horas                 -> dato historico de los 8 auditados en
--                                   bolsa-horas-reconciliacion, superado por
--                                   completo por el ledger de
--                                   registro_apuntes/bolsa_horas_saldo. Sin
--                                   ninguna lectura actual.
--   horas_diurnas                -> facturacion.js documenta explicitamente
--                                   que no se fia de este valor guardado (sin
--                                   trigger que lo mantenga sincronizado,
--                                   ver commit cacde05) y lo recalcula siempre
--                                   como horas-horas_nocturnas.
--
-- sustitucion NO se toca (10.801 filas a true, se lee en
-- isRecordSubstituteRow/withRecordSituacionSideEffects). horas_nocturnas
-- tampoco (dato vivo, se mantiene como registro historico inmutable).
--
-- registros.sql y registros_titular_sustituto_derivados.sql quedan tal cual
-- (definiciones de registros_detalle ya superadas, sin re-ejecutarse) -- no
-- se editan para no reescribir historial.
-- ============================================================================
alter table public.registros
  drop column if exists hc,
  drop column if exists hf,
  drop column if exists hm,
  drop column if exists hd,
  drop column if exists bolsa_horas,
  drop column if exists horas_diurnas,
  drop column if exists clases,
  drop column if exists horas_2,
  drop column if exists festivo;
