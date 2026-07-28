-- Copia de seguridad de la limpieza de horas en registros CAMB/LG (2026-07-28).
--
-- CAMB (el turno lo cubrio otro) y LG (licencia) significan que esa persona no
-- hace ese turno, asi que se guarda el horario pero las horas van vacias. Estas
-- 16 filas venian de importaciones que dejaron las horas puestas, y por eso se
-- marcaban como solape sin serlo (caso de referencia: David Tella, 08/07/2026).
--
-- Ninguna estaba incluida en una nomina emitida cuando se limpiaron.
-- Ejecutar SOLO si hay que deshacer aquella limpieza.

update registros set horas=1, facturar=true, abonar=true where id=680519;
update registros set horas=6.75, facturar=false, abonar=false where id=695547;
update registros set horas=6.75, facturar=false, abonar=false where id=695562;
update registros set horas=6.75, facturar=false, abonar=false where id=695567;
update registros set horas=6.75, facturar=false, abonar=false where id=695568;
update registros set horas=4.75, facturar=false, abonar=false where id=697221;
update registros set horas=4.75, facturar=false, abonar=false where id=697222;
update registros set horas=5.75, facturar=false, abonar=false where id=697224;
update registros set horas=5.75, facturar=false, abonar=false where id=697226;
update registros set horas=5.75, facturar=false, abonar=false where id=697227;
update registros set horas=5.75, facturar=false, abonar=false where id=697237;
update registros set horas=5.75, facturar=false, abonar=false where id=697240;
update registros set horas=5.75, facturar=false, abonar=false where id=697241;
update registros set horas=5.75, facturar=false, abonar=false where id=697242;
update registros set horas=6, facturar=false, abonar=false where id=701416;
update registros set horas=6, facturar=false, abonar=false where id=701418;
