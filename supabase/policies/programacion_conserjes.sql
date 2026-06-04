alter table public.programacion_conserjes enable row level security;

drop policy if exists "authenticated_can_read_programacion_conserjes" on public.programacion_conserjes;
create policy "authenticated_can_read_programacion_conserjes"
on public.programacion_conserjes
for select
to authenticated
using (true);

drop policy if exists "anon_can_read_programacion_conserjes" on public.programacion_conserjes;
create policy "anon_can_read_programacion_conserjes"
on public.programacion_conserjes
for select
to anon
using (true);

drop policy if exists "authenticated_can_insert_programacion_conserjes" on public.programacion_conserjes;
create policy "authenticated_can_insert_programacion_conserjes"
on public.programacion_conserjes
for insert
to authenticated
with check (true);

drop policy if exists "authenticated_can_update_programacion_conserjes" on public.programacion_conserjes;
create policy "authenticated_can_update_programacion_conserjes"
on public.programacion_conserjes
for update
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated_can_delete_programacion_conserjes" on public.programacion_conserjes;
create policy "authenticated_can_delete_programacion_conserjes"
on public.programacion_conserjes
for delete
to authenticated
using (true);
