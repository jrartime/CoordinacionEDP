create or replace function public.can_manage_coordinacion_personal(
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.is_coordinacion_admin(p_user_id), false)
    or (
      public.get_coordinacion_user_role(p_user_id) in ('coordinator', 'area_coordinator')
      and public.can_access_coordinacion_pestana('personal', p_user_id)
    );
$$;

revoke all on function public.can_manage_coordinacion_personal(uuid) from public;
grant execute on function public.can_manage_coordinacion_personal(uuid) to authenticated;

drop function if exists public.save_coordinacion_personal(jsonb);

create or replace function public.save_coordinacion_personal(
  p_personal jsonb
)
returns table (
  saved_personal_id integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  payload_id integer;
  is_admin boolean;
begin
  if not public.can_manage_coordinacion_personal(auth.uid()) then
    raise exception 'No tienes permisos para guardar personal.';
  end if;

  is_admin := coalesce(public.is_coordinacion_admin(auth.uid()), false);

  payload_id := nullif(p_personal->>'id', '')::integer;

  if payload_id is null then
    select coalesce(max(p.id), 0) + 1
      into payload_id
    from public.personal p;
  end if;

  if nullif(btrim(coalesce(p_personal->>'personal', '')), '') is null then
    raise exception 'El campo Personal es obligatorio.';
  end if;

  insert into public.personal (
    id,
    activo,
    pert_empresa,
    vinculacion_id,
    personal,
    genero,
    antiguedad,
    dni,
    email,
    movil,
    telefono,
    localidad,
    municipio,
    provincia,
    observacion,
    carpeta,
    cv,
    da,
    ds,
    prev_riesgos,
    epi,
    titulos,
    ig_ac,
    uniforme,
    med_emerg,
    ens,
    persona,
    nombre,
    apellido
  )
  values (
    payload_id,
    coalesce((p_personal->>'activo')::boolean, false),
    coalesce((p_personal->>'pert_empresa')::boolean, false),
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
    nullif(btrim(coalesce(p_personal->>'apellido', '')), '')
  )
  on conflict (id) do update set
    activo = excluded.activo,
    pert_empresa = excluded.pert_empresa,
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
    apellido = excluded.apellido;

  -- Datos confidenciales: solo el rol admin puede crearlos o modificarlos.
  if is_admin then
    insert into public.personal_confidencial (
      personal_id,
      cuenta_corriente,
      ss,
      irpf,
      num_pagas_extra,
      prorrateo_pagas,
      direccion,
      codigo_postal,
      fecha_nacimiento
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
$$;

revoke all on function public.save_coordinacion_personal(jsonb) from public;
grant execute on function public.save_coordinacion_personal(jsonb) to authenticated;

drop function if exists public.import_coordinacion_personal(jsonb);

create or replace function public.import_coordinacion_personal(
  p_rows jsonb
)
returns table (
  filas_origen integer,
  existentes_por_id integer,
  existentes_por_dni integer,
  filas_revisadas_para_rellenar integer,
  filas_insertadas integer,
  dni_ambiguos_no_insertados integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  source_count integer := 0;
  matched_by_id_count integer := 0;
  matched_by_dni_count integer := 0;
  updated_count integer := 0;
  inserted_count integer := 0;
  conflict_updated_count integer := 0;
  ambiguous_count integer := 0;
  is_admin boolean := false;
begin
  if not public.can_manage_coordinacion_personal(auth.uid()) then
    raise exception 'No tienes permisos para importar personal.';
  end if;

  is_admin := coalesce(public.is_coordinacion_admin(auth.uid()), false);

  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'El payload de importacion debe ser un array JSON.';
  end if;

  if jsonb_array_length(p_rows) = 0 then
    raise exception 'No se recibieron filas para importar.';
  end if;

  create temporary table import_personal_source (
    id integer,
    activo boolean,
    pert_empresa boolean,
    vinculacion_id integer,
    personal text,
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
    desplazamiento boolean,
    enviar boolean,
    carpeta text,
    pago boolean,
    cv boolean,
    da boolean,
    ds boolean,
    prev_riesgos date,
    epi boolean,
    titulos boolean,
    ig_ac boolean,
    uniforme boolean,
    med_emerg boolean,
    ens boolean,
    prorrateo_pagas boolean,
    num_pagas_extra integer,
    tipo_contrato integer,
    grupo integer,
    nivel integer,
    grupo_cotizacion text,
    contacto_urgencia text,
    telefono_urgencia text,
    persona boolean,
    irpf numeric,
    nombre text,
    apellido text
  ) on commit drop;

  insert into import_personal_source (
    id,
    activo,
    pert_empresa,
    vinculacion_id,
    personal,
    genero,
    antiguedad,
    dni,
    fecha_nacimiento,
    ss,
    email,
    movil,
    telefono,
    direccion,
    codigo_postal,
    localidad,
    municipio,
    provincia,
    cuenta_corriente,
    foto,
    contrato_id,
    observacion,
    desplazamiento,
    enviar,
    carpeta,
    pago,
    cv,
    da,
    ds,
    prev_riesgos,
    epi,
    titulos,
    ig_ac,
    uniforme,
    med_emerg,
    ens,
    prorrateo_pagas,
    num_pagas_extra,
    tipo_contrato,
    grupo,
    nivel,
    grupo_cotizacion,
    contacto_urgencia,
    telefono_urgencia,
    persona,
    irpf,
    nombre,
    apellido
  )
  select
    id,
    coalesce(activo, false),
    coalesce(pert_empresa, false),
    vinculacion_id,
    nullif(btrim(personal), ''),
    nullif(btrim(genero), ''),
    antiguedad,
    nullif(btrim(dni), ''),
    fecha_nacimiento,
    nullif(btrim(ss), ''),
    nullif(btrim(email), ''),
    nullif(btrim(movil), ''),
    nullif(btrim(telefono), ''),
    nullif(btrim(direccion), ''),
    codigo_postal,
    nullif(btrim(localidad), ''),
    nullif(btrim(municipio), ''),
    nullif(btrim(provincia), ''),
    nullif(btrim(cuenta_corriente), ''),
    nullif(btrim(foto), ''),
    nullif(btrim(contrato_id), ''),
    nullif(btrim(observacion), ''),
    coalesce(desplazamiento, false),
    coalesce(enviar, false),
    nullif(btrim(carpeta), ''),
    coalesce(pago, false),
    coalesce(cv, false),
    coalesce(da, false),
    coalesce(ds, false),
    prev_riesgos,
    coalesce(epi, false),
    coalesce(titulos, false),
    coalesce(ig_ac, false),
    coalesce(uniforme, false),
    coalesce(med_emerg, false),
    coalesce(ens, false),
    coalesce(prorrateo_pagas, false),
    num_pagas_extra,
    tipo_contrato,
    grupo,
    nivel,
    nullif(btrim(grupo_cotizacion), ''),
    nullif(btrim(contacto_urgencia), ''),
    nullif(btrim(telefono_urgencia), ''),
    coalesce(persona, false),
    irpf,
    nullif(btrim(nombre), ''),
    nullif(btrim(apellido), '')
  from jsonb_to_recordset(p_rows) as source (
    id integer,
    activo boolean,
    pert_empresa boolean,
    vinculacion_id integer,
    personal text,
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
    desplazamiento boolean,
    enviar boolean,
    carpeta text,
    pago boolean,
    cv boolean,
    da boolean,
    ds boolean,
    prev_riesgos date,
    epi boolean,
    titulos boolean,
    ig_ac boolean,
    uniforme boolean,
    med_emerg boolean,
    ens boolean,
    prorrateo_pagas boolean,
    num_pagas_extra integer,
    tipo_contrato integer,
    grupo integer,
    nivel integer,
    grupo_cotizacion text,
    contacto_urgencia text,
    telefono_urgencia text,
    persona boolean,
    irpf numeric,
    nombre text,
    apellido text
  );

  if exists (
    select 1
    from import_personal_source
    where id is null
       or personal is null
  ) then
    raise exception 'Todas las filas importadas deben tener ID y Personal.';
  end if;

  if exists (
    select 1
    from import_personal_source
    group by id
    having count(*) > 1
  ) then
    raise exception 'El payload de importacion contiene IDs repetidos.';
  end if;

  if exists (
    select 1
    from import_personal_source
    where dni is not null
    group by upper(btrim(dni))
    having count(*) > 1
  ) then
    raise exception 'El payload de importacion contiene DNIs repetidos.';
  end if;

  create temporary table import_personal_matches on commit drop as
  with existing_dni as (
    select upper(btrim(dni)) as dni_key, min(id) as id, count(*) as total
    from public.personal
    where nullif(btrim(dni), '') is not null
    group by upper(btrim(dni))
  )
  select
    s.*,
    coalesce(p_by_id.id, case when existing_dni.total = 1 then existing_dni.id end) as match_id,
    p_by_id.id is not null as matched_by_id,
    coalesce(p_by_id.id is null and existing_dni.total = 1, false) as matched_by_dni,
    coalesce(p_by_id.id is null and existing_dni.total > 1, false) as ambiguous_dni
  from import_personal_source s
  left join public.personal p_by_id
    on p_by_id.id = s.id
  left join existing_dni
    on existing_dni.dni_key = upper(btrim(s.dni));

  select count(*) into source_count from import_personal_source;
  select count(*) into matched_by_id_count from import_personal_matches where matched_by_id;
  select count(*) into matched_by_dni_count from import_personal_matches where matched_by_dni;
  select count(*) into ambiguous_count from import_personal_matches where ambiguous_dni;

  with updated as (
    update public.personal p
    set
      vinculacion_id = coalesce(p.vinculacion_id, s.vinculacion_id),
      personal = case when nullif(btrim(p.personal), '') is null then s.personal else p.personal end,
      genero = case when nullif(btrim(p.genero), '') is null then s.genero else p.genero end,
      antiguedad = coalesce(p.antiguedad, s.antiguedad),
      dni = case when nullif(btrim(p.dni), '') is null then s.dni else p.dni end,
      email = case when nullif(btrim(p.email), '') is null then s.email else p.email end,
      movil = case when nullif(btrim(p.movil), '') is null then s.movil else p.movil end,
      telefono = case when nullif(btrim(p.telefono), '') is null then s.telefono else p.telefono end,
      localidad = case when nullif(btrim(p.localidad), '') is null then s.localidad else p.localidad end,
      municipio = case when nullif(btrim(p.municipio), '') is null then s.municipio else p.municipio end,
      provincia = case when nullif(btrim(p.provincia), '') is null then s.provincia else p.provincia end,
      foto = case when nullif(btrim(p.foto), '') is null then s.foto else p.foto end,
      contrato_id = case when nullif(btrim(p.contrato_id), '') is null then s.contrato_id else p.contrato_id end,
      observacion = case when nullif(btrim(p.observacion), '') is null then s.observacion else p.observacion end,
      carpeta = case when nullif(btrim(p.carpeta), '') is null then s.carpeta else p.carpeta end,
      prev_riesgos = coalesce(p.prev_riesgos, s.prev_riesgos),
      tipo_contrato = coalesce(p.tipo_contrato, s.tipo_contrato),
      grupo = coalesce(p.grupo, s.grupo),
      nivel = coalesce(p.nivel, s.nivel),
      grupo_cotizacion = case when nullif(btrim(p.grupo_cotizacion), '') is null then s.grupo_cotizacion else p.grupo_cotizacion end,
      nombre = case when nullif(btrim(p.nombre), '') is null then s.nombre else p.nombre end,
      apellido = case when nullif(btrim(p.apellido), '') is null then s.apellido else p.apellido end
    from import_personal_matches s
    where p.id = s.match_id
    returning p.id
  )
  select count(*) into updated_count from updated;

  with upserted as (
    insert into public.personal (
      id,
      activo,
      pert_empresa,
      vinculacion_id,
      personal,
      genero,
      antiguedad,
      dni,
      email,
      movil,
      telefono,
      localidad,
      municipio,
      provincia,
      foto,
      contrato_id,
      observacion,
      desplazamiento,
      enviar,
      carpeta,
      pago,
      cv,
      da,
      ds,
      prev_riesgos,
      epi,
      titulos,
      ig_ac,
      uniforme,
      med_emerg,
      ens,
      tipo_contrato,
      grupo,
      nivel,
      grupo_cotizacion,
      persona,
      nombre,
      apellido
    )
    select
      s.id,
      coalesce(s.activo, false),
      coalesce(s.pert_empresa, false),
      s.vinculacion_id,
      s.personal,
      s.genero,
      s.antiguedad,
      s.dni,
      s.email,
      s.movil,
      s.telefono,
      s.localidad,
      s.municipio,
      s.provincia,
      s.foto,
      s.contrato_id,
      s.observacion,
      coalesce(s.desplazamiento, false),
      coalesce(s.enviar, false),
      s.carpeta,
      coalesce(s.pago, false),
      coalesce(s.cv, false),
      coalesce(s.da, false),
      coalesce(s.ds, false),
      s.prev_riesgos,
      coalesce(s.epi, false),
      coalesce(s.titulos, false),
      coalesce(s.ig_ac, false),
      coalesce(s.uniforme, false),
      coalesce(s.med_emerg, false),
      coalesce(s.ens, false),
      s.tipo_contrato,
      s.grupo,
      s.nivel,
      s.grupo_cotizacion,
      coalesce(s.persona, false),
      s.nombre,
      s.apellido
    from import_personal_matches s
    where s.match_id is null
      and not s.ambiguous_dni
    on conflict (id) do update set
      vinculacion_id = coalesce(personal.vinculacion_id, excluded.vinculacion_id),
      personal = case when nullif(btrim(personal.personal), '') is null then excluded.personal else personal.personal end,
      genero = case when nullif(btrim(personal.genero), '') is null then excluded.genero else personal.genero end,
      antiguedad = coalesce(personal.antiguedad, excluded.antiguedad),
      dni = case when nullif(btrim(personal.dni), '') is null then excluded.dni else personal.dni end,
      email = case when nullif(btrim(personal.email), '') is null then excluded.email else personal.email end,
      movil = case when nullif(btrim(personal.movil), '') is null then excluded.movil else personal.movil end,
      telefono = case when nullif(btrim(personal.telefono), '') is null then excluded.telefono else personal.telefono end,
      localidad = case when nullif(btrim(personal.localidad), '') is null then excluded.localidad else personal.localidad end,
      municipio = case when nullif(btrim(personal.municipio), '') is null then excluded.municipio else personal.municipio end,
      provincia = case when nullif(btrim(personal.provincia), '') is null then excluded.provincia else personal.provincia end,
      foto = case when nullif(btrim(personal.foto), '') is null then excluded.foto else personal.foto end,
      contrato_id = case when nullif(btrim(personal.contrato_id), '') is null then excluded.contrato_id else personal.contrato_id end,
      observacion = case when nullif(btrim(personal.observacion), '') is null then excluded.observacion else personal.observacion end,
      carpeta = case when nullif(btrim(personal.carpeta), '') is null then excluded.carpeta else personal.carpeta end,
      prev_riesgos = coalesce(personal.prev_riesgos, excluded.prev_riesgos),
      tipo_contrato = coalesce(personal.tipo_contrato, excluded.tipo_contrato),
      grupo = coalesce(personal.grupo, excluded.grupo),
      nivel = coalesce(personal.nivel, excluded.nivel),
      grupo_cotizacion = case when nullif(btrim(personal.grupo_cotizacion), '') is null then excluded.grupo_cotizacion else personal.grupo_cotizacion end,
      nombre = case when nullif(btrim(personal.nombre), '') is null then excluded.nombre else personal.nombre end,
      apellido = case when nullif(btrim(personal.apellido), '') is null then excluded.apellido else personal.apellido end
    returning (xmax = 0) as inserted
  )
  select
    count(*) filter (where inserted),
    count(*) filter (where not inserted)
    into inserted_count, conflict_updated_count
  from upserted;

  updated_count := updated_count + conflict_updated_count;

  -- Datos confidenciales: solo el rol admin los rellena. Se aplica el mismo
  -- criterio de "rellenar huecos" sobre las filas no ambiguas (insertadas o
  -- emparejadas por id/dni).
  if is_admin then
    insert into public.personal_confidencial (
      personal_id,
      cuenta_corriente,
      ss,
      irpf,
      num_pagas_extra,
      prorrateo_pagas,
      direccion,
      codigo_postal,
      fecha_nacimiento,
      contacto_urgencia,
      telefono_urgencia
    )
    select
      coalesce(s.match_id, s.id),
      s.cuenta_corriente,
      s.ss,
      s.irpf,
      s.num_pagas_extra,
      coalesce(s.prorrateo_pagas, false),
      s.direccion,
      s.codigo_postal,
      s.fecha_nacimiento,
      s.contacto_urgencia,
      s.telefono_urgencia
    from import_personal_matches s
    where not s.ambiguous_dni
      and coalesce(s.match_id, s.id) is not null
    on conflict (personal_id) do update set
      cuenta_corriente = case when nullif(btrim(personal_confidencial.cuenta_corriente), '') is null then excluded.cuenta_corriente else personal_confidencial.cuenta_corriente end,
      ss = case when nullif(btrim(personal_confidencial.ss), '') is null then excluded.ss else personal_confidencial.ss end,
      irpf = coalesce(personal_confidencial.irpf, excluded.irpf),
      num_pagas_extra = coalesce(personal_confidencial.num_pagas_extra, excluded.num_pagas_extra),
      direccion = case when nullif(btrim(personal_confidencial.direccion), '') is null then excluded.direccion else personal_confidencial.direccion end,
      codigo_postal = coalesce(personal_confidencial.codigo_postal, excluded.codigo_postal),
      fecha_nacimiento = coalesce(personal_confidencial.fecha_nacimiento, excluded.fecha_nacimiento),
      contacto_urgencia = case when nullif(btrim(personal_confidencial.contacto_urgencia), '') is null then excluded.contacto_urgencia else personal_confidencial.contacto_urgencia end,
      telefono_urgencia = case when nullif(btrim(personal_confidencial.telefono_urgencia), '') is null then excluded.telefono_urgencia else personal_confidencial.telefono_urgencia end;
  end if;

  if source_count > 0
     and inserted_count = 0
     and updated_count = 0
     and ambiguous_count = 0 then
    raise exception 'La importacion recibio filas, pero no inserto, reviso ni marco ninguna como ambigua. Revisa conflictos de ID/DNI y vuelve a aplicar la funcion actualizada.';
  end if;

  return query select
    source_count,
    matched_by_id_count,
    matched_by_dni_count,
    updated_count,
    inserted_count,
    ambiguous_count;
end;
$$;

revoke all on function public.import_coordinacion_personal(jsonb) from public;
grant execute on function public.import_coordinacion_personal(jsonb) to authenticated;
