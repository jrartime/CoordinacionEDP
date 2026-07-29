-- Horas trabajadas en un puesto que la persona NO tiene en su historial laboral
-- en esa fecha.
--
-- POR QUE EXISTE: calcular_nomina_devengos filtra los registros por
-- r.puesto_id = h.puesto_id, asi que esas horas no las recoge ningun historial y
-- se perdian en silencio. Caso real que lo destapo: Miguel Antonio Rodriguez
-- hizo 5 horas complementarias como socorrista teniendo contrato de monitor, y
-- no figuraban en su nomina de julio de 2026.
--
-- Ocurre por dos motivos que conviene no confundir:
--   * LEGITIMO: alguien cubre un servicio distinto del suyo (una sustitucion).
--   * ERROR DE DATOS: el puesto del registro esta mal elegido. Se reconoce por
--     lo parecidos que son los nombres ("Conc. Centro Coord" frente a
--     "Conc. Coordiacion", "Coordinacion Contrato" frente a "Coordinacion
--     Servicio").
--
-- QUE HACE EL MOTOR CON ELLAS (decision del usuario, 2026-07-27; las REG
-- revisadas el 2026-07-29):
--   * HCOMP y MONT: se PAGAN, a la tarifa del puesto DONDE se hicieron, en
--     lineas propias de orden 200+ (ver nomina_calculo_persona.sql). Son horas
--     de otro servicio y no entran en la bolsa que absorbe la jornada del puesto
--     contratado.
--   * REG: siguen sin cobrarse como linea propia (su salario base ya se cobra
--     por el historial), pero con p_horas_otros_puestos SI CUENTAN COMO JORNADA
--     del historial predominante. No contarlas restaba en las modalidades que
--     ajustan por horas. Ver el bloque HORAS DE OTRO PUESTO en
--     nomina_calculo.sql y el tick "Contar horas de otros puestos" en Gestion.
--
-- El criterio de "puesto huerfano" NO se duplica aqui: lo define
-- es_puesto_sin_historial (nomina_calculo.sql) y esta funcion lo comparte con el
-- motor, para que la nomina no pague un conjunto de horas distinto del avisado.
--
-- `sin_ningun_historial` marca los dias en que la persona no tiene NINGUN
-- periodo vigente: ahi no hay nomina posible y solo cabe avisar, porque falta el
-- dato de alta. En julio de 2026 eran 1.271 horas de 10 personas.
create or replace function public.get_horas_sin_historial(
  p_personal_id integer,
  p_desde date,
  p_hasta date,
  p_empresa_id integer default null,
  p_historial_ids bigint[] default null
)
returns table (
  puesto_id integer,
  puesto text,
  tipo_hora_id integer,
  tipo_hora text,
  horas numeric,
  registros integer,
  dias integer,
  sin_ningun_historial boolean
)
language sql
stable
security invoker
set search_path = public
as $$
  select r.puesto_id,
         coalesce(pu.puesto, 'Puesto ' || r.puesto_id) as puesto,
         r.tipo_hora_id,
         th.tipo_hora,
         sum(r.horas)::numeric as horas,
         count(*)::integer as registros,
         count(distinct r.fecha)::integer as dias,
         bool_and(not exists (
           select 1 from public.historiales_laborales h2
           where h2.personal_id = r.personal_id
             and r.fecha >= h2.fecha_alta
             and (h2.fecha_baja is null or r.fecha <= h2.fecha_baja)
         )) as sin_ningun_historial
  from public.registros r
  join public.situaciones s on s.id = r.situacion_id
  join public.tipo_horas th on th.id = r.tipo_hora_id
  left join public.puestos pu on pu.id = r.puesto_id
  where r.personal_id = p_personal_id
    and r.fecha >= p_desde and r.fecha <= p_hasta
    and coalesce(r.horas, 0) > 0
    and r.puesto_id is not null
    and (p_empresa_id is null or r.empresa_id = p_empresa_id)
    -- Solo lo que se trabaja: el mismo criterio del resto del motor.
    and (s.situacion in ('NORM', 'SUST') or (s.situacion = 'FEST' and th.tipo_hora = 'FTRAB'))
    -- Acotado a los periodos marcados, igual que los dias trabajados.
    and (p_historial_ids is null or exists (
      select 1 from public.historiales_laborales h3
      where h3.id = any(p_historial_ids) and h3.personal_id = p_personal_id
        and r.fecha >= h3.fecha_alta and (h3.fecha_baja is null or r.fecha <= h3.fecha_baja)))
    -- La clave: ningun historial de ESE puesto cubre ese dia. Mismo criterio que
    -- usa el motor para sumarlas a la jornada.
    and public.es_puesto_sin_historial(r.personal_id, r.puesto_id, r.empresa_id, r.fecha)
  group by r.puesto_id, pu.puesto, r.tipo_hora_id, th.tipo_hora
  having sum(r.horas) > 0
  order by th.tipo_hora, sum(r.horas) desc;
$$;

revoke all on function public.get_horas_sin_historial(integer, date, date, integer, bigint[]) from public;
grant execute on function public.get_horas_sin_historial(integer, date, date, integer, bigint[]) to authenticated;
