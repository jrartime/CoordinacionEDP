-- ============================================================================
--  cronos: apuntes de inscripciones/actividades exportados del sistema Cronos.
-- ----------------------------------------------------------------------------
--  Datos de contabilidad (una fila = un apunte). Contienen datos personales
--  (documento, email, telefono), por lo que la lectura esta acotada por RLS a
--  administradores o a usuarios con la pestana 'contabilidad' asignada.
--  La carga se hace con scripts/import_cronos.py usando la service key (que
--  salta el RLS); la app solo lee.
-- ============================================================================

create table if not exists public.cronos (
  id bigint generated always as identity primary key,
  id_origen bigint unique,        -- "Id" de Cronos (clave natural para upsert)
  apunte bigint,                  -- "Apunte"
  fecha date,
  hora time,
  codigo_tarifa text,
  tarifa text,
  temporada text,
  cantidad numeric,
  importe numeric,
  periodo_pago text,
  forma_pago text,
  tipo_apunte text,
  anulado boolean,
  prefijo_factura text,
  numero_factura text,
  operador text,
  maquina text,
  centro text,
  caja text,
  codigo_persona text,
  apellidos text,
  nombre text,
  documento text,
  sexo text,
  fecha_nac date,
  edad integer,
  telefono text,
  movil text,
  email text,
  servicio text,
  tipo_servicio text,
  periodo_clase text,
  concepto text,
  identificador text,
  autorizacion text,
  created_at timestamptz not null default now()
);

-- Indices para los filtros de la pestana Contabilidad.
create index if not exists cronos_fecha_idx on public.cronos (fecha);
create index if not exists cronos_centro_idx on public.cronos (centro);
create index if not exists cronos_tipo_servicio_idx on public.cronos (tipo_servicio);
create index if not exists cronos_forma_pago_idx on public.cronos (forma_pago);
create index if not exists cronos_anulado_idx on public.cronos (anulado);
create index if not exists cronos_documento_idx on public.cronos (documento);
create index if not exists cronos_autorizacion_idx on public.cronos (autorizacion);
create index if not exists cronos_autorizacion_trim_idx on public.cronos ((trim(autorizacion)));
create index if not exists cronos_identificador_idx on public.cronos (identificador);
create index if not exists cronos_identificador_trim_idx on public.cronos ((trim(identificador)));
create index if not exists cronos_identificador_ltrim_idx on public.cronos ((ltrim(trim(identificador), '0')));

alter table public.cronos enable row level security;

grant select, insert, update, delete on public.cronos to authenticated;

-- Lectura: administradores de coordinacion o usuarios con la pestana 'contabilidad'.
drop policy if exists "cronos_read" on public.cronos;
create policy "cronos_read"
on public.cronos
for select
to authenticated
using (
  public.is_coordinacion_admin()
  or exists (
    select 1
    from public.coordinacion_usuario_pestanas cup
    where cup.user_id = auth.uid()
      and cup.pestana = 'contabilidad'
  )
);

-- Escritura (carga/reemplazo de datos desde la app): solo administradores.
drop policy if exists "cronos_admin_write" on public.cronos;
create policy "cronos_admin_write"
on public.cronos
for all
to authenticated
using (public.is_coordinacion_admin())
with check (public.is_coordinacion_admin());

-- ----------------------------------------------------------------------------
--  Funciones de apoyo para la pestana Contabilidad.
--  SECURITY DEFINER + guard de autorizacion evaluado UNA vez (no por fila): el
--  acceso a Contabilidad es "todo o nada", asi que el guard equivale al RLS pero
--  evita evaluar la politica en cada una de las 100k+ filas (que provocaba
--  statement timeout en el cliente). set search_path = public por seguridad.
-- ----------------------------------------------------------------------------

