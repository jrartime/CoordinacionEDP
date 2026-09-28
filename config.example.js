window.APP_CONFIG = {
  supabase: {
    url: "https://TU-PROYECTO.supabase.co",
    anonKey: "TU-ANON-KEY",
    bucket: "candidate-cvs",
    // Esquema de las tablas. Omitir (o "public") mientras Coordinación tenga su propio
    // proyecto Supabase. Al migrar a la base de datos del portal laboral: "coordinacion".
    schema: "public",
  },
};
