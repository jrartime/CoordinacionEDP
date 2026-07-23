# Contexto previo — sesión de trabajo

Resumen de los cambios completados, decisiones clave y estado actual del proyecto **CoordinacionEDP**. Proyecto Supabase de producción: `epbtoarkinvgcaewbtvs` (**NO** el viejo `qjqhnjgznrtsgfowkzvw`).

---

## 0. Consultas iniciales (diagnóstico, sin cambios)

- **Tratamiento de horas según `tipo_hora` en `registros`**: el campo `tipo_hora_id` está sobrecargado y mezcla dos ejes. Catálogo `tipo_horas`: TARIFA (REG=1 ×1.0, HCOMP=2, MONT=3, FTRAB=4 ×1.75) y MOVIMIENTO (PNR=5, BIN=7, BOUT=8). El trigger `sync_registro_apunte` descompone cada jornada en apuntes (`registro_apuntes`): TARIFA→1 DEVENGO; PNR→par DEVENGO/DEVOLUCION_HD neto 0; BIN/BOUT (bolsa) pendientes.
- **Campos `hc`/`hf`/`hm`/`hd`**: **100% vacíos** (0 filas) sobre 341.177 registros. La magnitud vive en `horas`, diferenciada por `tipo_hora_id`. Son columnas legacy candidatas a borrado (pendiente).

---

## 1. Nocturnidad por contrato (commit `742bf9d`)

- **Esquema** (`contratos_nocturnidad.sql`, aplicado en prod): `contratos` + `tiene_nocturnidad boolean`, `nocturnidad_inicio time` (def 22:00), `nocturnidad_fin time` (def 06:00, cruza medianoche).
- **UI Contratos**: casilla + franja condicional en el formulario.
- **Generación de registros**: `buildRecordsForActivity` (concilia-integrated.js) calcula `horas_nocturnas` = solape del turno con la franja del contrato (`getActivityNightHours`, testeado, maneja medianoche).
- **Registros**: ocultadas (solo `hiddenInList`, NO borradas) las columnas muertas `hc/hf/hm/hd/horas_diurnas/clases/horas_2`; `horas_nocturnas` visible+ordenable.
- **Decisión**: `horas_nocturnas` SÍ se usa (34.521 filas) y se mantiene como registro histórico inmutable; `horas_diurnas` es redundante (= horas − nocturnas).

## 2. Historial laboral (commit `e7e6508`)

- **Filtros**: quitados "Alta hasta" y "Baja desde"; añadido "Tipo contratación" (`tipo_contratacion_id`). Decisión del usuario: el filtro de "tipo de contrato" es sobre **Tipo contratación** (no sobre la clave de Contrato).
- **Listado**: ocultadas columnas **Empresa** y **Puesto**; **Tipo contratación** movida tras Personal; encabezados con **ordenación** clicable (patrón como Actividades, orden natural de vacíos).
- **3 estados booleanos nuevos**: `enviado`, `gestionado`, `tramitado` (`historiales_laborales_estados` aplicado en prod; tabla + vista `historiales_laborales_detalle`). En listado (enviado/gestionado antes de Contrato; tramitado antes de Motivo baja), formulario, filtros (Todos/Sí/No) y asignación masiva.

## 3. Aviso de cambios sin guardar en paneles laterales (commit `e7e6508`)

- **Modal reutilizable de 3 opciones** `Guardar / Descartar / Cancelar` (`showUnsavedChangesDialog`) + guard `confirmCloseWithSave(form, saveFn)` en `app.js`, expuestos en `window.CoordinacionUnsaved` para Concilia. CSS `.unsaved-dialog*` en styles.css (z-index 60). **Verificado end-to-end** (los 5 casos).
- **Decisión**: modal de 3 botones (no `confirm` nativo) y aplicar a **todos** los drawers editables.
- **Cableados**: Contratos, Historial, Configuración, Accesos, Candidaturas (alta/detalle), Programación, Control, Evento, Cronograma, y Concilia (alta/edición de actividad, alumno). Patrón: `markFormPristine` al abrir, cierre `async` con guard, cierres internos `{force:true}`, `event?.preventDefault()`.
- **Excluidos a propósito**: **Personal** (form maestro-detalle inline, no drawer) y **Registros** (ya auto-guarda al cerrar). `confirmDiscardFormChanges` quedó como código muerto.