-- Valores distintos para los desplegables de filtro.
-- Centro/tipo de servicio siguen siendo catalogos amplios; forma de pago y
-- anulado se facetaan con los filtros activos para evitar opciones sin resultado.
drop function if exists public.get_cronos_filtros();
create or replace function public.get_cronos_filtros(
  p_desde date default null,
  p_hasta date default null,
  p_centro text default null,
  p_tipo_servicio text default null,
  p_forma_pago text default null,
  p_anulado boolean default null,
  p_servicio text default null,
  p_search text default null,
  p_vinculado boolean default null
)
returns json
language sql
stable
security definer
set search_path = public
as $$
  with autorizado as (
    select public.is_coordinacion_admin()
      or exists (select 1 from public.coordinacion_usuario_pestanas cup
                 where cup.user_id = auth.uid() and cup.pestana = 'contabilidad') as ok
  )
  select case
    when (select ok from autorizado)
    then json_build_object(
      'centros', (select coalesce(json_agg(x), '[]'::json)
                  from (select distinct centro as x from public.cronos where centro is not null order by 1) c),
      'tipos_servicio', (select coalesce(json_agg(x), '[]'::json)
                  from (select distinct tipo_servicio as x from public.cronos where tipo_servicio is not null order by 1) t),
      'formas_pago', (
        select coalesce(json_agg(x), '[]'::json)
        from (
          select distinct forma_pago as x
          from public.cronos c
          where forma_pago is not null
            and (p_desde is null or c.fecha >= p_desde)
            and (p_hasta is null or c.fecha <= p_hasta)
            and (p_centro is null or c.centro = p_centro)
            and (p_tipo_servicio is null or c.tipo_servicio = p_tipo_servicio)
            and (p_anulado is null or c.anulado = p_anulado)
            and (p_servicio is null or c.servicio ilike '%' || p_servicio || '%')
            and (
              p_search is null
              or c.apellidos ilike '%' || p_search || '%'
              or c.nombre ilike '%' || p_search || '%'
              or c.documento ilike '%' || p_search || '%'
              or c.numero_factura ilike '%' || p_search || '%'
            )
            and (p_vinculado is null or
                 (case when ltrim(trim(c.identificador), '0') ~ '^[0-9]+$'
                       then exists (select 1 from public.cronos_banco b where b.cod_pedido::text = ltrim(trim(c.identificador), '0'))
                       else false end) = p_vinculado)
          order by 1
        ) f
      ),
      'anulados', (
        select coalesce(json_agg(x), '[]'::json)
        from (
          select distinct anulado as x
          from public.cronos c
          where anulado is not null
            and (p_desde is null or c.fecha >= p_desde)
            and (p_hasta is null or c.fecha <= p_hasta)
            and (p_centro is null or c.centro = p_centro)
            and (p_tipo_servicio is null or c.tipo_servicio = p_tipo_servicio)
            and (p_forma_pago is null or c.forma_pago = p_forma_pago)
            and (p_servicio is null or c.servicio ilike '%' || p_servicio || '%')
            and (
              p_search is null
              or c.apellidos ilike '%' || p_search || '%'
              or c.nombre ilike '%' || p_search || '%'
              or c.documento ilike '%' || p_search || '%'
              or c.numero_factura ilike '%' || p_search || '%'
            )
            and (p_vinculado is null or
                 (case when ltrim(trim(c.identificador), '0') ~ '^[0-9]+$'
                       then exists (select 1 from public.cronos_banco b where b.cod_pedido::text = ltrim(trim(c.identificador), '0'))
                       else false end) = p_vinculado)
          order by 1
        ) a
      )
    )
    else json_build_object('centros', '[]'::json, 'tipos_servicio', '[]'::json, 'formas_pago', '[]'::json, 'anulados', '[]'::json)
  end;
$$;

