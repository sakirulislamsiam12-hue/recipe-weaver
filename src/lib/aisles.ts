/**
 * Store-aisle navigation: maps missing items to a walking order through a
 * typical supermarket / bazaar layout so shoppers cross the store only once.
 */

export type AisleZone = {
  id: string;
  order: number;
  bn: string;
  en: string;
  hintBn: string;
  hintEn: string;
  keys: string[];
};

export const AISLE_ZONES: AisleZone[] = [
  {
    id: "produce",
    order: 1,
    bn: "সবজি ও ফল",
    en: "Produce",
    hintBn: "ঢোকার মুখেই ডান দিকে",
    hintEn: "Right by the entrance",
    keys: ["produce", "vegetable", "veg", "fruit", "greens", "herb", "সবজি", "ফল", "শাক"],
  },
  {
    id: "bakery",
    order: 2,
    bn: "বেকারি",
    en: "Bakery",
    hintBn: "সামনের দিকের তাক",
    hintEn: "Front-of-store shelves",
    keys: ["bakery", "bread", "bun", "রুটি", "পাউরুটি", "বেকারি"],
  },
  {
    id: "grains",
    order: 3,
    bn: "চাল, ডাল ও আটা",
    en: "Rice, lentils & flour",
    hintBn: "মাঝের লম্বা আইল",
    hintEn: "Long middle aisle",
    keys: ["rice", "grain", "lentil", "dal", "flour", "pasta", "চাল", "ডাল", "আটা", "ময়দা"],
  },
  {
    id: "spices",
    order: 4,
    bn: "মসলা ও তেল",
    en: "Spices & oil",
    hintBn: "চাল-ডালের ঠিক পরের আইল",
    hintEn: "Aisle after the grains",
    keys: ["spice", "masala", "oil", "sauce", "condiment", "vinegar", "মসলা", "তেল", "সস"],
  },
  {
    id: "dairy",
    order: 5,
    bn: "দুধ ও ডিম",
    en: "Dairy & eggs",
    hintBn: "পেছনের চিলার",
    hintEn: "Back wall chillers",
    keys: ["dairy", "milk", "yogurt", "curd", "cheese", "butter", "egg", "দুধ", "দই", "ডিম", "মাখন"],
  },
  {
    id: "meat",
    order: 6,
    bn: "মাছ ও মাংস",
    en: "Meat & fish",
    hintBn: "কাউন্টারের পাশে",
    hintEn: "Beside the service counter",
    keys: ["meat", "chicken", "beef", "mutton", "fish", "prawn", "মাছ", "মাংস", "মুরগি", "গরু"],
  },
  {
    id: "frozen",
    order: 7,
    bn: "ফ্রোজেন",
    en: "Frozen",
    hintBn: "শেষ দিকের ফ্রিজার",
    hintEn: "Freezers near the end",
    keys: ["frozen", "ice", "ফ্রোজেন", "হিমায়িত"],
  },
  {
    id: "other",
    order: 8,
    bn: "অন্যান্য",
    en: "Other",
    hintBn: "কর্মীকে জিজ্ঞেস করুন",
    hintEn: "Ask a store assistant",
    keys: [],
  },
];

const FALLBACK = AISLE_ZONES[AISLE_ZONES.length - 1]!;

/** Best-guess zone from the AI-provided aisle label and the item name. */
export function zoneFor(aisle: string, name: string): AisleZone {
  const hay = `${aisle} ${name}`.toLowerCase();
  for (const zone of AISLE_ZONES) {
    if (zone.keys.some((k) => hay.includes(k))) return zone;
  }
  return FALLBACK;
}

export type AisleStop = { zone: AisleZone; items: { name: string; aisle: string }[] };

/** Groups missing items into an ordered walking route. */
export function buildRoute(missing: { name: string; aisle: string }[]): AisleStop[] {
  const map = new Map<string, AisleStop>();
  for (const item of missing) {
    const zone = zoneFor(item.aisle, item.name);
    const stop = map.get(zone.id) ?? { zone, items: [] };
    stop.items.push(item);
    map.set(zone.id, stop);
  }
  return [...map.values()].sort((a, b) => a.zone.order - b.zone.order);
}
