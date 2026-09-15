-- Alumnado matriculado en el programa Concilia durante el curso lectivo (dias
-- de colegio, no vacaciones), por centro y turno (A/B entre semana; San Pedro
-- de los Arcos es un caso especial de fin de semana con hasta 3 turnos el
-- sabado y 2 el domingo). Sustituye el Excel "Asistencia CONCILIA LECTIVOS".
--
-- Tres tablas, independientes de concilia_usuarios (esa viene de un sistema
-- externo con codigo_clase/codigo_persona/grupo EI-PR y no encaja con este
-- alumnado por centro/turno):
--   concilia_lectivo_usuarios  -> roster de un curso escolar, ligado a instalaciones
--   concilia_lectivo_horarios  -> que dia/turno le corresponde a cada alumno (matricula)
--   concilia_lectivo_asistencias -> historico de presente/ausente por fecha real

create table if not exists public.concilia_lectivo_usuarios (
  id bigserial primary key,
  centro_id integer not null references public.instalaciones (id),
  curso_escolar text not null,
  nombre text not null,
  apellidos text not null,
  telefono_1 text,
  telefono_2 text,
  correo_electronico text,
  edad integer,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint concilia_lectivo_usuarios_centro_curso_nombre_key
    unique (centro_id, curso_escolar, nombre, apellidos)
);

alter table public.concilia_lectivo_usuarios
add column if not exists correo_electronico text;

-- Ficha ampliada (Asistencia WEB, curso 2026-2027): autorizados para recoger al
-- alumno, autorizaciones de salida/imagenes, alergias/observaciones, y el texto
-- libre original de "ASISTENCIA" del Excel como referencia humana (la matricula
-- real, ya estructurada por dia/turno, vive en concilia_lectivo_horarios).
alter table public.concilia_lectivo_usuarios
add column if not exists autorizado_1_nombre text,
add column if not exists autorizado_1_dni text,
add column if not exists autorizado_2_nombre text,
add column if not exists autorizado_2_dni text,
add column if not exists autorizado_3_nombre text,
add column if not exists autorizado_3_dni text,
add column if not exists autoriza_se_va_solo boolean,
add column if not exists autoriza_salidas_centro boolean,
add column if not exists autoriza_imagenes boolean,
add column if not exists alergias text,
add column if not exists observaciones text,
add column if not exists asistencia_resumen text;

create index if not exists concilia_lectivo_usuarios_centro_idx
on public.concilia_lectivo_usuarios (centro_id);

create index if not exists concilia_lectivo_usuarios_curso_idx
on public.concilia_lectivo_usuarios (curso_escolar);

create index if not exists concilia_lectivo_usuarios_activo_idx
on public.concilia_lectivo_usuarios (activo);

create table if not exists public.concilia_lectivo_horarios (
  id bigserial primary key,
  lectivo_usuario_id bigint not null references public.concilia_lectivo_usuarios (id) on delete cascade,
  dia_semana text not null check (
    dia_semana in ('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo')
  ),
  turno text not null,
  turno_orden smallint not null default 0,
  matriculado boolean not null default true,
  constraint concilia_lectivo_horarios_usuario_dia_turno_key
    unique (lectivo_usuario_id, dia_semana, turno)
);

create index if not exists concilia_lectivo_horarios_usuario_idx
on public.concilia_lectivo_horarios (lectivo_usuario_id);

create table if not exists public.concilia_lectivo_asistencias (
  id bigserial primary key,
  lectivo_usuario_id bigint not null references public.concilia_lectivo_usuarios (id) on delete cascade,
  centro_id integer not null references public.instalaciones (id),
  fecha date not null,
  dia_semana text not null,
  turno text not null,
  presente boolean not null,
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint concilia_lectivo_asistencias_usuario_fecha_turno_key
    unique (lectivo_usuario_id, fecha, turno)
);

create index if not exists concilia_lectivo_asistencias_centro_fecha_idx
on public.concilia_lectivo_asistencias (centro_id, fecha);

create index if not exists concilia_lectivo_asistencias_usuario_idx
on public.concilia_lectivo_asistencias (lectivo_usuario_id);

