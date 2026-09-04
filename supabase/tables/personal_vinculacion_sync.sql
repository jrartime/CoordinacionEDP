-- ============================================================================
--  Sincronizacion automatica de personal.vinculacion_id desde el historial
--  laboral, y consolidacion de personal.activo / personal.pert_empresa (que
--  eran funciones puras de vinculacion_id, editadas a mano por separado y
--  susceptibles de desincronizarse) en la unica fuente de verdad.
--
--  Requiere: personal.sql, historiales_laborales.sql,
--            personal_confidencial.sql (vista personal_completo).
-- ============================================================================

-- ---------------------------------------------------------------------------
--  1. Calculo puro: dado un personal_id, que deberia valer vinculacion_id.
--     Devuelve NULL cuando NO hay que tocar el valor actual.
--
--     Regla:
--     - Historial vigente (fecha_baja is null O fecha_baja >= hoy) => 1
--       Activo, siempre gana. Incluye fijos discontinuos con la temporada
--       completa dada de alta de antemano (fecha_baja futura ya registrada):
--       mientras esa fecha no haya llegado, la persona sigue activa aunque
--       el historial ya tenga motivo_baja_id informado (el motivo describe
--       lo que pasara cuando llegue la baja, no cambia el estado antes de
--       tiempo).
--     - Si no, se mira el historial cerrado mas reciente (mayor fecha_baja,
--       desempate por id mayor) y su motivo_baja_id:
--         1  Fin Servicio FD (fijo discontinuo) => 2 No activo (sigue
--            perteneciendo, en pausa entre temporadas).
--         10 Excedencia                         => 2 No activo.
--         11 Variacion contrato                 => NULL, no tocar (suele
--            abrirse otro historial a continuacion, no implica salida).
--         cualquier otro motivo (2 Reincorporacion titular -- era contrato
--         temporal de sustitucion --, 3, 4, 5, 6, 7, 8, 9, 12) o motivo nulo
--                                                => 4 No pertenece.
--     - Sin ningun historial (ni abierto ni cerrado) => 4 No pertenece.
-- ---------------------------------------------------------------------------
create or replace function public.calcular_vinculacion_personal(
  p_personal_id integer
)
returns integer
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_tiene_abierto boolean;
  v_tiene_cerrado boolean;
  v_ultimo_motivo_baja_id integer;
begin
  if p_personal_id is null then
    return null;
  end if;

  select exists (
    select 1
    from public.historiales_laborales h
    where h.personal_id = p_personal_id
      and (h.fecha_baja is null or h.fecha_baja >= current_date)
  )
  into v_tiene_abierto;

  if v_tiene_abierto then
    return 1; -- Activo
  end if;

  select true, h.motivo_baja_id
  into v_tiene_cerrado, v_ultimo_motivo_baja_id
  from public.historiales_laborales h
  where h.personal_id = p_personal_id
    and h.fecha_baja is not null
    and h.fecha_baja < current_date
  order by h.fecha_baja desc, h.id desc
  limit 1;

  if not coalesce(v_tiene_cerrado, false) then
    return 4; -- Sin historial alguno: No pertenece.
  end if;

  if v_ultimo_motivo_baja_id = 11 then
    return null; -- Variacion contrato: no tocar.
  elsif v_ultimo_motivo_baja_id in (1, 10) then
    return 2; -- Fin Servicio FD / Excedencia: No activo.
  else
    return 4; -- Resto de motivos, o motivo_baja_id nulo: No pertenece.
  end if;
end;
$$;

revoke all on function public.calcular_vinculacion_personal(integer) from public;
-- Supabase concede EXECUTE a anon/authenticated por defecto al crear una
-- funcion nueva (ALTER DEFAULT PRIVILEGES); "revoke ... from public" no
-- deshace esos grants individuales, hay que revocarlos explicitamente.
revoke execute on function public.calcular_vinculacion_personal(integer) from anon;
grant execute on function public.calcular_vinculacion_personal(integer) to authenticated;

comment on function public.calcular_vinculacion_personal(integer) is
  'Calcula el vinculacion_id que deberia tener una persona segun su historial laboral. Devuelve NULL cuando no debe tocarse (motivo_baja_id 11 Variacion contrato).';