## 4. RLS de registros por contrato asignado (commit `e7e6508`)

- **Diagnóstico**: Contratos y Actividades **ya estaban scoped** por RLS (servicios asignados → contrato). El único hueco era **Registros** (todo `using(true)`).
- **Regla**: en `registros`, `servicio_id` es nulo en el 99,99%, así que el alcance es **por contrato**. Coordinator/area/viewer leen sus contratos; coordinator/area escriben en sus contratos; viewer no; admin todo.
- **Rendimiento (crítico)**: la función escalar por fila daba **timeout (~18 s)** sobre 341k filas. Solución: `contrato_id IN (select coordinacion_readable/manageable_contrato_ids())` (SET pequeño, SECURITY DEFINER, indexado) + admin como **subquery escalar** `(select is_coordinacion_admin())` (evaluado una vez) → **~65 ms**.
- **Aplicado en prod** (migraciones `coordinacion_contrato_id_sets` y `registros_coordinator_scope`). Fuente: `supabase/tables/coordinacion_contrato_id_sets.sql` y `supabase/policies/registros_write.sql`.
- **Validado por impersonación**: coordinador ve 53.463/341.177; admin todo; UPDATE fuera de alcance = 0 filas; UPDATE propio = 1 fila (trigger de apuntes incluido).
- **Decisión**: limitar lectura **y** escritura; aplicar y validar en el momento.

## 5. Registros: filtros, edición tipo Excel y coherencia servicio/contrato (pendiente de commit)

- **Filtros cruzados de Registros**: se cambió la lógica de desplegables para que cada filtro muestre valores compatibles con los demás filtros, excluyéndose a sí mismo. Ejemplo: contrato + persona limita instalaciones a donde esa persona tenga registros con ese contrato.
- **Carga inicial de Registros**: si no hay contrato seleccionado, "Todos" equivale a los contratos activos asignados al perfil (`get_records_filter_contratos`), no a todo lo visible por RLS.
- **Facetas de filtros**: el frontend usa `get_records_facets(p_fecha_desde, p_fecha_hasta, p_actividad_id)` para calcular combinaciones reales `contrato_id/servicio_id/personal_id/instalacion_id`. Fuente SQL: `supabase/tables/registros_filter_facets.sql`. En producción se comprobó que ambas RPC responden `200 OK`.
- **Modo edición tipo Excel**: se añadió una columna final de acciones con botón de borrar registro, visible solo con el modo Excel activo. Reutiliza la misma ruta de borrado que el panel de detalle y recarga tabla/filtros.
- **Rendimiento del modo Excel**: los selects relacionales ya no renderizan todas sus opciones al activar edición. Inicialmente muestran solo el valor actual y cargan el catálogo completo bajo demanda al enfocar/pulsar la celda. Esto evita multiplicar miles de `<option>` por fila.
- **Asignación masiva en Registros**: se añadió modo de selección manual con columna de ticks al principio, checkbox de cabecera para seleccionar/deseleccionar todos los registros filtrados visibles, botón de limpiar campos, botón de limpiar selección y borrado masivo con confirmación. Si el modo selección está activo, `Aplicar` y `Borrar seleccionados` actúan solo sobre los registros marcados.
- **Asignación masiva en Actividades**: el botón `Seleccionar` del bloque de asignación masiva reutiliza la selección existente de generación de registros. Con selección activa, `Aplicar` actúa solo sobre las actividades marcadas; sin selección activa mantiene el comportamiento por coincidencias/filtros.
- **Asignación masiva en Historial laboral**: se añadió selección manual equivalente a Registros, con columna inicial de ticks, checkbox de cabecera, contador y aplicación masiva solo sobre periodos seleccionados cuando el modo selección está activo.
- **Coherencia servicio/contrato en UI**: el select de `servicio_id` de cada fila se filtra por el `contrato_id` de esa fila; si se cambia `contrato_id` y el servicio actual no pertenece al nuevo contrato, se guarda `servicio_id = null`; si se intenta guardar un servicio incompatible, el frontend bloquea el guardado.
- **Coherencia servicio/contrato en DB**: se añadió `validate_registros_servicio_contrato` (`supabase/tables/registros_servicio_contrato_validation.sql`) y se aplicó en producción. Bloquea `INSERT/UPDATE` en `registros` cuando `servicio_id` no pertenece al `contrato_id` del registro, incluyendo el caso de `contrato_id` nulo.
- **Actividades**: ya tenía trigger equivalente `validate_actividades_servicio_contrato`; se actualizó el SQL fuente para usar la comparación estricta `new.contrato_id is distinct from service_contract_id`. Pendiente de confirmar/aplicar en producción si no se ha ejecutado aún.

