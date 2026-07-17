-- Codigos del programa de nominas externo para cada complemento/plus, y ajustes
-- al catalogo derivados de esa correspondencia:
--   - "Complemento salarial" (codigo 18) puede ser fijo o porcentaje segun la
--     persona (confirmado por el usuario) -> se anade tipo='variable': el
--     catalogo no fija tipo/unidad/bases, la Fase 3 (asignacion a persona)
--     debera decidirlo por asignacion.
--   - "Plus de festivos y domingos" (codigo 12) es el mismo concepto que el
--     multiplicador x1.75 de FTRAB en tipo_horas (confirmado por el usuario):
--     no se crea como complemento aparte, se anota el codigo en tipo_horas.
--   - "Complemento de puesto" (codigo 60) es nuevo: fijo mensual.

alter table public.nomina_complementos_catalogo
  add column if not exists codigo_nomina integer;

comment on column public.nomina_complementos_catalogo.codigo_nomina is
  'Codigo del concepto en el programa de nominas externo usado por la empresa.';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'nomina_complementos_codigo_nomina_unique'
  ) then
    alter table public.nomina_complementos_catalogo
      add constraint nomina_complementos_codigo_nomina_unique unique (codigo_nomina);
  end if;
end $$;

-- Permitir tipo='variable' (fijo o porcentaje decidido por asignacion, no por catalogo).
alter table public.nomina_complementos_catalogo
  drop constraint if exists nomina_complementos_tipo_chk;
alter table public.nomina_complementos_catalogo
  add constraint nomina_complementos_tipo_chk
  check (tipo in ('fijo', 'porcentaje', 'variable'));

alter table public.nomina_complementos_catalogo
  drop constraint if exists nomina_complementos_coherencia_chk;
alter table public.nomina_complementos_catalogo
  add constraint nomina_complementos_coherencia_chk
  check (
    (tipo = 'fijo' and unidad is not null and bases_aplicables is null)
    or
    (tipo = 'porcentaje' and unidad is null and medida_horas is null
      and bases_aplicables is not null and cardinality(bases_aplicables) > 0)
    or
    (tipo = 'variable' and unidad is null and medida_horas is null and bases_aplicables is null)
  );

comment on column public.nomina_complementos_catalogo.tipo is
  'fijo: importe en euros (por unidad). porcentaje: fraccion aplicada sobre bases_aplicables. variable: fijo o porcentaje decidido en la asignacion a cada persona (Fase 3), no aqui.';

-- Codigos de los 5 complementos ya sembrados en nomina_complementos.sql.
update public.nomina_complementos_catalogo set codigo_nomina = 398 where nombre = 'Plus de transporte';
update public.nomina_complementos_catalogo set codigo_nomina = 53 where nombre = 'Plus de nocturnidad';
update public.nomina_complementos_catalogo set codigo_nomina = 11 where nombre = 'Complemento de movilidad';
update public.nomina_complementos_catalogo set codigo_nomina = 65 where nombre = 'Complemento de dedicación';
update public.nomina_complementos_catalogo set codigo_nomina = 4 where nombre = 'Complemento de antigüedad';
-- "Complemento absorbible" (id 6): sin codigo de nomina confirmado todavia, se deja NULL.

insert into public.nomina_complementos_catalogo
  (nombre, tipo, unidad, medida_horas, bases_aplicables, prorratea_en_extra, codigo_nomina, notas)
values
  ('Complemento salarial', 'variable', null, null, null, false, 18,
   'Fuente: historiales_laborales.complemento (fijo) y personal_confidencial.porcent_complemento_18 (%). Confirmado por el usuario: puede ser fijo o porcentaje segun la persona -> tipo se define en la asignacion (Fase 3), no aqui.'),
  ('Complemento de puesto', 'fijo', 'mensual', null, null, false, 60,
   'Nuevo, sin dato historico previo en personal_confidencial/historiales_laborales.')
on conflict (nombre) do update set
  codigo_nomina = excluded.codigo_nomina;

-- "Plus de festivos y domingos" (codigo 12) = FTRAB en tipo_horas, no un complemento aparte.
alter table public.tipo_horas
  add column if not exists codigo_nomina integer;

comment on column public.tipo_horas.codigo_nomina is
  'Codigo del concepto en el programa de nominas externo (solo FTRAB tiene uno confirmado: "Plus de festivos y domingos" = 12).';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tipo_horas_codigo_nomina_unique'
  ) then
    alter table public.tipo_horas
      add constraint tipo_horas_codigo_nomina_unique unique (codigo_nomina);
  end if;
end $$;

update public.tipo_horas set codigo_nomina = 12 where id = 4;
