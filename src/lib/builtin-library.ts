// Bridges the 507 hand-curated recipes in `recipe-db.ts` into the same shape
// the imported spreadsheet library uses, so search and AI suggestions can
// treat BOTH sources as one single recipe collection.

import { RECIPE_DB } from "./recipe-db";
import { AMERICAN_RECIPES } from "./recipe-db-american";
import type { DbRecipe } from "./recipe-db-types";
import { normalizeRecipeName } from "./recipe-library";

export type BuiltinRow = {
  id: string;
  name: string;
  ingredients: string;
  method: string;
  cuisine: string;
};

function toRow(r: DbRecipe, cuisine: string, lang: "bn" | "en"): BuiltinRow {
  const name = lang === "bn" ? r.name_bn : r.name_en;
  const steps = lang === "bn" ? r.steps_bn : r.steps_en;
  return {
    id: `builtin-${r.id}`,
    name,
    ingredients: [...r.ingredients, ...r.staples].join(", "),
    method: (steps ?? []).join("\n"),
    cuisine,
  };
}

let bengaliRows: BuiltinRow[] | undefined;
let americanRows: BuiltinRow[] | undefined;

/** Every built-in recipe for a cuisine, in library-row form. */
export function builtinRows(cuisine = "bengali"): BuiltinRow[] {
  if (cuisine === "american") {
    americanRows ??= AMERICAN_RECIPES.map((r, i) => ({
      id: `builtin-us-${i}`,
      name: r.name,
      ingredients: r.ingredients.join(", "),
      method: "",
      cuisine: "american",
    }));
    return americanRows;
  }
  if (cuisine !== "bengali") return [];
  bengaliRows ??= RECIPE_DB.map((r) => toRow(r, "bengali", "bn"));
  return bengaliRows;
}

/** Built-in rows matching a free-text term (name, ingredients or method). */
export function builtinMatches(term: string, cuisine = "bengali"): BuiltinRow[] {
  const rows = builtinRows(cuisine);
  const q = term.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter(
    (r) =>
      r.name.toLowerCase().includes(q) ||
      r.ingredients.toLowerCase().includes(q) ||
      r.method.toLowerCase().includes(q),
  );
}

/** Normalised names of every built-in recipe, for de-duplication. */
export function builtinNameKeys(cuisine = "bengali"): Set<string> {
  return new Set(builtinRows(cuisine).map((r) => normalizeRecipeName(r.name)));
}

/** Plain dish names of every built-in recipe. */
export function builtinNames(cuisine = "bengali"): string[] {
  return builtinRows(cuisine).map((r) => r.name);
}
