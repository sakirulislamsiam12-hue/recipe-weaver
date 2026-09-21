import { useMemo, useState } from "react";
import { Check, CalendarRange, Copy, ListChecks, ShoppingCart } from "lucide-react";

import { NeuButton, NeuCard } from "./neu";
import { useLang } from "@/lib/i18n";
import { haptic } from "@/lib/haptics";
import type { Recipe } from "@/lib/recipe-schema";
import { loadGrocery, mergeGrocery, saveGrocery } from "@/lib/premium-store";

/**
 * 9. Meal-prep mode — pick 3–4 recipes, get one consolidated shopping list
 * plus a batch-cooking sequence that front-loads shared prep.
 *
 * Additive: reads the recipes already on screen and only writes to the
 * existing `sp-grocery` store when the cook asks for it.
 */

const MAX_PICKS = 4;
const norm = (s: string) => s.trim().toLowerCase();

type Line = { name: string; quantity?: string; aisle: string; recipes: string[] };

function consolidate(recipes: Recipe[], pantry: string[]) {
  const have = new Set(pantry.map(norm));
  const map = new Map<string, Line>();
  const push = (
    name: string,
    quantity: string | undefined,
    aisle: string,
    recipe: string,
  ) => {
    const clean = name.trim();
    if (!clean) return;
    const key = norm(clean);
    const hit = map.get(key);
    if (hit) {
      if (!hit.recipes.includes(recipe)) hit.recipes.push(recipe);
      if (!hit.quantity && quantity) hit.quantity = quantity;
      return;
    }
    map.set(key, {
      name: clean,
      aisle,
      recipes: [recipe],
      ...(quantity ? { quantity } : {}),
    });
  };

  for (const r of recipes) {
    for (const m of r.missing) push(m.name, undefined, m.aisle, r.title);
    for (const i of r.ingredients) {
      if (have.has(norm(i.name))) continue;
      push(i.name, i.quantity, "", r.title);
    }
  }

  const lines = [...map.values()].sort(
    (a, b) => b.recipes.length - a.recipes.length || a.name.localeCompare(b.name),
  );
  const shared = lines.filter((l) => l.recipes.length > 1);
  return { lines, shared };
}

type Block = { label: string; recipe: string; steps: string[]; minutes: number };

/** Staples you measure out rather than chop or grind. */
const MEASURE_ONLY =
  /salt|sugar|oil|ghee|water|turmeric|powder|masala|cumin|coriander seed|flour|rice|লবণ|চিনি|তেল|ঘি|পানি|হলুদ|গুঁড়|মসলা|আটা|চাল/i;

/** Longest recipe starts first so shorter dishes cook inside its idle time. */
function batchSequence(recipes: Recipe[], sharedNames: string[], lang: "bn" | "en"): Block[] {
  const ordered = [...recipes].sort((a, b) => b.timeMinutes - a.timeMinutes);
  const blocks: Block[] = [];

  if (sharedNames.length > 0) {
    const prep = sharedNames.filter((n) => !MEASURE_ONLY.test(n));
    const measure = sharedNames.filter((n) => MEASURE_ONLY.test(n));
    const steps = [
      ...prep.map((n) =>
        lang === "bn"
          ? `${n} — একবারেই কেটে/বেটে সব রান্নার জন্য ভাগ করে রাখুন`
          : `${n} — cut or grind once, then divide between the dishes`,
      ),
      ...(measure.length > 0
        ? [
            lang === "bn"
              ? `${measure.join(", ")} — হাতের কাছে মেপে সাজিয়ে রাখুন`
              : `${measure.join(", ")} — measure out and keep within reach`,
          ]
        : []),
    ];
    blocks.push({
      label: lang === "bn" ? "একসাথে প্রস্তুতি" : "Shared prep",
      recipe: lang === "bn" ? "সব রেসিপি" : "All recipes",
      minutes: Math.max(10, sharedNames.length * 2),
      steps,
    });
  }


  ordered.forEach((r, index) => {
    blocks.push({
      label:
        index === 0
          ? lang === "bn"
            ? "প্রথমে চুলায় (সবচেয়ে বেশি সময়)"
            : "Start first (longest cook)"
          : lang === "bn"
            ? `এর ফাঁকে · ${index + 1}`
            : `While that simmers · ${index + 1}`,
      recipe: r.title,
      minutes: r.timeMinutes,
      steps: r.steps,
    });
  });

  return blocks;
}

