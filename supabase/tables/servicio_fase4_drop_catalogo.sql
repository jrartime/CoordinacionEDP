-- Fase 4 de la retirada de "servicio" (ver memoria campo-servicio-eliminacion):
-- borra el catálogo servicios y las columnas servicio_id de registros,
-- actividades y registros_facturacion_destino, tras congelar el nombre como
-- texto histórico (servicio_legacy) por si hace falta auditarlo algún día.
-- No se muestra en ningún sitio de la UI (decisión expresa del usuario).
--
-- Aplicada en producción (proyecto epbtoarkinvgcaewbtvs) el 2026-09-23 via
-- mcp__supabase__apply_migration con el nombre "servicio_fase4_drop_catalogo".
-- Este fichero es la copia de referencia; no se re-ejecuta desde la app.
--
-- Orden importante por dependencias (ver comentarios inline):
--   1) snapshot de texto antes de borrar nada
--   2) recrear vistas sin columnas de servicio
--   3) reescribir policies/funciones de RLS de actividades (firma sin servicio_id)
--   4) quitar triggers de validación servicio<->contrato (antes de borrar columnas,
--      si no el primer insert/update revienta)
--   5) reescribir get_records_facets / get_master_catalog_usage
--   6) borrar columnas servicio_id (quita 3 de las 5 FK hacia servicios.id)
--   7) borrar contratos_funciones_servicios (4a FK)
--   8) quitar policies de servicios que llaman a can_access/manage_coordinacion_servicio,
--      luego esas 3 funciones (son LANGUAGE sql: tienen dependencia dura sobre
--      contrato_servicios via pg_depend, hay que borrarlas antes de esa tabla)
--   9) borrar contrato_servicios (5a y última FK)
--  10) borrar servicios

-- 1) Congelar el nombre de servicio como texto antes de borrar la relación
alter table public.registros add column servicio_legacy text;
alter table public.actividades add column servicio_legacy text;
alter table public.registros_facturacion_destino add column servicio_legacy text;

update public.registros r set servicio_legacy = s.servicio
from public.servicios s where s.id = r.servicio_id;

update public.actividades a set servicio_legacy = s.servicio
from public.servicios s where s.id = a.servicio_id;

update public.registros_facturacion_destino d set servicio_legacy = s.servicio
from public.servicios s where s.id = d.servicio_id;

-- 2) Recrear vistas sin las columnas/joins de servicio
drop view public.registros_detalle;

