alter table public.personal enable row level security;
alter table public.registros_horarios enable row level security;
alter table public.contratos enable row level security;
alter table public.empresas enable row level security;
alter table public.funciones enable row level security;
alter table public.registros enable row level security;
alter table public.instalaciones enable row level security;
alter table public.modalidades enable row level security;
alter table public.puestos enable row level security;
alter table public.servicios enable row level security;
alter table public.situaciones enable row level security;
alter table public.tipo_horas enable row level security;

drop policy if exists "authenticated_can_read_personal" on public.personal;
create policy "authenticated_can_read_personal"
on public.personal
for select
to authenticated
using (true);

drop policy if exists "authenticated_can_read_registros" on public.registros_horarios;
drop policy if exists "authenticated_can_read_registros_horarios" on public.registros_horarios;
create policy "authenticated_can_read_registros_horarios"
on public.registros_horarios
for select
to authenticated
using (true);

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

drop policy if exists "authenticated_can_read_empresas" on public.empresas;
create policy "authenticated_can_read_empresas"
on public.empresas
for select
to authenticated
using (true);

drop policy if exists "authenticated_can_read_funciones" on public.funciones;
create policy "authenticated_can_read_funciones"
on public.funciones
for select
to authenticated
using (true);

drop policy if exists "authenticated_can_read_horas" on public.registros;
drop policy if exists "authenticated_can_read_registros" on public.registros;
create policy "authenticated_can_read_registros"
on public.registros
for select
to authenticated
using (true);

drop policy if exists "authenticated_can_read_instalaciones" on public.instalaciones;
create policy "authenticated_can_read_instalaciones"
on public.instalaciones
for select
to authenticated
using (true);

drop policy if exists "anon_can_read_active_instalaciones" on public.instalaciones;
create policy "anon_can_read_active_instalaciones"
on public.instalaciones
for select
to anon
using (activo = true);

drop policy if exists "authenticated_can_read_modalidades" on public.modalidades;
create policy "authenticated_can_read_modalidades"
on public.modalidades
for select
to authenticated
using (true);

drop policy if exists "authenticated_can_read_puestos" on public.puestos;
create policy "authenticated_can_read_puestos"
on public.puestos
for select
to authenticated
using (true);

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

drop policy if exists "authenticated_can_read_situaciones" on public.situaciones;
create policy "authenticated_can_read_situaciones"
on public.situaciones
for select
to authenticated
using (true);

drop policy if exists "authenticated_can_read_tipo_horas" on public.tipo_horas;
create policy "authenticated_can_read_tipo_horas"
on public.tipo_horas
for select
to authenticated
using (true);



