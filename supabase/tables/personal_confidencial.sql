-- Datos confidenciales de personal separados de la tabla `personal`.
--
-- Motivacion: la policy de lectura de `personal` es abierta (using (true)),
-- de modo que cualquier usuario autenticado podia leer datos bancarios,
-- salariales y personales de toda la plantilla. Estos campos se mueven a
-- `personal_confidencial`, con RLS que solo permite acceso al rol admin.
--
-- La tabla `personal` conserva la identidad operativa (id, nombre, dni,
-- vinculacion...) que el resto de la app necesita en selectores, importacion,
-- control de horas, programacion y eventos.
--
-- Migracion idempotente: puede ejecutarse varias veces sin efectos adversos.

-- 1. Tabla confidencial (1:1 con personal).
create table if not exists public.personal_confidencial (
  personal_id integer primary key references public.personal (id) on delete cascade,
  cuenta_corriente text,
  ss text,
  irpf numeric(7, 4),
  com_antiguedad_04 numeric(12, 2),
  com_absorbible_18 numeric(12, 2),
  porcent_complemento_18 numeric(12, 2),
  num_pagas_extra integer,
  prorrateo_pagas boolean,
  direccion text,
  codigo_postal integer,
  fecha_nacimiento date,
  contacto_urgencia text,
  telefono_urgencia text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.personal_confidencial is
  'Datos confidenciales de personal (bancarios, salariales y personales). Acceso restringido al rol admin via RLS.';

-- 2. Backfill desde `personal` y eliminacion de las columnas movidas.
--    Solo se ejecuta si las columnas todavia existen en `personal`.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'personal'
      and column_name = 'cuenta_corriente'
  ) then
    insert into public.personal_confidencial (
      personal_id,
      cuenta_corriente,
      ss,
      irpf,
      com_antiguedad_04,
      com_absorbible_18,
      porcent_complemento_18,
      num_pagas_extra,
      prorrateo_pagas,
      direccion,
      codigo_postal,
      fecha_nacimiento,
      contacto_urgencia,
      telefono_urgencia
    )
    select
      id,
      cuenta_corriente,
      ss,
      irpf,
      com_antiguedad_04,
      com_absorbible_18,
      porcent_complemento_18,
      num_pagas_extra,
      prorrateo_pagas,
      direccion,
      codigo_postal,
      fecha_nacimiento,
      contacto_urgencia,
      telefono_urgencia
    from public.personal
    on conflict (personal_id) do nothing;

    -- Las vistas dependientes (actividades_detalle, historiales_laborales_detalle)
    -- deben recrearse antes de eliminar las columnas, o el DROP fallara.
    drop view if exists public.actividades_detalle;
    drop view if exists public.historiales_laborales_detalle;

    alter table public.personal
      drop column if exists cuenta_corriente,
      drop column if exists ss,
      drop column if exists irpf,
      drop column if exists com_antiguedad_04,
      drop column if exists com_absorbible_18,
      drop column if exists porcent_complemento_18,
      drop column if exists num_pagas_extra,
      drop column if exists prorrateo_pagas,
      drop column if exists direccion,
      drop column if exists codigo_postal,
      drop column if exists fecha_nacimiento,
      drop column if exists contacto_urgencia,
      drop column if exists telefono_urgencia;
  end if;
end $$;

-- 3. Trigger updated_at.
create or replace function public.set_personal_confidencial_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_personal_confidencial_updated_at on public.personal_confidencial;
create trigger set_personal_confidencial_updated_at
before update on public.personal_confidencial
for each row
execute function public.set_personal_confidencial_updated_at();

-- 4. RLS: solo el rol admin puede leer o escribir datos confidenciales.
alter table public.personal_confidencial enable row level security;

grant select, insert, update, delete on public.personal_confidencial to authenticated;

drop policy if exists "personal_confidencial_admin_can_read" on public.personal_confidencial;
create policy "personal_confidencial_admin_can_read"
on public.personal_confidencial
for select
to authenticated
using (public.is_coordinacion_admin());

