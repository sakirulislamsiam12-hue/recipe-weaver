// Bulk-imported Bangladeshi rice-dish recipes (10,000 regional variants).
//
// Source: "Bangladesh_10000_Recipes_COMPLETE.xlsx" supplied by the app owner.
// The sheet is fully regular — every row is <region> + <main vegetable> +
// <spice style> + " ভাত" — so the data is stored here as its three source
// tables and expanded at load time. Ingredient lines and cooking steps are
// reproduced exactly as they appear in the sheet.
//
// Recipes whose Bengali name already exists in the app database are dropped
// by the de-duplication step in `recipe-db.ts`, so nothing is overwritten.

import type { DbRecipe, SpiceLevel } from "./recipe-db-types";

/** [bn, en, tag] */
const MAINS: [string, string, string][] = [["আলু", "Potato", "potato"], ["এঁচোড়", "Raw Jackfruit", "raw jackfruit"], ["কচু", "Taro", "taro"], ["কচুর লতি", "Taro Stolon", "taro stolon"], ["করলা", "Bitter Gourd", "bitter gourd"], ["কলমি শাক", "Water Spinach", "water spinach"], ["কাঁচা কলা", "Green Banana", "green banana"], ["গাজর", "Carrot", "carrot"], ["চালকুমড়া", "Ash Gourd", "ash gourd"], ["ঝিঙে", "Ridge Gourd", "ridge gourd"], ["ঢেঁড়স", "Okra", "okra"], ["পটল", "Pointed Gourd", "pointed gourd"], ["পালং শাক", "Spinach", "spinach"], ["পুঁই শাক", "Malabar Spinach", "malabar spinach"], ["পেঁপে", "Green Papaya", "green papaya"], ["ফুলকপি", "Cauliflower", "cauliflower"], ["বরবটি", "Yardlong Bean", "yardlong bean"], ["বাঁধাকপি", "Cabbage", "cabbage"], ["বেগুন", "Eggplant", "eggplant"], ["মিষ্টি কুমড়া", "Pumpkin", "pumpkin"], ["মূলা", "Radish", "radish"], ["লাউ", "Bottle Gourd", "bottle gourd"], ["লাল শাক", "Red Amaranth", "red amaranth"], ["শিম", "Flat Bean", "flat bean"], ["সরিষা শাক", "Mustard Greens", "mustard greens"]];

/** [bn, en, masalaWordBn, masalaWordEn, extraIngredients, spiceLevel, cookTime] */
const STYLES: [string, string, string, string, string[], number, number][] = [["সরিষা-ঝাল", "Shorishe Jhal", "সরিষা", "mustard", ["Mustard seed", "Mustard oil"], 4, 30], ["পেঁয়াজ-রসুন", "Peyaj Roshun", "পেঁয়াজ", "onion", ["Onion", "Garlic"], 2, 30], ["টমেটো-ধনিয়া", "Tomato Dhonia", "টমেটো", "tomato", ["Tomato", "Coriander leaf"], 2, 30], ["কাঁচামরিচ-ধনিয়া", "Kanchamorich Dhonia", "কাঁচামরিচ", "green chilli", ["Green chilli", "Coriander leaf"], 4, 25], ["নারকেল-দুধ", "Narkel Dudh", "নারকেল", "coconut", ["Coconut milk", "Coconut"], 1, 35], ["দই-মশলা", "Doi Moshla", "দই", "yogurt", ["Yogurt"], 2, 35], ["ভাজা মশলা", "Bhaja Moshla", "ভাজা মশলা", "roasted spice", ["Roasted cumin", "Roasted coriander"], 3, 30], ["কালোজিরা-ফোড়ন", "Kalojira Phoron", "কালোজিরা", "nigella", ["Nigella seed"], 2, 25], ["পাঁচফোড়ন", "Panch Phoron", "পাঁচফোড়ন", "panch phoron", ["Panch phoron"], 2, 25], ["জিরা-ধনিয়া", "Jira Dhonia", "জিরা", "cumin", ["Cumin", "Coriander powder"], 2, 30], ["আদা-রসুন", "Ada Roshun", "আদা", "ginger", ["Ginger", "Garlic"], 2, 30], ["শুকনা মরিচ", "Shukna Morich", "শুকনা মরিচ", "dry chilli", ["Dry red chilli"], 5, 25], ["কাঁচা আম", "Kacha Aam", "কাঁচা আম", "green mango", ["Green mango"], 3, 30], ["তেঁতুল", "Tetul", "তেঁতুল", "tamarind", ["Tamarind"], 3, 30], ["লেবু-ধনিয়া", "Lebu Dhonia", "লেবু", "lemon", ["Lemon", "Coriander leaf"], 2, 25], ["পুদিনা", "Pudina", "পুদিনা", "mint", ["Mint leaf"], 1, 25], ["ধনে পাতা", "Dhone Pata", "ধনে পাতা", "coriander leaf", ["Coriander leaf"], 1, 25], ["নারকেল-কাঁচামরিচ", "Narkel Kanchamorich", "নারকেল", "coconut", ["Coconut", "Green chilli"], 3, 35], ["পোস্ত-সরিষা", "Posto Shorishe", "পোস্ত", "poppy seed", ["Poppy seed", "Mustard seed"], 3, 35], ["গরম মশলা", "Gorom Moshla", "গরম মশলা", "garam masala", ["Garam masala"], 3, 30]];

