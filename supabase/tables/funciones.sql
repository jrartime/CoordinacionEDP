do $$
begin
  if to_regclass('public.funciones') is null
     and to_regclass('public.tbl_funciones') is not null then
    alter table public.tbl_funciones rename to funciones;
  end if;
end $$;

do $$
begin
  if to_regclass('public.funciones') is not null
     and exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'funciones'
         and column_name = 'id_funcion'
     )
     and not exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'funciones'
         and column_name = 'id'
     ) then
    alter table public.funciones rename column id_funcion to id;
  end if;
end $$;
create table if not exists public.funciones (
  id integer primary key,
  funcion text not null,
  siglas text,
  grupo text,
  formacion_horario boolean not null default false,
  activo boolean not null default true
);

alter table public.funciones
  add column if not exists activo boolean not null default true;
