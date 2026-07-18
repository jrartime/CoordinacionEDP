-- Fase 4 (parte 1): backfill de los complementos con importe propio por persona
-- desde personal_confidencial hacia personal_complementos.
--
-- SOLO se migran los tres conceptos que son cantidades reales por persona:
--   com_antiguedad_04     -> "Complemento de antigüedad"  (fijo mensual)
--   com_absorbible_18     -> "Complemento absorbible"     (fijo mensual)
--   porcent_complemento_18-> "Complemento salarial"       (porcentaje)
--
-- NO se migran (decision del usuario, 2026-07-18):
--   - Los flags del convenio (tiene_plus_transporte / tiene_nocturnidad /
--     tiene_complemento_movilidad / tiene_complemento_dedicacion): son por
--     periodo y su importe sale del convenio, se quedan en historiales_laborales
--     y los resolvera el motor de calculo (Fase 5).
--   - historiales_laborales.complemento (17 filas): importes ambiguos y con
--     duplicados (persona 3), pendientes de revision manual.
--   - num_pagas_extra / prorrateo_pagas / irpf: no son complementos, son config
--     de nomina para la Fase 5, se quedan en personal_confidencial.
--
-- Vigencia (fecha_desde): las columnas viejas no tienen fecha; se usa la fecha de
-- antiguedad de la persona (o su primer alta en historial, o 2026-01-01) como
-- "desde que existe la relacion laboral". fecha_hasta queda NULL (vigente).
-- Idempotente: no reinserta si la persona ya tiene ese complemento.

-- Complemento de antigüedad (fijo mensual). El trigger set_personal_complemento_tipo
-- copia tipo/unidad desde el catalogo, aqui solo hace falta el importe.
insert into public.personal_complementos (personal_id, complemento_id, fecha_desde, importe, notas)
select
  pc.personal_id,
  cat.id,
  coalesce(
    p.antiguedad,
    (select min(h.fecha_alta) from public.historiales_laborales h where h.personal_id = pc.personal_id),
    date '2026-01-01'
  ),
  pc.com_antiguedad_04,
  'Migrado de personal_confidencial.com_antiguedad_04 (Fase 4).'
from public.personal_confidencial pc
join public.personal p on p.id = pc.personal_id
cross join (
  select id from public.nomina_complementos_catalogo where nombre = 'Complemento de antigüedad'
) cat
where pc.com_antiguedad_04 is not null
  and pc.com_antiguedad_04 <> 0
  and not exists (
    select 1 from public.personal_complementos x
    where x.personal_id = pc.personal_id and x.complemento_id = cat.id
  );

-- Complemento absorbible (fijo mensual).
insert into public.personal_complementos (personal_id, complemento_id, fecha_desde, importe, notas)
select
  pc.personal_id,
  cat.id,
  coalesce(
    p.antiguedad,
    (select min(h.fecha_alta) from public.historiales_laborales h where h.personal_id = pc.personal_id),
    date '2026-01-01'
  ),
  pc.com_absorbible_18,
  'Migrado de personal_confidencial.com_absorbible_18 (Fase 4).'
from public.personal_confidencial pc
join public.personal p on p.id = pc.personal_id
cross join (
  select id from public.nomina_complementos_catalogo where nombre = 'Complemento absorbible'
) cat
where pc.com_absorbible_18 is not null
  and pc.com_absorbible_18 <> 0
  and not exists (
    select 1 from public.personal_complementos x
    where x.personal_id = pc.personal_id and x.complemento_id = cat.id
  );

-- Complemento salarial (porcentaje). Es un complemento 'variable' en el catalogo,
-- asi que la asignacion debe fijar tipo/bases: tipo=porcentaje, base=salario_base.
-- La base es una ASUNCION (el dato viejo no la indica), marcada en notas.
insert into public.personal_complementos
  (personal_id, complemento_id, fecha_desde, tipo, bases_aplicables, porcentaje, notas)
select
  pc.personal_id,
  cat.id,
  coalesce(
    p.antiguedad,
    (select min(h.fecha_alta) from public.historiales_laborales h where h.personal_id = pc.personal_id),
    date '2026-01-01'
  ),
  'porcentaje',
  array['salario_base']::text[],
  pc.porcent_complemento_18,
  'Migrado de personal_confidencial.porcent_complemento_18 (Fase 4). Base salario_base ASUMIDA, revisar.'
from public.personal_confidencial pc
join public.personal p on p.id = pc.personal_id
cross join (
  select id from public.nomina_complementos_catalogo where nombre = 'Complemento salarial'
) cat
where pc.porcent_complemento_18 is not null
  and pc.porcent_complemento_18 <> 0
  and not exists (
    select 1 from public.personal_complementos x
    where x.personal_id = pc.personal_id and x.complemento_id = cat.id
  );
