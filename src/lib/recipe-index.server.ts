// Server-only index of every recipe name in `recipe_library`.
//
// The AI naming law used to be anchored to the ~507 hard-coded recipes in
// recipe-db.ts, which made the app answer with the same handful of dishes.
// It is now anchored to the full imported library (10k+ rows), cached in
// memory for a few minutes so we do not re-read it on every request.

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";
import { normalizeRecipeName } from "./recipe-library";

type Index = { names: string[]; set: Set<string> };

const TTL_MS = 5 * 60_000;
const PAGE = 1000;

const cache = new Map<string, { at: number; index: Index }>();

async function load(cuisine: string): Promise<Index> {
  const supabase = createClient<Database>(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"]!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );

  const names: string[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await supabase
      .from("recipe_library")
      .select("name")
      .eq("cuisine", cuisine)
      .order("name", { ascending: true })
      .range(offset, offset + PAGE - 1);
    if (error) throw new Error(error.message);
    for (const r of data ?? []) names.push(r.name);
    if (!data || data.length < PAGE) break;
    if (offset > 60_000) break;
  }

  return { names, set: new Set(names.map(normalizeRecipeName)) };
}

export async function getRecipeIndex(cuisine = "bengali"): Promise<Index> {
  const hit = cache.get(cuisine);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.index;
  try {
    const index = await load(cuisine);
    cache.set(cuisine, { at: Date.now(), index });
    return index;
  } catch {
    return hit?.index ?? { names: [], set: new Set() };
  }
}

/** True when the title is a real dish name from the imported library. */
export async function isLibraryTitle(title: string, cuisine = "bengali") {
  const { set } = await getRecipeIndex(cuisine);
  return set.has(normalizeRecipeName(title));
}

/** A random, prompt-sized sample of real library dish names. */
export async function libraryTitleSample(limit = 160, cuisine = "bengali") {
  const { names } = await getRecipeIndex(cuisine);
  if (names.length === 0) return "";
  const picked = new Set<string>();
  const max = Math.min(limit, names.length);
  while (picked.size < max) picked.add(names[Math.floor(Math.random() * names.length)]!);
  return [...picked].join(", ");
}

/** Best library dish for a set of ingredients (simple keyword overlap). */
export async function closestLibraryTitle(ingredients: string[], cuisine = "bengali") {
  const wanted = ingredients.map((i) => i.trim().toLowerCase()).filter(Boolean);
  if (wanted.length === 0) return undefined;
  const { names } = await getRecipeIndex(cuisine);
  let best: { name: string; hits: number } | undefined;
  for (const name of names) {
    const low = name.toLowerCase();
    const hits = wanted.filter((w) => low.includes(w)).length;
    if (hits > 0 && (!best || hits > best.hits)) best = { name, hits };
  }
  return best?.name;
}
