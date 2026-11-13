-- Programación: se elimina el tipo (fin de semana / semanal). Todo son actividades programadas.
-- Antes de aplicarlo hay que tener publicadas las versiones nuevas de coordinacion/ y programacion/
-- (las anteriores seleccionan y filtran por tipo_programacion y dejarían de cargar).
-- En el momento de aplicarlo todos los registros eran fin_semana (no había ninguno semanal).
drop index if exists coordinacion.idx_programacion_conserjes_tipo_fecha;
alter table coordinacion.programacion_conserjes drop constraint if exists programacion_conserjes_tipo_check;
alter table coordinacion.programacion_conserjes drop column if exists tipo_programacion;
create index if not exists idx_programacion_conserjes_fecha on coordinacion.programacion_conserjes (fecha);
