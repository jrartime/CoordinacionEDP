## Publicacion en IONOS

El proyecto queda separado por subdominios:

- `curriculos.edpsl.es`: formulario publico de candidaturas.
- `programacion.edpsl.es`: panel publico de programacion.
- `coordinacion.edpsl.es`: login y panel privado de coordinacion.
- `concilia.edpsl.es`: login propio de Concilia EDP con usuarios de Supabase Auth.

## Carpetas a subir

Antes de subir, regenera las carpetas de `publish/` desde la raiz del proyecto:

```powershell
.\scripts\publish.ps1
```

Usa `.\scripts\publish.ps1 -SkipConfig` si los `config.js` publicados se editan manualmente en `publish/`.

Sube el contenido de cada carpeta al document root del subdominio correspondiente:

- `publish/curriculos/` -> `https://curriculos.edpsl.es/`
- `publish/programacion/` -> `https://programacion.edpsl.es/`
- `publish/coordinacion/` -> `https://coordinacion.edpsl.es/`
- `publish/concilia/` -> `https://concilia.edpsl.es/`

Las carpetas de curriculos, programacion y coordinacion deben contener:

- `index.html`
- `app.js`
- `styles.css`
- `config.js`
- `.htaccess`

La carpeta de concilia debe contener:

- `index.html`
- `app.js`
- `styles.css`
- `config.js`
- `.htaccess`

## Funcionamiento

- Al entrar en `https://coordinacion.edpsl.es/` se muestra directamente la pantalla de login.
- Al entrar en `https://concilia.edpsl.es/` se muestra el login propio de Concilia EDP.
- El boton `Acceso privado` de curriculos y programacion abre `https://coordinacion.edpsl.es/`.
- La autenticacion privada depende de Supabase Auth. Crea o gestiona los usuarios internos en `Authentication > Users`.

## Supabase programacion conserjes

Para dejar el panel publico funcionando:

1. Ejecuta `supabase/tables/programacion_conserjes.sql`.
2. Ejecuta `supabase/policies/programacion_conserjes.sql`.
3. Si quieres cargar el CSV actual de una vez, ejecuta `supabase/seed_findesemana.sql`.

## Supabase Concilia

Para crear y cargar la primera tabla de usuarios de Concilia:

1. Ejecuta `supabase/tables/concilia_usuarios.sql`.
2. Importa `exports/concilia_usuarios_import.csv` desde el Table Editor de Supabase.
