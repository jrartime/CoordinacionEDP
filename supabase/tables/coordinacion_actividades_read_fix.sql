create or replace function public.can_read_coordinacion_actividad(
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
      and public.can_read_coordinacion_servicio(p_servicio_id, p_user_id)
    )
    or (
      p_servicio_id is null
      and public.can_access_coordinacion_contrato(p_contrato_id, p_user_id)
    );
$$;

revoke all on function public.can_read_coordinacion_actividad(integer, bigint, uuid) from public;
grant execute on function public.can_read_coordinacion_actividad(integer, bigint, uuid) to authenticated;
