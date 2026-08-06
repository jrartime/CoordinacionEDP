-- servicios es un catalogo GLOBAL (nombre unico en todo el sistema): un mismo
-- servicio (p.ej. "Conserjería e Información") puede estar habilitado en
-- varios contratos a la vez, en vez de duplicarse una fila por contrato. Que
-- servicio esta habilitado en que contrato vive en contrato_servicios (ver
-- contrato_servicios.sql), que es tambien quien decide el alcance por
-- contrato en RLS y en las validaciones de registros/actividades/tarifas.
--
-- Hasta 2026-08-06 esta tabla era 1:N con contratos (contrato_id not null,
-- nombre unico por contrato); se globalizo fusionando los servicios que
-- compartian nombre en distinto contrato (32 filas -> 23) y creando
-- contrato_servicios con una fila por cada asociacion contrato-servicio que
-- ya existiera. Ver servicios_globalizar.sql para la migracion.
create table if not exists public.servicios (
  id bigserial primary key,
  servicio text not null,
  servicio_normalizado text generated always as (lower(btrim(servicio))) stored,
  descripcion text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint servicios_servicio_not_empty check (length(btrim(servicio)) > 0),
  constraint servicios_servicio_normalizado_key unique (servicio_normalizado)
);

comment on table public.servicios is
  'Catalogo global de servicios. Un servicio puede estar habilitado en varios contratos a la vez (ver contrato_servicios).';

create index if not exists servicios_activo_idx
on public.servicios (activo);

create index if not exists servicios_servicio_idx
on public.servicios (servicio);

create or replace function public.set_servicios_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_servicios_updated_at on public.servicios;
create trigger set_servicios_updated_at
before update on public.servicios
for each row
execute function public.set_servicios_updated_at();

alter table public.servicios enable row level security;

grant select, insert, update, delete on public.servicios to authenticated;

do $$
declare
  id_sequence regclass;
begin
  id_sequence := pg_get_serial_sequence('public.servicios', 'id')::regclass;

  if id_sequence is not null then
    execute format('grant usage, select on sequence %s to authenticated', id_sequence);
  end if;
end $$;

drop policy if exists "authenticated_can_read_servicios" on public.servicios;
create policy "authenticated_can_read_servicios"
on public.servicios
for select
to authenticated
using (true);

drop policy if exists "authenticated_can_insert_servicios" on public.servicios;
create policy "authenticated_can_insert_servicios"
on public.servicios
for insert
to authenticated
with check (true);

drop policy if exists "authenticated_can_update_servicios" on public.servicios;
create policy "authenticated_can_update_servicios"
on public.servicios
for update
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated_can_delete_servicios" on public.servicios;
create policy "authenticated_can_delete_servicios"
on public.servicios
for delete
to authenticated
using (true);
