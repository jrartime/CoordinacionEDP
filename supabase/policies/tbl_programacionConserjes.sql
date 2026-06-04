alter table public."tbl_programacionConserjes" enable row level security;

drop policy if exists "authenticated_can_read_tbl_programacion_conserjes" on public."tbl_programacionConserjes";
create policy "authenticated_can_read_tbl_programacion_conserjes"
on public."tbl_programacionConserjes"
for select
to authenticated
using (true);

drop policy if exists "anon_can_read_tbl_programacion_conserjes" on public."tbl_programacionConserjes";
create policy "anon_can_read_tbl_programacion_conserjes"
on public."tbl_programacionConserjes"
for select
to anon
using (true);

drop policy if exists "authenticated_can_insert_tbl_programacion_conserjes" on public."tbl_programacionConserjes";
create policy "authenticated_can_insert_tbl_programacion_conserjes"
on public."tbl_programacionConserjes"
for insert
to authenticated
with check (true);

drop policy if exists "authenticated_can_update_tbl_programacion_conserjes" on public."tbl_programacionConserjes";
create policy "authenticated_can_update_tbl_programacion_conserjes"
on public."tbl_programacionConserjes"
for update
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated_can_delete_tbl_programacion_conserjes" on public."tbl_programacionConserjes";
create policy "authenticated_can_delete_tbl_programacion_conserjes"
on public."tbl_programacionConserjes"
for delete
to authenticated
using (true);
