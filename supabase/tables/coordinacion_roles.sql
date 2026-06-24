create table if not exists public.coordinacion_usuarios (
  user_id uuid primary key references auth.users (id) on delete cascade,
  rol text not null default 'coordinator',
  nombre text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coordinacion_usuarios_rol_check
    check (rol in ('admin', 'coordinator', 'area_coordinator', 'viewer'))
);

alter table public.coordinacion_usuarios
drop constraint if exists coordinacion_usuarios_rol_check;

alter table public.coordinacion_usuarios
add constraint coordinacion_usuarios_rol_check
check (rol in ('admin', 'coordinator', 'area_coordinator', 'viewer'));

create table if not exists public.coordinacion_usuario_servicios (
  user_id uuid not null references public.coordinacion_usuarios (user_id) on delete cascade,
  servicio_id bigint not null references public.servicios (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, servicio_id)
);

create table if not exists public.coordinacion_usuario_pestanas (
  user_id uuid not null references public.coordinacion_usuarios (user_id) on delete cascade,
  pestana text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, pestana)
);

create table if not exists public.coordinacion_pestanas (
  pestana text primary key,
  etiqueta text not null,
  descripcion text,
  orden integer not null default 100,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coordinacion_pestanas_key_check
    check (
      pestana in (
        'programming',
        'control',
        'events',
        'search',
        'contracts',
        'personal',
        'settings',
        'concilia',
        'actividades'
      )
    )
);

alter table public.coordinacion_pestanas
drop constraint if exists coordinacion_pestanas_key_check;

insert into public.coordinacion_pestanas (pestana, etiqueta, descripcion, orden, activo)
values
  ('programming', 'Programación', 'Gestión de la programación de coordinación.', 10, true),
  ('control', 'Control personal', 'Gestión de partes y control de horas.', 20, true),
  ('events', 'Eventos', 'Gestión de eventos deportivos.', 30, true),
  ('concilia', 'Concilia', 'Gestión de alumnado, asistencia, NEE, disponibilidad y asignaciones.', 50, true),
  ('search', 'Candidaturas', 'Gestión de candidaturas.', 100, true),
  ('personal', 'Personal', 'Gestion de personal.', 105, true),
  ('contracts', 'Contratos', 'Gestión de contratos y servicios.', 110, true),
  ('settings', 'Configuracion', 'Gestion de puestos, funciones y modalidades.', 115, true),
  ('actividades', 'Actividades', 'Gestión transversal de actividades.', 120, true)
on conflict (pestana) do update set
  etiqueta = excluded.etiqueta,
  descripcion = excluded.descripcion,
  orden = excluded.orden,
  activo = excluded.activo,
  updated_at = now();

alter table public.coordinacion_usuario_pestanas
drop constraint if exists coordinacion_usuario_pestanas_key_check;

insert into public.coordinacion_usuario_pestanas (user_id, pestana)
select distinct user_id, 'concilia'
from public.coordinacion_usuario_pestanas
where pestana in (
  'concilia_alumnado',
  'concilia_asistencia',
  'concilia_nee',
  'concilia_disponibilidad',
  'concilia_asignaciones'
)
on conflict (user_id, pestana) do nothing;

delete from public.coordinacion_usuario_pestanas
where pestana in (
  'concilia_alumnado',
  'concilia_asistencia',
  'concilia_nee',
  'concilia_disponibilidad',
  'concilia_asignaciones'
);

delete from public.coordinacion_pestanas
where pestana in (
  'concilia_alumnado',
  'concilia_asistencia',
  'concilia_nee',
  'concilia_disponibilidad',
  'concilia_asignaciones'
);

alter table public.coordinacion_pestanas
add constraint coordinacion_pestanas_key_check
check (
  pestana in (
    'programming',
    'control',
    'events',
    'search',
    'contracts',
    'personal',
    'settings',
    'concilia',
    'actividades'
  )
);

