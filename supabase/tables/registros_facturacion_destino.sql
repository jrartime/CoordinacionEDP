-- ============================================================================
--  registros_facturacion_destino — redirige la facturacion de un registro a
--  otro contrato/servicio/funcion/instalacion, SIN tocar los datos reales del
--  registro (donde se trabajo de verdad sigue siendo registros.contrato_id,
--  servicio_id, funcion_id, instalacion_id).
-- ----------------------------------------------------------------------------
--  Caso de uso: horas trabajadas en el contrato A que, por acuerdo, se
--  facturan bajo el contrato B. El registro conserva su contrato/servicio/
--  funcion/instalacion originales para todo lo demas (informes, nominas,
--  control de horas del propio contrato operativo); solo "Preparacion de
--  facturas" y el panel Control usan el destino.
--
--  Los cuatro campos son independientes y todos opcionales (con al menos uno
--  informado): se puede redirigir solo el contrato (con la misma funcion,
--  cuya tarifa/servicio salen del contrato destino), solo la funcion (mismo
--  contrato, otra etiqueta), solo el servicio o solo la instalacion -o
--  cualquier combinacion-. Sin fila = sin redireccion, se factura donde se
--  trabajo, como siempre.
--
--  A diferencia de funcion (que sigue determinando la tarifa via
--  contratos_funciones), el servicio aqui NO se resuelve por la tarifa: si se
--  fija explicitamente, manda directamente en la agrupacion de la
--  preparacion (ver contratos_funciones_servicio.sql para el caso normal, sin
--  redireccion).
--
--  Solo lo usan los administradores: es una operacion economica sensible
--  (mueve coste de un contrato a otro) y no tiene sentido exponerla a
--  cualquier coordinador aunque gestione ambos contratos.
--
--  Requiere registros.sql, contratos.sql, servicios.sql, funciones.sql,
--  instalaciones.sql.
-- ============================================================================

create table if not exists public.registros_facturacion_destino (
  registro_id bigint primary key references public.registros (id) on update cascade on delete cascade,
  contrato_id integer references public.contratos (id) on update cascade on delete restrict,
  funcion_id integer references public.funciones (id) on update cascade on delete restrict,
  motivo text,
  actualizado_por_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  alter table public.registros_facturacion_destino
    add column if not exists servicio_id bigint;
  alter table public.registros_facturacion_destino
    add column if not exists instalacion_id integer;

  if not exists (
    select 1 from pg_constraint
    where conname = 'registros_facturacion_destino_servicio_id_fkey'
      and conrelid = 'public.registros_facturacion_destino'::regclass
  ) then
    alter table public.registros_facturacion_destino
      add constraint registros_facturacion_destino_servicio_id_fkey
      foreign key (servicio_id) references public.servicios (id)
      on update cascade on delete restrict not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'registros_facturacion_destino_instalacion_id_fkey'
      and conrelid = 'public.registros_facturacion_destino'::regclass
  ) then
    alter table public.registros_facturacion_destino
      add constraint registros_facturacion_destino_instalacion_id_fkey
      foreign key (instalacion_id) references public.instalaciones (id)
      on update cascade on delete restrict not valid;
  end if;

  alter table public.registros_facturacion_destino
    drop constraint if exists registros_facturacion_destino_algo_chk;
  alter table public.registros_facturacion_destino
    add constraint registros_facturacion_destino_algo_chk
    check (contrato_id is not null or servicio_id is not null or funcion_id is not null or instalacion_id is not null);
end $$;

comment on table public.registros_facturacion_destino is
  'Redireccion opcional de facturacion por registro (a otro contrato/servicio/funcion/instalacion), independiente de donde se trabajo realmente. Sin fila = se factura en su propio contrato/servicio/funcion/instalacion. Solo administradores.';

create index if not exists registros_facturacion_destino_contrato_idx
on public.registros_facturacion_destino (contrato_id);

create or replace function public.set_registros_facturacion_destino_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  new.actualizado_por_email = nullif(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email', '');
  return new;
end;
$$;

drop trigger if exists set_registros_facturacion_destino_updated_at on public.registros_facturacion_destino;
create trigger set_registros_facturacion_destino_updated_at before insert or update on public.registros_facturacion_destino
for each row execute function public.set_registros_facturacion_destino_updated_at();

alter table public.registros_facturacion_destino enable row level security;

grant select, insert, update, delete on public.registros_facturacion_destino to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Solo administradores, tanto para leer como para escribir: es una
-- redireccion economica entre contratos, no una asignacion operativa mas.
drop policy if exists "registros_facturacion_destino_read" on public.registros_facturacion_destino;
create policy "registros_facturacion_destino_read" on public.registros_facturacion_destino for select to authenticated
using ((select public.is_coordinacion_admin()));

drop policy if exists "registros_facturacion_destino_write" on public.registros_facturacion_destino;
create policy "registros_facturacion_destino_write" on public.registros_facturacion_destino for all to authenticated
using ((select public.is_coordinacion_admin()))
with check ((select public.is_coordinacion_admin()));

-- Un coordinador no admin no puede leer esta tabla (RLS de arriba), pero sin
-- ninguna pista se le queda un hueco de horas sin explicar en su propio
-- contrato (Preparacion/Control filtran por contrato_facturable_id, que para
-- un registro redirigido apunta a otro contrato). Esta funcion expone SOLO la
-- existencia de una redireccion -ni contrato, ni servicio, ni funcion, ni
-- instalacion de destino-, para que registros_detalle.estado_facturacion
-- pueda mostrar "Redirigido" en vez de "Pendiente" sin filtrar a donde va.
-- SECURITY DEFINER a proposito: se salta el RLS de solo-admin de la tabla
-- porque el booleano en si no es informacion sensible.
create or replace function public.registro_tiene_redireccion_facturacion(p_registro_id bigint)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists(
    select 1 from public.registros_facturacion_destino
    where registro_id = p_registro_id
  );
$$;

grant execute on function public.registro_tiene_redireccion_facturacion(bigint) to authenticated;
