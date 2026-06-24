alter table public.puestos enable row level security;
alter table public.funciones enable row level security;
alter table public.modalidades enable row level security;

grant select, insert, update, delete on public.puestos to authenticated;
grant select, insert, update, delete on public.funciones to authenticated;
grant select, insert, update, delete on public.modalidades to authenticated;

drop policy if exists "authenticated_can_insert_puestos" on public.puestos;
create policy "authenticated_can_insert_puestos"
on public.puestos
for insert
to authenticated
with check (public.is_coordinacion_admin());

drop policy if exists "authenticated_can_update_puestos" on public.puestos;
create policy "authenticated_can_update_puestos"
on public.puestos
for update
to authenticated
using (public.is_coordinacion_admin())
with check (public.is_coordinacion_admin());

drop policy if exists "authenticated_can_delete_puestos" on public.puestos;
create policy "authenticated_can_delete_puestos"
on public.puestos
for delete
to authenticated
using (public.is_coordinacion_admin());

drop policy if exists "authenticated_can_insert_funciones" on public.funciones;
create policy "authenticated_can_insert_funciones"
on public.funciones
for insert
to authenticated
with check (public.is_coordinacion_admin());

drop policy if exists "authenticated_can_update_funciones" on public.funciones;
create policy "authenticated_can_update_funciones"
on public.funciones
for update
to authenticated
using (public.is_coordinacion_admin())
with check (public.is_coordinacion_admin());

drop policy if exists "authenticated_can_delete_funciones" on public.funciones;
create policy "authenticated_can_delete_funciones"
on public.funciones
for delete
to authenticated
using (public.is_coordinacion_admin());

drop policy if exists "authenticated_can_insert_modalidades" on public.modalidades;
create policy "authenticated_can_insert_modalidades"
on public.modalidades
for insert
to authenticated
with check (public.is_coordinacion_admin());

drop policy if exists "authenticated_can_update_modalidades" on public.modalidades;
create policy "authenticated_can_update_modalidades"
on public.modalidades
for update
to authenticated
using (public.is_coordinacion_admin())
with check (public.is_coordinacion_admin());

drop policy if exists "authenticated_can_delete_modalidades" on public.modalidades;
create policy "authenticated_can_delete_modalidades"
on public.modalidades
for delete
to authenticated
using (public.is_coordinacion_admin());

create or replace function public.get_master_catalog_usage(
  p_catalog text,
  p_record_id integer
)
returns table (
  source_table text,
  source_label text,
  usage_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_catalog not in ('puestos', 'funciones', 'modalidades') then
    raise exception 'Catálogo no soportado: %', p_catalog;
  end if;

  if p_catalog = 'puestos' then
    if to_regclass('public.actividades') is not null then
      return query
      select 'actividades'::text, 'Actividades'::text, count(*)::bigint
      from public.actividades
      where puesto_id = p_record_id;
    end if;

    if to_regclass('public.registros') is not null then
      return query
      select 'registros'::text, 'Registros'::text, count(*)::bigint
      from public.registros
      where puesto_id = p_record_id;
    end if;

    if to_regclass('public.historiales_laborales') is not null then
      return query
      select 'historiales_laborales'::text, 'Historiales laborales'::text, count(*)::bigint
      from public.historiales_laborales
      where puesto_id = p_record_id;
    end if;
  end if;

  if p_catalog = 'funciones' then
    if to_regclass('public.actividades') is not null then
      return query
      select 'actividades'::text, 'Actividades'::text, count(*)::bigint
      from public.actividades
      where funcion_id = p_record_id;
    end if;

    if to_regclass('public.registros') is not null then
      return query
      select 'registros'::text, 'Registros'::text, count(*)::bigint
      from public.registros
      where funcion_id = p_record_id;
    end if;
  end if;

  if p_catalog = 'modalidades' then
    if to_regclass('public.actividades') is not null then
      return query
      select 'actividades'::text, 'Actividades'::text, count(*)::bigint
      from public.actividades
      where modalidad_id = p_record_id;
    end if;

    if to_regclass('public.registros') is not null then
      return query
      select 'registros'::text, 'Registros'::text, count(*)::bigint
      from public.registros
      where modalidad_id = p_record_id;
    end if;
  end if;
end;
$$;

revoke all on function public.get_master_catalog_usage(text, integer) from public;
grant execute on function public.get_master_catalog_usage(text, integer) to authenticated;

