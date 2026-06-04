do $$
begin
  if to_regclass('public.contratos') is null
     and to_regclass('public.tbl_contratos') is not null then
    alter table public.tbl_contratos rename to contratos;
  end if;
end $$;

do $$
begin
  if to_regclass('public.contratos') is not null
     and exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'contratos'
         and column_name = 'id_contrato'
     )
     and not exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'contratos'
         and column_name = 'id'
     ) then
    alter table public.contratos rename column id_contrato to id;
  end if;
end $$;
create table if not exists public.contratos (
  id integer primary key,
  contrato text not null,
  descripcion text,
  presupuesto_anual numeric(14, 2),
  fecha_inicio date,
  fecha_fin date,
  expediente text,
  cpv text,
  importe text,
  cliente text,
  activo boolean not null default false,
  seleccionar boolean not null default false,
  desplazamiento boolean not null default false,
  agrupacion_nomina text,
  iva numeric(7, 4)
);
