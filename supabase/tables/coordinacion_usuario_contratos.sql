-- ============================================================================
--  coordinacion_usuario_contratos — sustituye a coordinacion_usuario_servicios
--  como mecanismo de concesion de acceso: un coordinador gestiona CONTRATOS
--  directamente, no "servicios que resultan pertenecer a un contrato". Antes
--  el acceso a un contrato se derivaba uniendo por servicios.contrato_id; eso
--  deja de tener sentido en cuanto un servicio puede estar en varios
--  contratos (ver contrato_servicios.sql). La migracion de datos de abajo es
--  mecanica 1:1 porque, en el momento de crear esta tabla, cada servicio
--  TODAVIA pertenecia a un unico contrato (antes de servicios_globalizar.sql).
--
--  coordinacion_usuario_servicios queda en desuso tras esta migracion (ya no
--  la usa ninguna funcion de alcance) pero no se borra aqui por si hiciera
--  falta auditarla; se retira cuando el frontend de Accesos deje de
--  escribirla.
--
--  Requiere coordinacion_roles.sql (coordinacion_usuarios, coordinacion_usuario_servicios).
-- ============================================================================

create table if not exists public.coordinacion_usuario_contratos (
  user_id uuid not null references public.coordinacion_usuarios (user_id) on delete cascade,
  contrato_id integer not null references public.contratos (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, contrato_id)
);

grant select, insert, update, delete on public.coordinacion_usuario_contratos to authenticated;

insert into public.coordinacion_usuario_contratos (user_id, contrato_id)
select distinct cus.user_id, s.contrato_id
from public.coordinacion_usuario_servicios cus
join public.servicios s on s.id = cus.servicio_id
where s.contrato_id is not null
on conflict (user_id, contrato_id) do nothing;

alter table public.coordinacion_usuario_contratos enable row level security;

-- Solo admin gestiona accesos (igual que coordinacion_usuario_servicios/coordinacion_usuarios).
drop policy if exists "coordinacion_usuario_contratos_admin_all" on public.coordinacion_usuario_contratos;
create policy "coordinacion_usuario_contratos_admin_all" on public.coordinacion_usuario_contratos for all to authenticated
using ((select public.is_coordinacion_admin()))
with check ((select public.is_coordinacion_admin()));

-- Un usuario puede leer sus propias asignaciones (la UI de Accesos ya exige
-- admin para ver la lista completa, pero esto evita sorpresas si algo mas
-- necesita saber "que contratos tengo").
drop policy if exists "coordinacion_usuario_contratos_self_read" on public.coordinacion_usuario_contratos;
create policy "coordinacion_usuario_contratos_self_read" on public.coordinacion_usuario_contratos for select to authenticated
using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Funciones de alcance: pasan de derivar el contrato via servicios a leer
-- coordinacion_usuario_contratos directamente. Firma y comportamiento externo
-- identicos (mismos resultados que antes, dado que la migracion de arriba es
-- 1:1), asi que ninguna policy que las use tiene que cambiar.
-- ----------------------------------------------------------------------------

create or replace function public.can_access_coordinacion_contrato(
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
      from public.coordinacion_usuario_contratos cuc
      join public.coordinacion_usuarios cu
        on cu.user_id = cuc.user_id
       and cu.activo = true
       and cu.rol in ('coordinator', 'area_coordinator', 'viewer')
      where cuc.user_id = p_user_id
        and cuc.contrato_id = p_contrato_id
    );
$$;

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
      from public.coordinacion_usuario_contratos cuc
      join public.coordinacion_usuarios cu
        on cu.user_id = cuc.user_id
       and cu.activo = true
       and cu.rol in ('coordinator', 'area_coordinator')
      where cuc.user_id = p_user_id
        and cuc.contrato_id = p_contrato_id
    );
$$;

create or replace function public.coordinacion_readable_contrato_ids(p_user_id uuid default auth.uid())
returns setof integer
language sql
stable
security definer
set search_path = public
as $$
  select distinct cuc.contrato_id
  from public.coordinacion_usuario_contratos cuc
  join public.coordinacion_usuarios cu on cu.user_id = cuc.user_id
   and cu.activo = true
   and cu.rol in ('coordinator', 'area_coordinator', 'viewer')
  where cuc.user_id = p_user_id;
$$;

create or replace function public.coordinacion_manageable_contrato_ids(p_user_id uuid default auth.uid())
returns setof integer
language sql
stable
security definer
set search_path = public
as $$
  select distinct cuc.contrato_id
  from public.coordinacion_usuario_contratos cuc
  join public.coordinacion_usuarios cu on cu.user_id = cuc.user_id
   and cu.activo = true
   and cu.rol in ('coordinator', 'area_coordinator')
  where cuc.user_id = p_user_id;
$$;

revoke all on function public.can_access_coordinacion_contrato(integer, uuid) from public;
revoke all on function public.can_manage_coordinacion_contrato(integer, uuid) from public;
revoke all on function public.coordinacion_readable_contrato_ids(uuid) from public;
revoke all on function public.coordinacion_manageable_contrato_ids(uuid) from public;
grant execute on function public.can_access_coordinacion_contrato(integer, uuid) to authenticated;
grant execute on function public.can_manage_coordinacion_contrato(integer, uuid) to authenticated;
grant execute on function public.coordinacion_readable_contrato_ids(uuid) to authenticated;
grant execute on function public.coordinacion_manageable_contrato_ids(uuid) to authenticated;
