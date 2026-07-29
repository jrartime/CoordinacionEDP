-- Limpieza de índices duplicados y no usados
-- ------------------------------------------
-- APLICADO EN PRODUCCIÓN el 29/07/2026: 488 MB -> 359 MB (índices 257 -> 128 MB).
--
-- Diagnóstico (29/07/2026): la base ocupaba 488 MB, de los cuales 257 MB eran
-- índices y solo 214 MB datos. La causa es histórica: al renombrar las tablas
-- (`horas` -> `registros`, `tbl_registros` -> `registros` -> `registros_horarios`,
-- `conciliausuarios` -> `concilia_usuarios`) los índices antiguos NO se
-- renombraron, y al reejecutar el DDL con los nombres nuevos se crearon copias
-- exactas. En `registros_horarios` llegó a haber TRES copias del mismo índice.
--
-- Cada bloque deja siempre la copia con más usos según pg_stat_user_indexes.
-- Ninguno de los índices que se borran es PRIMARY KEY ni UNIQUE, así que no hay
-- pérdida de integridad: son puramente de rendimiento y se pueden recrear.
--
-- Orden recomendado: ejecutar el paso 1 (drops) ANTES del paso 2 (reindex),
-- porque REINDEX necesita espacio libre temporal para construir el índice nuevo
-- antes de soltar el viejo.

-- ============================================================
-- Paso 1a. Copias exactas de índices en `registros` (nombres `horas_*`)
-- ============================================================
drop index if exists public.horas_personal_fecha_idx;      -- = registros_personal_fecha_idx
drop index if exists public.horas_instalacion_fecha_idx;   -- = registros_instalacion_fecha_idx
drop index if exists public.horas_contrato_fecha_idx;      -- = registros_contrato_fecha_idx
drop index if exists public.horas_actividad_id_idx;        -- = registros_actividad_id_idx
drop index if exists public.horas_tipo_hora_id_idx;        -- = registros_tipo_hora_id_idx
drop index if exists public.horas_situacion_id_idx;        -- = registros_situacion_id_idx
-- Se conservan `horas_fecha_hora_id_idx` (orden del listado) y
-- `horas_puesto_fecha_idx`: son los únicos con esa definición, no hay copia.

-- ============================================================
-- Paso 1b. Copias exactas en `registros_horarios` (nombres `registros_*` y `tbl_registros_*`)
-- ============================================================
drop index if exists public.registros_fecha_hora_id_idx;
drop index if exists public.tbl_registros_fecha_hora_id_idx;
drop index if exists public.registros_dni_fecha_idx;
drop index if exists public.tbl_registros_dni_fecha_idx;
drop index if exists public.registros_centro_fecha_idx;
drop index if exists public.tbl_registros_centro_fecha_idx;
drop index if exists public.registros_puesto_fecha_idx;
drop index if exists public.tbl_registros_puesto_fecha_idx;
-- Quedan los `registros_horarios_*`, que son los que usa la app.

-- ============================================================
-- Paso 1c. Copias exactas en `concilia_usuarios` (nombres `conciliausuarios_*`)
-- ============================================================
drop index if exists public.conciliausuarios_centro_semana_alumnado_idx;
drop index if exists public.conciliausuarios_mail_idx;
drop index if exists public.conciliausuarios_alumnado_idx;
drop index if exists public.conciliausuarios_codigo_persona_idx;
drop index if exists public.conciliausuarios_centro_idx;
drop index if exists public.conciliausuarios_semana_idx;
-- OJO: `conciliausuarios_codigo_clase_persona_semana_key` y `conciliausuarios_pkey`
-- son constraints (UNIQUE / PK) y NO se tocan aunque tengan el nombre antiguo.

-- ============================================================
-- Paso 1d. Copias exactas en `historiales_laborales` (nombres `idx_*`)
-- ============================================================
drop index if exists public.idx_historiales_laborales_fecha_alta;
drop index if exists public.idx_historiales_laborales_fecha_baja;
drop index if exists public.idx_historiales_laborales_empresa_id;
drop index if exists public.idx_historiales_laborales_tipo_contrato_id;  -- = ..._contrato_laboral_id_idx
drop index if exists public.idx_historiales_laborales_puesto_id;
drop index if exists public.idx_historiales_laborales_baja_id;           -- = ..._motivo_baja_id_idx
drop index if exists public.idx_historiales_laborales_pago_id;           -- = ..._modalidad_pago_id_idx
drop index if exists public.idx_historiales_laborales_contratacion_id;   -- = ..._tipo_contratacion_id_idx
drop index if exists public.idx_historiales_laborales_personal_id;
drop index if exists public.idx_historiales_laborales_activo;

