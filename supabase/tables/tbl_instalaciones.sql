create table if not exists public.tbl_instalaciones (
  id_instalacion integer primary key,
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

alter table public.tbl_instalaciones
add column if not exists activo boolean not null default true;

alter table public.tbl_instalaciones
drop column if exists encargado,
drop column if exists orden,
drop column if exists contrato;

create index if not exists idx_tbl_instalaciones_activo
on public.tbl_instalaciones (activo);
