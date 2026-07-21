-- Vista de diagnostico: periodos de historial laboral que se pisan para la MISMA
-- persona y el MISMO puesto.
--
-- POR QUE IMPORTA: calcular_nomina_persona suma los devengos de todos los
-- historiales solapados del periodo (agrupa por concepto y hace sum()). Cada par
-- solapado duplica por tanto salario base, horas y pluses en la nomina de ese
-- tramo. Detectado el 2026-07-20 al valorar las horas festivas: Javier
-- Cortavitarte cobraba dos veces el plus de festivo porque tiene el indefinido
-- de 40 h abierto desde 2017 y ademas un tramo de 20 h de marzo a mayo de 2026.
--
-- EL MOTOR NO ESTA MAL: asume periodos excluyentes, que es lo que hace el 98% de
-- los datos. De los pares consecutivos desde 2024 hay 199 encadenados
-- correctamente (la baja anterior es el dia antes del alta siguiente) y 606 con
-- hueco; solo 15 se pisan. Son errores de datos.
--
-- legitimo_baja_variacion: el modelo antiguo de Access guardaba una fila
-- "envoltura" del contrato (movimiento BAJA) y una fila por cada tramo
-- (movimiento VARIACION), asi que ese solape es intencionado -- es el mismo
-- criterio que isLegitHistorialOverlap() en coordinacion/app.js. Son 2228 de los
-- 2295 pares totales y todos anteriores a 2024. Filtrar por false deja las 66
-- anomalias reales (39 personas, 12 tocando 2026).
--
--   select * from public.historiales_laborales_solapes
--   where not legitimo_baja_variacion
--   order by solape_desde desc;
--
-- OJO: legitimo para el MODELO DE DATOS no significa inocuo para la NOMINA. Un
-- par envoltura+tramo tambien duplicaria el salario base si se calculase una
-- nomina de esas fechas; solo esta a salvo porque son periodos antiguos sobre
-- los que hoy no se nomina.
--
-- movimiento es un campo heredado: de los 1245 periodos con alta desde 2024,
-- 1244 lo tienen vacio. No sirve para clasificar datos nuevos.
--
-- misma_empresa: una persona SI puede tener dos periodos simultaneos si son de
-- empresas distintas del grupo, y entonces el solape es legitimo. Son 15 de los
-- 66 pares anomalos (8 personas, 5 tocando 2026), asi que no es residual: hay
-- que mirar esta columna antes de dar un par por erroneo.
--   * misma_empresa = true  -> error de datos, la nomina cobra dos veces.
--   * misma_empresa = false -> pluriempleo. El dato esta bien, pero
--     calcular_nomina_persona los funde en UN solo calculo cuando en realidad
--     son dos nominas separadas (una por empresa). Sigue siendo un resultado
--     que no hay que dar por bueno.
--
-- security_invoker: hereda el RLS por contrato asignado de historiales_laborales.

drop view if exists public.historiales_laborales_solapes;

