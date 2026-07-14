create table if not exists public.eventos_deportivos (
  id bigserial primary key,
  nombre text not null,
  contrato_id integer references public.contratos (id),
  instalacion_id integer not null references public.instalaciones (id),
  fecha_inicio date not null,
  fecha_fin date not null,
  observaciones text,
  archived_at timestamptz,
  created_by uuid references auth.users (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint eventos_deportivos_fechas_validas
    check (fecha_fin >= fecha_inicio)
);

alter table public.eventos_deportivos
add column if not exists contrato_id integer references public.contratos (id);

alter table public.eventos_deportivos
add column if not exists archived_at timestamptz;

alter table public.eventos_deportivos
add column if not exists created_by uuid references auth.users (id) default auth.uid();

create table if not exists public.eventos_cronograma (
  id bigserial primary key,
  evento_id bigint not null references public.eventos_deportivos (id) on delete cascade,
  fecha date not null,
  hora_inicio time without time zone not null,
  hora_fin time without time zone not null,
  actividad text not null,
  necesita_transporte boolean not null default false,
  transporte_detalle text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint eventos_cronograma_horas_validas
    check (hora_fin > hora_inicio)
);

alter table public.eventos_cronograma
add column if not exists necesita_transporte boolean not null default false;

alter table public.eventos_cronograma
add column if not exists transporte_detalle text;

alter table public.eventos_cronograma
drop constraint if exists eventos_cronograma_horas_validas;

alter table public.eventos_cronograma
add constraint eventos_cronograma_horas_validas
check (hora_fin <> hora_inicio);

create table if not exists public.eventos_cronograma_personal (
  id bigserial primary key,
  cronograma_id bigint not null references public.eventos_cronograma (id) on delete cascade,
  personal_id integer not null references public.personal (id),
  hora_inicio time without time zone not null,
  hora_fin time without time zone not null,
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint eventos_cronograma_personal_horas_validas
    check (hora_fin > hora_inicio),
  constraint eventos_cronograma_personal_unico
    unique (cronograma_id, personal_id)
);

alter table public.eventos_cronograma_personal
drop constraint if exists eventos_cronograma_personal_horas_validas;

alter table public.eventos_cronograma_personal
add constraint eventos_cronograma_personal_horas_validas
check (hora_fin <> hora_inicio);

create table if not exists public.eventos_montaje_personal (
  personal_id integer primary key references public.personal (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.eventos_instalaciones (
  instalacion_id integer primary key references public.instalaciones (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists eventos_deportivos_instalacion_id_idx
on public.eventos_deportivos (instalacion_id);

create index if not exists eventos_deportivos_contrato_id_idx
on public.eventos_deportivos (contrato_id);

create index if not exists eventos_deportivos_created_by_idx
on public.eventos_deportivos (created_by);

create index if not exists eventos_deportivos_fecha_inicio_idx
on public.eventos_deportivos (fecha_inicio);

create index if not exists eventos_deportivos_archived_at_idx
on public.eventos_deportivos (archived_at);

create index if not exists eventos_cronograma_evento_id_idx
on public.eventos_cronograma (evento_id);

create index if not exists eventos_cronograma_fecha_idx
on public.eventos_cronograma (fecha);

create index if not exists eventos_cronograma_personal_cronograma_id_idx
on public.eventos_cronograma_personal (cronograma_id);

create index if not exists eventos_cronograma_personal_personal_id_idx
on public.eventos_cronograma_personal (personal_id);

create index if not exists eventos_montaje_personal_created_at_idx
on public.eventos_montaje_personal (created_at);

create index if not exists eventos_instalaciones_created_at_idx
on public.eventos_instalaciones (created_at);

create or replace function public.set_eventos_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_eventos_created_by()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.created_by is null then
    new.created_by = auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists set_eventos_deportivos_created_by on public.eventos_deportivos;
create trigger set_eventos_deportivos_created_by
before insert on public.eventos_deportivos
for each row
execute function public.set_eventos_created_by();

drop trigger if exists set_eventos_deportivos_updated_at on public.eventos_deportivos;
create trigger set_eventos_deportivos_updated_at
before update on public.eventos_deportivos
for each row
execute function public.set_eventos_updated_at();

drop trigger if exists set_eventos_cronograma_updated_at on public.eventos_cronograma;
create trigger set_eventos_cronograma_updated_at
before update on public.eventos_cronograma
for each row
execute function public.set_eventos_updated_at();

drop trigger if exists set_eventos_cronograma_personal_updated_at on public.eventos_cronograma_personal;
create trigger set_eventos_cronograma_personal_updated_at
before update on public.eventos_cronograma_personal
for each row
execute function public.set_eventos_updated_at();

drop view if exists public.eventos_cronograma_detalle;

create or replace view public.eventos_cronograma_detalle as
select
  c.id,
  c.evento_id,
  e.nombre as evento,
  e.instalacion_id,
  i.instalacion,
  c.fecha,
  c.hora_inicio,
  c.hora_fin,
  c.actividad,
  c.necesita_transporte,
  c.transporte_detalle,
  cp.id as asignacion_id,
  cp.personal_id,
  p.personal,
  cp.hora_inicio as personal_hora_inicio,
  cp.hora_fin as personal_hora_fin,
  cp.observaciones as personal_observaciones
from public.eventos_cronograma c
join public.eventos_deportivos e
  on e.id = c.evento_id
join public.instalaciones i
  on i.id = e.instalacion_id
left join public.eventos_cronograma_personal cp
  on cp.cronograma_id = c.id
left join public.personal p
  on p.id = cp.personal_id;

-- ----------------------------------------------------------------------------
--  Alcance de eventos por contrato y creador.
--  Admin ve todo. Coordinadores leen eventos de sus contratos asignados y solo
--  gestionan los que han creado. Instalaciones y personal se validan contra las
--  asignaciones activas del contrato del evento.
-- ----------------------------------------------------------------------------

create or replace function public.can_read_evento_deportivo(
  p_evento_id bigint,
  p_contrato_id integer,
  p_created_by uuid,
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
      p_created_by = p_user_id
      and public.can_access_coordinacion_pestana('events', p_user_id)
    )
    or (
      p_contrato_id is not null
      and public.can_access_coordinacion_pestana('events', p_user_id)
      and public.can_access_coordinacion_contrato(p_contrato_id, p_user_id)
    );
$$;

create or replace function public.can_create_evento_deportivo(
  p_contrato_id integer,
  p_instalacion_id integer,
  p_created_by uuid default auth.uid(),
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
      p_contrato_id is not null
      and coalesce(p_created_by, p_user_id) = p_user_id
      and public.get_coordinacion_user_role(p_user_id) in ('coordinator', 'area_coordinator')
      and public.can_access_coordinacion_pestana('events', p_user_id)
      and public.can_manage_coordinacion_contrato(p_contrato_id, p_user_id)
      and exists (
        select 1
        from public.contrato_instalaciones ci
        where ci.contrato_id = p_contrato_id
          and ci.instalacion_id = p_instalacion_id
          and public.is_contrato_assignment_current(
            ci.activo,
            ci.fecha_inicio,
            ci.fecha_fin,
            ci.removed_at
          )
      )
    );
$$;

create or replace function public.can_manage_evento_deportivo(
  p_evento_id bigint,
  p_contrato_id integer,
  p_instalacion_id integer,
  p_created_by uuid,
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
      p_evento_id is not null
      and p_contrato_id is not null
      and coalesce(p_created_by, p_user_id) = p_user_id
      and public.get_coordinacion_user_role(p_user_id) in ('coordinator', 'area_coordinator')
      and public.can_access_coordinacion_pestana('events', p_user_id)
      and public.can_manage_coordinacion_contrato(p_contrato_id, p_user_id)
      and exists (
        select 1
        from public.contrato_instalaciones ci
        where ci.contrato_id = p_contrato_id
          and ci.instalacion_id = p_instalacion_id
          and public.is_contrato_assignment_current(
            ci.activo,
            ci.fecha_inicio,
            ci.fecha_fin,
            ci.removed_at
          )
      )
    );
$$;

create or replace function public.can_manage_evento_cronograma(
  p_cronograma_id bigint,
  p_evento_id bigint,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.eventos_deportivos e
    where e.id = p_evento_id
      and public.can_manage_evento_deportivo(e.id, e.contrato_id, e.instalacion_id, e.created_by, p_user_id)
  );
$$;

create or replace function public.can_assign_personal_evento(
  p_cronograma_id bigint,
  p_personal_id integer,
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
      from public.eventos_cronograma c
      join public.eventos_deportivos e
        on e.id = c.evento_id
      join public.contrato_personal cp
        on cp.contrato_id = e.contrato_id
       and cp.personal_id = p_personal_id
       and public.is_contrato_assignment_current(
         cp.activo,
         cp.fecha_inicio,
         cp.fecha_fin,
         cp.removed_at
       )
      where c.id = p_cronograma_id
        and public.can_manage_evento_deportivo(e.id, e.contrato_id, e.instalacion_id, e.created_by, p_user_id)
    );
$$;

do $$
begin
  if to_regprocedure('public.can_read_evento_deportivo(bigint, uuid, uuid)') is not null then
    execute 'revoke all on function public.can_read_evento_deportivo(bigint, uuid, uuid) from public';
  end if;
end $$;
revoke all on function public.can_read_evento_deportivo(bigint, integer, uuid, uuid) from public;
revoke all on function public.can_create_evento_deportivo(integer, integer, uuid, uuid) from public;
revoke all on function public.can_manage_evento_deportivo(bigint, integer, integer, uuid, uuid) from public;
revoke all on function public.can_manage_evento_cronograma(bigint, bigint, uuid) from public;
revoke all on function public.can_assign_personal_evento(bigint, integer, uuid) from public;
grant execute on function public.can_read_evento_deportivo(bigint, integer, uuid, uuid) to authenticated;
grant execute on function public.can_create_evento_deportivo(integer, integer, uuid, uuid) to authenticated;
grant execute on function public.can_manage_evento_deportivo(bigint, integer, integer, uuid, uuid) to authenticated;
grant execute on function public.can_manage_evento_cronograma(bigint, bigint, uuid) to authenticated;
grant execute on function public.can_assign_personal_evento(bigint, integer, uuid) to authenticated;

alter table public.eventos_deportivos enable row level security;
alter table public.eventos_cronograma enable row level security;
alter table public.eventos_cronograma_personal enable row level security;
alter table public.eventos_montaje_personal enable row level security;
alter table public.eventos_instalaciones enable row level security;

drop policy if exists "authenticated_can_read_eventos_deportivos" on public.eventos_deportivos;
create policy "authenticated_can_read_eventos_deportivos"
on public.eventos_deportivos
for select
to authenticated
using (public.can_read_evento_deportivo(id, contrato_id, created_by));

drop policy if exists "authenticated_can_write_eventos_deportivos" on public.eventos_deportivos;
drop policy if exists "authenticated_can_insert_eventos_deportivos" on public.eventos_deportivos;
create policy "authenticated_can_insert_eventos_deportivos"
on public.eventos_deportivos
for insert
to authenticated
with check (public.can_create_evento_deportivo(contrato_id, instalacion_id, created_by));

drop policy if exists "authenticated_can_update_eventos_deportivos" on public.eventos_deportivos;
create policy "authenticated_can_update_eventos_deportivos"
on public.eventos_deportivos
for update
to authenticated
using (public.can_manage_evento_deportivo(id, contrato_id, instalacion_id, created_by))
with check (public.can_manage_evento_deportivo(id, contrato_id, instalacion_id, created_by));

drop policy if exists "authenticated_can_delete_eventos_deportivos" on public.eventos_deportivos;
create policy "authenticated_can_delete_eventos_deportivos"
on public.eventos_deportivos
for delete
to authenticated
using (public.can_manage_evento_deportivo(id, contrato_id, instalacion_id, created_by));

drop policy if exists "authenticated_can_read_eventos_cronograma" on public.eventos_cronograma;
create policy "authenticated_can_read_eventos_cronograma"
on public.eventos_cronograma
for select
to authenticated
using (
  exists (
    select 1
    from public.eventos_deportivos e
    where e.id = evento_id
      and public.can_read_evento_deportivo(e.id, e.contrato_id, e.created_by)
  )
);

drop policy if exists "authenticated_can_write_eventos_cronograma" on public.eventos_cronograma;
create policy "authenticated_can_write_eventos_cronograma"
on public.eventos_cronograma
for all
to authenticated
using (public.can_manage_evento_cronograma(id, evento_id))
with check (public.can_manage_evento_cronograma(id, evento_id));

drop policy if exists "authenticated_can_read_eventos_cronograma_personal" on public.eventos_cronograma_personal;
create policy "authenticated_can_read_eventos_cronograma_personal"
on public.eventos_cronograma_personal
for select
to authenticated
using (
  exists (
    select 1
    from public.eventos_cronograma c
    join public.eventos_deportivos e
      on e.id = c.evento_id
    where c.id = cronograma_id
      and public.can_read_evento_deportivo(e.id, e.contrato_id, e.created_by)
  )
);

drop policy if exists "authenticated_can_write_eventos_cronograma_personal" on public.eventos_cronograma_personal;
create policy "authenticated_can_write_eventos_cronograma_personal"
on public.eventos_cronograma_personal
for all
to authenticated
using (
  exists (
    select 1
    from public.eventos_cronograma c
    where c.id = cronograma_id
      and public.can_manage_evento_cronograma(c.id, c.evento_id)
  )
)
with check (public.can_assign_personal_evento(cronograma_id, personal_id));

drop policy if exists "authenticated_can_read_eventos_montaje_personal" on public.eventos_montaje_personal;
create policy "authenticated_can_read_eventos_montaje_personal"
on public.eventos_montaje_personal
for select
to authenticated
using (
  public.is_coordinacion_admin()
  or exists (
    select 1
    from public.contrato_personal cp
    where cp.personal_id = eventos_montaje_personal.personal_id
      and cp.contrato_id in (select public.coordinacion_readable_contrato_ids())
  )
);

drop policy if exists "authenticated_can_write_eventos_montaje_personal" on public.eventos_montaje_personal;
create policy "authenticated_can_write_eventos_montaje_personal"
on public.eventos_montaje_personal
for all
to authenticated
using (public.is_coordinacion_admin())
with check (public.is_coordinacion_admin());

drop policy if exists "authenticated_can_read_eventos_instalaciones" on public.eventos_instalaciones;
create policy "authenticated_can_read_eventos_instalaciones"
on public.eventos_instalaciones
for select
to authenticated
using (
  public.is_coordinacion_admin()
  or exists (
    select 1
    from public.contrato_instalaciones ci
    where ci.instalacion_id = eventos_instalaciones.instalacion_id
      and ci.contrato_id in (select public.coordinacion_readable_contrato_ids())
  )
);

drop policy if exists "authenticated_can_write_eventos_instalaciones" on public.eventos_instalaciones;
create policy "authenticated_can_write_eventos_instalaciones"
on public.eventos_instalaciones
for all
to authenticated
using (public.is_coordinacion_admin())
with check (public.is_coordinacion_admin());
