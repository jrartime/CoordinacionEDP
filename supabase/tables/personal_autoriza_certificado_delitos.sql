-- Autorización de la persona para descargar su certificado de delitos de naturaleza sexual.
-- Tres estados: 'si', 'no' y pendiente (null, que es lo que tienen todos al empezar).
-- Se edita en la ficha de Personal, en «Documentación y equipamiento».
--
-- Hay que aplicarlo ANTES de publicar el app.js que pide la columna a personal_completo: sin
-- ella, la pestaña Personal no carga. Idempotente.

begin;

alter table coordinacion.personal
  add column if not exists autoriza_certificado_delitos text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'personal_autoriza_certificado_delitos_check') then
    alter table coordinacion.personal
      add constraint personal_autoriza_certificado_delitos_check
      check (autoriza_certificado_delitos is null or autoriza_certificado_delitos in ('si', 'no'));
  end if;
end;
$$;

-- La vista suma la columna al final (create or replace no permite reordenar).
create or replace view coordinacion.personal_completo as
 SELECT p.id,
    p.vinculacion_id,
    p.personal,
    p.genero,
    p.antiguedad,
    p.dni,
    p.email,
    p.movil,
    p.telefono,
    p.localidad,
    p.municipio,
    p.provincia,
    p.foto,
    p.contrato_id,
    p.observacion,
    p.desplazamiento,
    p.enviar,
    p.carpeta,
    p.pago,
    p.cv,
    p.da,
    p.ds,
    p.prev_riesgos,
    p.epi,
    p.titulos,
    p.ig_ac,
    p.uniforme,
    p.med_emerg,
    p.ens,
    p.tipo_contrato,
    p.grupo,
    p.nivel,
    p.grupo_cotizacion,
    p.persona,
    p.nombre,
    p.apellido,
    p.fichajes_usuario_guid,
        CASE WHEN coordinacion.is_coordinacion_admin() THEN pc.cuenta_corriente ELSE NULL::text END AS cuenta_corriente,
        CASE WHEN coordinacion.is_coordinacion_admin() THEN pc.ss ELSE NULL::text END AS ss,
        CASE WHEN coordinacion.is_coordinacion_admin() THEN pc.irpf ELSE NULL::numeric END AS irpf,
        CASE WHEN coordinacion.is_coordinacion_admin() THEN pc.num_pagas_extra ELSE NULL::integer END AS num_pagas_extra,
        CASE WHEN coordinacion.is_coordinacion_admin() THEN pc.prorrateo_pagas ELSE NULL::boolean END AS prorrateo_pagas,
        CASE WHEN coordinacion.is_coordinacion_admin() THEN pc.direccion ELSE NULL::text END AS direccion,
        CASE WHEN coordinacion.is_coordinacion_admin() THEN pc.codigo_postal ELSE NULL::integer END AS codigo_postal,
        CASE WHEN coordinacion.is_coordinacion_admin() THEN pc.fecha_nacimiento ELSE NULL::date END AS fecha_nacimiento,
        CASE WHEN coordinacion.is_coordinacion_admin() THEN pc.contacto_urgencia ELSE NULL::text END AS contacto_urgencia,
        CASE WHEN coordinacion.is_coordinacion_admin() THEN pc.telefono_urgencia ELSE NULL::text END AS telefono_urgencia,
    p.autoriza_certificado_delitos
   FROM (coordinacion.personal p
     LEFT JOIN coordinacion.personal_confidencial pc ON ((pc.personal_id = p.id)));

-- save_coordinacion_personal: igual que antes, más la autorización. Si quien llama no manda la
-- clave (otro cliente, como el portal laboral), se conserva el valor que ya había.
create or replace function coordinacion.save_coordinacion_personal(p_personal jsonb)
returns table(saved_personal_id integer)
language plpgsql
security definer
set search_path to 'coordinacion', 'extensions'
as $function$
declare
  payload_id integer;
  is_admin boolean;
