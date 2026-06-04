create table if not exists public.tbl_funciones (
  id_funcion integer primary key,
  funcion text not null,
  siglas text,
  grupo text,
  formacion_horario boolean not null default false
);
