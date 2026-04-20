import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const candidateBucket = Deno.env.get("CANDIDATE_CV_BUCKET") ?? "candidate-cvs";

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

function getCutoffDate() {
  const now = new Date();
  now.setFullYear(now.getFullYear() - 2);
  return now.toISOString().slice(0, 10);
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return json(
      {
        error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.",
      },
      500
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const cutoffDate = getCutoffDate();
  const { data: candidates, error: selectError } = await supabase
    .from("candidates")
    .select("id, attachment_path")
    .lt("registration_date", cutoffDate);

  if (selectError) {
    return json({ error: selectError.message }, 500);
  }

  const attachmentPaths = Array.from(
    new Set((candidates ?? []).map((candidate) => candidate.attachment_path).filter(Boolean))
  ) as string[];

  let deletedFiles = 0;
  for (const batch of chunkArray(attachmentPaths, 1000)) {
    const { error: removeError } = await supabase.storage.from(candidateBucket).remove(batch);
    if (removeError) {
      return json({ error: removeError.message }, 500);
    }

    deletedFiles += batch.length;
  }

  const { error: deleteError, count } = await supabase
    .from("candidates")
    .delete({ count: "exact" })
    .lt("registration_date", cutoffDate);

  if (deleteError) {
    return json({ error: deleteError.message }, 500);
  }

  return json({
    success: true,
    cutoff_date: cutoffDate,
    deleted_candidates: count ?? 0,
    deleted_files: deletedFiles,
  });
});
