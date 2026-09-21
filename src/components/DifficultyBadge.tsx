import { useEffect, useState } from "react";
import { Gauge } from "lucide-react";

import { NeuButton } from "./neu";
import { useLang } from "@/lib/i18n";
import { recordSkill, skillTier, type SkillTier } from "@/lib/premium-store";
import type { Recipe } from "@/lib/recipe-schema";

type Level = "easy" | "medium" | "hard";

/** Heuristic recipe difficulty from step count, time and ingredient spread. */
export function recipeLevel(recipe: Recipe): Level {
  const score =
    recipe.steps.length * 1.2 + recipe.timeMinutes / 12 + recipe.ingredients.length * 0.5;
  if (score >= 22) return "hard";
  if (score >= 13) return "medium";
  return "easy";
}

const TIER_LABEL: Record<SkillTier, { bn: string; en: string }> = {
  beginner: { bn: "শিক্ষানবিশ", en: "Beginner" },
  confident: { bn: "আত্মবিশ্বাসী", en: "Confident" },
  advanced: { bn: "দক্ষ", en: "Advanced" },
};

/** 12. Adaptive difficulty badge — shows recipe level + the learned skill tier. */
export function DifficultyBadge({ recipe }: { recipe: Recipe }) {
  const { t, lang } = useLang();
  const [tier, setTier] = useState<SkillTier | null>(null);
  const [logged, setLogged] = useState(false);
  const level = recipeLevel(recipe);

  useEffect(() => {
    setTier(skillTier());
  }, []);

  const label = level === "easy" ? t("easyLevel") : level === "medium" ? t("mediumLevel") : t("hardLevel");
  const tone =
    level === "easy" ? "text-emerald-600" : level === "medium" ? "text-amber-600" : "text-destructive";

  const rate = (outcome: "easy" | "ok" | "hard") => {
    setTier(skillTier(recordSkill(level, outcome)));
    setLogged(true);
  };

  return (
    <div className="w-full">
      <div className={`neu-inset flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${tone}`}>
        <Gauge className="h-3.5 w-3.5" />
        <span className="font-semibold">
          {t("difficulty")}: {label}
        </span>
        {tier && (
          <span className="ml-auto text-[11px] text-muted-foreground">
            {lang === "bn" ? TIER_LABEL[tier].bn : TIER_LABEL[tier].en}
          </span>
        )}
      </div>

      {!logged ? (
        <div className="mt-2">
          <p className="mb-1.5 text-[11px] text-muted-foreground">{t("howWasIt")}</p>
          <div className="flex flex-wrap gap-2">
            <NeuButton size="sm" onClick={() => rate("easy")}>
              {t("tooEasy")}
            </NeuButton>
            <NeuButton size="sm" onClick={() => rate("ok")}>
              {t("justRight")}
            </NeuButton>
            <NeuButton size="sm" onClick={() => rate("hard")}>
              {t("tooHard")}
            </NeuButton>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-[11px] text-accent">{t("saved")}</p>
      )}
    </div>
  );
}
