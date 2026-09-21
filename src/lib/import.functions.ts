import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { callResponses, callVision, parseJsonBlock } from "./ai-core.server";
import { importInputSchema, receiptInputSchema, scannedItemsSchema, recipeSchema } from "./recipe-schema";

/**
 * Imports a recipe from any public URL (blog, Instagram/Reel, YouTube, TikTok).
 * The page HTML is fetched server-side, stripped, and handed to the model to
 * normalise into the app's recipe shape.
 */
export const importRecipeFromUrl = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => importInputSchema.parse(d))
  .handler(async ({ data }) => {
    const langName = data.lang === "bn" ? "Bengali (বাংলা)" : "English";

    let page = "";
    try {
      const res = await fetch(data.url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; SmartPantryAI/1.0)",
          Accept: "text/html,application/json;q=0.9,*/*;q=0.8",
        },
      });
      if (res.ok) page = await res.text();
    } catch {
      page = "";
    }

    const text = page
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z#0-9]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 14_000);

    if (text.length < 40) throw new Error("IMPORT_UNREADABLE");

    const instructions = `You convert a scraped web/social post into ONE structured recipe. Write ALL user-visible text in ${langName}.
Rules:
- Use only what the post actually says; infer sensible quantities and steps when the post is caption-style (Instagram/TikTok/Reels).
- Assume common pantry staples are available and never list them as missing.
- Rate each flavour axis 0-5. utilization = percent of the recipe's ingredients the user already listed as available.
- If the text is clearly not a recipe, return {"recipe":null}.
Return ONLY minified JSON: {"recipe":{"id":"","title":"","subtitle":"","timeMinutes":0,"utilization":0,"servings":2,"ingredients":[{"name":"","quantity":""}],"missing":[{"name":"","aisle":""}],"steps":[""],"flavor":{"sour":0,"sweet":0,"umami":0,"salty":0,"bitter":0,"spicy":0},"nutrition":"green"}}`;

    const reply = await callResponses(
      [
        {
          role: "user",
          content: `Source URL: ${data.url}
Ingredients the user already has: ${data.pantry.join(", ") || "(unknown)"}
Post content:
${text}`,
        },
      ],
      instructions,
    );

    const parsed = z
      .object({ recipe: recipeSchema.nullable() })
      .parse(parseJsonBlock(reply));
    if (!parsed.recipe) throw new Error("IMPORT_NOT_RECIPE");
    return parsed.recipe;
  });

/**
 * Reads a photo of a grocery receipt (or a product/barcode label) and returns
 * the pantry items on it, with expiry hints where printed.
 */
export const scanReceipt = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => receiptInputSchema.parse(d))
  .handler(async ({ data }) => {
    const langName = data.lang === "bn" ? "Bengali (বাংলা)" : "English";
    const what =
      data.mode === "barcode"
        ? "a packaged grocery product label (possibly with a barcode)"
        : "a grocery shop receipt";

    const prompt = `This photo shows ${what}. Extract every food/grocery item.
Give each item: name (in ${langName}, the food itself — not the brand line), quantity if printed (e.g. "1 kg", "২ প্যাকেট"), and expiresOn as yyyy-mm-dd ONLY if a best-before/expiry date is printed, otherwise omit it.
Ignore prices, totals, taxes, loyalty text, phone numbers and non-food items.
Return ONLY minified JSON: {"items":[{"name":"","quantity":"","expiresOn":""}]}`;

    const text = await callVision(data.image, prompt);
    return scannedItemsSchema.parse(parseJsonBlock(text)).items;
  });

/** Looks up a barcode number and returns a best-guess product name. */
export const lookupBarcode = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ code: z.string().min(6).max(20), lang: z.enum(["bn", "en"]) }).parse(d))
  .handler(async ({ data }) => {
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(data.code)}.json?fields=product_name,generic_name,brands,quantity`,
      );
      if (res.ok) {
        const json = (await res.json()) as {
          status?: number;
          product?: { product_name?: string; generic_name?: string; quantity?: string };
        };
        const name = json.product?.product_name || json.product?.generic_name;
        if (json.status === 1 && name) {
          return { name, quantity: json.product?.quantity ?? "" };
        }
      }
    } catch {
      /* fall through */
    }
    return { name: "", quantity: "" };
  });