export function MealPrepMode({
  recipes,
  pantry = [],
}: {
  recipes: Recipe[];
  pantry?: string[];
}) {
  const { t, bi: lang } = useLang();
  const [picked, setPicked] = useState<string[]>([]);
  const [added, setAdded] = useState(false);
  const [copied, setCopied] = useState(false);

  const chosen = useMemo(
    () => recipes.filter((r) => picked.includes(r.id)),
    [recipes, picked],
  );
  const { lines, shared } = useMemo(
    () => consolidate(chosen, pantry),
    [chosen, pantry],
  );
  const sequence = useMemo(
    () => (chosen.length >= 2 ? batchSequence(chosen, shared.map((s) => s.name), lang) : []),
    [chosen, shared, lang],
  );
  const totalMinutes = chosen.reduce((sum, r) => sum + r.timeMinutes, 0);
  // Batch cooking overlaps idle time: the longest dish sets the floor, the rest
  // only add their active share on top.
  const longest = chosen.length ? Math.max(...chosen.map((r) => r.timeMinutes)) : 0;
  const batchMinutes = chosen.length
    ? longest + Math.round((totalMinutes - longest) * 0.45)
    : 0;

  if (recipes.length < 2) return null;

  const toggle = (id: string) => {
    haptic("tap");
    setAdded(false);
    setPicked((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= MAX_PICKS
          ? prev
          : [...prev, id],
    );
  };

  const addToGrocery = () => {
    if (lines.length === 0) return;
    saveGrocery(
      mergeGrocery(
        loadGrocery(),
        lines.map((l) => ({
          name: l.name,
          aisle: l.aisle,
          recipe: l.recipes.join(", "),
          ...(l.quantity ? { quantity: l.quantity } : {}),
        })),
      ),
    );
    haptic("success");
    setAdded(true);
  };

  const copyList = async () => {
    const text = lines
      .map((l) => `• ${l.name}${l.quantity ? ` — ${l.quantity}` : ""}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      haptic("success");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — ignore */
    }
  };

  return (
    <NeuCard className="mt-6">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-bold">
        <CalendarRange className="h-4 w-4 text-accent" /> {t("mealPrep")}
      </h2>
      <p className="mb-4 text-xs text-muted-foreground">{t("mealPrepHint")}</p>

      <div className="flex flex-col gap-2">
        {recipes.map((r) => {
          const on = picked.includes(r.id);
          return (
            <button
              key={r.id}
              onClick={() => toggle(r.id)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                on ? "neu-inset text-accent" : "neu-raised"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-xl ${
                  on ? "bg-accent text-accent-foreground" : "neu-inset text-muted-foreground"
                }`}
              >
                {on && <Check className="h-3.5 w-3.5" />}
              </span>
              <span className="flex-1 leading-snug">{r.title}</span>
              <span className="text-xs text-muted-foreground">
                {r.timeMinutes} {t("minutes")}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground">
        {picked.length}/{MAX_PICKS} · {t("mealPrepPick")}
      </p>

      {chosen.length >= 2 && (
        <>
          <div className="neu-inset mt-4 flex flex-wrap gap-2 rounded-lg px-3 py-2 text-xs">
            <span>
              {t("mealPrepBatchTime")}: {batchMinutes} {t("minutes")}
            </span>
            <span className="text-muted-foreground">
              ({t("mealPrepSeparate")} {totalMinutes} {t("minutes")})
            </span>
          </div>

          <h3 className="mt-5 mb-2 flex items-center gap-2 text-xs font-bold">
            <ShoppingCart className="h-3.5 w-3.5 text-accent" /> {t("mealPrepList")}
          </h3>
          <ul className="flex flex-col gap-2 text-sm">
            {lines.map((l) => (
              <li key={l.name} className="flex justify-between gap-3">
                <span>
                  {l.name}
                  {l.recipes.length > 1 && (
                    <span className="ml-1 text-[11px] text-accent">×{l.recipes.length}</span>
                  )}
                </span>
                <span className="text-xs text-muted-foreground">
                  {l.quantity ?? l.aisle}
                </span>
              </li>
            ))}
          </ul>
          {lines.length === 0 && (
            <p className="py-2 text-center text-xs text-muted-foreground">
              {t("mealPrepNothing")}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <NeuButton size="sm" onClick={addToGrocery}>
              <ShoppingCart className="h-3.5 w-3.5" />
              {added ? t("saved") : t("mealPrepAddList")}
            </NeuButton>
            <NeuButton size="sm" onClick={copyList}>
              <Copy className="h-3.5 w-3.5" /> {copied ? t("copied") : t("copyList")}
            </NeuButton>
          </div>

          <h3 className="mt-6 mb-2 flex items-center gap-2 text-xs font-bold">
            <ListChecks className="h-3.5 w-3.5 text-accent" /> {t("mealPrepSequence")}
          </h3>
          <ol className="flex flex-col gap-4">
            {sequence.map((b, bi) => (
              <li key={`${b.recipe}-${bi}`}>
                <p className="text-xs font-semibold text-accent">{b.label}</p>
                <p className="mb-2 text-[11px] text-muted-foreground">
                  {b.recipe} · {b.minutes} {t("minutes")}
                </p>
                <ol className="flex flex-col gap-2 text-sm">
                  {b.steps.map((s, si) => (
                    <li key={si} className="flex gap-2">
                      <span className="neu-raised flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-accent">
                        {si + 1}
                      </span>
                      <span className="pt-0.5 leading-relaxed">{s}</span>
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ol>
        </>
      )}
    </NeuCard>
  );
}
