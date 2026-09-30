-- Factor corrector del festivo trabajado (FTRAB) aplicado en Registros.
--
-- El motor de nominas paga el "Plus festivo trabajado" sumando registros.horas de
-- las filas FTRAB SIN volver a multiplicar (ver calcular_nomina_devengos): el
-- recargo (tipo_horas.multiplicador, 1,75) debe venir YA aplicado en el registro.
-- Hasta ahora dependia de que quien lo grababa se acordara; en septiembre de 2026
-- Ana Blanca Busto Villar tenia 3 h reales (10:00-13:00) con horas = 3 y no 5,25.
--
-- POR QUE EN BASE: mismo motivo que registros_horas_nocturnas.sql. Todas las vias
-- (generacion desde Actividades/Eventos, alta a mano, edicion tipo Excel,
-- asignacion masiva, cambio de tipo de hora) calculan horas = duracion del horario
-- sin recargo; el trigger lo corrige de forma uniforme.
--
-- CRITERIO (idempotente, se calcula siempre desde el horario, nunca sobre `horas`):
--   * Tipo FTRAB y horas ~ duracion del horario  -> horas = duracion x multiplicador.
--   * Tipo FTRAB y horas ya ~ duracion x mult.    -> se deja (ya aplicado).
--   * Cualquier otro valor de horas               -> se respeta (dato tecleado o
--     importacion historica; en 12 de 187 filas 2024-2026 no cuadraba).
--   * Sin horario o con horas nulas (CAMB/LG)     -> no se toca.
--   * Al SALIR de FTRAB (update) con horas = duracion x mult y sin haberlas
--     tocado el editor -> vuelven a la duracion simple.
-- El multiplicador se lee de tipo_horas (id 4), no esta fijado en el codigo.

create or replace function public.set_registro_ftrab_factor()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_mult numeric;
  v_min numeric;
  v_base numeric;
begin
  if new.hora_inicio is null or new.hora_fin is null or new.horas is null then
    return new;
  end if;

  v_min := extract(epoch from (new.hora_fin - new.hora_inicio)) / 60;
  if v_min <= 0 then
    v_min := v_min + 1440;  -- el turno cruza medianoche
  end if;
  v_base := round(v_min / 60.0, 2);

  select th.multiplicador into v_mult from public.tipo_horas th where th.id = 4;
  v_mult := coalesce(v_mult, 1);

  if new.tipo_hora_id = 4 then
    if v_mult <> 1 and abs(new.horas - v_base) < 0.011 then
      new.horas := round(v_base * v_mult, 2);
    end if;
  elsif tg_op = 'UPDATE' and old.tipo_hora_id = 4
        and new.horas is not distinct from old.horas
        and v_mult <> 1
        and abs(new.horas - round(v_base * v_mult, 2)) < 0.011 then
    new.horas := v_base;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_registro_ftrab_factor on public.registros;
create trigger trg_registro_ftrab_factor
before insert or update on public.registros
for each row
execute function public.set_registro_ftrab_factor();

-- NO SE HAN CORREGIDO REGISTROS EXISTENTES: el trigger solo actua al grabar. Los
-- festivos de septiembre de 2026 los revisa el usuario a mano (p. ej. registro
-- 706457: 10:00-13:00, horas = 3, deberia ser 5,25).
