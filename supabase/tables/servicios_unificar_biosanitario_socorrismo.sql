-- ============================================================================
--  Fusion manual de servicios (2026-08-06), a peticion del usuario: el nombre
--  normalizado no los detecto en servicios_globalizar.sql porque no son
--  duplicados literales, es una decision de negocio de que "son lo mismo".
--    Control Biosanitario Teatinos (25) y Control biosanitarios (12)
--      -> Control Biosanitario (11)
--    Socorrismo Interior (1) -> Socorrismo acuático (3)
--  ("Socorrismo exterior" queda aparte, no se unifica).
--
--  Mismo procedimiento que servicios_globalizar.sql pero con un mapa manual
--  en vez de agrupar por servicio_normalizado. Antes de aplicar se comprobo
--  que ningun contrato ni tarifa tenia ya asignados dos ids del mismo grupo
--  (si lo tuviera, el UPDATE de contrato_servicios/contratos_funciones_servicios
--  violaria su constraint unique y habria que deduplicar primero, como se hace
--  aqui con coordinacion_usuario_servicios).
--
--  Este fichero es la copia de referencia de una migracion ya aplicada
--  (id -> id: los ids en concreto solo tienen sentido en esta base). No se
--  re-ejecuta; sirve para saber que paso si hace falta repetir el patron con
--  otro grupo de servicios.
--
--  Requiere servicios_globalizar.sql.
-- ============================================================================

create table public._servicio_merge_map_tmp (old_id bigint, new_id bigint);
insert into public._servicio_merge_map_tmp (old_id, new_id) values
  (25, 11), -- Control Biosanitario Teatinos -> Control Biosanitario
  (12, 11), -- Control biosanitarios -> Control Biosanitario
  (1, 3);   -- Socorrismo Interior -> Socorrismo acuático

update public.contrato_servicios cs
set servicio_id = m.new_id
from public._servicio_merge_map_tmp m
where cs.servicio_id = m.old_id;

update public.registros r
set servicio_id = m.new_id
from public._servicio_merge_map_tmp m
where r.servicio_id = m.old_id;

update public.actividades a
set servicio_id = m.new_id
from public._servicio_merge_map_tmp m
where a.servicio_id = m.old_id;

update public.contratos_funciones_servicios cfs
set servicio_id = m.new_id
from public._servicio_merge_map_tmp m
where cfs.servicio_id = m.old_id;

update public.registros_facturacion_destino rfd
set servicio_id = m.new_id
from public._servicio_merge_map_tmp m
where rfd.servicio_id = m.old_id;

-- coordinacion_usuario_servicios (en desuso, ver coordinacion_usuario_contratos.sql):
-- varios usuarios ya tenian concedidos a la vez el duplicado y el canonico
-- (PK compuesta), hay que deduplicar antes de remapear.
delete from public.coordinacion_usuario_servicios cus
using public._servicio_merge_map_tmp m
where cus.servicio_id = m.old_id
  and exists (
    select 1 from public.coordinacion_usuario_servicios cus2
    where cus2.user_id = cus.user_id and cus2.servicio_id = m.new_id
  );

update public.coordinacion_usuario_servicios cus
set servicio_id = m.new_id
from public._servicio_merge_map_tmp m
where cus.servicio_id = m.old_id;

delete from public.servicios s
using public._servicio_merge_map_tmp m
where s.id = m.old_id;

drop table public._servicio_merge_map_tmp;
