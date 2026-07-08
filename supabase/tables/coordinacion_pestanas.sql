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
        'actividades',
        'registros',
        'historial'
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
  ('historial', 'Historial laboral', 'Historial laboral del personal (altas y bajas).', 107, true),
  ('contracts', 'Contratos', 'Gestión de contratos y servicios.', 110, true),
  ('settings', 'Configuracion', 'Gestion de puestos, funciones y modalidades.', 115, true),
  ('actividades', 'Actividades', 'Gestión transversal de actividades.', 120, true),
  ('registros', 'Registros', 'Detalle generado desde actividades.', 125, true)
on conflict (pestana) do update set
  etiqueta = excluded.etiqueta,
  descripcion = excluded.descripcion,
  orden = excluded.orden,
  activo = excluded.activo,
  updated_at = now();

do $$
begin
  if to_regclass('public.coordinacion_usuario_pestanas') is not null then
    alter table public.coordinacion_usuario_pestanas
    drop constraint if exists coordinacion_usuario_pestanas_key_check;

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
  end if;
end $$;

delete from public.coordinacion_pestanas
where pestana in (
  'concilia_alumnado',
  'concilia_asistencia',
  'concilia_nee',
  'concilia_disponibilidad',
  'concilia_asignaciones',
  'concilia_actividades'
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
    'actividades',
    'registros',
    'historial'
  )
);

create index if not exists coordinacion_pestanas_activo_orden_idx
on public.coordinacion_pestanas (activo, orden);

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

alter table public.coordinacion_pestanas enable row level security;

grant select, insert, update, delete on public.coordinacion_pestanas to authenticated;

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