-- ---------------------------------------------------------------------------
--  2. Trigger sobre historiales_laborales: recalcula y actualiza
--     personal.vinculacion_id cuando cambia el historial de una persona.
--
--     SECURITY DEFINER es deliberado (no INVOKER): personal tiene una policy
--     UPDATE restrictiva por contrato gestionable
--     (personal_instalaciones_scope.sql: alcance de coordinacion_manageable
--     _contrato_ids). Si esta funcion corriera como INVOKER, un coordinador
--     editando el historial de alguien fuera de su alcance de contratos
--     actualizaria 0 filas SIN error (RLS filtra silenciosamente), y
--     vinculacion_id nunca se sincronizaria para esos casos. DEFINER
--     garantiza que el recalculo se aplica siempre, igual que ya hace
--     save_coordinacion_personal.
-- ---------------------------------------------------------------------------
create or replace function public.sync_personal_vinculacion_from_historial()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_personal_id integer;
  v_nueva_vinculacion integer;
begin
  v_personal_id := coalesce(new.personal_id, old.personal_id);

  if v_personal_id is null then
    return coalesce(new, old);
  end if;

  v_nueva_vinculacion := public.calcular_vinculacion_personal(v_personal_id);

  if v_nueva_vinculacion is not null then
    update public.personal
    set vinculacion_id = v_nueva_vinculacion
    where id = v_personal_id
      and vinculacion_id is distinct from v_nueva_vinculacion;
  end if;

  return coalesce(new, old);
end;
$$;

revoke all on function public.sync_personal_vinculacion_from_historial() from public;
-- Idem: revocar explicitamente anon/authenticated. Es una funcion de
-- trigger (returns trigger), no tiene sentido como RPC publica; Postgres
-- rechaza invocarla directamente aunque quedara con EXECUTE concedido, pero
-- se revoca igualmente por higiene y para no salir en el listado de RPC.
revoke execute on function public.sync_personal_vinculacion_from_historial() from anon;
revoke execute on function public.sync_personal_vinculacion_from_historial() from authenticated;

drop trigger if exists sync_personal_vinculacion_from_historial on public.historiales_laborales;
create trigger sync_personal_vinculacion_from_historial
after insert or update or delete on public.historiales_laborales
for each row
execute function public.sync_personal_vinculacion_from_historial();

comment on function public.sync_personal_vinculacion_from_historial() is
  'Trigger AFTER INSERT/UPDATE/DELETE en historiales_laborales: recalcula personal.vinculacion_id via calcular_vinculacion_personal(). SECURITY DEFINER para no depender del alcance RLS de quien edita el historial.';

-- ============================================================================
--  3. BACKFILL -- APLICADO el 3/9/2026 (project_id epbtoarkinvgcaewbtvs).
--
--  Excluyo deliberadamente a quien no tiene ningun historial (con o sin
--  baja): ~44 personas con vinculacion_id en 1/3 y CERO historiales son
--  huecos plantilla para asignar en Eventos/Actividades (zz Montajes 01,
--  zz Conserjeria 08, zz VACIO, Reten Concilia...), no personas reales, y
--  el backfill no las toca para no sacarlas de los 4 selectores de personal
--  asignable.
--
--  Con esa exclusion, el backfill toco 256 personas de las que si tenian
--  algun historial (auditado antes de aplicar, diff = 0 despues). Resultado
--  final: 715 personas -- 124 Activo, 59 No activo, 1 Pendiente de
--  desvincular, 531 No pertenece.
-- ============================================================================
update public.personal p
set vinculacion_id = calc.nueva_vinculacion
from (
  select id, public.calcular_vinculacion_personal(id) as nueva_vinculacion
  from public.personal
  where exists (select 1 from public.historiales_laborales h where h.personal_id = personal.id)
) calc
where calc.id = p.id
  and calc.nueva_vinculacion is not null
  and calc.nueva_vinculacion is distinct from p.vinculacion_id;

-- ============================================================================
--  4. CONSOLIDACION -- APLICADA el 3/9/2026, tras confirmar que
--     coordinacion/app.js (PERSONAL_FIELDS, PERSONAL_IMPORT_*,
--     renderPersonalList, renderPersonalDetailHeader) y las RPC
--     save_coordinacion_personal / import_coordinacion_personal /
--     get_personal_para_asignar ya estaban desplegadas en produccion.
--
--  Elimina personal.activo y personal.pert_empresa. Solo personal_completo
--  dependia de ellas (select p.*); ni actividades_detalle ni
--  historiales_laborales_detalle las seleccionaban.
-- ============================================================================
drop view if exists public.personal_completo;

alter table public.personal
  drop column if exists activo,
  drop column if exists pert_empresa;

create or replace view public.personal_completo as
select
  p.*,
  case when public.is_coordinacion_admin() then pc.cuenta_corriente end as cuenta_corriente,
  case when public.is_coordinacion_admin() then pc.ss end as ss,
  case when public.is_coordinacion_admin() then pc.irpf end as irpf,
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
