-- Vista de solo lectura para el enlace vivo Excel <-> personal (Power Query).
-- Solo la lee la Edge Function `personal-excel` (service_role); anon/authenticated sin acceso.
create or replace view public.personal_excel
with (security_invoker = true) as
select id, personal, genero, dni, email
from public.personal
where persona = true;

revoke all on public.personal_excel from public, anon, authenticated;
grant select on public.personal_excel to service_role;
