-- Listado de personal para los contadores de plantilla de la pestaña Personal
-- (plantilla, plantilla activa, contrato fijo/temporal). Devuelve una fila por
-- persona en vez de agregados: el frontend calcula los totales H/M en cliente
-- Y usa las mismas filas para el listado emergente que abre cada contador
-- (clic -> ver quién compone ese número, con acceso a su ficha y a su
-- historial laboral). SECURITY INVOKER: respeta el RLS de personal_completo e
-- historiales_laborales_detalle (mismo alcance por contrato que ya aplica al
-- listado de Personal), asi que un coordinador solo ve el personal que puede
-- ver.
--
-- "Plantilla" = personal.persona = true (excluye los recursos genericos de
-- programacion como "zz Conserjeria 01", que no son personas reales; estaban
-- inflando la plantilla activa) y vinculacion_id distinto de 4 ("No
-- pertenece"). "Plantilla activa" es el subconjunto con vinculacion_id = 1
-- (se calcula en el frontend a partir de vinculacion_id).
--
-- "Fijo" / "temporal" se toma del historial laboral MAS RECIENTE de la
-- persona (por fecha_alta), no del "vigente hoy": el fijo discontinuo
-- (contrato clave 300, duracion Indefinido) da de baja cada historial con
-- motivo "Fin Servicio FD" al acabar la temporada y no vuelve a dar de alta
-- hasta el siguiente llamamiento, así que en el hueco entre temporadas no hay
-- ningún historial vigente hoy aunque la persona siga vinculada y siga siendo
-- fija. Casos de referencia: Enrique Manuel González González y Perfecto Díaz
-- Alonso, contrato 300, entre la baja de junio y el alta de septiembre.
-- Tomar el historial más reciente (aunque su fecha_alta sea futura o su
-- fecha_baja ya haya pasado) clasifica correctamente a estas personas como
-- "fijo" durante el hueco. Ante empate de fecha_alta (puestos concurrentes)
-- se prioriza el que sea Indefinido.
create or replace function public.get_personal_estadisticas()
returns table (
  personal_id integer,
  personal text,
  dni text,
  genero text,
  vinculacion_id integer,
  tipo_contrato text
)
language sql
stable
security invoker
set search_path = public
as $$
  with historial_reciente as (
    select distinct on (h.personal_id)
      h.personal_id,
      h.contrato_laboral_duracion
    from public.historiales_laborales_detalle h
    order by
      h.personal_id,
      h.fecha_alta desc nulls last,
      (h.contrato_laboral_duracion = 'Indefinido') desc nulls last,
      h.id desc
  )
  select
    p.id,
    p.personal,
    p.dni,
    p.genero,
    p.vinculacion_id,
    case
      when hr.contrato_laboral_duracion = 'Indefinido' then 'fijo'
      when hr.contrato_laboral_duracion is not null then 'temporal'
      else null
    end as tipo_contrato
  from public.personal_completo p
  left join historial_reciente hr on hr.personal_id = p.id
  where coalesce(p.persona, false)
    and p.vinculacion_id is distinct from 4
  order by p.personal;
$$;

revoke all on function public.get_personal_estadisticas() from public;
grant execute on function public.get_personal_estadisticas() to authenticated;
