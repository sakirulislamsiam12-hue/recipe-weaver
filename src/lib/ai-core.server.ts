// Server-only Lovable AI Gateway helpers. Never imported by client code.

import type { Cuisine } from "./cuisine";
import { AUTHENTIC_TITLES_BN, closestAuthentic, fallbackTitle, isBadTitle } from "./recipe-db";
import { AMERICAN_TITLES } from "./recipe-db-american";
import {
  closestLibraryTitle,
  getRecipeIndex,
  isLibraryTitle,
  libraryTitleSample,
} from "./recipe-index.server";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";

/** A rotating sample of authentic titles, small enough for a prompt. */
function sampleTitles(all: string[], limit = 160) {
  const step = Math.max(1, Math.floor(all.length / limit));
  return all.filter((_, i) => i % step === 0).slice(0, limit).join(", ");
}

function titleSample(limit = 160) {
  return sampleTitles(AUTHENTIC_TITLES_BN, limit);
}

function bengaliNamingRule(sample: string, total: number) {
  return `RECIPE NAMING LAW (highest priority)
You are a Bangladeshi cuisine expert. You MUST ONLY suggest recipes that already exist in our authentic recipe database of ${total || "500+"} real dishes. Do NOT generate new recipe names or combinations. When the user inputs ingredients, pick the closest real dishes from that database. If no close match exists, use fallback safe names ONLY: "[ingredient] ভাজি" or "[ingredient] তরকারি". Never invent new dish names. Creativity only in description/subtitle, never in the recipe name.
HARD LIMITS: maximum 5 words, Bengali script, no fusion / deconstructed / medley / surprise / smoked / modern / English adjectives. Any creativity belongs in \`subtitle\`, never in the title. Always return a recipe — never skip.
AUTHENTIC DATABASE NAMES (a random sample — choose from these, or a dish of the exact same kind): ${sample}`;
}

const BENGALI_NAMING_RULE = bengaliNamingRule(titleSample(), AUTHENTIC_TITLES_BN.length);

const AMERICAN_NAMING_RULE = `RECIPE NAMING LAW (highest priority)
You are an American home-cooking expert. You MUST ONLY suggest dishes that already exist in real American home cooking and in our American recipe database. Do NOT invent new dish names or fusion combinations, and NEVER suggest a Bangladeshi, Bengali or South Asian dish — that catalogue is completely off-limits in American mode. When the user inputs ingredients, pick the closest match from the American database. If no close match exists, use a plain safe name ONLY: "[ingredient] Skillet", "[ingredient] Casserole", "[ingredient] Soup" or "[ingredient] Salad".
HARD LIMITS: maximum 5 words, English only (never Bengali script), no fusion / deconstructed / medley / surprise / gourmet / modern adjectives. Any creativity belongs in \`subtitle\`, never in the title. Always return a recipe — never skip.
AMERICAN DATABASE NAMES (choose from these, or a dish of the exact same kind): ${sampleTitles(AMERICAN_TITLES)}`;

/** Naming law for the cuisine universe the user is cooking in. */
export function namingRule(cuisine: Cuisine = "bengali") {
  return cuisine === "american" ? AMERICAN_NAMING_RULE : BENGALI_NAMING_RULE;
}

/**
 * Naming law anchored to the FULL imported recipe library (10k+ rows) instead
 * of the small hard-coded list. Falls back to the built-in list when the
 * library is empty or unreachable.
 */
export async function namingRuleFromLibrary(cuisine: Cuisine = "bengali") {
  if (cuisine === "american") return AMERICAN_NAMING_RULE;
  const { names } = await getRecipeIndex("bengali");
  if (names.length === 0) return BENGALI_NAMING_RULE;
  const sample = await libraryTitleSample(180, "bengali");
  return bengaliNamingRule(sample, names.length);
}

/** Back-compat default (Bengali). */
export const NAMING_RULE = BENGALI_NAMING_RULE;

