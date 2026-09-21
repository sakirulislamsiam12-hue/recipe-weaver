/**
 * 16. Local / seasonal ingredient suggestions.
 * Month-indexed produce that is cheap and at its best in the Bengal delta
 * (with a temperate fallback for other regions).
 */

export type SeasonalItem = { bn: string; en: string; noteBn: string; noteEn: string };

type Calendar = Record<number, SeasonalItem[]>;

const BD: Calendar = {
  0: [
    { bn: "ফুলকপি", en: "Cauliflower", noteBn: "শীতের সেরা দাম", noteEn: "Peak winter value" },
    { bn: "পালং শাক", en: "Spinach", noteBn: "কচি ও সস্তা", noteEn: "Tender and cheap" },
    { bn: "টমেটো", en: "Tomato", noteBn: "রসালো মৌসুম", noteEn: "Juiciest right now" },
  ],
  1: [
    { bn: "বাঁধাকপি", en: "Cabbage", noteBn: "শীতের শেষভাগ", noteEn: "Late winter crop" },
    { bn: "গাজর", en: "Carrot", noteBn: "মিষ্টি ও সস্তা", noteEn: "Sweet and cheap" },
    { bn: "ধনেপাতা", en: "Coriander", noteBn: "সবচেয়ে সুগন্ধি", noteEn: "Most fragrant now" },
  ],
  2: [
    { bn: "লাউ", en: "Bottle gourd", noteBn: "নতুন ফলন", noteEn: "New harvest" },
    { bn: "সজনে ডাঁটা", en: "Drumstick", noteBn: "বসন্তের বিশেষ", noteEn: "Spring speciality" },
    { bn: "কাঁচা আম", en: "Green mango", noteBn: "টক রান্নার জন্য", noteEn: "Great for sour dishes" },
  ],
  3: [
    { bn: "ঢেঁড়স", en: "Okra", noteBn: "গরমের শুরুতে সস্তা", noteEn: "Cheap early summer" },
    { bn: "পটল", en: "Pointed gourd", noteBn: "মৌসুম শুরু", noteEn: "Season starting" },
    { bn: "তরমুজ", en: "Watermelon", noteBn: "সবচেয়ে সস্তা", noteEn: "Lowest price" },
  ],
  4: [
    { bn: "আম", en: "Mango", noteBn: "মৌসুমের শুরু", noteEn: "Season begins" },
    { bn: "কাঁঠাল", en: "Jackfruit", noteBn: "কাঁচা তরকারিতে দারুণ", noteEn: "Great in curries" },
    { bn: "চিচিঙ্গা", en: "Snake gourd", noteBn: "প্রচুর সরবরাহ", noteEn: "Plentiful supply" },
  ],
  5: [
    { bn: "লিচু", en: "Lychee", noteBn: "সংক্ষিপ্ত মৌসুম", noteEn: "Short season" },
    { bn: "কচু", en: "Taro", noteBn: "বর্ষার প্রিয়", noteEn: "Monsoon favourite" },
    { bn: "ইলিশ", en: "Hilsa", noteBn: "বর্ষার মাছ", noteEn: "Monsoon catch" },
  ],
  6: [
    { bn: "ইলিশ", en: "Hilsa", noteBn: "সেরা সময়", noteEn: "Prime season" },
    { bn: "কলমি শাক", en: "Water spinach", noteBn: "বর্ষায় প্রচুর", noteEn: "Abundant in rain" },
    { bn: "পেঁপে", en: "Papaya", noteBn: "সারা বছর সস্তা", noteEn: "Reliable value" },
  ],
  7: [
    { bn: "ঝিঙে", en: "Ridge gourd", noteBn: "বর্ষার সবজি", noteEn: "Monsoon veg" },
    { bn: "কচুর লতি", en: "Taro stolon", noteBn: "স্থানীয় বিশেষ", noteEn: "Local speciality" },
    { bn: "পেয়ারা", en: "Guava", noteBn: "ফাইবারে ভরপুর", noteEn: "High in fibre" },
  ],
  8: [
    { bn: "মিষ্টি কুমড়া", en: "Pumpkin", noteBn: "দীর্ঘদিন থাকে", noteEn: "Stores for weeks" },
    { bn: "বরবটি", en: "Yard-long bean", noteBn: "শরতের ফলন", noteEn: "Autumn crop" },
    { bn: "কামরাঙা", en: "Starfruit", noteBn: "টক স্বাদের জন্য", noteEn: "For sour notes" },
  ],
  9: [
    { bn: "মুলা", en: "Radish", noteBn: "শীত আসছে", noteEn: "Winter arriving" },
    { bn: "শিম", en: "Flat bean", noteBn: "নতুন মৌসুম", noteEn: "New season" },
    { bn: "কমলা লেবু", en: "Orange", noteBn: "ভিটামিন সি", noteEn: "Vitamin C boost" },
  ],
  10: [
    { bn: "ফুলকপি", en: "Cauliflower", noteBn: "সস্তা হচ্ছে", noteEn: "Getting cheaper" },
    { bn: "নতুন আলু", en: "New potato", noteBn: "নরম ও মিষ্টি", noteEn: "Soft and sweet" },
    { bn: "সরিষা শাক", en: "Mustard greens", noteBn: "শীতের স্বাদ", noteEn: "Winter flavour" },
  ],
  11: [
    { bn: "খেজুর গুড়", en: "Date palm jaggery", noteBn: "শীতের মিষ্টি", noteEn: "Winter sweetener" },
    { bn: "টমেটো", en: "Tomato", noteBn: "সবচেয়ে সস্তা", noteEn: "Cheapest now" },
    { bn: "বাঁধাকপি", en: "Cabbage", noteBn: "প্রচুর সরবরাহ", noteEn: "Plentiful" },
  ],
};

const GENERIC: SeasonalItem[] = [
  { bn: "পেঁয়াজ", en: "Onion", noteBn: "সারা বছর সস্তা", noteEn: "Good value year-round" },
  { bn: "গাজর", en: "Carrot", noteBn: "সহজলভ্য", noteEn: "Widely available" },
  { bn: "ডিম", en: "Egg", noteBn: "সস্তা প্রোটিন", noteEn: "Cheap protein" },
];

/** Seasonal picks for a month (0-11); country is a light hint. */
export function seasonalPicks(month = new Date().getMonth(), country?: string): SeasonalItem[] {
  const bengal = !country || /bangladesh|বাংলাদেশ|india|ভারত/i.test(country);
  if (!bengal) return GENERIC;
  return BD[month] ?? GENERIC;
}

export const monthName = (lang: "bn" | "en", month = new Date().getMonth()) =>
  new Date(2026, month, 1).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", { month: "long" });