-- Totales del filtro actual (conteo + suma de importe, total y sin anulados).
create or replace function public.get_cronos_resumen(
  p_desde date default null,
  p_hasta date default null,
  p_centro text default null,
  p_tipo_servicio text default null,
  p_forma_pago text default null,
  p_anulado boolean default null,
  p_servicio text default null,
  p_search text default null,
  p_vinculado boolean default null
)
returns table (
  total_apuntes bigint,
  total_importe numeric,
  total_importe_activo numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    count(*)::bigint,
    coalesce(sum(importe), 0),
    coalesce(sum(importe) filter (where anulado is not true), 0)
  from public.cronos
  where (select public.is_coordinacion_admin()
           or exists (select 1 from public.coordinacion_usuario_pestanas cup
                      where cup.user_id = auth.uid() and cup.pestana = 'contabilidad'))
    and (p_desde is null or fecha >= p_desde)
    and (p_hasta is null or fecha <= p_hasta)
    and (p_centro is null or centro = p_centro)
    and (p_tipo_servicio is null or tipo_servicio = p_tipo_servicio)
    and (p_forma_pago is null or forma_pago = p_forma_pago)
    and (p_anulado is null or anulado = p_anulado)
    and (p_servicio is null or servicio ilike '%' || p_servicio || '%')
    and (
      p_search is null
      or apellidos ilike '%' || p_search || '%'
      or nombre ilike '%' || p_search || '%'
      or documento ilike '%' || p_search || '%'
      or numero_factura ilike '%' || p_search || '%'
    )
    -- vinculado: el identificador (numerico) coincide con algun cod_pedido de banco.
    and (p_vinculado is null or
         (case when ltrim(trim(identificador), '0') ~ '^[0-9]+$'
               then exists (select 1 from public.cronos_banco b where b.cod_pedido::text = ltrim(trim(cronos.identificador), '0'))
               else false end) = p_vinculado);
$$;

-- Pagina de apuntes para evitar evaluar RLS fila a fila desde PostgREST.
create or replace function public.get_cronos_page(
  p_desde date default null,
  p_hasta date default null,
  p_centro text default null,
  p_tipo_servicio text default null,
  p_forma_pago text default null,
  p_anulado boolean default null,
  p_servicio text default null,
  p_search text default null,
  p_vinculado boolean default null,
  p_offset integer default 0,
  p_limit integer default 100
)
returns table (
  id bigint,
  fecha date,
  hora time,
  centro text,
  servicio text,
  tipo_servicio text,
  tarifa text,
  cantidad numeric,
  importe numeric,
  forma_pago text,
  numero_factura text,
  anulado boolean,
  apellidos text,
  nombre text,
  documento text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.fecha,
    c.hora,
    c.centro,
    c.servicio,
    c.tipo_servicio,
    c.tarifa,
    c.cantidad,
    c.importe,
    c.forma_pago,
    c.numero_factura,
    c.anulado,
    c.apellidos,
    c.nombre,
    c.documento
  from public.cronos c
  where (select public.is_coordinacion_admin()
           or exists (select 1 from public.coordinacion_usuario_pestanas cup
                      where cup.user_id = auth.uid() and cup.pestana = 'contabilidad'))
    and (p_desde is null or c.fecha >= p_desde)
    and (p_hasta is null or c.fecha <= p_hasta)
    and (p_centro is null or c.centro = p_centro)
    and (p_tipo_servicio is null or c.tipo_servicio = p_tipo_servicio)
    and (p_forma_pago is null or c.forma_pago = p_forma_pago)
    and (p_anulado is null or c.anulado = p_anulado)
    and (p_servicio is null or c.servicio ilike '%' || p_servicio || '%')
    and (
      p_search is null
      or c.apellidos ilike '%' || p_search || '%'
      or c.nombre ilike '%' || p_search || '%'
      or c.documento ilike '%' || p_search || '%'
      or c.numero_factura ilike '%' || p_search || '%'
    )
    and (p_vinculado is null or
         (case when ltrim(trim(c.identificador), '0') ~ '^[0-9]+$'
               then exists (select 1 from public.cronos_banco b where b.cod_pedido::text = ltrim(trim(c.identificador), '0'))
               else false end) = p_vinculado)
  order by c.fecha desc nulls last, c.hora desc nulls last, c.id desc
  offset greatest(coalesce(p_offset, 0), 0)
  limit greatest(1, least(coalesce(p_limit, 100), 500));
$$;

-- Vista con columna calculada 'vinculado' (apunte con movimiento bancario). No la
-- usa la app (filtra vía los RPCs de arriba), pero documenta la logica y es util
-- para consultas ad-hoc. security_invoker => respeta el RLS de cronos.
drop view if exists public.cronos_detalle;
create view public.cronos_detalle as
select c.*,
  (case when ltrim(trim(c.identificador), '0') ~ '^[0-9]+$'
        then exists (select 1 from public.cronos_banco b where b.cod_pedido::text = ltrim(trim(c.identificador), '0'))
        else false end) as vinculado
from public.cronos c;
alter view public.cronos_detalle set (security_invoker = true);
grant select on public.cronos_detalle to authenticated;

revoke all on function public.get_cronos_filtros(date, date, text, text, text, boolean, text, text, boolean) from public;
revoke all on function public.get_cronos_resumen(date, date, text, text, text, boolean, text, text, boolean) from public;
revoke all on function public.get_cronos_page(date, date, text, text, text, boolean, text, text, boolean, integer, integer) from public;
grant execute on function public.get_cronos_filtros(date, date, text, text, text, boolean, text, text, boolean) to authenticated;
grant execute on function public.get_cronos_resumen(date, date, text, text, text, boolean, text, text, boolean) to authenticated;
grant execute on function public.get_cronos_page(date, date, text, text, text, boolean, text, text, boolean, integer, integer) to authenticated;

-- ----------------------------------------------------------------------------
--  Conciliacion Cronos vs Banco.
--  Relacion: cronos.identificador = cronos_banco.cod_pedido (normalizando ceros
--  a la izquierda en identificador).
--  Devuelve registros "viudos" de cada lado filtrados por la fecha de su propia
--  tabla. El limite evita respuestas demasiado grandes en el navegador; los
--  totales son exactos para que la UI avise si hay mas filas que las mostradas.
-- ----------------------------------------------------------------------------

create or replace function public.get_cronos_conciliacion(
  p_desde date default null,
  p_hasta date default null,
  p_limit integer default 500
)
returns json
language sql
stable
security definer
set search_path = public
as $$
  with autorizado as (
    select public.is_coordinacion_admin()
      or exists (
        select 1
        from public.coordinacion_usuario_pestanas cup
        where cup.user_id = auth.uid()
          and cup.pestana = 'contabilidad'
      ) as ok
  ),
  params as (
    select greatest(1, least(coalesce(p_limit, 500), 1000)) as row_limit
  ),
  cronos_viudos as (
    select
      c.id,
      c.fecha,
      c.hora,
      c.autorizacion,
      c.identificador,
      c.importe,
      c.forma_pago,
      c.numero_factura,
      c.anulado,
      c.apellidos,
      c.nombre,
      c.documento,
      c.servicio,
      c.centro
    from public.cronos c
    where (select ok from autorizado)
      and (p_desde is null or c.fecha >= p_desde)
      and (p_hasta is null or c.fecha <= p_hasta)
      and (
        nullif(ltrim(trim(c.identificador), '0'), '') is null
        or not exists (
          select 1
          from public.cronos_banco b
          where ltrim(trim(c.identificador), '0') = b.cod_pedido::text
        )
      )
  ),
  banco_viudos as (
    select
      b.id,
      b.fecha,
      b.hora,
      b.cod_pedido,
      b.terminal,
      b.tipo_operacion,
      b.resultado,
      b.importe_euros,
      b.moneda,
      b.tipo_pago,
      b.tarjeta
    from public.cronos_banco b
    where (select ok from autorizado)
      and (p_desde is null or b.fecha >= p_desde)
      and (p_hasta is null or b.fecha <= p_hasta)
      and (
        b.cod_pedido is null
        or not exists (
          select 1
          from public.cronos c
          where ltrim(trim(c.identificador), '0') = b.cod_pedido::text
        )
      )
  )
  select json_build_object(
    'cronos_total', (select count(*) from cronos_viudos),
    'banco_total', (select count(*) from banco_viudos),
    'limit', (select row_limit from params),
    'cronos', (
      select coalesce(json_agg(row_to_json(x)), '[]'::json)
      from (
        select *
        from cronos_viudos
        order by fecha desc nulls last, hora desc nulls last, id desc
        limit (select row_limit from params)
      ) x
    ),
    'banco', (
      select coalesce(json_agg(row_to_json(x)), '[]'::json)
      from (
        select *
        from banco_viudos
        order by fecha desc nulls last, hora desc nulls last, id desc
        limit (select row_limit from params)
      ) x
    )
  );
$$;

revoke all on function public.get_cronos_conciliacion(date, date, integer) from public;
grant execute on function public.get_cronos_conciliacion(date, date, integer) to authenticated;
