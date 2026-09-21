/**
 * Shelf-life database (days) per storage type.
 *
 * Covers 200+ common Bangla grocery items. Explicit entries win; everything
 * else is derived from the ingredient knowledge base (src/lib/pantry-data.ts)
 * using category rules, so every autocomplete item resolves to a number.
 */

import { INGREDIENTS, lookupIngredient, type Category } from "@/lib/pantry-data";

export type StorageType = "freezer" | "refrigerator" | "shelf" | "room_temp";

export type ShelfLife = Record<StorageType, number>;

export const STORAGE_TYPES: StorageType[] = ["freezer", "refrigerator", "shelf", "room_temp"];

export const STORAGE_LABELS: Record<StorageType, { bn: string; en: string }> = {
  freezer: { bn: "ফ্রিজার", en: "Freezer" },
  refrigerator: { bn: "রেফ্রিজারেটর", en: "Refrigerator" },
  shelf: { bn: "রান্নাঘরের তাক", en: "Kitchen shelf" },
  room_temp: { bn: "সাধারণ তাপমাত্রা", en: "Room temp" },
};

/** Hand-tuned entries for the most common purchases. */
const EXPLICIT: Record<string, ShelfLife> = {
  "আলু": { freezer: 180, refrigerator: 30, shelf: 7, room_temp: 3 },
  "ডিম": { freezer: 365, refrigerator: 21, shelf: 7, room_temp: 1 },
  "মাছ": { freezer: 180, refrigerator: 1, shelf: 0, room_temp: 0 },
  "রুই মাছ": { freezer: 180, refrigerator: 2, shelf: 0, room_temp: 0 },
  "কাতলা মাছ": { freezer: 180, refrigerator: 2, shelf: 0, room_temp: 0 },
  "ইলিশ": { freezer: 180, refrigerator: 2, shelf: 0, room_temp: 0 },
  "তেলাপিয়া": { freezer: 150, refrigerator: 2, shelf: 0, room_temp: 0 },
  "পাঙাশ": { freezer: 150, refrigerator: 2, shelf: 0, room_temp: 0 },
  "চিংড়ি": { freezer: 150, refrigerator: 1, shelf: 0, room_temp: 0 },
  "মুরগি": { freezer: 270, refrigerator: 2, shelf: 0, room_temp: 0 },
  "গরুর মাংস": { freezer: 300, refrigerator: 3, shelf: 0, room_temp: 0 },
  "খাসির মাংস": { freezer: 300, refrigerator: 3, shelf: 0, room_temp: 0 },
  "দুধ": { freezer: 90, refrigerator: 5, shelf: 1, room_temp: 1 },
  "দই": { freezer: 60, refrigerator: 7, shelf: 1, room_temp: 1 },
  "পেঁয়াজ": { freezer: 240, refrigerator: 60, shelf: 30, room_temp: 21 },
  "রসুন": { freezer: 300, refrigerator: 90, shelf: 60, room_temp: 40 },
  "টমেটো": { freezer: 240, refrigerator: 12, shelf: 5, room_temp: 4 },
  "চাল": { freezer: 730, refrigerator: 730, shelf: 365, room_temp: 300 },
  "ভাত": { freezer: 30, refrigerator: 3, shelf: 1, room_temp: 1 },
};

/** Category rules: multiplier applied to the base (refrigerator) shelf life. */
const RULES: Record<Category, { fridge: (base: number) => number; freezer: number; shelf: number; room: number }> = {
  vegetable: { fridge: (b) => b, freezer: 180, shelf: 0.5, room: 0.35 },
  fruit: { fridge: (b) => b, freezer: 180, shelf: 0.6, room: 0.45 },
  protein: { fridge: (b) => Math.max(1, Math.round(b / 2)), freezer: 180, shelf: 0.1, room: 0.05 },
  dairy: { fridge: (b) => b, freezer: 90, shelf: 0.2, room: 0.15 },
  grain: { fridge: (b) => b, freezer: 365, shelf: 0.9, room: 0.8 },
  spice: { fridge: (b) => b, freezer: 720, shelf: 1, room: 0.9 },
  condiment: { fridge: (b) => b, freezer: 400, shelf: 0.9, room: 0.8 },
  herb: { fridge: (b) => b, freezer: 120, shelf: 0.4, room: 0.3 },
  other: { fridge: (b) => b, freezer: 240, shelf: 0.8, room: 0.6 },
};

