# CoordinacionEDP — Contexto para Claude

## Qué es este proyecto

Suite de cuatro aplicaciones web estáticas para **Educación Deportiva del Principado SL (EDP)**. Sin framework de build: HTML + JS vanilla + CSS puro. Backend: **Supabase** (Auth, PostgreSQL, Storage). Desplegadas en IONOS como subdominios de `edpsl.es`.

## Apps y subdominios

| Carpeta | Subdominio | Acceso |
|---|---|---|
| `coordinacion/` | `coordinacion.edpsl.es` | Privado (Supabase Auth) |
| `concilia/` | `concilia.edpsl.es` | Privado + `disponibilidad.html` pública |
| `curriculos/` | `curriculos.edpsl.es` | Formulario público + panel privado |
| `programacion/` | `programacion.edpsl.es` | Público |

## Estructura de carpetas

```
coordinacion/          # App principal — panel de coordinación
  modules/             # Módulos JS: candidates, constants, control, events, supabase, utils
  concilia-integrated.{js,css}  # Concilia integrado dentro de coordinación
concilia/              # App Concilia independiente
curriculos/            # App candidaturas
programacion/          # App programación pública
shared/                # supabase-client.js y auth.js — compartidos por todas las apps
publish/               # Copias listas para subir a IONOS (generadas por publish.ps1)
supabase/              # Esquema SQL, tablas, policies, seeds
  tables/              # DDL de cada tabla
  policies/            # RLS policies
scripts/               # Utilidades PowerShell y Python
  publish.ps1          # Genera publish/ desde los fuentes
  check.ps1            # Comprobaciones pre-deploy
  *.py                 # Importación/exportación de datos CSV ↔ Supabase
exports/               # CSVs exportados de Supabase para importación/referencia
```

## Módulos de Coordinación (pestañas del panel privado)

- **Programación** — `programacion_conserjes`: carga CSV/Word, asignación masiva, archivado, exportación PDF/CSV/imágenes.
- **Control personal** — Partes de horas: carga, filtros, resumen por persona, borrado selectivo.
- **Eventos deportivos** — CRUD con cronograma de pasos y asignación de personal de montaje.
- **Candidaturas** — Tabla `candidates`: filtros, paginación, etiquetas, exportación.
- **Personal** — Fichas de `tbl_personal`.
- **Contratos** — `tbl_contratos`.
- **Actividades** — Actividades laborales por contrato (compartido con Concilia).
- **Registros** — Detalle de jornadas generado desde actividades. Filtros cruzados por contrato/servicio/personal/instalación, edición tipo Excel, selección manual para asignación/borrado masivo y coherencia servicio/contrato.
- **Gestión** — Pestaña transversal que cruza historiales laborales y registros por intervalo de fechas. Filtros de fecha (Desde/Hasta) y personal (solo personas con registros en el intervalo); muestra los historiales laborales solapados (alta/baja, jornada/jornada máxima, coeficiente de temporalidad ‰) y un pivote de horas de registros (filas puesto×situación, columnas tipo de hora). Agregados server-side (`get_gestion_registros_resumen`, `get_gestion_personal`).
- **Contabilidad** — Apuntes del sistema Cronos (`cronos`) con subpestañas **Apuntes**, **Banco** (`cronos_banco`, movimientos TPV), **Resultados** (Banco como base enlazado con `cronos.identificador`) y **Conciliación** (apuntes/movimientos sin pareja). Paginación y agregados server-side; filtros por fecha/centro/tipo/forma de pago/etc.; botón "Cargar CSV" en Apuntes/Banco que reemplaza los datos por rango de fechas. Solo lectura salvo carga (admin).
- **Accesos** — Usuarios, roles y servicios.
- **Concilia** (integrado) — Las 5 pestañas de Concilia dentro de Coordinación vía `concilia-integrated.js`.

## Módulos de Concilia

- **Alumnado** — CRUD de alumnos con resumen semanal por centro.
- **Asistencia** — Pase de lista L/M/X/J/V por centro y semana.
- **NEE** — Necesidades educativas especiales.
- **Disponibilidad** — Disponibilidad del personal por semanas (01–11). Página pública en `disponibilidad.html`.
- **Actividades** — Por personal/contrato/instalación con informes PDF/Excel.
- **Asignaciones** — Matriz instalación × semana, hasta 20 personas por celda.

