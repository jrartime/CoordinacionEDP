-- Fase 4 (parte 2): retirar de personal_confidencial las columnas de complementos
-- que ya se migraron a personal_complementos (com_antiguedad_04, com_absorbible_18,
-- porcent_complemento_18). Los datos se respaldaron en
-- exports/personal_confidencial_complementos_backup_20260718.csv y se verificaron
-- migrados (10 + 10 + 3 filas) antes de este drop.
--
-- num_pagas_extra, prorrateo_pagas e irpf NO son complementos y se quedan.
--
-- Las funciones save_coordinacion_personal / import_coordinacion_personal ya se
-- recrearon sin estas columnas (coordinacion_personal_save_function.sql).
--
-- La vista personal_completo se recrea sin ellas (drop + create, porque CREATE OR
-- REPLACE VIEW no puede eliminar columnas intermedias). Se deja tras la funcion de
-- guardado; no depende ninguna otra vista de personal_completo (verificado).

drop view if exists public.personal_completo;

create view public.personal_completo as
select
  p.*,
  case when public.is_coordinacion_admin() then pc.cuenta_corriente end as cuenta_corriente,
  case when public.is_coordinacion_admin() then pc.ss end as ss,
  case when public.is_coordinacion_admin() then pc.irpf end as irpf,
  case when public.is_coordinacion_admin() then pc.num_pagas_extra end as num_pagas_extra,
  case when public.is_coordinacion_admin() then pc.prorrateo_pagas end as prorrateo_pagas,
  case when public.is_coordinacion_admin() then pc.direccion end as direccion,
  case when public.is_coordinacion_admin() then pc.codigo_postal end as codigo_postal,
  case when public.is_coordinacion_admin() then pc.fecha_nacimiento end as fecha_nacimiento,
  case when public.is_coordinacion_admin() then pc.contacto_urgencia end as contacto_urgencia,
  case when public.is_coordinacion_admin() then pc.telefono_urgencia end as telefono_urgencia
from public.personal p
left join public.personal_confidencial pc
  on pc.personal_id = p.id;

alter view public.personal_completo set (security_invoker = true);

grant select on public.personal_completo to authenticated;

alter table public.personal_confidencial
  drop column if exists com_antiguedad_04,
  drop column if exists com_absorbible_18,
  drop column if exists porcent_complemento_18;
