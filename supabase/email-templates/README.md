# Plantillas de correo de Supabase Auth

Los correos que Supabase envía (recuperar contraseña, invitación) llegaban con la
plantilla por defecto **en inglés** ("Reset Password"). Estos ficheros son la
versión en español.

## Cómo se aplican

**No se despliegan con `publish.ps1` ni con SQL**: las plantillas viven en la
configuración del proyecto de Supabase, no en la base de datos. Hay que pegarlas a
mano en el panel:

1. Supabase → proyecto `epbtoarkinvgcaewbtvs` → **Authentication** → **Emails**
   (Email Templates).
2. Elegir la pestaña de la plantilla y pegar el contenido del fichero
   correspondiente, **sin el comentario `<!-- -->` de la cabecera**.
3. Ajustar el asunto (*Subject*) con el que se indica en cada fichero.
4. Guardar y probar el flujo real desde la app.

| Fichero | Plantilla en el panel | Asunto sugerido |
|---|---|---|
| `recovery.html` | Reset Password | Restablecer tu contraseña de acceso |
| `invite.html` | Invite user | Invitación al panel de Coordinación |

Estos ficheros son la **copia de referencia**: si se edita la plantilla desde el
panel, conviene actualizar también el fichero para que no se desincronicen.

## Variables

Las que usa Supabase dentro de la plantilla:

- `{{ .ConfirmationURL }}` — enlace de acción (el único imprescindible).
- `{{ .SiteURL }}`, `{{ .Email }}`, `{{ .Token }}`, `{{ .TokenHash }}`,
  `{{ .RedirectTo }}`.

La app atiende los tipos `invite` y `recovery` al volver del enlace
(`getAuthUrlType()` en `coordinacion/app.js`), de ahí que solo estén traducidas
esas dos plantillas.
