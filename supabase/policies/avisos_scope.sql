-- ============================================================================
--  RLS de avisos, avisos_destinatarios, avisos_lecturas, avisos_adjuntos y
--  avisos_reglas.
-- ----------------------------------------------------------------------------
--  Alcance por destinatario, no por contrato: un aviso es visible si eres
--  admin, el autor, está dirigido a "todos", o estás en avisos_destinatarios.
--  Dos funciones SECURITY DEFINER concentran esa condición para no repetirla
--  en cada policy (mismo patrón can_access_/can_manage_coordinacion_* de
--  coordinacion_roles.sql):
--    - can_view_aviso: puede ver el aviso (lectura).
--    - can_manage_aviso: puede administrarlo (autor o admin) — añadir/quitar
--      destinatarios y adjuntos, borrarlo.
--
--  avisos_reglas es admin-only sin capa permisiva+restrictiva (como
--  personal_bajas_tipo/personal_permisos_tipo): no hace falta que un
--  coordinador normal la lea.
--
--  Requiere: avisos.sql, coordinacion_roles.sql (is_coordinacion_admin).
-- ============================================================================

-- can_view_aviso/can_manage_aviso reconsultan `avisos` desde dentro de la
-- función: son seguras para las policies de avisos_destinatarios/
-- avisos_lecturas/avisos_adjuntos (tablas distintas), pero NO deben usarse
-- en la policy SELECT/DELETE de la propia tabla `avisos` — probado contra la
-- base real: un INSERT ... RETURNING en avisos con una policy SELECT que
-- reconsulta avisos (aunque sea via una función SECURITY DEFINER, STABLE o
-- VOLATILE) revienta con "new row violates row-level security policy" porque
-- Postgres no ve la fila recién insertada a través de esa subconsulta. La
-- policy de avisos sobre sí misma usa las columnas de la fila directamente
-- (autor_id, difusion) más un exists a avisos_destinatarios (tabla distinta,
-- eso sí es seguro) en vez de can_view_aviso(id)/can_manage_aviso(id).

create or replace function public.can_view_aviso(
  p_aviso_id bigint,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.avisos a
    where a.id = p_aviso_id
      and (
        public.is_coordinacion_admin(p_user_id)
        or a.autor_id = p_user_id
        or a.difusion = 'todos'
        or exists (
          select 1
          from public.avisos_destinatarios d
          where d.aviso_id = a.id and d.user_id = p_user_id
        )
      )
  );
$$;

revoke all on function public.can_view_aviso(bigint, uuid) from public;
revoke execute on function public.can_view_aviso(bigint, uuid) from anon;
grant execute on function public.can_view_aviso(bigint, uuid) to authenticated;

create or replace function public.can_manage_aviso(
  p_aviso_id bigint,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.avisos a
    where a.id = p_aviso_id
      and (public.is_coordinacion_admin(p_user_id) or a.autor_id = p_user_id)
  );
$$;

revoke all on function public.can_manage_aviso(bigint, uuid) from public;
revoke execute on function public.can_manage_aviso(bigint, uuid) from anon;
grant execute on function public.can_manage_aviso(bigint, uuid) to authenticated;

-- ---------------------------------------------------------------------------
--  avisos
-- ---------------------------------------------------------------------------
alter table public.avisos enable row level security;

grant select, insert, delete on public.avisos to authenticated;

drop policy if exists "authenticated_can_read_avisos" on public.avisos;
create policy "authenticated_can_read_avisos"
on public.avisos
for select
to authenticated
using (true);

drop policy if exists "coordinacion_avisos_visibility_scope" on public.avisos;
create policy "coordinacion_avisos_visibility_scope"
on public.avisos
as restrictive
for select
to authenticated
using (
  public.is_coordinacion_admin()
  or autor_id = auth.uid()
  or difusion = 'todos'
  or exists (
    select 1 from public.avisos_destinatarios d
    where d.aviso_id = avisos.id and d.user_id = auth.uid()
  )
);

