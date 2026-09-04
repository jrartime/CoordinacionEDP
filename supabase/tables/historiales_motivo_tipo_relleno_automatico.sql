-- Relleno automatico de tipo_contratacion (alta) y motivo_baja (baja) en
-- historiales_laborales para los historiales que no tenian nada puesto.
-- Aplicado el 04/09/2026 sobre TODA la tabla (no solo contratos 100/200).
--
-- Regla (para cada persona, historiales ordenados por fecha_alta):
--   - Primer historial de la persona, sin tipo_contratacion -> "Nueva contratacion" (1).
--   - Si el historial empieza justo al dia siguiente de que acabe el anterior
--     (consecutivo, sin hueco): el anterior -> motivo_baja "Variacion contrato" (11);
--     el que empieza -> tipo_contratacion "Variacion" (4).
--   - Si hay un salto (hueco) entre los dos Y el contrato del que entra es
--     temporal (duracion distinta de 'Indefinido'): el que entra ->
--     tipo_contratacion "Nueva contratacion" (1); el anterior -> motivo_baja
--     "Fin Servicio FD" (1).
--   - Solo se rellena si el campo estaba a NULL; nunca se sobreescribe un
--     valor ya puesto.
--
-- Casos que la regla NO cubre a proposito (se dejaron sin tocar):
--   - Salto con contrato Indefinido (no temporal) sin nada puesto: son
--     huecos de fijo discontinuo u otros casos sin regla dada.
--   - Historiales "solapados" (el siguiente empieza antes de que acabe el
--     anterior, o fechas invertidas) -- problema de datos distinto (mismo
--     patron que el caso de Ivan Gonzalez Alvarez, dos historiales con la
--     misma fecha_alta y distinta fecha_baja). No se tocan para no fijar un
--     motivo sobre un registro ya de por si duplicado/mal solapado.
--   - Ultimo historial de la persona con fecha_baja y sin historial
--     posterior con el que comparar: no hay regla para este caso.
--   Total sin cubrir tras el relleno: 618 historiales con fecha_baja y
--   motivo_baja null.
--
-- Referencia previa: el grupo "Conserjes Santander" (contrato de servicio id
-- 25, ver historiales_motivo_baja_subrogacion mas abajo) ya se habia
-- resuelto aparte con el motivo "Subrogacion a otra empresa" (id 13) antes
-- de este relleno general, porque no encajaba en "Variacion" (dejaron la
-- empresa, no cambiaron de contrato dentro de ella) ni tenian continuacion.
--
-- Update de tipo_contratacion (alta):
with ordenado as (
  select
    h.id, h.personal_id, h.fecha_alta, h.fecha_baja, h.tipo_contratacion_id,
    cl.duracion as contrato_duracion,
    lag(h.fecha_baja) over w as prev_fecha_baja,
    lag(h.id) over w as prev_id
  from historiales_laborales h
  left join historiales_laborales_contratos cl on cl.id = h.contrato_laboral_id
  window w as (partition by h.personal_id order by h.fecha_alta, h.id)
),
objetivo as (
  select o.id,
    case
      when prev_id is null then 1
      when fecha_alta = prev_fecha_baja + 1 then 4
      when fecha_alta > prev_fecha_baja + 1 and contrato_duracion is distinct from 'Indefinido' then 1
      else null
    end as nuevo_tipo
  from ordenado o
  where o.tipo_contratacion_id is null
)
update historiales_laborales h
set tipo_contratacion_id = objetivo.nuevo_tipo
from objetivo
where h.id = objetivo.id and objetivo.nuevo_tipo is not null;

-- Update de motivo_baja (baja):
with ordenado as (
  select
    h.id, h.personal_id, h.fecha_alta, h.fecha_baja, h.motivo_baja_id,
    lead(h.fecha_alta) over w as next_fecha_alta,
    lead(cl.duracion) over w as next_duracion,
    lead(h.id) over w as next_id
  from historiales_laborales h
  left join historiales_laborales_contratos cl on cl.id = h.contrato_laboral_id
  window w as (partition by h.personal_id order by h.fecha_alta, h.id)
),
objetivo as (
  select o.id,
    case
      when o.fecha_baja is null then null
      when next_id is null then null
      when next_fecha_alta = o.fecha_baja + 1 then 11
      when next_fecha_alta > o.fecha_baja + 1 and next_duracion is distinct from 'Indefinido' then 1
      else null
    end as nuevo_motivo
  from ordenado o
  where o.motivo_baja_id is null
)
update historiales_laborales h
set motivo_baja_id = objetivo.nuevo_motivo
from objetivo
where h.id = objetivo.id and objetivo.nuevo_motivo is not null;
