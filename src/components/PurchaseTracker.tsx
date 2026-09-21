import { useEffect, useState } from "react";
import { Archive, Plus, Refrigerator, Snowflake, Thermometer, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AddPantryItemSheet } from "@/components/AddPantryItemSheet";
import { NeuCard } from "@/components/neu";
import { SwipeToDismiss } from "@/components/polish/SwipeToDismiss";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptics";
import { useLang } from "@/lib/i18n";
import { useApp } from "@/lib/app-state";
import { formatTaka, getPantrySummary } from "@/lib/cost-summary";
import { STORAGE_LABELS, type StorageType } from "@/lib/expiry-db";
import {
  daysUntil,
  expiryTone,
  usePantryPurchases,
  type NewPurchase,
} from "@/lib/pantry-purchases";
import { runDailyExpiryCheck } from "@/lib/notifications";

const STORAGE_ICONS: Record<StorageType, typeof Snowflake> = {
  freezer: Snowflake,
  refrigerator: Refrigerator,
  shelf: Archive,
  room_temp: Thermometer,
};

const TONE_CLASS = {
  safe: "text-[oklch(0.55_0.15_150)]",
  warn: "text-[oklch(0.65_0.15_85)]",
  danger: "text-destructive",
} as const;

/** Purchase tracking: spending summary, add form and the purchase list. */
export function PurchaseTracker() {
  const { bi: lang } = useLang();
  const bn = lang === "bn";
  const { session } = useApp();
  const userId = session?.id ?? "guest";
  const { purchases, addPurchase, removePurchase } = usePantryPurchases();
  const [open, setOpen] = useState(false);

  const mine = purchases.filter((p) => p.user_id === userId);
  const summary = getPantrySummary(purchases, userId);

  // Daily expiry check (runs once per item per day).
  useEffect(() => {
    if (mine.length === 0) return;
    runDailyExpiryCheck(mine, lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mine.length]);

  const submit = (p: NewPurchase) => {
    const row = addPurchase({ ...p, user_id: userId });
    haptic("success");
    toast.success(bn ? `${row.item_name} সংযুক্ত হয়েছে` : `${row.item_name} added`);
  };

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold">
          {bn ? "কেনাকাটা ট্র্যাকার" : "Purchase tracker"}
        </h2>
        <button
          onClick={() => {
            haptic("tap");
            setOpen(true);
          }}
          className="flex min-h-[44px] items-center gap-1 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground active:opacity-80"
        >
          <Plus className="h-4 w-4" />
          {bn ? "যোগ করুন" : "Add"}
        </button>
      </div>

      <NeuCard className="mt-4">
        <p className="text-sm font-semibold">
          {bn ? "এই মাস খরচ: " : "This month: "}
          {formatTaka(summary.monthlyCost)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {bn
            ? `নষ্ট হওয়ার ঝুঁকি: ${summary.atRiskCount} আইটেম`
            : `At spoilage risk: ${summary.atRiskCount} items`}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {bn ? "সবচেয়ে দ্রুত নষ্ট: " : "Spoils soonest: "}
          {summary.soonest?.item_name ?? (bn ? "—" : "—")}
        </p>
      </NeuCard>

      <div className="mt-4 divide-y divide-border border-y border-border">
        {mine.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {bn ? "এখনো কোনো কেনাকাটা যোগ করা হয়নি" : "No purchases yet"}
          </p>
        )}
        {mine.map((p) => {
          const left = daysUntil(p.expected_expiry_date);
          const tone = expiryTone(left);
          const Icon = STORAGE_ICONS[p.storage_type];
          return (
            <SwipeToDismiss key={p.id} onDismiss={() => removePurchase(p.id)}>
              <div className="flex items-center justify-between gap-3 bg-background py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {p.item_name} · {p.quantity} {p.unit}
                  </p>
                  <p className={cn("mt-0.5 text-xs", TONE_CLASS[tone])}>
                    {bn
                      ? left < 0
                        ? "এক্সপায়ারি: মেয়াদ শেষ"
                        : `এক্সপায়ারি: ${left} দিন বাকি`
                      : left < 0
                        ? "Expired"
                        : `${left} days left`}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {bn ? STORAGE_LABELS[p.storage_type].bn : STORAGE_LABELS[p.storage_type].en}
                    </span>
                    <span>· {formatTaka(p.purchase_price)}</span>
                  </p>
                </div>
                <button
                  onClick={() => removePurchase(p.id)}
                  aria-label={`delete ${p.item_name}`}
                  className="flex h-11 w-11 shrink-0 items-center justify-center text-muted-foreground active:opacity-70"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </SwipeToDismiss>
          );
        })}
      </div>

      <AddPantryItemSheet open={open} onClose={() => setOpen(false)} onSubmit={submit} />
    </section>
  );
}
