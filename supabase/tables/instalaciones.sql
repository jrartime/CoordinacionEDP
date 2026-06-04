do $$
begin
  if to_regclass('public.instalaciones') is null
     and to_regclass('public.tbl_instalaciones') is not null then
    alter table public.tbl_instalaciones rename to instalaciones;
  end if;
end $$;

do $$
begin
  if to_regclass('public.instalaciones') is not null
     and exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'instalaciones'
         and column_name = 'id_instalacion'
     )
     and not exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'instalaciones'
         and column_name = 'id'
     ) then
    alter table public.instalaciones rename column id_instalacion to id;
  end if;
end $$;
create table if not exists public.instalaciones (
  id integer primary key,
  instalacion text not null,
  activo boolean not null default true,
  direccion text,
  codigo_postal text,
  localidad text,
  provincia text,
  telefono text,
  gps_latitud text,
  gps_longitud text,
  siglas text not null,
  categoria text
);

alter table public.instalaciones
add column if not exists activo boolean not null default true;

alter table public.instalaciones
drop column if exists encargado,
drop column if exists orden,
drop column if exists contrato;

create index if not exists idx_instalaciones_activo
on public.instalaciones (activo);
