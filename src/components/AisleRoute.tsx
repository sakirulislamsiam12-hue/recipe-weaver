import { Footprints, MapPin } from "lucide-react";

import { buildRoute } from "@/lib/aisles";
import { useLang } from "@/lib/i18n";
import { NeuCard } from "./neu";

/** Store aisle navigation for the missing items of a recipe. */
export function AisleRoute({ missing }: { missing: { name: string; aisle: string }[] }) {
  const { bi: lang } = useLang();
  if (missing.length === 0) return null;
  const stops = buildRoute(missing);

  return (
    <NeuCard className="mt-4">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-bold">
        <Footprints className="h-4 w-4 text-accent" />
        {lang === "bn" ? "দোকানে হাঁটার রুট" : "Store walking route"}
      </h2>
      <p className="mb-3 text-xs text-muted-foreground">
        {lang === "bn"
          ? "এই ক্রমে গেলে একবারেই সব কেনা হয়ে যাবে"
          : "Follow this order to cross the store only once"}
      </p>
      <ol className="flex flex-col gap-3 text-sm">
        {stops.map((stop, i) => (
          <li key={stop.zone.id} className="flex gap-3">
            <span className="neu-raised flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-accent">
              {i + 1}
            </span>
            <div>
              <p className="font-semibold">{lang === "bn" ? stop.zone.bn : stop.zone.en}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {lang === "bn" ? stop.zone.hintBn : stop.zone.hintEn}
              </p>
              <p className="mt-1 text-xs">{stop.items.map((it) => it.name).join(", ")}</p>
            </div>
          </li>
        ))}
      </ol>
    </NeuCard>
  );
}
