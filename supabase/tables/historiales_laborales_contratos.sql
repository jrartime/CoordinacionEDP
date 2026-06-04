do $$
begin
  if to_regclass('public.historiales_laborales_contratos') is null
     and to_regclass('public.contratos_laborales') is not null then
    alter table public.contratos_laborales
      rename to historiales_laborales_contratos;
  end if;
end $$;

create table if not exists public.historiales_laborales_contratos (
  id integer primary key,
  clave text not null,
  duracion text not null,
  jornada text not null,
  descripcion text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint historiales_laborales_contratos_clave_unique unique (clave)
);

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'contratos_laborales_clave_unique'
      and conrelid = 'public.historiales_laborales_contratos'::regclass
  )
  and not exists (
    select 1
    from pg_constraint
    where conname = 'historiales_laborales_contratos_clave_unique'
      and conrelid = 'public.historiales_laborales_contratos'::regclass
  ) then
    alter table public.historiales_laborales_contratos
      rename constraint contratos_laborales_clave_unique to historiales_laborales_contratos_clave_unique;
  end if;

  if to_regclass('public.contratos_laborales_lookup_clave_idx') is not null
     and to_regclass('public.historiales_laborales_contratos_lookup_clave_idx') is null then
    alter index public.contratos_laborales_lookup_clave_idx
      rename to historiales_laborales_contratos_lookup_clave_idx;
  end if;
end $$;

create index if not exists historiales_laborales_contratos_lookup_clave_idx
on public.historiales_laborales_contratos (clave);

create or replace function public.set_historiales_laborales_contratos_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_contratos_laborales_updated_at on public.historiales_laborales_contratos;
drop trigger if exists set_historiales_laborales_contratos_updated_at on public.historiales_laborales_contratos;
create trigger set_historiales_laborales_contratos_updated_at
before update on public.historiales_laborales_contratos
for each row
execute function public.set_historiales_laborales_contratos_updated_at();

drop function if exists public.set_contratos_laborales_updated_at();