/**
 * Runs `attempt` up to `tries` times, rejecting titles that are not authentic
 * database dish names for the active cuisine. A title counts as authentic when
 * it exists in the imported recipe library OR in the built-in list.
 */
export async function withGoodTitle<T extends { title: string }>(
  attempt: (n: number) => Promise<T>,
  tries = 3,
  fallback?: { ingredients?: string[]; lang?: "bn" | "en"; cuisine?: Cuisine },
): Promise<T> {
  const cuisine: Cuisine = fallback?.cuisine ?? "bengali";
  let last: T | undefined;
  for (let n = 0; n < tries; n++) {
    const result = await attempt(n);
    last = result;
    if (!isBadTitle(result.title, cuisine)) return result;
    if (cuisine !== "american" && (await isLibraryTitle(result.title, "bengali"))) return result;
  }
  const lang = fallback?.lang ?? "bn";
  const ingredients = fallback?.ingredients ?? [];
  const fromLibrary =
    cuisine === "american" ? undefined : await closestLibraryTitle(ingredients, "bengali");
  const safe =
    fromLibrary ??
    closestAuthentic(ingredients, lang, cuisine) ??
    fallbackTitle(ingredients[0], lang, cuisine);
  return { ...(last as T), title: safe };
}


function gatewayError(status: number, body: string) {
  if (status === 429) return new Error("RATE_LIMIT");
  if (status === 402 || status === 403) return new Error("AI_UNAVAILABLE");
  return new Error(`AI error ${status}: ${body.slice(0, 300)}`);
}

/** Responses API call for text generation (default chat model). */
export async function callResponses(input: unknown, instructions: string) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Missing LOVABLE_API_KEY");

  const res = await fetch(`${GATEWAY}/responses`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
    body: JSON.stringify({ model: "openai/gpt-5.6-sol", instructions, input, stream: false }),
  });

  if (!res.ok) throw gatewayError(res.status, await res.text());

  const data = (await res.json()) as {
    output_text?: string;
    output?: Array<{
      type?: string;
      text?: string;
      summary?: Array<{ text?: string }>;
      content?: Array<{ text?: string; summary_text?: string }>;
    }>;
  };

  const pick = (keep: (t?: string) => boolean) =>
    (data.output ?? [])
      .filter((o) => keep(o.type))
      .flatMap((o) => [
        o.text ?? "",
        ...(o.content?.map((c) => c.text ?? c.summary_text ?? "") ?? []),
        ...(o.summary?.map((s) => s.text ?? "") ?? []),
      ])
      .join(" ")
      .trim();

  // 1) output_text, 2) message items, 3) reasoning summary as last resort.
  const text =
    (data.output_text ?? "").trim() ||
    pick((t) => t !== "reasoning") ||
    pick(() => true);

  return text.trim();
}

/** Chat-completions call used for multimodal (vision) input. */

/**
 * Fast, low-latency chat-completions call used by latency-sensitive features
 * (recipe generation). Additive: `callResponses` above is left untouched.
 */
export async function callFastChat(system: string, user: string) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Missing LOVABLE_API_KEY");

  const res = await fetch(`${GATEWAY}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
    body: JSON.stringify({
      model: "google/gemini-3.1-flash-lite",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) throw gatewayError(res.status, await res.text());

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return (data.choices?.[0]?.message?.content ?? "").trim();
}

export async function callVision(dataUrl: string, prompt: string) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Missing LOVABLE_API_KEY");

  const res = await fetch(`${GATEWAY}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
    body: JSON.stringify({
      model: "google/gemini-3.7-flash",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  });

  if (!res.ok) throw gatewayError(res.status, await res.text());

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return (data.choices?.[0]?.message?.content ?? "").trim();
}

export function parseJsonBlock(text: string) {
  const cleaned = text
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  return JSON.parse(start >= 0 ? cleaned.slice(start, end + 1) : cleaned);
}
