alter table public.tbl_registros enable row level security;

drop policy if exists "authenticated_can_insert_tbl_registros" on public.tbl_registros;
create policy "authenticated_can_insert_tbl_registros"
on public.tbl_registros
for insert
to authenticated
with check (true);

drop policy if exists "authenticated_can_update_tbl_registros" on public.tbl_registros;
create policy "authenticated_can_update_tbl_registros"
on public.tbl_registros
for update
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated_can_delete_tbl_registros" on public.tbl_registros;
create policy "authenticated_can_delete_tbl_registros"
on public.tbl_registros
for delete
to authenticated
using (true);
