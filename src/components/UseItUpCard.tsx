import { useEffect, useState } from "react";
import { Bell, BellRing, Leaf, Plus } from "lucide-react";

import { NeuButton, NeuCard } from "./neu";
import { useLang } from "@/lib/i18n";
import { haptic } from "@/lib/haptics";
import {
  bucketByExpiry,
  daysLeft,
  notifyExpiring,
  requestExpiryPermission,
  type PantryItem,
} from "@/lib/pantry-store";
import { recordActivity } from "@/lib/premium-store";

/**
 * 4. "Use It Up" leftover reminders.
 *
 * Additive: reads the existing pantry buckets and surfaces the items closest
 * to spoiling, with one tap to drop them into the ingredient list and an
 * opt-in browser reminder.
 */
export function UseItUpCard({
  items,
  onUse,
}: {
  items: PantryItem[];
  onUse: (name: string) => void;
}) {
  const { t, bi: lang } = useLang();
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    if (typeof Notification !== "undefined") setGranted(Notification.permission === "granted");
  }, []);

  const buckets = bucketByExpiry(items);
  const urgent = [...buckets.expired, ...buckets.today, ...buckets.soon].slice(0, 8);
  if (urgent.length === 0) return null;

  const enable = async () => {
    const ok = await requestExpiryPermission();
    setGranted(Boolean(ok));
    if (ok) {
      notifyExpiring(items, lang);
      haptic("success");
    }
  };

  const label = (item: PantryItem) => {
    const left = daysLeft(item.expiresOn);
    if (left === null) return "";
    if (left < 0) return lang === "bn" ? "মেয়াদ শেষ" : "expired";
    if (left === 0) return lang === "bn" ? "আজই" : "today";
    return lang === "bn" ? `${left} দিন` : `${left}d`;
  };

  return (
    <NeuCard className="mt-6">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-bold">
        <Leaf className="h-4 w-4 text-accent" /> {t("useItUp")}
      </h2>
      <p className="mb-3 text-xs text-muted-foreground">{t("useItUpHint")}</p>

      <ul className="flex flex-col gap-2">
        {urgent.map((item) => (
          <li key={item.id} className="flex items-center gap-2">
            <span className="flex-1 text-sm">
              {item.name}
              <span className="ml-2 text-[11px] text-muted-foreground">{label(item)}</span>
            </span>
            <button
              onClick={() => {
                onUse(item.name);
                recordActivity("wasteSaved");
                haptic("tap");
              }}
              aria-label={`use ${item.name}`}
              className="neu-raised neu-press flex h-8 w-8 items-center justify-center rounded-xl text-accent"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>

      <NeuButton size="sm" className="mt-4" onClick={enable} disabled={granted}>
        {granted ? <BellRing className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
        {granted ? t("reminderOn") : t("remindMe")}
      </NeuButton>
    </NeuCard>
  );
}
