alter table public.registros_horarios enable row level security;

drop policy if exists "authenticated_can_insert_registros_horarios" on public.registros_horarios;
create policy "authenticated_can_insert_registros_horarios"
on public.registros_horarios
for insert
to authenticated
with check (true);

drop policy if exists "authenticated_can_update_registros_horarios" on public.registros_horarios;
create policy "authenticated_can_update_registros_horarios"
on public.registros_horarios
for update
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated_can_delete_registros_horarios" on public.registros_horarios;
create policy "authenticated_can_delete_registros_horarios"
on public.registros_horarios
for delete
to authenticated
using (true);

