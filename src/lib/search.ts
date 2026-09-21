// Trie-based prefix autocomplete with typo-tolerant fuzzy fallback.

import { INGREDIENTS, type Category, type Ingredient } from "./pantry-data";

type Node = { children: Map<string, Node>; items: Ingredient[] };

function newNode(): Node {
  return { children: new Map(), items: [] };
}

const root = newNode();

function insert(term: string, item: Ingredient) {
  const key = term.trim().toLowerCase();
  if (!key) return;
  let node = root;
  for (const ch of key) {
    let next = node.children.get(ch);
    if (!next) {
      next = newNode();
      node.children.set(ch, next);
    }
    node = next;
    if (!node.items.includes(item)) node.items.push(item);
  }
}

for (const item of INGREDIENTS) {
  insert(item.en, item);
  insert(item.bn, item);
  for (const a of item.aliases ?? []) insert(a, item);
  // also index the second word so "green chilli" matches "chilli"
  for (const part of item.en.split(/\s+/).slice(1)) insert(part, item);
}

function prefixMatches(q: string): Ingredient[] {
  let node = root;
  for (const ch of q) {
    const next = node.children.get(ch);
    if (!next) return [];
    node = next;
  }
  return node.items;
}

/** Damerau-Levenshtein distance, capped for speed. */
export function editDistance(a: string, b: string, max = 3): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev = new Array(b.length + 1);
  const cur = new Array(b.length + 1);
  let prevPrev: number[] = [];
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i;
    let rowMin = cur[0];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, (prevPrev[j - 2] ?? Infinity) + 1);
      }
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prevPrev = prev.slice();
    for (let j = 0; j <= b.length; j++) prev[j] = cur[j];
  }
  return prev[b.length];
}

function terms(item: Ingredient) {
  return [item.en.toLowerCase(), item.bn, ...(item.aliases ?? []).map((a) => a.toLowerCase())];
}

export type Suggestion = { item: Ingredient; score: number };

/** Prefix hits first, then typo-tolerant fuzzy hits. */
export function searchIngredients(query: string, limit = 24): Suggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const seen = new Set<Ingredient>();
  const out: Suggestion[] = [];

  for (const item of prefixMatches(q)) {
    seen.add(item);
    out.push({ item, score: 1 - Math.min(0.4, (item.en.length - q.length) / 40) });
  }

  if (out.length < limit && q.length >= 3) {
    const tolerance = q.length <= 4 ? 1 : q.length <= 7 ? 2 : 3;
    for (const item of INGREDIENTS) {
      if (seen.has(item)) continue;
      let best = tolerance + 1;
      for (const t of terms(item)) {
        best = Math.min(best, editDistance(q, t, tolerance));
        // also compare against a same-length prefix so "tomatoo" ~ "tomato"
        if (t.length > q.length) best = Math.min(best, editDistance(q, t.slice(0, q.length), tolerance));
      }
      if (best <= tolerance) {
        seen.add(item);
        out.push({ item, score: 0.7 - best * 0.15 });
      }
    }
  }

  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}

export const CATEGORY_ORDER: Category[] = [
  "vegetable",
  "protein",
  "fruit",
  "dairy",
  "grain",
  "herb",
  "spice",
  "condiment",
  "other",
];

export function groupByCategory(suggestions: Suggestion[]) {
  const map = new Map<Category, Ingredient[]>();
  for (const s of suggestions) {
    const list = map.get(s.item.category) ?? [];
    list.push(s.item);
    map.set(s.item.category, list);
  }
  return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({
    category: c,
    items: map.get(c)!,
  }));
}

/** Bulk paste: split on commas, newlines, semicolons, bullets and Bengali danda. */
export function parseBulk(text: string): string[] {
  return text
    .split(/[,\n;•|।]+/)
    .map((s) => s.replace(/^\s*[-*\d.)\]]+\s*/, "").trim())
    .filter((s) => s.length > 0 && s.length < 60);
}
