import { useState } from "react";
import { Check, CookingPot } from "lucide-react";

import { NeuButton } from "../neu";
import { useLang } from "@/lib/i18n";
import { celebrateCooked } from "./celebrate";

/** 9. "I cooked this" — confetti + checkmark burst overlay. */
export function CookedButton({ onCooked }: { onCooked?: () => void }) {
  const { lang } = useLang();
  const [cooked, setCooked] = useState(false);

  const mark = () => {
    if (cooked) return;
    setCooked(true);
    celebrateCooked();
    onCooked?.();
  };

  return (
    <div className="relative mt-4">
      <NeuButton variant={cooked ? "default" : "accent"} size="lg" onClick={mark}>
        {cooked ? <Check className="h-4 w-4" /> : <CookingPot className="h-4 w-4" />}
        {cooked
          ? lang === "bn"
            ? "রান্না সম্পন্ন!"
            : "Cooked — nice work!"
          : lang === "bn"
            ? "রান্না করেছি"
            : "I cooked this"}
      </NeuButton>

      {cooked && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="check-ring absolute h-16 w-16 rounded-full border-2 border-accent" />
          <span className="check-burst neu-raised flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Check className="h-6 w-6" />
          </span>
        </div>
      )}
    </div>
  );
}