function derive(category: Category, shelfDays: number | undefined): ShelfLife {
  const rule = RULES[category];
  const base = shelfDays ?? 240; // undefined = shelf stable staple
  const fridge = rule.fridge(base);
  return {
    freezer: Math.max(fridge, rule.freezer),
    refrigerator: Math.max(0, Math.round(fridge)),
    shelf: Math.max(0, Math.round(base * rule.shelf)),
    room_temp: Math.max(0, Math.round(base * rule.room)),
  };
}

/** Extra Bangla grocery staples not present in the ingredient knowledge base. */
const EXTRA: Array<{ bn: string; en: string; category: Category; shelfDays?: number }> = [
  { bn: "কাঁচা মরিচ", en: "Green chilli", category: "vegetable", shelfDays: 10 },
  { bn: "ধনেপাতা", en: "Coriander leaf", category: "herb", shelfDays: 4 },
  { bn: "পুদিনা পাতা", en: "Mint leaf", category: "herb", shelfDays: 5 },
  { bn: "কারিপাতা", en: "Curry leaf", category: "herb", shelfDays: 7 },
  { bn: "তেজপাতা", en: "Bay leaf", category: "spice", shelfDays: 400 },
  { bn: "লালশাক", en: "Red amaranth", category: "vegetable", shelfDays: 3 },
  { bn: "পুঁইশাক", en: "Malabar spinach", category: "vegetable", shelfDays: 3 },
  { bn: "কলমি শাক", en: "Water spinach", category: "vegetable", shelfDays: 3 },
  { bn: "সরিষা শাক", en: "Mustard greens", category: "vegetable", shelfDays: 4 },
  { bn: "ডাঁটা শাক", en: "Stem amaranth", category: "vegetable", shelfDays: 4 },
  { bn: "মূলা শাক", en: "Radish greens", category: "vegetable", shelfDays: 3 },
  { bn: "মেথি শাক", en: "Fenugreek greens", category: "vegetable", shelfDays: 4 },
  { bn: "বাঁধাকপি", en: "Cabbage", category: "vegetable", shelfDays: 14 },
  { bn: "ফুলকপি", en: "Cauliflower", category: "vegetable", shelfDays: 10 },
  { bn: "মূলা", en: "Radish", category: "vegetable", shelfDays: 12 },
  { bn: "গাজর", en: "Carrot", category: "vegetable", shelfDays: 18 },
  { bn: "বেগুন", en: "Brinjal", category: "vegetable", shelfDays: 7 },
  { bn: "ঢেঁড়স", en: "Okra", category: "vegetable", shelfDays: 6 },
  { bn: "পটল", en: "Pointed gourd", category: "vegetable", shelfDays: 7 },
  { bn: "ঝিঙে", en: "Ridge gourd", category: "vegetable", shelfDays: 6 },
  { bn: "চিচিঙ্গা", en: "Snake gourd", category: "vegetable", shelfDays: 6 },
  { bn: "লাউ", en: "Bottle gourd", category: "vegetable", shelfDays: 10 },
  { bn: "চালকুমড়া", en: "Ash gourd", category: "vegetable", shelfDays: 20 },
  { bn: "মিষ্টি কুমড়া", en: "Pumpkin", category: "vegetable", shelfDays: 30 },
  { bn: "করলা", en: "Bitter gourd", category: "vegetable", shelfDays: 7 },
  { bn: "বরবটি", en: "Yardlong bean", category: "vegetable", shelfDays: 6 },
  { bn: "কাঁকরোল", en: "Spiny gourd", category: "vegetable", shelfDays: 6 },
  { bn: "ধুন্দুল", en: "Sponge gourd", category: "vegetable", shelfDays: 6 },
  { bn: "কচুর লতি", en: "Taro stolon", category: "vegetable", shelfDays: 5 },
  { bn: "কচু শাক", en: "Taro leaf", category: "vegetable", shelfDays: 3 },
  { bn: "শালগম", en: "Turnip", category: "vegetable", shelfDays: 14 },
  { bn: "ওলকপি", en: "Kohlrabi", category: "vegetable", shelfDays: 12 },
  { bn: "পেঁয়াজ কলি", en: "Spring onion", category: "vegetable", shelfDays: 6 },
  { bn: "সজনে পাতা", en: "Moringa leaf", category: "herb", shelfDays: 3 },
  { bn: "আদা", en: "Ginger", category: "spice", shelfDays: 30 },
  { bn: "কাঁচা হলুদ", en: "Fresh turmeric", category: "spice", shelfDays: 25 },
  { bn: "কাঁঠাল", en: "Jackfruit", category: "fruit", shelfDays: 5 },
  { bn: "লিচু", en: "Lychee", category: "fruit", shelfDays: 4 },
  { bn: "জাম", en: "Blackberry", category: "fruit", shelfDays: 3 },
  { bn: "বরই", en: "Jujube", category: "fruit", shelfDays: 7 },
  { bn: "আমড়া", en: "Hog plum", category: "fruit", shelfDays: 7 },
  { bn: "জলপাই", en: "Olive", category: "fruit", shelfDays: 10 },
  { bn: "সফেদা", en: "Sapodilla", category: "fruit", shelfDays: 5 },
  { bn: "বেল", en: "Wood apple", category: "fruit", shelfDays: 12 },
  { bn: "ডালিম", en: "Pomegranate", category: "fruit", shelfDays: 20 },
  { bn: "নাশপাতি", en: "Pear", category: "fruit", shelfDays: 12 },
  { bn: "স্ট্রবেরি", en: "Strawberry", category: "fruit", shelfDays: 4 },
  { bn: "মালটা", en: "Malta orange", category: "fruit", shelfDays: 14 },
  { bn: "আঁখ", en: "Sugarcane", category: "fruit", shelfDays: 7 },
  { bn: "কামরাঙা", en: "Star fruit", category: "fruit", shelfDays: 6 },
  { bn: "পেঁপে পাকা", en: "Ripe papaya", category: "fruit", shelfDays: 4 },
  { bn: "আতা ফল", en: "Custard apple", category: "fruit", shelfDays: 4 },
  { bn: "কই মাছ", en: "Koi fish", category: "protein", shelfDays: 2 },
  { bn: "শিং মাছ", en: "Shing fish", category: "protein", shelfDays: 2 },
  { bn: "মাগুর মাছ", en: "Magur fish", category: "protein", shelfDays: 2 },
  { bn: "টাকি মাছ", en: "Taki fish", category: "protein", shelfDays: 2 },
  { bn: "পাবদা মাছ", en: "Pabda fish", category: "protein", shelfDays: 2 },
  { bn: "চিতল মাছ", en: "Chital fish", category: "protein", shelfDays: 2 },
  { bn: "বোয়াল মাছ", en: "Boal fish", category: "protein", shelfDays: 2 },
  { bn: "সরপুঁটি", en: "Sarputi fish", category: "protein", shelfDays: 2 },
  { bn: "মলা মাছ", en: "Mola fish", category: "protein", shelfDays: 1 },
  { bn: "কাচকি মাছ", en: "Kachki fish", category: "protein", shelfDays: 1 },
  { bn: "রূপচাঁদা", en: "Pomfret", category: "protein", shelfDays: 2 },
  { bn: "কাঁকড়া", en: "Crab", category: "protein", shelfDays: 1 },
  { bn: "মুরগির ডিম", en: "Chicken egg", category: "protein", shelfDays: 21 },
  { bn: "হাঁসের ডিম", en: "Duck egg", category: "protein", shelfDays: 21 },
  { bn: "কলিজা", en: "Liver", category: "protein", shelfDays: 1 },
  { bn: "মগজ", en: "Brain", category: "protein", shelfDays: 1 },
  { bn: "সসেজ", en: "Sausage", category: "protein", shelfDays: 7 },
  { bn: "কিমা", en: "Minced meat", category: "protein", shelfDays: 1 },
  { bn: "পোলাওর চাল", en: "Polao rice", category: "grain", shelfDays: 365 },
  { bn: "বাসমতি চাল", en: "Basmati rice", category: "grain", shelfDays: 365 },
  { bn: "লাল চাল", en: "Red rice", category: "grain", shelfDays: 300 },
  { bn: "খই", en: "Popped rice", category: "grain", shelfDays: 60 },
  { bn: "সেমাই", en: "Vermicelli", category: "grain", shelfDays: 240 },
  { bn: "রুটি", en: "Roti", category: "grain", shelfDays: 2 },
  { bn: "পরোটা", en: "Paratha", category: "grain", shelfDays: 3 },
  { bn: "বিস্কুট", en: "Biscuit", category: "grain", shelfDays: 180 },
  { bn: "কেক", en: "Cake", category: "grain", shelfDays: 5 },
  { bn: "কর্নফ্লেক্স", en: "Cornflakes", category: "grain", shelfDays: 240 },
  { bn: "খেসারির ডাল", en: "Khesari dal", category: "grain", shelfDays: 300 },
  { bn: "অড়হর ডাল", en: "Toor dal", category: "grain", shelfDays: 300 },
  { bn: "বুটের ডাল", en: "Bengal gram", category: "grain", shelfDays: 300 },
  { bn: "সয়াবিন তেল", en: "Soybean oil", category: "condiment", shelfDays: 365 },
  { bn: "জলপাই তেল", en: "Olive oil", category: "condiment", shelfDays: 400 },
  { bn: "নারকেল তেল", en: "Coconut oil", category: "condiment", shelfDays: 400 },
  { bn: "ভিনেগার", en: "Vinegar", category: "condiment", shelfDays: 500 },
  { bn: "সয়া সস", en: "Soy sauce", category: "condiment", shelfDays: 400 },
  { bn: "টমেটো সস", en: "Tomato ketchup", category: "condiment", shelfDays: 200 },
  { bn: "মেয়োনিজ", en: "Mayonnaise", category: "condiment", shelfDays: 60 },
  { bn: "আচার", en: "Pickle", category: "condiment", shelfDays: 300 },
  { bn: "সরিষা বাটা", en: "Mustard paste", category: "condiment", shelfDays: 14 },
  { bn: "চিলি সস", en: "Chilli sauce", category: "condiment", shelfDays: 200 },
  { bn: "কাসুন্দি", en: "Kasundi", category: "condiment", shelfDays: 200 },
  { bn: "শুকনা মরিচ", en: "Dried chilli", category: "spice", shelfDays: 300 },
  { bn: "ধনে গুঁড়া", en: "Coriander powder", category: "spice", shelfDays: 300 },
  { bn: "গরম মসলা", en: "Garam masala", category: "spice", shelfDays: 300 },
  { bn: "এলাচ", en: "Cardamom", category: "spice", shelfDays: 400 },
  { bn: "দারুচিনি", en: "Cinnamon", category: "spice", shelfDays: 400 },
  { bn: "লবঙ্গ", en: "Clove", category: "spice", shelfDays: 400 },
  { bn: "কালোজিরা", en: "Nigella seed", category: "spice", shelfDays: 300 },
  { bn: "মেথি", en: "Fenugreek seed", category: "spice", shelfDays: 300 },
  { bn: "মৌরি", en: "Fennel seed", category: "spice", shelfDays: 300 },
  { bn: "রাঁধুনি", en: "Radhuni seed", category: "spice", shelfDays: 300 },
  { bn: "পাঁচফোড়ন", en: "Panch phoron", category: "spice", shelfDays: 300 },
  { bn: "জয়ত্রী", en: "Mace", category: "spice", shelfDays: 400 },
  { bn: "জায়ফল", en: "Nutmeg", category: "spice", shelfDays: 400 },
  { bn: "কাবাব মসলা", en: "Kebab masala", category: "spice", shelfDays: 300 },
  { bn: "বিরিয়ানি মসলা", en: "Biryani masala", category: "spice", shelfDays: 300 },
  { bn: "চা পাতা", en: "Tea leaf", category: "other", shelfDays: 300 },
  { bn: "কফি", en: "Coffee", category: "other", shelfDays: 300 },
  { bn: "গুঁড়া মসলা", en: "Mixed masala", category: "spice", shelfDays: 250 },
  { bn: "বেকিং পাউডার", en: "Baking powder", category: "other", shelfDays: 300 },
  { bn: "ইস্ট", en: "Yeast", category: "other", shelfDays: 180 },
  { bn: "চকলেট", en: "Chocolate", category: "other", shelfDays: 200 },
  { bn: "আইসক্রিম", en: "Ice cream", category: "dairy", shelfDays: 90 },
  { bn: "মিষ্টি", en: "Sweets", category: "dairy", shelfDays: 3 },
  { bn: "রসগোল্লা", en: "Rosogolla", category: "dairy", shelfDays: 4 },
  { bn: "লাচ্ছি", en: "Lassi", category: "dairy", shelfDays: 2 },
  { bn: "মাঠা", en: "Buttermilk", category: "dairy", shelfDays: 2 },
  { bn: "চিজ স্লাইস", en: "Cheese slice", category: "dairy", shelfDays: 21 },
  { bn: "ডালডা", en: "Dalda", category: "condiment", shelfDays: 240 },
  { bn: "নুডলস প্যাকেট", en: "Instant noodles", category: "grain", shelfDays: 200 },
  { bn: "চানাচুর", en: "Chanachur", category: "other", shelfDays: 90 },
  { bn: "পাঁপড়", en: "Papad", category: "other", shelfDays: 180 },
  { bn: "শুকনা ফল", en: "Dry fruits", category: "other", shelfDays: 180 },
  { bn: "পেস্তা", en: "Pistachio", category: "other", shelfDays: 150 },
  { bn: "আখরোট", en: "Walnut", category: "other", shelfDays: 150 },
  { bn: "তিল", en: "Sesame seed", category: "spice", shelfDays: 200 },
  { bn: "সরিষা", en: "Mustard seed", category: "spice", shelfDays: 300 },
  { bn: "চিনিগুঁড়া চাল", en: "Chinigura rice", category: "grain", shelfDays: 365 },
  { bn: "মধুমাখা খেজুর", en: "Stuffed dates", category: "fruit", shelfDays: 120 },
  { bn: "টক দই", en: "Sour yogurt", category: "dairy", shelfDays: 6 },
  { bn: "মিষ্টি দই", en: "Sweet yogurt", category: "dairy", shelfDays: 5 },
  { bn: "কাঁচা কলা", en: "Green banana", category: "vegetable", shelfDays: 7 },
  { bn: "থানকুনি পাতা", en: "Pennywort", category: "herb", shelfDays: 3 },
  { bn: "লেবু পাতা", en: "Lime leaf", category: "herb", shelfDays: 7 },
  { bn: "নারকেল কোরা", en: "Grated coconut", category: "other", shelfDays: 3 },
  { bn: "চিড়া ভাজা", en: "Fried chira", category: "grain", shelfDays: 30 },
  { bn: "ছাতু", en: "Sattu", category: "grain", shelfDays: 120 },
  { bn: "সাগু", en: "Sago", category: "grain", shelfDays: 300 },
  { bn: "বার্লি", en: "Barley", category: "grain", shelfDays: 300 },
  { bn: "কিনোয়া", en: "Quinoa", category: "grain", shelfDays: 300 },
  { bn: "মাখানা", en: "Fox nut", category: "other", shelfDays: 180 },
  { bn: "গুঁড়া মরিচ", en: "Chilli powder", category: "spice", shelfDays: 300 },
  { bn: "শসার আচার", en: "Cucumber pickle", category: "condiment", shelfDays: 120 },
  { bn: "খাঁটি ঘি", en: "Pure ghee", category: "dairy", shelfDays: 240 },
  { bn: "ফ্রোজেন পরোটা", en: "Frozen paratha", category: "grain", shelfDays: 120 },
  { bn: "ফ্রোজেন সবজি", en: "Frozen vegetables", category: "vegetable", shelfDays: 120 },
  { bn: "নাগা মরিচ", en: "Naga chilli", category: "vegetable", shelfDays: 8 },
  { bn: "শুকনা পেঁয়াজ", en: "Dried onion", category: "vegetable", shelfDays: 120 },
  { bn: "সরিষার খৈল", en: "Mustard cake", category: "other", shelfDays: 200 },
  { bn: "ইসবগুল", en: "Psyllium husk", category: "other", shelfDays: 300 },
  { bn: "মধুর চাক", en: "Honeycomb", category: "condiment", shelfDays: 300 },
  { bn: "টমেটো পিউরি", en: "Tomato puree", category: "condiment", shelfDays: 180 },
  { bn: "আদা বাটা", en: "Ginger paste", category: "spice", shelfDays: 21 },
  { bn: "রসুন বাটা", en: "Garlic paste", category: "spice", shelfDays: 21 },
  { bn: "পেঁয়াজ বেরেস্তা", en: "Fried onion", category: "condiment", shelfDays: 60 },
  { bn: "নারকেলের নাড়ু", en: "Coconut laddu", category: "other", shelfDays: 10 },
  { bn: "খেজুরের গুড়", en: "Date jaggery", category: "condiment", shelfDays: 200 },
  { bn: "আখের গুড়", en: "Cane jaggery", category: "condiment", shelfDays: 200 },
  { bn: "লবণাক্ত মাখন", en: "Salted butter", category: "dairy", shelfDays: 45 },
  { bn: "ক্রিম চিজ", en: "Cream cheese", category: "dairy", shelfDays: 14 },
  { bn: "সাদা তিল", en: "White sesame", category: "spice", shelfDays: 200 },
  { bn: "কালো এলাচ", en: "Black cardamom", category: "spice", shelfDays: 400 },
  { bn: "গোলমরিচ গুঁড়া", en: "Pepper powder", category: "spice", shelfDays: 300 },
  { bn: "স্যুপ প্যাকেট", en: "Soup packet", category: "other", shelfDays: 300 },
  { bn: "ওরস্যালাইন", en: "Oral saline", category: "other", shelfDays: 500 },
  { bn: "জুস", en: "Juice", category: "other", shelfDays: 60 },
  { bn: "কোমল পানীয়", en: "Soft drink", category: "other", shelfDays: 120 },
  { bn: "পানি বোতল", en: "Bottled water", category: "other", shelfDays: 300 },
  { bn: "লবণ পানি", en: "Brine", category: "other", shelfDays: 200 },
];

