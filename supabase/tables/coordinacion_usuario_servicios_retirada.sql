-- ============================================================================
--  Retirada de coordinacion_usuario_servicios (2026-09-08)
-- ----------------------------------------------------------------------------
--  Quedo en desuso desde coordinacion_usuario_contratos.sql (06/08/2026): el
--  acceso de coordinador se concede por contrato directamente, no por
--  servicio. Se dejo sin borrar entonces "por si hiciera falta auditarla" y
--  "hasta que el frontend de Accesos dejara de escribirla" -condicion ya
--  cumplida, coordinacion/app.js no la referencia en ningun sitio-, asi que
--  se retira: 58 filas de asignaciones ya obsoletas, ninguna funcion de
--  alcance la leia.
-- ============================================================================

drop table if exists public.coordinacion_usuario_servicios;
