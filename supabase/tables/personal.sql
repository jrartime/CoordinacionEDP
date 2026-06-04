do $$
begin
  if to_regclass('public.personal') is null
     and to_regclass('public.tbl_personal') is not null then
    alter table public.tbl_personal rename to personal;
  end if;
end $$;

do $$
begin
  if to_regclass('public.personal') is not null
     and exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'personal'
         and column_name = 'id_personal'
     )
     and not exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'personal'
         and column_name = 'id'
     ) then
    alter table public.personal rename column id_personal to id;
  end if;
end $$;
create table if not exists public.personal (
  id integer primary key,
  activo boolean not null default false,
  pert_empresa boolean not null default false,
  vinculacion_id integer,
  personal text not null,
  genero text,
  antiguedad date,
  dni text,
  fecha_nacimiento date,
  ss text,
  email text,
  movil text,
  telefono text,
  direccion text,
  codigo_postal integer,
  localidad text,
  municipio text,
  provincia text,
  cuenta_corriente text,
  foto text,
  contrato_id text,
  observacion text,
  desplazamiento boolean not null default false,
  enviar boolean not null default false,
  carpeta text,
  pago boolean not null default false,
  cv boolean not null default false,
  da boolean not null default false,
  ds boolean not null default false,
  prev_riesgos date,
  epi boolean not null default false,
  titulos boolean not null default false,
  ig_ac boolean not null default false,
  uniforme boolean not null default false,
  med_emerg boolean not null default false,
  ens boolean not null default false,
  com_antiguedad_04 numeric(12, 2),
  com_absorbible_18 numeric(12, 2),
  porcent_complemento_18 numeric(12, 2),
  prorrateo_pagas boolean not null default false,
  num_pagas_extra integer,
  tipo_contrato integer,
  grupo integer,
  nivel integer,
  grupo_cotizacion text,
  contacto_urgencia text,
  telefono_urgencia text,
  persona boolean not null default false,
  irpf numeric(7, 4),
  nombre text,
  apellido text
);
