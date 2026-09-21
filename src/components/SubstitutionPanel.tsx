import { Replace } from "lucide-react";

import { NeuCard } from "./neu";
import { useLang } from "@/lib/i18n";
import { canonical, isAssumedStaple } from "@/lib/matching";
import { lookupIngredient, substitutesFor } from "@/lib/pantry-data";
import type { Recipe } from "@/lib/recipe-schema";

function why(target: string, sub: string, confidence: number, lang: "bn" | "en") {
  if (lang === "bn") {
    if (confidence >= 0.85) return `${sub} প্রায় একই স্বাদ ও গঠন দেয়।`;
    if (confidence >= 0.65) return `${sub} কাছাকাছি কাজ করে, স্বাদ একটু বদলাবে।`;
    return `${sub} দিয়ে চলবে, তবে ${target}-এর স্বাদ পুরো মিলবে না।`;
  }
  if (confidence >= 0.85) return `${sub} behaves almost identically in taste and texture.`;
  if (confidence >= 0.65) return `${sub} works closely; expect a slight flavour shift.`;
  return `${sub} will do, but it won't fully match ${target}.`;
}

/** 14. Ingredient substitution panel with confidence % and a plain "why". */
export function SubstitutionPanel({ recipe, pantry = [] }: { recipe: Recipe; pantry?: string[] }) {
  const { t, bi: lang } = useLang();
  const have = new Set(pantry.map(canonical));

  const rows = recipe.ingredients
    .filter((i) => !have.has(canonical(i.name)) && !isAssumedStaple(i.name))
    .map((i) => {
      const subs = substitutesFor(i.name)
        .map((s) => {
          const item = lookupIngredient(s.name);
          return {
            name: item ? (lang === "bn" ? item.bn : item.en) : s.name,
            confidence: s.confidence,
            inPantry: have.has(canonical(s.name)),
          };
        })
        .sort((a, b) => Number(b.inPantry) - Number(a.inPantry) || b.confidence - a.confidence)
        .slice(0, 3);
      return { name: i.name, subs };
    })
    .filter((r) => r.subs.length > 0)
    .slice(0, 6);

  if (rows.length === 0) return null;

  return (
    <NeuCard className="mt-4">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
        <Replace className="h-4 w-4 text-accent" /> {t("substitutions")}
      </h2>
      <ul className="flex flex-col gap-4">
        {rows.map((r) => (
          <li key={r.name}>
            <p className="text-sm font-semibold">{r.name}</p>
            <ul className="mt-2 flex flex-col gap-2">
              {r.subs.map((s) => (
                <li key={s.name} className="neu-inset rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium">{s.name}</span>
                    {s.inPantry && (
                      <span className="text-[10px] text-accent">
                        {lang === "bn" ? "ঘরেই আছে" : "in pantry"}
                      </span>
                    )}
                    <span className="ml-auto text-accent">
                      {Math.round(s.confidence * 100)}% {t("confidence")}
                    </span>
                  </div>
                  <div className="neu-inset mt-2 h-1.5 overflow-hidden rounded-full">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${Math.round(s.confidence * 100)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                    {t("whyWorks")}: {why(r.name, s.name, s.confidence, lang)}
                  </p>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </NeuCard>
  );
}
