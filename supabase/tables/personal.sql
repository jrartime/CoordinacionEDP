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
  email text,
  movil text,
  telefono text,
  localidad text,
  municipio text,
  provincia text,
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
  tipo_contrato integer,
  grupo integer,
  nivel integer,
  grupo_cotizacion text,
  persona boolean not null default false,
  nombre text,
  apellido text
);

-- Los campos confidenciales (cuenta_corriente, ss, irpf, complementos
-- salariales, direccion, codigo_postal, fecha_nacimiento y contactos de
-- urgencia) viven en public.personal_confidencial con RLS admin-only.
-- Ver supabase/tables/personal_confidencial.sql.