## Flujo de despliegue

1. Editar en `coordinacion/`, `concilia/`, `curriculos/` o `programacion/`.
2. Ejecutar `.\scripts\publish.ps1` — copia archivos a `publish/` y reescribe rutas `../shared/` → `./shared/`.
   - Usar `-SkipConfig` para no sobreescribir los `config.js` ya editados en `publish/`.
3. Verificar con `.\scripts\check.ps1`.
4. Subir la carpeta `publish/<app>/` al document root del subdominio correspondiente en IONOS.

## Configuración de Supabase

Cada app tiene su propio `config.js` (no versionado en producción):

```js
window.APP_CONFIG = {
  supabase: {
    url: "https://<proyecto>.supabase.co",
    anonKey: "<anon-key>",
    bucket: "candidate-cvs",
  },
};
```

El login usa Supabase Auth. No hay contraseñas locales en el código.

### Supabase Coordinación

- `registros` está scoped por contrato asignado mediante RLS (`supabase/policies/registros_write.sql`) y funciones SET en `supabase/tables/coordinacion_contrato_id_sets.sql`.
- Los filtros de la pestaña Registros usan:
  - `get_records_filter_contratos()` para contratos activos visibles/asignados.
  - `get_records_facets(date,date,bigint)` para combinaciones reales de contrato/servicio/personal/instalación.
  Fuente: `supabase/tables/registros_filter_facets.sql`.
- `registros.servicio_id` debe pertenecer al mismo contrato que `registros.contrato_id`. El blindaje de base de datos está en `supabase/tables/registros_servicio_contrato_validation.sql`.
- `actividades.servicio_id` tiene validación equivalente en `supabase/tables/actividades.sql`; debe usar comparación estricta `new.contrato_id is distinct from service_contract_id`.
- En frontend, el modo edición tipo Excel de Registros carga opciones de selects relacionales bajo demanda para evitar renderizar miles de `<option>` por celda.
- Las asignaciones masivas de Registros, Actividades e Historial laboral soportan selección manual por ticks; cuando está activa, `Aplicar` actúa solo sobre los elementos seleccionados.

### Supabase Historial laboral

- **RLS por contrato asignado** (fuente: `supabase/policies/historiales_laborales_scope.sql`). Antes los 4 verbos eran `using(true)`: cualquier coordinador con la pestaña veía y editaba el historial de **todo** el personal. Ahora hay políticas **RESTRICTIVE** (se combinan con AND sobre las permisivas) acotadas por `personal_id`:
  - **Lectura**: `can_access_coordinacion_personal(personal_id)` — mismo criterio que la pestaña Personal (persona asignada vía `contrato_personal` a un contrato legible).
  - **Escritura** (insert/update/delete): `can_manage_coordinacion_historial(personal_id)` — exige contrato **gestionable** (`coordinacion_manageable_contrato_ids()`).
  - Admin sin límite (bypass vía `is_coordinacion_admin`). Mismo patrón que `supabase/policies/personal_instalaciones_scope.sql`.
- La app lee de la vista `historiales_laborales_detalle`, que es **`security_invoker = true`** — por eso el RLS de la tabla base aplica también a través de la vista. **No quitar esa opción.** Todos los joins de la vista son `LEFT` (incluido `personal_confidencial`), para que un no-admin no pierda filas.
- El **nº de Seguridad Social** solo lo ve un admin: la vista lo enmascara con `case when is_coordinacion_admin() then pc.ss end`. Ver [personal_confidencial](supabase/tables/personal_confidencial.sql).

### Supabase Contabilidad (Cronos)

