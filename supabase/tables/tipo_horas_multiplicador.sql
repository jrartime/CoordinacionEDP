-- Afinado del catalogo tipo_horas a partir de los datos reales (ids 1-8).
-- El catalogo mezclaba dos ejes; aqui los marcamos sin romper nada:
--   categoria = 'TARIFA'     -> REG, HCOMP, MONT, FTRAB  (eje 2, van en concepto_id)
--   categoria = 'MOVIMIENTO' -> PNR, BIN, BOUT           (eje 4, van en movimiento)
-- y multiplicador lleva la tarifa como DATO (1.0 normal, 1.75 festiva, ...).

alter table public.tipo_horas
  add column if not exists multiplicador real not null default 1.0;

alter table public.tipo_horas
  add column if not exists categoria text not null default 'TARIFA';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tipo_horas_categoria_chk'
  ) then
    alter table public.tipo_horas
      add constraint tipo_horas_categoria_chk
      check (categoria in ('TARIFA', 'MOVIMIENTO'));
  end if;
end $$;

-- Sembrado de los valores conocidos (idempotente).
update public.tipo_horas set categoria = 'TARIFA'     where id in (1,2,3,4);
update public.tipo_horas set categoria = 'MOVIMIENTO' where id in (5,7,8);

update public.tipo_horas set multiplicador = 1.75 where id = 4;   -- FTRAB festivo trabajado
-- Pendiente de confirmar el factor real de:
--   MONT  (id 3) -> "algo superior" al normal
--   HCOMP (id 2) -> segun convenio
-- update public.tipo_horas set multiplicador = 1.25 where id = 3;

comment on column public.tipo_horas.multiplicador is
  'Factor sobre el precio/hora normal (1.0 normal, 1.75 festiva, etc.).';
comment on column public.tipo_horas.categoria is
  'TARIFA (concepto retributivo, eje 2) o MOVIMIENTO (PNR/BIN/BOUT, eje 4).';
