-- ============================================================================
--  Globalizacion de servicios (2026-08-06): servicios pasa de 1:N con
--  contratos a catalogo global; contrato_servicios (ver contrato_servicios.sql)
--  es desde ahora la fuente de verdad de que servicio esta habilitado en que
--  contrato.
-- ----------------------------------------------------------------------------
--  Requiere: contrato_servicios.sql ya aplicada y poblada (una fila por cada
--  servicio existente, antes de fusionar nombres), y coordinacion_usuario_contratos.sql
--  ya aplicada (el acceso por contrato ya no depende de servicios).
--
--  Orden importante: los tres triggers de validacion servicio-contrato
--  (registros, actividades, contratos_funciones_servicios — ver
--  registros_servicio_contrato_validation.sql, actividades.sql,
--  contratos_funciones_servicio.sql) se reescriben para comprobar
--  contrato_servicios ANTES de remapear ningun id: si no, el trigger antiguo
--  (que comparaba servicios.contrato_id) rechazaria el remapeo en cuanto una
--  fila pasara a "pertenecer" a un contrato distinto del suyo original.
-- ============================================================================

-- 1) Mapa de fusion: un id canonico (el mas antiguo) por nombre normalizado.
--    32 servicios -> 23 nombres distintos en la migracion original.
create table public._servicio_merge_map_tmp as
select s.id as old_id, first_value(s.id) over (
    partition by s.servicio_normalizado order by s.id
  ) as new_id
from public.servicios s;

delete from public._servicio_merge_map_tmp where old_id = new_id;

-- 2) Reapuntar todas las referencias del id viejo al canonico.
update public.contrato_servicios cs
set servicio_id = m.new_id
from public._servicio_merge_map_tmp m
where cs.servicio_id = m.old_id;

update public.registros r
set servicio_id = m.new_id
from public._servicio_merge_map_tmp m
where r.servicio_id = m.old_id;

update public.actividades a
set servicio_id = m.new_id
from public._servicio_merge_map_tmp m
where a.servicio_id = m.old_id;

update public.contratos_funciones_servicios cfs
set servicio_id = m.new_id
from public._servicio_merge_map_tmp m
where cfs.servicio_id = m.old_id;

update public.registros_facturacion_destino rfd
set servicio_id = m.new_id
from public._servicio_merge_map_tmp m
where rfd.servicio_id = m.old_id;

-- coordinacion_usuario_servicios (en desuso, ver coordinacion_usuario_contratos.sql):
-- por si un mismo usuario ya tenia concedidos tanto el duplicado como el
-- canonico (PK compuesta), evitar choque antes de remapear.
delete from public.coordinacion_usuario_servicios cus
using public._servicio_merge_map_tmp m
where cus.servicio_id = m.old_id
  and exists (
    select 1 from public.coordinacion_usuario_servicios cus2
    where cus2.user_id = cus.user_id and cus2.servicio_id = m.new_id
  );

update public.coordinacion_usuario_servicios cus
set servicio_id = m.new_id
from public._servicio_merge_map_tmp m
where cus.servicio_id = m.old_id;

-- 3) Borrar los servicios duplicados, ya sin referencias.
delete from public.servicios s
using public._servicio_merge_map_tmp m
where s.id = m.old_id;

drop table public._servicio_merge_map_tmp;

-- 4) can_read/can_manage_coordinacion_servicio: antes miraban
--    coordinacion_usuario_servicios directamente; ahora resuelven "accesible"
--    como "habilitado en algun contrato que el usuario puede leer/gestionar",
--    reutilizando can_access/can_manage_coordinacion_contrato (que ya leen de
--    coordinacion_usuario_contratos).
create or replace function public.can_read_coordinacion_servicio(
  p_servicio_id bigint,
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
      from public.contrato_servicios cs
      where cs.servicio_id = p_servicio_id
        and public.can_access_coordinacion_contrato(cs.contrato_id, p_user_id)
    );
$$;

create or replace function public.can_manage_coordinacion_servicio(
  p_servicio_id bigint,
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
      from public.contrato_servicios cs
      where cs.servicio_id = p_servicio_id
        and public.can_manage_coordinacion_contrato(cs.contrato_id, p_user_id)
    );
$$;

-- can_access_coordinacion_servicio ya delega en can_read_coordinacion_servicio
-- (sin cambios de firma), asi que hereda el nuevo comportamiento sin tocarla.

-- 5) servicios deja de tener contrato_id.
drop index if exists public.servicios_contrato_id_idx;

alter table public.servicios
  drop constraint if exists servicios_contrato_servicio_normalizado_key;

alter table public.servicios
  drop constraint if exists servicios_servicio_normalizado_key;

alter table public.servicios
  drop column if exists contrato_id;

alter table public.servicios
  add constraint servicios_servicio_normalizado_key unique (servicio_normalizado);

comment on table public.servicios is
  'Catalogo global de servicios. Un servicio puede estar habilitado en varios contratos a la vez (ver contrato_servicios).';
