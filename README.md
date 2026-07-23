# Coordinacion EDP

Aplicacion web estatica conectada a Supabase para:

- Gestionar el panel principal privado de coordinacion en `coordinacion.edpsl.es`.
- Recibir candidaturas publicas en `curriculos.edpsl.es`.
- Mostrar programacion publica en `programacion.edpsl.es`.
- Gestionar el acceso privado de `concilia.edpsl.es` con usuarios de Supabase Auth.

## Carpeta principal

La copia de trabajo activa es `D:\Programacion\CoordinacionEDP`.

## Estructura

- `coordinacion/`: app principal del proyecto. Es el document root de `coordinacion.edpsl.es` y arranca directamente en login.
- `curriculos/`: formulario publico de candidaturas para `curriculos.edpsl.es`.
- `programacion/`: panel publico de programacion para `programacion.edpsl.es`.
- `concilia/`: sitio independiente para `concilia.edpsl.es`.
- `publish/`: carpetas listas para subir al hosting.
- `supabase/`: esquema, tablas, policies y seeds.
- `scripts/`: utilidades de importacion/exportacion.

## Despliegue

Genera primero las carpetas de publicacion desde los archivos fuente:

```powershell
.\scripts\publish.ps1
```

Antes de subir, puedes ejecutar las comprobaciones basicas:

```powershell
.\scripts\check.ps1
```

Si quieres conservar los `config.js` ya editados dentro de `publish/`, ejecuta:

```powershell
.\scripts\publish.ps1 -SkipConfig
```

Sube estas carpetas del directorio `publish/` al document root correspondiente en IONOS:

- `publish/coordinacion/` -> `https://coordinacion.edpsl.es/`
- `publish/curriculos/` -> `https://curriculos.edpsl.es/`
- `publish/programacion/` -> `https://programacion.edpsl.es/`
- `publish/concilia/` -> `https://concilia.edpsl.es/`

Los paneles publicos enlazan el acceso privado a `https://coordinacion.edpsl.es/`.

Cada carpeta generada dentro de `publish/` incluye su propia copia de `shared/`,
por lo que puede subirse como document root independiente del subdominio.

## Configuracion

Edita los `config.js` publicados si cambia el proyecto de Supabase:

```js
window.APP_CONFIG = {
  supabase: {
    url: "https://TU-PROYECTO.supabase.co",
    anonKey: "TU-ANON-KEY",
    bucket: "candidate-cvs",
  },
};
```

El login privado usa usuarios de Supabase Auth. No hay contrasenas locales en el codigo.

## Supabase Concilia

Para crear la tabla inicial de usuarios de Concilia:

1. Ejecuta `supabase/tables/concilia_usuarios.sql`.
2. Importa `exports/concilia_usuarios_import.csv` desde el Table Editor de Supabase.

El CSV limpio se genera desde el CSV original con:

```powershell
python scripts\convert_concilia_usuarios_csv.py "d:\Dropbox\EDP\Coordinación ConciliaOviedo\APERTURA Colegios\0. VERANO 2026\cargar.csv" exports\concilia_usuarios_import.csv --csv
```

## Supabase Coordinacion

Las migraciones SQL de Coordinacion viven en `supabase/tables/` y `supabase/policies/`.
Los cambios recientes de Registros dependen de:

- `supabase/tables/registros_filter_facets.sql`: RPC para filtros cruzados de Registros.
- `supabase/tables/registros_servicio_contrato_validation.sql`: trigger que impide servicios fuera del contrato del registro.
- `supabase/tables/registros_cambios.sql`: auditoria de cambios de Registros y RPC de reversion segura.
- `supabase/tables/registros_campos_obligatorios.sql`: exige fecha, personal, puesto y funcion sin romper filas historicas incompletas.
- `supabase/tables/actividades.sql`: trigger equivalente en Actividades, con comparacion estricta de contrato/servicio.
- `supabase/tables/gestion_resumen.sql`: RPC de Gestion para agregados exactos de registros y selector de personal por intervalo.
- `supabase/tables/nominas.sql`: nominas emitidas y congeladas (cabecera, lineas, contexto laboral y horas por puesto), con `emitir_nomina` y `anular_nomina`.
- `supabase/tables/nomina_calculo.sql` y `nomina_calculo_persona.sql`: motor de calculo (devengos por puesto y nomina real de la persona).
- `supabase/tables/cronos.sql`: tabla `cronos`, RPC de Apuntes, vista `cronos_detalle` y conciliacion Cronos/Banco.
- `supabase/tables/cronos_banco.sql`: tabla `cronos_banco`, RPC de Banco y Resultados Banco/Cronos.
- `supabase/tables/coordinacion_pestanas.sql`: catalogo de pestanas; incluye `gestion` y `contabilidad`.
- `supabase/tables/coordinacion_historial_laboral_import.sql`: RPC de importacion Excel de historial laboral con upsert por ID.
- `supabase/tables/historial_laboral_informes_config.sql`: plantillas editables para informes laborales y campos documentales de empresa.
- `supabase/tables/empresas.sql`: campos documentales de empresa usados por informes de historial laboral.

Cuando se cambie SQL, ejecuta el archivo correspondiente en el SQL Editor de Supabase
y deja constancia en `contexto-previo.md`.

## Convención de acciones en paneles