create or replace function public.set_concilia_lectivo_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_concilia_lectivo_usuarios_updated_at on public.concilia_lectivo_usuarios;
create trigger set_concilia_lectivo_usuarios_updated_at
before update on public.concilia_lectivo_usuarios
for each row
execute function public.set_concilia_lectivo_updated_at();

drop trigger if exists set_concilia_lectivo_asistencias_updated_at on public.concilia_lectivo_asistencias;
create trigger set_concilia_lectivo_asistencias_updated_at
before update on public.concilia_lectivo_asistencias
for each row
execute function public.set_concilia_lectivo_updated_at();

alter table public.concilia_lectivo_usuarios enable row level security;
alter table public.concilia_lectivo_horarios enable row level security;
alter table public.concilia_lectivo_asistencias enable row level security;

grant select, insert, update on public.concilia_lectivo_usuarios to authenticated;
grant select, insert, update on public.concilia_lectivo_horarios to authenticated;
grant select, insert, update on public.concilia_lectivo_asistencias to authenticated;

do $$
declare
  id_sequence regclass;
begin
  id_sequence := pg_get_serial_sequence('public.concilia_lectivo_usuarios', 'id')::regclass;
  if id_sequence is not null then
    execute format('grant usage, select on sequence %s to authenticated', id_sequence);
  end if;

  id_sequence := pg_get_serial_sequence('public.concilia_lectivo_horarios', 'id')::regclass;
  if id_sequence is not null then
    execute format('grant usage, select on sequence %s to authenticated', id_sequence);
  end if;

  id_sequence := pg_get_serial_sequence('public.concilia_lectivo_asistencias', 'id')::regclass;
  if id_sequence is not null then
    execute format('grant usage, select on sequence %s to authenticated', id_sequence);
  end if;
end $$;

drop policy if exists "authenticated_can_read_concilia_lectivo_usuarios" on public.concilia_lectivo_usuarios;
create policy "authenticated_can_read_concilia_lectivo_usuarios"
on public.concilia_lectivo_usuarios
for select
to authenticated
using (true);

drop policy if exists "authenticated_can_insert_concilia_lectivo_usuarios" on public.concilia_lectivo_usuarios;
create policy "authenticated_can_insert_concilia_lectivo_usuarios"
on public.concilia_lectivo_usuarios
for insert
to authenticated
with check (true);

drop policy if exists "authenticated_can_update_concilia_lectivo_usuarios" on public.concilia_lectivo_usuarios;
create policy "authenticated_can_update_concilia_lectivo_usuarios"
on public.concilia_lectivo_usuarios
for update
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated_can_read_concilia_lectivo_horarios" on public.concilia_lectivo_horarios;
create policy "authenticated_can_read_concilia_lectivo_horarios"
on public.concilia_lectivo_horarios
for select
to authenticated
using (true);

drop policy if exists "authenticated_can_insert_concilia_lectivo_horarios" on public.concilia_lectivo_horarios;
create policy "authenticated_can_insert_concilia_lectivo_horarios"
on public.concilia_lectivo_horarios
for insert
to authenticated
with check (true);

drop policy if exists "authenticated_can_update_concilia_lectivo_horarios" on public.concilia_lectivo_horarios;
create policy "authenticated_can_update_concilia_lectivo_horarios"
on public.concilia_lectivo_horarios
for update
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated_can_read_concilia_lectivo_asistencias" on public.concilia_lectivo_asistencias;
create policy "authenticated_can_read_concilia_lectivo_asistencias"
on public.concilia_lectivo_asistencias
for select
to authenticated
using (true);

drop policy if exists "authenticated_can_insert_concilia_lectivo_asistencias" on public.concilia_lectivo_asistencias;
create policy "authenticated_can_insert_concilia_lectivo_asistencias"
on public.concilia_lectivo_asistencias
for insert
to authenticated
with check (true);

drop policy if exists "authenticated_can_update_concilia_lectivo_asistencias" on public.concilia_lectivo_asistencias;
create policy "authenticated_can_update_concilia_lectivo_asistencias"
on public.concilia_lectivo_asistencias
for update
to authenticated
using (true)
with check (true);

select pg_notify('pgrst', 'reload schema');
