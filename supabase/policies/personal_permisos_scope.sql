-- ============================================================================
--  RLS de `personal_permisos` y sus catálogos (antes `personal_conciliacion`).
-- ----------------------------------------------------------------------------
--  Mismo alcance por contrato que Historial laboral y personal_bajas: lectura
--  con can_access_coordinacion_personal, escritura con
--  can_manage_coordinacion_historial. Admin sin límite.
--
--  Los catálogos (categoría, tipo) son de lectura libre para authenticated y
--  edición solo admin, mismo patrón que puestos/funciones en
--  master_tables_write.sql.
--
--  Las policies del antiguo nombre `personal_conciliacion*` siguen colgando
--  de la tabla renombrada bajo su nombre viejo (un ALTER TABLE RENAME no
--  renombra las policies) — este fichero las limpia explícitamente antes de
--  crear las nuevas.
--
--  Requiere: personal_instalaciones_scope.sql, historiales_laborales_scope.sql,
--            coordinacion_roles.sql (is_coordinacion_admin).
-- ============================================================================

alter table public.personal_permisos enable row level security;
alter table public.personal_permisos_tipo enable row level security;
alter table public.personal_permisos_categoria enable row level security;

grant select, insert, update, delete on public.personal_permisos to authenticated;
grant select on public.personal_permisos_tipo to authenticated;
grant select on public.personal_permisos_categoria to authenticated;
grant usage, select on sequence public.personal_permisos_id_seq to authenticated;

-- ---------------------------------------------------------------------------
--  Limpieza de las policies con el nombre antiguo (personal_conciliacion*).
-- ---------------------------------------------------------------------------
drop policy if exists "authenticated_can_read_personal_conciliacion" on public.personal_permisos;
drop policy if exists "authenticated_can_insert_personal_conciliacion" on public.personal_permisos;
drop policy if exists "authenticated_can_update_personal_conciliacion" on public.personal_permisos;
drop policy if exists "authenticated_can_delete_personal_conciliacion" on public.personal_permisos;
drop policy if exists "coordinacion_personal_conciliacion_assigned_only" on public.personal_permisos;
drop policy if exists "coordinacion_personal_conciliacion_insert_scope" on public.personal_permisos;
drop policy if exists "coordinacion_personal_conciliacion_update_scope" on public.personal_permisos;
drop policy if exists "coordinacion_personal_conciliacion_delete_scope" on public.personal_permisos;
drop policy if exists "authenticated_can_read_personal_conciliacion_tipo" on public.personal_permisos_tipo;
drop policy if exists "admin_can_insert_personal_conciliacion_tipo" on public.personal_permisos_tipo;
drop policy if exists "admin_can_update_personal_conciliacion_tipo" on public.personal_permisos_tipo;
drop policy if exists "admin_can_delete_personal_conciliacion_tipo" on public.personal_permisos_tipo;
drop policy if exists "authenticated_can_read_personal_conciliacion_categoria" on public.personal_permisos_categoria;
drop policy if exists "admin_can_insert_personal_conciliacion_categoria" on public.personal_permisos_categoria;
drop policy if exists "admin_can_update_personal_conciliacion_categoria" on public.personal_permisos_categoria;
drop policy if exists "admin_can_delete_personal_conciliacion_categoria" on public.personal_permisos_categoria;

-- ---------------------------------------------------------------------------
--  Tabla principal: permisivas base + restrictivas de alcance por contrato.
-- ---------------------------------------------------------------------------
drop policy if exists "authenticated_can_read_personal_permisos" on public.personal_permisos;
create policy "authenticated_can_read_personal_permisos"
on public.personal_permisos
for select
to authenticated
using (true);

drop policy if exists "authenticated_can_insert_personal_permisos" on public.personal_permisos;
create policy "authenticated_can_insert_personal_permisos"
on public.personal_permisos
for insert
to authenticated
with check (true);