## 6. Informes PDF, previsualizacion y reglas masivas contrato/servicio (10/07/2026)

- **Registros: informes filtrados**: se añadio `Previsualizar informe` como panel flotante con backdrop. Consulta todos los registros filtrados mediante `fetchRecordsForReport`, no solo los visibles en tabla, mantiene advertencia si supera `RECORDS_LOAD_LIMIT = 5000` y permite continuar o cancelar. Desde la previsualizacion se descargan el PDF clasico y el PDF compacto reutilizando las filas ya cargadas.
- **Registros: PDF clasico y compacto**: ambos informes usan todos los registros filtrados, paginados en bloques de 1000 desde Supabase. El PDF clasico mantiene el formato tipo resumen por persona; el compacto usa formato horizontal optimizado para comparar totales.
- **Actividades: informe horarios**: nuevo boton `Informe horarios` abre previsualizacion flotante agrupada por personal y permite descargar PDF. El informe muestra contrato, fechas, dias, horario, puesto, instalacion, horas y horas semanales.
- **Contrato + servicio en informes**: en Registros y Actividades, la columna de contrato pasa a mostrarse como `Contrato / Servicio` y el valor se renderiza como `Contrato · Servicio`. En Registros, el agrupado separa servicios distintos aunque compartan contrato para no mezclar horas.
- **Asignacion masiva Actividades**: se añadieron los campos `contrato_id` y `servicio_id`. Cambiar contrato guarda `servicio_id = null` con aviso en el confirm y mensaje final. Cambiar servicio valida que el servicio pertenezca al contrato de todas las actividades objetivo; las opciones de nuevo servicio se acotan al contrato cuando hay valor actual o seleccion manual suficiente.
- **Asignacion masiva Registros**: se aplico la misma logica que en Actividades. Cambiar contrato limpia `servicio_id`, cambiar servicio valida compatibilidad con contrato y las opciones de nuevo servicio se acotan al contrato de los registros objetivo cuando procede.
- **Publicacion/verificacion**: tras los cambios se ejecuto `.\scripts\publish.ps1 -SkipConfig` y `.\scripts\check.ps1` correctamente.

## 7. Gestion y Contabilidad Cronos/Banco (13/07/2026, pendiente de commit)

