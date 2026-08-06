-- registros_detalle: se anaden los totales derivados de registro_apuntes
-- (ponderados por el multiplicador de la tarifa de cada apunte):
--   apunte_abonado   = suma de apuntes con abonar=true
--   apunte_facturado = suma de apuntes con facturar=true
--   apunte_neto      = suma de todos los apuntes (un PNR da 0: +h y -h)
-- Es additivo: el resto de la vista no cambia. Sustituye la definicion previa
-- de registros_detalle (ver registros.sql / registros_titular_sustituto_derivados.sql).
--
-- Fase 2 de facturacion: se anade tambien el estado de facturacion de cada
-- registro, resuelto contra contratos_facturacion_lineas/_preparaciones (ver
-- contratos_facturacion_preparaciones.sql). Es la version legible de "en que
-- factura entro este registro", pensada para columna de lista y filtro:
--   Facturado       -> la linea activa tiene contrato_facturacion_id
--   En preparación  -> la linea activa cuelga de una preparacion vigente sin
--                       factura todavia
--   Redirigido      -> facturar=true, sin linea activa, y existe una fila en
--                       registros_facturacion_destino (ver mas abajo)
--   Pendiente       -> facturar=true y no hay linea activa ni redireccion
--   Excluido        -> facturar=false (CAMB/LG u otro motivo) y no hay linea
-- El "limit 1" del lateral es defensivo: el trigger de contratos_facturacion_lineas
-- ya impide que haya mas de una linea activa por registro.
--
-- Redireccion de facturacion (registros_facturacion_destino.sql): un registro
-- puede facturarse bajo otro contrato/servicio/funcion/instalacion sin
-- cambiar donde se trabajo realmente. Los cuatro *_facturable_id son el
-- destino si existe, si no el propio del registro -son las columnas que usa
-- "Preparacion de facturas" y el panel Control para agrupar, en vez de
-- contrato_id/servicio_id/funcion_id/instalacion_id a secas-. Solo lo rellena
-- un administrador (RLS de registros_facturacion_destino), asi que para el
-- resto de perfiles estas columnas son siempre iguales a las propias. El
-- estado 'Redirigido' es la unica pista que le llega a un no-admin de que
-- existe la redireccion: sale de registro_tiene_redireccion_facturacion(),
-- que expone solo el booleano (nunca el contrato/servicio/funcion/instalacion
-- de destino) para que el coordinador entienda por que esas horas no
-- aparecen en su Preparacion de facturas sin filtrarle a donde se han ido.
drop view if exists public.registros_detalle;
create or replace view public.registros_detalle as
select
  r.id, r.fecha, r.actividad_id, r.servicio_id, se.servicio, r.empresa_id, e.empresa,
  r.contrato_id, c.contrato, r.personal_id, p.personal, p.dni,
  tlink.personal_id as titular_personal_id, tp.personal as titular_personal,
  subs.sustituto_personal_id, subs.sustituto_personal, r.sustituye_registro_id,
  r.instalacion_id, i.instalacion, i.siglas as instalacion_siglas,
  r.categoria_id, r.puesto_id, pu.puesto, r.funcion_id, f.funcion,
  r.modalidad_id, m.modalidad, r.nivel_id, r.grupo_id, r.nota, r.dia_id,
  r.hora_inicio, r.hora_fin, r.horas, r.hc, r.hf, r.hm, r.hd, r.bolsa_horas,
  r.horas_diurnas, r.horas_nocturnas, r.clases, r.horas_2,
  r.descanso, r.activo, r.festivo, r.sustitucion, r.facturar, r.abonar,
  r.tipo_hora_id, th.tipo_hora, r.situacion_id, s.situacion,
  r.anio, r.observacion, r.control,
  ap.apunte_abonado, ap.apunte_facturado, ap.apunte_neto,
  case
    when fl.contrato_facturacion_id is not null then 'Facturado'
    when fl.preparacion_id is not null then 'En preparación'
    when r.facturar and public.registro_tiene_redireccion_facturacion(r.id) then 'Redirigido'
    when r.facturar then 'Pendiente'
    else 'Excluido'
  end as estado_facturacion,
  fl.contrato_facturacion_id as facturacion_factura_id,
  fl.preparacion_id as facturacion_preparacion_id,
  cf.serie as facturacion_factura_serie,
  cf.n_documento as facturacion_factura_documento,
  coalesce(rfd.contrato_id, r.contrato_id) as contrato_facturable_id,
  coalesce(rfd.servicio_id, r.servicio_id) as servicio_facturable_id,
  coalesce(rfd.funcion_id, r.funcion_id) as funcion_facturable_id,
  coalesce(rfd.instalacion_id, r.instalacion_id) as instalacion_facturable_id,
  rfd.contrato_id as facturacion_destino_contrato_id,
  cd.contrato as facturacion_destino_contrato,
  rfd.servicio_id as facturacion_destino_servicio_id,
  svd.servicio as facturacion_destino_servicio,
  rfd.funcion_id as facturacion_destino_funcion_id,
  fd.funcion as facturacion_destino_funcion,
  rfd.instalacion_id as facturacion_destino_instalacion_id,
  ind.instalacion as facturacion_destino_instalacion
from public.registros r
left join public.actividades a on a.id = r.actividad_id
left join public.servicios se on se.id = r.servicio_id
left join public.empresas e on e.id = r.empresa_id
left join public.contratos c on c.id = r.contrato_id
left join public.personal p on p.id = r.personal_id
left join public.registros tlink on tlink.id = r.sustituye_registro_id
left join public.personal tp on tp.id = tlink.personal_id
left join lateral (
  select min(sr.personal_id) as sustituto_personal_id,
    string_agg(distinct sp.personal, ', ') as sustituto_personal
  from public.registros sr
  left join public.personal sp on sp.id = sr.personal_id
  where sr.sustituye_registro_id = r.id
) subs on true
left join lateral (
  select
    coalesce(sum(case when apx.abonar   then apx.cantidad * coalesce(thc.multiplicador,1) end),0) as apunte_abonado,
    coalesce(sum(case when apx.facturar then apx.cantidad * coalesce(thc.multiplicador,1) end),0) as apunte_facturado,
    coalesce(sum(apx.cantidad * coalesce(thc.multiplicador,1)),0) as apunte_neto
  from public.registro_apuntes apx
  left join public.tipo_horas thc on thc.id = apx.concepto_id
  where apx.registro_id = r.id
) ap on true
left join lateral (
  select l.contrato_facturacion_id, l.preparacion_id
  from public.contratos_facturacion_lineas l
  left join public.contratos_facturacion_preparaciones fp on fp.id = l.preparacion_id
  where l.registro_id = r.id
    and (l.contrato_facturacion_id is not null or fp.estado = 'vigente')
  limit 1
) fl on true
left join public.contratos_facturacion cf on cf.id = fl.contrato_facturacion_id
left join public.registros_facturacion_destino rfd on rfd.registro_id = r.id
left join public.contratos cd on cd.id = rfd.contrato_id
left join public.servicios svd on svd.id = rfd.servicio_id
left join public.funciones fd on fd.id = rfd.funcion_id
left join public.instalaciones ind on ind.id = rfd.instalacion_id
left join public.instalaciones i on i.id = r.instalacion_id
left join public.puestos pu on pu.id = r.puesto_id
left join public.funciones f on f.id = r.funcion_id
left join public.modalidades m on m.id = r.modalidad_id
left join public.tipo_horas th on th.id = r.tipo_hora_id
left join public.situaciones s on s.id = r.situacion_id;

alter view public.registros_detalle set (security_invoker = true);
grant select on public.registros_detalle to authenticated;
