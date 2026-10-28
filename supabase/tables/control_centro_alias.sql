-- Control personal: nombres antiguos de centro -> instalación oficial.
-- Se siembra con los nombres originales de registros_horarios_centro_backup
-- (ver registros_horarios_instalacion.sql). El importador, la edición y la
-- asignación masiva leen get_control_centro_catalogo() para traducir cualquier
-- nombre conocido (alias u oficial) a su instalación. Para reconocer un nombre
-- nuevo basta añadir una fila aquí. Esquema coordinacion. Aplicado el 28/10/2026.

create table if not exists coordinacion.control_centro_alias (
  alias text primary key,
  instalacion_id integer not null references coordinacion.instalaciones(id)
);
alter table coordinacion.control_centro_alias enable row level security;
drop policy if exists control_centro_alias_admin on coordinacion.control_centro_alias;
create policy control_centro_alias_admin on coordinacion.control_centro_alias for all to authenticated
  using (coordinacion.is_coordinacion_admin()) with check (coordinacion.is_coordinacion_admin());

insert into coordinacion.control_centro_alias (alias, instalacion_id)
select distinct b.centro, h.instalacion_id
from coordinacion.registros_horarios_centro_backup b
join coordinacion.registros_horarios h on h.id = b.id
where b.centro is not null and h.instalacion_id is not null
on conflict (alias) do nothing;

-- SECURITY DEFINER a propósito: el RLS de instalaciones limita a un coordinador
-- a las suyas, y aquí hace falta el catálogo completo para traducir nombres.
create or replace function coordinacion.get_control_centro_catalogo()
returns table (alias text, instalacion_id integer, instalacion text, activo boolean)
language sql stable security definer set search_path = coordinacion, public as $$
  select i.instalacion, i.id, i.instalacion, i.activo from coordinacion.instalaciones i
  where coordinacion.is_coordinacion_user()
  union
  select a.alias, i.id, i.instalacion, i.activo from coordinacion.control_centro_alias a
  join coordinacion.instalaciones i on i.id = a.instalacion_id
  where coordinacion.is_coordinacion_user()
$$;
revoke all on function coordinacion.get_control_centro_catalogo() from public, anon;
grant execute on function coordinacion.get_control_centro_catalogo() to authenticated;
