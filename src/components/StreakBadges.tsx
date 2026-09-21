import { useEffect, useState } from "react";
import { Flame, Trophy } from "lucide-react";

import { NeuCard } from "./neu";
import { useLang } from "@/lib/i18n";
import {
  badgesFor,
  currentStreak,
  loadStreak,
  longestStreak,
  type Streak,
} from "@/lib/premium-store";

/** 8. Cooking streaks + achievement badges. */
export function StreakBadges() {
  const { t, lang } = useLang();
  const [streak, setStreak] = useState<Streak | null>(null);

  useEffect(() => {
    setStreak(loadStreak());
  }, []);

  if (!streak) return null;

  const days = currentStreak(streak.days);
  const best = longestStreak(streak.days);
  const badges = badgesFor(streak);
  const earned = badges.filter((b) => b.earned).length;

  return (
    <NeuCard className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <Flame className="h-4 w-4 text-accent" /> {t("streaks")}
        </h2>
        <span className="text-[11px] text-muted-foreground">
          {t("bestStreak")}: {best}
        </span>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-accent">{days}</span>
        <span className="text-xs text-muted-foreground">{t("streakDays")}</span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-xs font-bold">
          <Trophy className="h-3.5 w-3.5 text-accent" /> {t("badges")}
        </h3>
        <span className="text-[11px] text-muted-foreground">
          {earned}/{badges.length}
        </span>
      </div>

      <ul className="mt-3 grid grid-cols-2 gap-2">
        {badges.map((b) => (
          <li
            key={b.id}
            className={`rounded-lg px-3 py-2.5 ${
              b.earned ? "neu-inset text-accent" : "neu-raised text-muted-foreground"
            }`}
          >
            <span className="block text-xs font-semibold leading-snug">
              {lang === "bn" ? b.bn : b.en}
            </span>
            <span className="mt-0.5 block text-[10px] leading-snug">
              {lang === "bn" ? b.descBn : b.descEn}
            </span>
            <span className="mt-1 block text-[10px] font-medium">
              {b.progress}/{b.target}
            </span>
          </li>
        ))}
      </ul>
    </NeuCard>
  );
}