create view public.historiales_laborales_solapes
with (security_invoker = true) as
with pares as (
  select
    a.personal_id, a.puesto_id,
    a.id a_id, a.fecha_alta a_alta, a.fecha_baja a_baja, a.jornada a_jornada,
    a.activo a_activo, a.enviado a_enviado, a.gestionado a_gestionado, a.tramitado a_tramitado,
    a.empresa_id a_empresa_id,
    nullif(upper(trim(coalesce(a.movimiento,''))),'') a_movimiento,
    b.id b_id, b.fecha_alta b_alta, b.fecha_baja b_baja, b.jornada b_jornada,
    b.activo b_activo, b.enviado b_enviado, b.gestionado b_gestionado, b.tramitado b_tramitado,
    b.empresa_id b_empresa_id,
    nullif(upper(trim(coalesce(b.movimiento,''))),'') b_movimiento
  from public.historiales_laborales a
  join public.historiales_laborales b
    on b.personal_id = a.personal_id
   and b.puesto_id is not distinct from a.puesto_id
   and a.fecha_alta <= coalesce(b.fecha_baja, 'infinity'::date)
   and b.fecha_alta <= coalesce(a.fecha_baja, 'infinity'::date)
   -- Un solo sentido por par: "a" es el de alta mas temprana (id como desempate),
   -- para que correccion_propuesta hable siempre de recortar el ANTERIOR.
   and (a.fecha_alta, a.id) < (b.fecha_alta, b.id)
)
select
  pr.personal_id,
  p.personal,
  pr.puesto_id,
  pu.puesto,
  -- coalesce obligatorio: con movimiento vacio las comparaciones dan NULL y un
  -- "where not legitimo_baja_variacion" descartaria justo las filas modernas,
  -- que son las unicas que interesan.
  coalesce(
    (pr.a_movimiento = 'BAJA' and pr.b_movimiento = 'VARIACION')
    or (pr.a_movimiento = 'VARIACION' and pr.b_movimiento = 'BAJA'),
    false) as legitimo_baja_variacion,
  (pr.a_empresa_id is not distinct from pr.b_empresa_id) as misma_empresa,
  case
    when pr.a_alta = pr.b_alta and pr.a_baja is not distinct from pr.b_baja
         and pr.a_jornada is not distinct from pr.b_jornada
      then 'duplicado_exacto'
    when pr.b_baja is not null and pr.a_baja is not null and pr.b_baja <= pr.a_baja
      then 'contenido'
    when pr.a_baja is null
      then 'anterior_sin_cerrar'
    else 'fechas_pisadas'
  end as patron,
  pr.b_alta as solape_desde,
  nullif(least(coalesce(pr.a_baja,'infinity'::date), coalesce(pr.b_baja,'infinity'::date)), 'infinity'::date) as solape_hasta,
  -- Con los dos periodos abiertos el fin es 'infinity' y restar fechas infinitas
  -- lanza 22008: el solape no tiene duracion conocida, asi que null.
  case
    when pr.a_baja is null and pr.b_baja is null then null
    else least(coalesce(pr.a_baja,'infinity'::date), coalesce(pr.b_baja,'infinity'::date)) - pr.b_alta + 1
  end as dias_solape,
  pr.a_id, pr.a_alta, pr.a_baja, pr.a_jornada, pr.a_movimiento,
  pr.a_empresa_id, ea.empresa as a_empresa,
  case when pr.a_enviado and pr.a_gestionado and pr.a_tramitado then 'tramitado'
       when pr.a_enviado then 'enviado' else 'sin enviar' end as a_estado,
  pr.a_activo,
  pr.b_id, pr.b_alta, pr.b_baja, pr.b_jornada, pr.b_movimiento,
  pr.b_empresa_id, eb.empresa as b_empresa,
  case when pr.b_enviado and pr.b_gestionado and pr.b_tramitado then 'tramitado'
       when pr.b_enviado then 'enviado' else 'sin enviar' end as b_estado,
  pr.b_activo,
  case
    when pr.a_empresa_id is distinct from pr.b_empresa_id
      then format('Empresas distintas (%s / %s): revisar si es pluriempleo legitimo antes de tocar fechas',
                  coalesce(ea.empresa, '?'), coalesce(eb.empresa, '?'))
    when pr.a_alta = pr.b_alta and pr.a_baja is not distinct from pr.b_baja
         and pr.a_jornada is not distinct from pr.b_jornada
      then format('Duplicado exacto: eliminar %s o %s', pr.a_id, pr.b_id)
    when pr.b_baja is not null and pr.a_baja is not null and pr.b_baja <= pr.a_baja
      then format('El periodo %s queda dentro de %s: decidir cual manda', pr.b_id, pr.a_id)
    when pr.a_baja is null
      then format('Cerrar %s con fecha_baja = %s', pr.a_id, pr.b_alta - 1)
    else format('Ajustar fecha_baja de %s de %s a %s', pr.a_id, pr.a_baja, pr.b_alta - 1)
  end as correccion_propuesta,
  -- Cerrar un indefinido por la entrada de un tramo temporal deja a la persona
  -- sin periodo cuando ese tramo acaba: hay que crear el de vuelta.
  case
    when pr.a_baja is null and pr.b_baja is not null
      then format('Al cerrar %s la persona queda sin periodo desde %s', pr.a_id, pr.b_baja + 1)
  end as aviso
from pares pr
join public.personal p on p.id = pr.personal_id
left join public.puestos pu on pu.id = pr.puesto_id
left join public.empresas ea on ea.id = pr.a_empresa_id
left join public.empresas eb on eb.id = pr.b_empresa_id;

comment on view public.historiales_laborales_solapes is
  'Pares de periodos solapados de la misma persona y puesto. Filtrar por legitimo_baja_variacion = false para ver las anomalias; dentro de ellas, misma_empresa = true son errores de datos y false es pluriempleo (dato correcto, pero la nomina los funde en un solo calculo).';

revoke all on public.historiales_laborales_solapes from public;
grant select on public.historiales_laborales_solapes to authenticated;
