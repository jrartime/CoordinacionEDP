alter table public.registros enable row level security;

drop policy if exists "authenticated_can_insert_horas" on public.registros;
drop policy if exists "authenticated_can_insert_registros" on public.registros;
create policy "authenticated_can_insert_registros"
on public.registros
for insert
to authenticated
with check (true);

drop policy if exists "authenticated_can_update_horas" on public.registros;
drop policy if exists "authenticated_can_update_registros" on public.registros;
create policy "authenticated_can_update_registros"
on public.registros
for update
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated_can_delete_horas" on public.registros;
drop policy if exists "authenticated_can_delete_registros" on public.registros;
create policy "authenticated_can_delete_registros"
on public.registros
for delete
to authenticated
using (true);
