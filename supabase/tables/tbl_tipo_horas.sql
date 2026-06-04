create table if not exists public.tbl_tipo_horas (
  id_tipo_hora integer primary key,
  tipo_hora text not null,
  descripcion text
);
