-- ============================================================================
--  Alcance por contrato asignado para `personal` e `instalaciones`.
-- ----------------------------------------------------------------------------
--  Problema: ambas tablas solo tenían políticas de lectura `SELECT USING (true)`
--  para `authenticated`. Como las políticas PERMISIVAS se combinan con OR,
--  cualquier coordinador veía TODO el personal (710) y TODAS las instalaciones
--  (94) en desplegables y filtros, en vez de solo lo de sus contratos.
--
--  Solución (mismo patrón que ya usan contratos y servicios en
--  master_tables_read.sql): añadir una política RESTRICTIVE — que se combina con
--  AND — que obliga a que la fila pertenezca a un contrato asignado al usuario.
--  Admin conserva acceso total (bypass en las funciones).
--
--  El alcance se deriva de las tablas de asignación reales:
--    personal      -> contrato_personal
--    instalaciones -> contrato_instalaciones
--  (NO se usa personal.contrato_id: es texto libre heredado y está corrupto.)
--
--  Requiere: coordinacion_contrato_id_sets.sql (readable/manageable sets),
--            coordinacion_roles.sql (is_coordinacion_admin),
--            coordinacion_personal_access.sql (can_manage_coordinacion_personal).
-- ============================================================================

-- ---------------------------------------------------------------------------
--  Funciones de alcance (SECURITY DEFINER, evaluadas por fila en la policy).
-- ---------------------------------------------------------------------------
create or replace function public.can_access_coordinacion_personal(
  p_personal_id integer,
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
      from public.contrato_personal cp
      where cp.personal_id = p_personal_id
        and cp.contrato_id in (select public.coordinacion_readable_contrato_ids(p_user_id))
    );
$$;

revoke all on function public.can_access_coordinacion_personal(integer, uuid) from public;
grant execute on function public.can_access_coordinacion_personal(integer, uuid) to authenticated;

create or replace function public.can_access_coordinacion_instalacion(
  p_instalacion_id integer,
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
      from public.contrato_instalaciones ci
      where ci.instalacion_id = p_instalacion_id
        and ci.contrato_id in (select public.coordinacion_readable_contrato_ids(p_user_id))
    );
$$;

revoke all on function public.can_access_coordinacion_instalacion(integer, uuid) from public;
grant execute on function public.can_access_coordinacion_instalacion(integer, uuid) to authenticated;

-- ---------------------------------------------------------------------------
--  Lectura acotada (RESTRICTIVE => AND con las permisivas existentes).
--  Solo afecta a `authenticated`; la política `anon` de instalaciones activas
--  (páginas públicas) queda intacta.
-- ---------------------------------------------------------------------------
drop policy if exists "coordinacion_personal_assigned_only" on public.personal;
create policy "coordinacion_personal_assigned_only"
on public.personal
as restrictive
for select
to authenticated
using (public.can_access_coordinacion_personal(id));

drop policy if exists "coordinacion_instalaciones_assigned_only" on public.instalaciones;
create policy "coordinacion_instalaciones_assigned_only"
on public.instalaciones
as restrictive
for select
to authenticated
using (public.can_access_coordinacion_instalacion(id));

-- ---------------------------------------------------------------------------
--  Escritura de personal acotada por contrato (RESTRICTIVE sobre UPDATE).
--  Se combina con la permisiva `authenticated_can_update_personal`
--  (can_manage_coordinacion_personal: rol + pestaña). Resultado: un coordinador
--  solo puede editar personal de sus contratos gestionables. Admin: sin límite.
--  INSERT se deja como está (no se puede acotar por contrato una fila que aún no
--  tiene asignación; la creación sigue protegida por can_manage).
-- ---------------------------------------------------------------------------
drop policy if exists "coordinacion_personal_manage_scope" on public.personal;
create policy "coordinacion_personal_manage_scope"
on public.personal
as restrictive
for update
to authenticated
using (
  coalesce((select public.is_coordinacion_admin()), false)
  or id in (
    select cp.personal_id
    from public.contrato_personal cp
    where cp.contrato_id in (select public.coordinacion_manageable_contrato_ids())
  )
)
with check (
  coalesce((select public.is_coordinacion_admin()), false)
  or id in (
    select cp.personal_id
    from public.contrato_personal cp
    where cp.contrato_id in (select public.coordinacion_manageable_contrato_ids())
  )
);
