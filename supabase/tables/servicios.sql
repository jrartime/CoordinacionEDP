create table if not exists public.servicios (
  id bigserial primary key,
  contrato_id integer not null references public.contratos (id) on delete restrict,
  servicio text not null,
  servicio_normalizado text generated always as (lower(btrim(servicio))) stored,
  descripcion text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint servicios_servicio_not_empty check (length(btrim(servicio)) > 0),
  constraint servicios_contrato_servicio_normalizado_key unique (contrato_id, servicio_normalizado)
);

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'servicios_servicio_normalizado_key'
      and conrelid = 'public.servicios'::regclass
  ) then
    alter table public.servicios
      drop constraint servicios_servicio_normalizado_key;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'servicios_contrato_servicio_normalizado_key'
      and conrelid = 'public.servicios'::regclass
  ) then
    alter table public.servicios
      add constraint servicios_contrato_servicio_normalizado_key
      unique (contrato_id, servicio_normalizado);
  end if;
end $$;

comment on table public.servicios is
  'Servicios asociados a contratos. Un contrato puede tener varios servicios y cada servicio pertenece a un unico contrato.';

comment on column public.servicios.contrato_id is
  'Contrato al que pertenece el servicio. Relacion 1:N desde contratos hacia servicios.';

create index if not exists servicios_contrato_id_idx
on public.servicios (contrato_id);

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