drop policy if exists "authenticated_can_insert_avisos" on public.avisos;
create policy "authenticated_can_insert_avisos"
on public.avisos
for insert
to authenticated
with check (true);

drop policy if exists "coordinacion_avisos_insert_scope" on public.avisos;
create policy "coordinacion_avisos_insert_scope"
on public.avisos
as restrictive
for insert
to authenticated
with check (origen = 'manual' and autor_id = auth.uid());

drop policy if exists "authenticated_can_delete_avisos" on public.avisos;
create policy "authenticated_can_delete_avisos"
on public.avisos
for delete
to authenticated
using (true);

drop policy if exists "coordinacion_avisos_delete_scope" on public.avisos;
create policy "coordinacion_avisos_delete_scope"
on public.avisos
as restrictive
for delete
to authenticated
using (public.is_coordinacion_admin() or autor_id = auth.uid());

-- ---------------------------------------------------------------------------
--  avisos_destinatarios
-- ---------------------------------------------------------------------------
alter table public.avisos_destinatarios enable row level security;

grant select, insert, delete on public.avisos_destinatarios to authenticated;

drop policy if exists "authenticated_can_read_avisos_destinatarios" on public.avisos_destinatarios;
create policy "authenticated_can_read_avisos_destinatarios"
on public.avisos_destinatarios
for select
to authenticated
using (true);

drop policy if exists "coordinacion_avisos_destinatarios_read_scope" on public.avisos_destinatarios;
create policy "coordinacion_avisos_destinatarios_read_scope"
on public.avisos_destinatarios
as restrictive
for select
to authenticated
using (public.can_view_aviso(aviso_id));

drop policy if exists "authenticated_can_insert_avisos_destinatarios" on public.avisos_destinatarios;
create policy "authenticated_can_insert_avisos_destinatarios"
on public.avisos_destinatarios
for insert
to authenticated
with check (true);

drop policy if exists "coordinacion_avisos_destinatarios_insert_scope" on public.avisos_destinatarios;
create policy "coordinacion_avisos_destinatarios_insert_scope"
on public.avisos_destinatarios
as restrictive
for insert
to authenticated
with check (public.can_manage_aviso(aviso_id));

drop policy if exists "authenticated_can_delete_avisos_destinatarios" on public.avisos_destinatarios;
create policy "authenticated_can_delete_avisos_destinatarios"
on public.avisos_destinatarios
for delete
to authenticated
using (true);

drop policy if exists "coordinacion_avisos_destinatarios_delete_scope" on public.avisos_destinatarios;
create policy "coordinacion_avisos_destinatarios_delete_scope"
on public.avisos_destinatarios
as restrictive
for delete
to authenticated
using (public.can_manage_aviso(aviso_id));

-- ---------------------------------------------------------------------------
--  avisos_lecturas
-- ---------------------------------------------------------------------------
alter table public.avisos_lecturas enable row level security;

grant select, insert, update, delete on public.avisos_lecturas to authenticated;

drop policy if exists "authenticated_can_read_avisos_lecturas" on public.avisos_lecturas;
create policy "authenticated_can_read_avisos_lecturas"
on public.avisos_lecturas
for select
to authenticated
using (true);

drop policy if exists "coordinacion_avisos_lecturas_read_scope" on public.avisos_lecturas;
create policy "coordinacion_avisos_lecturas_read_scope"
on public.avisos_lecturas
as restrictive
for select
to authenticated
using (public.can_view_aviso(aviso_id));

drop policy if exists "authenticated_can_insert_avisos_lecturas" on public.avisos_lecturas;
create policy "authenticated_can_insert_avisos_lecturas"
on public.avisos_lecturas
for insert
to authenticated
with check (true);

drop policy if exists "coordinacion_avisos_lecturas_insert_scope" on public.avisos_lecturas;
create policy "coordinacion_avisos_lecturas_insert_scope"
on public.avisos_lecturas
as restrictive
for insert
to authenticated
with check (user_id = auth.uid() and public.can_view_aviso(aviso_id));