drop policy if exists "personal_confidencial_admin_can_insert" on public.personal_confidencial;
create policy "personal_confidencial_admin_can_insert"
on public.personal_confidencial
for insert
to authenticated
with check (public.is_coordinacion_admin());

drop policy if exists "personal_confidencial_admin_can_update" on public.personal_confidencial;
create policy "personal_confidencial_admin_can_update"
on public.personal_confidencial
for update
to authenticated
using (public.is_coordinacion_admin())
with check (public.is_coordinacion_admin());

drop policy if exists "personal_confidencial_admin_can_delete" on public.personal_confidencial;
create policy "personal_confidencial_admin_can_delete"
on public.personal_confidencial
for delete
to authenticated
using (public.is_coordinacion_admin());

-- 5. Recrear las vistas dependientes obteniendo ss / fecha_nacimiento desde
--    personal_confidencial con gate explicito por admin (NULL para no-admin).
create or replace view public.actividades_detalle as
select
  a.id,
  a.personal_id,
  p.personal,
  p.dni,
  case when public.is_coordinacion_admin() then pc.fecha_nacimiento end as fecha_nacimiento,
  case when public.is_coordinacion_admin() then pc.ss end as ss,
  a.contrato_id,
  c.contrato,
  a.servicio_id,
  se.servicio,
  a.empresa_id,
  e.empresa,
  a.instalacion_id,
  i.instalacion,
  a.puesto_id,
  pu.puesto,
  a.funcion_id,
  f.funcion,
  a.modalidad_id,
  m.modalidad,
  a.situacion_id,
  s.situacion,
  a.tipo_hora_id,
  th.tipo_hora,
  a.dias_semana,
  a.fecha_inicio,
  a.fecha_fin,
  a.hora_inicio,
  a.hora_fin,
  a.llamamiento_enviado,
  a.respuesta_llamamiento,
  a.observaciones,
  public.is_contrato_assignment_current(
    cp.activo,
    cp.fecha_inicio,
    cp.fecha_fin,
    cp.removed_at
  ) as personal_asignado_actualmente,
  public.get_contrato_assignment_state(
    cp.activo,
    cp.fecha_inicio,
    cp.fecha_fin,
    cp.removed_at
  ) as personal_asignacion_estado,
  public.is_contrato_assignment_current(
    ci.activo,
    ci.fecha_inicio,
    ci.fecha_fin,
    ci.removed_at
  ) as instalacion_asignada_actualmente,
  public.get_contrato_assignment_state(
    ci.activo,
    ci.fecha_inicio,
    ci.fecha_fin,
    ci.removed_at
  ) as instalacion_asignacion_estado,
  a.created_at,
  a.updated_at
from public.actividades a
join public.personal p
  on p.id = a.personal_id
left join public.personal_confidencial pc
  on pc.personal_id = p.id
join public.contratos c
  on c.id = a.contrato_id
left join public.servicios se
  on se.id = a.servicio_id
join public.empresas e
  on e.id = a.empresa_id
join public.instalaciones i
  on i.id = a.instalacion_id
join public.puestos pu
  on pu.id = a.puesto_id
left join public.funciones f
  on f.id = a.funcion_id
left join public.modalidades m
  on m.id = a.modalidad_id
join public.situaciones s
  on s.id = a.situacion_id
join public.tipo_horas th
  on th.id = a.tipo_hora_id
left join public.contrato_personal cp
  on cp.contrato_id = a.contrato_id
 and cp.personal_id = a.personal_id
left join public.contrato_instalaciones ci
  on ci.contrato_id = a.contrato_id
 and ci.instalacion_id = a.instalacion_id;

alter view public.actividades_detalle set (security_invoker = true);

grant select on public.actividades_detalle to authenticated;

