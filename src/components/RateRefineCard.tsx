import { useEffect, useState } from "react";
import { Star, ThumbsDown, ThumbsUp } from "lucide-react";

import { NeuButton, NeuCard, NeuInput } from "./neu";
import { useLang } from "@/lib/i18n";
import { haptic } from "@/lib/haptics";
import {
  feedbackFor,
  recordActivity,
  recordSkill,
  saveFeedback,
  type Feedback,
} from "@/lib/premium-store";
import type { Recipe } from "@/lib/recipe-schema";

/** 19. Rate & refine — feeds the next generation via refineHints(). */
export function RateRefineCard({ recipe }: { recipe: Recipe }) {
  const { t, lang } = useLang();
  const [stars, setStars] = useState(0);
  const [outcome, setOutcome] = useState<"easy" | "ok" | "hard" | null>(null);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const existing: Feedback | null = feedbackFor(recipe.id);
    setStars(existing?.stars ?? 0);
    setNote(existing?.note ?? "");
    setSaved(Boolean(existing));
    setOutcome(null);
  }, [recipe.id]);

  const submit = () => {
    haptic("tap");
    saveFeedback({
      recipeId: recipe.id,
      title: recipe.title,
      stars,
      tags: outcome ? [outcome] : [],
      note,
      at: new Date().toISOString(),
    });
    if (outcome) recordSkill("medium", outcome);
    recordActivity("cooked");
    setSaved(true);
  };

  const outcomes = [
    { id: "easy", label: t("tooEasy") },
    { id: "ok", label: t("justRight") },
    { id: "hard", label: t("tooHard") },
  ] as const;

  return (
    <NeuCard className="mt-4">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-bold">
        {stars >= 3 ? (
          <ThumbsUp className="h-4 w-4 text-accent" />
        ) : (
          <ThumbsDown className="h-4 w-4 text-accent" />
        )}
        {t("rateRecipe")}
      </h2>
      <p className="mb-3 text-xs text-muted-foreground">{t("rateHint")}</p>

      <div className="mb-4 flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => {
              setStars(n);
              setSaved(false);
            }}
            aria-label={`${n} ${lang === "bn" ? "তারা" : "stars"}`}
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              n <= stars ? "neu-inset text-accent" : "neu-raised text-muted-foreground"
            }`}
          >
            <Star className="h-4 w-4" fill={n <= stars ? "currentColor" : "none"} />
          </button>
        ))}
      </div>

      <p className="mb-2 text-xs font-semibold text-muted-foreground">{t("howWasIt")}</p>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {outcomes.map((o) => (
          <button
            key={o.id}
            onClick={() => {
              setOutcome(o.id);
              setSaved(false);
            }}
            className={`rounded-lg px-2 py-2.5 text-xs font-medium ${
              outcome === o.id ? "neu-inset text-accent" : "neu-raised text-foreground"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <NeuInput
        value={note}
        onChange={(e) => {
          setNote(e.target.value);
          setSaved(false);
        }}
        placeholder={t("noteOptional")}
      />

      <NeuButton
        variant="accent"
        size="lg"
        className="mt-3"
        onClick={submit}
        disabled={stars === 0 && !outcome && !note.trim()}
      >
        {saved ? t("saved") : t("saveFeedback")}
      </NeuButton>
    </NeuCard>
  );
}
