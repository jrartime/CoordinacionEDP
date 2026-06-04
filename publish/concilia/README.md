# Concilia EDP

Sitio independiente para `concilia.edpsl.es`.

## Funcionamiento

- Usa Supabase Auth para iniciar sesion con los mismos usuarios internos.
- Usa el mismo proyecto de Supabase configurado en `config.js`.
- Tras iniciar sesion, busca una ficha en `public.personal` por el email del usuario autenticado.
- Soporta enlaces de invitacion y recuperacion de Supabase para crear contrasena.
- Mantiene un acceso directo al sistema externo de Concilia Oviedo mientras se definen los modulos propios.

## Archivos

- `index.html`: estructura del login y panel.
- `app.js`: autenticacion, restauracion de sesion y lectura de perfil.
- `styles.css`: estilos del sitio.
- `config.js`: configuracion publica de Supabase.
- `.htaccess`: entrada por `index.html`.

## Supabase

En `Authentication > URL Configuration`, anade:

```text
https://concilia.edpsl.es/
https://concilia.edpsl.es/**
```

La tabla `personal` debe permitir lectura a usuarios autenticados.
