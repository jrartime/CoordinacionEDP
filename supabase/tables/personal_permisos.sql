-- ============================================================================
--  Permisos del personal (antes "medidas de conciliación"), migradas desde
--  Tbl_Personal_Conciliacion / _Tipo (Access).
-- ----------------------------------------------------------------------------
--  Renombrado personal_conciliacion -> personal_permisos el 2026-09-04: la
--  maternidad/paternidad y la lactancia se movieron aquí desde
--  `personal_bajas` (ver personal_bajas.sql) porque, aunque administrativamente
--  se tramitan como una baja, no son una situación de salud/IT sino permisos
--  con un tratamiento de nómina propio y distinto entre sí: maternidad
--  suspende el contrato (sin nómina), lactancia la sigue pagando la empresa.
--  El riesgo durante el embarazo/lactancia SÍ se queda en personal_bajas: es
--  una situación de salud asimilada a la IT, no un permiso.
--
--  `personal_permisos_tipo.tratamiento_nomina` dice cómo debe tratar el
--  futuro motor de nómina el periodo cubierto por ese tipo, sin tener que
--  adivinarlo por el nombre:
--    'suspendido'         -> contrato suspendido: no se genera nómina ni
--                            cuenta como jornada (maternidad/paternidad,
--                            excedencia).
--    'pagado_por_empresa' -> la empresa sigue pagando nómina normal mientras
--                            dura (lactancia).
--    'normal'             -> no afecta al cálculo de nómina, es solo
--                            constancia/registro (reducción de jornada,
--                            concreción horaria, medidas especiales, ayuda a
--                            la dependencia, otras).
--
--  `personal_permisos_categoria` recoge el epígrafe del registro de medidas
--  de conciliación de un Plan de Igualdad (6.1 adaptación o reducción de
--  jornada, 6.2/6.3 medida especial, 6.4 ayuda a la dependencia, Otras
--  medidas) normalizado aparte -no como texto repetido en cada tipo- para
--  poder agrupar por epígrafe el día que se construya ese informe.
--  Maternidad/paternidad se clasifica en "Otras medidas" (como Excedencia,
--  no es una medida de adaptación de jornada sino una suspensión legal) y
--  Lactancia en "6.1" (es, en esencia, un derecho de reducción/acumulación
--  de jornada).
--
--  La excedencia (tipo_id 2) ya vive en historiales_laborales
--  (motivo_baja_id = Excedencia / tipo_contratacion_id = Reincorporación
--  excedencia) y se mantiene aquí solo como catálogo/tipo seleccionable por
--  si se necesita registrar una fila informativa; no se deriva
--  automáticamente todavía - se deja para cuando se construya el informe por
--  epígrafe, que es quien de verdad necesita cruzarla.
-- ============================================================================

do $$
begin
  if to_regclass('public.personal_permisos_categoria') is null
     and to_regclass('public.personal_conciliacion_categoria') is not null then
    alter table public.personal_conciliacion_categoria rename to personal_permisos_categoria;
  end if;
end $$;

