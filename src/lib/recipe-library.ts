/**
 * Shared, reusable logic for importing recipe spreadsheets into
 * `public.recipe_library`.
 *
 * Only three fields are ever imported: name, ingredients and preparation
 * method. Any other column in the sheet (serial number, regional type,
 * category, serving, ...) is ignored.
 *
 * Duplicate rule: a recipe is considered "already in the database" when its
 * normalised name (trimmed, whitespace-collapsed, case-insensitive, unicode
 * NFC) matches an existing row. Existing rows are never edited or overwritten.
 */

export type RecipeRow = {
  name: string;
  ingredients: string;
  method: string;
};

export type ImportSummary = {
  totalInFile: number;
  skippedExisting: number;
  skippedInvalid: number;
  duplicatesInFile: number;
  inserted: number;
};

/** Column headers accepted for each field (Bangla first, English fallbacks). */
export const RECIPE_COLUMN_ALIASES = {
  name: ["রেসিপির নাম", "রেসিপি", "name", "recipe name", "title"],
  ingredients: ["উপকরণ", "ingredients"],
  method: ["প্রস্তুত প্রণালি", "প্রস্তুত প্রণালী", "method", "preparation", "instructions"],
} as const;

/** Trim, collapse inner whitespace, normalise unicode, lowercase. */
export function normalizeRecipeName(value: unknown): string {
  return String(value ?? "")
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function cleanText(value: unknown): string {
  return String(value ?? "").normalize("NFC").trim();
}

function findKey(headers: string[], aliases: readonly string[]): string | undefined {
  return headers.find((h) => aliases.some((a) => normalizeRecipeName(h) === normalizeRecipeName(a)));
}

/**
 * Maps raw sheet rows (objects keyed by header) to the three imported fields.
 * Rows without a usable name are dropped.
 */
export function mapSheetRows(rows: Array<Record<string, unknown>>): RecipeRow[] {
  if (rows.length === 0) return [];
  const headers = Object.keys(rows[0]!);
  const nameKey = findKey(headers, RECIPE_COLUMN_ALIASES.name);
  const ingredientsKey = findKey(headers, RECIPE_COLUMN_ALIASES.ingredients);
  const methodKey = findKey(headers, RECIPE_COLUMN_ALIASES.method);
  if (!nameKey) throw new Error("RECIPE_NAME_COLUMN_NOT_FOUND");

  const out: RecipeRow[] = [];
  for (const row of rows) {
    const name = cleanText(row[nameKey]);
    if (!name) continue;
    out.push({
      name,
      ingredients: ingredientsKey ? cleanText(row[ingredientsKey]) : "",
      method: methodKey ? cleanText(row[methodKey]) : "",
    });
  }
  return out;
}
