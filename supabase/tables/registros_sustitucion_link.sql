-- Enlace duro entre la fila del sustituto y la fila original del titular.
-- La fila del sustituto (sustitucion = true) apunta con sustituye_registro_id
-- al id del registro del titular ausente. Permite agrupar, sincronizar y
-- deshacer la sustitucion de forma fiable (no por texto).
alter table public.registros
  add column if not exists sustituye_registro_id bigint;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'registros_sustituye_registro_id_fkey'
      and conrelid = 'public.registros'::regclass
  ) then
    alter table public.registros
      add constraint registros_sustituye_registro_id_fkey
      foreign key (sustituye_registro_id)
      references public.registros (id)
      on update cascade
      on delete set null
      not valid;
  end if;
end $$;

create index if not exists registros_sustituye_registro_id_idx
  on public.registros (sustituye_registro_id);

comment on column public.registros.sustituye_registro_id is
  'Si el registro es de un sustituto, apunta al registro original del titular al que sustituye.';
