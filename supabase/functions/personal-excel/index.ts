// Devuelve la vista personal_excel en JSON para Power Query.
// Requiere el secret EXCEL_TOKEN (cabecera "x-excel-token"). Falla cerrado si no está definido.
import { createClient } from "npm:@supabase/supabase-js@2";

function igual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

Deno.serve(async (req) => {
  const esperado = Deno.env.get("EXCEL_TOKEN") ?? "";
  const recibido = req.headers.get("x-excel-token") ?? "";
  if (!esperado || !igual(recibido, esperado)) {
    return new Response("No autorizado", { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const filas: unknown[] = [];
  const tam = 1000;
  for (let desde = 0; ; desde += tam) {
    const { data, error } = await supabase
      .from("personal_excel")
      .select("id,personal,genero,dni,email")
      .order("id")
      .range(desde, desde + tam - 1);
    if (error) return new Response(error.message, { status: 500 });
    filas.push(...data);
    if (data.length < tam) break;
  }

  return new Response(JSON.stringify(filas), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
});
