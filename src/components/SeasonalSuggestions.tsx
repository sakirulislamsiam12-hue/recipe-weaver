import { Leaf, Plus } from "lucide-react";

import { NeuCard } from "./neu";
import { useLang } from "@/lib/i18n";
import { monthName, seasonalPicks } from "@/lib/seasonal";

/** 16. Month-indexed seasonal produce for Bengal. */
export function SeasonalSuggestions({
  country,
  onAdd,
}: {
  country?: string;
  onAdd?: (name: string) => void;
}) {
  const { t, bi: lang } = useLang();
  const month = new Date().getMonth();
  const picks = seasonalPicks(month, country);

  return (
    <NeuCard className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <Leaf className="h-4 w-4 text-accent" /> {t("seasonal")}
        </h2>
        <span className="text-[11px] text-muted-foreground">{monthName(lang, month)}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{t("seasonalHint")}</p>

      <ul className="mt-3 flex flex-col gap-2">
        {picks.map((p) => {
          const name = lang === "bn" ? p.bn : p.en;
          return (
            <li key={p.en} className="neu-inset flex items-center gap-3 rounded-lg px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{name}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {lang === "bn" ? p.noteBn : p.noteEn}
                </p>
              </div>
              {onAdd && (
                <button
                  onClick={() => onAdd(name)}
                  aria-label={`add ${name}`}
                  className="neu-raised neu-press ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-accent"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </NeuCard>
  );
}
