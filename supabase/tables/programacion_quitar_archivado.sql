-- Programación: se elimina el archivado (13/11/2026).
-- Todos los registros pasan a mostrarse; la columna archived_at ya no existe.
-- Copia de lo que estaba archivado (1.774 registros) por si hubiera que recuperarlo.
create table if not exists coordinacion.programacion_conserjes_archived_backup as
select id, archived_at
from coordinacion.programacion_conserjes
where archived_at is not null;

alter table coordinacion.programacion_conserjes_archived_backup enable row level security;

drop index if exists coordinacion.idx_programacion_conserjes_archived_at;
alter table coordinacion.programacion_conserjes drop column if exists archived_at;
