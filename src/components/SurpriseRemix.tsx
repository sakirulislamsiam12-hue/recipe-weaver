import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Shuffle, Sparkles, Wand2 } from "lucide-react";

import { NeuButton, NeuCard, NeuInput } from "./neu";
import { useLang } from "@/lib/i18n";
import { haptic } from "@/lib/haptics";
import { remixRecipe, surpriseRecipe } from "@/lib/premium.functions";
import { loadPrefs } from "@/lib/prefs";
import { recordActivity, refineHints, skillTier } from "@/lib/premium-store";
import type { Recipe } from "@/lib/recipe-schema";

/**
 * 3. AI recipe remix / "Surprise Me".
 *
 * Additive: calls the existing `remixRecipe` / `surpriseRecipe` server
 * functions and hands the new recipe back to the caller.
 */
export function SurpriseRemix({
  recipe,
  pantry,
  onRecipe,
}: {
  recipe: Recipe;
  pantry: string[];
  onRecipe: (r: Recipe) => void;
}) {
  const { t, lang } = useLang();
  const remix = useServerFn(remixRecipe);
  const surprise = useServerFn(surpriseRecipe);
  const [twist, setTwist] = useState("");
  const [busy, setBusy] = useState<"remix" | "surprise" | null>(null);
  const [error, setError] = useState(false);

  const ingredients = pantry.length ? pantry : recipe.ingredients.map((i) => i.name);

  const runRemix = async () => {
    if (busy) return;
    setBusy("remix");
    setError(false);
    haptic("tap");
    try {
      const next = await remix({ data: { lang, twist, pantry: ingredients, recipe } });
      recordActivity("remixes");
      onRecipe({ ...next, id: `remix-${Date.now().toString(36)}` });
    } catch {
      setError(true);
    } finally {
      setBusy(null);
    }
  };

  const runSurprise = async () => {
    if (busy) return;
    setBusy("surprise");
    setError(false);
    haptic("tap");
    const prefs = loadPrefs();
    const hints = refineHints();
    try {
      const next = await surprise({
        data: {
          lang,
          ingredients,
          prefs: {
            ...(prefs.country ? { country: prefs.country } : {}),
            ...(prefs.spice ? { spice: prefs.spice } : {}),
            ...(prefs.salt ? { salt: prefs.salt } : {}),
            ...(prefs.diet ? { diet: prefs.diet } : {}),
            ...(prefs.time ? { time: prefs.time } : {}),
          },
          liked: hints.liked,
          disliked: hints.disliked,
          avoidTitles: [recipe.title],
          tier: skillTier(),
        },
      });
      recordActivity("remixes");
      onRecipe({ ...next, id: `surprise-${Date.now().toString(36)}` });
    } catch {
      setError(true);
    } finally {
      setBusy(null);
    }
  };

  return (
    <NeuCard className="mt-4">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-bold">
        <Sparkles className="h-4 w-4 text-accent" /> {t("surprise")}
      </h2>
      <p className="mb-3 text-xs text-muted-foreground">{t("surpriseHint")}</p>

      <NeuInput
        value={twist}
        onChange={(e) => setTwist(e.target.value)}
        placeholder={t("remixHint")}
      />

      <div className="mt-3 grid grid-cols-2 gap-2">
        <NeuButton size="sm" onClick={runRemix} disabled={busy !== null}>
          <Wand2 className="h-3.5 w-3.5" />
          {busy === "remix" ? t("generating") : t("remix")}
        </NeuButton>
        <NeuButton variant="accent" size="sm" onClick={runSurprise} disabled={busy !== null}>
          <Shuffle className="h-3.5 w-3.5" />
          {busy === "surprise" ? t("generating") : t("surprise")}
        </NeuButton>
      </div>

      {error && <p className="mt-3 text-xs text-destructive">{t("errorGeneric")}</p>}
    </NeuCard>
  );
}
