// Smart matching engine: staple auto-assume, zero-waste ranking,
// substitution scoring and the "Missing 1 Ingredient" engine.

import { DEFAULT_BENGALI_INGREDIENTS, isBangladeshRegion } from "./defaults";
import {
  DIET_EXCLUSIONS,
  lookupIngredient,
  perishability,
  substitutesFor,
} from "./pantry-data";
import { RECIPE_DB, type DbRecipe } from "./recipe-db";
import type { Recipe } from "./recipe-schema";

export type Filters = {
  maxMinutes?: number;
  diet?: string[];
  country?: string;
  spice?: string;
};

export function canonical(name: string) {
  const item = lookupIngredient(name);
  return (item?.en ?? name).trim().toLowerCase();
}

/**
 * Staples we assume every kitchen already has. Deliberately tiny — only
 * salt and water — so any other missing ingredient blocks the recipe from
 * the "cookable now" list (per the strict availability rule).
 */
const ASSUMED_STAPLES = new Set(["salt", "water", "জল", "লবণ"]);

export function isAssumedStaple(name: string) {
  return ASSUMED_STAPLES.has(canonical(name));
}

/** True when a pantry item is one of the region's auto-assumed defaults. */
export function isRegionalDefault(name: string, region?: string | null) {
  if (!isBangladeshRegion(region)) return false;
  const key = canonical(name);
  return DEFAULT_BENGALI_INGREDIENTS.some((d) => canonical(d) === key);
}

/**
 * Enrich the user's pantry with regional default ingredients (salt, oil,
 * water for Bangladesh) for recipe matching only — never shown to the user.
 */
export function enrichPantryWithDefaults(userPantry: string[], region?: string | null): string[] {
  if (!isBangladeshRegion(region)) return userPantry;
  const have = new Set(userPantry.map(canonical));
  const additions = DEFAULT_BENGALI_INGREDIENTS.filter((d) => !have.has(canonical(d)));
  return [...userPantry, ...additions];
}

export type MissingItem = { name: string; aisle?: string; substitute?: { name: string; confidence: number } };

export type ScoredRecipe = Recipe & {
  /** 0-100, how much of the user's pantry the recipe consumes. */
  utilizationScore: number;
  /** 0-100, weighted toward using perishables first. */
  zeroWasteScore: number;
  /** Truly missing after staple auto-assume. */
  realMissing: MissingItem[];
  /** Exactly one item away from cookable. */
  missingOne: boolean;
  usedPantry: string[];
};

/**
 * How much of a recipe the pantry covers (0-1), ignoring assumed staples
 * and declared-missing items. 1 means fully cookable right now.
 */
export function recipeAvailability(recipe: Recipe, pantry: string[]): number {
  const pantrySet = new Set(pantry.map(canonical));
  const declaredMissing = new Set((recipe.missing ?? []).map((m) => canonical(m.name)));
  const required = recipe.ingredients
    .map((i) => canonical(i.name))
    .filter((key) => !isAssumedStaple(key));
  if (required.length === 0) return 1;
  const have = required.filter((key) => pantrySet.has(key) && !declaredMissing.has(key));
  return have.length / required.length;
}

/** Only recipes the user can cook at 100% — every non-staple ingredient present. */
export function filterRecipesByAvailability(pantry: string[], allRecipes: Recipe[]): Recipe[] {
  return allRecipes.filter((r) => recipeAvailability(r, pantry) >= 1);
}

/** Ingredients a recipe still needs (non-staple, not in pantry). */
export function missingForRecipe(recipe: Recipe, pantry: string[]): string[] {
  const pantrySet = new Set(pantry.map(canonical));
  const declaredMissing = new Set((recipe.missing ?? []).map((m) => canonical(m.name)));
  const out: string[] = [];
  const seen = new Set<string>();
  for (const ing of recipe.ingredients) {
    const key = canonical(ing.name);
    if (isAssumedStaple(key) || seen.has(key)) continue;
    if (pantrySet.has(key) && !declaredMissing.has(key)) continue;
    seen.add(key);
    out.push(ing.name);
  }
  return out;
}

/**
 * "Almost ready" recipes: 70-99% of ingredients available. Returned with
 * their completion ratio and the exact missing ingredients.
 */