export type GroceryItem = { bn: string; en: string; category: Category; shelfDays?: number };

/** 200+ common Bangla grocery items for the autocomplete dropdown. */
export const GROCERY_ITEMS: GroceryItem[] = (() => {
  const seen = new Set<string>();
  const out: GroceryItem[] = [];
  const push = (i: GroceryItem) => {
    if (seen.has(i.bn)) return;
    seen.add(i.bn);
    out.push(i);
  };
  push({ bn: "মাছ", en: "Fish", category: "protein", shelfDays: 2 });
  for (const i of INGREDIENTS)
    push({ bn: i.bn, en: i.en, category: i.category, ...(i.shelfDays != null ? { shelfDays: i.shelfDays } : {}) });
  for (const e of EXTRA) push(e);
  return out.sort((a, b) => a.bn.localeCompare(b.bn, "bn"));
})();

const TABLE: Record<string, ShelfLife> = (() => {
  const table: Record<string, ShelfLife> = {};
  for (const item of GROCERY_ITEMS) table[item.bn] = derive(item.category, item.shelfDays);
  for (const [name, life] of Object.entries(EXPLICIT)) table[name] = life;
  return table;
})();

/** Full shelf-life lookup table keyed by Bangla item name. */
export const SHELF_LIFE_DB = TABLE;

