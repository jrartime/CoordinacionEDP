do $$
begin
  if to_regclass('public.puestos') is null
     and to_regclass('public.tbl_puestos') is not null then
    alter table public.tbl_puestos rename to puestos;
  end if;
end $$;

do $$
begin
  if to_regclass('public.puestos') is not null
     and exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'puestos'
         and column_name = 'id_puesto'
     )
     and not exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'puestos'
         and column_name = 'id'
     ) then
    alter table public.puestos rename column id_puesto to id;
  end if;
end $$;
create table if not exists public.puestos (
  id integer primary key,
  puesto text not null,
  detalle_puesto text,
  siglas text,
  convenio_grupo_nivel integer,
  categoria_id integer,
  dea boolean not null default false,
  rec_medico integer,
  epi boolean not null default false,
  clausula_preferencia boolean not null default false,
  activo boolean not null default true
);

alter table public.puestos
  add column if not exists activo boolean not null default true;
