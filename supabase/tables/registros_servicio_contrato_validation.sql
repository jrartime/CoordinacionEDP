-- ============================================================================
--  Validacion registros.servicio_id -> registros.contrato_id.
-- ----------------------------------------------------------------------------
--  Evita que se guarden registros con un servicio que no esta habilitado en
--  ese contrato. Complementa la validacion equivalente que ya existe en
--  public.actividades.
--
--  `servicios` es un catalogo global (ver servicios.sql): un mismo servicio
--  puede estar habilitado en varios contratos a la vez, asi que ya no basta
--  con comparar servicios.contrato_id -esa columna ni siquiera existe-; la
--  fuente de verdad es contrato_servicios (ver contrato_servicios.sql).
-- ============================================================================

create or replace function public.validate_registros_servicio_contrato()
returns trigger
language plpgsql
as $$
begin
  if new.servicio_id is null then
    return new;
  end if;

  if not exists (
    select 1 from public.contrato_servicios cs
    where cs.contrato_id = new.contrato_id
      and cs.servicio_id = new.servicio_id
  ) then
    raise exception 'El servicio indicado no esta habilitado en el contrato del registro.';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_registros_servicio_contrato on public.registros;
create trigger validate_registros_servicio_contrato
before insert or update of contrato_id, servicio_id on public.registros
for each row
execute function public.validate_registros_servicio_contrato();