- La cabecera fija contiene contexto, acciones auxiliares y el cierre con icono.
- El pie fijo contiene acciones destructivas a la izquierda y confirmación/guardado a la derecha.
- Los botones universales usan icono y tooltip; guardar, aplicar, revertir, archivar y descargar conservan texto.
- El catálogo compartido vive en `coordinacion/icons.svg`; la decoración semántica está en `coordinacion/app.js`.

## Gestion y Contabilidad

- **Gestion** cruza historiales laborales y registros por intervalo. Usa `get_gestion_personal` para listar solo personal con registros visibles y `get_gestion_registros_resumen` para pivotar horas server-side por puesto, situacion y tipo de hora. Las funciones son `SECURITY INVOKER`, por lo que respetan el RLS de `registros`.
- **Contabilidad** trabaja con `cronos` (apuntes de Cronos) y `cronos_banco` (movimientos TPV). Tiene subpestanas Apuntes, Banco, Resultados y Conciliacion.
- Apuntes/Banco usan RPC paginados y RPC de resumen para evitar `count:'exact'` sobre muchas filas bajo RLS. Los filtros y totales se calculan server-side.
- La UI compacta Apuntes para que los filtros entren en el panel; el listado oculta `numero_factura`. Banco oculta `terminal` y `tipo_operacion`, y no muestra filtro de terminal.
- Resultados usa `get_cronos_resultados`: toma Banco como base, enlaza `cronos_banco.cod_pedido` con `cronos.identificador` normalizado sin ceros a la izquierda, y ofrece vista Detalle y Resumen. El resumen puede exportarse a Excel/PDF desde la UI.
- Conciliacion usa `get_cronos_conciliacion`: compara `cronos.identificador` normalizado sin ceros a la izquierda con `cronos_banco.cod_pedido` y muestra apuntes/movimientos sin pareja dentro del intervalo.
- RLS de `cronos` y `cronos_banco`: lectura para administradores o usuarios con pestana `contabilidad`; escritura solo administradores para permitir carga/reemplazo desde la app.
- Los scripts CLI de carga inicial son `scripts/import_cronos.py` y `scripts/import_cronos_banco.py`; requieren `SUPABASE_SERVICE_ROLE_KEY` o `--service-role-key`, soportan `--dry-run` y cargan por lotes.

## Informes y asignacion masiva

- Al seleccionar una persona y un intervalo completo en Registros, la barra de resultados muestra un resumen compacto de Horas, HC, HFest, HMon, PNR, Noct y Total, seguido de las horas teoricas calculadas a partir de los historiales laborales solapados.
- El panel lateral de Registros prioriza los campos operativos. Categoria, HC, HF, HM, horas diurnas, clases, horas 2 y año permanecen almacenados y disponibles para informes/calculos, pero no se muestran en ese formulario.
- Registros incluye previsualizacion flotante de informe con dos salidas: PDF clasico y PDF compacto. La previsualizacion consulta todos los registros filtrados y muestra advertencia si el volumen supera el limite configurado.
- Actividades incluye previsualizacion flotante del informe de horarios filtrado, agrupado por personal, con descarga PDF posterior.
- Historial laboral incluye informes PDF de llamamiento, variacion y subrogacion desde un periodo seleccionado. Las plantillas se configuran desde Historial laboral > Configuracion de informes y los datos documentales de empresa desde Configuracion > Empresas.
- Los informes de historial toman puestos y tabla de horario desde `actividades_detalle`, usando actividades que se solapan con el periodo laboral (`fecha_alta` a `fecha_baja`; sin baja se considera indefinido). En el panel de generacion se pueden incluir/quitar actividades antes de descargar.
- La fecha del documento de historial se propone como 15 dias antes de la fecha de comienzo. La descarga usa el patron `Personal - tipo de movimiento - YYYY-MM-DD.pdf`, manteniendo espacios y acentos.
- La UI avisa si el movimiento del historial parece llamamiento, variacion o subrogacion y la plantilla seleccionada no corresponde con ese tipo.
- En los informes de Registros y Actividades, la celda de contrato muestra tambien el servicio asociado.
- En la asignacion masiva de Registros y Actividades, si se cambia `contrato_id` se limpia `servicio_id` y se muestra aviso. Si se cambia `servicio_id`, el frontend valida que el servicio pertenezca al contrato de todos los elementos objetivo.
- El blindaje anterior se complementa con triggers SQL en Supabase para evitar incoherencias aunque un cambio no pase por la interfaz.
- Los avisos de solape de Historial laboral solo tratan como conflicto los periodos de la misma persona, puesto y empresa. Los periodos simultaneos en empresas distintas se consideran pluriempleo legitimo.

## Nominas: limitaciones conocidas

- El calculo ordinario contempla salario base, prorrata de pagas, complementos, bases, deducciones e IRPF, pero todavia no reproduce vacaciones de finiquito, absentismo ni incapacidad temporal.
- Los topes minimos y maximos de cotizacion aun no estan aplicados. En meses parciales la base de Seguridad Social calculada puede diferir de la nomina real aunque el devengado ordinario cuadre.

## Desarrollo local

```powershell
python -m http.server 8080
```

Abre:

- `http://localhost:8080/` redirige a `http://localhost:8080/coordinacion/`
- `http://localhost:8080/coordinacion/`
- `http://localhost:8080/curriculos/`
- `http://localhost:8080/programacion/`
- `http://localhost:8080/concilia/`
