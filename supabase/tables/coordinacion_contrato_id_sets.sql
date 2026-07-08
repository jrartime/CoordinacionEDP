-- ============================================================================
--  Conjuntos de contratos accesibles por usuario de coordinación.
-- ----------------------------------------------------------------------------
--  Devuelven el SET (pequeño) de contrato_id derivados de los servicios que el
--  usuario tiene asignados en el panel de accesos. Se usan en las policies RLS
--  de `registros` como  `contrato_id in (select ...)`, de modo que el filtro
--  aprovecha el índice por contrato en vez de llamar una función escalar por
--  fila (que sobre las 341k filas de registros provocaba statement timeout).
--
--  Regla: registros.servicio_id es casi siempre NULL, así que el alcance real
--  es por CONTRATO (los servicios asignados determinan qué contratos ve/gestiona
--  el coordinador). Admin se resuelve aparte con `(select is_coordinacion_admin())`.
-- ============================================================================

-- Contratos que el usuario puede LEER (coordinator / area_coordinator / viewer).
create or replace function public.coordinacion_readable_contrato_ids(p_user_id uuid default auth.uid())
returns setof integer
language sql
stable
security definer
set search_path = public
as $$
  select distinct s.contrato_id
  from public.coordinacion_usuario_servicios cus
  join public.servicios s on s.id = cus.servicio_id
  join public.coordinacion_usuarios cu on cu.user_id = cus.user_id
   and cu.activo = true
   and cu.rol in ('coordinator', 'area_coordinator', 'viewer')
  where cus.user_id = p_user_id
    and s.contrato_id is not null;
$$;

-- Contratos que el usuario puede GESTIONAR (coordinator / area_coordinator).
create or replace function public.coordinacion_manageable_contrato_ids(p_user_id uuid default auth.uid())
returns setof integer
language sql
stable
security definer
set search_path = public
as $$
  select distinct s.contrato_id
  from public.coordinacion_usuario_servicios cus
  join public.servicios s on s.id = cus.servicio_id
  join public.coordinacion_usuarios cu on cu.user_id = cus.user_id
   and cu.activo = true
   and cu.rol in ('coordinator', 'area_coordinator')
  where cus.user_id = p_user_id
    and s.contrato_id is not null;
$$;

revoke all on function public.coordinacion_readable_contrato_ids(uuid) from public;
revoke all on function public.coordinacion_manageable_contrato_ids(uuid) from public;
grant execute on function public.coordinacion_readable_contrato_ids(uuid) to authenticated;
grant execute on function public.coordinacion_manageable_contrato_ids(uuid) to authenticated;
