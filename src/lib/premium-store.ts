/**
 * Shared local-first persistence for the Section 6 premium features.
 *
 * Additive only: nothing here replaces the existing pantry / prefs stores.
 * Everything is guest-safe (localStorage) so no account is required, and the
 * shapes intentionally mirror what a future Cloud table would hold.
 */

import type { Recipe } from "./recipe-schema";

function read<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota — ignore */
  }
}

export const todayKey = () => new Date().toISOString().slice(0, 10);

/* ------------------------------------------------------------------ *
 * 1. Smart grocery list (auto-synced from missing items)
 * ------------------------------------------------------------------ */

export type GroceryLine = {
  id: string;
  name: string;
  quantity?: string;
  aisle: string;
  recipe?: string;
  done: boolean;
  addedAt: string;
};

const GROCERY_KEY = "sp-grocery";

export const loadGrocery = () => read<GroceryLine[]>(GROCERY_KEY, []);
export const saveGrocery = (lines: GroceryLine[]) => write(GROCERY_KEY, lines);

const norm = (s: string) => s.trim().toLowerCase();

/** Merge missing items in without ever duplicating an existing line. */
export function mergeGrocery(
  existing: GroceryLine[],
  incoming: { name: string; quantity?: string; aisle?: string; recipe?: string }[],
): GroceryLine[] {
  const next = [...existing];
  for (const item of incoming) {
    const name = item.name.trim();
    if (!name) continue;
    const hit = next.find((l) => norm(l.name) === norm(name));
    if (hit) {
      if (!hit.recipe && item.recipe) hit.recipe = item.recipe;
      if (!hit.quantity && item.quantity) hit.quantity = item.quantity;
      continue;
    }
    next.push({
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      aisle: item.aisle?.trim() || "",
      done: false,
      addedAt: new Date().toISOString(),
      ...(item.quantity ? { quantity: item.quantity } : {}),
      ...(item.recipe ? { recipe: item.recipe } : {}),
    });
  }
  return next;
}

/* ------------------------------------------------------------------ *
 * 8. Cooking streaks & achievement badges
 * ------------------------------------------------------------------ */

export type Streak = {
  /** ISO dates on which the user cooked something. */
  days: string[];
  cooked: number;
  wasteSaved: number;
  remixes: number;
  handsFree: number;
  mealPreps: number;
};

const STREAK_KEY = "sp-streak";
const emptyStreak: Streak = {
  days: [],
  cooked: 0,
  wasteSaved: 0,
  remixes: 0,
  handsFree: 0,
  mealPreps: 0,
};

export const loadStreak = (): Streak => ({ ...emptyStreak, ...read<Partial<Streak>>(STREAK_KEY, {}) });
export const saveStreak = (s: Streak) => write(STREAK_KEY, s);

export function recordActivity(
  kind: "cooked" | "wasteSaved" | "remixes" | "handsFree" | "mealPreps",
  current = loadStreak(),
): Streak {
  const day = todayKey();
  const next: Streak = {
    ...current,
    [kind]: (current[kind] ?? 0) + 1,
    days: current.days.includes(day) ? current.days : [...current.days, day].slice(-400),
  };
  saveStreak(next);
  return next;
}

/** Consecutive days ending today (or yesterday, so a streak survives until midnight). */
export function currentStreak(days: string[]) {
  if (days.length === 0) return 0;
  const set = new Set(days);
  const probe = new Date();
  if (!set.has(probe.toISOString().slice(0, 10))) probe.setDate(probe.getDate() - 1);
  let count = 0;
  while (set.has(probe.toISOString().slice(0, 10))) {
    count++;
    probe.setDate(probe.getDate() - 1);
  }
  return count;
}

export function longestStreak(days: string[]) {
  const sorted = [...new Set(days)].sort();
  let best = 0;
  let run = 0;
  let prev: number | null = null;
  for (const d of sorted) {
    const time = new Date(`${d}T00:00:00`).getTime();
    run = prev !== null && time - prev === 86_400_000 ? run + 1 : 1;
    prev = time;
    if (run > best) best = run;
  }
  return best;
}

