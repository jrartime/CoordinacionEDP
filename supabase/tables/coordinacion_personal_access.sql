alter table public.personal enable row level security;

grant select, insert, update on public.personal to authenticated;

create or replace function public.can_manage_coordinacion_personal(
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.is_coordinacion_admin(p_user_id), false)
    or (
      public.get_coordinacion_user_role(p_user_id) in ('coordinator', 'area_coordinator')
      and public.can_access_coordinacion_pestana('personal', p_user_id)
    );
$$;

revoke all on function public.can_manage_coordinacion_personal(uuid) from public;
grant execute on function public.can_manage_coordinacion_personal(uuid) to authenticated;

drop policy if exists "authenticated_can_read_personal" on public.personal;
create policy "authenticated_can_read_personal"
on public.personal
for select
to authenticated
using (true);

drop policy if exists "authenticated_can_insert_personal" on public.personal;
create policy "authenticated_can_insert_personal"
on public.personal
for insert
to authenticated
with check (public.can_manage_coordinacion_personal());

drop policy if exists "authenticated_can_update_personal" on public.personal;
create policy "authenticated_can_update_personal"
on public.personal
for update
to authenticated
using (public.can_manage_coordinacion_personal())
with check (public.can_manage_coordinacion_personal());