create view public.registros_detalle
with (security_invoker = true) as
 select r.id,
    r.fecha,
    r.actividad_id,
    r.empresa_id,
    e.empresa,
    r.contrato_id,
    c.contrato,
    r.personal_id,
    p.personal,
    p.dni,
    tlink.personal_id as titular_personal_id,
    tp.personal as titular_personal,
    subs.sustituto_personal_id,
    subs.sustituto_personal,
    r.sustituye_registro_id,
    r.instalacion_id,
    i.instalacion,
    i.siglas as instalacion_siglas,
    r.categoria_id,
    r.puesto_id,
    pu.puesto,
    r.funcion_id,
    f.funcion,
    r.modalidad_id,
    m.modalidad,
    r.nivel_id,
    r.grupo_id,
    r.nota,
    r.dia_id,
    r.hora_inicio,
    r.hora_fin,
    r.horas,
    r.horas_nocturnas,
    r.descanso,
    r.activo,
    r.sustitucion,
    r.facturar,
    r.abonar,
    r.tipo_hora_id,
    th.tipo_hora,
    r.situacion_id,
    s.situacion,
    r.anio,
    r.observacion,
    r.control,
    ap.apunte_abonado,
    ap.apunte_facturado,
    ap.apunte_neto,
    ap.bolsa_entrada,
    ap.bolsa_salida,
    case
        when fl.contrato_facturacion_id is not null then 'Facturado'::text
        when fl.preparacion_id is not null then 'En preparación'::text
        when r.facturar and registro_tiene_redireccion_facturacion(r.id) then 'Redirigido'::text
        when r.facturar then 'Pendiente'::text
        else 'Excluido'::text
    end as estado_facturacion,
    fl.contrato_facturacion_id as facturacion_factura_id,
    fl.preparacion_id as facturacion_preparacion_id,
    cf.serie as facturacion_factura_serie,
    cf.n_documento as facturacion_factura_documento,
    coalesce(rfd.contrato_id, r.contrato_id) as contrato_facturable_id,
    coalesce(rfd.funcion_id, r.funcion_id) as funcion_facturable_id,
    coalesce(rfd.instalacion_id, r.instalacion_id) as instalacion_facturable_id,
    rfd.contrato_id as facturacion_destino_contrato_id,
    cd.contrato as facturacion_destino_contrato,
    rfd.funcion_id as facturacion_destino_funcion_id,
    fd.funcion as facturacion_destino_funcion,
    rfd.instalacion_id as facturacion_destino_instalacion_id,
    ind.instalacion as facturacion_destino_instalacion
   from registros r
     left join actividades a on a.id = r.actividad_id
     left join empresas e on e.id = r.empresa_id
     left join contratos c on c.id = r.contrato_id
     left join personal p on p.id = r.personal_id
     left join registros tlink on tlink.id = r.sustituye_registro_id
     left join personal tp on tp.id = tlink.personal_id
     left join lateral ( select min(sr.personal_id) as sustituto_personal_id,
            string_agg(distinct sp.personal, ', '::text) as sustituto_personal
           from registros sr
             left join personal sp on sp.id = sr.personal_id
          where sr.sustituye_registro_id = r.id) subs on true
     left join lateral ( select coalesce(sum(case when apx.abonar then apx.cantidad * coalesce(thc.multiplicador, 1::real) else null::real end), 0::real) as apunte_abonado,
            coalesce(sum(case when apx.facturar then apx.cantidad * coalesce(thc.multiplicador, 1::real) else null::real end), 0::real) as apunte_facturado,
            coalesce(sum(apx.cantidad * coalesce(thc.multiplicador, 1::real)), 0::real) as apunte_neto,
            coalesce(sum(case when apx.movimiento = 'BOLSA_ENTRA'::text then apx.cantidad else null::real end), 0::real) as bolsa_entrada,
            coalesce(sum(case when apx.movimiento = 'BOLSA_SALE'::text then abs(apx.cantidad) else null::real end), 0::real) as bolsa_salida
           from registro_apuntes apx
             left join tipo_horas thc on thc.id = apx.concepto_id
          where apx.registro_id = r.id) ap on true
     left join lateral ( select l.contrato_facturacion_id,
            l.preparacion_id
           from contratos_facturacion_lineas l
             left join contratos_facturacion_preparaciones fp on fp.id = l.preparacion_id
          where l.registro_id = r.id and (l.contrato_facturacion_id is not null or fp.estado = 'vigente'::text)
         limit 1) fl on true
     left join contratos_facturacion cf on cf.id = fl.contrato_facturacion_id
     left join registros_facturacion_destino rfd on rfd.registro_id = r.id
     left join contratos cd on cd.id = rfd.contrato_id
     left join funciones fd on fd.id = rfd.funcion_id
     left join instalaciones ind on ind.id = rfd.instalacion_id
     left join instalaciones i on i.id = r.instalacion_id
     left join puestos pu on pu.id = r.puesto_id
     left join funciones f on f.id = r.funcion_id
     left join modalidades m on m.id = r.modalidad_id
     left join tipo_horas th on th.id = r.tipo_hora_id
     left join situaciones s on s.id = r.situacion_id;

grant select, insert, update, delete, truncate, references, trigger on public.registros_detalle to anon, authenticated, service_role, postgres;

drop view public.actividades_detalle;

create view public.actividades_detalle
with (security_invoker = true) as
 select a.id,
    a.personal_id,
    p.personal,
    p.dni,
    case when is_coordinacion_admin() then pc.fecha_nacimiento else null::date end as fecha_nacimiento,
    case when is_coordinacion_admin() then pc.ss else null::text end as ss,
    a.contrato_id,
    c.contrato,
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
    a.activo,
    a.dias_semana,
    a.horarios_personalizados,
    a.fecha_inicio,
    a.fecha_fin,
    a.hora_inicio,
    a.hora_fin,
    a.llamamiento_enviado,
    a.respuesta_llamamiento,
    a.observaciones,
    is_contrato_assignment_current(cp.activo, cp.fecha_inicio, cp.fecha_fin, cp.removed_at) as personal_asignado_actualmente,
    get_contrato_assignment_state(cp.activo, cp.fecha_inicio, cp.fecha_fin, cp.removed_at) as personal_asignacion_estado,
    is_contrato_assignment_current(ci.activo, ci.fecha_inicio, ci.fecha_fin, ci.removed_at) as instalacion_asignada_actualmente,
    get_contrato_assignment_state(ci.activo, ci.fecha_inicio, ci.fecha_fin, ci.removed_at) as instalacion_asignacion_estado,
    a.created_at,
    a.updated_at
   from actividades a
     join personal p on p.id = a.personal_id
     left join personal_confidencial pc on pc.personal_id = p.id
     join contratos c on c.id = a.contrato_id
     join empresas e on e.id = a.empresa_id
     join instalaciones i on i.id = a.instalacion_id
     join puestos pu on pu.id = a.puesto_id
     left join funciones f on f.id = a.funcion_id
     left join modalidades m on m.id = a.modalidad_id
     join situaciones s on s.id = a.situacion_id
     join tipo_horas th on th.id = a.tipo_hora_id
     left join contrato_personal cp on cp.contrato_id = a.contrato_id and cp.personal_id = a.personal_id
     left join contrato_instalaciones ci on ci.contrato_id = a.contrato_id and ci.instalacion_id = a.instalacion_id;

