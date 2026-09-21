import { z } from "zod";

export const flavorSchema = z.object({
  sour: z.number(),
  sweet: z.number(),
  umami: z.number(),
  salty: z.number(),
  bitter: z.number(),
  spicy: z.number(),
});

export const recipeSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().default(""),
  timeMinutes: z.number(),
  utilization: z.number(),
  servings: z.number().default(2),
  ingredients: z.array(z.object({ name: z.string(), quantity: z.string() })),
  missing: z.array(z.object({ name: z.string(), aisle: z.string().default("") })).default([]),
  steps: z.array(z.string()),
  flavor: flavorSchema,
  nutrition: z.enum(["green", "yellow", "red"]).default("green"),
});

export type Recipe = z.infer<typeof recipeSchema>;

export const prefsSchema = z
  .object({
    country: z.string().optional(),
    spice: z.string().optional(),
    salt: z.string().optional(),
    diet: z.array(z.string()).optional(),
    time: z.string().optional(),
    maxMinutes: z.number().optional(),
  })
  .default({});

export const genInputSchema = z.object({
  ingredients: z.array(z.string()).min(1),
  lang: z.enum(["bn", "en"]),
  prefs: prefsSchema,
});

export const chatInputSchema = z.object({
  lang: z.enum(["bn", "en"]),
  recipe: z.object({
    title: z.string(),
    timeMinutes: z.number(),
    ingredients: z.array(z.object({ name: z.string(), quantity: z.string() })),
    steps: z.array(z.string()),
  }),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .min(1)
    .max(40),
});

export const visionInputSchema = z.object({
  lang: z.enum(["bn", "en"]),
  image: z.string().min(32).max(8_000_000),
});

export const detectedItemSchema = z.object({
  name: z.string(),
  quantity: z.string().default(""),
  freshness: z.enum(["fresh", "use-soon", "spoiled"]).default("fresh"),
  confidence: z.number().min(0).max(1).default(0.7),
});

export type DetectedItem = z.infer<typeof detectedItemSchema>;

/** Recipe import from a public URL (blog, Instagram/Reel, YouTube, TikTok). */
export const importInputSchema = z.object({
  url: z.string().url(),
  lang: z.enum(["bn", "en"]),
  pantry: z.array(z.string()).default([]),
});

/** Receipt / barcode-label photo scan. */
export const receiptInputSchema = z.object({
  lang: z.enum(["bn", "en"]),
  image: z.string().min(32).max(8_000_000),
  mode: z.enum(["receipt", "barcode"]).default("receipt"),
});

export const scannedItemSchema = z.object({
  name: z.string(),
  quantity: z.string().default(""),
  expiresOn: z.string().default(""),
});

export const scannedItemsSchema = z.object({
  items: z.array(scannedItemSchema).default([]),
});

export type ScannedItem = z.infer<typeof scannedItemSchema>;
