create table if not exists public.conciliausuarios (
  id bigserial primary key,
  codigo_clase text not null,
  clase text,
  fecha_inicial date,
  estado text,
  codigo_persona integer not null,
  apellidos text,
  nombre text,
  nee text,
  documento text,
  fecha_nacimiento date,
  edad text,
  movil text,
  mail text,
  centro text,
  semana text,
  alumnado text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conciliausuarios_codigo_clase_persona_semana_key
    unique (codigo_clase, codigo_persona, semana)
);

create index if not exists conciliausuarios_centro_idx
on public.conciliausuarios (centro);

create index if not exists conciliausuarios_semana_idx
on public.conciliausuarios (semana);

create index if not exists conciliausuarios_codigo_persona_idx
on public.conciliausuarios (codigo_persona);

create index if not exists conciliausuarios_mail_idx
on public.conciliausuarios (lower(mail));

create or replace function public.set_conciliausuarios_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_conciliausuarios_updated_at on public.conciliausuarios;
create trigger set_conciliausuarios_updated_at
before update on public.conciliausuarios
for each row
execute function public.set_conciliausuarios_updated_at();

alter table public.conciliausuarios enable row level security;

grant select, update on public.conciliausuarios to authenticated;

drop policy if exists "authenticated_can_read_conciliausuarios" on public.conciliausuarios;
create policy "authenticated_can_read_conciliausuarios"
on public.conciliausuarios
for select
to authenticated
using (true);

drop policy if exists "authenticated_can_insert_conciliausuarios" on public.conciliausuarios;
drop policy if exists "authenticated_can_update_conciliausuarios" on public.conciliausuarios;
drop policy if exists "authenticated_can_delete_conciliausuarios" on public.conciliausuarios;

create policy "authenticated_can_update_conciliausuarios"
on public.conciliausuarios
for update
to authenticated
using (true)
with check (true);
