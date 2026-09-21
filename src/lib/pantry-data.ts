// Ingredient knowledge base: ~120 regional staples with bilingual names,
// categories, perishability and shelf life. Used by autocomplete, the
// auto-assume staple engine, expiry tracking and the matching engine.

export type Category =
  | "vegetable"
  | "fruit"
  | "protein"
  | "dairy"
  | "grain"
  | "spice"
  | "condiment"
  | "herb"
  | "other";

export type Ingredient = {
  en: string;
  bn: string;
  category: Category;
  /** Assumed to be in almost every kitchen in the region — never counted as "missing". */
  staple?: boolean;
  /** Days it typically keeps once bought. Null = shelf stable. */
  shelfDays?: number;
  aliases?: string[];
};

const raw: Ingredient[] = [
  // ---------- spices & staples (auto-assumed) ----------
  { en: "Salt", bn: "লবণ", category: "spice", staple: true },
  { en: "Sugar", bn: "চিনি", category: "spice", staple: true },
  { en: "Cooking oil", bn: "তেল", category: "condiment", aliases: ["oil", "soybean oil"] },
  { en: "Mustard oil", bn: "সরিষার তেল", category: "condiment" },
  { en: "Ghee", bn: "ঘি", category: "dairy", staple: true, shelfDays: 180 },
  { en: "Turmeric", bn: "হলুদ", category: "spice", staple: true, aliases: ["haldi"] },
  { en: "Red chilli powder", bn: "মরিচ গুঁড়া", category: "spice", staple: true },
  { en: "Cumin", bn: "জিরা", category: "spice", staple: true, aliases: ["jeera"] },
  { en: "Coriander powder", bn: "ধনে গুঁড়া", category: "spice", staple: true },
  { en: "Garam masala", bn: "গরম মসলা", category: "spice", staple: true },
  { en: "Black pepper", bn: "গোলমরিচ", category: "spice", staple: true },
  { en: "Bay leaf", bn: "তেজপাতা", category: "spice", staple: true },
  { en: "Cinnamon", bn: "দারুচিনি", category: "spice", staple: true },
  { en: "Cardamom", bn: "এলাচ", category: "spice", staple: true },
  { en: "Clove", bn: "লবঙ্গ", category: "spice", staple: true },
  { en: "Mustard seed", bn: "সরিষা", category: "spice", staple: true },
  { en: "Nigella seed", bn: "কালোজিরা", category: "spice", staple: true, aliases: ["kalonji"] },
  { en: "Fenugreek", bn: "মেথি", category: "spice", staple: true },
  { en: "Panch phoron", bn: "পাঁচফোড়ন", category: "spice", staple: true },
  { en: "Vinegar", bn: "ভিনেগার", category: "condiment", staple: true },
  { en: "Soy sauce", bn: "সয়া সস", category: "condiment", shelfDays: 365 },
  { en: "Tomato ketchup", bn: "টমেটো সস", category: "condiment", shelfDays: 180 },
  { en: "Baking soda", bn: "বেকিং সোডা", category: "other", staple: true },
  { en: "Water", bn: "পানি", category: "other", staple: true },

  // ---------- aromatics ----------
  { en: "Onion", bn: "পেঁয়াজ", category: "vegetable", staple: true, shelfDays: 30 },
  { en: "Garlic", bn: "রসুন", category: "vegetable", staple: true, shelfDays: 45 },
  { en: "Ginger", bn: "আদা", category: "vegetable", staple: true, shelfDays: 21 },
  { en: "Green chilli", bn: "কাঁচা মরিচ", category: "vegetable", staple: true, shelfDays: 10, aliases: ["মরিচ", "chili", "chilli"] },
  { en: "Coriander leaves", bn: "ধনেপাতা", category: "herb", shelfDays: 5 },
  { en: "Mint", bn: "পুদিনা পাতা", category: "herb", shelfDays: 5 },
  { en: "Curry leaves", bn: "কারি পাতা", category: "herb", shelfDays: 7 },
  { en: "Spring onion", bn: "পেঁয়াজ পাতা", category: "herb", shelfDays: 7 },

  // ---------- vegetables ----------
  { en: "Potato", bn: "আলু", category: "vegetable", shelfDays: 30 },
  { en: "Tomato", bn: "টমেটো", category: "vegetable", shelfDays: 7 },
  { en: "Eggplant", bn: "বেগুন", category: "vegetable", shelfDays: 7, aliases: ["brinjal", "aubergine"] },
  { en: "Cauliflower", bn: "ফুলকপি", category: "vegetable", shelfDays: 7 },
  { en: "Cabbage", bn: "বাঁধাকপি", category: "vegetable", shelfDays: 12 },
  { en: "Spinach", bn: "পালং শাক", category: "vegetable", shelfDays: 4 },
  { en: "Red amaranth", bn: "লাল শাক", category: "vegetable", shelfDays: 3 },
  { en: "Bottle gourd", bn: "লাউ", category: "vegetable", shelfDays: 10 },
  { en: "Ridge gourd", bn: "ঝিঙা", category: "vegetable", shelfDays: 6 },
  { en: "Bitter gourd", bn: "করলা", category: "vegetable", shelfDays: 8 },
  { en: "Pumpkin", bn: "মিষ্টি কুমড়া", category: "vegetable", shelfDays: 25 },
  { en: "Ash gourd", bn: "চালকুমড়া", category: "vegetable", shelfDays: 20 },
  { en: "Okra", bn: "ঢেঁড়স", category: "vegetable", shelfDays: 5, aliases: ["lady finger"] },
  { en: "Carrot", bn: "গাজর", category: "vegetable", shelfDays: 14 },
  { en: "Radish", bn: "মুলা", category: "vegetable", shelfDays: 10 },
  { en: "Beetroot", bn: "বিটরুট", category: "vegetable", shelfDays: 14 },
  { en: "Cucumber", bn: "শসা", category: "vegetable", shelfDays: 7 },
  { en: "Capsicum", bn: "ক্যাপসিকাম", category: "vegetable", shelfDays: 8, aliases: ["bell pepper"] },
  { en: "Green beans", bn: "শিম", category: "vegetable", shelfDays: 6 },
  { en: "Peas", bn: "মটরশুঁটি", category: "vegetable", shelfDays: 5 },
  { en: "Drumstick", bn: "সজনে ডাঁটা", category: "vegetable", shelfDays: 6 },
  { en: "Taro root", bn: "কচু", category: "vegetable", shelfDays: 12 },
  { en: "Sweet potato", bn: "মিষ্টি আলু", category: "vegetable", shelfDays: 25 },
  { en: "Mushroom", bn: "মাশরুম", category: "vegetable", shelfDays: 4 },
  { en: "Broccoli", bn: "ব্রকলি", category: "vegetable", shelfDays: 6 },
  { en: "Lettuce", bn: "লেটুস", category: "vegetable", shelfDays: 5 },
  { en: "Corn", bn: "ভুট্টা", category: "vegetable", shelfDays: 6 },
  { en: "Papaya (raw)", bn: "কাঁচা পেঁপে", category: "vegetable", shelfDays: 8 },
  { en: "Banana flower", bn: "মোচা", category: "vegetable", shelfDays: 4 },
  { en: "Jackfruit (raw)", bn: "এঁচোড়", category: "vegetable", shelfDays: 5 },

  // ---------- fruits ----------
  { en: "Banana", bn: "কলা", category: "fruit", shelfDays: 5 },
  { en: "Mango", bn: "আম", category: "fruit", shelfDays: 5 },
  { en: "Apple", bn: "আপেল", category: "fruit", shelfDays: 14 },
  { en: "Orange", bn: "কমলা", category: "fruit", shelfDays: 12 },
  { en: "Lemon", bn: "লেবু", category: "fruit", staple: true, shelfDays: 14 },
  { en: "Guava", bn: "পেয়ারা", category: "fruit", shelfDays: 6 },
  { en: "Papaya", bn: "পেঁপে", category: "fruit", shelfDays: 6 },
  { en: "Pineapple", bn: "আনারস", category: "fruit", shelfDays: 6 },
  { en: "Watermelon", bn: "তরমুজ", category: "fruit", shelfDays: 7 },
  { en: "Grapes", bn: "আঙুর", category: "fruit", shelfDays: 7 },
  { en: "Coconut", bn: "নারকেল", category: "fruit", shelfDays: 20 },
  { en: "Date", bn: "খেজুর", category: "fruit", shelfDays: 120 },
  { en: "Tamarind", bn: "তেঁতুল", category: "condiment", staple: true, shelfDays: 180 },

  // ---------- proteins ----------
  { en: "Egg", bn: "ডিম", category: "protein", shelfDays: 21 },
  { en: "Chicken", bn: "মুরগি", category: "protein", shelfDays: 2 },
  { en: "Beef", bn: "গরুর মাংস", category: "protein", shelfDays: 3 },
  { en: "Mutton", bn: "খাসির মাংস", category: "protein", shelfDays: 3 },
  { en: "Duck", bn: "হাঁস", category: "protein", shelfDays: 2 },
  { en: "Rui fish", bn: "রুই মাছ", category: "protein", shelfDays: 2 },
  { en: "Katla fish", bn: "কাতলা মাছ", category: "protein", shelfDays: 2 },
  { en: "Hilsa", bn: "ইলিশ", category: "protein", shelfDays: 2 },
  { en: "Tilapia", bn: "তেলাপিয়া", category: "protein", shelfDays: 2 },
  { en: "Pangas", bn: "পাঙাশ", category: "protein", shelfDays: 2 },
  { en: "Prawn", bn: "চিংড়ি", category: "protein", shelfDays: 2 },
  { en: "Dried fish", bn: "শুঁটকি", category: "protein", shelfDays: 180 },
  { en: "Tuna (canned)", bn: "টুনা (ক্যান)", category: "protein", shelfDays: 365 },
  { en: "Tofu", bn: "টফু", category: "protein", shelfDays: 7 },
  { en: "Soy chunks", bn: "সয়া চাঙ্ক", category: "protein", shelfDays: 180 },

  // ---------- pulses & grains ----------
  { en: "Rice", bn: "চাল", category: "grain", staple: true },
  { en: "Cooked rice", bn: "ভাত", category: "grain", shelfDays: 2 },
  { en: "Flour", bn: "আটা", category: "grain", staple: true, aliases: ["atta", "wheat flour"] },
  { en: "Maida", bn: "ময়দা", category: "grain", staple: true },
  { en: "Semolina", bn: "সুজি", category: "grain", shelfDays: 180 },
  { en: "Puffed rice", bn: "মুড়ি", category: "grain", shelfDays: 60 },
  { en: "Flattened rice", bn: "চিড়া", category: "grain", shelfDays: 90 },
  { en: "Pasta", bn: "পাস্তা", category: "grain", shelfDays: 365 },
  { en: "Noodles", bn: "নুডলস", category: "grain", shelfDays: 200 },
  { en: "Bread", bn: "পাউরুটি", category: "grain", shelfDays: 4 },
  { en: "Oats", bn: "ওটস", category: "grain", shelfDays: 240 },
  { en: "Red lentils", bn: "মসুর ডাল", category: "grain", staple: true, aliases: ["masoor dal", "lentils"] },
  { en: "Split chickpeas", bn: "ছোলার ডাল", category: "grain", shelfDays: 300 },
  { en: "Mung dal", bn: "মুগ ডাল", category: "grain", shelfDays: 300 },
  { en: "Chickpeas", bn: "ছোলা", category: "grain", shelfDays: 300 },
  { en: "Kidney beans", bn: "রাজমা", category: "grain", shelfDays: 300 },
  { en: "Gram flour", bn: "বেসন", category: "grain", shelfDays: 150 },

  // ---------- dairy ----------
  { en: "Milk", bn: "দুধ", category: "dairy", shelfDays: 3 },
  { en: "Yogurt", bn: "দই", category: "dairy", shelfDays: 6 },
  { en: "Butter", bn: "মাখন", category: "dairy", shelfDays: 30 },
  { en: "Cheese", bn: "পনির", category: "dairy", shelfDays: 14 },
  { en: "Cottage cheese", bn: "ছানা", category: "dairy", shelfDays: 3 },
  { en: "Cream", bn: "ক্রিম", category: "dairy", shelfDays: 7 },
  { en: "Condensed milk", bn: "কনডেন্সড মিল্ক", category: "dairy", shelfDays: 200 },
  { en: "Milk powder", bn: "গুঁড়া দুধ", category: "dairy", shelfDays: 300 },

  // ---------- nuts & extras ----------
  { en: "Peanut", bn: "চিনাবাদাম", category: "other", shelfDays: 120 },
  { en: "Cashew", bn: "কাজু বাদাম", category: "other", shelfDays: 120 },
  { en: "Almond", bn: "কাঠবাদাম", category: "other", shelfDays: 150 },
  { en: "Raisin", bn: "কিশমিশ", category: "other", shelfDays: 180 },
  { en: "Coconut milk", bn: "নারকেলের দুধ", category: "dairy", shelfDays: 200 },
  { en: "Honey", bn: "মধু", category: "condiment", shelfDays: 400 },
  { en: "Jaggery", bn: "গুড়", category: "condiment", shelfDays: 200 },
  { en: "Poppy seed", bn: "পোস্ত", category: "spice", shelfDays: 200 },
];

