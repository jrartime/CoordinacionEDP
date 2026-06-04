create table if not exists public.tbl_registros (
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
      and table_name = 'tbl_registros'
      and column_name = 'contriol'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tbl_registros'
      and column_name = 'control'
  ) then
    alter table public.tbl_registros rename column contriol to control;
  end if;
end $$;

alter table public.tbl_registros
  add column if not exists control timestamp;
