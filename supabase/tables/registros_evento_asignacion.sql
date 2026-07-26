-- Trazabilidad de los registros generados desde la pestana Eventos, igual que
-- actividad_id lo hace para los generados desde Actividades: permite no
-- duplicar al regenerar y saber de que montaje salio cada registro.
--
-- ON DELETE SET NULL: si se borra la asignacion del cronograma, el registro de
-- horas NO se borra (es un hecho trabajado, no una planificacion); solo pierde
-- el vinculo.
--
-- Que escribe la generacion en cada registro (ver generateEventRecords en
-- coordinacion/app.js):
--   * fecha y horas: del paso del cronograma, o las propias de esa persona en
--     el paso si las tiene (puede entrar mas tarde o salir antes que el resto).
--   * contrato_id e instalacion_id: del evento.
--   * tipo_hora_id = 3 (MONT) y situacion_id = 1 (NORM), siempre.
--   * funcion_id = 20 (Oficial de 1a), que es la que llevan los registros de
--     montaje ya existentes.
--   * puesto_id: lo elige quien genera, en el desplegable del panel.
--   * empresa_id: del historial laboral vigente de la persona ese dia. Sin ella
--     el registro no entraria en su nomina (el motor cruza por empresa), asi que
--     las asignaciones sin historial se dejan fuera y se avisa de quienes son.
alter table public.registros
  add column if not exists evento_asignacion_id bigint
    references public.eventos_cronograma_personal (id) on delete set null;

comment on column public.registros.evento_asignacion_id is
  'Asignacion de eventos_cronograma_personal que genero este registro. Sirve para no duplicar al regenerar y para rastrear el montaje de origen.';

create index if not exists registros_evento_asignacion_idx
on public.registros (evento_asignacion_id)
where evento_asignacion_id is not null;
