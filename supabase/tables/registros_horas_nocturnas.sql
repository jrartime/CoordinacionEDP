-- Calculo automatico de las horas nocturnas de un registro.
--
-- POR QUE EN BASE Y NO EN EL NAVEGADOR: hasta ahora cada via que creaba
-- registros tenia que acordarse de calcularlas, y cada una lo hacia con un mapa
-- de contratos cargado en el cliente. En la generacion de julio de 2026 ese mapa
-- no estaba disponible y se enviaba un 0, asi que 54 registros de 6 personas
-- (33,5 horas) se quedaron sin el plus aunque su contrato lo tuviera. Con el
-- trigger da igual por donde entre el registro: generacion desde Actividades,
-- generacion desde Eventos, alta a mano, edicion tipo Excel, asignacion masiva,
-- sustituciones o cambio de situacion.
--
-- CONVENIO DEL CAMPO registros.horas_nocturnas:
--   * NULO = "calculalo tu". Es lo que envia el frontend cuando delega.
--   * CON VALOR distinto del anterior = lo teclea quien edita, se respeta.
--   * CON VALOR igual al anterior, pero cambia el horario, el contrato, la
--     situacion o el tipo de hora = se recalcula, porque lo que lo determinaba
--     ha cambiado.
-- La importacion historica (scripts/import_registros_limpio.py) trae las horas
-- nocturnas del parte con valor explicito, asi que no se pisan.

-- Solape del horario del registro con la franja nocturna de su contrato, y solo
-- si esa persona REALMENTE trabaja ese dia.
--
-- Criterio de "trabaja" (el mismo que usa el motor de nominas para los dias
-- efectivos): situacion NORM o SUST, o FEST cuando la hora es FTRAB; y tipo de
-- hora productivo (REG, HCOMP, MONT, FTRAB). En vacaciones, IT, permisos, bolsa
-- de horas o cambio de actividad no se devenga nocturnidad porque no se trabaja.
--
-- La franja puede cruzar medianoche (22:00-06:00) y el turno tambien, asi que se
-- comparan tres ventanas (dia anterior, actual y siguiente) y se suman solapes.
--
-- SECURITY DEFINER: la lee un trigger que debe funcionar para cualquier usuario
-- con permiso de escritura en registros, tenga o no visibilidad del contrato.
create or replace function public.calcular_horas_nocturnas_registro(
  p_contrato_id integer,
  p_hora_inicio time,
  p_hora_fin time,
  p_situacion_id integer,
  p_tipo_hora_id integer
)
returns numeric
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_tiene boolean; v_ini time; v_fin time;
  v_situacion text; v_tipo text;
  v_turno_ini numeric; v_turno_fin numeric;
  v_win_ini numeric; v_win_len numeric;
  v_solape numeric := 0; v_off numeric;
begin
  if p_contrato_id is null or p_hora_inicio is null or p_hora_fin is null then
    return 0;
  end if;

  select c.tiene_nocturnidad, c.nocturnidad_inicio, c.nocturnidad_fin
    into v_tiene, v_ini, v_fin
  from public.contratos c where c.id = p_contrato_id;
  if not coalesce(v_tiene, false) or v_ini is null or v_fin is null then
    return 0;
  end if;

  select s.situacion into v_situacion from public.situaciones s where s.id = p_situacion_id;
  select th.tipo_hora into v_tipo from public.tipo_horas th where th.id = p_tipo_hora_id;

  -- Solo se paga la noche que se trabaja.
  if not (
    (v_situacion in ('NORM', 'SUST') or (v_situacion = 'FEST' and v_tipo = 'FTRAB'))
    and v_tipo in ('REG', 'HCOMP', 'MONT', 'FTRAB')
  ) then
    return 0;
  end if;

  v_turno_ini := extract(epoch from p_hora_inicio) / 60;
  v_turno_fin := extract(epoch from p_hora_fin) / 60;
  if v_turno_fin < v_turno_ini then
    v_turno_fin := v_turno_fin + 1440;  -- el turno cruza medianoche
  end if;

  v_win_ini := extract(epoch from v_ini) / 60;
  v_win_len := extract(epoch from v_fin) / 60 - v_win_ini;
  if v_win_len <= 0 then
    v_win_len := v_win_len + 1440;      -- la franja cruza medianoche
  end if;

  foreach v_off in array array[-1440, 0, 1440] loop
    v_solape := v_solape + greatest(
      0,
      least(v_turno_fin, v_win_ini + v_off + v_win_len)
        - greatest(v_turno_ini, v_win_ini + v_off)
    );
  end loop;

  return round(v_solape / 60.0, 2);
