do $$
begin
  if to_regclass('public.empresas') is null
     and to_regclass('public.tbl_empresas') is not null then
    alter table public.tbl_empresas rename to empresas;
  end if;
end $$;

do $$
begin
  if to_regclass('public.empresas') is not null
     and exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'empresas'
         and column_name = 'id_empresa'
     )
     and not exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'empresas'
         and column_name = 'id'
     ) then
    alter table public.empresas rename column id_empresa to id;
  end if;
end $$;
create table if not exists public.empresas (
  id integer primary key,
  empresa text not null,
  razon_social text not null,
  cif text
);