- **Nuevas pestanas privadas**: `gestion` y `contabilidad` se añadieron a `coordinacion_pestanas.sql`, al catalogo de accesos del frontend y a la navegacion privada.
- **Gestion**: nueva vista transversal por intervalo. Cruza historiales laborales solapados con el periodo y un pivote de horas de `registros` por puesto, situacion y tipo de hora. Usa `supabase/tables/gestion_resumen.sql` con `get_gestion_personal` y `get_gestion_registros_resumen`; ambas son `SECURITY INVOKER` para respetar el RLS de `registros` y acotan a contratos activos.
- **Contabilidad / Apuntes**: nueva tabla `cronos` para apuntes exportados de Cronos, con datos personales y RLS de lectura para admin o pestana `contabilidad`; escritura solo admin. RPC `get_cronos_filtros`, `get_cronos_resumen` y `get_cronos_page` para filtros, totales y paginacion sin `count:'exact'`.
- **Apuntes / filtros estrechos**: `get_cronos_filtros` recibe los filtros activos y devuelve `forma_pago` y `anulado` facetados, para que no aparezcan opciones sin resultados bajo el contexto actual.
- **Contabilidad / Banco**: nueva tabla `cronos_banco` para movimientos TPV, mismo modelo de RLS/escritura admin. RPC `get_cronos_banco_filtros`, `get_cronos_banco_resumen` y `get_cronos_banco_page`.
- **Ajustes UI finales de Contabilidad**: Apuntes compacta filtros para evitar desbordes y oculta `numero_factura` en el listado. Banco elimina filtro `terminal` y oculta columnas `terminal`/`tipo_operacion`; `get_cronos_banco_page` se recrea con `DROP FUNCTION` previo porque cambió el `returns table`.
- **Resultados Banco/Cronos**: `get_cronos_resultados` toma Banco como base y enlaza `cronos_banco.cod_pedido` con `cronos.identificador`, normalizando ceros a la izquierda con `ltrim(trim(identificador), '0')`. La UI tiene vista detalle y vista resumen; el resumen agrupa por mes/tarifa y exporta Excel/PDF.
- **Conciliacion Cronos/Banco**: `get_cronos_conciliacion` compara `cronos.identificador` normalizado sin ceros a la izquierda con `cronos_banco.cod_pedido` y devuelve apuntes/movimientos sin pareja por intervalo, con limite de filas mostrado y totales exactos.
- **Rendimiento/RLS**: las RPC de Contabilidad son `SECURITY DEFINER` con `set search_path = public` y guard de autorizacion evaluado una vez. Decision deliberada para evitar timeouts por RLS fila a fila sobre volumen grande; no convertir a `SECURITY INVOKER`.
- **Carga desde UI**: botones "Cargar CSV" en Apuntes y Banco. El frontend detecta codificacion, parsea `;`, convierte fechas/horas/numeros y hace reemplazo por rango de fechas (delete min-max + insert por lotes), porque los exports nuevos no garantizan clave unica fiable.
- **Carga CLI inicial**: nuevos scripts `scripts/import_cronos.py` y `scripts/import_cronos_banco.py`, con `--dry-run`, lotes de 5000 y escritura con `SUPABASE_SERVICE_ROLE_KEY` o `--service-role-key`.
- **UI de filtros**: se unifico el selector de personal con boton de limpiar y desplegable en Programacion/Control/Actividades/Registros, y se movieron las "x" de filtros dentro del control con visibilidad segun valor.

## 8. Historial laboral: importacion e informes PDF (14/07/2026)

- **Importacion Excel de historial laboral**: nuevo SQL `supabase/tables/coordinacion_historial_laboral_import.sql` con `can_manage_coordinacion_historial_laboral` e `import_coordinacion_historial_laboral(jsonb)`. La RPC valida permisos, payload, IDs duplicados y hace upsert por `id`, devolviendo filas origen/existentes/actualizadas/insertadas. La UI marca por defecto altas nuevas y filas existentes con diferencias.
- **Configuracion de informes**: nuevo SQL `supabase/tables/historial_laboral_informes_config.sql`. Mantiene plantillas editables por `tipo_documento` (`llamamiento`, `variacion`, `subrogacion`, `otro`) y mueve la configuracion documental a `public.empresas` en lugar de una tabla separada de empresa. Si existe `empresa_documentos_config`, migra datos y la elimina.
- **Empresas**: `supabase/tables/empresas.sql` incorpora campos documentales: logo URL/data URL, firma data URL, firmante, cargo, ciudad, direccion/telefono/email/web/notas. La UI de Configuracion incluye subpestana Empresas con carga de imagen en base64 para logo y firma.
- **Panel de informes en Historial laboral**: boton `Generar informe` desde el panel de un periodo. El panel permite elegir plantilla, fecha documento, fecha comienzo, ciudad firma y actividades incluidas. Por defecto incluye todas las actividades y permite `Incluir todas` / `Quitar todas`.
- **Actividades del informe**: los puestos y la tabla de horario salen de `actividades_detalle`, filtrando actividades que se solapan con el historial laboral (`fecha_alta` a `fecha_baja`; sin baja se considera indefinido). La columna de dias traduce `1..7` a dias de la semana.
- **Reglas de documento**: fecha documento propuesta = fecha comienzo - 15 dias. La UI avisa si el movimiento parece llamamiento/variacion/subrogacion y la plantilla seleccionada no coincide. El PDF se descarga como `Personal - tipo de movimiento - YYYY-MM-DD.pdf`, manteniendo espacios y acentos.
- **Publicacion local**: cambios replicados en `publish/coordinacion/`; ultimo cache-busting aplicado `app.js?v=20260714-12`.

