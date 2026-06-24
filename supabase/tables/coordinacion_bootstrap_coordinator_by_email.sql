insert into public.coordinacion_usuarios (user_id, rol, nombre, activo)
select
  u.id,
  'coordinator',
  coalesce(u.email, 'Administrador'),
  true
from auth.users u
where lower(u.email) = lower('coordinacion@conciliaoviedo.es')
on conflict (user_id) do update set
  rol = 'coordinator',
  nombre = coalesce(excluded.nombre, public.coordinacion_usuarios.nombre),
  activo = true,
  updated_at = now();

insert into public.coordinacion_usuario_pestanas (user_id, pestana)
select
  u.id,
  tabs.pestana
from auth.users u
cross join (
  values
    ('programming'),
    ('control'),
    ('events'),
    ('concilia'),
    ('personal'),
    ('contracts'),
    ('settings'),
    ('actividades')
) as tabs(pestana)
where lower(u.email) = lower('coordinacion@conciliaoviedo.es')
on conflict (user_id, pestana) do nothing;
