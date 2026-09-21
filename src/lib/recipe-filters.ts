// Explore filter chips.
//
// Recipe tags in the database are inconsistent (Bengali + English, "vegetarian"
// vs "veg", no "quick" tag at all), so chips match on tags AND ingredients AND
// cook time instead of a single exact tag string. A chip must never return an
// empty list for a database of 500+ authentic recipes.

import type { DbRecipe } from "./recipe-db-types";

export const FILTER_TAGS = ["all", "veg", "quick", "rice", "fish", "chicken", "dessert"] as const;
export type FilterTag = (typeof FILTER_TAGS)[number];

export const FILTER_LABELS: Record<FilterTag, { bn: string; en: string }> = {
  all: { bn: "সব", en: "All" },
  veg: { bn: "নিরামিষ", en: "Veg" },
  quick: { bn: "দ্রুত", en: "Quick" },
  rice: { bn: "ভাত/পোলাও", en: "Rice" },
  fish: { bn: "মাছ", en: "Fish" },
  chicken: { bn: "মুরগি", en: "Chicken" },
  dessert: { bn: "মিষ্টি", en: "Dessert" },
};

const FISH_WORDS = ["fish", "hilsa", "ilish", "prawn", "shrimp", "rui", "katla", "pabda", "chingri", "shutki", "মাছ", "চিংড়ি", "ইলিশ", "শুঁটকি"];
const MEAT_WORDS = ["chicken", "beef", "mutton", "goat", "duck", "lamb", "egg", "মুরগি", "গরু", "খাসি", "হাঁস", "ডিম"];
const CHICKEN_WORDS = ["chicken", "murgi", "মুরগি", "চিকেন"];
const RICE_WORDS = ["rice", "polao", "pulao", "biryani", "khichuri", "চাল", "ভাত", "পোলাও", "বিরিয়ানি", "খিচুড়ি"];
const DESSERT_WORDS = ["dessert", "sweet", "pitha", "মিষ্টি", "পিঠা", "পায়েস", "হালুয়া"];

function haystack(r: DbRecipe) {
  return [r.name_bn, r.name_en, ...r.tags, ...r.ingredients].join(" ").toLowerCase();
}

function hasAny(text: string, words: string[]) {
  return words.some((w) => text.includes(w.toLowerCase()));
}

export function matchesFilter(r: DbRecipe, tag: FilterTag): boolean {
  if (tag === "all") return true;
  const text = haystack(r);
  switch (tag) {
    case "quick":
      return r.cookTime <= 20;
    case "rice":
      return hasAny(text, RICE_WORDS);
    case "fish":
      return hasAny(text, FISH_WORDS);
    case "chicken":
      return hasAny(text, CHICKEN_WORDS);
    case "dessert":
      return hasAny(text, DESSERT_WORDS);
    case "veg":
      return (
        r.tags.includes("vegetarian") ||
        (!hasAny(text, MEAT_WORDS) && !hasAny(text, FISH_WORDS))
      );
    default:
      return true;
  }
}

/** Free-text match over names and ingredients (both languages). */
export function matchesQuery(r: DbRecipe, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    r.name_bn.toLowerCase().includes(q) ||
    r.name_en.toLowerCase().includes(q) ||
    r.ingredients.some((i) => i.toLowerCase().includes(q)) ||
    r.tags.some((t) => t.toLowerCase().includes(q))
  );
}
