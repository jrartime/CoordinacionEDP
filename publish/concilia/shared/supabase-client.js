/**
 * shared/supabase-client.js
 *
 * Cliente Supabase compartido entre todas las apps (coordinacion, curriculos, concilia).
 * Debe cargarse ANTES de los scripts de cada app.
 *
 * Expone: window.SupabaseApp
 *
 * USO EN CADA APP:
 *   - HTML: <script src="../shared/supabase-client.js"></script>
 *   - JS:   const supabase = await window.SupabaseApp.getClient();
 *           const session  = await window.SupabaseApp.ensureSession({ silent: true });
 *           window.SupabaseApp.setSession(session);
 *
 * PRECONDICIÓN: window.APP_CONFIG debe estar definido antes de cargar este script.
 */
(function () {
  "use strict";

  const _config = (window.APP_CONFIG ?? {}).supabase ?? {};
  const _hasConfig = Boolean(_config.url) && Boolean(_config.anonKey);

  let _client = null;
  let _clientPromise = null;
  let _session = null;
  let _authListenerBound = false;

  /**
   * Devuelve la instancia del cliente Supabase (singleton).
   * La primera llamada la crea cargando el SDK desde esm.sh.
   */
  async function getClient() {
    if (!_hasConfig) {
      throw new Error("Falta la configuracion de Supabase en config.js (window.APP_CONFIG).");
    }

    if (_client) {
      return _client;
    }

    if (_clientPromise) {
      return _clientPromise;
    }

    _clientPromise = import("https://esm.sh/@supabase/supabase-js@2").then(
      ({ createClient }) => {
        _client = createClient(_config.url, _config.anonKey);

        // Escuchar cambios de sesión una sola vez
        if (!_authListenerBound) {
          _client.auth.onAuthStateChange((_event, session) => {
            _session = session;
          });
          _authListenerBound = true;
        }

        return _client;
      }
    );

    return _clientPromise;
  }

  /**
   * Garantiza que hay una sesión activa.
   * Si silent=true, devuelve null en lugar de lanzar error.
   */
  async function ensureSession(options = {}) {
    const { silent = false } = options;
    const supabase = await getClient();

    if (_session) {
      return _session;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      _session = session;
      return session;
    }

    if (silent) {
      return null;
    }

    throw new Error("No hay una sesion activa de Supabase.");
  }

  /** Devuelve la sesion actual (puede ser null si no hay sesion). */
  function getSession() {
    return _session;
  }

  /** Establece la sesion desde fuera (tras login/logout). */
  function setSession(session) {
    _session = session;
  }

  // Exponer namespace global
  window.SupabaseApp = {
    getClient,
    ensureSession,
    getSession,
    setSession,
    get hasConfig() {
      return _hasConfig;
    },
    get config() {
      return _config;
    },
  };
})();
