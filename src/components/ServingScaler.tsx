import { Minus, Plus, Users } from "lucide-react";

import { SERVING_STEPS } from "@/lib/scale";
import { useLang } from "@/lib/i18n";
import { haptic } from "@/lib/haptics";

/** Serving scaler: 1 → 2 → 4 → 6 → 8 → 12, quantities recalculated by the caller. */
export function ServingScaler({
  servings,
  onChange,
}: {
  servings: number;
  onChange: (n: number) => void;
}) {
  const { bi: lang } = useLang();
  const step = (dir: -1 | 1) => {
    const idx = SERVING_STEPS.indexOf(servings as (typeof SERVING_STEPS)[number]);
    const list = [...SERVING_STEPS];
    const current = idx >= 0 ? idx : list.findIndex((s) => s >= servings);
    const next = list[Math.min(list.length - 1, Math.max(0, current + dir))];
    if (next && next !== servings) {
      haptic("select");
      onChange(next);
    }
  };

  return (
    <div className="neu-inset flex items-center justify-between rounded-lg px-3 py-2">
      <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <Users className="h-3.5 w-3.5 text-accent" />
        {lang === "bn" ? "কতজনের জন্য" : "Servings"}
      </span>
      <span className="flex items-center gap-2">
        <button
          onClick={() => step(-1)}
          aria-label={lang === "bn" ? "কমান" : "Fewer servings"}
          className="neu-raised neu-press flex h-8 w-8 items-center justify-center rounded-xl"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span key={servings} className="pop-in w-8 text-center text-sm font-bold text-accent">
          {servings}
        </span>
        <button
          onClick={() => step(1)}
          aria-label={lang === "bn" ? "বাড়ান" : "More servings"}
          className="neu-raised neu-press flex h-8 w-8 items-center justify-center rounded-xl"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </span>
    </div>
  );
}
