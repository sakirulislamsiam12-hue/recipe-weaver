import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { normalizeRecipeName, type ImportSummary } from "./recipe-library";

const rowSchema = z.object({
  name: z.string(),
  ingredients: z.string().default(""),
  method: z.string().default(""),
});

const inputSchema = z.object({
  rows: z.array(rowSchema).max(50_000),
});

const CHUNK = 500;

/**
 * Reusable bulk importer: checks every incoming recipe name against the
 * existing `recipe_library` rows first, then bulk-inserts only the new ones.
 * Existing rows are never updated or overwritten.
 */
export const importRecipeLibrary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data }): Promise<ImportSummary> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const totalInFile = data.rows.length;
    let skippedInvalid = 0;
    let duplicatesInFile = 0;

    // 1. Normalise + drop empties + collapse in-file duplicates.
    const byKey = new Map<string, { name: string; name_key: string; ingredients: string; method: string }>();
    for (const row of data.rows) {
      const name = row.name.normalize("NFC").trim();
      const key = normalizeRecipeName(name);
      if (!key) {
        skippedInvalid += 1;
        continue;
      }
      if (byKey.has(key)) {
        duplicatesInFile += 1;
        continue;
      }
      byKey.set(key, {
        name,
        name_key: key,
        ingredients: row.ingredients.normalize("NFC").trim(),
        method: row.method.normalize("NFC").trim(),
      });
    }

    // 2. Duplicate check against the database (batched IN queries).
    const keys = [...byKey.keys()];
    const existing = new Set<string>();
    for (let i = 0; i < keys.length; i += CHUNK) {
      const { data: found, error } = await supabaseAdmin
        .from("recipe_library")
        .select("name_key")
        .in("name_key", keys.slice(i, i + CHUNK));
      if (error) throw new Error(error.message);
      for (const r of found ?? []) existing.add(r.name_key);
    }

    const fresh = [...byKey.values()].filter((r) => !existing.has(r.name_key));

    // 3. Bulk insert only the new ones.
    let inserted = 0;
    for (let i = 0; i < fresh.length; i += CHUNK) {
      const batch = fresh.slice(i, i + CHUNK);
      const { error } = await supabaseAdmin
        .from("recipe_library")
        .upsert(batch, { onConflict: "name_key", ignoreDuplicates: true });
      if (error) throw new Error(error.message);
      inserted += batch.length;
    }

    return {
      totalInFile,
      skippedExisting: existing.size,
      skippedInvalid,
      duplicatesInFile,
      inserted,
    };
  });

/** Current number of recipes in the shared library. */
export const countRecipeLibrary = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count, error } = await supabaseAdmin
    .from("recipe_library")
    .select("id", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return { count: count ?? 0 };
});
