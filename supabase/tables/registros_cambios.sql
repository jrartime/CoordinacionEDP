-- Historial de altas, ediciones y eliminaciones de registros.
-- Conserva las versiones completas para permitir una reversión segura.
create table if not exists public.registro_cambios (
  id bigint generated always as identity primary key,
  registro_id bigint not null,
  accion text not null check (accion in ('insert', 'update', 'delete')),
  anterior jsonb,
  nuevo jsonb,
  cambiado_en timestamptz not null default now(),
  cambiado_por uuid default auth.uid(),
  cambiado_por_email text
);

create index if not exists registro_cambios_recientes_idx
on public.registro_cambios (cambiado_en desc, id desc);

create index if not exists registro_cambios_registro_idx
on public.registro_cambios (registro_id, cambiado_en desc);

alter table public.registro_cambios enable row level security;

drop policy if exists "coordinacion_can_read_registro_cambios" on public.registro_cambios;
create policy "coordinacion_can_read_registro_cambios"
on public.registro_cambios
for select
to authenticated
using (
  (select public.is_coordinacion_admin())
  or coalesce(
    nullif(nuevo ->> 'contrato_id', '')::integer,
    nullif(anterior ->> 'contrato_id', '')::integer
  ) in (select public.coordinacion_readable_contrato_ids())
);

create or replace function public.audit_registro_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'UPDATE' and old is not distinct from new then
    return new;
  end if;

  insert into public.registro_cambios (
    registro_id,
    accion,
    anterior,
    nuevo,
    cambiado_por,
    cambiado_por_email
  )
  values (
    coalesce(new.id, old.id),
    lower(tg_op),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end,
    auth.uid(),
    auth.jwt() ->> 'email'
  );
  return coalesce(new, old);
end;
$$;

revoke all on function public.audit_registro_change() from public;

drop trigger if exists audit_registro_changes on public.registros;
create trigger audit_registro_changes
after insert or update or delete on public.registros
for each row
execute function public.audit_registro_change();

create or replace function public.revertir_registro_cambio(p_cambio_id bigint)
returns bigint
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_cambio public.registro_cambios%rowtype;
  v_actual jsonb;
  v_asignaciones text;
begin
  select *
  into v_cambio
  from public.registro_cambios
  where id = p_cambio_id;

  if not found then
    raise exception 'El cambio no existe o no está disponible para tu perfil.';
  end if;

  select to_jsonb(r)
  into v_actual
  from public.registros r
  where r.id = v_cambio.registro_id;

  if v_cambio.accion in ('insert', 'update') and v_actual is distinct from v_cambio.nuevo then
    raise exception 'El registro se ha modificado después de este cambio. Revierte primero el cambio más reciente.';
  end if;

  if v_cambio.accion = 'insert' then
    delete from public.registros where id = v_cambio.registro_id;
  elsif v_cambio.accion = 'delete' then
    if v_actual is not null then
      raise exception 'No se puede restaurar: ya existe un registro con el mismo ID.';
    end if;
    insert into public.registros
    select (jsonb_populate_record(null::public.registros, v_cambio.anterior)).*;
  else
    select string_agg(format('%1$I = source.%1$I', a.attname), ', ')
    into v_asignaciones
    from pg_attribute a
    where a.attrelid = 'public.registros'::regclass
      and a.attnum > 0
      and not a.attisdropped
      and a.attname <> 'id';

    execute format(
      'update public.registros target set %s from jsonb_populate_record(null::public.registros, $1) source where target.id = $2',
      v_asignaciones
    )
    using v_cambio.anterior, v_cambio.registro_id;
  end if;

  return v_cambio.registro_id;
end;
$$;

revoke all on function public.revertir_registro_cambio(bigint) from public;
grant execute on function public.revertir_registro_cambio(bigint) to authenticated;

grant select on public.registro_cambios to authenticated;
