-- Impide crear o modificar registros incompletos sin bloquear el despliegue
-- por posibles filas históricas que ya tengan alguno de estos campos a null.
alter table public.registros
  drop constraint if exists registros_fecha_obligatoria,
  add constraint registros_fecha_obligatoria
    check (fecha is not null) not valid;

alter table public.registros
  drop constraint if exists registros_personal_obligatorio,
  add constraint registros_personal_obligatorio
    check (personal_id is not null) not valid;

alter table public.registros
  drop constraint if exists registros_puesto_obligatorio,
  add constraint registros_puesto_obligatorio
    check (puesto_id is not null) not valid;

alter table public.registros
  drop constraint if exists registros_funcion_obligatoria,
  add constraint registros_funcion_obligatoria
    check (funcion_id is not null) not valid;

