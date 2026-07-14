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

alter table public.empresas
  add column if not exists logo_url text,
  add column if not exists logo_data_url text,
  add column if not exists logo_alt text,
  add column if not exists firma_data_url text,
  add column if not exists firmante_nombre text,
  add column if not exists firmante_dni text,
  add column if not exists firmante_cargo text,
  add column if not exists ciudad_firma text not null default 'Oviedo',
  add column if not exists direccion_pie text,
  add column if not exists telefono_pie text,
  add column if not exists email_pie text,
  add column if not exists web_pie text,
  add column if not exists notas text;

comment on column public.empresas.logo_url is
  'URL publica o ruta servida por la aplicacion para el logo usado en documentos laborales.';
comment on column public.empresas.logo_data_url is
  'Imagen del logo en formato data URL para documentos laborales.';
comment on column public.empresas.firma_data_url is
  'Imagen de la firma en formato data URL para documentos laborales.';
comment on column public.empresas.firmante_nombre is
  'Nombre de la persona que firma documentos laborales por la empresa.';
comment on column public.empresas.firmante_cargo is
  'Cargo que se muestra bajo la firma de empresa en documentos laborales.';

update public.empresas e
set
  logo_url = coalesce(e.logo_url, './EDP.jpg'),
  logo_alt = coalesce(e.logo_alt, 'EDP'),
  firmante_nombre = coalesce(e.firmante_nombre, 'Isabel Cortavitarte Mediavilla'),
  firmante_dni = coalesce(e.firmante_dni, '11.395.827-V'),
  firmante_cargo = coalesce(e.firmante_cargo, 'Directora-Gerente de Educación Deportiva del Principado'),
  ciudad_firma = coalesce(e.ciudad_firma, 'Oviedo'),
  direccion_pie = coalesce(e.direccion_pie, 'C/ González del Valle 14 2º izq 33004 Oviedo'),
  telefono_pie = coalesce(e.telefono_pie, '985 96 63 88'),
  email_pie = coalesce(e.email_pie, 'edp@edpsl.es')
where upper(coalesce(e.cif, '')) = 'B-33383928';
