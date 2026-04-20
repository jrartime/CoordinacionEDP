# Curriculos EDP

Aplicacion web para recibir y gestionar candidaturas conectada directamente con Supabase.

## Que incluye

- `index.html`: panel publico de envio y panel privado de gestion.
- `app.js`: login privado, insercion publica, subida opcional de CV y descarga desde el panel privado.
- `styles.css`: interfaz adaptada al estilo corporativo.
- `supabase/schema.sql`: tabla `candidates`, policies y bucket de Storage.

## Configuracion

Edita [config.js](./config.js):

```js
window.APP_CONFIG = {
  supabase: {
    url: "https://TU-PROYECTO.supabase.co",
    anonKey: "TU-ANON-KEY",
    bucket: "candidate-cvs",
  },
};
```

La aplicacion ya no tiene fallback local. Si falta cualquiera de esos valores, mostrara error y no funcionara.

## Preparacion de Supabase

1. Crea el proyecto en Supabase.
2. Ejecuta [supabase/schema.sql](./supabase/schema.sql) en SQL Editor.
3. Crea al menos un usuario interno en `Authentication > Users`.
4. Copia la `Project URL` y la `anon key` en `config.js`.

Notas de seguridad:

- La tabla `candidates` permite inserciones anonimas solo para registros con `source = 'public'` y `privacy_accepted = true`.
- El bucket `candidate-cvs` es privado.
- Los usuarios autenticados del panel privado pueden leer candidaturas y descargar archivos.

## Como arrancarlo

```powershell
python -m http.server 8080
```

Luego abre `http://localhost:8080`.

## Fuentes oficiales usadas

- Insert con `supabase-js`: https://supabase.com/docs/reference/javascript/insert
- Login con email y contrasena: https://supabase.com/docs/reference/javascript/auth-signinwithpassword
- Upload a Storage: https://supabase.com/docs/reference/javascript/storage-from-upload
- Creacion de buckets y policies: https://supabase.com/docs/guides/storage/buckets/creating-buckets
