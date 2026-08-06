-- ============================================================================
--  contrato_servicios — tabla puente contrato x servicio, mismo patron que
--  contrato_personal / contrato_instalaciones (contrato_asignaciones.sql).
-- ----------------------------------------------------------------------------
--  `servicios` deja de tener contrato_id propio (ver servicios.sql): pasa a
--  ser un catalogo global (un servicio con el mismo nombre ya no se duplica
--  por cada contrato que lo usa). Esta tabla es la que dice "este servicio
--  esta habilitado en este contrato", y sustituye por completo al antiguo
--  servicios.contrato_id en validaciones y en el alcance de Registros/
--  Actividades/Facturacion.
--
--  Se puebla una vez, migrando cada fila existente de servicios (su propio
--  contrato_id, su propio id) ANTES de fusionar los nombres duplicados -ver
--  servicios_globalizar.sql-, para no perder ninguna asociacion contrato-
--  servicio que ya existiera.
--
--  Requiere contratos.sql y servicios.sql.
-- ============================================================================

create table if not exists public.contrato_servicios (
  contrato_id integer not null references public.contratos (id) on delete cascade,
  servicio_id bigint not null references public.servicios (id) on delete cascade,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (contrato_id, servicio_id)
);

create index if not exists contrato_servicios_servicio_id_idx
on public.contrato_servicios (servicio_id);

create index if not exists contrato_servicios_activo_idx
on public.contrato_servicios (contrato_id, activo);

drop trigger if exists set_contrato_servicios_updated_at on public.contrato_servicios;
create trigger set_contrato_servicios_updated_at
before update on public.contrato_servicios
for each row
execute function public.set_contrato_asignaciones_updated_at();

insert into public.contrato_servicios (contrato_id, servicio_id, activo)
select s.contrato_id, s.id, s.activo
from public.servicios s
where s.contrato_id is not null
on conflict (contrato_id, servicio_id) do nothing;

alter table public.contrato_servicios enable row level security;

grant select, insert, update, delete on public.contrato_servicios to authenticated;

drop policy if exists "contrato_servicios_read" on public.contrato_servicios;
create policy "contrato_servicios_read" on public.contrato_servicios for select to authenticated
using (
  (select public.is_coordinacion_admin())
  or contrato_id in (select public.coordinacion_readable_contrato_ids())
);

drop policy if exists "contrato_servicios_write" on public.contrato_servicios;
create policy "contrato_servicios_write" on public.contrato_servicios for all to authenticated
using (
  (select public.is_coordinacion_admin())
  or contrato_id in (select public.coordinacion_manageable_contrato_ids())
)
with check (
  (select public.is_coordinacion_admin())
  or contrato_id in (select public.coordinacion_manageable_contrato_ids())
);