## 9. Revisión de julio, filtros de Registros y solapes por empresa (21/07/2026)

- **Nóminas reales de referencia**: revisados `01.pdf` (38 páginas de julio) y `Laura González Balbona.pdf` (una nómina de junio y una liquidación de julio duplicada en el primer PDF). La estructura ordinaria confirma salario base proporcional, mes natural completo pagado como 30 días, prorrata de dos extras `base × 2/12` y las deducciones habituales (CC 4,70 %, MEI 0,15 %, formación 0,10 %, desempleo generalmente 1,55 % e IRPF individual).
- **Limitaciones confirmadas del motor de nómina**: todavía no reproduce vacaciones no disfrutadas, parte proporcional de vacaciones del finiquito, absentismo, incapacidad temporal/prestación de enfermedad ni el bloque de finiquito. Tampoco aplica topes mínimos/máximos de cotización; las nóminas reales demuestran casos donde la base de Seguridad Social supera el devengado. No dar por bueno el líquido del motor para esos casos hasta implementar estas reglas.
- **Filtros de fecha de Registros**: `Desde` y `Hasta` pasan de 120 a 155 px. Se reduce el espacio reservado a la derecha y se coloca la `×` inmediatamente a la izquierda del calendario nativo, ambos dentro del control, para que la fecha completa sea visible. CSS `styles.css?v=20260721-4`.
- **Validación de solapes de Historial laboral**: un aviso solo se considera sospechoso cuando coinciden persona, puesto, intervalo y **empresa**. Periodos simultáneos en empresas distintas son pluriempleo legítimo y no muestran confirmación. Dos periodos con `empresa_id` nulo sí se consideran de la misma empresa a estos efectos.
- **Guardado individual**: `findSuspiciousHistorialOverlaps` consulta ahora `empresa_id/empresa`, e `isLegitHistorialOverlap` descarta primero las parejas de empresas distintas. El texto del aviso deja explícito que se trata del mismo puesto y la misma empresa.
- **Asignación masiva**: el mismo criterio se aplica al cambiar `fecha_alta`, `fecha_baja` o `empresa_id`. Cambiar una empresa puede convertir un pluriempleo antes legítimo en un solape sospechoso, por lo que también se comprueba antes de confirmar el lote. JS `app.js?v=20260721-6`.
- **Publicación/verificación local**: fuentes replicadas en `publish/coordinacion/` mediante `publish.ps1 -SkipConfig`; `check.ps1`, `node --check` y `git diff --check` correctos. Cambios pendientes de commit y de subida a IONOS.

---

## Estado actual

- **Git**: rama `main`, repositorio remoto `origin` en GitHub (`jrartime/CoordinacionEDP`). Cambios de Historial laboral/Informes, Empresas, Contabilidad y documentacion preparados para commit/push al cierre de la sesion.
- **Base de datos de producción**: aplicadas las migraciones anteriores (nocturnidad, estados de historial, RLS de registros), aplicado `registros_servicio_contrato_validation.sql` y confirmada la version estricta de Actividades segun la conversacion. Las RPC de facetas de Registros existen y responden en producción.
- **Web (IONOS)**: `publish/coordinacion/` **subido** al subdominio `coordinacion.edpsl.es`. En vivo.
- **Verificación**: `node --check coordinacion/app.js`, `node --check coordinacion/concilia-integrated.js`, `.\scripts\publish.ps1 -SkipConfig`, `.\scripts\check.ps1` OK.

