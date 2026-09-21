import { useEffect, useState } from "react";
import { Minus, Plus, Users } from "lucide-react";

import { NeuButton, NeuCard } from "./neu";
import { useLang } from "@/lib/i18n";
import { haptic } from "@/lib/haptics";
import {
  householdServings,
  loadHousehold,
  saveHousehold,
  type Household,
} from "@/lib/premium-store";

/**
 * 5. Household-synced portion calculator.
 *
 * Additive: reads the shared household from premium-store and tells the recipe
 * detail how many servings to scale to.
 */
export function HouseholdPortionSync({ onApply }: { onApply: (servings: number) => void }) {
  const { t, lang } = useLang();
  const [house, setHouse] = useState<Household>({ name: "", members: [], sharedPantry: true });

  useEffect(() => {
    setHouse(loadHousehold());
  }, []);

  const adults = house.members.filter((m) => m.ageGroup === "adult").length;
  const children = house.members.filter((m) => m.ageGroup === "child").length;

  const setCount = (group: "adult" | "child", delta: number) => {
    const current = house.members.filter((m) => m.ageGroup === group);
    const others = house.members.filter((m) => m.ageGroup !== group);
    let members = [...current];
    if (delta > 0) {
      members.push({
        id: `${group}-${Date.now().toString(36)}-${members.length}`,
        name: group === "adult" ? (lang === "bn" ? "বড়" : "Adult") : lang === "bn" ? "ছোট" : "Child",
        appetite: "regular",
        ageGroup: group,
        avoids: [],
      });
    } else {
      members = members.slice(0, -1);
    }
    const next: Household = { ...house, members: [...others, ...members] };
    setHouse(next);
    saveHousehold(next);
    haptic("tap");
  };

  const servings = householdServings(house);

  return (
    <NeuCard className="mt-4">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-bold">
        <Users className="h-4 w-4 text-accent" /> {t("portions")}
      </h2>
      <p className="mb-4 text-xs text-muted-foreground">{t("portionsHint")}</p>

      {(
        [
          ["adult", lang === "bn" ? "বড়রা" : "Adults", adults],
          ["child", lang === "bn" ? "শিশু" : "Children", children],
        ] as const
      ).map(([group, label, count]) => (
        <div key={group} className="mb-3 flex items-center justify-between">
          <span className="text-sm">{label}</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => count > 0 && setCount(group, -1)}
              aria-label={`less ${group}`}
              className="neu-raised neu-press flex h-8 w-8 items-center justify-center rounded-xl"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-6 text-center text-sm font-bold">{count}</span>
            <button
              onClick={() => setCount(group, 1)}
              aria-label={`more ${group}`}
              className="neu-raised neu-press flex h-8 w-8 items-center justify-center rounded-xl text-accent"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}

      <NeuButton
        variant="accent"
        size="sm"
        className="mt-2 w-full"
        disabled={servings === 0}
        onClick={() => onApply(Math.max(1, Math.round(servings)))}
      >
        {t("applyPortions")} · {servings || 0}
      </NeuButton>
    </NeuCard>
  );
}
