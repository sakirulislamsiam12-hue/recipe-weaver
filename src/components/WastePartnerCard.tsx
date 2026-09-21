import { ExternalLink, HeartHandshake } from "lucide-react";

import { NeuCard } from "./neu";
import { partnersForRegion, type SurplusItem } from "@/lib/partners";
import { useLang } from "@/lib/i18n";
import { haptic } from "@/lib/haptics";

/** Food-waste partner handoff: donate / share / discount-sell surplus items. */
export function WastePartnerCard({
  items,
  country,
}: {
  items: SurplusItem[];
  country?: string;
}) {
  const { bi: lang } = useLang();
  if (items.length === 0) return null;
  const partners = partnersForRegion(country);

  return (
    <NeuCard className="mt-4">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-bold">
        <HeartHandshake className="h-4 w-4 text-accent" />
        {lang === "bn" ? "নষ্ট হওয়ার আগে দিয়ে দিন" : "Pass it on before it spoils"}
      </h2>
      <p className="mb-3 text-xs text-muted-foreground">
        {lang === "bn"
          ? `${items.length}টি আইটেম দান বা শেয়ার করার জন্য প্রস্তুত`
          : `${items.length} item(s) ready to donate or share`}
      </p>
      <div className="flex flex-col gap-2">
        {partners.map((p) => (
          <a
            key={p.id}
            href={p.buildUrl(items)}
            target="_blank"
            rel="noreferrer"
            onClick={() => haptic("select")}
            className="neu-raised neu-press flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm"
          >
            <span>
              <span className="font-semibold">{lang === "bn" ? p.bn : p.en}</span>
              <span className="block text-xs text-muted-foreground">
                {lang === "bn" ? p.kindBn : p.kindEn}
              </span>
            </span>
            <ExternalLink className="h-4 w-4 text-accent" />
          </a>
        ))}
      </div>
    </NeuCard>
  );
}
