// Converts a `recipe_library` row (free-text name / ingredients / method)
// into the app's structured Recipe shape used by RecipeDetail.

import type { LibraryRow } from "./recipe-library-search.functions";
import type { Recipe } from "./recipe-schema";

function splitList(text: string): string[] {
  return text
    .split(/\r?\n|[,;।]|(?:\s\u2022\s)/)
    .map((s) => s.replace(/^\s*[-•*\d.)]+\s*/, "").trim())
    .filter((s) => s.length > 0);
}

function splitSteps(text: string): string[] {
  const byLine = text
    .split(/\r?\n/)
    .map((s) => s.replace(/^\s*[-•*]?\s*\d+[.)]\s*/, "").trim())
    .filter(Boolean);
  if (byLine.length > 1) return byLine;
  return text
    .split(/(?<=।)\s+|(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Rough cook-time guess from the method text (falls back to 30 min). */
function guessMinutes(method: string): number {
  const m = method.match(/(\d{1,3})\s*(মিনিট|minute|min)/i);
  if (m) return Math.min(240, Number(m[1]));
  return 30;
}

export function libraryRowToRecipe(row: LibraryRow, pantry: string[] = []): Recipe {
  const ingredients = splitList(row.ingredients);
  const steps = splitSteps(row.method);
  const have = new Set(pantry.map((p) => p.trim().toLowerCase()));
  const used = ingredients.filter((i) =>
    [...have].some((h) => h && (i.toLowerCase().includes(h) || h.includes(i.toLowerCase()))),
  );

  return {
    id: `lib-${row.id}`,
    title: row.name,
    subtitle: "",
    timeMinutes: guessMinutes(row.method),
    utilization: ingredients.length ? Math.round((used.length / ingredients.length) * 100) : 0,
    servings: 4,
    ingredients: ingredients.map((name) => ({ name, quantity: "" })),
    missing: [],
    steps: steps.length > 0 ? steps : [row.method].filter(Boolean),
    flavor: { sour: 1, sweet: 1, umami: 2, salty: 2, bitter: 0, spicy: 2 },
    nutrition: "green",
  };
}
