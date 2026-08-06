-- Habilita la edición del catálogo de instalaciones desde Configuración.
-- La lectura conserva sus políticas propias; la escritura queda limitada a
-- administradores de Coordinación, igual que el resto de tablas maestras.

alter table public.instalaciones enable row level security;

grant select, insert, update, delete on public.instalaciones to authenticated;

drop policy if exists "authenticated_can_insert_instalaciones" on public.instalaciones;
create policy "authenticated_can_insert_instalaciones"
on public.instalaciones
for insert
to authenticated
with check (public.is_coordinacion_admin());

drop policy if exists "authenticated_can_update_instalaciones" on public.instalaciones;
create policy "authenticated_can_update_instalaciones"
on public.instalaciones
for update
to authenticated
using (public.is_coordinacion_admin())
with check (public.is_coordinacion_admin());

drop policy if exists "authenticated_can_delete_instalaciones" on public.instalaciones;
create policy "authenticated_can_delete_instalaciones"
on public.instalaciones
for delete
to authenticated
using (public.is_coordinacion_admin());