export type Badge = {
  id: string;
  bn: string;
  en: string;
  descBn: string;
  descEn: string;
  earned: boolean;
  progress: number;
  target: number;
};

export function badgesFor(s: Streak): Badge[] {
  const streak = currentStreak(s.days);
  const defs: Omit<Badge, "earned" | "progress">[] = [
    { id: "first", bn: "প্রথম রান্না", en: "First Cook", descBn: "একটি রেসিপি রান্না করুন", descEn: "Cook your first recipe", target: 1 },
    { id: "streak3", bn: "৩ দিনের ধারা", en: "3-Day Streak", descBn: "টানা ৩ দিন রান্না", descEn: "Cook 3 days in a row", target: 3 },
    { id: "streak7", bn: "সপ্তাহজয়ী", en: "Week Warrior", descBn: "টানা ৭ দিন রান্না", descEn: "Cook 7 days in a row", target: 7 },
    { id: "waste5", bn: "অপচয়রোধী", en: "Waste Fighter", descBn: "৫টি উপকরণ বাঁচান", descEn: "Rescue 5 ingredients", target: 5 },
    { id: "remix3", bn: "রিমিক্স শিল্পী", en: "Remix Artist", descBn: "৩টি রেসিপি রিমিক্স করুন", descEn: "Remix 3 recipes", target: 3 },
    { id: "handsfree", bn: "হাত ছাড়া শেফ", en: "Hands-Free Chef", descBn: "ভয়েস মোডে রান্না করুন", descEn: "Cook in voice mode", target: 1 },
    { id: "prep2", bn: "মিল প্রেপ মাস্টার", en: "Prep Master", descBn: "২টি মিল-প্রেপ পরিকল্পনা", descEn: "Plan 2 meal preps", target: 2 },
  ];
  const value: Record<string, number> = {
    first: s.cooked,
    streak3: streak,
    streak7: streak,
    waste5: s.wasteSaved,
    remix3: s.remixes,
    handsfree: s.handsFree,
    prep2: s.mealPreps,
  };
  return defs.map((d) => {
    const progress = Math.min(value[d.id] ?? 0, d.target);
    return { ...d, progress, earned: progress >= d.target };
  });
}

/* ------------------------------------------------------------------ *
 * 6. Offline recipe caching
 * ------------------------------------------------------------------ */

export type CachedRecipe = { recipe: Recipe; savedAt: string };

const OFFLINE_KEY = "sp-offline-recipes";
const OFFLINE_MAX = 30;

export const loadOffline = () => read<CachedRecipe[]>(OFFLINE_KEY, []);

export function cacheOffline(recipe: Recipe) {
  const list = loadOffline().filter((c) => c.recipe.id !== recipe.id);
  const next = [{ recipe, savedAt: new Date().toISOString() }, ...list].slice(0, OFFLINE_MAX);
  write(OFFLINE_KEY, next);
  return next;
}

export function removeOffline(id: string) {
  const next = loadOffline().filter((c) => c.recipe.id !== id);
  write(OFFLINE_KEY, next);
  return next;
}

export const isCachedOffline = (id: string) => loadOffline().some((c) => c.recipe.id === id);

/* ------------------------------------------------------------------ *
 * 13. Household / family profiles (shared pantry + portions)
 * ------------------------------------------------------------------ */

export type Member = {
  id: string;
  name: string;
  appetite: "small" | "regular" | "big";
  ageGroup: "child" | "adult";
  avoids: string[];
};

export type Household = { name: string; members: Member[]; sharedPantry: boolean };

const HOUSEHOLD_KEY = "sp-household";

const defaultHousehold: Household = { name: "", members: [], sharedPantry: true };

export const loadHousehold = (): Household => ({
  ...defaultHousehold,
  ...read<Partial<Household>>(HOUSEHOLD_KEY, {}),
});
export const saveHousehold = (h: Household) => write(HOUSEHOLD_KEY, h);

const APPETITE: Record<Member["appetite"], number> = { small: 0.7, regular: 1, big: 1.35 };

/** Portion units the household needs — 1 unit = one regular adult serving. */
export function householdServings(h: Household) {
  if (h.members.length === 0) return 0;
  const total = h.members.reduce(
    (sum, m) => sum + APPETITE[m.appetite] * (m.ageGroup === "child" ? 0.6 : 1),
    0,
  );
  return Math.max(1, Math.round(total * 10) / 10);
}