export function almostReadyRecipes(
  pantry: string[],
  allRecipes: Recipe[],
): { recipe: Recipe; ratio: number; missing: string[] }[] {
  return allRecipes
    .map((r) => ({ recipe: r, ratio: recipeAvailability(r, pantry) }))
    .filter((x) => x.ratio >= 0.7 && x.ratio < 1)
    .map((x) => ({ ...x, missing: missingForRecipe(x.recipe, pantry) }))
    .sort((a, b) => b.ratio - a.ratio);
}

/** Count of recipes that would unlock by buying more ingredients (partial matches). */
export function unlockableCount(pantry: string[], allRecipes: Recipe[]): number {
  return allRecipes.filter((r) => {
    const ratio = recipeAvailability(r, pantry);
    return ratio > 0 && ratio < 1;
  }).length;
}

/**
 * Rank recipes: uses more of the pantry, prioritises perishables, penalises
 * missing items and long cook times.
 */
export function scoreRecipes(recipes: Recipe[], pantry: string[], filters: Filters = {}): ScoredRecipe[] {
  const pantrySet = new Map(pantry.map((p) => [canonical(p), p]));
  const perishableTotal = pantry.reduce((sum, p) => sum + perishability(p), 0) || 1;

  const banned = new Set(
    (filters.diet ?? [])
      .flatMap((d) => DIET_EXCLUSIONS[d] ?? [])
      .map((n) => n.toLowerCase()),
  );

  const scored = recipes.map((r) => {
    const used: string[] = [];
    let perishableUsed = 0;

    for (const ing of r.ingredients) {
      const key = canonical(ing.name);
      const original = pantrySet.get(key);
      if (original) {
        used.push(original);
        perishableUsed += perishability(original);
      }
    }

    const declared = (r.missing ?? []).filter((m) => !isAssumedStaple(m.name) && !pantrySet.has(canonical(m.name)));
    const implied = r.ingredients
      .filter((i) => !pantrySet.has(canonical(i.name)) && !isAssumedStaple(i.name))
      .filter((i) => !declared.some((m) => canonical(m.name) === canonical(i.name)))
      .map((i) => ({ name: i.name, aisle: "" }));

    const realMissing: MissingItem[] = [...declared, ...implied].map((m) => {
      const subs = substitutesFor(m.name).filter((s) => pantrySet.has(canonical(s.name)));
      const best = subs.sort((a, b) => b.confidence - a.confidence)[0];
      return { name: m.name, aisle: m.aisle, ...(best ? { substitute: best } : {}) };
    });

    const blocking = realMissing.filter((m) => !m.substitute || m.substitute.confidence < 0.6);

    const utilizationScore = Math.round((used.length / Math.max(1, pantry.length)) * 100);
    const zeroWasteScore = Math.round(
      Math.min(100, (perishableUsed / perishableTotal) * 80 + (used.length / Math.max(1, pantry.length)) * 20),
    );

    return {
      ...r,
      utilization: utilizationScore,
      utilizationScore,
      zeroWasteScore,
      realMissing,
      missingOne: blocking.length === 1,
      usedPantry: used,
      _blocking: blocking.length,
      _banned: r.ingredients.some((i) => banned.has(canonical(i.name))),
      _tooSlow: filters.maxMinutes ? r.timeMinutes > filters.maxMinutes : false,
    };
  });

  return scored
    .filter((r) => !r._banned)
    .sort((a, b) => {
      if (a._tooSlow !== b._tooSlow) return a._tooSlow ? 1 : -1;
      if (a._blocking !== b._blocking) return a._blocking - b._blocking;
      return b.zeroWasteScore - a.zeroWasteScore;
    })
    .map(({ _blocking, _banned, _tooSlow, ...rest }) => rest as ScoredRecipe);
}

/** Cooking-time filter values from onboarding Q5 -> minutes cap. */
export function timePrefToMinutes(pref?: string): number | undefined {
  if (!pref) return undefined;
  if (/15/.test(pref) && /(under|কম|<)/i.test(pref)) return 15;
  if (/60\+|৬০\+|30\+|৩০\+/.test(pref)) return undefined;
  if (/30-60|৩০–৬০|30–60/.test(pref)) return 60;
  if (/15|১৫/.test(pref)) return 30;
  return undefined;
}

/* ------------------------------------------------------------------ */
/* Pre-built database matching (runs BEFORE any AI call)                */
/* ------------------------------------------------------------------ */

