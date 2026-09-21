// Server-only "Bengali / South Asian Cuisine Expert" prompt builder + diversity filter.
// Used by generateRecipes to produce genuinely different dishes instead of
// three variations of the same one.
import { NAMING_RULE } from "./ai-core.server";
import type { Recipe } from "./recipe-schema";

export type ExpertPrefs = {
  country?: string | undefined;
  spice?: string | undefined;
  salt?: string | undefined;
  diet?: string[] | undefined;
  time?: string | undefined;
  maxMinutes?: number | undefined;
};

/** Each lane forces a fundamentally different cooking method + dish format. */
export type Lane = { id: string; technique: string; dishType: string; origin: string };

export const LANES: Lane[] = [
  {
    id: "bhaji",
    technique: "dry pan-fry / bhuna (no added water, high heat)",
    dishType: "dry side dish (ভাজি / ভুনা) eaten with rice or roti",
    origin: "everyday Bangladeshi home cooking",
  },
  {
    id: "curry",
    technique: "wet gravy simmered in a spiced onion-tomato base",
    dishType: "main curry (কারি / ঝোল) with sauce",
    origin: "Bengali–South Asian curry tradition",
  },
  {
    id: "egg-bread",
    technique: "beaten / batter-based cooking on a flat pan (omelette, cheela, poda)",
    dishType: "breakfast or snack item",
    origin: "street-food and tiffin style",
  },
  {
    id: "onepot",
    technique: "one-pot rice or lentil cooking (khichuri, tehari, pulao, fried rice)",
    dishType: "complete one-pot meal",
    origin: "South Asian one-pot comfort food",
  },
  {
    id: "cold-quick",
    technique: "no-cook or minimal-cook assembly (bharta, salad, chutney, mash)",
    dishType: "accompaniment served alongside a meal",
    origin: "rural Bengali bharta / pantry tradition",
  },
];

const SHAPE = `{"id":"","title":"","subtitle":"","timeMinutes":0,"utilization":0,"servings":2,"ingredients":[{"name":"","quantity":""}],"missing":[{"name":"","aisle":""}],"steps":[""],"flavor":{"sour":0,"sweet":0,"umami":0,"salty":0,"bitter":0,"spicy":0},"nutrition":"green"}`;

function spiceRule(spice?: string) {
  const map: Record<string, string> = {
    Mild: "Very little chilli; spicy score must be 0-1.",
    Medium: "Moderate chilli; spicy score 2-3.",
    Spicy: "Generously spiced; spicy score 3-4.",
    "Extra spicy": "Fiery; spicy score 5.",
  };
  return map[spice ?? ""] ?? "Moderate chilli; spicy score 2-3.";
}

function saltRule(salt?: string) {
  const map: Record<string, string> = {
    "Low salt": "Low-sodium: minimal salt, lean on acid and aromatics; salty score 0-1.",
    Normal: "Normal seasoning; salty score 2-3.",
    "High salt": "Boldly seasoned; salty score 3-4.",
  };
  return map[salt ?? ""] ?? "Normal seasoning; salty score 2-3.";
}

function timeRule(prefs: ExpertPrefs) {
  if (prefs.maxMinutes) return `Total time MUST be ${prefs.maxMinutes} minutes or less.`;
  const map: Record<string, string> = {
    "Under 15 min": "Total time MUST be 15 minutes or less.",
    "15–30 min": "Total time should be 15-30 minutes.",
    "30+ min": "Up to 45 minutes is fine.",
  };
  return map[prefs.time ?? ""] ?? "Keep total time realistic and state it honestly.";
}

function regionRule(country?: string) {
  const map: Record<string, string> = {
    Bangladesh: "Use Bangladeshi home-kitchen idioms, panch phoron, mustard oil, green chilli.",
    India: "Allow wider Indian regional adaptation (Bengali, Punjabi, South Indian).",
    "Middle East": "Allow South Asian dishes adapted to Middle-Eastern pantry staples.",
    "Europe / Americas":
      "Adapt to a Western pantry: substitute hard-to-find South Asian items sensibly.",
  };
  return map[country ?? ""] ?? "Default to Bengali home cooking with sensible adaptation.";
}

export function buildExpertSystem(
  lane: Lane,
  langName: string,
  prefs: ExpertPrefs,
  naming: string = NAMING_RULE,
) {
  const diet = prefs.diet?.filter((d) => d && d !== "None") ?? [];
  return `You are a master Bengali and South Asian cuisine expert with 30 years of home-kitchen and restaurant experience. You know ingredient synergies, regional variations, and how one basket of ingredients can become completely different dishes.

TASK: create ONE recipe from the user's ingredients, in this assigned lane and NO other:
- Cooking technique: ${lane.technique}
- Dish type: ${lane.dishType}
- Culinary origin: ${lane.origin}
The dish must be unmistakably different from a simple stir-fry of the same items. Never produce a generic "fry" when the lane asks for a curry, batter dish, one-pot meal or no-cook dish.

${naming}

ALL user-visible text (title, subtitle, ingredients, steps) MUST be written in ${langName}.

INGREDIENT LOGIC
- Staples (salt, oil, onion, garlic, ginger, basic spices, water) are assumed available and are NEVER listed as missing.
- Use the user's perishables generously; zero-waste matters. utilization = percent (0-100) of the user's listed ingredients actually used.
- At most 2 missing items, each with its typical store aisle.
- Quantities must be realistic for ${"2"} servings.

USER PREFERENCES (obey strictly)
- Spice: ${spiceRule(prefs.spice)}
- Salt: ${saltRule(prefs.salt)}
- Time: ${timeRule(prefs)}
- Region: ${regionRule(prefs.country)}
${diet.length ? `- Dietary constraints, NEVER violate: ${diet.join(", ")}.` : ""}

OUTPUT RULES
- At most 6 steps, each under 18 words, each a real cooking action (no filler).
- Flavours sour/sweet/umami/salty/bitter/spicy rated 0-5 and consistent with the recipe.
- Return ONLY minified JSON: {"recipe":${SHAPE}}`;
}

/* ---------- diversity filtering ---------- */

function normalise(s: string) {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function jaccard(a: string[], b: string[]) {
  const A = new Set(a);
  const B = new Set(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / (A.size + B.size - inter);
}

/**
 * Keeps only recipes that are meaningfully distinct from the ones already kept:
 * different title, different step language, different ingredient set.
 */
export function filterDiverse(recipes: Recipe[]): Recipe[] {
  const kept: { r: Recipe; title: string[]; steps: string[]; ings: string[] }[] = [];

  for (const r of recipes) {
    const title = normalise(r.title);
    const steps = normalise(r.steps.join(" "));
    const ings = normalise(r.ingredients.map((i) => i.name).join(" "));

    const duplicate = kept.some(
      (k) =>
        jaccard(title, k.title) >= 0.6 ||
        (jaccard(steps, k.steps) >= 0.55 && jaccard(ings, k.ings) >= 0.8),
    );
    if (!duplicate) kept.push({ r, title, steps, ings });
  }

  return kept.map((k) => k.r);
}
