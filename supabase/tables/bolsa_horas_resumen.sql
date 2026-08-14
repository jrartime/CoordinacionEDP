-- Resumen de la bolsa de horas de una persona en un intervalo, para el
-- botón "Bolsa de horas" -> imagen resumen de la pestaña Registros
-- (drawRecordsBolsaSummaryImage en app.js).
--
--   saldo_inicial = saldo acumulado justo ANTES de p_desde (todos los
--                    movimientos con fecha < p_desde).
--   entrada       = horas metidas en la bolsa (BOLSA_ENTRA) DENTRO del
--                    intervalo [p_desde, p_hasta].
--   salida        = horas pagadas con la bolsa (BOLSA_SALE, en positivo)
--                    DENTRO del intervalo.
--   saldo_final   = saldo acumulado hasta p_hasta inclusive (debe cumplir
--                    saldo_inicial + entrada - salida = saldo_final; se
--                    calcula por separado, no restando, para que sirva de
--                    comprobación cruzada si algún día hay un movimiento sin
--                    fecha coherente).
--
-- SECURITY INVOKER: respeta el RLS de registros/registro_apuntes tal cual lo
-- tenga quien llame (un coordinador solo ve lo de sus contratos).
create or replace function public.get_bolsa_resumen(
  p_personal_id integer,
  p_desde date,
  p_hasta date
)
returns table (
  saldo_inicial numeric,
  entrada numeric,
  salida numeric,
  saldo_final numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    coalesce((
      select sum(a.cantidad)
      from public.registro_apuntes a
      join public.registros r on r.id = a.registro_id
      where r.personal_id = p_personal_id
        and r.fecha < p_desde
        and a.movimiento in ('BOLSA_ENTRA', 'BOLSA_SALE')
    ), 0)::numeric as saldo_inicial,
    coalesce((
      select sum(a.cantidad)
      from public.registro_apuntes a
      join public.registros r on r.id = a.registro_id
      where r.personal_id = p_personal_id
        and r.fecha >= p_desde and r.fecha <= p_hasta
        and a.movimiento = 'BOLSA_ENTRA'
    ), 0)::numeric as entrada,
    coalesce((
      select sum(abs(a.cantidad))
      from public.registro_apuntes a
      join public.registros r on r.id = a.registro_id
      where r.personal_id = p_personal_id
        and r.fecha >= p_desde and r.fecha <= p_hasta
        and a.movimiento = 'BOLSA_SALE'
    ), 0)::numeric as salida,
    coalesce((
      select sum(a.cantidad)
      from public.registro_apuntes a
      join public.registros r on r.id = a.registro_id
      where r.personal_id = p_personal_id
        and r.fecha <= p_hasta
        and a.movimiento in ('BOLSA_ENTRA', 'BOLSA_SALE')
    ), 0)::numeric as saldo_final;
$$;

revoke all on function public.get_bolsa_resumen(integer, date, date) from public;
grant execute on function public.get_bolsa_resumen(integer, date, date) to authenticated;
