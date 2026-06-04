do $$
begin
  if to_regclass('public.tipo_horas') is null
     and to_regclass('public.tbl_tipo_horas') is not null then
    alter table public.tbl_tipo_horas rename to tipo_horas;
  end if;
end $$;

do $$
begin
  if to_regclass('public.tipo_horas') is not null
     and exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'tipo_horas'
         and column_name = 'id_tipo_hora'
     )
     and not exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'tipo_horas'
         and column_name = 'id'
     ) then
    alter table public.tipo_horas rename column id_tipo_hora to id;
  end if;
end $$;
create table if not exists public.tipo_horas (
  id integer primary key,
  tipo_hora text not null,
  descripcion text
);
