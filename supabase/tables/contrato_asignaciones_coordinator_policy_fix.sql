create or replace function public.can_manage_coordinacion_contrato(
  p_contrato_id integer,
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
      from public.coordinacion_usuario_servicios cus
      join public.servicios s
        on s.id = cus.servicio_id
      join public.coordinacion_usuarios cu
        on cu.user_id = cus.user_id
       and cu.activo = true
       and cu.rol in ('coordinator', 'area_coordinator')
      where cus.user_id = p_user_id
        and s.contrato_id = p_contrato_id
    );
$$;

revoke all on function public.can_manage_coordinacion_contrato(integer, uuid) from public;
grant execute on function public.can_manage_coordinacion_contrato(integer, uuid) to authenticated;

drop policy if exists "contrato_personal_can_write" on public.contrato_personal;
create policy "contrato_personal_can_write"
on public.contrato_personal
for all
to authenticated
using (public.can_manage_coordinacion_contrato(contrato_id))
with check (public.can_manage_coordinacion_contrato(contrato_id));

drop policy if exists "contrato_instalaciones_can_write" on public.contrato_instalaciones;
create policy "contrato_instalaciones_can_write"
on public.contrato_instalaciones
for all
to authenticated
using (public.can_manage_coordinacion_contrato(contrato_id))
with check (public.can_manage_coordinacion_contrato(contrato_id));
