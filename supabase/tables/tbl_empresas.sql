create table if not exists public.tbl_empresas (
  id_empresa integer primary key,
  empresa text not null,
  razon_social text not null,
  cif text
);
