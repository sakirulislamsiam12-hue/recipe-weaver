/**
 * Food-waste partner integration hooks.
 *
 * Each partner exposes a `buildUrl` hook so a surplus/expiring basket can be
 * handed off to a rescue, donation or discount-grocery service. Real API keys
 * are never needed here: the handoff is a signed-out deep link, and any future
 * server-side partner API would live behind a server function with its key kept
 * as a backend secret.
 */

export type SurplusItem = { name: string; quantity?: string; expiresOn?: string };

export type WastePartner = {
  id: string;
  bn: string;
  en: string;
  kindBn: string;
  kindEn: string;
  regions: string[];
  buildUrl: (items: SurplusItem[]) => string;
};

function list(items: SurplusItem[]) {
  return items.map((i) => (i.quantity ? `${i.name} (${i.quantity})` : i.name)).join(", ");
}

export const WASTE_PARTNERS: WastePartner[] = [
  {
    id: "bidyanondo",
    bn: "বিদ্যানন্দ ফাউন্ডেশন",
    en: "Bidyanondo Foundation",
    kindBn: "খাবার দান",
    kindEn: "Food donation",
    regions: ["BD"],
    buildUrl: (items) =>
      `https://bidyanondo.org/?utm_source=smart-pantry&donate=${encodeURIComponent(list(items))}`,
  },
  {
    id: "shohay",
    bn: "স্থানীয় খাদ্য ব্যাংক",
    en: "Local food bank",
    kindBn: "উদ্বৃত্ত সংগ্রহ",
    kindEn: "Surplus pickup",
    regions: ["BD", "IN", "*"],
    buildUrl: (items) =>
      `https://www.google.com/maps/search/${encodeURIComponent("food bank near me")}#pantry=${encodeURIComponent(list(items))}`,
  },
  {
    id: "toogoodtogo",
    bn: "Too Good To Go",
    en: "Too Good To Go",
    kindBn: "ছাড়ে উদ্বৃত্ত খাবার",
    kindEn: "Discount surplus food",
    regions: ["*"],
    buildUrl: () => "https://www.toogoodtogo.com/",
  },
  {
    id: "olio",
    bn: "OLIO",
    en: "OLIO",
    kindBn: "প্রতিবেশীর সাথে শেয়ার",
    kindEn: "Share with neighbours",
    regions: ["*"],
    buildUrl: (items) =>
      `https://olioapp.com/en/?utm_source=smart-pantry&share=${encodeURIComponent(list(items))}`,
  },
];

export function partnersForRegion(country?: string) {
  const code = (country ?? "").slice(0, 2).toUpperCase();
  return WASTE_PARTNERS.filter((p) => p.regions.includes("*") || p.regions.includes(code));
}
