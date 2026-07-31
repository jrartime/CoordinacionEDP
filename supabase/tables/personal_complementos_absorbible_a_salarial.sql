-- Sustituye "Complemento absorbible" (id 6) por "Complemento salarial" (id 7,
-- codigo_nomina 18) en las 8 asignaciones vigentes que lo usaban, y retira el
-- complemento absorbible del catalogo. Decision del usuario 2026-07-30: el
-- codigo 18 cubre el mismo caso y evita mantener dos complementos fijos
-- equivalentes en el catalogo.
--
-- El complemento salarial es "variable" en el catalogo (tipo lo decide cada
-- asignacion), asi que se preserva tal cual el tipo/unidad/importe que ya
-- tenian como absorbible (fijo/mensual, mismo importe). El trigger
-- set_personal_complemento_tipo no los toca porque new.tipo ya viene informado.
--
-- Las nominas ya emitidas que citan "absorbible" (nomina_lineas) son historico
-- congelado (Fase 6) y no se tocan.
--
-- Aplicado en prod (proyecto epbtoarkinvgcaewbtvs) el 2026-07-30. 8 filas de
-- personal_complementos afectadas (personal_id 41, 387, 512, 1113, 1151, 1163,
-- 1218, 1222), importes verificados idénticos tras la migración.

update public.personal_complementos
set complemento_id = 7
where complemento_id = 6;

delete from public.nomina_complementos_catalogo
where id = 6;
