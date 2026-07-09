-- ============================================================================
--  Facetas de filtros para la pestana Registros.
-- ----------------------------------------------------------------------------
--  - get_records_filter_contratos: contratos activos visibles para el perfil.
--  - get_records_facets: combinaciones reales presentes en registros para que
--    cada desplegable pueda recalcularse contra los demas filtros.
-- ============================================================================

create or replace function public.get_records_filter_contratos(p_user_id uuid default auth.uid())
returns table (
  id integer,
  contrato text
)
language sql
stable
security definer
set search_path = public
as $$
  select distinct c.id, c.contrato
  from public.contratos c
  where c.activo = true
    and (
      public.is_coordinacion_admin(p_user_id)
      or exists (
        select 1
        from public.coordinacion_usuario_servicios cus
        join public.servicios s
          on s.id = cus.servicio_id
         and s.contrato_id = c.id
         and s.activo = true
        join public.coordinacion_usuarios cu
          on cu.user_id = cus.user_id
         and cu.activo = true
         and cu.rol in ('coordinator', 'area_coordinator', 'viewer')
        where cus.user_id = p_user_id
      )
    )
  order by c.contrato;
$$;

create or replace function public.get_records_facets(
  p_fecha_desde date default null,
  p_fecha_hasta date default null,
  p_actividad_id bigint default null
)
returns table (
  contrato_id integer,
  servicio_id bigint,
  personal_id integer,
  instalacion_id integer
)
language sql
stable
set search_path = public
as $$
  select distinct
    r.contrato_id,
    r.servicio_id,
    r.personal_id,
    r.instalacion_id
  from public.registros r
  join public.contratos c
    on c.id = r.contrato_id
   and c.activo = true
  where (p_fecha_desde is null or r.fecha >= p_fecha_desde)
    and (p_fecha_hasta is null or r.fecha <= p_fecha_hasta)
    and (p_actividad_id is null or r.actividad_id = p_actividad_id)
    and r.contrato_id is not null;
$$;

revoke all on function public.get_records_filter_contratos(uuid) from public;
revoke all on function public.get_records_facets(date, date, bigint) from public;
grant execute on function public.get_records_filter_contratos(uuid) to authenticated;
grant execute on function public.get_records_facets(date, date, bigint) to authenticated;
