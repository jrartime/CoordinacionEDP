-- ============================================================================
--  RLS de `personal_bajas` y sus catálogos.
-- ----------------------------------------------------------------------------
--  Mismo alcance que Historial laboral (decisión expresa: datos de salud,
--  visibles/editables solo por coordinadores de los contratos asignados a
--  esa persona): reutiliza can_access_coordinacion_personal (lectura) y
--  can_manage_coordinacion_historial (escritura) de
--  personal_instalaciones_scope.sql / historiales_laborales_scope.sql, sin
--  funciones nuevas. Admin sin límite.
--
--  Los catálogos (tipo, lugar) son de lectura libre para authenticated y
--  edición solo admin, mismo patrón que puestos/funciones en
--  master_tables_write.sql.
--
--  Requiere: personal_instalaciones_scope.sql, historiales_laborales_scope.sql,
--            coordinacion_roles.sql (is_coordinacion_admin).
-- ============================================================================

alter table public.personal_bajas enable row level security;
alter table public.personal_bajas_tipo enable row level security;
alter table public.personal_bajas_lugar enable row level security;

grant select, insert, update, delete on public.personal_bajas to authenticated;
grant select on public.personal_bajas_tipo to authenticated;
grant select on public.personal_bajas_lugar to authenticated;
grant usage, select on sequence public.personal_bajas_id_seq to authenticated;

-- ---------------------------------------------------------------------------
--  Tabla principal: permisivas base + restrictivas de alcance por contrato.
-- ---------------------------------------------------------------------------
drop policy if exists "authenticated_can_read_personal_bajas" on public.personal_bajas;
create policy "authenticated_can_read_personal_bajas"
on public.personal_bajas
for select
to authenticated
using (true);

drop policy if exists "authenticated_can_insert_personal_bajas" on public.personal_bajas;
create policy "authenticated_can_insert_personal_bajas"
on public.personal_bajas
for insert
to authenticated
with check (true);

drop policy if exists "authenticated_can_update_personal_bajas" on public.personal_bajas;
create policy "authenticated_can_update_personal_bajas"
on public.personal_bajas
for update
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated_can_delete_personal_bajas" on public.personal_bajas;
create policy "authenticated_can_delete_personal_bajas"
on public.personal_bajas
for delete
to authenticated
using (true);

drop policy if exists "coordinacion_personal_bajas_assigned_only" on public.personal_bajas;
create policy "coordinacion_personal_bajas_assigned_only"
on public.personal_bajas
as restrictive
for select
to authenticated
using (public.can_access_coordinacion_personal(personal_id));

drop policy if exists "coordinacion_personal_bajas_insert_scope" on public.personal_bajas;
create policy "coordinacion_personal_bajas_insert_scope"
on public.personal_bajas
as restrictive
for insert
to authenticated
with check (public.can_manage_coordinacion_historial(personal_id));

drop policy if exists "coordinacion_personal_bajas_update_scope" on public.personal_bajas;
create policy "coordinacion_personal_bajas_update_scope"
on public.personal_bajas
as restrictive
for update
to authenticated
using (public.can_manage_coordinacion_historial(personal_id))
with check (public.can_manage_coordinacion_historial(personal_id));

drop policy if exists "coordinacion_personal_bajas_delete_scope" on public.personal_bajas;
create policy "coordinacion_personal_bajas_delete_scope"
on public.personal_bajas
as restrictive
for delete
to authenticated
using (public.can_manage_coordinacion_historial(personal_id));

-- ---------------------------------------------------------------------------
--  Catálogos: lectura libre, escritura solo admin.
-- ---------------------------------------------------------------------------
drop policy if exists "authenticated_can_read_personal_bajas_tipo" on public.personal_bajas_tipo;
create policy "authenticated_can_read_personal_bajas_tipo"
on public.personal_bajas_tipo
for select
to authenticated
using (true);

drop policy if exists "authenticated_can_read_personal_bajas_lugar" on public.personal_bajas_lugar;
create policy "authenticated_can_read_personal_bajas_lugar"
on public.personal_bajas_lugar
for select
to authenticated
using (true);

grant insert, update, delete on public.personal_bajas_tipo to authenticated;
grant insert, update, delete on public.personal_bajas_lugar to authenticated;

drop policy if exists "admin_can_insert_personal_bajas_tipo" on public.personal_bajas_tipo;
create policy "admin_can_insert_personal_bajas_tipo"
on public.personal_bajas_tipo
for insert
to authenticated
with check (public.is_coordinacion_admin());

drop policy if exists "admin_can_update_personal_bajas_tipo" on public.personal_bajas_tipo;
create policy "admin_can_update_personal_bajas_tipo"
on public.personal_bajas_tipo
for update
to authenticated
using (public.is_coordinacion_admin())
with check (public.is_coordinacion_admin());

drop policy if exists "admin_can_delete_personal_bajas_tipo" on public.personal_bajas_tipo;
create policy "admin_can_delete_personal_bajas_tipo"
on public.personal_bajas_tipo
for delete
to authenticated
using (public.is_coordinacion_admin());

drop policy if exists "admin_can_insert_personal_bajas_lugar" on public.personal_bajas_lugar;
create policy "admin_can_insert_personal_bajas_lugar"
on public.personal_bajas_lugar
for insert
to authenticated
with check (public.is_coordinacion_admin());

drop policy if exists "admin_can_update_personal_bajas_lugar" on public.personal_bajas_lugar;
create policy "admin_can_update_personal_bajas_lugar"
on public.personal_bajas_lugar
for update
to authenticated
using (public.is_coordinacion_admin())
with check (public.is_coordinacion_admin());

drop policy if exists "admin_can_delete_personal_bajas_lugar" on public.personal_bajas_lugar;
create policy "admin_can_delete_personal_bajas_lugar"
on public.personal_bajas_lugar
for delete
to authenticated
using (public.is_coordinacion_admin());