## Pendientes / posibles siguientes pasos

- **Carpeta canonica**: `README.md` ya marca `D:\Programacion\CoordinacionEDP` como copia activa.
- **Limpieza de columnas muertas** de `registros`: `DROP COLUMN hc/hf/hm/hd/clases/horas_2` (y valorar `horas_diurnas`). Decidido "solo ocultar" por ahora.
- **Modelo de horas por apuntes, paso 2 restante**: bolsa de horas (BIN/BOUT) y panel de saldo (vista `bolsa_horas_saldo`).
- Confirmar que `registro_apuntes` está backfilled para las 341k filas (el comentario original hablaba de 436).

_(Completado: subida a IONOS y prueba logueado coordinador vs admin — OK.)_

## 10. Gestión enlazada con Personal, Historial y Registros (22/07/2026)

- **Edición de persona desde Gestión**: cuando hay una persona filtrada aparece `Ver y editar persona`. La ficha existente de Personal se reutiliza dentro de un drawer temporal (no se duplica el formulario); `Cerrar y guardar` persiste los cambios y recarga Gestión. El botón solo aparece con acceso a la pestaña Personal.
- **Historiales solapados editables**: el nombre de la persona en cada periodo funciona como enlace y abre el panel lateral existente de Historial laboral. Los cambios notificados por `CoordinacionHistorial.onChange` recargan Gestión. Se respeta el permiso de la pestaña Historial.
- **Detalle de horas**: pulsar el pivote `Horas de registros` abre un panel flotante con los registros reales de la persona y el intervalo, respetando también el filtro de empresa. Cada fila puede abrir el editor completo de Registro; al cerrarlo se recargan el pivote y el listado flotante.
- **Opciones de nómina**: el antiguo bloque `Cálculo de nómina` pasa a llamarse `Opciones nómina`. `Base de cálculo` y `Ajuste de jornada` usan el tamaño/tipografía de los filtros compactos y se apilan en la columna izquierda, reservando la derecha para futuras opciones.
- **Permisos y publicación**: los enlaces de edición comprueban las pestañas `personal`, `historial` y `registros`; los cambios están replicados en `publish/coordinacion/` con cache-busting de JS/CSS.

## 11. Historial y reversión de Registros (23/07/2026)

- **Auditoría persistente**: `supabase/tables/registros_cambios.sql` registra altas, ediciones y eliminaciones con las versiones anterior/nueva, fecha y usuario. El historial empieza a recopilar cambios cuando se aplica esta migración; no reconstruye versiones anteriores.
- **Permisos**: la lectura se limita a los contratos visibles del perfil. La RPC `revertir_registro_cambio` es `SECURITY INVOKER`, por lo que conserva el RLS de escritura de `registros`.
- **Reversión segura**: si el registro tiene una edición posterior, obliga a revertir primero el cambio más reciente para no sobrescribir trabajo nuevo.
- **Panel de Registros**: `Últimos cambios` muestra las 50 operaciones más recientes y permite abrir el editor habitual o revertir la operación.
- **Despliegue requerido**: ejecutar `supabase/tables/registros_cambios.sql` en el SQL Editor de Supabase antes de publicar la interfaz.
- **Campos obligatorios**: `supabase/tables/registros_campos_obligatorios.sql` impide nuevas altas o modificaciones sin `fecha`, `personal_id`, `puesto_id` y `funcion_id`. Usa restricciones `NOT VALID` para no bloquear el despliegue por filas históricas incompletas; la interfaz marca esos cuatro controles como obligatorios y evita vaciarlos también en edición Excel, ficha, duplicado y asignación masiva.

## 12. Nóminas persistidas: la Fase 6 y el registro laboral (23/07/2026)

