-- Fase 2 del plan "catalogo de conceptos de nomina" (ver memoria
-- nominas-conceptos-catalogo, Fase 1 en nomina_conceptos_catalogo_rename.sql).
--
-- Objetivo: sembrar como filas asignable=false los conceptos que hoy calcula
-- el motor pero no existian en el catalogo (Salario base y las 5 lineas de
-- cotizacion/IRPF), y consolidar en el catalogo los que ya vivian solo en el
-- CASE hardcodeado de get_codigo_nomina_concepto.
--
-- CORRECCION AL PLAN ORIGINAL: no es posible que el CASE desaparezca del
-- todo. codigo_nomina es UNIQUE por fila y hay conceptos del motor con TEXTO
-- distinto que comparten el mismo codigo externo (ej. "Horas complementarias"
-- vs "Horas complementarias de otro puesto" -> los dos codigo 67; "Montaje de
-- otro puesto" comparte el 60 con "Complemento de puesto", que SI es un
-- complemento asignable real). Para esos casos solo puede existir una fila
-- canonica por codigo; la variante de texto se queda como alias en el CASE.
-- El CASE pasa de 8 entradas a 3.
--
-- Ademas se descubrio que 2 filas ya sembradas (Fase 1) tenian el `nombre`
-- distinto del texto EXACTO que emite el motor, por lo que nunca las
-- resolvia la tabla y siempre caian al CASE (aunque con el mismo resultado,
-- por eso no se noto): "Plus de Festivos" (el motor dice literalmente
-- "Plus festivo trabajado") y "Descuento Absentismo" (el motor dice
-- "Descuento por absentismo"). Se renombran aqui para que la tabla las
-- resuelva de verdad.
--
-- Las 4 filas ya sembradas que corresponden a conceptos calculados por el
-- motor (Plus de disponibilidad, Horas complementarias, Plus festivo
-- trabajado, Descuento por absentismo) pasan a asignable=false: no tiene
-- sentido asignarlas a mano via personal_complementos porque el motor ya las
-- calcula solas desde el historial/registros -- asignarlas ademas crearia un
-- importe duplicado con el mismo nombre. Las 4 tenian 0 asignaciones reales
-- (comprobado antes de tocarlas), asi que el cambio no afecta a ninguna
-- nomina existente.

-- ============================================================================
-- 1) Renombrar las 2 filas mal etiquetadas y pasar a asignable=false las 4
--    filas motor-calculadas ya sembradas.
-- ============================================================================

update public.nomina_conceptos_catalogo
set nombre = 'Plus festivo trabajado'
where nombre = 'Plus de Festivos';

update public.nomina_conceptos_catalogo
set nombre = 'Descuento por absentismo'
where nombre = 'Descuento Absentismo';

update public.nomina_conceptos_catalogo
set asignable = false, tipo = null, unidad = null, medida_horas = null, bases_aplicables = null
where nombre in ('Plus de disponibilidad', 'Horas complementarias', 'Plus festivo trabajado', 'Descuento por absentismo');

-- ============================================================================
-- 2) Sembrar Salario base, las 5 lineas de cotizacion/IRPF y Prorrateo pagas
--    extra -- todas asignable=false, no existian en el catalogo hasta ahora.
--    codigo_nomina segun las capturas del programa de nominas externo que
--    aporto el usuario: 995 comunes, 994 MEI, 997 desempleo, 996 formacion,
--    999 IRPF.
-- ============================================================================

insert into public.nomina_conceptos_catalogo
  (nombre, tipo, unidad, medida_horas, bases_aplicables, codigo_nomina, naturaleza, categoria, asignable, notas)
values
  ('Salario base', null, null, null, null, 1, 'devengo', 'salario_base', false,
   'Calculado por el motor (calcular_nomina_devengos/calcular_nomina_persona) desde el historial laboral. No se asigna a mano.'),
  ('Prorrateo pagas extra', null, null, null, null, 30, 'devengo', 'salario_base', false,
   'Calculado por el motor (prorrata_pagas_extra). El texto "P.P. pagas extra (solo cotiza)" es la misma linea cuando no se devenga y solo cotiza -- alias en get_codigo_nomina_concepto, mismo codigo.'),
  ('Contingencias comunes', null, null, null, null, 995, 'deduccion', 'cotizacion', false,
   'Linea de deduccion calculada por el motor sobre la base de cotizacion comun.'),
  ('MEI', null, null, null, null, 994, 'deduccion', 'cotizacion', false,
   'Mecanismo de Equidad Intergeneracional. Linea de deduccion calculada por el motor.'),
  ('Desempleo', null, null, null, null, 997, 'deduccion', 'cotizacion', false,
   'Linea de deduccion calculada por el motor.'),
  ('Formación profesional', null, null, null, null, 996, 'deduccion', 'cotizacion', false,
   'Linea de deduccion calculada por el motor.'),
  ('IRPF', null, null, null, null, 999, 'deduccion', 'irpf', false,
   'Linea de deduccion calculada por el motor sobre el porcentaje de personal_confidencial.irpf.')
on conflict (nombre) do nothing;

-- ============================================================================
-- 3) get_codigo_nomina_concepto: el CASE se reduce a los 3 alias que no
--    pueden tener fila propia por compartir codigo con otro concepto.
-- ============================================================================

create or replace function public.get_codigo_nomina_concepto(p_concepto text)
returns integer
language sql
stable
set search_path to 'public'
as $function$
  select coalesce(
    (select c.codigo_nomina
       from public.nomina_conceptos_catalogo c
      where lower(c.nombre) = lower(trim(p_concepto))
      limit 1),
    case lower(trim(coalesce(p_concepto, '')))
      -- Mismo codigo (67) que "Horas complementarias": esta es la variante de
      -- texto que usa calcular_nomina_persona para horas hechas en un puesto
      -- sin historial. No puede tener fila propia (codigo_nomina es unique).
      when 'horas complementarias de otro puesto' then 67
      -- Mismo codigo (60) que "Complemento de puesto" -- que SI es un
      -- complemento asignable real y se queda con la fila. Esta es la
      -- variante para montaje hecho en un puesto sin historial.
      when 'montaje de otro puesto' then 60
      -- Mismo codigo (30) que "Prorrateo pagas extra": esta es la variante de
      -- texto cuando el prorrateo no se devenga y solo suma a la base de
      -- cotizacion (persona sin prorrateo activado).
      when 'p.p. pagas extra (solo cotiza)' then 30
      else null
    end);
$function$;
