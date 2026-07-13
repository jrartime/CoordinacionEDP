-- ============================================================================
--  cronos_banco: movimientos bancarios (TPV) exportados del sistema Cronos.
-- ----------------------------------------------------------------------------
--  Una fila = una operacion de pago. cod_pedido enlaza con Cronos:
--  cronos.identificador (normalizado sin ceros a la izquierda).
--  Misma politica de RLS que cronos (admin o pestana 'contabilidad'). La carga
--  se hace con scripts/import_cronos_banco.py (service key); la app solo lee.
-- ============================================================================

create table if not exists public.cronos_banco (
  id bigint generated always as identity primary key,
  id_origen bigint unique,        -- "Id" de Cronos (clave natural para upsert)
  fecha date,
  hora time,
  terminal integer,
  tipo_operacion text,
  cod_pedido bigint,              -- enlaza con cronos.identificador
  resultado text,
  importe numeric,
  moneda text,
  importe_euros numeric,
  cierre_sesion text,
  tipo_pago text,
  tipo_pago_original text,
  tarjeta text,
  titular text,
  cod_error text,
  created_at timestamptz not null default now()
);

create index if not exists cronos_banco_fecha_idx on public.cronos_banco (fecha);
create index if not exists cronos_banco_tipo_operacion_idx on public.cronos_banco (tipo_operacion);
create index if not exists cronos_banco_tipo_pago_idx on public.cronos_banco (tipo_pago);
create index if not exists cronos_banco_cod_pedido_idx on public.cronos_banco (cod_pedido);

alter table public.cronos_banco enable row level security;
grant select, insert, update, delete on public.cronos_banco to authenticated;

drop policy if exists "cronos_banco_read" on public.cronos_banco;
create policy "cronos_banco_read"
on public.cronos_banco
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
drop policy if exists "cronos_banco_admin_write" on public.cronos_banco;
create policy "cronos_banco_admin_write"
on public.cronos_banco
for all
to authenticated
using (public.is_coordinacion_admin())
with check (public.is_coordinacion_admin());

-- ----------------------------------------------------------------------------
--  Funciones de apoyo. SECURITY DEFINER + guard de autorizacion una vez (no por
--  fila): evita el statement timeout de evaluar el RLS sobre decenas de miles de
--  filas. Acceso "todo o nada", equivalente al RLS. Ver cronos.sql.
-- ----------------------------------------------------------------------------

create or replace function public.get_cronos_banco_filtros()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select case
    when public.is_coordinacion_admin()
      or exists (select 1 from public.coordinacion_usuario_pestanas cup
                 where cup.user_id = auth.uid() and cup.pestana = 'contabilidad')
    then json_build_object(
      'tipos_operacion', (select coalesce(json_agg(x), '[]'::json)
                  from (select distinct tipo_operacion as x from public.cronos_banco where tipo_operacion is not null order by 1) a),
      'tipos_pago', (select coalesce(json_agg(x), '[]'::json)
                  from (select distinct tipo_pago as x from public.cronos_banco where tipo_pago is not null order by 1) b),
      'terminales', (select coalesce(json_agg(x), '[]'::json)
                  from (select distinct terminal as x from public.cronos_banco where terminal is not null order by 1) c)
    )
    else json_build_object('tipos_operacion', '[]'::json, 'tipos_pago', '[]'::json, 'terminales', '[]'::json)
  end;
$$;

