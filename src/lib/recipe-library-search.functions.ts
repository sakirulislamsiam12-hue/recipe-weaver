import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/integrations/supabase/types";
import { builtinMatches, builtinRows } from "./builtin-library";
import { normalizeRecipeName } from "./recipe-library";

export type LibraryRow = {
  id: string;
  name: string;
  ingredients: string;
  method: string;
  cuisine: string;
};

export type LibraryPage = {
  rows: LibraryRow[];
  total: number;
};

const inputSchema = z.object({
  query: z.string().default(""),
  cuisine: z.string().default("bengali"),
  offset: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(100).default(30),
});

function publicClient() {
  return createClient<Database>(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"]!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

/** Escape PostgREST `or()` special characters in a user-supplied term. */
function safeTerm(q: string) {
  return q.replace(/[,()*\\]/g, " ").trim();
}

/**
 * Paginated search over BOTH recipe sources at once:
 *  1. the 507 hand-curated recipes built into the app (`recipe-db.ts`)
 *  2. every row of the imported `recipe_library` table
 * Curated recipes come first, database rows follow; duplicates by
 * normalised dish name are dropped so nothing is shown twice.
 */
export const searchRecipeLibrary = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => inputSchema.parse(d ?? {}))
  .handler(async ({ data }): Promise<LibraryPage> => {
    const term = safeTerm(data.query);
    const builtin = builtinMatches(term, data.cuisine);
    const builtinKeys = new Set(builtin.map((r) => normalizeRecipeName(r.name)));

    const supabase = publicClient();
    let q = supabase
      .from("recipe_library")
      .select("id,name,ingredients,method,cuisine", { count: "exact" })
      .eq("cuisine", data.cuisine);

    if (term) {
      q = q.or(`name.ilike.%${term}%,ingredients.ilike.%${term}%,method.ilike.%${term}%`);
    }

    // Slice the combined list: built-in recipes occupy the first positions.
    const builtinSlice = builtin.slice(data.offset, data.offset + data.limit);
    const need = data.limit - builtinSlice.length;
    const dbOffset = Math.max(0, data.offset - builtin.length);

    let dbRows: LibraryRow[] = [];
    let dbTotal = 0;

    if (need > 0) {
      // Over-fetch a little so de-duplication does not shrink the page.
      const fetchLimit = need + Math.min(builtin.length, 20);
      const { data: rows, count, error } = await q
        .order("name", { ascending: true })
        .range(dbOffset, dbOffset + fetchLimit - 1);
      if (error) throw new Error(error.message);
      dbTotal = count ?? 0;
      dbRows = (rows ?? [])
        .filter((r) => !builtinKeys.has(normalizeRecipeName(r.name)))
        .slice(0, need)
        .map((r) => ({
          id: r.id,
          name: r.name,
          ingredients: r.ingredients ?? "",
          method: r.method ?? "",
          cuisine: r.cuisine,
        }));
    } else {
      let countQuery = supabase
        .from("recipe_library")
        .select("id", { count: "exact", head: true })
        .eq("cuisine", data.cuisine);
      if (term) {
        countQuery = countQuery.or(
          `name.ilike.%${term}%,ingredients.ilike.%${term}%,method.ilike.%${term}%`,
        );
      }
      const { count, error } = await countQuery;
      if (error) throw new Error(error.message);
      dbTotal = count ?? 0;
    }

    return {
      total: builtin.length + dbTotal,
      rows: [...builtinSlice, ...dbRows],
    };
  });

/** Total number of recipes available across both sources. */
export const recipeLibraryTotal = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { count, error } = await supabase
    .from("recipe_library")
    .select("id", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return { count: (count ?? 0) + builtinRows("bengali").length };
});
