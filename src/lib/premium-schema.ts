import { z } from "zod";

import { recipeSchema } from "./recipe-schema";

/** 3. AI recipe remix / "Surprise Me". */
export const remixInputSchema = z.object({
  lang: z.enum(["bn", "en"]),
  twist: z.string().max(120).default(""),
  pantry: z.array(z.string()).default([]),
  recipe: recipeSchema,
});

export const surpriseInputSchema = z.object({
  lang: z.enum(["bn", "en"]),
  ingredients: z.array(z.string()).min(1),
  prefs: z
    .object({
      country: z.string().optional(),
      spice: z.string().optional(),
      salt: z.string().optional(),
      diet: z.array(z.string()).optional(),
      time: z.string().optional(),
    })
    .default({}),
  /** Condensed learning signal from the rate-&-refine loop. */
  liked: z.array(z.string()).default([]),
  disliked: z.array(z.string()).default([]),
  avoidTitles: z.array(z.string()).default([]),
  tier: z.enum(["beginner", "confident", "advanced"]).default("beginner"),
});

/** 9. Multi-recipe meal prep mode. */
export const mealPrepInputSchema = z.object({
  lang: z.enum(["bn", "en"]),
  recipes: z
    .array(
      z.object({
        title: z.string(),
        timeMinutes: z.number().default(30),
        ingredients: z.array(z.object({ name: z.string(), quantity: z.string() })).default([]),
        steps: z.array(z.string()).default([]),
      }),
    )
    .min(2)
    .max(4),
});

export const mealPrepPlanSchema = z.object({
  totalMinutes: z.number().default(0),
  sharedPrep: z.array(z.string()).default([]),
  timeline: z
    .array(
      z.object({
        atMinute: z.number().default(0),
        recipe: z.string().default(""),
        task: z.string(),
      }),
    )
    .default([]),
  storage: z.array(z.string()).default([]),
});

export type MealPrepPlan = z.infer<typeof mealPrepPlanSchema>;

