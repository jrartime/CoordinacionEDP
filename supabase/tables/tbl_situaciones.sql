create table if not exists public.tbl_situaciones (
  id_situacion integer primary key,
  situacion text not null,
  descripcion text,
  desplazamiento boolean not null default false
);
