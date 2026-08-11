-- ============================================================================
--  Alcance por contrato asignado para `registro_apuntes`.
-- ----------------------------------------------------------------------------
--  Problema: `registro_apuntes_write.sql` deja las 4 políticas en
--  `USING (true)` / `WITH CHECK (true)` para `authenticated`, sin ningún
--  alcance por contrato — a diferencia de `registros` (`registros_write.sql`,
--  scoped por `coordinacion_manageable_contrato_ids()` /
--  `coordinacion_readable_contrato_ids()`). No importaba mientras nadie
--  escribía ahí desde la app (los apuntes "auto" los crea el trigger
--  `sync_registro_apunte`, que es SECURITY DEFINER y no pasa por RLS), pero la
--  bolsa de horas (registro_apuntes_bolsa.sql / la acción de Registros) abre un
--  camino de escritura MANUAL real, así que hay que acotarlo igual que
--  `registros`.
--
--  Solución (mismo patrón que historiales_laborales_scope.sql): políticas
--  RESTRICTIVE (se combinan con AND sobre las permisivas existentes) que
--  resuelven el contrato del apunte vía su `registro_id -> registros.contrato_id`
--  y exigen que ese contrato sea legible/gestionable por el usuario, o admin.
--
--  Requiere: coordinacion_contrato_id_sets.sql (coordinacion_readable/
--            manageable_contrato_ids), coordinacion_roles.sql
--            (is_coordinacion_admin), registro_apuntes.sql (la tabla).
-- ============================================================================

-- ---------------------------------------------------------------------------
--  Funciones de alcance (SECURITY DEFINER, evaluadas por fila vía registro_id).
-- ---------------------------------------------------------------------------
create or replace function public.can_read_coordinacion_apunte(
  p_registro_id bigint,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.is_coordinacion_admin(p_user_id), false)
    or exists (
      select 1
      from public.registros r
      where r.id = p_registro_id
        and r.contrato_id in (select public.coordinacion_readable_contrato_ids(p_user_id))
    );
$$;

revoke all on function public.can_read_coordinacion_apunte(bigint, uuid) from public;
grant execute on function public.can_read_coordinacion_apunte(bigint, uuid) to authenticated;

create or replace function public.can_manage_coordinacion_apunte(
  p_registro_id bigint,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.is_coordinacion_admin(p_user_id), false)
    or exists (
      select 1
      from public.registros r
      where r.id = p_registro_id
        and r.contrato_id in (select public.coordinacion_manageable_contrato_ids(p_user_id))
    );
$$;

revoke all on function public.can_manage_coordinacion_apunte(bigint, uuid) from public;
grant execute on function public.can_manage_coordinacion_apunte(bigint, uuid) to authenticated;

-- ---------------------------------------------------------------------------
--  Lectura acotada (RESTRICTIVE => AND con la permisiva existente).
-- ---------------------------------------------------------------------------
drop policy if exists "coordinacion_apunte_assigned_only" on public.registro_apuntes;
create policy "coordinacion_apunte_assigned_only"
on public.registro_apuntes
as restrictive
for select
to authenticated
using (public.can_read_coordinacion_apunte(registro_id));

-- ---------------------------------------------------------------------------
--  Escritura acotada por contrato gestionable (RESTRICTIVE sobre cada verbo).
--  El trigger `sync_registro_apunte` sigue funcionando igual porque corre como
--  SECURITY DEFINER (no se evalúa contra el usuario de la sesión, ver comentario
--  de cabecera de registro_apuntes_write.sql) — esto solo acota las escrituras
--  manuales hechas como el usuario autenticado.
-- ---------------------------------------------------------------------------
drop policy if exists "coordinacion_apunte_insert_scope" on public.registro_apuntes;
create policy "coordinacion_apunte_insert_scope"
on public.registro_apuntes
as restrictive
for insert
to authenticated
with check (public.can_manage_coordinacion_apunte(registro_id));

drop policy if exists "coordinacion_apunte_update_scope" on public.registro_apuntes;
create policy "coordinacion_apunte_update_scope"
on public.registro_apuntes
as restrictive
for update
to authenticated
using (public.can_manage_coordinacion_apunte(registro_id))
with check (public.can_manage_coordinacion_apunte(registro_id));

drop policy if exists "coordinacion_apunte_delete_scope" on public.registro_apuntes;
create policy "coordinacion_apunte_delete_scope"
on public.registro_apuntes
as restrictive
for delete
to authenticated
using (public.can_manage_coordinacion_apunte(registro_id));
