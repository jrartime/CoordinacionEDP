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
- **Control personal** — Partes de horas: carga, filtros, resumen por persona y panel de **asignación/borrado masivo**. La asignación usa `Campo → Valor actual → Nuevo valor` sobre todas las coincidencias de los filtros activos (aunque abarquen varias páginas); el borrado exige seleccionar filas expresamente. Ya no existe el borrado indiscriminado de todos los registros filtrados.
- **Eventos deportivos** — CRUD con cronograma de pasos y asignación de personal de montaje. Zona **Generación de registros** (solo admin, mismo patrón que la de Actividades): se marcan eventos y cada persona asignada a un paso genera un registro con **tipo de hora MONT y situación NORM**; las horas salen del cronograma (las propias de la persona si difieren de las del paso), el contrato e instalación del evento, la función es Oficial de 1ª y el puesto lo elige quien genera. La empresa se toma del historial laboral vigente de esa fecha — sin ella el registro no entraría en la nómina —, y las asignaciones sin historial se omiten avisando. Idempotente por `registros.evento_asignacion_id`.
- **Candidaturas** — Tabla `candidates`: filtros, paginación, etiquetas, exportación.
- **Personal** — Fichas de `tbl_personal`.
- **Contratos** — `tbl_contratos`. Los servicios se gestionan como en Personal/Instalaciones: `servicios` es un catálogo global (nombre único en todo el sistema) y `contrato_servicios` es la tabla puente que dice qué servicios están habilitados en cada contrato (doble lista con filtro, doble clic para asignar/quitar, más un formulario para crear un servicio nuevo si no existe). Ver [Servicios como catálogo global](#servicios-como-catálogo-global).
- **Actividades** — Actividades laborales por contrato (compartido con Concilia). El campo `activo` es booleano, vale `true` por defecto y puede editarse en el panel lateral, filtrarse con Sí/No/Todos y modificarse mediante asignación masiva. Los filtros usan la misma tipografía, altura y distribución compacta que Registros, con el borrado dentro de cada control.
- **Registros** — Detalle de jornadas generado desde actividades. Las **horas nocturnas se calculan en base** (`registros_horas_nocturnas.sql`): el trigger `trg_registro_horas_nocturnas` cruza el horario con la franja del contrato en cualquier vía de alta o edición. `horas_nocturnas` nulo significa «calcúlalo tú»; un valor informado se respeta (así la importación histórica conserva el dato del parte). Solo se devenga si la persona trabaja (NORM/SUST, o FEST con FTRAB). Filtros cruzados por contrato/servicio/personal/instalación, edición tipo Excel, selección manual para asignación/borrado masivo y coherencia servicio/contrato. Con persona y rango de fechas completos se activa **Cotejar control personal**, que abre un panel con ambos orígenes agrupados por día y marca coincidencias o discrepancias. También marca los **solapes de horario** (misma persona en dos turnos a la vez el mismo día): la fila se tiñe, lleva un badge `⚠ Solape` con el turno que choca y el botón `Ver solapes` filtra solo esas filas. Con persona y rango de fechas completos se activa además **Informe individual**, que abre un panel con las horas diarias del periodo (día de la semana, fecha y total), el detalle turno a turno (fecha, puesto, hora inicio, hora fin, horas, tipo de hora) y, al final de ese mismo bloque, el resumen por puesto y por tipo de hora — pensado para entregar a la propia persona (a diferencia del informe general, que agrupa por contrato/puesto/situación sin horario ni fechas). Exportable a CSV, PDF y PNG (con copiar/descargar imagen), mismo patrón de botones que el informe por personal de Control personal. Ver [Cotejo con Control personal](#cotejo-con-control-personal) y [Solapes de Registros](#solapes-de-registros).
- **Historial laboral** — Periodos de alta/baja del personal (`historiales_laborales`, se lee de la vista `historiales_laborales_detalle`). Filtros de fecha apilados en dos columnas (Alta desde/Alta hasta y Baja hasta/Baja desde, con ✕ para limpiar), tipo de contratación, enviado/gestionado/tramitado y personal. Cada fila tiene un botón ▾ que despliega las **actividades solapadas** con el alta/baja de esa persona (instalación, puesto, fechas, horario), con carga perezosa y caché. Asignación masiva, importación Excel y generación de **informes PDF** por plantilla. Ver [Supabase Historial laboral](#supabase-historial-laboral).
- **Gestión** — Pestaña transversal que cruza historiales laborales y registros por intervalo de fechas. Filtros de fecha (Desde/Hasta), empresa y personal; muestra historiales solapados y un pivote de horas, ambos limitados visualmente a diez filas. Los historiales tienen cabeceras ordenables con criterios acumulativos (el orden anterior se conserva como desempate). El bloque mensual de nóminas es plegable y de carga diferida, pagina todas las líneas del RPC para superar el límite de 1.000 filas y ofrece filtros reactivos por mes/año, empresa, anuladas, fecha/hora de emisión y selección múltiple de personal. Incluye matriz, exportaciones y un detalle por nómina también plegable.
- **Contabilidad** — Apuntes del sistema Cronos (`cronos`) con subpestañas **Apuntes**, **Banco** (`cronos_banco`, movimientos TPV), **Resultados** (Banco como base enlazado con `cronos.identificador`) y **Conciliación** (apuntes/movimientos sin pareja). Paginación y agregados server-side; filtros por fecha/centro/tipo/forma de pago/etc.; botón "Cargar CSV" en Apuntes/Banco que reemplaza los datos por rango de fechas. Solo lectura salvo carga (admin).
- **Facturación** — Control económico por contrato con subpestañas **Resumen**, **Presupuestos**, **Facturas**, **Preparación de facturas** y **Configuración**. Cruza `contratos_presupuestos` con `contratos_facturacion`, muestra ejecución, saldo, pendiente de cobro, alertas y facturación por año natural. Preparación de facturas agrupa los `registros` con `facturar = true` por contrato, función e instalación entre dos fechas, aplica la tarifa de `contratos_funciones` (hora o importe fijo mensual/global) y genera un PDF con resumen y desglose semanal. Configuración mantiene funciones/tarifas y vigencias del contrato, además del catálogo global de estados (este último solo para admin). Presupuestos y facturas admiten alta, edición y eliminación confirmada; el acceso hereda el alcance por contrato mediante RLS. Al guardar o borrar una fila (presupuesto, factura, tarifa, periodo, estado) solo se relee esa tabla (`reloadBudgets`/`reloadInvoices`/`reloadRates`/`reloadPeriods`/`reloadStatuses` en `facturacion.js`), no las 11 tablas de `load()` completo — guardar/tarifas/servicios de **todos** los contratos siguen cargándose enteras (no solo el contrato elegido) porque "Preparación de facturas" agrupa por `contrato_facturable_id` y puede mezclar contratos vía redirección; lo que se evita es repetir esa carga completa en cada guardado. `contratos_facturacion_preparaciones` se carga perezosa (como el panel Control), solo al abrir esa subpestaña.
- **Accesos** — Usuarios, roles y **contratos** asignados (`coordinacion_usuario_contratos`; ya no es por servicio, ver [Servicios como catálogo global](#servicios-como-catálogo-global)).
- **Concilia** (integrado) — Las 5 pestañas de Concilia dentro de Coordinación vía `concilia-integrated.js`.

En los paneles de asignación masiva, al elegir un `Valor actual` se sincroniza
automáticamente el filtro visible equivalente de la pestaña (cuando existe). Esto
mantiene alineadas las coincidencias de la operación con el listado que ve el usuario.

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

- **Índices duplicados por renombrados**: al renombrar una tabla, Postgres **no** renombra sus índices. Reejecutar después el DDL con los nombres nuevos crea copias exactas que nadie usa pero que ocupan y se mantienen en cada escritura. Pasó con `horas` → `registros`, `tbl_registros` → `registros` → `registros_horarios` (¡tres copias de cada índice!) y `conciliausuarios` → `concilia_usuarios`; sumaban 51 MB. Limpieza y detalle en `supabase/tables/indices_limpieza_espacio.sql`, aplicada el 29/07/2026 (488 → 359 MB). **Antes de crear un índice, comprobar que no existe ya con otro nombre** — la consulta de duplicados por definición está en ese fichero.

#### Servicios como catálogo global

- Hasta el 06/08/2026 `servicios` era 1:N con `contratos` (`contrato_id not null`, nombre único **por contrato**): el mismo servicio (p.ej. "Conserjería e Información") se duplicaba una fila por cada contrato que lo usaba (32 filas para 23 nombres distintos). Se globalizó: `servicios` ya no tiene `contrato_id` (nombre único en **todo** el sistema) y `contrato_servicios(contrato_id, servicio_id, activo)` es la tabla puente — mismo patrón que `contrato_personal`/`contrato_instalaciones` (`contrato_asignaciones.sql`), salvo que aquí desasignar **borra** la fila (no hay `removed_at`/historial: no tiene sentido de negocio guardar qué servicios tuvo un contrato en el pasado). Migración y fusión de duplicados en `supabase/tables/servicios_globalizar.sql`.
- **Configuración → Servicios**: subpestaña con el patrón genérico de tablas maestras (`SETTINGS_CATALOGS.servicios` en `app.js`, mismo componente que Puestos/Funciones/Modalidades/Instalaciones/Empresas). Edita nombre/activo/descripción del catálogo global y permite borrar, bloqueado si el servicio está en uso (`get_master_catalog_usage`, extendida con el catálogo `servicios` — cuenta `registros`, `actividades`, `contrato_servicios` y `contratos_funciones_servicios`). Desmarcar «Activo» aquí lo saca de "Disponibles" en el panel de Contratos sin desasignarlo de los contratos que ya lo tuvieran asignado.
- El acceso de un coordinador **ya no se concede por servicio**: antes `coordinacion_usuario_servicios(user_id, servicio_id)` era la única fuente de alcance y el contrato se derivaba uniendo por `servicios.contrato_id` — eso dejó de tener sentido en cuanto un servicio puede estar en varios contratos. Ahora `coordinacion_usuario_contratos(user_id, contrato_id)` concede el contrato directamente (pestaña Accesos). `coordinacion_usuario_servicios` queda en desuso (no la lee ninguna función de alcance) pero no se ha borrado. Migración en `supabase/tables/coordinacion_usuario_contratos.sql`.
- Las validaciones duras de "servicio pertenece a este contrato" (`registros`, `actividades`, `contratos_funciones_servicios`) ya no comparan `servicios.contrato_id` — comprueban `exists` en `contrato_servicios`.
- `can_read_coordinacion_servicio`/`can_manage_coordinacion_servicio` resuelven "accesible" como "habilitado en algún contrato que el usuario puede leer/gestionar" (join a `contrato_servicios` + `can_access_coordinacion_contrato`), en vez de leer `coordinacion_usuario_servicios` directamente.
- **Cuidado con overloads de funciones**: al reescribir `get_records_filter_contratos(p_user_id uuid default auth.uid())` con `create or replace`, una llamada `rpc()` sin argumentos empezó a fallar con *"could not choose the best candidate function"* — había un overload **sin parámetros**, mucho más antiguo, que nadie había retirado nunca. `create or replace function` solo sustituye la firma exacta; no limpia overloads previos con otra firma. Se resolvió con `drop function if exists public.get_records_filter_contratos();`. Antes de dar por buena una función reescrita, comprobar `select count(*) from pg_proc where proname = '...'` no da más de 1.
- `registros` está scoped por contrato asignado mediante RLS (`supabase/policies/registros_write.sql`) y funciones SET en `supabase/tables/coordinacion_contrato_id_sets.sql`.
- Los filtros de la pestaña Registros usan:
  - `get_records_filter_contratos()` para contratos activos visibles/asignados.
  - `get_records_facets(date,date,bigint)` para combinaciones reales de contrato/servicio/personal/instalación.
  Fuente: `supabase/tables/registros_filter_facets.sql`.
- `registros.servicio_id` debe estar habilitado en el contrato del registro (`contrato_servicios`, no una comparación directa — ver [Servicios como catálogo global](#servicios-como-catálogo-global)). El blindaje de base de datos está en `supabase/tables/registros_servicio_contrato_validation.sql`.
- `actividades.servicio_id` tiene validación equivalente en `supabase/tables/actividades.sql`.
- `actividades.activo` es obligatorio y vale `true` por defecto. La vista `actividades_detalle` debe exponerlo porque el listado lo carga de forma explícita. Para bases ya creadas se puede ejecutar únicamente `supabase/tables/actividades_activo_migracion.sql`; la migración añade la columna, recrea la vista con `security_invoker` y repone el permiso de lectura para `authenticated`.
- Los filtros de Actividades comparten las métricas compactas de Registros e incluyen contrato, servicio, puesto, personal, instalación, activo y periodo. `Fecha desde` / `Fecha hasta` filtran por **solape de periodos** (`fecha_fin >= desde` y `fecha_inicio <= hasta`), por lo que incluyen actividades vigentes durante cualquier parte del intervalo.
- El estado activo se puede modificar tanto en el panel lateral como mediante asignación masiva. Los formularios de alta y edición muestran dentro del propio panel el motivo concreto que impide guardar (campos obligatorios, servicio/puesto incompatible o fechas/horas incoherentes).
- El listado de Actividades usa clases de columna estables para que sus anchos no cambien al mostrar la selección de generación de registros: Personal 15 %, Instalación 16 %, Puesto/Función 25 % y Fechas/Horario 132 px.
- En frontend, el modo edición tipo Excel de Registros carga opciones de selects relacionales bajo demanda para evitar renderizar miles de `<option>` por celda.
- Las asignaciones masivas de Registros, Actividades e Historial laboral soportan selección manual por ticks; cuando está activa, `Aplicar` actúa solo sobre los elementos seleccionados.

#### Cotejo con Control personal

- El botón `Cotejar control personal` solo se habilita cuando los filtros de Registros tienen persona, fecha inicial y fecha final válidas.
- El cruce consulta directamente `registros_detalle` y `registros_horarios` para todo el intervalo; no depende del límite de filas cargadas en la tabla principal.
- La persona se enlaza por `personal.id` y su DNI. Si no tiene DNI informado, el panel muestra el motivo y no intenta comparar por nombre.
- Se excluyen de Registros las filas CAMB y LG porque el titular no trabajó esos turnos. En Control personal se ignoran las filas con `eliminado = true`.
- Por cada día se muestran en dos columnas los turnos y su contexto. `Encaja` exige el mismo conjunto de intervalos; si solo coincide la duración total se muestra `Mismas horas, horario distinto`; cualquier diferencia de minutos o ausencia en un origen se marca `No encaja`.
- Los días sin datos en ninguno de los dos orígenes no se muestran, aunque sí forman parte del intervalo consultado.

#### Solapes de Registros

- Detección **en cliente** (`computeRecordsOverlaps` en `coordinacion/app.js`): agrupa por `personal_id + fecha` y cruza los intervalos `hora_inicio`–`hora_fin`. Surgen sobre todo al **importar partes de contratos distintos**, donde cada planilla viene por su lado y nadie cruza el horario.
- Se cruzan **solo las filas ya cargadas** (las que pasaron los filtros y el tope `RECORDS_LOAD_LIMIT`): si el turno que choca quedó fuera del filtro, no se detecta. Por eso el botón lo dice en su `title`.
- **No cuentan como solape** las filas cuya **situación** es CAMB (lo cubrió otro) o LG (licencia): esa persona no hace ese turno —está en otra actividad durante todo o parte del horario—, así que se guarda el horario para saber de qué turno se trata, pero las horas van vacías y el hueco no lo ocupa. Se mira la situación y **no solo las horas**, porque hubo importaciones que dejaron las horas puestas en filas CAMB/LG y se marcaban como solape sin serlo (caso de referencia: David Tella, 08/07/2026). La lista de situaciones vive en `SITUACIONES_SIN_HORAS` (`concilia-integrated.js`) y se consulta vía `window.CoordinacionActividades.situacionSinHoras`, con respaldo por la etiqueta `situacion` de la fila si esos catálogos aún no se han cargado. Mismo criterio que `withRecordSituacionSideEffects`.
- Las 16 filas CAMB/LG que arrastraban horas se limpiaron el 28/07/2026 (ninguna estaba en una nómina emitida); el script para deshacerlo es `supabase/tables/registros_camb_lg_horas_revertir.sql`.
- Los bordes que **se tocan** no solapan (09:00–15:30 junto a 15:30–22:00 es correcto); un turno que cruza medianoche se estira hasta el fin de la jornada en vez de invertirse.
- La marca es acumulativa con las de sustitución: `record-row-solape` va **después** en la cascada CSS porque un solape es un error del parte, no un estado normal.

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
- La UI reutiliza los editores existentes: mueve temporalmente `.personal-detail-panel` al drawer de Gestión, registra/abre el historial con el formulario único y carga `registros_detalle` por persona/intervalo para el panel flotante. Al guardar, vuelve a ejecutar `loadGestion()`; no crear formularios paralelos para estas entidades.
- Los accesos de edición se muestran o ejecutan solo si el perfil tiene concedidas las pestañas `personal`, `historial` o `registros`, respectivamente.

### Supabase Nóminas

- **Días de nómina**: `dias_nomina(desde, hasta, mes_completo)` cuenta **base 30** cuando la persona tiene el mes cubierto desde el día 1 (los tramos que lo parten por una variación siguen sumando 30) y **días reales** cuando entra con el mes ya empezado. Lo decide `tiene_alta_continua_desde_inicio_mes`, que exige que no haya huecos desde el día 1. Casos de referencia en julio de 2026: Adrián Domínguez 14+16=30 (alta todo el mes) y Sergio García Méndez 2+17=19 (alta el día 13).
- **Motor de cálculo** (`nomina_calculo.sql`, `nomina_calculo_persona.sql`): `calcular_nomina_devengos(historial_id, …)` da los devengos de UN puesto; `calcular_nomina_persona(personal_id, …)` es la nómina real (suma puestos + transporte/complementos/prorrateo una sola vez + bases + deducciones + líquido). Ambas `SECURITY INVOKER`; solo un admin obtiene resultados porque las tablas salariales son admin-only.
- **Nóminas emitidas** (`supabase/tables/nominas.sql`): una nómina emitida no es solo el recibo, es el **registro laboral** del periodo. Cuatro tablas, todas admin-only:
  - `nominas` — cabecera: periodo, empresa, historiales incluidos, **los parámetros con los que se calculó** y los totales. `ejercicio`/`mes` son generadas (solo si el periodo cae dentro de un mes natural).
  - `nomina_lineas` — el desglose. `ambito = 'persona'` son las líneas de la nómina real (las que suman); `ambito = 'puesto'` es el mismo dinero explicado por historial (`historial_id`), **no suma**. Cada línea lleva `cantidad`, `precio` y `codigo_nomina` además del `detalle` en prosa.
  - `nomina_historiales` — la foto del contrato de cada periodo/puesto: convenio y tarifas vigentes, jornada, coeficiente, horas teóricas, modalidad de pago y **ajuste realmente aplicado**, flags de pluses y tipos de cotización. `predominante` marca del que salen las cotizaciones y el nº de pagas.
  - `nomina_horas` — horas por historial × tipo de hora × situación, con días, nº de registros y **`registro_ids`** (los ids de origen, para auditar contra el parte). Guarda también las excluidas (CAMB/LG) marcadas con `excluida`.
  - `emitir_nomina(...)` replica la firma de `calcular_nomina_persona` y añade `p_notas`/`p_reemplazar`. Choca con la nómina viva del mismo periodo salvo que se pida reemplazar; entonces la anterior queda `anulada` y la nueva apunta a ella con `sustituye_a`. `anular_nomina(id, motivo)` no borra: marca.
  - **Unicidad**: una sola viva por `personal_id + empresa_id + periodo + historial_ids`. El conjunto de historiales entra en la clave a propósito: dos vidas laborales que no se solapan son **dos nóminas del mismo mes**, no una suma. Una nómina **con varios historiales** (dos puestos a la vez) es lo normal y queda registrada periodo a periodo.
  - Los totales de la cabecera se derivan de las líneas guardadas de **ámbito persona** (las que llevan `detalle_de` no suman); las bases se toman por `orden` (600/601/602) — si cambia la numeración del motor, cambiarla también ahí.
  - `get_nomina_contexto_historial(...)` reproduce el preámbulo de `calcular_nomina_devengos` (ventana, ajuste según modalidad, modo de base, horas con las exclusiones CAMB/LG) **sin calcular importes**. Es un acoplamiento deliberado: si esas reglas cambian en `nomina_calculo.sql`, cambiarlas aquí.
  - **Edición de conceptos**: `emitir_nomina` acepta `p_lineas jsonb` — las líneas ajustadas a mano sustituyen a las del motor y la nómina queda marcada `editada`. El expediente (historiales y horas) se congela igual: lo trabajado no se edita, solo lo que se paga por ello. Las filas de desglose (`detalle_de`) no entran en el editor: son la explicación de su línea padre y no se pueden mantener coherentes si el padre cambia.
  - En Gestión: botones **Emitir nómina** y **Editar nómina** en la tarjeta del total, y bloque **Nóminas emitidas**, donde cada nómina despliega el recibo congelado y, debajo, el expediente por periodo (contrato, horas y conceptos), con **Editar** (reemplaza anulando la anterior) y **Anular**. Solo para admin.
  - **Estado de nómina en historiales**: la tabla «Historiales laborales solapados» cruza cada fila con `nomina_historiales.historial_id` y las cabeceras vivas de `nominas`. Dentro del intervalo filtrado muestra **Realizada** si la unión de periodos emitidos cubre todo el tramo, **Parcial** si deja huecos y **Pendiente** si no hay ninguna. Las realizadas se resaltan en amarillo fosforito; las anuladas no cuentan. El resumen superior muestra los tres recuentos y el `title` del badge identifica las nóminas que aportan cobertura.
  - **Nómina manual y conceptos del puesto**: el importe manual sustituye al salario base, pero el resto de lo que genera el puesto (montaje, complementarias, disponibilidad, nocturnidad, festivo, absentismo) **se paga aparte por defecto**. La lista «Complementos y pluses incluidos» los muestra uno a uno con su importe (`get_conceptos_puesto_nomina`); marcarlos significa «ya van dentro del importe» y entonces no se suman. Se congela en `nominas.manual_conceptos_dentro`. Antes desaparecían sin dejar rastro.
  - **Horas sin historial para el puesto**: al preparar una nómina, `get_horas_sin_historial` detecta registros cuyo puesto no coincide con ningún historial de la persona. HCOMP/MONT con algún alta ese día se pagan a la tarifa del puesto real. Las **horas normales** cuentan como jornada según el tick **Contar horas de otros puestos** (ver abajo); los días **sin ningún alta** quedan siempre fuera, porque falta el historial y no hay nómina posible.
  - **Contar horas de otros puestos** (`p_horas_otros_puestos`, por defecto activado): las horas REG hechas en un puesto que la persona no tiene contratado suman a la jornada del **historial predominante** — nunca a todos los solapados, que las pagaría una vez por puesto. Existe porque no contarlas no solo dejaba de pagarlas: en las modalidades que ajustan por horas (Horas totales) la jornada se compara con la teórica, así que una hora ausente **resta**. Caso de referencia: Manuel Enrique Fernández, julio 2026, 169 h reales sobre 161 teóricas, a quien el motor le descontaba 123,87 € por 16 h que sí había trabajado. Se desmarca cuando el puesto del registro está mal elegido. Se congela en `nominas.horas_otros_puestos`. El criterio de «puesto huérfano» vive en `es_puesto_sin_historial` y lo comparten el motor y el aviso.
  - En el editor, bases y deducciones se recalculan solas desde los devengos (`GESTION_NOMINA_BASE_DE_DEDUCCION` mapea qué base usa cada retención por su `orden`); un importe tecleado a mano se marca y deja de recalcularse.
  - **Recibo PDF (Fase 7)**: cada nómina emitida tiene un botón **PDF** que genera el recibo individual (`exportNominaEmitidaPdf`), reutilizando la config documental de `empresas` (logo, firmante, pies) igual que los informes de Historial laboral. Layout: cabecera con empresa, recuadro de trabajador (DNI, nº S.S., grupo cotización, puesto, convenio), tabla de devengos (concepto/cantidad/precio/importe), tabla de deducciones (base/%/importe), líquido, bases de cotización y firmas. El nº de S.S. sale de `personal_confidencial` (admin).
  - **Listado mensual (Fase 7)**: bloque plegable **Listado de nóminas del mes** en Gestión, transversal y solo admin. Cerrado no consulta ni construye el listado; al abrir carga automáticamente y los filtros reaccionan sin botón intermedio. Admite mes/año, empresa, anuladas, fecha/hora de emisión desde/hasta y multiselección de personal; las personas disponibles se recalculan con los demás filtros. La carga del RPC se pagina en bloques de 1.000 líneas para no truncar el mes. Muestra una **matriz persona × concepto** y un **detalle por nómina** plegable. Exporta el resultado filtrado a **Excel** y **PDF**.
  - **Qué sale en cada formato**: todos los conceptos, sin filtrar por tipo. Las **subfilas de desglose** (`detalle_de`, los componentes del prorrateo) **no son columna de la matriz** — su línea padre ya lleva la suma y contarlas duplicaría el total —, pero sí aparecen en el panel (anidadas), en el PDF (indentadas) y en la hoja Detalle del Excel, donde van con su importe en la columna **«Importe subfila»** y la columna **«Subfila de»**, para poder auditarlas sin que se sumen al filtrar por «Importe». El **desglose por puesto** (ámbito `puesto`) no está en la matriz ni en el panel del listado (ahí el concepto va sumado): vive en la hoja «Por puesto» y en el PDF.
  - Fuente de datos: `get_nominas_listado(ejercicio, mes, empresa_id, incluir_anuladas)` — devuelve **los dos ámbitos** (con `historial_id` y `puesto` ya resueltos) y la cabecera denormalizada en cada fila, para armar la matriz en cliente **sin toparse con el tope de 1000 filas de PostgREST** (una nómina truncada sería un error grave). `buildGestionNominaListado` separa los ámbitos: mezclarlos duplicaría cada importe. Filtra por las columnas generadas `ejercicio`/`mes`.
  - **Prorrata de pagas extra** (`prorrata_pagas_extra(importe, extras)`): `extras × REDONDEAR(importe × 8,333%; 2)`. Dos matices que cambian el céntimo y que replican al programa de nóminas de la empresa: el tipo es **8,333 % exacto, no 1/12** (0.08333, no 0.0833333…), y **se redondea el valor de UNA paga antes de multiplicar** por el número de extras. Contrastado con la nómina real de Ainhoa Díaz Bango (julio 2026): 565,63 con 2 extras da 94,26 en la nómina; redondeando al final salen 94,27 y con 1/12 exacto 94,28.
  - **A qué cotiza cada concepto**: `nomina_complementos_catalogo.cotiza_en` (`text[]` con `comunes`, `mei`, `desempleo`, `formacion`, `irpf`; **todas por defecto**, array **vacío = concepto exento**, `null` se lee como todas). El motor ya **no calcula las bases como «bruto menos excepciones»**: las acumula concepto a concepto (`v_b_comunes`/`v_b_mei`/`v_b_desempleo`/`v_b_formacion`/`v_b_irpf`), así que un concepto exento o parcialmente exento no obliga a tocar el motor. Lo que no es complemento del catálogo (salario base, pluses de convenio, disponibilidad, horas) cotiza por todo, como siempre; el plus de transporte lee su fila del catálogo por `codigo_nomina = 398`. Cada línea devuelve y congela su `cotiza_en` en `nomina_lineas`. Se edita desde Configuración → Complementos y pluses.
  - **Complementos añadidos a mano**: `p_complementos_extra jsonb` (`[{"complemento_id":15,"importe":95.00}]`) suma conceptos **solo a esa nómina**, sin tocar la ficha de la persona; si ya los tiene asignados salen las dos líneas y se suman las dos. Se guardan en `nominas.complementos_extra` para poder reproducir el cálculo. UI: tercera columna «Añadir complemento» en el panel de opciones de Gestión.
- **Contador de horas de Gestión**: `get_gestion_horas_teoricas(desde, hasta, personal_id, empresa_id)` suma `horas_teoricas_jornada` del tramo de cada historial que solape el rango, para mostrar «Total: X h de Y h teóricas». `SECURITY INVOKER`, respeta el RLS por contrato.

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
