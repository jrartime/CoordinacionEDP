-- ============================================================================
--  Motor genérico de avisos automáticos + triggers de las tablas origen v1
--  (personal_bajas, personal_permisos).
-- ----------------------------------------------------------------------------
--  Conectar una tabla origen nueva en el futuro:
--    1. Añadir su nombre al check avisos_reglas_tabla_origen_check (avisos.sql).
--    2. Escribir un trigger AFTER INSERT propio (mismo patrón que los dos de
--       abajo) que arme un jsonb de contexto ya resuelto (nombres, no solo
--       ids) y llame a generar_aviso_regla(tabla_origen, contexto).
--    3. Dar de alta la(s) avisos_reglas de esa tabla desde el panel admin
--       (no hace falta migración para eso).
--  No hay motor de "condición" en SQL: la condición de disparo (si la hay)
--  vive en el trigger de esa tabla, igual que el resto de lógica de negocio
--  de la app.
--
--  Requiere: avisos.sql, coordinacion_roles.sql (is_coordinacion_admin,
--            coordinacion_usuarios), personal_bajas.sql, personal_permisos.sql.
-- ============================================================================

create or replace function public.renderizar_plantilla_aviso(
  p_texto text,
  p_contexto jsonb
)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  v_resultado text := coalesce(p_texto, '');
  v_clave text;
  v_valor text;
begin
  if p_contexto is null then
    return v_resultado;
  end if;

  for v_clave, v_valor in
    select key, value from jsonb_each_text(p_contexto)
  loop
    v_resultado := replace(v_resultado, '{{' || v_clave || '}}', coalesce(v_valor, ''));
  end loop;

  return v_resultado;
end;
$$;

comment on function public.renderizar_plantilla_aviso(text, jsonb) is
  'Sustituye {{clave}} en p_texto por p_contexto->>clave, para cada clave presente en el contexto.';