begin
  if not coordinacion.can_manage_coordinacion_personal(auth.uid()) then
    raise exception 'No tienes permisos para guardar personal.';
  end if;

  is_admin := coalesce(coordinacion.is_coordinacion_admin(auth.uid()), false);

  payload_id := nullif(p_personal->>'id', '')::integer;

  if payload_id is null then
    select coalesce(max(p.id), 0) + 1
      into payload_id
    from coordinacion.personal p;
  end if;

  if nullif(btrim(coalesce(p_personal->>'personal', '')), '') is null then
    raise exception 'El campo Personal es obligatorio.';
  end if;

  insert into coordinacion.personal (
    id, vinculacion_id, personal, genero, antiguedad, dni, email, movil, telefono,
    localidad, municipio, provincia, observacion, carpeta,
    cv, da, ds, prev_riesgos, epi, titulos, ig_ac, uniforme, med_emerg, ens,
    persona, nombre, apellido, autoriza_certificado_delitos
  )
  values (
    payload_id,
    nullif(p_personal->>'vinculacion_id', '')::integer,
    btrim(p_personal->>'personal'),
    nullif(btrim(coalesce(p_personal->>'genero', '')), ''),
    nullif(p_personal->>'antiguedad', '')::date,
    nullif(btrim(coalesce(p_personal->>'dni', '')), ''),
    nullif(btrim(coalesce(p_personal->>'email', '')), ''),
    nullif(btrim(coalesce(p_personal->>'movil', '')), ''),
    nullif(btrim(coalesce(p_personal->>'telefono', '')), ''),
    nullif(btrim(coalesce(p_personal->>'localidad', '')), ''),
    nullif(btrim(coalesce(p_personal->>'municipio', '')), ''),
    nullif(btrim(coalesce(p_personal->>'provincia', '')), ''),
    nullif(btrim(coalesce(p_personal->>'observacion', '')), ''),
    nullif(btrim(coalesce(p_personal->>'carpeta', '')), ''),
    coalesce((p_personal->>'cv')::boolean, false),
    coalesce((p_personal->>'da')::boolean, false),
    coalesce((p_personal->>'ds')::boolean, false),
    nullif(p_personal->>'prev_riesgos', '')::date,
    coalesce((p_personal->>'epi')::boolean, false),
    coalesce((p_personal->>'titulos')::boolean, false),
    coalesce((p_personal->>'ig_ac')::boolean, false),
    coalesce((p_personal->>'uniforme')::boolean, false),
    coalesce((p_personal->>'med_emerg')::boolean, false),
    coalesce((p_personal->>'ens')::boolean, false),
    coalesce((p_personal->>'persona')::boolean, false),
    nullif(btrim(coalesce(p_personal->>'nombre', '')), ''),
    nullif(btrim(coalesce(p_personal->>'apellido', '')), ''),
    nullif(btrim(coalesce(p_personal->>'autoriza_certificado_delitos', '')), '')
  )
  on conflict (id) do update set
    vinculacion_id = excluded.vinculacion_id,
    personal = excluded.personal,
    genero = excluded.genero,
    antiguedad = excluded.antiguedad,
    dni = excluded.dni,
    email = excluded.email,
    movil = excluded.movil,
    telefono = excluded.telefono,
    localidad = excluded.localidad,
    municipio = excluded.municipio,
    provincia = excluded.provincia,
    observacion = excluded.observacion,
    carpeta = excluded.carpeta,
    cv = excluded.cv,
    da = excluded.da,
    ds = excluded.ds,
    prev_riesgos = excluded.prev_riesgos,
    epi = excluded.epi,
    titulos = excluded.titulos,
    ig_ac = excluded.ig_ac,
    uniforme = excluded.uniforme,
    med_emerg = excluded.med_emerg,
    ens = excluded.ens,
    persona = excluded.persona,
    nombre = excluded.nombre,
    apellido = excluded.apellido,
    autoriza_certificado_delitos = case
      when p_personal ? 'autoriza_certificado_delitos' then excluded.autoriza_certificado_delitos
      else coordinacion.personal.autoriza_certificado_delitos
    end;

  -- Datos confidenciales: solo el rol admin puede crearlos o modificarlos.
  if is_admin then
    insert into coordinacion.personal_confidencial (
      personal_id, cuenta_corriente, ss, irpf, num_pagas_extra, prorrateo_pagas,
      direccion, codigo_postal, fecha_nacimiento
    )
    values (
      payload_id,
      nullif(btrim(coalesce(p_personal->>'cuenta_corriente', '')), ''),
      nullif(btrim(coalesce(p_personal->>'ss', '')), ''),
      nullif(p_personal->>'irpf', '')::numeric,
      nullif(p_personal->>'num_pagas_extra', '')::integer,
      coalesce((p_personal->>'prorrateo_pagas')::boolean, false),
      nullif(btrim(coalesce(p_personal->>'direccion', '')), ''),
      nullif(p_personal->>'codigo_postal', '')::integer,
      nullif(p_personal->>'fecha_nacimiento', '')::date
    )
    on conflict (personal_id) do update set
      cuenta_corriente = excluded.cuenta_corriente,
      ss = excluded.ss,
      irpf = excluded.irpf,
      num_pagas_extra = excluded.num_pagas_extra,
      prorrateo_pagas = excluded.prorrateo_pagas,
      direccion = excluded.direccion,
      codigo_postal = excluded.codigo_postal,
      fecha_nacimiento = excluded.fecha_nacimiento;
  end if;

  return query select payload_id as saved_personal_id;
end;
$function$;

commit;
