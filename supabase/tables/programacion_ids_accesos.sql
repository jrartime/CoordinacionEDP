-- Programación: personal e instalación por ID + accesos públicos por PIN.
-- Esquema coordinacion (Portal Laboral). Fase 1, no destructiva:
--  * programacion_conserjes gana personal_id / instalacion_id (FK a personal / instalaciones).
--  * Los textos personal / instalacion se conservan (la web pública aún los lee) y un
--    trigger los rellena con el nombre oficial cuando hay ID: el ID manda.

alter table coordinacion.programacion_conserjes
  add column if not exists personal_id integer references coordinacion.personal(id) on delete set null,
  add column if not exists instalacion_id integer references coordinacion.instalaciones(id) on delete set null;

create index if not exists idx_programacion_conserjes_personal_id
  on coordinacion.programacion_conserjes (personal_id);
create index if not exists idx_programacion_conserjes_instalacion_id
  on coordinacion.programacion_conserjes (instalacion_id);

-- Relleno por nombre exacto (sin acentos ni mayúsculas); lo que no encaja queda a NULL.
update coordinacion.programacion_conserjes c
set personal_id = p.id
from coordinacion.personal p
where c.personal_id is null
  and lower(trim(p.personal)) = lower(trim(c.personal));

update coordinacion.programacion_conserjes c
set instalacion_id = i.id
from coordinacion.instalaciones i
where c.instalacion_id is null
  and lower(trim(i.instalacion)) = lower(trim(c.instalacion));

create or replace function coordinacion.programacion_conserjes_sync_nombres()
returns trigger
language plpgsql
as $$
begin
  if new.personal_id is not null then
    select p.personal into new.personal from coordinacion.personal p where p.id = new.personal_id;
  end if;
  if new.instalacion_id is not null then
    select i.instalacion into new.instalacion from coordinacion.instalaciones i where i.id = new.instalacion_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_programacion_conserjes_sync_nombres on coordinacion.programacion_conserjes;
create trigger trg_programacion_conserjes_sync_nombres
before insert or update of personal_id, instalacion_id on coordinacion.programacion_conserjes
for each row execute function coordinacion.programacion_conserjes_sync_nombres();

-- Acceso a la web pública: el código de cada persona es su DNI + "edp" (12345678Zedp).
-- Sin tabla de PIN: la función valida contra personal.dni. Los códigos universales
-- siguen siendo constantes de programacion/app.js.
drop table if exists coordinacion.programacion_accesos;

create or replace function coordinacion.get_programming_personnel_for_pin(access_pin text)
returns table(name text)
language sql stable security definer
set search_path to 'coordinacion', 'extensions'
as $$
  select p.personal
  from coordinacion.personal p
  where p.vinculacion_id in (1, 2)
    and nullif(btrim(p.dni), '') is not null
    and upper(regexp_replace(p.dni, '[\s.-]', '', 'g')) || 'EDP'
        = upper(regexp_replace(access_pin, '[\s.-]', '', 'g'))
  order by p.personal
  limit 1
$$;

notify pgrst, 'reload schema';
