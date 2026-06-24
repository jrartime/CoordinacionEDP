do $$
begin
  if to_regclass('public.concilia_usuarios') is null
     and to_regclass('public.conciliausuarios') is not null then
    alter table public.conciliausuarios rename to concilia_usuarios;
  end if;
end $$;

create table if not exists public.concilia_usuarios (
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
  comedor boolean not null default false,
  grupo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint concilia_usuarios_codigo_clase_persona_semana_key
    unique (codigo_clase, codigo_persona, semana)
);

alter table public.concilia_usuarios
add column if not exists asistencia boolean not null default false;

alter table public.concilia_usuarios
add column if not exists asistencia_lunes boolean not null default false,
add column if not exists asistencia_martes boolean not null default false,
add column if not exists asistencia_miercoles boolean not null default false,
add column if not exists asistencia_jueves boolean not null default false,
add column if not exists asistencia_viernes boolean not null default false;

alter table public.concilia_usuarios
add column if not exists comedor boolean not null default false,
add column if not exists grupo text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'concilia_usuarios_grupo_check'
      and conrelid = 'public.concilia_usuarios'::regclass
  ) then
    alter table public.concilia_usuarios
    add constraint concilia_usuarios_grupo_check
    check (
      grupo is null or grupo in (
        'EI01', 'EI02', 'EI03', 'EI04', 'EI05', 'EI06', 'EI07', 'EI08',
        'PR01', 'PR02', 'PR03', 'PR04', 'PR05', 'PR06', 'PR07', 'PR08',
        'PR09', 'PR10', 'PR11', 'PR12', 'PR13', 'PR14', 'PR15'
      )
    );
  end if;
end $$;

create index if not exists concilia_usuarios_centro_idx
on public.concilia_usuarios (centro);

create index if not exists concilia_usuarios_semana_idx
on public.concilia_usuarios (semana);

create index if not exists concilia_usuarios_codigo_persona_idx
on public.concilia_usuarios (codigo_persona);

create index if not exists concilia_usuarios_mail_idx
on public.concilia_usuarios (lower(mail));

create index if not exists concilia_usuarios_centro_semana_alumnado_idx
on public.concilia_usuarios (centro, semana, alumnado);

create index if not exists concilia_usuarios_alumnado_idx
on public.concilia_usuarios (alumnado);

create index if not exists concilia_usuarios_grupo_idx
on public.concilia_usuarios (grupo);

create index if not exists concilia_usuarios_comedor_idx
on public.concilia_usuarios (comedor);

create or replace function public.concilia_normalize_text(p_value text)
returns text
language sql
immutable
parallel safe
as $$
  select lower(
    translate(
      coalesce(p_value, ''),
      'ÁÀÂÄÃÅáàâäãåÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÖÕóòôöõÚÙÛÜúùûüÑñÇç',
      'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuNnCc'
    )
  );
$$;

create or replace function public.get_concilia_filter_options(
  p_centro text default null,
  p_semana text default null,
  p_alumnado text default null
)
returns table (
  option_type text,
  option_value text
)
language sql
stable
security definer
set search_path = public
as $$
  with scoped as (
    select
      nullif(btrim(c.centro), '') as centro,
      nullif(btrim(c.semana), '') as semana,
      nullif(btrim(c.alumnado), '') as alumnado
    from public.concilia_usuarios c
    where (p_centro is null or c.centro = p_centro)
      and (p_semana is null or c.semana = p_semana)
      and (
        p_alumnado is null
        or public.concilia_normalize_text(c.alumnado) like '%' || public.concilia_normalize_text(p_alumnado) || '%'
      )
  )
  select 'centro' as option_type, centro as option_value from scoped where centro is not null
  union
  select 'semana' as option_type, semana as option_value from scoped where semana is not null
  order by option_type, option_value;
$$;

revoke all on function public.get_concilia_filter_options(text, text, text) from public;
grant execute on function public.get_concilia_filter_options(text, text, text) to authenticated;

