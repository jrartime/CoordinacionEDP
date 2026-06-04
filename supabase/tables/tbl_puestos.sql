create table if not exists public.tbl_puestos (
  id_puesto integer primary key,
  puesto text not null,
  detalle_puesto text,
  siglas text,
  convenio_grupo_nivel integer,
  categoria_id integer,
  dea boolean not null default false,
  rec_medico integer,
  epi boolean not null default false,
  clausula_preferencia boolean not null default false
);
