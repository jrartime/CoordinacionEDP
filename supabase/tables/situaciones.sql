do $$
begin
  if to_regclass('public.situaciones') is null
     and to_regclass('public.tbl_situaciones') is not null then
    alter table public.tbl_situaciones rename to situaciones;
  end if;
end $$;

do $$
begin
  if to_regclass('public.situaciones') is not null
     and exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'situaciones'
         and column_name = 'id_situacion'
     )
     and not exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'situaciones'
         and column_name = 'id'
     ) then
    alter table public.situaciones rename column id_situacion to id;
  end if;
end $$;
create table if not exists public.situaciones (
  id integer primary key,
  situacion text not null,
  descripcion text,
  desplazamiento boolean not null default false
);