insert into public.historiales_laborales_contratos (
  id, clave, duracion, jornada, descripcion
) values
  (94, '100', 'Indefinido', 'Tiempo completo', 'Ordinario'),
  (95, '109', 'Indefinido', 'Tiempo completo', 'Fomento contratación indefinida/ Transformación contrato temporal'),
  (96, '130', 'Indefinido', 'Tiempo completo', 'Discapacitados'),
  (97, '139', 'Indefinido', 'Tiempo completo', 'Discapacitados/ Transformación contrato temporal'),
  (98, '150', 'Indefinido', 'Tiempo completo', 'Fomento contratación indefinida/ Inicial'),
  (99, '189', 'Indefinido', 'Tiempo completo', 'Transformación contrato temporal'),
  (100, '200', 'Indefinido', 'Tiempo parcial', 'Ordinario'),
  (101, '209', 'Indefinido', 'Tiempo parcial', 'Fomento contratación indefinida/ Transformación contrato temporal'),
  (102, '230', 'Indefinido', 'Tiempo parcial', 'Discapacitados'),
  (103, '239', 'Indefinido', 'Tiempo parcial', 'Discapacitados/ Transformación contrato temporal'),
  (104, '250', 'Indefinido', 'Tiempo parcial', 'Fomento contratación indefinida/ Inicial'),
  (105, '289', 'Indefinido', 'Tiempo parcial', 'Transformación contrato temporal'),
  (106, '300', 'Indefinido', 'Fijo discontinuo', 'Ordinario'),
  (107, '309', 'Indefinido', 'Fijo discontinuo', 'Fomento contratación indefinida/ Transformación contrato temporal'),
  (108, '330', 'Indefinido', 'Fijo discontinuo', 'Discapacitados'),
  (109, '339', 'Indefinido', 'Tiempo parcial', 'Discapacitados/ Transformación contrato temporal'),
  (110, '350', 'Indefinido', 'Fijo discontinuo', 'Fomento contratación indefinida/ Inicial'),
  (111, '389', 'Indefinido', 'Fijo discontinuo', 'Transformación contrato temporal'),
  (112, '401', 'Duración determinada', 'Tiempo completo', 'Obra o servicio determinado'),
  (113, '402', 'Duración determinada', 'Tiempo completo', 'Eventual circunstancias de la producción'),
  (114, '403', 'Duración determinada', 'Tiempo completo', 'Inserción'),
  (115, '408', 'Temporal', 'Tiempo completo', 'Carácter administrativo'),
  (116, '410', 'Duración determinada', 'Tiempo completo', 'Interinidad'),
  (117, '418', 'Duración determinada', 'Tiempo completo', 'Interinidad/ Carácter administrativo'),
  (118, '420', 'Temporal', 'Tiempo Completo', 'Prácticas'),
  (119, '421', 'Temporal', ' tiempo completo', 'Formación y aprendizaje'),
  (120, '430', 'Temporal', ' tiempo completo', 'Discapacitados'),
  (121, '441', 'Temporal', ' tiempo completo', 'Relevo'),
  (122, '450', 'Temporal', ' tiempo completo', 'Fomento contratación indefinida'),
  (123, '452', 'Temporal', 'Tiempo completo', 'Empresas de inserción'),
  (124, '501', 'Duración determinada', ' tiempo parcial', 'Obra o servicio determinado'),
  (125, '502', 'Duración determinada', ' tiempo parcial', 'Eventual circunstancias de la producción'),
  (126, '503', 'Duración determinada', 'Tiempo parcial', 'Inserción'),
  (127, '508', 'Temporal', 'Tiempo parcial', 'Carácter administrativo'),
  (128, '510', 'Duración determinada', ' tiempo parcial', 'Interinidad'),
  (129, '518', 'Duración determinada', 'Tiempo parcial', 'Interinidad/ Carácter administrativo'),
  (130, '520', 'Temporal', 'Tiempo parcial', 'Prácticas'),
  (131, '530', 'Temporal', 'Tiempo parcial', 'Discapacitados'),
  (132, '540', 'Temporal', 'Tiempo parcial', 'Jubilado parcial'),
  (133, '541', 'Temporal', 'Tiempo parcial', 'Relevo'),
  (134, '550', 'Temporal', 'Tiempo parcial', 'Fomento contratación indefinida'),
  (135, '552', 'Temporal', 'Tiempo parcial', 'Empresas de inserción')
on conflict (id) do update set
  clave = excluded.clave,
  duracion = excluded.duracion,
  jornada = excluded.jornada,
  descripcion = excluded.descripcion;

alter table public.historiales_laborales_contratos enable row level security;

grant select, insert, update, delete on public.historiales_laborales_contratos to authenticated;

drop policy if exists "authenticated_can_read_contratos_laborales" on public.historiales_laborales_contratos;
drop policy if exists "authenticated_can_read_historiales_laborales_contratos" on public.historiales_laborales_contratos;
create policy "authenticated_can_read_historiales_laborales_contratos"
on public.historiales_laborales_contratos
for select
to authenticated
using (true);

drop policy if exists "authenticated_can_insert_contratos_laborales" on public.historiales_laborales_contratos;
drop policy if exists "authenticated_can_insert_historiales_laborales_contratos" on public.historiales_laborales_contratos;
create policy "authenticated_can_insert_historiales_laborales_contratos"
on public.historiales_laborales_contratos
for insert
to authenticated
with check (true);

drop policy if exists "authenticated_can_update_contratos_laborales" on public.historiales_laborales_contratos;
drop policy if exists "authenticated_can_update_historiales_laborales_contratos" on public.historiales_laborales_contratos;
create policy "authenticated_can_update_historiales_laborales_contratos"
on public.historiales_laborales_contratos
for update
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated_can_delete_contratos_laborales" on public.historiales_laborales_contratos;
drop policy if exists "authenticated_can_delete_historiales_laborales_contratos" on public.historiales_laborales_contratos;
create policy "authenticated_can_delete_historiales_laborales_contratos"
on public.historiales_laborales_contratos
for delete
to authenticated
using (true);