- **La nómina emitida se congela**: `supabase/tables/nominas.sql` crea `nominas` (cabecera con totales y los parámetros con los que se calculó) y `nomina_lineas` (el desglose entero). A partir de la emisión la nómina se **lee de esas tablas**, así que corregir después una tarifa de convenio, un complemento o una regla del motor ya no la mueve.
- **Una nómina puede tener varios periodos, y un mes varias nóminas**: la clave de unicidad es `personal_id + empresa_id + periodo + historial_ids`. Dos contratos simultáneos son **una** nómina con dos periodos; dos vidas laborales que no se solapan son **dos** nóminas del mismo mes.
- **No es solo el recibo, es el registro laboral**. Además de las líneas se guardan:
  - `nomina_historiales`: la foto del contrato de cada periodo/puesto — convenio y sus tarifas, jornada, coeficiente, horas teóricas, modalidad de pago y ajuste realmente aplicado, flags de pluses y tipos de cotización.
  - `nomina_horas`: las horas por puesto × tipo de hora × situación, con días, número de registros y **los ids de los registros de origen**. Incluye las excluidas (CAMB/LG) marcadas, para que el registro esté completo.
  - `nomina_lineas` con `ambito`: `persona` son las líneas que suman; `puesto` es el mismo dinero explicado historial a historial. Cada línea lleva `cantidad`, `precio` y `codigo_nomina` además del detalle en prosa.
- **Cambio en el motor**: `calcular_nomina_persona` devuelve ahora `cantidad` y `precio` (antes se perdían al agregar). Hubo que **dropear y recrear la función**: no se puede cambiar el tipo de retorno con `create or replace`. Los importes no varían. Al agregar entre puestos la cantidad se suma pero el precio solo se conserva si todos coinciden.
- **Editar conceptos**: `emitir_nomina` acepta `p_lineas jsonb`; esas líneas sustituyen a las del motor y la nómina queda marcada `editada`. El expediente se congela igual — lo trabajado no se edita, solo lo que se paga por ello. Las filas de desglose (`detalle_de`) no entran en el editor.
- **Reemitir y anular**: emitir sobre un periodo que ya tiene nómina viva da error salvo que se pida reemplazar; entonces la anterior queda `anulada` y la nueva la referencia con `sustituye_a`. Anular nunca borra: conserva el desglose como histórico.
- **UI de Gestión**: botones `Emitir nómina` y `Editar nómina` en la tarjeta del total; bloque `Nóminas emitidas` donde cada una despliega el recibo congelado y, debajo, el expediente por periodo, con `Editar` y `Anular`. Todo limitado a admin, igual que la RLS de las cuatro tablas.
- **Contador de horas**: el `Total:` del pivote pasa a `Total: 145,5 h de 140,8 h teóricas`. Las teóricas vienen de `get_gestion_horas_teoricas`, que suma `horas_teoricas_jornada` del tramo de cada periodo que solape el rango.
- **Despliegue requerido**: ejecutar `supabase/tables/nominas.sql` y `supabase/tables/nomina_calculo_persona.sql` en el SQL Editor de Supabase. Ya están aplicados en el proyecto real; el fichero es la copia de referencia.

## Notas de entorno / convenciones

- **Acciones de paneles**: cabecera fija para herramientas y cierre; pie fijo para eliminar/archivar, descartar y guardar/confirmar. `coordinacion/icons.svg` contiene el catálogo común y `decorateStaticActionButtons` aplica iconos también a botones generados dinámicamente.

- Sin framework de build; JS vanilla. `index.html` carga solo `app.js` + `concilia-integrated.js` (los `coordinacion/modules/*.js` son un refactor **no conectado / código muerto**).
- Versionado de assets con `?v=YYYYMMDD-N` (bumpear al editar JS/CSS).
- Despliegue: editar en fuentes → `.\scripts\publish.ps1 -SkipConfig` → subir `publish/<app>/` a IONOS.
- El usuario commitea directo a `main`. Responder siempre en español.
