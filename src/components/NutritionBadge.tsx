import { useState } from "react";
import { Activity, ChevronDown } from "lucide-react";

import { useLang } from "@/lib/i18n";
import { lightClass, lightDot, scoreNutrition } from "@/lib/nutrition";
import type { Recipe } from "@/lib/recipe-schema";

/** 7. Traffic-light nutrition badge (tap to expand per-nutrient detail). */
export function NutritionBadge({ recipe }: { recipe: Recipe }) {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const report = scoreNutrition(recipe);

  return (
    <div className="w-full">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`neu-inset flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs ${lightClass(report.overall)}`}
      >
        <Activity className="h-3.5 w-3.5" />
        <span className="font-semibold">{t("nutritionScore")}</span>
        <span className={`h-2 w-2 rounded-full ${lightDot(report.overall)}`} />
        <ChevronDown
          className={`ml-auto h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="neu-raised pop-in mt-2 rounded-lg p-3">
          <ul className="flex flex-col gap-2 text-xs">
            {report.rows.map((r) => (
              <li key={r.id} className="flex items-center gap-2">
                <span className={`h-2 w-2 shrink-0 rounded-full ${lightDot(r.light)}`} />
                <span>{lang === "bn" ? r.bn : r.en}</span>
                <span className="ml-auto text-muted-foreground">
                  {r.value} {r.unit}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            {lang === "bn" ? report.noteBn : report.noteEn} · {t("estimateNote")}
          </p>
        </div>
      )}
    </div>
  );
}
