do $$
begin
  if to_regclass('public.registros') is null
     and to_regclass('public.tbl_registros') is not null then
    alter table public.tbl_registros rename to registros;
  end if;
end $$;

create table if not exists public.registros (
  id integer primary key,
  personal text not null,
  dni text not null,
  centro text not null,
  puesto text not null,
  fecha date not null,
  hora_inicio time not null,
  hora_fin time,
  tipo_jornada text,
  observacion text,
  eliminado boolean not null default false,
  control timestamp
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'registros'
      and column_name = 'contriol'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'registros'
      and column_name = 'control'
  ) then
    alter table public.registros rename column contriol to control;
  end if;
end $$;

alter table public.registros
  add column if not exists control timestamp;

create index if not exists registros_fecha_hora_id_idx
on public.registros (fecha desc, hora_inicio asc, id asc);

create index if not exists registros_centro_fecha_idx
on public.registros (centro, fecha desc);

create index if not exists registros_puesto_fecha_idx
on public.registros (puesto, fecha desc);

create index if not exists registros_dni_fecha_idx
on public.registros (dni, fecha desc);

create or replace function public.get_control_records_summary(
  p_date_from date default null,
  p_date_to date default null,
  p_personal text default null,
  p_centro text default null,
  p_puesto text default null
)
returns table (
  personal text,
  total_minutes bigint,
  record_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(nullif(btrim(p.personal), ''), nullif(btrim(r.personal), ''), 'Sin nombre') as personal,
    sum(
      case
        when r.hora_inicio is null or r.hora_fin is null then 0
        when r.hora_fin >= r.hora_inicio then
          extract(epoch from (r.hora_fin - r.hora_inicio)) / 60
        else
          extract(epoch from ((r.hora_fin - r.hora_inicio) + interval '24 hours')) / 60
      end
    )::bigint as total_minutes,
    count(*)::bigint as record_count
  from public.registros r
  left join public.personal p
    on p.dni = r.dni
  where (p_date_from is null or r.fecha >= p_date_from)
    and (p_date_to is null or r.fecha <= p_date_to)
    and (p_centro is null or r.centro = p_centro)
    and (p_puesto is null or r.puesto = p_puesto)
    and (
      p_personal is null
      or r.personal ilike '%' || p_personal || '%'
      or p.personal ilike '%' || p_personal || '%'
    )
  group by coalesce(nullif(btrim(p.personal), ''), nullif(btrim(r.personal), ''), 'Sin nombre')
  order by personal;
$$;

revoke all on function public.get_control_records_summary(date, date, text, text, text) from public;
grant execute on function public.get_control_records_summary(date, date, text, text, text) to authenticated;

create or replace function public.get_control_filter_options(
  p_date_from date default null,
  p_date_to date default null,
  p_personal text default null,
  p_centro text default null,
  p_puesto text default null
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
      coalesce(nullif(btrim(p.personal), ''), nullif(btrim(r.personal), '')) as personal,
      nullif(btrim(r.centro), '') as centro,
      nullif(btrim(r.puesto), '') as puesto
    from public.registros r
    left join public.personal p
      on p.dni = r.dni
    where (p_date_from is null or r.fecha >= p_date_from)
      and (p_date_to is null or r.fecha <= p_date_to)
      and (p_personal is null or r.personal ilike '%' || p_personal || '%' or p.personal ilike '%' || p_personal || '%')
      and (p_centro is null or r.centro = p_centro)
      and (p_puesto is null or r.puesto = p_puesto)
  )
  select 'personal' as option_type, personal as option_value from scoped where personal is not null
  union
  select 'centro' as option_type, centro as option_value from scoped where centro is not null
  union
  select 'puesto' as option_type, puesto as option_value from scoped where puesto is not null
  order by option_type, option_value;
$$;

revoke all on function public.get_control_filter_options(date, date, text, text, text) from public;
grant execute on function public.get_control_filter_options(date, date, text, text, text) to authenticated;
