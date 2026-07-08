-- registros_detalle: se anaden los totales derivados de registro_apuntes
-- (ponderados por el multiplicador de la tarifa de cada apunte):
--   apunte_abonado   = suma de apuntes con abonar=true
--   apunte_facturado = suma de apuntes con facturar=true
--   apunte_neto      = suma de todos los apuntes (un PNR da 0: +h y -h)
-- Es additivo: el resto de la vista no cambia. Sustituye la definicion previa
-- de registros_detalle (ver registros.sql / registros_titular_sustituto_derivados.sql).
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
  r.anio, r.observacion, r.control, r.factura,
  ap.apunte_abonado, ap.apunte_facturado, ap.apunte_neto
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
left join public.instalaciones i on i.id = r.instalacion_id
left join public.puestos pu on pu.id = r.puesto_id
left join public.funciones f on f.id = r.funcion_id
left join public.modalidades m on m.id = r.modalidad_id
left join public.tipo_horas th on th.id = r.tipo_hora_id
left join public.situaciones s on s.id = r.situacion_id;

alter view public.registros_detalle set (security_invoker = true);
grant select on public.registros_detalle to authenticated;
