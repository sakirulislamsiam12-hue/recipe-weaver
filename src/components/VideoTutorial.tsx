import { PlayCircle } from "lucide-react";

import { useLang } from "@/lib/i18n";
import { NeuCard } from "./neu";

/**
 * Chef-led video tutorial slot (optional layer). Until a chef video is attached
 * to the recipe, this offers a curated search so the slot is never dead space.
 */
export function VideoTutorial({ title }: { title: string }) {
  const { bi: lang } = useLang();
  const query = encodeURIComponent(`${title} ${lang === "bn" ? "রান্নার রেসিপি" : "recipe tutorial"}`);

  return (
    <NeuCard className="mt-4">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-bold">
        <PlayCircle className="h-4 w-4 text-accent" />
        {lang === "bn" ? "শেফের ভিডিও" : "Chef video"}
      </h2>
      <p className="mb-3 text-xs text-muted-foreground">
        {lang === "bn"
          ? "এই রেসিপির জন্য এখনো শেফ ভিডিও যোগ হয়নি — ততক্ষণে ভিডিও টিউটোরিয়াল দেখে নিন"
          : "No chef video attached yet — watch a tutorial in the meantime"}
      </p>
      <a
        href={`https://www.youtube.com/results?search_query=${query}`}
        target="_blank"
        rel="noreferrer"
        className="neu-raised neu-press flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold"
      >
        <PlayCircle className="h-4 w-4 text-accent" />
        {lang === "bn" ? "ভিডিও দেখুন" : "Watch a tutorial"}
      </a>
    </NeuCard>
  );
}
