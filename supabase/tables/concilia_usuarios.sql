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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint concilia_usuarios_codigo_clase_persona_semana_key
    unique (codigo_clase, codigo_persona, semana)
);

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
      and (p_alumnado is null or c.alumnado ilike '%' || p_alumnado || '%')
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
    where (p_alumnado is null or c.alumnado ilike '%' || p_alumnado || '%')
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

grant select, update on public.concilia_usuarios to authenticated;

drop policy if exists "authenticated_can_read_concilia_usuarios" on public.concilia_usuarios;
create policy "authenticated_can_read_concilia_usuarios"
on public.concilia_usuarios
for select
to authenticated
using (true);

drop policy if exists "authenticated_can_insert_concilia_usuarios" on public.concilia_usuarios;
drop policy if exists "authenticated_can_update_concilia_usuarios" on public.concilia_usuarios;
drop policy if exists "authenticated_can_delete_concilia_usuarios" on public.concilia_usuarios;

create policy "authenticated_can_update_concilia_usuarios"
on public.concilia_usuarios
for update
to authenticated
using (true)
with check (true);
