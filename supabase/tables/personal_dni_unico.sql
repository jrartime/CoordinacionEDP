-- DNI/NIE único y en mayúsculas en coordinacion.personal
-- (aplicado 2026-10-09 en el proyecto Portal Laboral, tras fusionar el duplicado Rubén Roso Muñoz).

-- DNI/NIE siempre en mayúsculas y sin espacios.
create or replace function coordinacion.personal_dni_normalizar() returns trigger
language plpgsql set search_path = coordinacion as $$
begin
  if new.dni is not null then
    new.dni := nullif(upper(btrim(new.dni)), '');
  end if;
  return new;
end $$;

drop trigger if exists trg_personal_dni_normalizar on coordinacion.personal;
create trigger trg_personal_dni_normalizar
  before insert or update of dni on coordinacion.personal
  for each row execute function coordinacion.personal_dni_normalizar();

update coordinacion.personal set dni = nullif(upper(btrim(dni)), '')
 where dni is not null and dni is distinct from nullif(upper(btrim(dni)), '');

-- DNI único (los nulos siguen permitidos). Sustituye al índice no único anterior.
create unique index if not exists personal_dni_unico
  on coordinacion.personal (dni)
  where dni is not null;
drop index if exists coordinacion.idx_personal_dni;
