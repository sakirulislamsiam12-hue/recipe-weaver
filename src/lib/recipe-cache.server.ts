// Server-only in-memory LRU for the last 5 generated recipe sets.
// Lets remix / "Surprise Me" reuse a base result instead of re-querying the AI.
import type { Recipe } from "./recipe-schema";

const MAX = 5;
const store = new Map<string, Recipe[]>();

export function cacheKey(parts: unknown) {
  return JSON.stringify(parts);
}

export function getCachedRecipes(key: string): Recipe[] | undefined {
  const hit = store.get(key);
  if (!hit) return undefined;
  // refresh recency
  store.delete(key);
  store.set(key, hit);
  return hit;
}

export function setCachedRecipes(key: string, recipes: Recipe[]) {
  store.set(key, recipes);
  while (store.size > MAX) {
    const oldest = store.keys().next().value;
    if (oldest === undefined) break;
    store.delete(oldest);
  }
}
