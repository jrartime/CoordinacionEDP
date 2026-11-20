-- ============================================================================
-- RD 723/2026: contratos temporales y sustituciones (esquema `coordinacion`).
--
-- El anexo informativo debe decir la causa de un contrato temporal, las circunstancias que la
-- justifican y su conexión con la duración (art. 3.2.d). En una interinidad (claves 410, 418, 510,
-- 518) la causa es la persona a la que se sustituye: de ella salen el centro de trabajo, cuando la
-- persona sustituta aún no tiene actividades, y el motivo de la ausencia (baja médica o permiso).
--
-- Se guarda con el resto de datos del anexo del periodo (`historiales_laborales_rd723`), sin tocar
-- `historiales_laborales`, que usan las nóminas.
-- ============================================================================

alter table coordinacion.historiales_laborales_rd723
  add column if not exists sustituye_personal_id integer references coordinacion.personal (id) on delete set null,
  add column if not exists causa_contratacion_texto text;

comment on column coordinacion.historiales_laborales_rd723.sustituye_personal_id is
  'Persona a la que sustituye quien tiene este periodo (contratos de interinidad). El anexo toma de ella el centro de trabajo y el motivo de su ausencia.';
comment on column coordinacion.historiales_laborales_rd723.causa_contratacion_texto is
  'Causa de la contratación temporal y su conexión con la duración, para el anexo. Vacío = el anexo lo redacta a partir de la persona sustituida.';
