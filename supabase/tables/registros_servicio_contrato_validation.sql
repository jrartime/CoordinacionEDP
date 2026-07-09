-- ============================================================================
--  Validacion registros.servicio_id -> registros.contrato_id.
-- ----------------------------------------------------------------------------
--  Evita que se guarden registros con un servicio que pertenece a otro contrato.
--  Complementa la validacion equivalente que ya existe en public.actividades.
-- ============================================================================

create or replace function public.validate_registros_servicio_contrato()
returns trigger
language plpgsql
as $$
declare
  service_contract_id integer;
begin
  if new.servicio_id is null then
    return new;
  end if;

  select s.contrato_id
    into service_contract_id
  from public.servicios s
  where s.id = new.servicio_id;

  if service_contract_id is null then
    raise exception 'El servicio indicado no existe.';
  end if;

  if new.contrato_id is distinct from service_contract_id then
    raise exception 'El servicio indicado no pertenece al contrato del registro.';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_registros_servicio_contrato on public.registros;
create trigger validate_registros_servicio_contrato
before insert or update of contrato_id, servicio_id on public.registros
for each row
execute function public.validate_registros_servicio_contrato();
