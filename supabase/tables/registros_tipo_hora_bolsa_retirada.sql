-- La bolsa de horas ya no vive en registros.tipo_hora_id (BIN=7 entra, BOUT=8
-- sale): los movimientos de bolsa son apuntes en registro_apuntes
-- (movimiento='BOLSA_ENTRA'/'BOLSA_SALE'), decoupled de la fila de registros
-- que los origina. Ver registro_apuntes.sql y nomina_calculo.sql.
--
-- Este CHECK impide que una fila nueva (o una edición) vuelva a colar
-- tipo_hora_id 7/8 en registros -- por script, por SQL directo o por un olvido
-- en el frontend. NOT VALID porque el histórico ya migrado no tiene ninguna
-- fila así, pero por si quedara alguna suelta no bloquea el despliegue.
alter table public.registros
  drop constraint if exists registros_tipo_hora_no_bolsa,
  add constraint registros_tipo_hora_no_bolsa
    check (tipo_hora_id is null or tipo_hora_id not in (7, 8)) not valid;