end;
$$;

revoke all on function public.calcular_horas_nocturnas_registro(integer, time, time, integer, integer) from public;
grant execute on function public.calcular_horas_nocturnas_registro(integer, time, time, integer, integer) to authenticated;

create or replace function public.set_registro_horas_nocturnas()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Nulo siempre significa "resuelvelo en base", tanto al crear como al editar.
  if new.horas_nocturnas is null then
    new.horas_nocturnas := public.calcular_horas_nocturnas_registro(
      new.contrato_id, new.hora_inicio, new.hora_fin, new.situacion_id, new.tipo_hora_id);
    return new;
  end if;

  if tg_op = 'INSERT' then
    return new;  -- llego informado: se respeta (importacion historica)
  end if;

  if new.horas_nocturnas is distinct from old.horas_nocturnas then
    return new;  -- lo cambia quien edita
  end if;

  if new.hora_inicio is distinct from old.hora_inicio
     or new.hora_fin is distinct from old.hora_fin
     or new.contrato_id is distinct from old.contrato_id
     or new.situacion_id is distinct from old.situacion_id
     or new.tipo_hora_id is distinct from old.tipo_hora_id then
    new.horas_nocturnas := public.calcular_horas_nocturnas_registro(
      new.contrato_id, new.hora_inicio, new.hora_fin, new.situacion_id, new.tipo_hora_id);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_registro_horas_nocturnas on public.registros;
create trigger trg_registro_horas_nocturnas
before insert or update on public.registros
for each row
execute function public.set_registro_horas_nocturnas();

-- ============================================================================
-- Recalculo de los registros de julio de 2026 que se quedaron sin el plus
-- ============================================================================
--
-- Ya ejecutado el 2026-07-27: 54 registros, 6 personas, 33,5 horas. Se guardo el
-- estado previo en public.registros_nocturnas_backup_20260727 por si hacia falta
-- volver atras; la tabla se borro el 2026-08-07 (ya no hacia falta y el linter de
-- seguridad de Supabase la marcaba por no tener RLS). Se deja aqui como
-- referencia de lo aplicado.
--
--   create table public.registros_nocturnas_backup_20260727 as
--   select r.id, r.fecha, r.personal_id, r.contrato_id,
--          r.horas_nocturnas as horas_nocturnas_antes
--   from public.registros r
--   join public.contratos c on c.id = r.contrato_id
--   join public.situaciones s on s.id = r.situacion_id
--   join public.tipo_horas th on th.id = r.tipo_hora_id
--   where r.fecha >= '2026-07-01' and r.fecha < '2026-08-01'
--     and c.tiene_nocturnidad is true
--     and s.situacion in ('NORM','SUST')
--     and th.tipo_hora in ('REG','HCOMP','MONT','FTRAB')
--     and coalesce(r.horas_nocturnas, 0) = 0
--     and public.calcular_horas_nocturnas_registro(
--           r.contrato_id, r.hora_inicio, r.hora_fin,
--           r.situacion_id, r.tipo_hora_id) > 0;
--
--   update public.registros r
--   set horas_nocturnas = public.calcular_horas_nocturnas_registro(
--         r.contrato_id, r.hora_inicio, r.hora_fin, r.situacion_id, r.tipo_hora_id)
--   where r.id in (select id from public.registros_nocturnas_backup_20260727);
--
-- PENDIENTE, no aplicado: abril (14 registros, 9,5 h) y mayo (3 registros, 3 h)
-- tambien tienen turnos nocturnos sin plus, pero vienen de la importacion del
-- parte real, donde el 0 puede ser el dato correcto. No tocar sin confirmarlo.
--
-- OJO: el plus de nocturnidad de la NOMINA se paga por el flag
-- historiales_laborales.tiene_nocturnidad, no por el del contrato. Rellenar las
-- horas del registro no basta si la persona no lo tiene marcado en su historial
-- (casos detectados: Alba Queipo con el flag nulo y Enrique Gutierrez en false).
