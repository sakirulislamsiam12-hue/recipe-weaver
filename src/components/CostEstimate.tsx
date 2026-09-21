import { useState } from "react";
import { ChevronDown, Wallet } from "lucide-react";

import { NeuCard } from "./neu";
import { useLang } from "@/lib/i18n";
import { estimateCost, formatTaka } from "@/lib/cost";
import type { Recipe } from "@/lib/recipe-schema";

/** 17. Approximate cost per recipe / per serving in BDT. */
export function CostEstimate({
  recipe,
  servings,
  factor = 1,
}: {
  recipe: Recipe;
  servings?: number;
  factor?: number;
}) {
  const { t, bi: lang } = useLang();
  const [open, setOpen] = useState(false);
  const report = estimateCost(recipe.ingredients, servings ?? recipe.servings ?? 2, factor);

  return (
    <NeuCard className="mt-4">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2">
        <Wallet className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-bold">{t("costEstimate")}</h2>
        <span className="ml-auto text-sm font-bold text-accent">
          {formatTaka(report.total, lang)}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <p className="mt-1 text-xs text-muted-foreground">
        {formatTaka(report.perServing, lang)} {t("perServing")} · {t("estimateNote")}
      </p>

      {open && (
        <ul className="pop-in mt-3 flex flex-col gap-2 text-xs">
          {report.lines.map((l) => (
            <li key={`${l.name}-${l.quantity}`} className="flex items-center gap-2">
              <span>{l.name}</span>
              {l.guessed && (
                <span className="text-[10px] text-muted-foreground">
                  {lang === "bn" ? "অনুমান" : "guess"}
                </span>
              )}
              <span className="ml-auto text-muted-foreground">{formatTaka(l.taka, lang)}</span>
            </li>
          ))}
          <li className="mt-1 flex items-center gap-2 border-t border-muted pt-2 font-semibold">
            <span>{t("totalCost")}</span>
            <span className="ml-auto text-accent">{formatTaka(report.total, lang)}</span>
          </li>
        </ul>
      )}
    </NeuCard>
  );
}
