-- Completa los tipos estándar de cotización que estén vacíos en los periodos
-- de historial laboral iniciados durante 2026.
--
-- Los valores se almacenan como fracción:
--   0.047  = 4,70 %
--   0.0015 = 0,15 %
--   0.001  = 0,10 %
--   0.0155 = 1,55 %
--
-- No se sobrescribe ningún valor informado para respetar regímenes especiales.

with actualizados as (
  update public.historiales_laborales
  set
    cotizacion_comunes_pct =
      coalesce(cotizacion_comunes_pct, 0.047),
    cotizacion_mei_pct =
      coalesce(cotizacion_mei_pct, 0.0015),
    cotizacion_formacion_pct =
      coalesce(cotizacion_formacion_pct, 0.001),
    cotizacion_desempleo_pct =
      coalesce(cotizacion_desempleo_pct, 0.0155)
  where fecha_alta >= date '2026-01-01'
    and fecha_alta < date '2027-01-01'
    and (
      cotizacion_comunes_pct is null
      or cotizacion_mei_pct is null
      or cotizacion_formacion_pct is null
      or cotizacion_desempleo_pct is null
    )
  returning id
)
select count(*) as periodos_actualizados
from actualizados;