delete from public.coordinacion_usuario_pestanas old_tabs
where old_tabs.pestana = 'concilia_actividades'
  and exists (
    select 1
    from public.coordinacion_usuario_pestanas new_tabs
    where new_tabs.user_id = old_tabs.user_id
      and new_tabs.pestana = 'actividades'
  );

update public.coordinacion_usuario_pestanas
set pestana = 'actividades'
where pestana = 'concilia_actividades';

alter table public.coordinacion_usuario_pestanas
drop constraint if exists coordinacion_usuario_pestanas_pestana_fkey;

delete from public.coordinacion_usuario_pestanas user_tabs
where not exists (
  select 1
  from public.coordinacion_pestanas tabs
  where tabs.pestana = user_tabs.pestana
);

alter table public.coordinacion_usuario_pestanas
add constraint coordinacion_usuario_pestanas_pestana_fkey
foreign key (pestana)
references public.coordinacion_pestanas (pestana)
on update cascade
on delete restrict;

comment on table public.coordinacion_usuarios is
  'Roles de acceso de los usuarios autenticados a la plataforma de coordinacion.';

comment on table public.coordinacion_usuario_servicios is
  'Servicios asignados a cada usuario de coordinacion. El acceso a contratos se deduce desde estos servicios.';

comment on table public.coordinacion_usuario_pestanas is
  'Pestanas visibles para cada usuario de coordinacion. Admin tiene acceso implicito a todas.';

comment on table public.coordinacion_pestanas is
  'Catalogo de pestanas asignables en la plataforma de coordinacion.';

create index if not exists coordinacion_usuarios_rol_idx
on public.coordinacion_usuarios (rol);

create index if not exists coordinacion_pestanas_activo_orden_idx
on public.coordinacion_pestanas (activo, orden);

create index if not exists coordinacion_usuario_servicios_servicio_id_idx
on public.coordinacion_usuario_servicios (servicio_id);

create index if not exists coordinacion_usuario_pestanas_pestana_idx
on public.coordinacion_usuario_pestanas (pestana);

create or replace function public.set_coordinacion_usuarios_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_coordinacion_usuarios_updated_at on public.coordinacion_usuarios;
create trigger set_coordinacion_usuarios_updated_at
before update on public.coordinacion_usuarios
for each row
execute function public.set_coordinacion_usuarios_updated_at();

create or replace function public.set_coordinacion_pestanas_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_coordinacion_pestanas_updated_at on public.coordinacion_pestanas;
create trigger set_coordinacion_pestanas_updated_at
before update on public.coordinacion_pestanas
for each row
execute function public.set_coordinacion_pestanas_updated_at();

create or replace function public.get_coordinacion_user_role(p_user_id uuid default auth.uid())
returns text
language sql
stable
security definer
set search_path = public
as $$
  select cu.rol
  from public.coordinacion_usuarios cu
  where cu.user_id = p_user_id
    and cu.activo = true
  limit 1;
$$;

create or replace function public.is_coordinacion_admin(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.get_coordinacion_user_role(p_user_id) = 'admin', false);
$$;

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
      from public.coordinacion_usuario_servicios cus
      join public.coordinacion_usuarios cu
        on cu.user_id = cus.user_id
       and cu.activo = true
       and cu.rol in ('coordinator', 'area_coordinator', 'viewer')
      where cus.user_id = p_user_id
        and cus.servicio_id = p_servicio_id
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
      from public.coordinacion_usuario_servicios cus
      join public.coordinacion_usuarios cu
        on cu.user_id = cus.user_id
       and cu.activo = true
       and cu.rol in ('coordinator', 'area_coordinator')
      where cus.user_id = p_user_id
        and cus.servicio_id = p_servicio_id
    );
$$;