export function householdAvoids(h: Household) {
  return [...new Set(h.members.flatMap((m) => m.avoids))].filter(Boolean);
}

/* ------------------------------------------------------------------ *
 * 12. Adaptive difficulty learning
 * ------------------------------------------------------------------ */

export type SkillLog = {
  /** Rolling record of how the user coped with recipes. */
  entries: { level: "easy" | "medium" | "hard"; outcome: "easy" | "ok" | "hard"; at: string }[];
};

const SKILL_KEY = "sp-skill";

export const loadSkill = (): SkillLog => read<SkillLog>(SKILL_KEY, { entries: [] });

export function recordSkill(level: "easy" | "medium" | "hard", outcome: "easy" | "ok" | "hard") {
  const log = loadSkill();
  const next: SkillLog = {
    entries: [...log.entries, { level, outcome, at: new Date().toISOString() }].slice(-40),
  };
  write(SKILL_KEY, next);
  return next;
}

export type SkillTier = "beginner" | "confident" | "advanced";

/** Learns from the last 10 outcomes: repeated "too easy" pushes the tier up. */
export function skillTier(log = loadSkill()): SkillTier {
  const recent = log.entries.slice(-10);
  if (recent.length < 3) return "beginner";
  const score = recent.reduce(
    (sum, e) => sum + (e.outcome === "easy" ? 1 : e.outcome === "hard" ? -1.5 : 0.2),
    0,
  );
  if (score >= 4) return "advanced";
  if (score >= 1) return "confident";
  return "beginner";
}

/* ------------------------------------------------------------------ *
 * 19. Rate & refine feedback loop
 * ------------------------------------------------------------------ */

export type Feedback = {
  recipeId: string;
  title: string;
  stars: number;
  tags: string[];
  note: string;
  at: string;
};

const FEEDBACK_KEY = "sp-feedback";

export const loadFeedback = () => read<Feedback[]>(FEEDBACK_KEY, []);

export function saveFeedback(entry: Feedback) {
  const next = [entry, ...loadFeedback().filter((f) => f.recipeId !== entry.recipeId)].slice(0, 80);
  write(FEEDBACK_KEY, next);
  return next;
}

export const feedbackFor = (recipeId: string) =>
  loadFeedback().find((f) => f.recipeId === recipeId) ?? null;

/** Condensed learning signal handed to the AI on the next generation. */
export function refineHints(list = loadFeedback()) {
  const recent = list.slice(0, 12);
  const liked = recent.filter((f) => f.stars >= 4).map((f) => f.title);
  const disliked = recent.filter((f) => f.stars <= 2).map((f) => f.title);
  const tally = new Map<string, number>();
  for (const f of recent) for (const t of f.tags) tally.set(t, (tally.get(t) ?? 0) + 1);
  const tags = [...tally.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
  const notes = recent.filter((f) => f.note.trim()).map((f) => f.note.trim());
  return { liked, disliked, tags, notes };
}

/* ------------------------------------------------------------------ *
 * 20. Smart notification digest
 * ------------------------------------------------------------------ */

export type DigestSettings = { enabled: boolean; hour: number; minute: number; lastSent: string };

const DIGEST_KEY = "sp-digest";

export const loadDigest = (): DigestSettings => ({
  enabled: false,
  hour: 18,
  minute: 0,
  lastSent: "",
  ...read<Partial<DigestSettings>>(DIGEST_KEY, {}),
});
export const saveDigest = (d: DigestSettings) => write(DIGEST_KEY, d);

/* ------------------------------------------------------------------ *
 * 11. Kitchen mode
 * ------------------------------------------------------------------ */

export type KitchenSettings = { large: boolean; keepAwake: boolean };

const KITCHEN_KEY = "sp-kitchen";

export const loadKitchen = (): KitchenSettings => ({
  large: true,
  keepAwake: true,
  ...read<Partial<KitchenSettings>>(KITCHEN_KEY, {}),
});
export const saveKitchen = (k: KitchenSettings) => write(KITCHEN_KEY, k);
