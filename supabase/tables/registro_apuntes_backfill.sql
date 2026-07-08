-- ============================================================================
--  Backfill registros -> registro_apuntes  (PASO 1 de la migracion)
-- ----------------------------------------------------------------------------
--  Desdobla el campo sobrecargado tipo_hora_id en los dos ejes nuevos:
--    - concepto_id (tarifa): REG/HCOMP/MONT/FTRAB
--    - movimiento (eje 4):   DEVENGO / DEVOLUCION_HD / BOLSA_ENTRA / BOLSA_SALE
--
--  Realidad de los datos al escribir esto: las 436 filas son REG (DEVENGO,
--  tarifa normal, horas positivas) y las columnas hc/hf/hm/hd/bolsa estan
--  vacias. El mapeo general de abajo cubre tambien PNR/BIN/BOUT por si
--  aparecen filas historicas antes de aplicar.
--
--  Idempotente: solo crea apuntes para registros que aun no tienen ninguno.
--  NO toca ni borra columnas de registros (eso es el paso de limpieza).
-- ============================================================================
insert into public.registro_apuntes
  (registro_id, cantidad, concepto_id, movimiento, abonar, facturar, nota)
select
  r.id,
  -- los movimientos que restan se guardan con signo negativo;
  -- el resto conserva el signo original de horas.
  case
    when r.tipo_hora_id in (5, 8)   -- PNR (devolucion), BOUT (gasto de bolsa)
      then -abs(coalesce(r.horas, 0))
    else coalesce(r.horas, 0)
  end as cantidad,
  -- concepto = tarifa. Los movimientos (PNR/BIN/BOUT) se valoran a tarifa
  -- normal (REG = 1), porque no son una tarifa en si mismos.
  case
    when r.tipo_hora_id in (5, 7, 8) then 1
    else coalesce(r.tipo_hora_id, 1)
  end as concepto_id,
  case r.tipo_hora_id
    when 5 then 'DEVOLUCION_HD'
    when 7 then 'BOLSA_ENTRA'
    when 8 then 'BOLSA_SALE'
    else 'DEVENGO'
  end as movimiento,
  coalesce(r.abonar, true)   as abonar,
  coalesce(r.facturar, true) as facturar,
  'backfill tipo_hora_id=' || coalesce(r.tipo_hora_id::text, 'null') as nota
from public.registros r
where not exists (
  select 1 from public.registro_apuntes a where a.registro_id = r.id
);

-- ----------------------------------------------------------------------------
--  Verificacion (ejecutar tras el insert; deben cuadrar):
-- ----------------------------------------------------------------------------
-- select
--   (select count(*) from public.registros) as registros,
--   (select count(*) from public.registro_apuntes) as apuntes,
--   (select round(sum(horas)::numeric,2) from public.registros) as suma_horas,
--   (select round(sum(cantidad)::numeric,2) from public.registro_apuntes
--      where movimiento = 'DEVENGO') as suma_devengo;
--
--  Rollback (si algo no cuadra; solo borra lo sembrado por este script):
-- delete from public.registro_apuntes where nota like 'backfill tipo_hora_id=%';
