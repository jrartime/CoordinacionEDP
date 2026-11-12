-- UNIR CONCEPTOS IGUALES EN LA NÓMINA (2026-11-12)
--
-- Un mismo concepto puede llegar por dos vías: el historial laboral (p.ej. la
-- marca «complemento de movilidad», que el motor paga según el convenio) y la
-- ficha de personal (personal_complementos, con el mismo complemento del
-- catálogo). Las dos líneas se sumaban bien al bruto y a las bases, pero salían
-- como dos filas con el mismo nombre. Caso de referencia: Gessuelle, concepto 11
-- (Complemento de movilidad).
--
-- Se renombra el motor a calcular_nomina_persona_motor (sin tocar su cuerpo) y
-- calcular_nomina_persona pasa a ser una envoltura con LA MISMA firma que suma
-- las líneas de devengo con el mismo concepto. Así la unión llega por igual a la
-- pantalla de Gestión, a emitir_nomina y al editor, sin tocar el cálculo.
--
-- Qué se une: devengos con orden < 300 y mismo (concepto, detalle_de). Quedan
-- fuera a propósito los «añadidos a mano en esta nómina» (orden 300+), que se
-- decidió que salgan aparte de los asignados, y las bases/deducciones/ajustes.
-- El detalle de la línea unida conserva el origen de cada parte.
--
-- Si se vuelve a ejecutar nomina_calculo_persona.sql (que hace create or replace
-- sobre calcular_nomina_persona), hay que renombrar antes esa definición a
-- calcular_nomina_persona_motor o se pisaría esta envoltura.

do $$
begin
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'coordinacion' and p.proname = 'calcular_nomina_persona_motor') then
    alter function coordinacion.calcular_nomina_persona(integer, date, date, integer, text, text, bigint[], numeric, text, boolean, bigint[], boolean, jsonb, text[], boolean, boolean)
      rename to calcular_nomina_persona_motor;
  end if;
end $$;

create or replace function coordinacion.calcular_nomina_persona(
  p_personal_id integer, p_desde date, p_hasta date,
  p_empresa_id integer default null,
  p_base_calculo text default null,
  p_ajuste_jornada text default null,
  p_historial_ids bigint[] default null,
  p_manual_importe numeric default null,
  p_manual_modo text default null,
  p_manual_pagas_incluidas boolean default false,
  p_manual_complementos bigint[] default null,
  p_manual_transporte boolean default false,
  p_complementos_extra jsonb default null,
  p_manual_conceptos_dentro text[] default null,
  p_horas_otros_puestos boolean default true,
  p_aplicar_topes_cotizacion boolean default true
)
returns table (
  orden integer, seccion text, concepto text, detalle text,
  base numeric, tipo numeric, cantidad numeric, precio numeric,
  importe numeric, detalle_de text, cotiza_en text[]
)
language plpgsql stable security invoker set search_path = coordinacion, extensions
as $$
begin
  return query
  with src as (
    select * from coordinacion.calcular_nomina_persona_motor(
      p_personal_id, p_desde, p_hasta, p_empresa_id, p_base_calculo, p_ajuste_jornada,
      p_historial_ids, p_manual_importe, p_manual_modo, p_manual_pagas_incluidas,
      p_manual_complementos, p_manual_transporte, p_complementos_extra,
      p_manual_conceptos_dentro, p_horas_otros_puestos, p_aplicar_topes_cotizacion)
  ),
  unidas as (
    select min(s.orden)::integer as orden, s.seccion, s.concepto,
           case when count(*) = 1 then min(s.detalle)
                else string_agg(
                       coalesce(s.detalle, '') ||
                       case when s.detalle_de is not null then ''
                            when s.orden < 100 then ' [historial]' else ' [ficha]' end,
                       ' + ' order by s.orden) end as detalle,
           case when count(*) = 1 then min(s.base) end as base,
           case when count(*) = 1 then min(s.tipo) end as tipo,
           case when count(*) = 1 then min(s.cantidad) end as cantidad,
           case when count(*) = 1 then min(s.precio) end as precio,
           sum(s.importe) as importe, s.detalle_de,
           (array_agg(s.cotiza_en::text order by s.orden))[1]::text[] as cotiza_en
    from src s
    where s.seccion = 'devengo' and s.orden < 300
    group by s.seccion, s.concepto, s.detalle_de
  )
  select u.orden, u.seccion, u.concepto, u.detalle, u.base, u.tipo, u.cantidad,
         u.precio, u.importe, u.detalle_de, u.cotiza_en
  from unidas u
  union all
  select s.orden, s.seccion, s.concepto, s.detalle, s.base, s.tipo, s.cantidad,
         s.precio, s.importe, s.detalle_de, s.cotiza_en
  from src s
  where not (s.seccion = 'devengo' and s.orden < 300)
  order by 1, 3;
end;
$$;

grant execute on function coordinacion.calcular_nomina_persona(integer, date, date, integer, text, text, bigint[], numeric, text, boolean, bigint[], boolean, jsonb, text[], boolean, boolean)
  to authenticated, service_role;
