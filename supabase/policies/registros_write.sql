-- ============================================================================
--  RLS de `registros` — alcance por contrato asignado (panel de accesos).
-- ----------------------------------------------------------------------------
--  Lectura  : coordinator / area_coordinator / viewer -> registros de los
--             contratos cuyos servicios tienen asignados.
--  Escritura: coordinator / area_coordinator -> solo esos contratos. Viewer no.
--  Admin    : acceso total. Se resuelve con `(select public.is_coordinacion_admin())`
--             (subquery escalar => se evalúa UNA vez por consulta, no por fila).
--
--  El filtro por contrato usa `contrato_id in (select ...)` sobre un SET pequeño
--  (funciones en coordinacion_contrato_id_sets.sql) para aprovechar el índice y
--  evitar el timeout que provoca una función escalar por fila en 341k registros.
--  Requiere: coordinacion_roles.sql (is_coordinacion_admin) y
--            coordinacion_contrato_id_sets.sql (los dos SET de contratos).
-- ============================================================================
alter table public.registros enable row level security;

drop policy if exists "authenticated_can_read_horas" on public.registros;
drop policy if exists "authenticated_can_read_registros" on public.registros;
create policy "authenticated_can_read_registros"
on public.registros
for select
to authenticated
using (
  (select public.is_coordinacion_admin())
  or contrato_id in (select public.coordinacion_readable_contrato_ids())
);

drop policy if exists "authenticated_can_insert_horas" on public.registros;
drop policy if exists "authenticated_can_insert_registros" on public.registros;
create policy "authenticated_can_insert_registros"
on public.registros
for insert
to authenticated
with check (
  (select public.is_coordinacion_admin())
  or contrato_id in (select public.coordinacion_manageable_contrato_ids())
);

drop policy if exists "authenticated_can_update_horas" on public.registros;
drop policy if exists "authenticated_can_update_registros" on public.registros;
create policy "authenticated_can_update_registros"
on public.registros
for update
to authenticated
using (
  (select public.is_coordinacion_admin())
  or contrato_id in (select public.coordinacion_manageable_contrato_ids())
)
with check (
  (select public.is_coordinacion_admin())
  or contrato_id in (select public.coordinacion_manageable_contrato_ids())
);

drop policy if exists "authenticated_can_delete_horas" on public.registros;
drop policy if exists "authenticated_can_delete_registros" on public.registros;
create policy "authenticated_can_delete_registros"
on public.registros
for delete
to authenticated
using (
  (select public.is_coordinacion_admin())
  or contrato_id in (select public.coordinacion_manageable_contrato_ids())
);