/** [bn, en, tag] */
const REGIONS: [string, string, string][] = [["ঢাকাইয়া", "Dhakaiya", "dhaka"], ["চট্টগ্রামের", "Chattogram", "chattogram"], ["সিলেটি", "Sylheti", "sylhet"], ["রাজশাহীর", "Rajshahi", "rajshahi"], ["বরিশালের", "Barishal", "barishal"], ["খুলনার", "Khulna", "khulna"], ["কুমিল্লার", "Cumilla", "cumilla"], ["নোয়াখালীর", "Noakhali", "noakhali"], ["রংপুরের", "Rangpur", "rangpur"], ["ময়মনসিংহের", "Mymensingh", "mymensingh"], ["বগুড়ার", "Bogura", "bogura"], ["দিনাজপুরের", "Dinajpur", "dinajpur"], ["ফরিদপুরের", "Faridpur", "faridpur"], ["যশোরের", "Jashore", "jashore"], ["কুষ্টিয়ার", "Kushtia", "kushtia"], ["নরসিংদীর", "Narsingdi", "narsingdi"], ["টাঙ্গাইলের", "Tangail", "tangail"], ["পাবনার", "Pabna", "pabna"], ["সুনামগঞ্জের", "Sunamganj", "sunamganj"], ["কক্সবাজারের", "Cox's Bazar", "coxsbazar"]];

const STAPLES = [
  "Onion",
  "Garlic",
  "Ginger",
  "Green chilli",
  "Turmeric",
  "Chilli powder",
  "Salt",
  "Cooking oil",
  "Coriander leaf",
];

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function build(): DbRecipe[] {
  const out: DbRecipe[] = [];
  for (const [mainBn, mainEn, mainTag] of MAINS) {
    for (const [styleBn, styleEn, masalaBn, masalaEn, extras, spice, cookTime] of STYLES) {
      // Shared between all 20 regional variants of this dish.
      const ingredients = [mainEn, ...extras];
      const ingredientLine = `${mainBn} ৫০০ গ্রাম, পেঁয়াজ ২টি, রসুন ৬ কোয়া, আদা ১ টেবিল চামচ, কাঁচামরিচ ৪টি, ${masalaBn} মসলা ১–২ টেবিল চামচ, হলুদ ½ চা চামচ, মরিচ গুঁড়া ১ চা চামচ, লবণ স্বাদমতো, তেল ৩ টেবিল চামচ, পানি প্রয়োজনমতো, ধনেপাতা সামান্য।`;
      const steps_bn = [
        `${mainBn} পরিষ্কার করে প্রয়োজনমতো টুকরা/প্রস্তুত করুন এবং লবণ-হলুদ মাখিয়ে রাখুন।`,
        "কড়াই গরম করে তেল দিন; পেঁয়াজ, আদা ও রসুন নরম হওয়া পর্যন্ত ভাজুন।",
        `${styleBn} অনুযায়ী মসলা যোগ করে অল্প পানি দিয়ে ভালোভাবে কষান।`,
        `প্রস্তুত ${mainBn} দিয়ে মসলার সঙ্গে কয়েক মিনিট নাড়ুন।`,
        "কড়াইয়ে কষানো এবং প্রয়োজনমতো পানি দিয়ে সিদ্ধ করুন।",
        "ঝোল/মসলা পছন্দমতো ঘন হলে কাঁচামরিচ ও ধনেপাতা দিন।",
        "২–৩ মিনিট ঢেকে রেখে চুলা বন্ধ করুন। গরম ভাত/রুটি/পরোটার সঙ্গে পরিবেশন করুন।",
        `উপকরণ: ${ingredientLine}`,
      ];
      const steps_en = [
        `Clean the ${mainEn.toLowerCase()}, cut it as needed and rub it with salt and turmeric.`,
        "Heat oil in a pan and fry onion, ginger and garlic until soft.",
        `Add the ${masalaEn} masala with a splash of water and cook it down well.`,
        `Add the prepared ${mainEn.toLowerCase()} and stir with the masala for a few minutes.`,
        "Pour in as much water as needed and simmer until tender.",
        "When the gravy is as thick as you like, add green chilli and coriander leaf.",
        "Cover for 2–3 minutes, then turn off the heat. Serve hot with rice, ruti or paratha.",
      ];
      const tags = ["ভাত", "rice", mainTag, "vegetarian"];
      for (const [regionBn, regionEn, regionTag] of REGIONS) {
        out.push({
          id: `bd10k_${slug(regionEn)}_${slug(mainEn)}_${slug(styleEn)}`,
          name_bn: `${regionBn} ${mainBn} ${styleBn} ভাত`,
          name_en: `${regionEn} ${mainEn} ${styleEn} Bhat`,
          ingredients,
          staples: STAPLES,
          steps_bn,
          steps_en,
          cookTime,
          difficulty: "easy",
          spiceLevel: spice as SpiceLevel,
          tags: [...tags, regionTag],
          region: regionEn,
        });
      }
    }
  }
  return out;
}

/** 10,000 regional rice dishes expanded from the imported spreadsheet. */
export const BULK_BD_RECIPES: DbRecipe[] = build();
