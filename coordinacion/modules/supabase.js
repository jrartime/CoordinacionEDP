async function getSupabaseClient() {
  if (!hasSupabaseConfig) {
    throw new Error("Falta la configuracion de Supabase en config.js.");
  }

  if (supabaseClient) {
    return supabaseClient;
  }

  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  supabaseClient = createClient(supabaseConfig.url, supabaseConfig.anonKey);

  if (!supabaseAuthListenerBound) {
    supabaseClient.auth.onAuthStateChange((_event, session) => {
      currentSession = session;
    });
    supabaseAuthListenerBound = true;
  }

  return supabaseClient;
}

async function ensurePrivateSession(options = {}) {
  const { silent = false } = options;
  const supabase = await getSupabaseClient();

  if (currentSession) {
    return currentSession;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    currentSession = session;
    return session;
  }

  if (silent) {
    return null;
  }

  throw new Error("No hay una sesión activa de Supabase.");
}

async function getJsPdfClient() {
  if (jsPdfModulePromise) {
    return jsPdfModulePromise;
  }

  jsPdfModulePromise = import("https://esm.sh/jspdf@2.5.1");
  return jsPdfModulePromise;
}

async function getJsZipClient() {
  if (jsZipModulePromise) {
    return jsZipModulePromise;
  }

  jsZipModulePromise = import("https://esm.sh/jszip@3.10.1");
  return jsZipModulePromise;
}

async function getMammothClient() {
  if (window.mammoth?.convertToHtml) {
    return window.mammoth;
  }

  if (!mammothModulePromise) {
    mammothModulePromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/mammoth@1.8.0/mammoth.browser.min.js";
      script.async = true;
      script.onload = resolve;
      script.onerror = () =>
        reject(new Error("No se pudo cargar el lector de Word. Revisa la conexion e intentalo de nuevo."));
      document.head.appendChild(script);
    });
  }

  await mammothModulePromise;

  if (!window.mammoth?.convertToHtml) {
    throw new Error("No se pudo cargar el lector de Word. Revisa la conexion e intentalo de nuevo.");
  }

  return window.mammoth;
}

async function uploadFileToSupabase(candidateId, source, file) {
  const supabase = await getSupabaseClient();
  const safeName = sanitizeFileName(file.name);
  const path = `${source}/${candidateId}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from(supabaseConfig.bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "application/octet-stream",
  });

  if (error) {
    throw error;
  }

  return path;
}
