-- Los tres contratos AFD que se facturan juntos comparten plantilla:
-- AFD 2024 (46), TechFit (63) y AFD Salas y Gimnasios (69).
-- Poner o quitar a una persona en cualquiera se replica en los otros dos.
-- Sustituye a contrato_personal_afd2024_propagacion.sql (solo iba de 46 hacia 63/69).
-- Quitar = misma forma que usa la app: activo=false, fecha_fin y removed_at.
-- SECURITY DEFINER: un coordinador con acceso a uno solo no puede escribir en los
-- otros por RLS. pg_trigger_depth() evita que las réplicas se disparen entre sí.

drop trigger if exists trg_propagar_personal_afd2024 on public.contrato_personal;
drop function if exists public.propagar_personal_afd2024();

create or replace function public.sincronizar_personal_afd()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_grupo constant int[] := array[46, 63, 69];
begin
  if pg_trigger_depth() > 1 or not (new.contrato_id = any (v_grupo)) then
    return new;
  end if;

  if new.activo and new.removed_at is null then
    insert into public.contrato_personal (contrato_id, personal_id, activo, fecha_inicio, fecha_fin)
    select c, new.personal_id, true, new.fecha_inicio, new.fecha_fin
    from unnest(v_grupo) as c
    where c <> new.contrato_id
    on conflict (contrato_id, personal_id) do update
      set activo = true,
          removed_at = null,
          fecha_inicio = coalesce(excluded.fecha_inicio, public.contrato_personal.fecha_inicio),
          fecha_fin = excluded.fecha_fin;
  else
    update public.contrato_personal
       set activo = false,
           fecha_fin = coalesce(new.fecha_fin, current_date),
           removed_at = coalesce(new.removed_at, now())
     where personal_id = new.personal_id
       and contrato_id = any (v_grupo)
       and contrato_id <> new.contrato_id
       and (activo or removed_at is null);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sincronizar_personal_afd on public.contrato_personal;
create trigger trg_sincronizar_personal_afd
  after insert or update of activo, removed_at on public.contrato_personal
  for each row execute function public.sincronizar_personal_afd();
