## Publicacion en WordPress

Ruta prevista:

`https://www.edpsl.es/curriculos/`

Archivos que hay que subir al hosting dentro de la carpeta `/curriculos/`:

- `index.html`
- `app.js`
- `styles.css`
- `config.js`

No hace falta subir:

- `supabase/`
- `.git/`
- `README.md`
- `config.example.js`

Pasos recomendados:

1. Crear la carpeta `/curriculos/` en el hosting.
2. Subir los 4 archivos anteriores.
3. Comprobar que en WordPress no exista una pagina o slug llamado `curriculos`.
4. Abrir `https://www.edpsl.es/curriculos/`.

Comprobaciones si no carga bien:

- Ver que `config.js` esta presente en la carpeta publicada.
- Ver que `index.html` referencia `./styles.css`, `./config.js` y `./app.js`.
- Ver que WordPress no esta interceptando la ruta `/curriculos/`.
