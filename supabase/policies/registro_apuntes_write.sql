-- RLS de registro_apuntes.
--
-- La app no edita apuntes auto directamente: se sincronizan desde el trigger de
-- public.registros. Ese trigger es SECURITY DEFINER para que una edicion valida
-- de registros no falle por una politica secundaria de esta tabla.
--
-- Se mantienen politicas directas para operaciones manuales/admin scripts desde
-- la app autenticada. La confidencialidad de la persona la sigue imponiendo el
-- split de personal; aqui solo hay horas y conceptos.
alter table public.registro_apuntes enable row level security;

drop policy if exists "authenticated_can_read_registro_apuntes" on public.registro_apuntes;
create policy "authenticated_can_read_registro_apuntes"
on public.registro_apuntes
for select
to authenticated
using (true);

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
