create or replace function public.can_manage_coordinacion_historial_laboral(
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
      and public.can_access_coordinacion_pestana('historial', p_user_id)
    );
$$;

revoke all on function public.can_manage_coordinacion_historial_laboral(uuid) from public;
grant execute on function public.can_manage_coordinacion_historial_laboral(uuid) to authenticated;

drop function if exists public.import_coordinacion_historial_laboral(jsonb);

create or replace function public.import_coordinacion_historial_laboral(
  p_rows jsonb
)
returns table (
  filas_origen integer,
  existentes_por_id integer,
  filas_actualizadas integer,
  filas_insertadas integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  source_count integer := 0;
  existing_count integer := 0;
  updated_count integer := 0;
  inserted_count integer := 0;
begin
  if not public.can_manage_coordinacion_historial_laboral(auth.uid()) then
    raise exception 'No tienes permisos para importar historial laboral.';
  end if;

  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'El payload de importacion debe ser un array JSON.';
  end if;

  if jsonb_array_length(p_rows) = 0 then
    raise exception 'No se recibieron filas para importar.';
  end if;

  create temporary table import_historial_source (
    id bigint,
    activo boolean,
    enviado boolean,
    gestionado boolean,
    tramitado boolean,
    personal_id integer,
    empresa_id integer,
    jornada numeric,
    jornada_maxima numeric,
    contrato_laboral_id integer,
    modalidad_pago_id integer,
    fecha_alta date,
    fecha_baja date,
    dias_periodo integer,
    puesto_id integer,
    coeficiente_temporalidad_miles integer,
    tipo_contratacion_id integer,
    motivo_baja_id integer,
    horarios text,
    observaciones text,
    salario_jornada_completa numeric,
    importe_horas_complementarias numeric,
    tiene_complemento_movilidad boolean,
    tiene_complemento_dedicacion boolean,
    tiene_plus_transporte boolean,
    tiene_nocturnidad boolean,
    tiene_antiguedad boolean,
    tiene_complemento boolean,
    complemento numeric,
    notas text,
    grupo_cotizacion smallint,
    movimiento varchar(25),
    puesto_texto text,
    cotizacion_comunes_pct numeric,
    cotizacion_mei_pct numeric,
    cotizacion_formacion_pct numeric,
    cotizacion_desempleo_pct numeric,
    lenguaje_inclusivo boolean
  ) on commit drop;

  insert into import_historial_source (
    id,
    activo,
    enviado,
    gestionado,
    tramitado,
    personal_id,
    empresa_id,
    jornada,
    jornada_maxima,
    contrato_laboral_id,
    modalidad_pago_id,
    fecha_alta,
    fecha_baja,
    dias_periodo,
    puesto_id,
    coeficiente_temporalidad_miles,
    tipo_contratacion_id,
    motivo_baja_id,
    horarios,
    observaciones,
    salario_jornada_completa,
    importe_horas_complementarias,
    tiene_complemento_movilidad,
    tiene_complemento_dedicacion,
    tiene_plus_transporte,
    tiene_nocturnidad,
    tiene_antiguedad,
    tiene_complemento,
    complemento,
    notas,
    grupo_cotizacion,
    movimiento,
    puesto_texto,
    cotizacion_comunes_pct,
    cotizacion_mei_pct,
    cotizacion_formacion_pct,
    cotizacion_desempleo_pct,
    lenguaje_inclusivo
  )
  select
    id,
    activo,
    coalesce(enviado, false),
    coalesce(gestionado, false),
    coalesce(tramitado, false),
    personal_id,
    empresa_id,
    jornada,
    jornada_maxima,
    contrato_laboral_id,
    modalidad_pago_id,
    fecha_alta,
    fecha_baja,
    dias_periodo,
    puesto_id,
    coeficiente_temporalidad_miles,
    tipo_contratacion_id,
    motivo_baja_id,
    nullif(btrim(horarios), ''),
    nullif(btrim(observaciones), ''),
    salario_jornada_completa,
    importe_horas_complementarias,
    tiene_complemento_movilidad,
    tiene_complemento_dedicacion,
    tiene_plus_transporte,
    tiene_nocturnidad,
    tiene_antiguedad,
    tiene_complemento,
    complemento,
    nullif(btrim(notas), ''),
    grupo_cotizacion,
    nullif(btrim(movimiento), ''),
    nullif(btrim(puesto_texto), ''),
    cotizacion_comunes_pct,
    cotizacion_mei_pct,
    cotizacion_formacion_pct,
    cotizacion_desempleo_pct,
    lenguaje_inclusivo
  from jsonb_to_recordset(p_rows) as source (
    id bigint,
    activo boolean,
    enviado boolean,
    gestionado boolean,
    tramitado boolean,
    personal_id integer,
    empresa_id integer,
    jornada numeric,
    jornada_maxima numeric,
    contrato_laboral_id integer,
    modalidad_pago_id integer,
    fecha_alta date,
    fecha_baja date,
    dias_periodo integer,
    puesto_id integer,
    coeficiente_temporalidad_miles integer,
    tipo_contratacion_id integer,
    motivo_baja_id integer,
    horarios text,
    observaciones text,
    salario_jornada_completa numeric,
    importe_horas_complementarias numeric,
    tiene_complemento_movilidad boolean,
    tiene_complemento_dedicacion boolean,
    tiene_plus_transporte boolean,
    tiene_nocturnidad boolean,
    tiene_antiguedad boolean,
    tiene_complemento boolean,
    complemento numeric,
    notas text,
    grupo_cotizacion smallint,
    movimiento varchar(25),
    puesto_texto text,
    cotizacion_comunes_pct numeric,
    cotizacion_mei_pct numeric,
    cotizacion_formacion_pct numeric,
    cotizacion_desempleo_pct numeric,
    lenguaje_inclusivo boolean
  );

  if exists (select 1 from import_historial_source where id is null or personal_id is null) then
    raise exception 'Todas las filas importadas deben tener ID y personal_id.';
  end if;

  if exists (
    select 1
    from import_historial_source
    group by id
    having count(*) > 1
  ) then
    raise exception 'El payload de importacion contiene IDs repetidos.';
  end if;

  select count(*) into source_count from import_historial_source;
  select count(*) into existing_count
  from import_historial_source s
  join public.historiales_laborales h
    on h.id = s.id;

  with upserted as (
    insert into public.historiales_laborales (
      id,
      activo,
      enviado,
      gestionado,
      tramitado,
      personal_id,
      empresa_id,
      jornada,
      jornada_maxima,
      contrato_laboral_id,
      modalidad_pago_id,
      fecha_alta,
      fecha_baja,
      dias_periodo,
      puesto_id,
      coeficiente_temporalidad_miles,
      tipo_contratacion_id,
      motivo_baja_id,
      horarios,
      observaciones,
      salario_jornada_completa,
      importe_horas_complementarias,
      tiene_complemento_movilidad,
      tiene_complemento_dedicacion,
      tiene_plus_transporte,
      tiene_nocturnidad,
      tiene_antiguedad,
      tiene_complemento,
      complemento,
      notas,
      grupo_cotizacion,
      movimiento,
      puesto_texto,
      cotizacion_comunes_pct,
      cotizacion_mei_pct,
      cotizacion_formacion_pct,
      cotizacion_desempleo_pct,
      lenguaje_inclusivo
    )
    select
      id,
      activo,
      enviado,
      gestionado,
      tramitado,
      personal_id,
      empresa_id,
      jornada,
      jornada_maxima,
      contrato_laboral_id,
      modalidad_pago_id,
      fecha_alta,
      fecha_baja,
      dias_periodo,
      puesto_id,
      coeficiente_temporalidad_miles,
      tipo_contratacion_id,
      motivo_baja_id,
      horarios,
      observaciones,
      salario_jornada_completa,
      importe_horas_complementarias,
      tiene_complemento_movilidad,
      tiene_complemento_dedicacion,
      tiene_plus_transporte,
      tiene_nocturnidad,
      tiene_antiguedad,
      tiene_complemento,
      complemento,
      notas,
      grupo_cotizacion,
      movimiento,
      puesto_texto,
      cotizacion_comunes_pct,
      cotizacion_mei_pct,
      cotizacion_formacion_pct,
      cotizacion_desempleo_pct,
      lenguaje_inclusivo
    from import_historial_source
    on conflict (id) do update set
      activo = excluded.activo,
      enviado = excluded.enviado,
      gestionado = excluded.gestionado,
      tramitado = excluded.tramitado,
      personal_id = excluded.personal_id,
      empresa_id = excluded.empresa_id,
      jornada = excluded.jornada,
      jornada_maxima = excluded.jornada_maxima,
      contrato_laboral_id = excluded.contrato_laboral_id,
      modalidad_pago_id = excluded.modalidad_pago_id,
      fecha_alta = excluded.fecha_alta,
      fecha_baja = excluded.fecha_baja,
      dias_periodo = excluded.dias_periodo,
      puesto_id = excluded.puesto_id,
      coeficiente_temporalidad_miles = excluded.coeficiente_temporalidad_miles,
      tipo_contratacion_id = excluded.tipo_contratacion_id,
      motivo_baja_id = excluded.motivo_baja_id,
      horarios = excluded.horarios,
      observaciones = excluded.observaciones,
      salario_jornada_completa = excluded.salario_jornada_completa,
      importe_horas_complementarias = excluded.importe_horas_complementarias,
      tiene_complemento_movilidad = excluded.tiene_complemento_movilidad,
      tiene_complemento_dedicacion = excluded.tiene_complemento_dedicacion,
      tiene_plus_transporte = excluded.tiene_plus_transporte,
      tiene_nocturnidad = excluded.tiene_nocturnidad,
      tiene_antiguedad = excluded.tiene_antiguedad,
      tiene_complemento = excluded.tiene_complemento,
      complemento = excluded.complemento,
      notas = excluded.notas,
      grupo_cotizacion = excluded.grupo_cotizacion,
      movimiento = excluded.movimiento,
      puesto_texto = excluded.puesto_texto,
      cotizacion_comunes_pct = excluded.cotizacion_comunes_pct,
      cotizacion_mei_pct = excluded.cotizacion_mei_pct,
      cotizacion_formacion_pct = excluded.cotizacion_formacion_pct,
      cotizacion_desempleo_pct = excluded.cotizacion_desempleo_pct,
      lenguaje_inclusivo = excluded.lenguaje_inclusivo
    returning (xmax = 0) as inserted
  )
  select
    count(*) filter (where inserted),
    count(*) filter (where not inserted)
    into inserted_count, updated_count
  from upserted;

  perform setval(
    pg_get_serial_sequence('public.historiales_laborales', 'id'),
    coalesce((select max(id) from public.historiales_laborales), 1),
    true
  );

  return query select
    source_count,
    existing_count,
    updated_count,
    inserted_count;
end;
$$;

revoke all on function public.import_coordinacion_historial_laboral(jsonb) from public;
grant execute on function public.import_coordinacion_historial_laboral(jsonb) to authenticated;
