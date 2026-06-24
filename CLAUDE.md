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
