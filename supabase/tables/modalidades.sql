do $$
begin
  if to_regclass('public.modalidades') is null
     and to_regclass('public.tbl_modalidades') is not null then
    alter table public.tbl_modalidades rename to modalidades;
  end if;
end $$;

do $$
begin
  if to_regclass('public.modalidades') is not null
     and exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'modalidades'
         and column_name = 'id_modalidad'
     )
     and not exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'modalidades'
         and column_name = 'id'
     ) then
    alter table public.modalidades rename column id_modalidad to id;
  end if;
end $$;
create table if not exists public.modalidades (
  id integer primary key,
  modalidad text not null,
  siglas text
);
