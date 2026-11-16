-- Candidaturas marcadas como "interesantes" por cada coordinador/administrador.
-- Una marca por (candidatura, usuario): cada persona ve las suyas y los nombres de
-- quien más la ha marcado, sin que una marca excluya a las demás.
-- Esquema coordinacion (proyecto Portal Laboral).
create table if not exists coordinacion.candidates_interes (
  candidate_id uuid not null references coordinacion.candidates (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  user_nombre text,
  created_at timestamptz not null default now(),
  primary key (candidate_id, user_id)
);

create index if not exists candidates_interes_user_idx on coordinacion.candidates_interes (user_id);

-- El nombre se congela al marcar: coordinacion_usuarios solo la lee su dueño o un admin,
-- así que el resto de coordinadores no podría resolverlo después.
create or replace function coordinacion.candidates_interes_nombre() returns trigger
language plpgsql security definer set search_path = coordinacion as $$
begin
  new.user_nombre := coalesce(
    (select nullif(btrim(cu.nombre), '') from coordinacion.coordinacion_usuarios cu where cu.user_id = new.user_id),
    (select split_part(u.email, '@', 1) from auth.users u where u.id = new.user_id)
  );
  return new;
end $$;

drop trigger if exists trg_candidates_interes_nombre on coordinacion.candidates_interes;
create trigger trg_candidates_interes_nombre
  before insert on coordinacion.candidates_interes
  for each row execute function coordinacion.candidates_interes_nombre();

alter table coordinacion.candidates_interes enable row level security;
grant select, insert, delete on coordinacion.candidates_interes to authenticated;

drop policy if exists candidates_interes_read on coordinacion.candidates_interes;
create policy candidates_interes_read on coordinacion.candidates_interes
  for select to authenticated
  using (coordinacion.can_access_coordinacion_pestana('search'));

drop policy if exists candidates_interes_insert on coordinacion.candidates_interes;
create policy candidates_interes_insert on coordinacion.candidates_interes
  for insert to authenticated
  with check (user_id = auth.uid() and coordinacion.can_access_coordinacion_pestana('search'));

drop policy if exists candidates_interes_delete on coordinacion.candidates_interes;
create policy candidates_interes_delete on coordinacion.candidates_interes
  for delete to authenticated
  using (user_id = auth.uid());

notify pgrst, 'reload schema';
