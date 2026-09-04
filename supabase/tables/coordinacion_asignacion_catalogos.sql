-- ============================================================================
--  Catalogos completos de personal/instalaciones/servicios para el selector
--  de asignacion de la pestana Contratos.
-- ----------------------------------------------------------------------------
--  Problema: personal_instalaciones_scope.sql y master_tables_read.sql
--  acotan la lectura de `personal`, `instalaciones` y `servicios` a lo ya
--  asignado a un contrato accesible (RESTRICTIVE + can_access_coordinacion_*).
--  Eso es correcto para listados/filtros generales, pero rompe el propio
--  selector de asignacion de Contratos: un coordinador solo puede adjudicar
--  personal/instalaciones/servicios que YA estuvieran vinculados a alguno de
--  sus contratos, es decir, nunca puede dar de alta a alguien o algo nuevo en
--  su contrato.
--
--  Solucion: 3 RPC SECURITY DEFINER que devuelven el catalogo COMPLETO (sin
--  el recorte por contrato), pero solo a quien gestiona al menos un contrato
--  (o es admin) -mismo umbral que exige la propia escritura de
--  contrato_personal/contrato_instalaciones/contrato_servicios-. Un usuario
--  sin ningun contrato gestionable (p.ej. rol viewer) recibe 0 filas.
--
--  Requiere: coordinacion_roles.sql (is_coordinacion_admin),
--            coordinacion_usuario_contratos.sql (coordinacion_manageable_contrato_ids).
-- ============================================================================

drop function if exists public.get_personal_para_asignar();

create or replace function public.get_personal_para_asignar()
returns table (
  id integer,
  personal text,
  dni text,
  vinculacion_id integer
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.personal, p.dni, p.vinculacion_id
  from public.personal p
  where coalesce(public.is_coordinacion_admin(), false)
     or exists (select 1 from public.coordinacion_manageable_contrato_ids())
  order by p.personal;
$$;

revoke all on function public.get_personal_para_asignar() from public;
revoke execute on function public.get_personal_para_asignar() from anon;
grant execute on function public.get_personal_para_asignar() to authenticated;

create or replace function public.get_instalaciones_para_asignar()
returns table (
  id integer,
  instalacion text,
  activo boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select i.id, i.instalacion, i.activo
  from public.instalaciones i
  where coalesce(public.is_coordinacion_admin(), false)
     or exists (select 1 from public.coordinacion_manageable_contrato_ids())
  order by i.instalacion;
$$;

revoke all on function public.get_instalaciones_para_asignar() from public;
revoke execute on function public.get_instalaciones_para_asignar() from anon;
grant execute on function public.get_instalaciones_para_asignar() to authenticated;

create or replace function public.get_servicios_para_asignar()
returns table (
  id bigint,
  servicio text,
  descripcion text,
  activo boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select s.id, s.servicio, s.descripcion, s.activo
  from public.servicios s
  where coalesce(public.is_coordinacion_admin(), false)
     or exists (select 1 from public.coordinacion_manageable_contrato_ids())
  order by s.servicio;
$$;

revoke all on function public.get_servicios_para_asignar() from public;
revoke execute on function public.get_servicios_para_asignar() from anon;
grant execute on function public.get_servicios_para_asignar() to authenticated;