-- ============================================================
-- Paso 1e. Copias exactas en tablas menores
-- ============================================================
drop index if exists public.idx_tbl_programacion_conserjes_tipo_fecha;
drop index if exists public.idx_tbl_programacion_conserjes_personal;
drop index if exists public.idx_tbl_programacion_conserjes_instalacion;
drop index if exists public.idx_tbl_programacion_conserjes_archived_at;
drop index if exists public.idx_tbl_instalaciones_activo;
drop index if exists public.historiales_laborales_contratos_lookup_clave_idx;
drop index if exists public.asignaciones_instalacion_id_idx;
-- NO tocar `programming_installations_name_unique` ni `programming_personnel_name_unique`:
-- aunque duplican a los `idx_*_name`, respaldan una constraint UNIQUE y Postgres
-- rechaza el DROP INDEX. Son 16 kB cada uno y garantizan que no se repitan nombres.

-- ============================================================
-- Paso 1f. Índices sin ninguna copia pero con CERO usos desde su creación
-- ============================================================
-- `cronos` se consulta siempre por fecha/centro/identificador normalizado; estos
-- cuatro nunca se han usado y la carga CSV los mantiene en cada inserción.
drop index if exists public.cronos_autorizacion_idx;
drop index if exists public.cronos_autorizacion_trim_idx;
drop index if exists public.cronos_documento_idx;
drop index if exists public.cronos_identificador_trim_idx;  -- el que sirve es cronos_identificador_ltrim_idx
-- FK a un catálogo pequeño y casi inmutable: sin índice, borrar una función
-- haría seq scan de `registros`, pero eso no ocurre en la práctica.
drop index if exists public.registros_funcion_id_idx;

-- ============================================================
-- Paso 2. Reconstruir los índices que quedan (recupera el hinchado por updates)
-- ============================================================
-- CONCURRENTLY no bloquea escrituras y no puede ir dentro de una transacción:
-- ejecutar estas líneas SUELTAS, una a una, no como bloque.
-- Empezar por los índices sueltos más gordos y solo después ir a por las tablas
-- enteras: cada REINDEX construye el índice nuevo antes de soltar el viejo, así
-- que hace falta margen libre y al principio no lo había.
reindex index concurrently public.horas_fecha_hora_id_idx;   -- 23 MB -> ~12 MB
reindex index concurrently public.horas_pkey;
reindex index concurrently public.registros_legacy_id_hora_uq;
reindex index concurrently public.registros_facetas_idx;
reindex index concurrently public.registros_personal_fecha_idx;
reindex table concurrently public.registro_apuntes;
reindex table concurrently public.registros_horarios;
reindex table concurrently public.registros;          -- barre los FK que faltaban
reindex table concurrently public.concilia_usuarios;
reindex table concurrently public.cronos;

-- ============================================================
-- Paso 3. Refrescar estadísticas
-- ============================================================
-- Ninguna tabla tenía `last_analyze`: solo las había tocado el autovacuum.
analyze public.registros;
analyze public.registro_apuntes;
analyze public.registros_horarios;
analyze public.cronos;
analyze public.concilia_usuarios;
analyze public.historiales_laborales;

-- ============================================================
-- Comprobación posterior
-- ============================================================
-- Que no queden restos de un REINDEX CONCURRENTLY interrumpido:
-- select i.relname from pg_index x join pg_class i on i.oid = x.indexrelid
--  where i.relname like '%ccnew%';

-- ============================================================
-- Detectar duplicados (ejecutar ANTES de crear cualquier índice nuevo)
-- ============================================================
-- Agrupa por la definición sin el nombre: dos índices con la misma firma son
-- intercambiables aunque se llamen distinto. `usos` viene de pg_stat_user_indexes,
-- que se reinicia con las estadísticas: un 0 recién reiniciado no prueba nada.
--
-- with idx as (
--   select t.relname tabla, i.relname indice,
--          regexp_replace(pg_get_indexdef(i.oid), '^CREATE (UNIQUE )?INDEX \S+ ON ', '') firma,
--          pg_relation_size(i.oid) bytes, coalesce(s.idx_scan, 0) usos
--     from pg_index x
--     join pg_class i on i.oid = x.indexrelid
--     join pg_class t on t.oid = x.indrelid
--     join pg_namespace n on n.oid = t.relnamespace
--     left join pg_stat_user_indexes s on s.indexrelid = x.indexrelid
--    where n.nspname = 'public'
-- )
-- select tabla, firma, count(*) copias,
--        string_agg(indice || ' [' || usos || ' usos]', ' | ' order by usos desc) detalle,
--        pg_size_pretty(sum(bytes) - max(bytes)) ahorro
--   from idx
--  group by tabla, firma having count(*) > 1
--  order by sum(bytes) - max(bytes) desc;

-- select pg_size_pretty(pg_database_size(current_database()));
-- select relname, pg_size_pretty(pg_total_relation_size(c.oid))
--   from pg_class c join pg_namespace n on n.oid = c.relnamespace
--  where n.nspname = 'public' and c.relkind = 'r'
--  order by pg_total_relation_size(c.oid) desc limit 10;
