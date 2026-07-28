-- Conceptos que el motor genera POR PUESTO en un periodo: todo lo que devuelve
-- calcular_nomina_devengos salvo el salario base (plus de disponibilidad,
-- complemento de puesto, horas complementarias, nocturnidad, movilidad,
-- dedicacion, festivo trabajado y descuento por absentismo).
--
-- POR QUE EXISTE: la nomina manual sustituye el salario base por el importe que
-- se teclea, pero hasta 2026-07-28 se llevaba por delante TAMBIEN el resto de
-- conceptos del puesto, sin que aparecieran en ninguna parte ni se pudiera
-- decidir sobre ellos. Caso real: Denilson Santiago Casanova perdia 439,84 EUR
-- de montaje al fijarle un importe manual de 1.200 EUR.
--
-- Ahora esos conceptos SE PAGAN APARTE por defecto, y la lista "Complementos y
-- pluses incluidos" del panel de Gestion los muestra uno a uno con su importe:
-- marcar uno significa "ya va dentro del importe manual" y entonces no se suma
-- (mismo criterio que los complementos de la persona y el plus de transporte).
--
-- Lo consume el frontend para pintar esa lista y calcular_nomina_persona para
-- resolver que se paga aparte (p_manual_conceptos_dentro).
create or replace function public.get_conceptos_puesto_nomina(
  p_personal_id integer,
  p_desde date,
  p_hasta date,
  p_empresa_id integer default null,
  p_historial_ids bigint[] default null,
  p_base_calculo text default null,
  p_ajuste_jornada text default null
)
returns table (concepto text, importe numeric, orden integer)
language sql
stable
security invoker
set search_path = public
as $$
  select d.concepto, round(sum(d.importe), 2) as importe, min(d.orden)::integer as orden
  from public.historiales_laborales h
  cross join lateral public.calcular_nomina_devengos(
    h.id, p_desde, p_hasta, p_base_calculo, p_ajuste_jornada) d
  where h.personal_id = p_personal_id
    and (p_empresa_id is null or h.empresa_id = p_empresa_id)
    and (p_historial_ids is null or h.id = any(p_historial_ids))
    and h.fecha_alta <= p_hasta and (h.fecha_baja is null or h.fecha_baja >= p_desde)
    and d.detalle_de is null
    and d.concepto <> 'Salario base'
  group by d.concepto
  having round(sum(d.importe), 2) <> 0
  order by min(d.orden);
$$;

revoke all on function public.get_conceptos_puesto_nomina(integer, date, date, integer, bigint[], text, text) from public;
grant execute on function public.get_conceptos_puesto_nomina(integer, date, date, integer, bigint[], text, text) to authenticated;