grant select, insert, update, delete, truncate, references, trigger on public.actividades_detalle to anon, authenticated, service_role, postgres;

-- 3) Quitar las 4 policies de actividades que llaman a las funciones con servicio_id
drop policy authenticated_can_delete_actividades on public.actividades;
drop policy authenticated_can_insert_actividades on public.actividades;
drop policy authenticated_can_read_actividades on public.actividades;
drop policy authenticated_can_update_actividades on public.actividades;

-- 4) Quitar las funciones con firma vieja (contrato_id, servicio_id, user_id)
drop function public.can_access_coordinacion_actividad(integer, bigint, uuid);
drop function public.can_manage_coordinacion_actividad(integer, bigint, uuid);
drop function public.can_read_coordinacion_actividad(integer, bigint, uuid);

-- 5) Recrear con firma nueva (contrato_id, user_id), sin rama de servicio
create function public.can_read_coordinacion_actividad(p_contrato_id integer, p_user_id uuid default auth.uid())
 returns boolean
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select coalesce(public.is_coordinacion_admin(p_user_id), false)
    or public.can_access_coordinacion_contrato(p_contrato_id, p_user_id);
$function$;

create function public.can_manage_coordinacion_actividad(p_contrato_id integer, p_user_id uuid default auth.uid())
 returns boolean
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select coalesce(public.is_coordinacion_admin(p_user_id), false)
    or public.can_manage_coordinacion_contrato(p_contrato_id, p_user_id);
$function$;

create function public.can_access_coordinacion_actividad(p_contrato_id integer, p_user_id uuid default auth.uid())
 returns boolean
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select public.can_read_coordinacion_actividad(p_contrato_id, p_user_id);
$function$;

-- 6) Recrear las 4 policies de actividades con la firma nueva
create policy authenticated_can_delete_actividades on public.actividades
  for delete using (can_manage_coordinacion_actividad(contrato_id));

create policy authenticated_can_insert_actividades on public.actividades
  for insert with check (can_manage_coordinacion_actividad(contrato_id));

create policy authenticated_can_read_actividades on public.actividades
  for select using (can_access_coordinacion_actividad(contrato_id));

create policy authenticated_can_update_actividades on public.actividades
  for update using (can_manage_coordinacion_actividad(contrato_id))
  with check (can_manage_coordinacion_actividad(contrato_id));

-- 7) Quitar los triggers de validación servicio<->contrato en registros/actividades
--    (antes de borrar la columna, para que no revienten en el siguiente insert/update)
drop trigger validate_registros_servicio_contrato on public.registros;
drop trigger validate_actividades_servicio_contrato on public.actividades;

-- 8) Limpiar las funciones de esos triggers
drop function public.validate_registros_servicio_contrato();
drop function public.validate_actividades_servicio_contrato();

-- 9) Recrear get_records_facets sin servicio_id (cambia el RETURNS TABLE, hace falta drop+create)
drop function public.get_records_facets(date, date, bigint);

create function public.get_records_facets(p_fecha_desde date default null::date, p_fecha_hasta date default null::date, p_actividad_id bigint default null::bigint)
 returns table(contrato_id integer, personal_id integer, instalacion_id integer)
 language sql
 stable
 set search_path to 'public'
as $function$
  select distinct
    r.contrato_id,
    r.personal_id,
    r.instalacion_id
  from public.registros r
  join public.contratos c
    on c.id = r.contrato_id
   and c.activo = true
  where (p_fecha_desde is null or r.fecha >= p_fecha_desde)
    and (p_fecha_hasta is null or r.fecha <= p_fecha_hasta)
    and (p_actividad_id is null or r.actividad_id = p_actividad_id)
    and r.contrato_id is not null;
$function$;

-- 10) get_master_catalog_usage: quitar la rama 'servicios' (misma firma, in-place)
create or replace function public.get_master_catalog_usage(p_catalog text, p_record_id integer)
 returns table(source_table text, source_label text, usage_count bigint)
 language plpgsql
 stable security definer
 set search_path to 'public'