create or replace function public.get_cronos_banco_resumen(
  p_desde date default null,
  p_hasta date default null,
  p_estado text default null,
  p_tipo_pago text default null,
  p_terminal integer default null,
  p_search text default null
)
returns table (
  total_operaciones bigint,
  total_importe numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    count(*)::bigint,
    coalesce(sum(importe_euros), 0)
  from public.cronos_banco
  where (select public.is_coordinacion_admin()
           or exists (select 1 from public.coordinacion_usuario_pestanas cup
                      where cup.user_id = auth.uid() and cup.pestana = 'contabilidad'))
    and (p_desde is null or fecha >= p_desde)
    and (p_hasta is null or fecha <= p_hasta)
    and (p_estado is null or resultado ilike p_estado || '%')
    and (p_tipo_pago is null or tipo_pago = p_tipo_pago)
    and (p_terminal is null or terminal = p_terminal)
    and (
      p_search is null
      or tarjeta ilike '%' || p_search || '%'
      or resultado ilike '%' || p_search || '%'
      or (p_search ~ '^[0-9]+$' and cod_pedido = p_search::bigint)
    );
$$;

-- Pagina de movimientos para evitar evaluar RLS fila a fila desde PostgREST.
drop function if exists public.get_cronos_banco_page(date, date, text, text, integer, text, integer, integer);

create or replace function public.get_cronos_banco_page(
  p_desde date default null,
  p_hasta date default null,
  p_estado text default null,
  p_tipo_pago text default null,
  p_terminal integer default null,
  p_search text default null,
  p_offset integer default 0,
  p_limit integer default 100
)
returns table (
  id bigint,
  fecha date,
  hora time,
  cod_pedido bigint,
  resultado text,
  importe_euros numeric,
  moneda text,
  tipo_pago text,
  tarjeta text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    b.id,
    b.fecha,
    b.hora,
    b.cod_pedido,
    b.resultado,
    b.importe_euros,
    b.moneda,
    b.tipo_pago,
    b.tarjeta
  from public.cronos_banco b
  where (select public.is_coordinacion_admin()
           or exists (select 1 from public.coordinacion_usuario_pestanas cup
                      where cup.user_id = auth.uid() and cup.pestana = 'contabilidad'))
    and (p_desde is null or b.fecha >= p_desde)
    and (p_hasta is null or b.fecha <= p_hasta)
    and (p_estado is null or b.resultado ilike p_estado || '%')
    and (p_tipo_pago is null or b.tipo_pago = p_tipo_pago)
    and (p_terminal is null or b.terminal = p_terminal)
    and (
      p_search is null
      or b.tarjeta ilike '%' || p_search || '%'
      or b.resultado ilike '%' || p_search || '%'
      or (p_search ~ '^[0-9]+$' and b.cod_pedido = p_search::bigint)
    )
  order by b.fecha desc nulls last, b.hora desc nulls last, b.id desc
  offset greatest(coalesce(p_offset, 0), 0)
  limit greatest(1, least(coalesce(p_limit, 100), 500));
$$;

-- Resultados conciliados: banco como base, enlazado con cronos.identificador.
drop function if exists public.get_cronos_resultados(date, date, text, boolean, text, integer, integer);

create or replace function public.get_cronos_resultados(
  p_desde date default null,
  p_hasta date default null,
  p_resultado text default null,
  p_anulado boolean default null,
  p_search text default null,
  p_vista text default 'detalle',
  p_offset integer default 0,
  p_limit integer default 100
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
    select
      greatest(coalesce(p_offset, 0), 0) as row_offset,
      greatest(1, least(coalesce(p_limit, 100), 5000)) as row_limit,
      case when p_vista = 'resumen' then 'resumen' else 'detalle' end as vista
  ),
  banco_filtrado as (
    select
      b.id as banco_id,
      b.fecha,
      b.hora,
      b.tipo_operacion,
      b.cod_pedido,
      b.importe as banco_importe,
      b.importe_euros,
      b.resultado,
      b.terminal,
      b.tipo_pago,
      b.tarjeta
    from public.cronos_banco b
    where (select ok from autorizado)
      and (p_desde is null or b.fecha >= p_desde)
      and (p_hasta is null or b.fecha <= p_hasta)
      and (p_resultado is null or b.resultado ilike p_resultado || '%')
  ),
  detalle as (
    select
      b.banco_id,
      b.fecha,
      b.hora,
      b.tipo_operacion,
      b.cod_pedido,
      b.banco_importe,
      b.importe_euros,
      c.cronos_id,
      c.identificador,
      c.tarifa,
      c.cantidad,
      c.cronos_importe,
      c.anulado
    from banco_filtrado b
    left join lateral (
      select
        c.id as cronos_id,
        c.identificador,
        c.tarifa,
        c.cantidad,
        c.importe as cronos_importe,
        c.anulado,
        c.numero_factura
      from public.cronos c
      where ltrim(trim(c.identificador), '0') = b.cod_pedido::text
        and (p_anulado is null or c.anulado = p_anulado)
    ) c on true
    where (
      (p_anulado is null or c.cronos_id is not null)
      and (
        p_search is null
      or b.cod_pedido::text = p_search
      or b.resultado ilike '%' || p_search || '%'
      or b.tarjeta ilike '%' || p_search || '%'
      or c.identificador ilike '%' || p_search || '%'
      or c.numero_factura ilike '%' || p_search || '%'
      )
    )
  ),
  resumen as (
    select
      (
        case extract(month from fecha)::integer
          when 1 then 'enero'
          when 2 then 'febrero'
          when 3 then 'marzo'
          when 4 then 'abril'
          when 5 then 'mayo'
          when 6 then 'junio'
          when 7 then 'julio'
          when 8 then 'agosto'
          when 9 then 'septiembre'
          when 10 then 'octubre'
          when 11 then 'noviembre'
          when 12 then 'diciembre'
        end
      ) || ' ' || extract(year from fecha)::integer as fecha_por_mes,
      tarifa,
      sum(cantidad) as unidades,
      sum(cronos_importe) as importe,
      extract(month from fecha)::integer as mes,
      extract(year from fecha)::integer as anio
    from detalle
    group by extract(year from fecha)::integer, extract(month from fecha)::integer, tarifa
  ),
  resultado_filtrado as (
    select row_to_json(d) as row_data, d.fecha, d.hora, d.banco_id, d.cronos_id, null::integer as anio, null::integer as mes
    from detalle d, params p
    where p.vista = 'detalle'
    union all
    select row_to_json(r) as row_data, null::date as fecha, null::time as hora, null::bigint as banco_id, null::bigint as cronos_id, r.anio, r.mes
    from resumen r, params p
    where p.vista = 'resumen'
    )
  select json_build_object(
    'vista', (select vista from params),
    'total', (select count(*) from resultado_filtrado),
    'total_banco_importe', (select coalesce(sum(banco_importe), 0) from banco_filtrado),
    'total_cronos_importe', (select coalesce(sum(cronos_importe), 0) from detalle),
    'limit', (select row_limit from params),
    'rows', (
      select coalesce(json_agg(x.row_data), '[]'::json)
      from (
        select row_data
        from resultado_filtrado, params
        order by
          case when (select vista from params) = 'detalle' then fecha end desc nulls last,
          case when (select vista from params) = 'detalle' then hora end desc nulls last,
          case when (select vista from params) = 'detalle' then banco_id end desc nulls last,
          case when (select vista from params) = 'detalle' then cronos_id end desc nulls last,
          case when (select vista from params) <> 'detalle' then anio end nulls last,
          case when (select vista from params) <> 'detalle' then mes end nulls last
        offset (select row_offset from params)
        limit (select row_limit from params)
      ) x
    )
  );
$$;

revoke all on function public.get_cronos_banco_filtros() from public;
revoke all on function public.get_cronos_banco_resumen(date, date, text, text, integer, text) from public;
revoke all on function public.get_cronos_banco_page(date, date, text, text, integer, text, integer, integer) from public;
drop function if exists public.get_cronos_resultados(date, date, text, boolean, text, integer, integer);
revoke all on function public.get_cronos_resultados(date, date, text, boolean, text, text, integer, integer) from public;
grant execute on function public.get_cronos_banco_filtros() to authenticated;
grant execute on function public.get_cronos_banco_resumen(date, date, text, text, integer, text) to authenticated;
grant execute on function public.get_cronos_banco_page(date, date, text, text, integer, text, integer, integer) to authenticated;
grant execute on function public.get_cronos_resultados(date, date, text, boolean, text, text, integer, integer) to authenticated;
