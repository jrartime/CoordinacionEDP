-- ============================================================================
--  Alcance por contrato asignado para `historiales_laborales`.
-- ----------------------------------------------------------------------------
--  Problema: la tabla solo tenía políticas SELECT/INSERT/UPDATE/DELETE
--  `USING (true)` para `authenticated` (ver historiales_laborales.sql). Como las
--  políticas PERMISIVAS se combinan con OR, cualquier coordinador con la pestaña
--  "Historial laboral" veía Y editaba el historial de TODO el personal, no solo
--  el de sus contratos.
--
--  Solución (mismo patrón que personal/instalaciones en
--  personal_instalaciones_scope.sql): políticas RESTRICTIVE — que se combinan con
--  AND — que exigen que la persona del periodo (`personal_id`) esté asignada a un
--  contrato del coordinador. La lectura reutiliza `can_access_coordinacion_personal`
--  (contrato legible); la escritura exige contrato *gestionable*. El admin conserva
--  acceso total (bypass dentro de las funciones vía is_coordinacion_admin).
--
--  El alcance se deriva de la tabla de asignación real `contrato_personal`
--  (NO se usa personal.contrato_id: es texto libre heredado y está corrupto).
--
--  La app lee de la vista `historiales_laborales_detalle`, que ya es
--  `security_invoker = true`, de modo que estas políticas de la tabla base se
--  aplican también a través de la vista.
--
--  Requiere: personal_instalaciones_scope.sql (can_access_coordinacion_personal),
--            coordinacion_contrato_id_sets.sql (coordinacion_manageable_contrato_ids),
--            coordinacion_roles.sql (is_coordinacion_admin).
-- ============================================================================

-- ---------------------------------------------------------------------------
--  Función de alcance de escritura (SECURITY DEFINER, evaluada por fila).
--  Persona en un contrato GESTIONABLE del usuario, o admin.
-- ---------------------------------------------------------------------------
create or replace function public.can_manage_coordinacion_historial(
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
        and cp.contrato_id in (select public.coordinacion_manageable_contrato_ids(p_user_id))
    );
$$;

revoke all on function public.can_manage_coordinacion_historial(integer, uuid) from public;
grant execute on function public.can_manage_coordinacion_historial(integer, uuid) to authenticated;

-- ---------------------------------------------------------------------------
--  Lectura acotada (RESTRICTIVE => AND con la permisiva existente).
--  Un coordinador solo ve el historial de personas de sus contratos legibles.
-- ---------------------------------------------------------------------------
drop policy if exists "coordinacion_historial_assigned_only" on public.historiales_laborales;
create policy "coordinacion_historial_assigned_only"
on public.historiales_laborales
as restrictive
for select
to authenticated
using (public.can_access_coordinacion_personal(personal_id));

-- ---------------------------------------------------------------------------
--  Escritura acotada por contrato gestionable (RESTRICTIVE sobre cada verbo).
--  Se combina con las permisivas `authenticated_can_*` (using/with check true).
--  Resultado: un coordinador solo crea/edita/borra periodos de personas en sus
--  contratos gestionables. Admin: sin límite.
-- ---------------------------------------------------------------------------
drop policy if exists "coordinacion_historial_insert_scope" on public.historiales_laborales;
create policy "coordinacion_historial_insert_scope"
on public.historiales_laborales
as restrictive
for insert
to authenticated
with check (public.can_manage_coordinacion_historial(personal_id));

drop policy if exists "coordinacion_historial_update_scope" on public.historiales_laborales;
create policy "coordinacion_historial_update_scope"
on public.historiales_laborales
as restrictive
for update
to authenticated
using (public.can_manage_coordinacion_historial(personal_id))
with check (public.can_manage_coordinacion_historial(personal_id));

drop policy if exists "coordinacion_historial_delete_scope" on public.historiales_laborales;
create policy "coordinacion_historial_delete_scope"
on public.historiales_laborales
as restrictive
for delete
to authenticated
using (public.can_manage_coordinacion_historial(personal_id));
