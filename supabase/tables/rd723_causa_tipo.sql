-- ============================================================================
-- RD 723/2026: tipo de causa de la contratación temporal (esquema `coordinacion`).
--
-- El anexo informativo redacta la causa según su tipo (art. 15 del Estatuto): sustitución de una
-- persona trabajadora o circunstancias de la producción; cualquier otra se describe a mano. El tipo se
-- guarda con el resto de datos del anexo del periodo. Vacío = el que se deduce del contrato (las
-- interinidades 410, 418, 510 y 518 son sustituciones; 402 y 502 son circunstancias de la producción).
-- ============================================================================

alter table coordinacion.historiales_laborales_rd723
  add column if not exists causa_contratacion_tipo text
  check (causa_contratacion_tipo is null or causa_contratacion_tipo in ('sustitucion', 'circunstancias_produccion', 'otra'));

comment on column coordinacion.historiales_laborales_rd723.causa_contratacion_tipo is
  'Tipo de causa del contrato temporal para el anexo RD 723: sustitucion, circunstancias_produccion u otra. NULL = el deducido de la clave del contrato.';
