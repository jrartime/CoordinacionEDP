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
- **Historial laboral** — Periodos de alta/baja del personal (`historiales_laborales`, se lee de la vista `historiales_laborales_detalle`). Filtros de fecha apilados en dos columnas (Alta desde/Alta hasta y Baja hasta/Baja desde, con ✕ para limpiar), tipo de contratación, enviado/gestionado/tramitado y personal. Cada fila tiene un botón ▾ que despliega las **actividades solapadas** con el alta/baja de esa persona (instalación, puesto, fechas, horario), con carga perezosa y caché. Asignación masiva, importación Excel y generación de **informes PDF** por plantilla. Ver [Supabase Historial laboral](#supabase-historial-laboral).
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

Los errores de acceso se muestran **dentro de la tarjeta de login** (`#login-status`) y del formulario de recuperación (`#password-recovery-status`), además del `#status-message` general — este último cuelga del final de la página y pasa desapercibido, por eso un fallo de credenciales parecía no dar mensaje. `translateAuthError()` traduce los errores de Supabase, que llegan en inglés.

Las **plantillas de correo** de Auth (recuperación e invitación) están traducidas en `supabase/email-templates/`. **No se despliegan con `publish.ps1` ni con SQL**: viven en la configuración del proyecto y se pegan a mano en Authentication → Emails; esos ficheros son la copia de referencia. Ver [su README](supabase/email-templates/README.md).

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
- El despliegue de actividades solapadas de cada fila consulta `actividades_detalle` (solape: la actividad sigue abierta o acaba ≥ `fecha_alta`, y empieza ≤ `fecha_baja`) y hereda el alcance por contrato de `actividades`.

#### Informes PDF de Historial laboral

- Plantillas en `historial_laboral_informe_plantillas` (campos de texto: `titulo`, `saludo`, `texto_intro`, `texto_movimiento`, `texto_condiciones`, `texto_legal`, `texto_recibido`, `opciones_respuesta_texto`, `pie_observaciones`). Config documental por empresa (logo, firma, firmante, pies) en `historial_laboral_informes_config.sql`.
- Orden del PDF (`exportHistorialLaboralReportPdf`): cabecera (**logo centrado** y debajo "En <ciudad> a <fecha>" alineado a la derecha) → título → bloques de texto (+ tabla de actividades tras `texto_movimiento`) → **firma de la empresa centrada** (etiqueta, imagen de firma, firmante y cargo) → **opciones de respuesta indentadas 3 cm** → **firma del personal** (`texto_recibido`: RECIBIDO / Fdo. / DNI, a la izquierda) → **`pie_observaciones`** justo debajo del DNI (fuente 8) → pie de empresa.
- `addWrappedText` acepta `indent` (mm) para desplazar un bloque a la derecha reduciendo el ancho de ajuste.
- **Texto para el correo**: el panel de informe tiene un textarea editable que se autorrellena según `tipo_documento` de la plantilla (`variacion`/`llamamiento`/`subrogacion`/genérico). El saludo se resuelve con `personal.genero` (`H` → "Estimado", `M` → "Estimada", nulo → "Estimado/a"). Si el usuario lo edita a mano, un flag `dirty` evita sobrescribirlo al cambiar de plantilla.
- Al pulsar **Descargar PDF** se copian al portapapeles **en secuencia** (450 ms entre cada uno, para que el historial del portapapeles de Windows / Win+V registre entradas separadas): `texto` → `nombre completo` → `correo`. El orden es **inverso a propósito**: el correo queda como portapapeles actual para pegarlo directo en Adobe Acrobat. **La secuencia va ANTES de `doc.save()`**: la descarga abre la burbuja del navegador, que quita el foco al documento, y sin foco la Clipboard API rechaza toda escritura — con la copia después de `save()` solo llegaba el primer valor. No reordenar. `execCommand` (el fallback) devuelve `true` aunque no copie nada sin foco, así que no se da por buena la copia sin `document.hasFocus()`. El **navegador de vista previa integrado bloquea el portapapeles** (permiso denegado + `execCommand` inhabilitado): esto solo se puede verificar en un Chrome/Edge real.

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
