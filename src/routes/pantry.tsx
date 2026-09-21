import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ChevronRight,
  HandHeart,
  ShoppingBasket,
  Trash2,
} from "lucide-react";

import { BottomSheet } from "@/components/BottomSheet";
import { PurchaseTracker } from "@/components/PurchaseTracker";
import { NeuButton, NeuCard } from "@/components/neu";
import { SwipeToDismiss } from "@/components/polish/SwipeToDismiss";
import { ExpiryPanel } from "@/components/ExpiryPanel";
import { GroceryListPanel } from "@/components/GroceryListPanel";
import { WastePartnerCard } from "@/components/WastePartnerCard";
import { NearbyMarketFinder } from "@/components/NearbyMarketFinder";

import { bucketByExpiry, daysLeft } from "@/lib/pantry-store";
import { useLang } from "@/lib/i18n";
import { useApp } from "@/lib/app-state";
import { haptic } from "@/lib/haptics";
import { formatTaka, getMonthlyCost } from "@/lib/cost-summary";
import { syncPurchasesFromCloud, usePantryPurchases } from "@/lib/pantry-purchases";

export const Route = createFileRoute("/pantry")({
  head: () => ({
    meta: [
      { title: "Smart Pantry — Track groceries, spending and sharing" },
      {
        name: "description",
        content:
          "Track what is in your kitchen, monitor grocery spending, find nearby markets, and share surplus food with your community.",
      },
      { property: "og:title", content: "Smart Pantry — Track groceries, spending and sharing" },
      {
        property: "og:description",
        content: "Grocery tracking, quick restocking and community food sharing in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PantrySection,
});

type Sheet = "grocery" | "donate" | null;

function PantrySection() {
  const { bi: lang } = useLang();
  const { pantry, removePantryItem, add, recipes, prefs, session } = useApp();
  const [sheet, setSheet] = useState<Sheet>(null);
  const { purchases } = usePantryPurchases();
  const monthlyCost = getMonthlyCost(purchases, session?.id ?? "guest");

  useEffect(() => {
    if (session?.id) void syncPurchasesFromCloud(session.id);
  }, [session?.id]);

  const buckets = bucketByExpiry(pantry);
  const surplus = [...buckets.expired, ...buckets.today, ...buckets.soon].map((i) => ({
    name: i.name,
    ...(i.quantity ? { quantity: i.quantity } : {}),
    ...(i.expiresOn ? { expiresOn: i.expiresOn } : {}),
  }));

  const open = (next: Exclude<Sheet, null>) => {
    haptic("select");
    setSheet(next);
  };

  const restockItems = surplus.map((s) => s.name).slice(0, 5);

  const expiryLabel = (expiresOn?: string) => {
    const left = daysLeft(expiresOn);
    if (left === null) return lang === "bn" ? "তারিখ নেই" : "No date";
    if (left < 0) return lang === "bn" ? "মেয়াদ শেষ" : "Expired";
    if (left === 0) return lang === "bn" ? "আজই শেষ" : "Today";
    return lang === "bn" ? `${left} দিন বাকি` : `${left}d left`;
  };

  const actions: {
    key: Exclude<Sheet, null>;
    icon: typeof ShoppingBasket;
    title: string;
    meta: string;
  }[] = [
    {
      key: "grocery",
      icon: ShoppingBasket,
      title: lang === "bn" ? "গ্রোসারি ট্র্যাকার" : "Grocery Tracker",
      meta: lang === "bn" ? `${pantry.length} টি আইটেম` : `${pantry.length} items`,
    },
    {
      key: "donate",
      icon: HandHeart,
      title: lang === "bn" ? "খাবার শেয়ার / দান" : "Share or donate food",
      meta: lang === "bn" ? `${surplus.length} টি` : `${surplus.length} items`,
    },
  ];

  return (
    <>
      <h1 className="text-xl font-semibold">
        {lang === "bn" ? "স্মার্ট প্যান্ট্রি" : "Smart Pantry"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {lang === "bn"
          ? "বাঁ দিকে সোয়াইপ করে আইটেম মুছুন"
          : "Swipe an item left to delete it"}
      </p>

      {/* Simple pantry list */}
      <div className="mt-6 divide-y divide-border border-y border-border">
        {pantry.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {lang === "bn" ? "প্যান্ট্রি খালি" : "Your pantry is empty"}
          </p>
        )}
        {pantry.map((item) => (
          <SwipeToDismiss key={item.id} onDismiss={() => removePantryItem(item.id)}>
            <div className="flex items-center justify-between gap-4 bg-background py-3">
              <div className="min-w-0">
                <p className="truncate text-sm">{item.name}</p>
                {item.quantity && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.quantity}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {expiryLabel(item.expiresOn)}
                </span>
                <button
                  onClick={() => removePantryItem(item.id)}
                  aria-label={`delete ${item.name}`}
                  className="text-muted-foreground active:opacity-70"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </SwipeToDismiss>
        ))}
      </div>

      <PurchaseTracker />

      <NearbyMarketFinder ingredients={restockItems} className="mt-6 w-full py-3" />



      {/* Simple action list */}
      <div className="mt-8 divide-y divide-border border-y border-border">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.key}
              onClick={() => open(a.key)}
              className="flex w-full items-center gap-4 py-4 text-left active:opacity-80"
            >
              <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-sm">{a.title}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{a.meta}</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          );
        })}
      </div>

      {/* (A) Grocery tracker + spending */}
      <BottomSheet
        open={sheet === "grocery"}
        onClose={() => setSheet(null)}
        title={lang === "bn" ? "গ্রোসারি ট্র্যাকার" : "Grocery Tracker"}
      >
        <NeuCard className="mb-4">
          <p className="text-sm font-medium">
            {lang === "bn" ? "এই মাসের খরচ" : "Spending this month"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {lang === "bn" ? "গত ৩০ দিনের কেনাকাটা" : "Purchases in the last 30 days"}
          </p>
          <p className="mt-4 text-lg font-semibold">{formatTaka(monthlyCost)}</p>
        </NeuCard>

        <ExpiryPanel items={pantry} onRemove={removePantryItem} onUse={(name) => add(name)} />
        <GroceryListPanel recipes={recipes} />
      </BottomSheet>

      {/* Food donation / sharing */}
      <BottomSheet
        open={sheet === "donate"}
        onClose={() => setSheet(null)}
        title={lang === "bn" ? "খাবার শেয়ার / দান" : "Share or donate food"}
      >
        <WastePartnerCard items={surplus} {...(prefs.country ? { country: prefs.country } : {})} />
        <NeuButton size="lg" className="mt-4" onClick={() => setSheet(null)}>
          {lang === "bn" ? "বন্ধ করুন" : "Close"}
        </NeuButton>
      </BottomSheet>
    </>
  );
}