const prefSpiceLevel = (spice?: string) =>
  ({ Mild: 1, Medium: 3, Spicy: 4, "Extra spicy": 5 })[spice ?? ""] ?? 3;

/** Convert a database recipe into the app's Recipe shape. */
export function dbToRecipe(db: DbRecipe, pantry: string[], lang: "bn" | "en"): Recipe {
  const pantrySet = new Set(pantry.map(canonical));
  const used = db.ingredients.filter((i) => pantrySet.has(canonical(i)));
  const names = [...db.ingredients, ...db.staples];

  return {
    id: `db-${db.id}`,
    title: lang === "bn" ? db.name_bn : db.name_en,
    subtitle:
      lang === "bn"
        ? `${db.cookTime} মিনিট • ${db.tags[0] ?? "ঘরোয়া"} • চেনা বাংলাদেশি পদ`
        : `${db.cookTime} min • classic Bangladeshi home dish`,
    timeMinutes: db.cookTime,
    utilization: Math.round((used.length / Math.max(1, pantry.length)) * 100),
    servings: 2,
    ingredients: names.map((n) => {
      const item = lookupIngredient(n);
      return {
        name: item ? (lang === "bn" ? item.bn : item.en) : n,
        quantity: lang === "bn" ? "পরিমাণমতো" : "as needed",
      };
    }),
    missing: db.ingredients
      .filter((i) => !pantrySet.has(canonical(i)) && !isAssumedStaple(i))
      .map((i) => {
        const item = lookupIngredient(i);
        return { name: item ? (lang === "bn" ? item.bn : item.en) : i, aisle: "" };
      }),
    steps: lang === "bn" ? db.steps_bn : db.steps_en,
    flavor: {
      sour: 1,
      sweet: db.tags.includes("sweet") || db.tags.includes("dessert") ? 4 : 1,
      umami: 3,
      salty: 2,
      bitter: db.tags.includes("করলা") || db.ingredients.includes("Bitter gourd") ? 3 : 0,
      spicy: db.spiceLevel,
    },
    nutrition: db.tags.includes("fried") || db.tags.includes("dessert") ? "yellow" : "green",
  };
}

export type DbMatch = { recipe: Recipe; score: number; db: DbRecipe };

/**
 * Match the user's pantry against the pre-built Bengali recipe database.
 * Ranked by ingredient overlap, zero-waste (perishables first) and prefs.
 */
export function matchDbRecipes(
  pantry: string[],
  lang: "bn" | "en",
  filters: Filters = {},
  limit = 3,
): DbMatch[] {
  if (pantry.length === 0) return [];
  const pantrySet = new Set(pantry.map(canonical));

  const banned = new Set(
    (filters.diet ?? []).flatMap((d) => DIET_EXCLUSIONS[d] ?? []).map((n) => n.toLowerCase()),
  );

  const wantSpice = prefSpiceLevel(filters.spice);

  const scored = RECIPE_DB.map((db) => {
    const core = db.ingredients.filter((i) => !isAssumedStaple(i));
    const pool = core.length ? core : db.ingredients;
    const used = pool.filter((i) => pantrySet.has(canonical(i)));
    const missing = pool.filter((i) => !pantrySet.has(canonical(i)));

    if (used.length === 0) return null;
    if (db.ingredients.some((i) => banned.has(i.toLowerCase()))) return null;
    if (filters.maxMinutes && db.cookTime > filters.maxMinutes) return null;

    const overlap = used.length / pool.length; // % of the dish covered
    const perishable = used.reduce((s, i) => s + perishability(i), 0) / (used.length || 1);
    const spiceFit = 1 - Math.abs(db.spiceLevel - wantSpice) / 5;

    const score =
      overlap * 60 + Math.min(1, perishable / 3) * 20 + spiceFit * 12 - missing.length * 8;

    return { db, score };
  }).filter((x): x is { db: DbRecipe; score: number } => x !== null);

  scored.sort((a, b) => b.score - a.score || a.db.cookTime - b.db.cookTime);

  const seen = new Set<string>();
  const out: DbMatch[] = [];
  for (const s of scored) {
    const key = lang === "bn" ? s.db.name_bn : s.db.name_en;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ recipe: dbToRecipe(s.db, pantry, lang), score: s.score, db: s.db });
    if (out.length >= limit) break;
  }
  return out;
}
