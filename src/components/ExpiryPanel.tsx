import { AlertTriangle, Bell, CalendarClock, Trash2 } from "lucide-react";

import { NeuButton, NeuCard } from "./neu";
import {
  daysLeft,
  bucketByExpiry,
  requestExpiryPermission,
  notifyExpiring,
  type PantryItem,
} from "@/lib/pantry-store";
import { useLang } from "@/lib/i18n";
import { haptic } from "@/lib/haptics";

/** Expiry-date tracking panel + push-notification opt-in. */
export function ExpiryPanel({
  items,
  onRemove,
  onUse,
}: {
  items: PantryItem[];
  onRemove: (id: string) => void;
  onUse: (name: string) => void;
}) {
  const { bi: lang } = useLang();
  if (items.length === 0) return null;
  const buckets = bucketByExpiry(items);
  const urgent = [...buckets.expired, ...buckets.today, ...buckets.soon];

  const enable = async () => {
    const state = await requestExpiryPermission();
    haptic(state === "granted" ? "success" : "warn");
    if (state === "granted") notifyExpiring(items, lang);
  };

  const label = (item: PantryItem) => {
    const left = daysLeft(item.expiresOn);
    if (left === null) return lang === "bn" ? "তারিখ নেই" : "No date";
    if (left < 0) return lang === "bn" ? "মেয়াদ শেষ" : "Expired";
    if (left === 0) return lang === "bn" ? "আজই শেষ" : "Today";
    return lang === "bn" ? `${left} দিন বাকি` : `${left}d left`;
  };

  return (
    <NeuCard className="mt-6">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-bold">
        <CalendarClock className="h-4 w-4 text-accent" />
        {lang === "bn" ? "মেয়াদ ট্র্যাকিং" : "Expiry tracking"}
      </h2>
      <p className="mb-3 text-xs text-muted-foreground">
        {lang === "bn"
          ? "আগে যেটার মেয়াদ শেষ হবে, সেটা আগে রান্নায় ব্যবহার করুন"
          : "Cook with whatever runs out first"}
      </p>

      {urgent.length > 0 && (
        <div className="mb-3 flex flex-col gap-2">
          {urgent.map((item) => {
            const left = daysLeft(item.expiresOn);
            const tone =
              left !== null && left < 0
                ? "text-destructive"
                : left !== null && left <= 1
                  ? "text-amber-600"
                  : "text-muted-foreground";
            return (
              <div
                key={item.id}
                className="neu-inset flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm"
              >
                <span className="flex items-center gap-2">
                  <AlertTriangle className={`h-3.5 w-3.5 ${tone}`} />
                  <span className="font-medium">{item.name}</span>
                  {item.quantity && (
                    <span className="text-xs text-muted-foreground">{item.quantity}</span>
                  )}
                </span>
                <span className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${tone}`}>{label(item)}</span>
                  <button
                    onClick={() => onUse(item.name)}
                    className="neu-raised neu-press rounded-xl px-2 py-1 text-[11px] font-semibold text-accent"
                  >
                    {lang === "bn" ? "ব্যবহার" : "Use"}
                  </button>
                  <button
                    onClick={() => onRemove(item.id)}
                    aria-label={`remove ${item.name}`}
                    className="neu-raised neu-press rounded-xl p-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      )}

      <p className="mb-3 text-xs text-muted-foreground">
        {lang === "bn"
          ? `মোট ${items.length}টি আইটেম ট্র্যাক হচ্ছে · ${buckets.later.length}টি এখনো ভালো আছে`
          : `${items.length} items tracked · ${buckets.later.length} still fine`}
      </p>

      <NeuButton size="sm" onClick={enable}>
        <Bell className="h-3.5 w-3.5" />
        {lang === "bn" ? "মেয়াদের নোটিফিকেশন চালু করুন" : "Enable expiry notifications"}
      </NeuButton>
    </NeuCard>
  );
}
