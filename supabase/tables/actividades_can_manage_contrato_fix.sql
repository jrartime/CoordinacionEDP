-- ============================================================================
--  Corrige can_manage_coordinacion_actividad: antes solo miraba servicio_id
--  (`p_servicio_id is not null and can_manage_coordinacion_servicio(...)`),
--  asi que para cualquier actividad SIN servicio_id (687 de 886, el 77% en
--  produccion a 2026-09-15 — servicio_id es opcional en actividades) la
--  funcion devolvia false para todo el mundo salvo admin, sin mirar el
--  contrato en absoluto. Un coordinador con el contrato asignado no podia
--  insertar/editar/borrar esas actividades aunque las viera perfectamente
--  (la lectura, can_read_coordinacion_actividad, ya tenia el fallback
--  correcto a contrato cuando servicio_id es null).
--
--  Requiere actividades.sql (tabla + policies) y coordinacion_usuario_contratos.sql
--  (can_manage_coordinacion_contrato).
-- ============================================================================

drop policy if exists "authenticated_can_insert_actividades" on public.actividades;
drop policy if exists "authenticated_can_update_actividades" on public.actividades;
drop policy if exists "authenticated_can_delete_actividades" on public.actividades;

drop function if exists public.can_manage_coordinacion_actividad(bigint, uuid);

create or replace function public.can_manage_coordinacion_actividad(
  p_contrato_id integer,
  p_servicio_id bigint default null,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.is_coordinacion_admin(p_user_id), false)
    or (
      p_servicio_id is not null
      and public.can_manage_coordinacion_servicio(p_servicio_id, p_user_id)
    )
    or (
      p_servicio_id is null
      and public.can_manage_coordinacion_contrato(p_contrato_id, p_user_id)
    );
$$;

revoke all on function public.can_manage_coordinacion_actividad(integer, bigint, uuid) from public;
grant execute on function public.can_manage_coordinacion_actividad(integer, bigint, uuid) to authenticated;

create policy "authenticated_can_insert_actividades"
on public.actividades
for insert
to authenticated
with check (public.can_manage_coordinacion_actividad(contrato_id, servicio_id));

create policy "authenticated_can_update_actividades"
on public.actividades
for update
to authenticated
using (public.can_manage_coordinacion_actividad(contrato_id, servicio_id))
with check (public.can_manage_coordinacion_actividad(contrato_id, servicio_id));

create policy "authenticated_can_delete_actividades"
on public.actividades
for delete
to authenticated
using (public.can_manage_coordinacion_actividad(contrato_id, servicio_id));