drop policy if exists "authenticated_can_update_avisos_lecturas" on public.avisos_lecturas;
create policy "authenticated_can_update_avisos_lecturas"
on public.avisos_lecturas
for update
to authenticated
using (true)
with check (true);

drop policy if exists "coordinacion_avisos_lecturas_update_scope" on public.avisos_lecturas;
create policy "coordinacion_avisos_lecturas_update_scope"
on public.avisos_lecturas
as restrictive
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "authenticated_can_delete_avisos_lecturas" on public.avisos_lecturas;
create policy "authenticated_can_delete_avisos_lecturas"
on public.avisos_lecturas
for delete
to authenticated
using (true);

drop policy if exists "coordinacion_avisos_lecturas_delete_scope" on public.avisos_lecturas;
create policy "coordinacion_avisos_lecturas_delete_scope"
on public.avisos_lecturas
as restrictive
for delete
to authenticated
using (user_id = auth.uid() or public.can_manage_aviso(aviso_id));

-- ---------------------------------------------------------------------------
--  avisos_adjuntos
-- ---------------------------------------------------------------------------
alter table public.avisos_adjuntos enable row level security;

grant select, insert, delete on public.avisos_adjuntos to authenticated;

drop policy if exists "authenticated_can_read_avisos_adjuntos" on public.avisos_adjuntos;
create policy "authenticated_can_read_avisos_adjuntos"
on public.avisos_adjuntos
for select
to authenticated
using (true);

drop policy if exists "coordinacion_avisos_adjuntos_read_scope" on public.avisos_adjuntos;
create policy "coordinacion_avisos_adjuntos_read_scope"
on public.avisos_adjuntos
as restrictive
for select
to authenticated
using (public.can_view_aviso(aviso_id));

drop policy if exists "authenticated_can_insert_avisos_adjuntos" on public.avisos_adjuntos;
create policy "authenticated_can_insert_avisos_adjuntos"
on public.avisos_adjuntos
for insert
to authenticated
with check (true);

drop policy if exists "coordinacion_avisos_adjuntos_insert_scope" on public.avisos_adjuntos;
create policy "coordinacion_avisos_adjuntos_insert_scope"
on public.avisos_adjuntos
as restrictive
for insert
to authenticated
with check (public.can_manage_aviso(aviso_id));

drop policy if exists "authenticated_can_delete_avisos_adjuntos" on public.avisos_adjuntos;
create policy "authenticated_can_delete_avisos_adjuntos"
on public.avisos_adjuntos
for delete
to authenticated
using (true);

drop policy if exists "coordinacion_avisos_adjuntos_delete_scope" on public.avisos_adjuntos;
create policy "coordinacion_avisos_adjuntos_delete_scope"
on public.avisos_adjuntos
as restrictive
for delete
to authenticated
using (public.can_manage_aviso(aviso_id));

-- ---------------------------------------------------------------------------
--  avisos_reglas: solo admin, sin capa permisiva+restrictiva.
-- ---------------------------------------------------------------------------
alter table public.avisos_reglas enable row level security;

grant select, insert, update, delete on public.avisos_reglas to authenticated;

drop policy if exists "admin_can_read_avisos_reglas" on public.avisos_reglas;
create policy "admin_can_read_avisos_reglas"
on public.avisos_reglas
for select
to authenticated
using (public.is_coordinacion_admin());

drop policy if exists "admin_can_insert_avisos_reglas" on public.avisos_reglas;
create policy "admin_can_insert_avisos_reglas"
on public.avisos_reglas
for insert
to authenticated
with check (public.is_coordinacion_admin());

drop policy if exists "admin_can_update_avisos_reglas" on public.avisos_reglas;
create policy "admin_can_update_avisos_reglas"
on public.avisos_reglas
for update
to authenticated
using (public.is_coordinacion_admin())
with check (public.is_coordinacion_admin());

drop policy if exists "admin_can_delete_avisos_reglas" on public.avisos_reglas;
create policy "admin_can_delete_avisos_reglas"
on public.avisos_reglas
for delete
to authenticated
using (public.is_coordinacion_admin());
