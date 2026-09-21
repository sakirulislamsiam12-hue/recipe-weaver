// The authentic Bangladeshi recipe database.
//
// Every entry is a real dish that people actually cook and eat in Bangladesh.
// NO generated "X দিয়ে Y [method]" pattern combinations live here — recipe
// names are never invented by code or by the AI.

import type { Cuisine } from "./cuisine";
import { closestAmerican, isAuthenticAmericanTitle } from "./recipe-db-american";
import { BULK_BD_RECIPES } from "./recipe-db-bulk";
import { EXTRA_RECIPES } from "./recipe-db-extra";
import { REGIONAL_RECIPES } from "./recipe-db-regional";
import type { DbRecipe, Difficulty, SpiceLevel } from "./recipe-db-types";

export type { DbRecipe, Difficulty, SpiceLevel } from "./recipe-db-types";

function dedupe(recipes: DbRecipe[]): DbRecipe[] {
  const byName = new Map<string, DbRecipe>();
  for (const r of recipes) {
    const key = r.name_bn.trim();
    const existing = byName.get(key);
    if (!existing || (r.popularity ?? 0) > (existing.popularity ?? 0)) byName.set(key, r);
  }
  return [...byName.values()];
}

/** 507 authentic, de-duplicated Bangladeshi recipes. */
export const RECIPE_DB: DbRecipe[] = dedupe([
  ...REGIONAL_RECIPES,
  ...EXTRA_RECIPES,
  ...BULK_BD_RECIPES,
]);

/** Every authentic Bengali title the app is allowed to show. */
export const AUTHENTIC_TITLES_BN: string[] = RECIPE_DB.map((r) => r.name_bn);
export const AUTHENTIC_TITLES_EN: string[] = RECIPE_DB.map((r) => r.name_en);

const BN_TITLE_SET = new Set(AUTHENTIC_TITLES_BN.map((t) => t.trim()));
const EN_TITLE_SET = new Set(AUTHENTIC_TITLES_EN.map((t) => t.trim().toLowerCase()));

/** True when the title exists verbatim in the authentic database. */
export function isAuthenticTitle(title: string) {
  const t = title.trim();
  return BN_TITLE_SET.has(t) || EN_TITLE_SET.has(t.toLowerCase());
}

const BANNED_WORDS =
  /(fusion|deconstruct|medley|surprise|smoked|modern|twist|infused|gourmet|special|delight|magic|explosion|ফিউশন|সারপ্রাইজ|ম্যাজিক|স্পেশাল)/i;

/**
 * A title is "bad" when it is not an authentic database dish name, or when it
 * looks generated: too long, invented adjectives, or an "X দিয়ে Y" combo that
 * does not exist in the database.
 */
export function isBadTitle(title: string, cuisine: Cuisine = "bengali") {
  const t = (title ?? "").trim();
  if (!t) return true;
  if (cuisine === "american") {
    if (isAuthenticAmericanTitle(t)) return false;
    if (t.split(/\s+/).length > 5) return true;
    if (BANNED_WORDS.test(t)) return true;
    if (/[\u0980-\u09FF]/.test(t)) return true; // no Bengali script in American mode
    return true;
  }
  if (isAuthenticTitle(t)) return false;
  if (t.split(/\s+/).length > 4) return true;
  if (BANNED_WORDS.test(t)) return true;
  // Any "X দিয়ে Y" combination not present in the database is generated.
  if (t.includes("দিয়ে")) return true;
  return true;
}

/**
 * Safe fallback name used when the AI cannot land on an authentic dish.
 * Always "[ingredient] ভাজি" or "[ingredient] তরকারি" (Bengali), or the
 * American equivalent ("[ingredient] Skillet").
 */
export function fallbackTitle(
  ingredient: string | undefined,
  lang: "bn" | "en" = "bn",
  cuisine: Cuisine = "bengali",
) {
  const raw = (ingredient ?? "").trim();
  const head = raw ? raw.split(/[,،]/)[0]!.trim() : "";
  if (cuisine === "american") return head ? `${head} Skillet` : "Skillet Dinner";
  if (lang === "en") return head ? `${head} Bhaji` : "Sabji Bhaji";
  return head ? `${head} ভাজি` : "সবজি ভাজি";
}

/** Alternative safe fallback ("[ingredient] তরকারি"). */
export function fallbackCurryTitle(ingredient: string | undefined, lang: "bn" | "en" = "bn") {
  const head = (ingredient ?? "").trim().split(/[,،]/)[0]?.trim() ?? "";
  if (lang === "en") return head ? `${head} Torkari` : "Sabji Torkari";
  return head ? `${head} তরকারি` : "সবজি তরকারি";
}

/**
 * Best authentic database match for a set of ingredients. Used to keep AI
 * output anchored to real dishes.
 */
export function closestAuthentic(
  ingredients: string[],
  lang: "bn" | "en" = "bn",
  cuisine: Cuisine = "bengali",
) {
  if (cuisine === "american") return closestAmerican(ingredients);
  const wanted = ingredients.map((i) => i.trim().toLowerCase()).filter(Boolean);
  if (wanted.length === 0) return undefined;
  let best: { r: DbRecipe; score: number } | undefined;
  for (const r of RECIPE_DB) {
    const pool = [...r.ingredients, r.name_bn, r.name_en].map((x) => x.toLowerCase());
    const hits = wanted.filter((w) => pool.some((p) => p.includes(w) || w.includes(p))).length;
    if (hits === 0) continue;
    const score = hits * 10 + (r.popularity ?? 50) / 100;
    if (!best || score > best.score) best = { r, score };
  }
  if (!best) return undefined;
  return lang === "bn" ? best.r.name_bn : best.r.name_en;
}