- Tablas `cronos` (apuntes de inscripciones/actividades) y `cronos_banco` (movimientos TPV). `cronos_banco.cod_pedido` enlaza con `cronos.identificador` (normalizando: `cod_pedido = identificador::bigint`, porque los exports nuevos traen el identificador con ceros a la izquierda). Fuente: `supabase/tables/cronos.sql`, `supabase/tables/cronos_banco.sql`.
- **RLS**: lectura para `is_coordinacion_admin()` **o** usuarios con la pestaña `contabilidad` asignada (acceso "todo o nada", sin scope por fila). **Escritura solo admin** (`cronos_admin_write`, `cronos_banco_admin_write`) — necesaria para la carga desde la app.
- **Funciones** `get_cronos_filtros/resumen/page`, `get_cronos_banco_filtros/resumen/page`, `get_cronos_resultados` y `get_cronos_conciliacion`: son **`SECURITY DEFINER`** con un guard de autorización evaluado **una sola vez** (no por fila). Es deliberado: evaluar el RLS fila a fila sobre las 100k+ filas provocaba `statement timeout` en el cliente. **No revertir a SECURITY INVOKER.**
- `get_cronos_filtros` acepta los mismos filtros que Apuntes para devolver `forma_pago` y `anulado` facetados por el contexto actual; si se cambia su firma, actualizar también el RPC del frontend.
- En frontend, la lista de Contabilidad/Banco **no usa `count:'exact'`** (contar todas las filas bajo RLS también da timeout); el total exacto lo aporta el RPC de resumen y la consulta de página solo trae `.range()`.
- UI de Contabilidad: Apuntes usa filtros compactos en una fila y el listado no muestra `numero_factura`; Banco no muestra `terminal` ni `tipo_operacion`, no filtra por terminal desde la UI y `get_cronos_banco_page` debe dropearse antes de recrearse si cambia su `returns table`.
- **Resultados** (`get_cronos_resultados`): Banco es la base; enlaza `cronos_banco.cod_pedido` con `cronos.identificador` usando `ltrim(trim(identificador), '0')`. Tiene vista **detalle** y **resumen**; el resumen agrupa por mes/tarifa, suma unidades e importes y permite exportar Excel/PDF desde la UI.
- **Conciliación** (`get_cronos_conciliacion`): compara `cronos.identificador` normalizado sin ceros a la izquierda con `cronos_banco.cod_pedido` y devuelve los apuntes Cronos y movimientos Banco sin pareja del intervalo. Limita filas devueltas para no saturar el navegador, pero devuelve totales exactos.
- **Carga de datos** (botón "Cargar CSV" por subpestaña, `handleContabilidadCsvLoad`): detecta codificación (los apuntes vienen UTF-8, el banco **Windows-1252**), parsea `;`, mapea columnas **por posición** (los exports nuevos no traen columna `Id` y difieren de los ficheros iniciales), convierte fechas dd/mm/aaaa, decimales coma o punto, y valores no-fecha (`--`, `----`, vacío) a NULL. Estrategia **reemplazo por rango de fechas** (borra `fecha` min–max del fichero e inserta por lotes de 1000) porque no hay clave única fiable (`apunte` y `cod_pedido` tienen duplicados). Idempotente por periodo.
- **Import inicial por script** (alternativa CLI, requiere la `service_role` key): `scripts/import_cronos.py` (CSV) e `scripts/import_cronos_banco.py` (xlsx/CSV), upsert por `id_origen`, lotes de 5000, con `--dry-run`.
- La clave de pestaña `contabilidad` (y `gestion`) están en el catálogo `supabase/tables/coordinacion_pestanas.sql`.

### Supabase Gestión

- Fuente: `supabase/tables/gestion_resumen.sql`.
- `get_gestion_personal(p_desde, p_hasta)` lista personal con registros visibles en el intervalo, acotado a contratos activos.
- `get_gestion_registros_resumen(p_desde, p_hasta, p_personal_id)` agrega horas en servidor por `puesto × situación × tipo_hora`, sin el límite frontend de 5000 filas de Registros.
- Son funciones **`SECURITY INVOKER`**: deben respetar el RLS de `registros` y el alcance por contrato asignado.

## Desarrollo local

```powershell
python -m http.server 8080
```

- `http://localhost:8080/` → redirige a `coordinacion/`
- `http://localhost:8080/coordinacion/`
- `http://localhost:8080/concilia/`
- `http://localhost:8080/curriculos/`
- `http://localhost:8080/programacion/`

## Convenciones

- **Sin framework de build** — no hay npm, webpack ni transpilación. JS es vanilla ES2020+, cargado con `<script src>` directo.
- **Versionado de assets** — las referencias a CSS/JS en HTML usan `?v=YYYYMMDD-N` para forzar recarga en producción.
- **Módulos JS** — solo en `coordinacion/modules/`; el resto de apps usan un único `app.js`.
- **`shared/`** — nunca se modifica desde `publish/`; siempre se edita en la raíz y se republica.
- **Scripts Python** — requieren Python 3; convierten CSVs externos al formato de importación de Supabase.