create or replace function public.get_concilia_weekly_summary()
returns table (
  centro text,
  semana text,
  total bigint,
  nee_total bigint,
  infantil_total bigint,
  primaria_total bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with summary as (
    select
      coalesce(nullif(btrim(c.centro), ''), 'Sin centro') as centro,
      lpad(nullif(btrim(c.semana), ''), 2, '0') as semana,
      count(*)::bigint as total,
      count(*) filter (where nullif(btrim(c.nee), '') is not null)::bigint as nee_total,
      count(*) filter (
        where c.fecha_nacimiento >= make_date((extract(year from current_date)::integer - 6), 1, 1)
      )::bigint as infantil_total
    from public.concilia_usuarios c
    where nullif(btrim(c.semana), '') is not null
    group by coalesce(nullif(btrim(c.centro), ''), 'Sin centro'), lpad(nullif(btrim(c.semana), ''), 2, '0')
  )
  select
    summary.centro,
    summary.semana,
    summary.total,
    summary.nee_total,
    summary.infantil_total,
    (summary.total - summary.infantil_total)::bigint as primaria_total
  from summary
  order by summary.centro, summary.semana;
$$;

revoke all on function public.get_concilia_weekly_summary() from public;
grant execute on function public.get_concilia_weekly_summary() to authenticated;

create or replace function public.get_concilia_attendance_matrix(
  p_centro text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  codigo_persona text,
  centro text,
  alumnado text,
  semanas text[],
  total_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with grouped as (
    select
      coalesce(c.codigo_persona::text, '') as codigo_persona,
      coalesce(nullif(btrim(c.centro), ''), 'Sin centro') as centro,
      coalesce(nullif(btrim(c.alumnado), ''), 'Sin nombre') as alumnado,
      array_agg(distinct lpad(nullif(btrim(c.semana), ''), 2, '0') order by lpad(nullif(btrim(c.semana), ''), 2, '0')) as semanas
    from public.concilia_usuarios c
    where (p_centro is null or c.centro = p_centro)
      and nullif(btrim(c.semana), '') is not null
    group by c.codigo_persona, coalesce(nullif(btrim(c.centro), ''), 'Sin centro'), coalesce(nullif(btrim(c.alumnado), ''), 'Sin nombre')
  )
  select
    grouped.codigo_persona,
    grouped.centro,
    grouped.alumnado,
    grouped.semanas,
    count(*) over ()::bigint as total_count
  from grouped
  order by grouped.alumnado
  limit greatest(coalesce(p_limit, 50), 1)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.get_concilia_attendance_matrix(text, integer, integer) from public;
grant execute on function public.get_concilia_attendance_matrix(text, integer, integer) to authenticated;

drop function if exists public.get_concilia_attendance_rows(text, text, text, integer, integer);
drop function if exists public.get_concilia_attendance_rows(text, text, text, integer, integer, text, text);
drop function if exists public.get_concilia_attendance_rows(text, text, text, text, integer, integer, text, text);

create or replace function public.get_concilia_attendance_rows(
  p_centro text default null,
  p_semana text default null,
  p_grupo text default null,
  p_alumnado text default null,
  p_limit integer default 50,
  p_offset integer default 0,
  p_sort_field text default 'alumnado',
  p_sort_direction text default 'asc'
)
returns table (
  id bigint,
  centro text,
  semana text,
  alumnado text,
  edad text,
  asistencia_lunes boolean,
  asistencia_martes boolean,
  asistencia_miercoles boolean,
  asistencia_jueves boolean,
  asistencia_viernes boolean,
  total_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with filtered as (
    select
      c.id,
      coalesce(nullif(btrim(c.centro), ''), 'Sin centro') as centro,
      coalesce(nullif(btrim(c.semana), ''), 'Sin semana') as semana,
      coalesce(nullif(btrim(c.alumnado), ''), 'Sin nombre') as alumnado,
      coalesce(nullif(btrim(c.edad), ''), '-') as edad,
      nullif(regexp_replace(coalesce(c.edad, ''), '[^0-9]', '', 'g'), '')::integer as edad_num,
      coalesce(c.asistencia_lunes, false) as asistencia_lunes,
      coalesce(c.asistencia_martes, false) as asistencia_martes,
      coalesce(c.asistencia_miercoles, false) as asistencia_miercoles,
      coalesce(c.asistencia_jueves, false) as asistencia_jueves,
      coalesce(c.asistencia_viernes, false) as asistencia_viernes
    from public.concilia_usuarios c
    where (p_centro is null or c.centro = p_centro)
      and (p_semana is null or c.semana = p_semana)
      and (p_grupo is null or c.grupo = p_grupo)
      and (
        p_alumnado is null
        or public.concilia_normalize_text(c.alumnado) like '%' || public.concilia_normalize_text(p_alumnado) || '%'
      )
  )
  select
    filtered.id,
    filtered.centro,
    filtered.semana,
    filtered.alumnado,
    filtered.edad,
    filtered.asistencia_lunes,
    filtered.asistencia_martes,
    filtered.asistencia_miercoles,
    filtered.asistencia_jueves,
    filtered.asistencia_viernes,
    count(*) over ()::bigint as total_count
  from filtered
  order by
    case when p_sort_field = 'edad' and lower(p_sort_direction) = 'asc' then filtered.edad_num end asc nulls last,
    case when p_sort_field = 'edad' and lower(p_sort_direction) = 'desc' then filtered.edad_num end desc nulls last,
    case when p_sort_field = 'alumnado' and lower(p_sort_direction) = 'asc' then filtered.alumnado end asc,
    case when p_sort_field = 'alumnado' and lower(p_sort_direction) = 'desc' then filtered.alumnado end desc,
    filtered.alumnado asc,
    filtered.id asc
  limit greatest(coalesce(p_limit, 50), 1)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.get_concilia_attendance_rows(text, text, text, text, integer, integer, text, text) from public;
grant execute on function public.get_concilia_attendance_rows(text, text, text, text, integer, integer, text, text) to authenticated;

select pg_notify('pgrst', 'reload schema');

create or replace function public.get_concilia_nee_rows(
  p_alumnado text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  codigo_persona text,
  alumnado text,
  nee boolean,
  total_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with grouped as (
    select
      coalesce(c.codigo_persona::text, '') as codigo_persona,
      coalesce(nullif(btrim(c.alumnado), ''), 'Sin nombre') as alumnado,
      bool_or(nullif(btrim(c.nee), '') is not null) as nee
    from public.concilia_usuarios c
    where (
      p_alumnado is null
      or public.concilia_normalize_text(c.alumnado) like '%' || public.concilia_normalize_text(p_alumnado) || '%'
    )
    group by c.codigo_persona, coalesce(nullif(btrim(c.alumnado), ''), 'Sin nombre')
  )
  select
    grouped.codigo_persona,
    grouped.alumnado,
    grouped.nee,
    count(*) over ()::bigint as total_count
  from grouped
  order by grouped.nee desc, grouped.alumnado
  limit greatest(coalesce(p_limit, 50), 1)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.get_concilia_nee_rows(text, integer, integer) from public;
grant execute on function public.get_concilia_nee_rows(text, integer, integer) to authenticated;

drop function if exists public.get_concilia_comedor_rows(text, text, integer, integer);

create or replace function public.get_concilia_comedor_rows(
  p_centro text default null,
  p_alumnado text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  codigo_persona text,
  centro text,
  alumnado text,
  comedor boolean,
  total_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with grouped as (
    select
      coalesce(c.codigo_persona::text, '') as codigo_persona,
      coalesce(nullif(btrim(c.centro), ''), 'Sin centro') as centro,
      coalesce(nullif(btrim(c.alumnado), ''), 'Sin nombre') as alumnado,
      bool_or(coalesce(c.comedor, false)) as comedor
    from public.concilia_usuarios c
    where (
        p_centro is null
        or c.centro = p_centro
        or (p_centro = 'Sin centro' and nullif(btrim(c.centro), '') is null)
      )
      and (
        p_alumnado is null
        or public.concilia_normalize_text(c.alumnado) like '%' || public.concilia_normalize_text(p_alumnado) || '%'
      )
    group by
      c.codigo_persona,
      coalesce(nullif(btrim(c.centro), ''), 'Sin centro'),
      coalesce(nullif(btrim(c.alumnado), ''), 'Sin nombre')
  )
  select
    grouped.codigo_persona,
    grouped.centro,
    grouped.alumnado,
    grouped.comedor,
    count(*) over ()::bigint as total_count
  from grouped
  order by grouped.comedor desc, grouped.centro, grouped.alumnado
  limit greatest(coalesce(p_limit, 50), 1)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.get_concilia_comedor_rows(text, text, integer, integer) from public;
grant execute on function public.get_concilia_comedor_rows(text, text, integer, integer) to authenticated;

create or replace function public.set_concilia_comedor(
  p_codigo_persona text,
  p_centro text,
  p_comedor boolean
)
returns bigint
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  updated_count bigint;
begin
  update public.concilia_usuarios c
  set comedor = coalesce(p_comedor, false)
  where coalesce(c.codigo_persona::text, '') = coalesce(nullif(btrim(p_codigo_persona), ''), '')
    and (
      p_centro is null
      or c.centro = p_centro
      or (p_centro = 'Sin centro' and nullif(btrim(c.centro), '') is null)
    );

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

revoke all on function public.set_concilia_comedor(text, text, boolean) from public;
grant execute on function public.set_concilia_comedor(text, text, boolean) to authenticated;

create or replace function public.set_concilia_usuarios_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_concilia_usuarios_updated_at on public.concilia_usuarios;
create trigger set_concilia_usuarios_updated_at
before update on public.concilia_usuarios
for each row
execute function public.set_concilia_usuarios_updated_at();

alter table public.concilia_usuarios enable row level security;

grant select, insert, update on public.concilia_usuarios to authenticated;

do $$
declare
  id_sequence regclass;
begin
  id_sequence := pg_get_serial_sequence('public.concilia_usuarios', 'id')::regclass;

  if id_sequence is not null then
    execute format('grant usage, select on sequence %s to authenticated', id_sequence);
  end if;
end $$;

drop policy if exists "authenticated_can_read_concilia_usuarios" on public.concilia_usuarios;
create policy "authenticated_can_read_concilia_usuarios"
on public.concilia_usuarios
for select
to authenticated
using (true);

drop policy if exists "authenticated_can_insert_concilia_usuarios" on public.concilia_usuarios;
drop policy if exists "authenticated_can_update_concilia_usuarios" on public.concilia_usuarios;
drop policy if exists "authenticated_can_delete_concilia_usuarios" on public.concilia_usuarios;

create policy "authenticated_can_insert_concilia_usuarios"
on public.concilia_usuarios
for insert
to authenticated
with check (true);

create policy "authenticated_can_update_concilia_usuarios"
on public.concilia_usuarios
for update
to authenticated
using (true)
with check (true);

create or replace function public.get_concilia_carnes_by_mail(
  p_mail text
)
returns table (
  alumnado text,
  centro text
)
language sql
stable
security definer
set search_path = public
as $$
  select distinct
    nullif(btrim(c.alumnado), '') as alumnado,
    coalesce(nullif(btrim(c.centro), ''), 'Sin centro') as centro
  from public.concilia_usuarios c
  where lower(nullif(btrim(c.mail), '')) = lower(nullif(btrim(p_mail), ''))
    and nullif(btrim(c.alumnado), '') is not null
  order by alumnado, centro;
$$;

revoke all on function public.get_concilia_carnes_by_mail(text) from public;
grant execute on function public.get_concilia_carnes_by_mail(text) to anon, authenticated;

create table if not exists public.concilia_carnes_descargas (
  id bigserial primary key,
  downloaded_at timestamptz not null default now(),
  mail text not null,
  alumnado text not null,
  centro text
);

create index if not exists concilia_carnes_descargas_downloaded_at_idx
on public.concilia_carnes_descargas (downloaded_at desc);

create index if not exists concilia_carnes_descargas_mail_idx
on public.concilia_carnes_descargas (lower(mail));

alter table public.concilia_carnes_descargas enable row level security;

revoke all on public.concilia_carnes_descargas from public;
revoke all on public.concilia_carnes_descargas from anon;
grant select on public.concilia_carnes_descargas to authenticated;

do $$
declare
  id_sequence regclass;
begin
  id_sequence := pg_get_serial_sequence('public.concilia_carnes_descargas', 'id')::regclass;

  if id_sequence is not null then
    execute format('grant usage, select on sequence %s to authenticated', id_sequence);
  end if;
end $$;

drop policy if exists "authenticated_can_read_concilia_carnes_descargas"
on public.concilia_carnes_descargas;

create policy "authenticated_can_read_concilia_carnes_descargas"
on public.concilia_carnes_descargas
for select
to authenticated
using (true);

create or replace function public.record_concilia_carne_download(
  p_mail text,
  p_alumnado text,
  p_centro text
)
returns boolean
language sql
volatile
security definer
set search_path = public
as $$
  with matched as (
    select
      lower(nullif(btrim(c.mail), '')) as mail,
      nullif(btrim(c.alumnado), '') as alumnado,
      coalesce(nullif(btrim(c.centro), ''), 'Sin centro') as centro
    from public.concilia_usuarios c
    where lower(nullif(btrim(c.mail), '')) = lower(nullif(btrim(p_mail), ''))
      and nullif(btrim(c.alumnado), '') = nullif(btrim(p_alumnado), '')
      and coalesce(nullif(btrim(c.centro), ''), 'Sin centro') = coalesce(nullif(btrim(p_centro), ''), 'Sin centro')
    limit 1
  ),
  inserted as (
    insert into public.concilia_carnes_descargas (mail, alumnado, centro)
    select matched.mail, matched.alumnado, matched.centro
    from matched
    returning true as logged
  )
  select coalesce((select logged from inserted), false);
$$;

revoke all on function public.record_concilia_carne_download(text, text, text) from public;
grant execute on function public.record_concilia_carne_download(text, text, text) to anon, authenticated;