export const INGREDIENTS: Ingredient[] = raw;

export const STAPLES = raw.filter((i) => i.staple);

const byKey = new Map<string, Ingredient>();
for (const i of raw) {
  byKey.set(i.en.toLowerCase(), i);
  byKey.set(i.bn, i);
  for (const a of i.aliases ?? []) byKey.set(a.toLowerCase(), i);
}

export function lookupIngredient(name: string): Ingredient | undefined {
  return byKey.get(name.trim().toLowerCase()) ?? byKey.get(name.trim());
}

export function label(i: Ingredient, lang: "bn" | "en") {
  return lang === "bn" ? i.bn : i.en;
}

/** Perishability score 0-1: higher = use it first. */
export function perishability(name: string): number {
  const item = lookupIngredient(name);
  if (!item) return 0.5;
  if (item.shelfDays == null) return 0.05;
  if (item.shelfDays <= 3) return 1;
  if (item.shelfDays <= 7) return 0.8;
  if (item.shelfDays <= 14) return 0.6;
  if (item.shelfDays <= 30) return 0.35;
  return 0.15;
}

/**
 * Substitution matrix — each entry maps an ingredient to viable swaps with a
 * confidence score (0-1) describing how well the flavour/function carries over.
 */
export const SUBSTITUTIONS: Record<string, { name: string; confidence: number }[]> = {
  Butter: [
    { name: "Ghee", confidence: 0.9 },
    { name: "Cooking oil", confidence: 0.7 },
  ],
  Ghee: [
    { name: "Butter", confidence: 0.9 },
    { name: "Cooking oil", confidence: 0.75 },
  ],
  Milk: [
    { name: "Milk powder", confidence: 0.85 },
    { name: "Coconut milk", confidence: 0.65 },
    { name: "Yogurt", confidence: 0.5 },
  ],
  Yogurt: [
    { name: "Cream", confidence: 0.7 },
    { name: "Coconut milk", confidence: 0.55 },
    { name: "Lemon", confidence: 0.4 },
  ],
  Cream: [{ name: "Coconut milk", confidence: 0.7 }, { name: "Milk", confidence: 0.5 }],
  Lemon: [{ name: "Vinegar", confidence: 0.75 }, { name: "Tamarind", confidence: 0.7 }],
  Tamarind: [{ name: "Lemon", confidence: 0.7 }, { name: "Vinegar", confidence: 0.6 }],
  Chicken: [
    { name: "Tofu", confidence: 0.6 },
    { name: "Soy chunks", confidence: 0.6 },
    { name: "Mushroom", confidence: 0.5 },
  ],
  Beef: [{ name: "Mutton", confidence: 0.85 }, { name: "Chicken", confidence: 0.6 }],
  Mutton: [{ name: "Beef", confidence: 0.85 }, { name: "Chicken", confidence: 0.6 }],
  Prawn: [{ name: "Tilapia", confidence: 0.6 }, { name: "Chicken", confidence: 0.5 }],
  "Rui fish": [{ name: "Katla fish", confidence: 0.9 }, { name: "Tilapia", confidence: 0.7 }],
  Egg: [{ name: "Tofu", confidence: 0.55 }, { name: "Gram flour", confidence: 0.5 }],
  Potato: [{ name: "Sweet potato", confidence: 0.7 }, { name: "Taro root", confidence: 0.6 }],
  Tomato: [{ name: "Tomato ketchup", confidence: 0.6 }, { name: "Tamarind", confidence: 0.45 }],
  Onion: [{ name: "Spring onion", confidence: 0.65 }, { name: "Cabbage", confidence: 0.35 }],
  Sugar: [{ name: "Jaggery", confidence: 0.9 }, { name: "Honey", confidence: 0.8 }],
  Jaggery: [{ name: "Sugar", confidence: 0.9 }],
  Cheese: [{ name: "Cottage cheese", confidence: 0.75 }, { name: "Tofu", confidence: 0.5 }],
  Flour: [{ name: "Maida", confidence: 0.85 }, { name: "Semolina", confidence: 0.5 }],
  Maida: [{ name: "Flour", confidence: 0.85 }],
  Rice: [{ name: "Flattened rice", confidence: 0.5 }, { name: "Noodles", confidence: 0.45 }],
  Spinach: [{ name: "Red amaranth", confidence: 0.85 }, { name: "Cabbage", confidence: 0.5 }],
  Capsicum: [{ name: "Green chilli", confidence: 0.5 }, { name: "Cabbage", confidence: 0.4 }],
  "Coriander leaves": [{ name: "Mint", confidence: 0.6 }, { name: "Spring onion", confidence: 0.5 }],
  "Green beans": [{ name: "Peas", confidence: 0.7 }, { name: "Carrot", confidence: 0.5 }],
  "Coconut milk": [{ name: "Cream", confidence: 0.7 }, { name: "Milk", confidence: 0.55 }],
};

export function substitutesFor(name: string) {
  const item = lookupIngredient(name);
  const key = item?.en ?? name;
  return SUBSTITUTIONS[key] ?? [];
}

/** Diet/allergy rules: tag -> ingredient english names that are excluded. */
export const DIET_EXCLUSIONS: Record<string, string[]> = {
  Vegetarian: ["Chicken", "Beef", "Mutton", "Duck", "Rui fish", "Katla fish", "Hilsa", "Tilapia", "Pangas", "Prawn", "Dried fish", "Tuna (canned)"],
  Vegan: ["Chicken", "Beef", "Mutton", "Duck", "Rui fish", "Katla fish", "Hilsa", "Tilapia", "Pangas", "Prawn", "Dried fish", "Tuna (canned)", "Egg", "Milk", "Yogurt", "Butter", "Cheese", "Cottage cheese", "Cream", "Ghee", "Condensed milk", "Milk powder", "Honey"],
  "Dairy allergy": ["Milk", "Yogurt", "Butter", "Cheese", "Cottage cheese", "Cream", "Ghee", "Condensed milk", "Milk powder"],
  "Nut allergy": ["Peanut", "Cashew", "Almond"],
};
