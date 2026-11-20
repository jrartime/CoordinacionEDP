-- ============================================================================
-- RD 723/2026: horas complementarias por convenio (esquema `coordinacion`).
--
-- El anexo informativo debe decir el máximo de horas complementarias y su preaviso (art. 3.2.g.3).
-- Dependen del convenio, así que se guardan en su ficha:
--   - V Convenio de Instalaciones Deportivas (art. 23): máximo 50 % de la jornada semanal y
--     preaviso por escrito de al menos tres días.
--   - IV Convenio de Ocio Educativo: no regula las horas complementarias; se aplica el Estatuto
--     (art. 12.5): máximo 30 % de las horas ordinarias y preaviso mínimo de tres días.
-- Un convenio sin dato aplica el Estatuto: 30 % y tres días.
-- ============================================================================

alter table coordinacion.convenios
  add column if not exists horas_complementarias_pct numeric,
  add column if not exists horas_complementarias_preaviso text;

comment on column coordinacion.convenios.horas_complementarias_pct is
  'Máximo de horas complementarias, en % de la jornada semanal contratada (o de las horas ordinarias). NULL = el del Estatuto de los Trabajadores (30 %).';
comment on column coordinacion.convenios.horas_complementarias_preaviso is
  'Preaviso para realizar horas complementarias. NULL = el del Estatuto (tres días como mínimo, salvo que el convenio fije uno menor).';

update coordinacion.convenios
set horas_complementarias_pct = 50,
    horas_complementarias_preaviso = '3 días, por escrito (artículo 23 del convenio)'
where codigo = '99015105012005' and horas_complementarias_pct is null;

update coordinacion.convenios
set horas_complementarias_pct = 30,
    horas_complementarias_preaviso = '3 días (mínimo del artículo 12.5 del Estatuto de los Trabajadores)'
where codigo = '99100055012011' and horas_complementarias_pct is null;

-- Ajuste 17/11/2026 (a petición de la empresa): el preaviso admite excepción por situaciones de
-- necesidad. Solo cambia los textos que se sembraron arriba.
update coordinacion.convenios
set horas_complementarias_preaviso = '3 días, por escrito (artículo 23 del convenio), salvo situaciones de necesidad'
where codigo = '99015105012005'
  and horas_complementarias_preaviso = '3 días, por escrito (artículo 23 del convenio)';

update coordinacion.convenios
set horas_complementarias_preaviso = '3 días, salvo situaciones de necesidad'
where codigo = '99100055012011'
  and horas_complementarias_preaviso = '3 días (mínimo del artículo 12.5 del Estatuto de los Trabajadores)';
