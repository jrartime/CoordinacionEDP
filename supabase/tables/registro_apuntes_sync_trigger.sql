-- ============================================================================
--  Sincronizacion automatica registros -> registro_apuntes  (PASO 2)
-- ----------------------------------------------------------------------------
--  Hace que el apunte "auto" de cada jornada siga siempre a su fila de
--  registros, venga el cambio de donde venga (grid, alta, duplicado,
--  asignacion masiva, sustituciones, importacion o SQL directo). Asi los
--  apuntes son DATO VIVO sin tocar los multiples caminos de escritura del JS.
--
--  Reglas auto-gestionadas (reconstruye los apuntes auto en cada cambio):
--    TARIFA (tipo_hora 1-4 o sin tipo) -> 1 apunte DEVENGO (+horas).
--    PNR (tipo_hora 5)                 -> par enlazado: DEVENGO +horas y
--                                         DEVOLUCION_HD -horas (neto 0).
--    BIN/BOUT (7/8, bolsa)             -> pendiente de regla: sin apunte auto.
--  Los apuntes manuales (auto=false) nunca se tocan.
-- ============================================================================
alter table public.registro_apuntes
  add column if not exists auto boolean not null default false;

comment on column public.registro_apuntes.auto is
  'true = apunte primario mantenido por el trigger desde registros; false = apunte manual (no se toca).';

-- Los apuntes del backfill son el apunte auto primario de cada registro.
update public.registro_apuntes set auto = true where nota like 'backfill tipo_hora_id=%';

create or replace function public.sync_registro_apunte()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_tarifa boolean;
  v_concepto integer;
  v_cant real;
  v_should_rebuild boolean;
  v_devengo_id bigint;
begin
  v_is_tarifa := NEW.tipo_hora_id is null or NEW.tipo_hora_id in (1,2,3,4);
  v_concepto  := coalesce(NEW.tipo_hora_id, 1);
  v_cant      := coalesce(NEW.horas, 0);

  v_should_rebuild := TG_OP = 'INSERT'
    or NEW.horas is distinct from OLD.horas
    or NEW.tipo_hora_id is distinct from OLD.tipo_hora_id
    or NEW.abonar is distinct from OLD.abonar
    or NEW.facturar is distinct from OLD.facturar;

  if not v_should_rebuild then
    return NEW;
  end if;

  -- Reconstruccion de los apuntes AUTO de esta jornada (los manuales no se tocan).
  delete from public.registro_apuntes where registro_id = NEW.id and auto = true;

  if v_is_tarifa then
    -- Horas trabajadas normales -> un unico DEVENGO.
    insert into public.registro_apuntes
      (registro_id, cantidad, concepto_id, movimiento, abonar, facturar, auto, nota)
    values (NEW.id, v_cant, v_concepto, 'DEVENGO',
            coalesce(NEW.abonar, true), coalesce(NEW.facturar, true), true, 'auto-sync');

  elsif NEW.tipo_hora_id = 5 then
    -- PNR (permiso no retribuido): pagar y devolver. Par enlazado, neto 0.
    insert into public.registro_apuntes
      (registro_id, cantidad, concepto_id, movimiento, abonar, facturar, auto, nota)
    values (NEW.id, abs(v_cant), 1, 'DEVENGO',
            coalesce(NEW.abonar, true), coalesce(NEW.facturar, true), true, 'auto-sync PNR (devengo)')
    returning id into v_devengo_id;

    insert into public.registro_apuntes
      (registro_id, cantidad, concepto_id, movimiento, abonar, facturar, auto, compensa_apunte_id, nota)
    values (NEW.id, -abs(v_cant), 1, 'DEVOLUCION_HD',
            coalesce(NEW.abonar, true), coalesce(NEW.facturar, true), true, v_devengo_id,
            'auto-sync PNR (devolucion)');

  -- BIN (7) / BOUT (8): bolsa de horas, regla pendiente -> sin apunte auto por ahora.
  end if;

  return NEW;
end $$;

-- DELETE de registros lo cubre el ON DELETE CASCADE de la FK.
drop trigger if exists trg_sync_registro_apunte_ins on public.registros;
create trigger trg_sync_registro_apunte_ins
  after insert on public.registros
  for each row execute function public.sync_registro_apunte();

drop trigger if exists trg_sync_registro_apunte_upd on public.registros;
create trigger trg_sync_registro_apunte_upd
  after update on public.registros
  for each row execute function public.sync_registro_apunte();
