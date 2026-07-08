-- ============================================================================
--  contratos — nocturnidad a nivel de contrato/servicio.
-- ----------------------------------------------------------------------------
--  Define si el contrato reconoce nocturnidad y en que franja horaria.
--  La franja se usa al GENERAR registros para calcular registros.horas_nocturnas
--  (solape del turno con la franja). El criterio puede cambiar en el futuro,
--  pero lo ya calculado/pagado queda congelado en cada registro historico.
--
--  Franja como dos `time` para soportar el cruce de medianoche
--  (por defecto 22:00 -> 06:00, criterio actual).
-- ============================================================================
alter table public.contratos
  add column if not exists tiene_nocturnidad boolean not null default false;

alter table public.contratos
  add column if not exists nocturnidad_inicio time not null default '22:00';

alter table public.contratos
  add column if not exists nocturnidad_fin time not null default '06:00';

comment on column public.contratos.tiene_nocturnidad is
  'true = el contrato reconoce nocturnidad; al generar registros se calcula horas_nocturnas.';
comment on column public.contratos.nocturnidad_inicio is
  'Inicio de la franja nocturna (por defecto 22:00).';
comment on column public.contratos.nocturnidad_fin is
  'Fin de la franja nocturna (por defecto 06:00; cruza medianoche).';