create table if not exists public.personal_permisos_categoria (
  id integer primary key,
  categoria text not null,
  orden integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.personal_permisos_categoria (id, categoria, orden) values
  (1, '6.1 Adaptación o reducción de jornada', 10),
  (2, '6.2 Medida especial de conciliación', 20),
  (3, '6.3 Medida especial de conciliación por motivos excepcionales', 30),
  (4, '6.4 Medidas de ayuda a la dependencia', 40),
  (5, 'Otras medidas', 50)
on conflict (id) do update set
  categoria = excluded.categoria,
  orden = excluded.orden,
  updated_at = now();

do $$
begin
  if to_regclass('public.personal_permisos_tipo') is null
     and to_regclass('public.personal_conciliacion_tipo') is not null then
    alter table public.personal_conciliacion_tipo rename to personal_permisos_tipo;
  end if;
end $$;

create table if not exists public.personal_permisos_tipo (
  id integer primary key,
  tipo text not null,
  categoria_id integer not null references public.personal_permisos_categoria (id),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.personal_permisos_tipo
add column if not exists tratamiento_nomina text not null default 'normal';

alter table public.personal_permisos_tipo
drop constraint if exists personal_permisos_tipo_tratamiento_check;
alter table public.personal_permisos_tipo
add constraint personal_permisos_tipo_tratamiento_check
check (tratamiento_nomina in ('suspendido', 'pagado_por_empresa', 'normal'));

comment on column public.personal_permisos_tipo.tratamiento_nomina is
  'Cómo trata el motor de nómina el periodo cubierto por este tipo: suspendido (sin nómina ni jornada), pagado_por_empresa (nómina normal a cargo de la empresa) o normal (no afecta al cálculo).';

insert into public.personal_permisos_tipo (id, tipo, categoria_id, tratamiento_nomina) values
  (1, 'Reducción de jornada', 1, 'normal'),
  (2, 'Excedencia', 5, 'suspendido'),
  (3, 'Concreción horaria/adaptación de jornada', 1, 'normal'),
  (4, 'Jubilación parcial', 5, 'normal'),
  (5, 'Medida especial de conciliación', 2, 'normal'),
  (6, 'Otros', 5, 'normal'),
  (7, 'Medida especial de conciliación por motivos excepcionales', 3, 'normal'),
  (8, 'Medida de ayuda a la dependencia', 4, 'normal'),
  (9, 'Maternidad/paternidad', 5, 'suspendido'),
  (10, 'Lactancia', 1, 'pagado_por_empresa')
on conflict (id) do update set
  tipo = excluded.tipo,
  categoria_id = excluded.categoria_id,
  tratamiento_nomina = excluded.tratamiento_nomina,
  updated_at = now();

do $$
begin
  if to_regclass('public.personal_permisos') is null
     and to_regclass('public.personal_conciliacion') is not null then
    alter table public.personal_conciliacion rename to personal_permisos;
  end if;
end $$;

create table if not exists public.personal_permisos (
  id bigint generated by default as identity primary key,
  personal_id integer not null references public.personal (id),
  tipo_id integer not null references public.personal_permisos_tipo (id),
  fecha_inicio date not null,
  fecha_fin date,
  observacion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint personal_permisos_fechas_validas
    check (fecha_fin is null or fecha_fin >= fecha_inicio)
);

comment on column public.personal_permisos.fecha_fin is
  'null = permiso indefinido/en curso.';

do $$
begin
  if to_regclass('public.personal_permisos_id_seq') is null
     and to_regclass('public.personal_conciliacion_id_seq') is not null then
    alter sequence public.personal_conciliacion_id_seq rename to personal_permisos_id_seq;
  end if;
end $$;

drop index if exists public.personal_conciliacion_personal_id_idx;
drop index if exists public.personal_conciliacion_tipo_id_idx;
drop index if exists public.personal_conciliacion_fecha_inicio_idx;
drop index if exists public.personal_conciliacion_fecha_fin_idx;

create index if not exists personal_permisos_personal_id_idx
on public.personal_permisos (personal_id);

create index if not exists personal_permisos_tipo_id_idx
on public.personal_permisos (tipo_id);

create index if not exists personal_permisos_fecha_inicio_idx
on public.personal_permisos (fecha_inicio);

create index if not exists personal_permisos_fecha_fin_idx
on public.personal_permisos (fecha_fin);

drop trigger if exists set_personal_conciliacion_updated_at on public.personal_permisos;
drop function if exists public.set_personal_conciliacion_updated_at();

create or replace function public.set_personal_permisos_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_personal_permisos_updated_at on public.personal_permisos;
create trigger set_personal_permisos_updated_at
before update on public.personal_permisos
for each row
execute function public.set_personal_permisos_updated_at();

drop view if exists public.personal_conciliacion_detalle;
drop view if exists public.personal_permisos_detalle;

create or replace view public.personal_permisos_detalle as
select
  c.id,
  c.personal_id,
  p.personal,
  p.dni,
  c.tipo_id,
  ct.tipo,
  ct.categoria_id,
  cc.categoria,
  cc.orden as categoria_orden,
  ct.tratamiento_nomina,
  c.fecha_inicio,
  c.fecha_fin,
  case
    when c.fecha_fin is not null then (c.fecha_fin - c.fecha_inicio) + 1
    else null
  end as dias,
  (c.fecha_fin is null) as en_curso,
  c.observacion,
  c.created_at,
  c.updated_at
from public.personal_permisos c
left join public.personal p
  on p.id = c.personal_id
left join public.personal_permisos_tipo ct
  on ct.id = c.tipo_id
left join public.personal_permisos_categoria cc
  on cc.id = ct.categoria_id;

alter view public.personal_permisos_detalle set (security_invoker = true);

grant select on public.personal_permisos_detalle to authenticated;

select setval(
  pg_get_serial_sequence('public.personal_permisos', 'id'),
  coalesce((select max(id) from public.personal_permisos), 1),
  true
);