drop policy if exists "authenticated_can_update_personal_permisos" on public.personal_permisos;
create policy "authenticated_can_update_personal_permisos"
on public.personal_permisos
for update
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated_can_delete_personal_permisos" on public.personal_permisos;
create policy "authenticated_can_delete_personal_permisos"
on public.personal_permisos
for delete
to authenticated
using (true);

drop policy if exists "coordinacion_personal_permisos_assigned_only" on public.personal_permisos;
create policy "coordinacion_personal_permisos_assigned_only"
on public.personal_permisos
as restrictive
for select
to authenticated
using (public.can_access_coordinacion_personal(personal_id));

drop policy if exists "coordinacion_personal_permisos_insert_scope" on public.personal_permisos;
create policy "coordinacion_personal_permisos_insert_scope"
on public.personal_permisos
as restrictive
for insert
to authenticated
with check (public.can_manage_coordinacion_historial(personal_id));

drop policy if exists "coordinacion_personal_permisos_update_scope" on public.personal_permisos;
create policy "coordinacion_personal_permisos_update_scope"
on public.personal_permisos
as restrictive
for update
to authenticated
using (public.can_manage_coordinacion_historial(personal_id))
with check (public.can_manage_coordinacion_historial(personal_id));

drop policy if exists "coordinacion_personal_permisos_delete_scope" on public.personal_permisos;
create policy "coordinacion_personal_permisos_delete_scope"
on public.personal_permisos
as restrictive
for delete
to authenticated
using (public.can_manage_coordinacion_historial(personal_id));

-- ---------------------------------------------------------------------------
--  Catálogos: lectura libre, escritura solo admin.
-- ---------------------------------------------------------------------------
drop policy if exists "authenticated_can_read_personal_permisos_tipo" on public.personal_permisos_tipo;
create policy "authenticated_can_read_personal_permisos_tipo"
on public.personal_permisos_tipo
for select
to authenticated
using (true);

drop policy if exists "authenticated_can_read_personal_permisos_categoria" on public.personal_permisos_categoria;
create policy "authenticated_can_read_personal_permisos_categoria"
on public.personal_permisos_categoria
for select
to authenticated
using (true);

grant insert, update, delete on public.personal_permisos_tipo to authenticated;
grant insert, update, delete on public.personal_permisos_categoria to authenticated;

drop policy if exists "admin_can_insert_personal_permisos_tipo" on public.personal_permisos_tipo;
create policy "admin_can_insert_personal_permisos_tipo"
on public.personal_permisos_tipo
for insert
to authenticated
with check (public.is_coordinacion_admin());

drop policy if exists "admin_can_update_personal_permisos_tipo" on public.personal_permisos_tipo;
create policy "admin_can_update_personal_permisos_tipo"
on public.personal_permisos_tipo
for update
to authenticated
using (public.is_coordinacion_admin())
with check (public.is_coordinacion_admin());

drop policy if exists "admin_can_delete_personal_permisos_tipo" on public.personal_permisos_tipo;
create policy "admin_can_delete_personal_permisos_tipo"
on public.personal_permisos_tipo
for delete
to authenticated
using (public.is_coordinacion_admin());

drop policy if exists "admin_can_insert_personal_permisos_categoria" on public.personal_permisos_categoria;
create policy "admin_can_insert_personal_permisos_categoria"
on public.personal_permisos_categoria
for insert
to authenticated
with check (public.is_coordinacion_admin());

drop policy if exists "admin_can_update_personal_permisos_categoria" on public.personal_permisos_categoria;
create policy "admin_can_update_personal_permisos_categoria"
on public.personal_permisos_categoria
for update
to authenticated
using (public.is_coordinacion_admin())
with check (public.is_coordinacion_admin());

drop policy if exists "admin_can_delete_personal_permisos_categoria" on public.personal_permisos_categoria;
create policy "admin_can_delete_personal_permisos_categoria"
on public.personal_permisos_categoria
for delete
to authenticated
using (public.is_coordinacion_admin());