as $function$
begin
  perform public.assert_coordinacion_user();
  if p_catalog not in ('puestos', 'funciones', 'modalidades', 'instalaciones', 'empresas') then
    raise exception 'Catálogo no soportado: %', p_catalog;
  end if;

  if p_catalog = 'puestos' then
    if to_regclass('public.actividades') is not null then
      return query
      select 'actividades'::text, 'Actividades'::text, count(*)::bigint
      from public.actividades
      where puesto_id = p_record_id;
    end if;

    if to_regclass('public.registros') is not null then
      return query
      select 'registros'::text, 'Registros'::text, count(*)::bigint
      from public.registros
      where puesto_id = p_record_id;
    end if;

    if to_regclass('public.historiales_laborales') is not null then
      return query
      select 'historiales_laborales'::text, 'Historiales laborales'::text, count(*)::bigint
      from public.historiales_laborales
      where puesto_id = p_record_id;
    end if;
  end if;

  if p_catalog = 'funciones' then
    if to_regclass('public.actividades') is not null then
      return query
      select 'actividades'::text, 'Actividades'::text, count(*)::bigint
      from public.actividades
      where funcion_id = p_record_id;
    end if;

    if to_regclass('public.registros') is not null then
      return query
      select 'registros'::text, 'Registros'::text, count(*)::bigint
      from public.registros
      where funcion_id = p_record_id;
    end if;
  end if;

  if p_catalog = 'modalidades' then
    if to_regclass('public.actividades') is not null then
      return query
      select 'actividades'::text, 'Actividades'::text, count(*)::bigint
      from public.actividades
      where modalidad_id = p_record_id;
    end if;

    if to_regclass('public.registros') is not null then
      return query
      select 'registros'::text, 'Registros'::text, count(*)::bigint
      from public.registros
      where modalidad_id = p_record_id;
    end if;
  end if;

  if p_catalog = 'instalaciones' then
    if to_regclass('public.actividades') is not null then
      return query
      select 'actividades'::text, 'Actividades'::text, count(*)::bigint
      from public.actividades
      where instalacion_id = p_record_id;
    end if;

    if to_regclass('public.registros') is not null then
      return query
      select 'registros'::text, 'Registros'::text, count(*)::bigint
      from public.registros
      where instalacion_id = p_record_id;
    end if;
  end if;

  if p_catalog = 'empresas' then
    if to_regclass('public.actividades') is not null then
      return query
      select 'actividades'::text, 'Actividades'::text, count(*)::bigint
      from public.actividades
      where empresa_id = p_record_id;
    end if;

    if to_regclass('public.registros') is not null then
      return query
      select 'registros'::text, 'Registros'::text, count(*)::bigint
      from public.registros
      where empresa_id = p_record_id;
    end if;

    if to_regclass('public.historiales_laborales') is not null then
      return query
      select 'historiales_laborales'::text, 'Historiales laborales'::text, count(*)::bigint
      from public.historiales_laborales
      where empresa_id = p_record_id;
    end if;
  end if;
end;
$function$;

-- 11) Quitar la función que expone el catálogo servicios para asignar (referencia directa a la tabla, debe ir antes del drop table)
drop function public.get_servicios_para_asignar();

-- 12) Borrar las columnas servicio_id (esto quita 3 de las 5 FK hacia servicios.id)
alter table public.actividades drop column servicio_id;
alter table public.registros drop column servicio_id;
alter table public.registros_facturacion_destino drop column servicio_id;

-- 13) Borrar contratos_funciones_servicios (quita la 4a FK hacia servicios.id, su policy y su trigger)
drop table public.contratos_funciones_servicios;
drop function public.validate_contratos_funciones_servicios_contrato();

-- 14) Quitar las policies de servicios que llaman a can_access/manage_coordinacion_servicio,
--     para poder borrar esas funciones sin esperar a borrar toda la tabla todavia
drop policy authenticated_can_update_servicios on public.servicios;
drop policy authenticated_can_read_servicios on public.servicios;
drop policy coordinacion_servicios_assigned_only on public.servicios;

drop function public.can_access_coordinacion_servicio(bigint, uuid);
drop function public.can_read_coordinacion_servicio(bigint, uuid);
drop function public.can_manage_coordinacion_servicio(bigint, uuid);

-- 15) Borrar contrato_servicios (quita la 5a y ultima FK hacia servicios.id)
drop table public.contrato_servicios;

-- 16) Borrar la tabla servicios (ya sin ningun FK ni funcion SQL apuntando a ella)
drop table public.servicios;
drop function public.set_servicios_updated_at();