export function findGroceryItem(name: string): GroceryItem | undefined {
  const q = name.trim();
  return (
    GROCERY_ITEMS.find((i) => i.bn === q) ??
    GROCERY_ITEMS.find((i) => i.en.toLowerCase() === q.toLowerCase())
  );
}

/** Days the item keeps in the given storage. Falls back to the knowledge base. */
export function getShelfLifeDays(itemName: string, storage: StorageType): number {
  const q = itemName.trim();
  const direct = TABLE[q];
  if (direct) return direct[storage];

  const match = findGroceryItem(q);
  if (match && TABLE[match.bn]) return TABLE[match.bn]![storage];

  // Partial match: "রুই মাছ ১ কেজি" -> "রুই মাছ"
  const partial = GROCERY_ITEMS.find((i) => q.includes(i.bn) || q.toLowerCase().includes(i.en.toLowerCase()));
  if (partial && TABLE[partial.bn]) return TABLE[partial.bn]![storage];

  const known = lookupIngredient(q);
  if (known) return derive(known.category, known.shelfDays)[storage];

  return derive("other", 7)[storage];
}

export function toISODate(d: Date) {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

/** expected_expiry_date = purchase_date + shelf life(item, storage). */
export function getExpectedExpiryDate(
  itemName: string,
  storage: StorageType,
  purchaseDate: string,
): string {
  const days = getShelfLifeDays(itemName, storage);
  const d = new Date(`${purchaseDate}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}