create or replace function public.can_access_coordinacion_servicio(
  p_servicio_id bigint,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_read_coordinacion_servicio(p_servicio_id, p_user_id);
$$;

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
      from public.coordinacion_usuario_servicios cus
      join public.servicios s
        on s.id = cus.servicio_id
      join public.coordinacion_usuarios cu
        on cu.user_id = cus.user_id
       and cu.activo = true
       and cu.rol in ('coordinator', 'area_coordinator', 'viewer')
      where cus.user_id = p_user_id
        and s.contrato_id = p_contrato_id
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
      from public.coordinacion_usuario_servicios cus
      join public.servicios s
        on s.id = cus.servicio_id
      join public.coordinacion_usuarios cu
        on cu.user_id = cus.user_id
       and cu.activo = true
       and cu.rol in ('coordinator', 'area_coordinator')
      where cus.user_id = p_user_id
        and s.contrato_id = p_contrato_id
    );
$$;

create or replace function public.can_manage_coordinacion_actividad(
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
    or (
      p_servicio_id is not null
      and public.can_manage_coordinacion_servicio(p_servicio_id, p_user_id)
    );
$$;

create or replace function public.can_read_coordinacion_actividad(
  p_contrato_id integer,
  p_servicio_id bigint default null,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.is_coordinacion_admin(p_user_id), false)
    or (
      p_servicio_id is not null
      and public.can_read_coordinacion_servicio(p_servicio_id, p_user_id)
    )
    or (
      p_servicio_id is null
      and public.can_access_coordinacion_contrato(p_contrato_id, p_user_id)
    );
$$;

create or replace function public.can_access_coordinacion_actividad(
  p_contrato_id integer,
  p_servicio_id bigint default null,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_read_coordinacion_actividad(p_contrato_id, p_servicio_id, p_user_id);
$$;

create or replace function public.can_access_coordinacion_pestana(
  p_pestana text,
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
      from public.coordinacion_usuario_pestanas cup
      join public.coordinacion_usuarios cu
        on cu.user_id = cup.user_id
       and cu.activo = true
       and cu.rol in ('coordinator', 'area_coordinator', 'viewer')
      where cup.user_id = p_user_id
        and cup.pestana = p_pestana
    );
$$;

create or replace function public.can_manage_coordinacion_personal(
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.is_coordinacion_admin(p_user_id), false)
    or (
      public.get_coordinacion_user_role(p_user_id) in ('coordinator', 'area_coordinator')
      and public.can_access_coordinacion_pestana('personal', p_user_id)
    );
$$;

revoke all on function public.get_coordinacion_user_role(uuid) from public;
revoke all on function public.is_coordinacion_admin(uuid) from public;
revoke all on function public.can_read_coordinacion_servicio(bigint, uuid) from public;
revoke all on function public.can_manage_coordinacion_servicio(bigint, uuid) from public;
revoke all on function public.can_access_coordinacion_servicio(bigint, uuid) from public;
revoke all on function public.can_access_coordinacion_contrato(integer, uuid) from public;
revoke all on function public.can_manage_coordinacion_contrato(integer, uuid) from public;
revoke all on function public.can_manage_coordinacion_actividad(bigint, uuid) from public;
revoke all on function public.can_read_coordinacion_actividad(integer, bigint, uuid) from public;
revoke all on function public.can_access_coordinacion_actividad(integer, bigint, uuid) from public;
revoke all on function public.can_access_coordinacion_pestana(text, uuid) from public;
revoke all on function public.can_manage_coordinacion_personal(uuid) from public;

grant execute on function public.get_coordinacion_user_role(uuid) to authenticated;
grant execute on function public.is_coordinacion_admin(uuid) to authenticated;
grant execute on function public.can_read_coordinacion_servicio(bigint, uuid) to authenticated;
grant execute on function public.can_manage_coordinacion_servicio(bigint, uuid) to authenticated;
grant execute on function public.can_access_coordinacion_servicio(bigint, uuid) to authenticated;
grant execute on function public.can_access_coordinacion_contrato(integer, uuid) to authenticated;
grant execute on function public.can_manage_coordinacion_contrato(integer, uuid) to authenticated;
grant execute on function public.can_manage_coordinacion_actividad(bigint, uuid) to authenticated;
grant execute on function public.can_read_coordinacion_actividad(integer, bigint, uuid) to authenticated;
grant execute on function public.can_access_coordinacion_actividad(integer, bigint, uuid) to authenticated;
grant execute on function public.can_access_coordinacion_pestana(text, uuid) to authenticated;
grant execute on function public.can_manage_coordinacion_personal(uuid) to authenticated;

alter table public.personal enable row level security;
alter table public.contratos enable row level security;
alter table public.servicios enable row level security;
alter table public.coordinacion_usuarios enable row level security;
alter table public.coordinacion_pestanas enable row level security;
alter table public.coordinacion_usuario_servicios enable row level security;
alter table public.coordinacion_usuario_pestanas enable row level security;

grant select, insert, update on public.personal to authenticated;
grant select, insert, update, delete on public.contratos to authenticated;
grant select, insert, update, delete on public.servicios to authenticated;
grant select, insert, update, delete on public.coordinacion_usuarios to authenticated;
grant select, insert, update, delete on public.coordinacion_pestanas to authenticated;
grant select, insert, update, delete on public.coordinacion_usuario_servicios to authenticated;
grant select, insert, update, delete on public.coordinacion_usuario_pestanas to authenticated;

drop policy if exists "authenticated_can_read_personal" on public.personal;
create policy "authenticated_can_read_personal"
on public.personal
for select
to authenticated
using (true);

drop policy if exists "authenticated_can_insert_personal" on public.personal;
create policy "authenticated_can_insert_personal"
on public.personal
for insert
to authenticated
with check (public.can_manage_coordinacion_personal());

drop policy if exists "authenticated_can_update_personal" on public.personal;
create policy "authenticated_can_update_personal"
on public.personal
for update
to authenticated
using (public.can_manage_coordinacion_personal())
with check (public.can_manage_coordinacion_personal());

drop policy if exists "authenticated_can_read_contratos" on public.contratos;
create policy "authenticated_can_read_contratos"
on public.contratos
for select
to authenticated
using (public.can_access_coordinacion_contrato(id));

drop policy if exists "coordinacion_contratos_assigned_only" on public.contratos;
create policy "coordinacion_contratos_assigned_only"
on public.contratos
as restrictive
for select
to authenticated
using (public.can_access_coordinacion_contrato(id));

drop policy if exists "authenticated_can_insert_contratos" on public.contratos;
create policy "authenticated_can_insert_contratos"
on public.contratos
for insert
to authenticated
with check (public.is_coordinacion_admin());

drop policy if exists "authenticated_can_update_contratos" on public.contratos;
create policy "authenticated_can_update_contratos"
on public.contratos
for update
to authenticated
using (public.can_manage_coordinacion_contrato(id))
with check (public.can_manage_coordinacion_contrato(id));

drop policy if exists "authenticated_can_delete_contratos" on public.contratos;
create policy "authenticated_can_delete_contratos"
on public.contratos
for delete
to authenticated
using (public.is_coordinacion_admin());

drop policy if exists "authenticated_can_read_servicios" on public.servicios;
create policy "authenticated_can_read_servicios"
on public.servicios
for select
to authenticated
using (public.can_read_coordinacion_servicio(id));

drop policy if exists "coordinacion_servicios_assigned_only" on public.servicios;
create policy "coordinacion_servicios_assigned_only"
on public.servicios
as restrictive
for select
to authenticated
using (public.can_read_coordinacion_servicio(id));

drop policy if exists "authenticated_can_insert_servicios" on public.servicios;
create policy "authenticated_can_insert_servicios"
on public.servicios
for insert
to authenticated
with check (public.is_coordinacion_admin());

drop policy if exists "authenticated_can_update_servicios" on public.servicios;
create policy "authenticated_can_update_servicios"
on public.servicios
for update
to authenticated
using (public.can_manage_coordinacion_servicio(id))
with check (public.can_manage_coordinacion_servicio(id));

drop policy if exists "authenticated_can_delete_servicios" on public.servicios;
create policy "authenticated_can_delete_servicios"
on public.servicios
for delete
to authenticated
using (public.is_coordinacion_admin());

drop policy if exists "coordinacion_usuarios_can_read" on public.coordinacion_usuarios;
create policy "coordinacion_usuarios_can_read"
on public.coordinacion_usuarios
for select
to authenticated
using (user_id = auth.uid() or public.is_coordinacion_admin());

drop policy if exists "coordinacion_usuarios_admin_can_insert" on public.coordinacion_usuarios;
create policy "coordinacion_usuarios_admin_can_insert"
on public.coordinacion_usuarios
for insert
to authenticated
with check (public.is_coordinacion_admin());

drop policy if exists "coordinacion_usuarios_admin_can_update" on public.coordinacion_usuarios;
create policy "coordinacion_usuarios_admin_can_update"
on public.coordinacion_usuarios
for update
to authenticated
using (public.is_coordinacion_admin())
with check (public.is_coordinacion_admin());

drop policy if exists "coordinacion_usuarios_admin_can_delete" on public.coordinacion_usuarios;
create policy "coordinacion_usuarios_admin_can_delete"
on public.coordinacion_usuarios
for delete
to authenticated
using (public.is_coordinacion_admin());

drop policy if exists "coordinacion_pestanas_can_read" on public.coordinacion_pestanas;
create policy "coordinacion_pestanas_can_read"
on public.coordinacion_pestanas
for select
to authenticated
using (true);

drop policy if exists "coordinacion_pestanas_admin_can_insert" on public.coordinacion_pestanas;
create policy "coordinacion_pestanas_admin_can_insert"
on public.coordinacion_pestanas
for insert
to authenticated
with check (public.is_coordinacion_admin());

drop policy if exists "coordinacion_pestanas_admin_can_update" on public.coordinacion_pestanas;
create policy "coordinacion_pestanas_admin_can_update"
on public.coordinacion_pestanas
for update
to authenticated
using (public.is_coordinacion_admin())
with check (public.is_coordinacion_admin());

drop policy if exists "coordinacion_pestanas_admin_can_delete" on public.coordinacion_pestanas;
create policy "coordinacion_pestanas_admin_can_delete"
on public.coordinacion_pestanas
for delete
to authenticated
using (public.is_coordinacion_admin());

drop policy if exists "coordinacion_usuario_servicios_can_read" on public.coordinacion_usuario_servicios;
create policy "coordinacion_usuario_servicios_can_read"
on public.coordinacion_usuario_servicios
for select
to authenticated
using (user_id = auth.uid() or public.is_coordinacion_admin());

drop policy if exists "coordinacion_usuario_servicios_admin_can_write" on public.coordinacion_usuario_servicios;
create policy "coordinacion_usuario_servicios_admin_can_write"
on public.coordinacion_usuario_servicios
for all
to authenticated
using (public.is_coordinacion_admin())
with check (public.is_coordinacion_admin());

drop policy if exists "coordinacion_usuario_pestanas_can_read" on public.coordinacion_usuario_pestanas;
create policy "coordinacion_usuario_pestanas_can_read"
on public.coordinacion_usuario_pestanas
for select
to authenticated
using (user_id = auth.uid() or public.is_coordinacion_admin());

drop policy if exists "coordinacion_usuario_pestanas_admin_can_write" on public.coordinacion_usuario_pestanas;
create policy "coordinacion_usuario_pestanas_admin_can_write"
on public.coordinacion_usuario_pestanas
for all
to authenticated
using (public.is_coordinacion_admin())
with check (public.is_coordinacion_admin());

do $$
begin
  if to_regclass('public.coordinacion_usuario_contratos') is not null then
    drop policy if exists "coordinacion_usuario_contratos_can_read"
      on public.coordinacion_usuario_contratos;
    drop policy if exists "coordinacion_usuario_contratos_admin_can_write"
      on public.coordinacion_usuario_contratos;
    drop table public.coordinacion_usuario_contratos;
  end if;
end $$;

-- Arranque inicial:
-- Inserta manualmente el primer administrador con el user_id de Supabase Auth.
-- insert into public.coordinacion_usuarios (user_id, rol, nombre)
-- values ('00000000-0000-0000-0000-000000000000', 'admin', 'Administrador');
