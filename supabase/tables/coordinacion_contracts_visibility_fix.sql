drop policy if exists "authenticated_can_read_contratos" on public.contratos;
create policy "authenticated_can_read_contratos"
on public.contratos
for select
to authenticated
using (public.can_access_coordinacion_contrato(id));

drop policy if exists "coordinacion_contratos_assigned_only" on public.contratos;
create policy "coordinacion_contratos_assigned_only"
on public.contratos
as restrictive
for select
to authenticated
using (public.can_access_coordinacion_contrato(id));

drop policy if exists "authenticated_can_read_servicios" on public.servicios;
create policy "authenticated_can_read_servicios"
on public.servicios
for select
to authenticated
using (public.can_access_coordinacion_servicio(id));

drop policy if exists "coordinacion_servicios_assigned_only" on public.servicios;
create policy "coordinacion_servicios_assigned_only"
on public.servicios
as restrictive
for select
to authenticated
using (public.can_access_coordinacion_servicio(id));
