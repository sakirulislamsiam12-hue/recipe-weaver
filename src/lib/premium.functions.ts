import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { NAMING_RULE, callResponses, parseJsonBlock, withGoodTitle } from "./ai-core.server";
import { recipeSchema } from "./recipe-schema";
import {
  mealPrepInputSchema,
  mealPrepPlanSchema,
  remixInputSchema,
  surpriseInputSchema,
} from "./premium-schema";

/** 3a. Remix an existing recipe with a twist, keeping the pantry-first spirit. */
export const remixRecipe = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => remixInputSchema.parse(d))
  .handler(async ({ data }) => {
    const langName = data.lang === "bn" ? "Bengali (বাংলা)" : "English";
    const instructions = `You remix recipes. Write ALL user-visible text in ${langName}.
Take the given recipe and produce ONE creative but practical variation.
Rules:
- Keep the same core protein/vegetable base where possible; change technique, spicing or format.
- Prefer ingredients the user already has; at most 2 missing items, each with a store aisle.
- The remix title MUST be an existing authentic dish name from our 507-recipe database (never a new name or combination); express the twist ONLY in the one-line subtitle.
${NAMING_RULE}
- Balance flavours across sour/sweet/umami/salty/bitter/spicy, each rated 0-5.
Return ONLY minified JSON: {"recipe":{"id":"string","title":"","subtitle":"","timeMinutes":0,"utilization":0,"servings":2,"ingredients":[{"name":"","quantity":""}],"missing":[{"name":"","aisle":""}],"steps":[""],"flavor":{"sour":0,"sweet":0,"umami":0,"salty":0,"bitter":0,"spicy":0},"nutrition":"green"}}`;

    return withGoodTitle(async (attempt) => {
      const text = await callResponses(
      [
        {
          role: "user",
          content: `${attempt > 0 ? "Your previous title was not a real Bangladeshi dish name. Use a plain, recognisable dish name.\n" : ""}Original recipe: ${JSON.stringify(data.recipe)}
Pantry: ${data.pantry.join(", ")}
Requested twist: ${data.twist || "chef's choice"}`,
        },
      ],
      instructions,
      );

      return z.object({ recipe: recipeSchema }).parse(parseJsonBlock(text)).recipe;
    }, 3, { ingredients: [...data.pantry, data.recipe.title], lang: data.lang });
  });

/** 3b. "Surprise Me" — one adventurous recipe tuned by past feedback and skill tier. */
export const surpriseRecipe = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => surpriseInputSchema.parse(d))
  .handler(async ({ data }) => {
    const langName = data.lang === "bn" ? "Bengali (বাংলা)" : "English";
    const instructions = `You are a zero-waste recipe engine in "surprise me" mode. Write ALL user-visible text in ${langName}.
Rules:
- Pick ONE unexpected but genuinely cookable dish from our authentic 507-recipe Bangladeshi database that fits the listed ingredients. Never invent a dish name; the surprise lives in the choice of dish and in the subtitle.
- Assume common staples (salt, oil, onion, garlic, ginger, basic spices) are available and never list them as missing.
- At most 2 missing items, each with its typical store aisle.
- Match the cook's skill tier: ${data.tier} (beginner = simple technique, advanced = allow multi-stage technique).
- Respect all dietary constraints strictly.
- Balance flavours across sour/sweet/umami/salty/bitter/spicy, each rated 0-5.
${NAMING_RULE}
Return ONLY minified JSON: {"recipe":{"id":"string","title":"","subtitle":"","timeMinutes":0,"utilization":0,"servings":2,"ingredients":[{"name":"","quantity":""}],"missing":[{"name":"","aisle":""}],"steps":[""],"flavor":{"sour":0,"sweet":0,"umami":0,"salty":0,"bitter":0,"spicy":0},"nutrition":"green"}}`;

    return withGoodTitle(async (attempt) => {
      const text = await callResponses(
      [
        {
          role: "user",
          content: `${attempt > 0 ? "Your previous title was not a real Bangladeshi dish name. Use a plain, recognisable dish name.\n" : ""}Ingredients: ${data.ingredients.join(", ")}
Preferences: ${JSON.stringify(data.prefs)}
Dishes the cook loved: ${data.liked.join(", ") || "none yet"}
Dishes the cook disliked: ${data.disliked.join(", ") || "none yet"}
Do NOT repeat these titles: ${data.avoidTitles.join(", ") || "none"}`,
        },
      ],
      instructions,
      );

      return z.object({ recipe: recipeSchema }).parse(parseJsonBlock(text)).recipe;
    }, 3, { ingredients: data.ingredients, lang: data.lang });
  });

/** 9. Multi-recipe meal prep plan: shared prep, interleaved timeline, storage advice. */
export const mealPrepPlan = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => mealPrepInputSchema.parse(d))
  .handler(async ({ data }) => {
    const langName = data.lang === "bn" ? "Bengali (বাংলা)" : "English";
    const instructions = `You are a meal-prep planner. Write ALL user-visible text in ${langName}.
Given several recipes cooked in one session, produce an efficient interleaved plan.
Rules:
- Group shared prep (chopping, soaking, boiling) that serves more than one recipe.
- Build a minute-by-minute timeline that uses waiting time of one dish to progress another.
- Total time must be clearly less than cooking the recipes one after another.
- Add short storage/reheating advice per dish.
Return ONLY minified JSON: {"plan":{"totalMinutes":0,"sharedPrep":[""],"timeline":[{"atMinute":0,"recipe":"","task":""}],"storage":[""]}}`;

    const text = await callResponses(
      [{ role: "user", content: `Recipes: ${JSON.stringify(data.recipes)}` }],
      instructions,
    );

    return z.object({ plan: mealPrepPlanSchema }).parse(parseJsonBlock(text)).plan;
  });
