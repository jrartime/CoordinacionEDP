# Coordinacion EDP

Aplicacion web estatica conectada a Supabase para:

- Gestionar el panel principal privado de coordinacion en `coordinacion.edpsl.es`.
- Recibir candidaturas publicas en `curriculos.edpsl.es`.
- Mostrar programacion publica en `programacion.edpsl.es`.
- Gestionar el acceso privado de `concilia.edpsl.es` con usuarios de Supabase Auth.

## Carpeta principal

La copia de trabajo recomendada es `D:\Respaldo programacion\CoordinacionEDP`.
La carpeta `D:\Programación\CoordinacionEDP` queda como referencia anterior y no
debe usarse para nuevos cambios salvo que se quiera rescatar algo puntual.

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
- `supabase/tables/actividades.sql`: trigger equivalente en Actividades, con comparacion estricta de contrato/servicio.

Cuando se cambie SQL, ejecuta el archivo correspondiente en el SQL Editor de Supabase
y deja constancia en `contexto-previo.md`.

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