-- ---------------------------------------------------------------------------
--  generar_aviso_regla: por cada avisos_regla activa de p_tabla_origen, crea
--  un aviso automático con la plantilla rellenada y resuelve destinatarios.
--  SECURITY DEFINER: se invoca desde triggers AFTER INSERT en tablas que un
--  coordinador de alcance limitado puede escribir; el aviso resultante debe
--  crearse siempre, sin depender de que el alcance RLS de avisos lo permita
--  para ese usuario (mismo motivo que sync_personal_vinculacion_from_historial
--  en personal_vinculacion_sync.sql).
-- ---------------------------------------------------------------------------
create or replace function public.generar_aviso_regla(
  p_tabla_origen text,
  p_contexto jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_regla record;
  v_aviso_id bigint;
  v_titulo text;
  v_cuerpo text;
  v_contrato_id integer;
  v_personal_id integer;
begin
  v_contrato_id := nullif(p_contexto->>'contrato_id', '')::integer;
  v_personal_id := nullif(p_contexto->>'personal_id', '')::integer;

  for v_regla in
    select * from public.avisos_reglas
    where tabla_origen = p_tabla_origen and activo = true
  loop
    v_titulo := public.renderizar_plantilla_aviso(v_regla.plantilla_titulo, p_contexto);
    v_cuerpo := public.renderizar_plantilla_aviso(v_regla.plantilla_cuerpo, p_contexto);

    insert into public.avisos (
      autor_id, origen, regla_id, titulo, cuerpo, difusion, contrato_id, personal_id
    ) values (
      null,
      'automatico',
      v_regla.id,
      v_titulo,
      v_cuerpo,
      case when v_regla.difusion = 'todos' then 'todos' else 'usuarios' end,
      v_contrato_id,
      v_personal_id
    )
    returning id into v_aviso_id;

    if v_regla.difusion = 'usuarios' then
      insert into public.avisos_destinatarios (aviso_id, user_id)
      select v_aviso_id, u
      from unnest(v_regla.destinatarios_usuario_ids) as u
      on conflict do nothing;
    elsif v_regla.difusion = 'rol' then
      insert into public.avisos_destinatarios (aviso_id, user_id)
      select v_aviso_id, cu.user_id
      from public.coordinacion_usuarios cu
      where cu.rol = v_regla.rol and cu.activo = true
      on conflict do nothing;
    end if;
  end loop;
end;
$$;

revoke all on function public.generar_aviso_regla(text, jsonb) from public;
revoke execute on function public.generar_aviso_regla(text, jsonb) from anon;
revoke execute on function public.generar_aviso_regla(text, jsonb) from authenticated;

comment on function public.generar_aviso_regla(text, jsonb) is
  'Motor genérico: crea un aviso automático por cada avisos_regla activa de p_tabla_origen, con la plantilla rellenada desde p_contexto y destinatarios resueltos según difusion/rol. Solo se llama desde triggers SECURITY DEFINER, nunca directamente.';

-- ---------------------------------------------------------------------------
--  Trigger: personal_bajas -> avisos
-- ---------------------------------------------------------------------------
create or replace function public.trg_aviso_from_personal_bajas()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contexto jsonb;
begin
  select jsonb_build_object(
    'personal_id', new.personal_id,
    'personal_nombre', coalesce(p.personal, ''),
    'tipo', coalesce(bt.tipo, ''),
    'fecha_inicio', to_char(new.fecha_inicio, 'DD/MM/YYYY'),
    'fecha_fin', coalesce(to_char(new.fecha_fin, 'DD/MM/YYYY'), 'en curso')
  )
  into v_contexto
  from public.personal p
  left join public.personal_bajas_tipo bt on bt.id = new.tipo_id
  where p.id = new.personal_id;

  perform public.generar_aviso_regla('personal_bajas', v_contexto);

  return new;
end;
$$;

revoke all on function public.trg_aviso_from_personal_bajas() from public;
revoke execute on function public.trg_aviso_from_personal_bajas() from anon;
revoke execute on function public.trg_aviso_from_personal_bajas() from authenticated;

drop trigger if exists trg_aviso_from_personal_bajas on public.personal_bajas;
create trigger trg_aviso_from_personal_bajas
after insert on public.personal_bajas
for each row
execute function public.trg_aviso_from_personal_bajas();

comment on function public.trg_aviso_from_personal_bajas() is
  'Trigger AFTER INSERT en personal_bajas: arma el contexto y llama a generar_aviso_regla(''personal_bajas'', contexto).';

-- ---------------------------------------------------------------------------
--  Trigger: personal_permisos -> avisos
-- ---------------------------------------------------------------------------
create or replace function public.trg_aviso_from_personal_permisos()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contexto jsonb;
begin
  select jsonb_build_object(
    'personal_id', new.personal_id,
    'personal_nombre', coalesce(p.personal, ''),
    'tipo', coalesce(pt.tipo, ''),
    'fecha_inicio', to_char(new.fecha_inicio, 'DD/MM/YYYY'),
    'fecha_fin', coalesce(to_char(new.fecha_fin, 'DD/MM/YYYY'), 'en curso')
  )
  into v_contexto
  from public.personal p
  left join public.personal_permisos_tipo pt on pt.id = new.tipo_id
  where p.id = new.personal_id;

  perform public.generar_aviso_regla('personal_permisos', v_contexto);

  return new;
end;
$$;

revoke all on function public.trg_aviso_from_personal_permisos() from public;
revoke execute on function public.trg_aviso_from_personal_permisos() from anon;
revoke execute on function public.trg_aviso_from_personal_permisos() from authenticated;

drop trigger if exists trg_aviso_from_personal_permisos on public.personal_permisos;
create trigger trg_aviso_from_personal_permisos
after insert on public.personal_permisos
for each row
execute function public.trg_aviso_from_personal_permisos();

comment on function public.trg_aviso_from_personal_permisos() is
  'Trigger AFTER INSERT en personal_permisos: arma el contexto y llama a generar_aviso_regla(''personal_permisos'', contexto).';

-- ---------------------------------------------------------------------------
--  Reglas semilla, desactivadas por defecto (se activan desde el panel
--  admin "Reglas de aviso" cuando se validen destinatarios/texto reales).
-- ---------------------------------------------------------------------------
insert into public.avisos_reglas (
  nombre, tabla_origen, activo, plantilla_titulo, plantilla_cuerpo, difusion, rol
) values
  (
    'Baja médica registrada',
    'personal_bajas',
    false,
    'Baja registrada: {{personal_nombre}}',
    'Se ha registrado una baja de tipo "{{tipo}}" para {{personal_nombre}}, desde el {{fecha_inicio}} hasta {{fecha_fin}}.',
    'rol',
    'admin'
  ),
  (
    'Permiso registrado',
    'personal_permisos',
    false,
    'Permiso registrado: {{personal_nombre}}',
    'Se ha registrado un permiso de tipo "{{tipo}}" para {{personal_nombre}}, desde el {{fecha_inicio}} hasta {{fecha_fin}}.',
    'rol',
    'admin'
  )
on conflict (nombre) do nothing;
