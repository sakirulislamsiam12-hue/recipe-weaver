/**
 * Which cuisine universe the app should cook in.
 *
 * The recipe library, the naming law and the AI lanes are all split by
 * cuisine: a user cooking in the United States must never be offered the
 * Bengali catalogue, and vice-versa.
 */

export type Cuisine = "bengali" | "american";

const AMERICAN_COUNTRY =
  /(united states|u\.?s\.?a?\.?$|^us$|america|আমেরিকা|যুক্তরাষ্ট্র|canada|কানাডা)/i;

const AMERICAN_CUISINE_TAG = /(american|western|আমেরিকান|পশ্চিমা)/i;

/** Resolves the cuisine universe from the user's country + cuisine choices. */
export function resolveCuisine(country?: string, cuisines?: string[]): Cuisine {
  if (cuisines?.some((c) => AMERICAN_CUISINE_TAG.test(c))) return "american";
  if (country && AMERICAN_COUNTRY.test(country.trim())) return "american";
  return "bengali";
}

export function cuisineLabel(cuisine: Cuisine, lang: "bn" | "en" = "en") {
  if (cuisine === "american") return lang === "bn" ? "আমেরিকান" : "American";
  return lang === "bn" ? "বাংলাদেশি" : "Bangladeshi";
}