create or replace view public.historiales_laborales_detalle as
select
  h.id,
  h.activo,
  h.personal_id,
  p.personal,
  p.dni,
  case when public.is_coordinacion_admin() then pc.ss end as ss,
  h.empresa_id,
  e.empresa,
  h.jornada,
  h.jornada_maxima,
  h.contrato_laboral_id,
  cl.clave as contrato_laboral_clave,
  cl.duracion as contrato_laboral_duracion,
  cl.jornada as contrato_laboral_jornada,
  cl.descripcion as contrato_laboral_descripcion,
  h.modalidad_pago_id,
  mp.modalidad_pago,
  h.fecha_alta,
  h.fecha_baja,
  h.dias_periodo,
  h.puesto_id,
  pu.puesto,
  h.coeficiente_temporalidad_miles,
  h.tipo_contratacion_id,
  tc.tipo_contratacion,
  h.motivo_baja_id,
  mb.motivo_baja,
  h.horarios,
  h.observaciones,
  h.salario_jornada_completa,
  h.importe_horas_complementarias,
  h.tiene_complemento_movilidad,
  h.tiene_complemento_dedicacion,
  h.tiene_plus_transporte,
  h.tiene_nocturnidad,
  h.tiene_antiguedad,
  h.tiene_complemento,
  h.complemento,
  h.notas,
  h.grupo_cotizacion,
  h.movimiento,
  h.puesto_texto,
  h.cotizacion_comunes_pct,
  h.cotizacion_mei_pct,
  h.cotizacion_formacion_pct,
  h.cotizacion_desempleo_pct,
  h.lenguaje_inclusivo,
  h.created_at,
  h.updated_at
from public.historiales_laborales h
left join public.personal p
  on p.id = h.personal_id
left join public.personal_confidencial pc
  on pc.personal_id = p.id
left join public.empresas e
  on e.id = h.empresa_id
left join public.historiales_laborales_contratos cl
  on cl.id = h.contrato_laboral_id
left join public.historiales_laborales_modalidades_pago mp
  on mp.id = h.modalidad_pago_id
left join public.puestos pu
  on pu.id = h.puesto_id
left join public.historiales_laborales_tipos_contratacion tc
  on tc.id = h.tipo_contratacion_id
left join public.historiales_laborales_motivos_baja mb
  on mb.id = h.motivo_baja_id;

alter view public.historiales_laborales_detalle set (security_invoker = true);

grant select on public.historiales_laborales_detalle to authenticated;

-- 6. Vista combinada para la ficha de Personal: campos basicos + confidenciales
--    gateados por admin. La app la usa en lugar de `personal` para la edicion.
create or replace view public.personal_completo as
select
  p.*,
  case when public.is_coordinacion_admin() then pc.cuenta_corriente end as cuenta_corriente,
  case when public.is_coordinacion_admin() then pc.ss end as ss,
  case when public.is_coordinacion_admin() then pc.irpf end as irpf,
  case when public.is_coordinacion_admin() then pc.com_antiguedad_04 end as com_antiguedad_04,
  case when public.is_coordinacion_admin() then pc.com_absorbible_18 end as com_absorbible_18,
  case when public.is_coordinacion_admin() then pc.porcent_complemento_18 end as porcent_complemento_18,
  case when public.is_coordinacion_admin() then pc.num_pagas_extra end as num_pagas_extra,
  case when public.is_coordinacion_admin() then pc.prorrateo_pagas end as prorrateo_pagas,
  case when public.is_coordinacion_admin() then pc.direccion end as direccion,
  case when public.is_coordinacion_admin() then pc.codigo_postal end as codigo_postal,
  case when public.is_coordinacion_admin() then pc.fecha_nacimiento end as fecha_nacimiento,
  case when public.is_coordinacion_admin() then pc.contacto_urgencia end as contacto_urgencia,
  case when public.is_coordinacion_admin() then pc.telefono_urgencia end as telefono_urgencia
from public.personal p
left join public.personal_confidencial pc
  on pc.personal_id = p.id;

alter view public.personal_completo set (security_invoker = true);

grant select on public.personal_completo to authenticated;
