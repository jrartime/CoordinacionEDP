/**
 * shared/auth.js
 *
 * Utilidades de autenticacion Supabase compartidas entre apps.
 * Depende de shared/supabase-client.js (debe cargarse primero).
 *
 * Expone: window.SupabaseApp.createAuthHandlers / clearAuthUrl / getAuthUrlType
 *
 * USO:
 *   const auth = window.SupabaseApp.createAuthHandlers({
 *     setStatus: (msg, tone) => { ... },
 *     onLoginSuccess: async (data) => { ... },
 *     onLogoutSuccess: async () => { ... },
 *     onInviteSuccess: async (email) => { ... },
 *   });
 *
 *   loginForm.addEventListener("submit", auth.handleLogin);
 *   logoutButton.addEventListener("click", auth.handleLogout);
 */
(function () {
  "use strict";

  // -----------------------------------------------
  // URL helpers (idénticos en coordinacion y concilia)
  // -----------------------------------------------

  function clearAuthUrl() {
    if (!window.location.search && !window.location.hash) {
      return;
    }
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  function getAuthUrlType() {
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    return searchParams.get("type") || hashParams.get("type") || "";
  }

  // -----------------------------------------------
  // Factory de handlers de autenticación
  // -----------------------------------------------

  /**
   * Crea los handlers de auth configurados con callbacks específicos de cada app.
   *
   * @param {object} callbacks
   * @param {function} callbacks.setStatus          - (msg: string, tone?: string) => void
   * @param {function} [callbacks.onLoginSuccess]   - async (data: AuthData) => void — llamado tras login correcto
   * @param {function} [callbacks.onLogoutSuccess]  - async () => void — llamado tras logout correcto
   * @param {function} [callbacks.onLogoutError]    - (error: Error) => void
   * @param {function} [callbacks.onInviteSuccess]  - async (email: string) => void — llamado tras configurar contraseña de invitación
   * @param {function} [callbacks.onPasswordRecoverySent] - () => void — llamado tras enviar email de recuperación
   */
  function createAuthHandlers({
    setStatus = () => {},
    onLoginSuccess,
    onLogoutSuccess,
    onLogoutError,
    onInviteSuccess,
    onPasswordRecoverySent,
  } = {}) {

    // --- Login ---

    async function handleLogin(event) {
      event.preventDefault();

      const email = document.querySelector("#login-email")?.value?.trim() ?? "";
      const password = document.querySelector("#login-password")?.value ?? "";

      if (!email || !password) {
        setStatus("Introduce el correo y la contraseña.", "error");
        return;
      }

      try {
        setStatus("Validando acceso...");
        const supabase = await window.SupabaseApp.getClient();
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          setStatus(`No se pudo iniciar sesion: ${error.message}`, "error");
          return;
        }

        window.SupabaseApp.setSession(data.session);
        await onLoginSuccess?.(data);
        setStatus("Acceso concedido.", "success");
      } catch (error) {
        setStatus(`No se pudo iniciar sesion: ${error.message}`, "error");
      }
    }

    // --- Recuperación de contraseña ---

    async function handlePasswordRecovery(event) {
      event.preventDefault();

      const emailInput =
        document.querySelector("#password-recovery-email") ??
        document.querySelector("#login-email");
      const email = emailInput?.value?.trim() ?? "";

      if (!email) {
        setStatus("Escribe el correo para recuperar la contrasena.", "error");
        return;
      }

      try {
        setStatus("Enviando enlace de recuperacion...");
        const supabase = await window.SupabaseApp.getClient();
        const redirectTo = `${window.location.origin}${window.location.pathname}`;
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

        if (error) {
          setStatus(`No se pudo enviar el enlace: ${error.message}`, "error");
          return;
        }

        onPasswordRecoverySent?.();
        setStatus("Enlace de recuperacion enviado. Revisa el correo.", "success");
      } catch (error) {
        setStatus(`No se pudo enviar el enlace: ${error.message}`, "error");
      }
    }

    // --- Logout ---

    async function handleLogout() {
      try {
        const supabase = await window.SupabaseApp.getClient();
        const { error } = await supabase.auth.signOut();

        if (error) {
          setStatus(`No se pudo cerrar sesion: ${error.message}`, "error");
          onLogoutError?.(error);
          return;
        }

        window.SupabaseApp.setSession(null);
        await onLogoutSuccess?.();
        setStatus("Sesion cerrada.");
      } catch (error) {
        setStatus(`Error al cerrar sesion: ${error.message}`, "error");
      }
    }

    // --- Configuración de contraseña de invitación ---

    async function handleInviteSetup(event) {
      event.preventDefault();

      const password = document.querySelector("#invite-password")?.value ?? "";
      const passwordConfirm = document.querySelector("#invite-password-confirm")?.value ?? "";

      if (password.length < 8) {
        setStatus("La contrasena debe tener al menos 8 caracteres.", "error");
        return;
      }

      if (password !== passwordConfirm) {
        setStatus("Las contrasenas no coinciden.", "error");
        return;
      }

      try {
        setStatus("Guardando contrasena...");
        const supabase = await window.SupabaseApp.getClient();
        const { data, error } = await supabase.auth.updateUser({ password });

        if (error) {
          setStatus(`No se pudo guardar la contrasena: ${error.message}`, "error");
          return;
        }

        const session = await window.SupabaseApp.ensureSession({ silent: true });
        window.SupabaseApp.setSession(session);
        clearAuthUrl();

        const email = data.user?.email ?? session?.user?.email ?? "";
        await onInviteSuccess?.(email);
        setStatus("Contrasena creada. Acceso concedido.", "success");
      } catch (error) {
        setStatus(`No se pudo completar la invitacion: ${error.message}`, "error");
      }
    }

    // --- Restaurar sesión al cargar ---

    async function restoreSession() {
      const session = await window.SupabaseApp.ensureSession({ silent: true });
      return session;
    }

    return {
      handleLogin,
      handlePasswordRecovery,
      handleLogout,
      handleInviteSetup,
      restoreSession,
    };
  }

  // -----------------------------------------------
  // Añadir al namespace global SupabaseApp
  // -----------------------------------------------

  window.SupabaseApp = window.SupabaseApp || {};
  window.SupabaseApp.clearAuthUrl = clearAuthUrl;
  window.SupabaseApp.getAuthUrlType = getAuthUrlType;
  window.SupabaseApp.createAuthHandlers = createAuthHandlers;
})();
