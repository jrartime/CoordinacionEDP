create table if not exists public.contratos_laborales (
  id integer primary key,
  clave text not null,
  duracion text not null,
  jornada text not null,
  descripcion text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contratos_laborales_clave_unique unique (clave)
);

create index if not exists contratos_laborales_lookup_clave_idx
on public.contratos_laborales (clave);

create or replace function public.set_contratos_laborales_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_contratos_laborales_updated_at on public.contratos_laborales;
create trigger set_contratos_laborales_updated_at
before update on public.contratos_laborales
for each row
execute function public.set_contratos_laborales_updated_at();

insert into public.contratos_laborales (
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

alter table public.contratos_laborales enable row level security;

drop policy if exists "authenticated_can_read_contratos_laborales" on public.contratos_laborales;
create policy "authenticated_can_read_contratos_laborales"
on public.contratos_laborales
for select
to authenticated
using (true);

drop policy if exists "authenticated_can_insert_contratos_laborales" on public.contratos_laborales;
create policy "authenticated_can_insert_contratos_laborales"
on public.contratos_laborales
for insert
to authenticated
with check (true);

drop policy if exists "authenticated_can_update_contratos_laborales" on public.contratos_laborales;
create policy "authenticated_can_update_contratos_laborales"
on public.contratos_laborales
for update
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated_can_delete_contratos_laborales" on public.contratos_laborales;
create policy "authenticated_can_delete_contratos_laborales"
on public.contratos_laborales
for delete
to authenticated
using (true);
