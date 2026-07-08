-- RLS de registro_apuntes: mismo patron que public.registros (authenticated
-- puede insertar/actualizar/borrar). La confidencialidad de la persona la sigue
-- imponiendo el split de personal; aqui solo hay horas y conceptos.
alter table public.registro_apuntes enable row level security;

drop policy if exists "authenticated_can_insert_registro_apuntes" on public.registro_apuntes;
create policy "authenticated_can_insert_registro_apuntes"
on public.registro_apuntes
for insert
to authenticated
with check (true);

drop policy if exists "authenticated_can_update_registro_apuntes" on public.registro_apuntes;
create policy "authenticated_can_update_registro_apuntes"
on public.registro_apuntes
for update
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated_can_delete_registro_apuntes" on public.registro_apuntes;
create policy "authenticated_can_delete_registro_apuntes"
on public.registro_apuntes
for delete
to authenticated
using (true);

grant select, insert, update, delete on public.registro_apuntes to authenticated;
