/**
 * 17. Recipe cost estimator.
 * Transparent on-device estimate: a base price table (BDT per kg / per litre /
 * per piece) multiplied by the parsed quantity. Clearly an estimate in the UI.
 */

export type CostLine = { name: string; quantity: string; taka: number; guessed: boolean };
export type CostReport = { total: number; perServing: number; lines: CostLine[] };

type Price = { perKg?: number; perPiece?: number };

const TABLE: Array<[RegExp, Price]> = [
  [/(চাল|rice)/i, { perKg: 75 }],
  [/(আটা|ময়দা|flour)/i, { perKg: 60 }],
  [/(মসুর|ডাল|lentil|dal)/i, { perKg: 135 }],
  [/(ছোলা|chickpea)/i, { perKg: 110 }],
  [/(আলু|potato)/i, { perKg: 40 }],
  [/(পেঁয়াজ|onion)/i, { perKg: 70 }],
  [/(রসুন|garlic)/i, { perKg: 220 }],
  [/(আদা|ginger)/i, { perKg: 260 }],
  [/(টমেটো|tomato)/i, { perKg: 60 }],
  [/(শাক|spinach|greens)/i, { perKg: 40 }],
  [/(ফুলকপি|বাঁধাকপি|cauliflower|cabbage)/i, { perKg: 45 }],
  [/(গাজর|carrot)/i, { perKg: 65 }],
  [/(কুমড়া|pumpkin|লাউ|gourd|ঢেঁড়স|okra|পটল)/i, { perKg: 45 }],
  [/(ডিম|egg)/i, { perPiece: 13 }],
  [/(মুরগি|chicken)/i, { perKg: 200 }],
  [/(গরু|beef)/i, { perKg: 780 }],
  [/(খাসি|mutton)/i, { perKg: 1100 }],
  [/(চিংড়ি|prawn)/i, { perKg: 700 }],
  [/(ইলিশ|hilsa)/i, { perKg: 1400 }],
  [/(মাছ|fish)/i, { perKg: 320 }],
  [/(দুধ|milk)/i, { perKg: 95 }],
  [/(দই|yogurt|curd)/i, { perKg: 160 }],
  [/(পনির|paneer|cheese)/i, { perKg: 650 }],
  [/(তেল|oil)/i, { perKg: 175 }],
  [/(ঘি|ghee|মাখন|butter)/i, { perKg: 900 }],
  [/(চিনি|sugar|গুড়|jaggery)/i, { perKg: 130 }],
  [/(লবণ|salt)/i, { perKg: 40 }],
  [/(মসলা|spice|জিরা|হলুদ|মরিচ|turmeric|cumin|chilli|chili)/i, { perKg: 400 }],
  [/(লেবু|lemon|lime)/i, { perPiece: 8 }],
  [/(কাঁচা মরিচ|green chilli)/i, { perKg: 180 }],
  [/(ধনেপাতা|coriander|herb)/i, { perKg: 120 }],
  [/(রুটি|bread|পাউরুটি)/i, { perPiece: 10 }],
];

const DEFAULT: Price = { perKg: 120 };

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const toAscii = (t: string) => t.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));

/** Parses a free-text quantity into { kg, pieces }. */
export function parseQuantity(raw: string) {
  const q = toAscii(raw || "").toLowerCase();
  const m = /(\d+(?:[.,]\d+)?)\s*(kg|কেজি|g|gm|গ্রাম|ml|মিলি|l|লিটার|tbsp|টেবিল|tsp|চা\s?চামচ|cup|কাপ|pcs|pc|টি|টা|piece)?/.exec(
    q,
  );
  if (!m) return { kg: 0.1, pieces: 0 };
  const n = Number((m[1] ?? "0").replace(",", "."));
  const unit = m[2] ?? "";
  if (!Number.isFinite(n) || n <= 0) return { kg: 0.1, pieces: 0 };
  if (/kg|কেজি|l|লিটার/.test(unit)) return { kg: n, pieces: 0 };
  if (/^(g|gm|গ্রাম|ml|মিলি)$/.test(unit)) return { kg: n / 1000, pieces: 0 };
  if (/tbsp|টেবিল/.test(unit)) return { kg: (n * 15) / 1000, pieces: 0 };
  if (/tsp|চা/.test(unit)) return { kg: (n * 5) / 1000, pieces: 0 };
  if (/cup|কাপ/.test(unit)) return { kg: (n * 200) / 1000, pieces: 0 };
  if (/pcs|pc|টি|টা|piece/.test(unit)) return { kg: 0, pieces: n };
  return { kg: 0, pieces: n };
}

function priceFor(name: string): { price: Price; guessed: boolean } {
  for (const [re, price] of TABLE) if (re.test(name)) return { price, guessed: false };
  return { price: DEFAULT, guessed: true };
}

export function estimateCost(
  ingredients: { name: string; quantity: string }[],
  servings = 2,
  factor = 1,
): CostReport {
  const lines: CostLine[] = ingredients.map((ing) => {
    const { kg, pieces } = parseQuantity(ing.quantity);
    const { price, guessed } = priceFor(ing.name);
    const perPiece = price.perPiece ?? (price.perKg ?? 120) * 0.15;
    const taka = Math.round((kg * (price.perKg ?? 120) + pieces * perPiece) * factor);
    return { name: ing.name, quantity: ing.quantity, taka: Math.max(1, taka), guessed };
  });
  const total = lines.reduce((s, l) => s + l.taka, 0);
  const people = Math.max(1, Math.round(servings * factor));
  return { total, perServing: Math.round(total / people), lines };
}

export const formatTaka = (n: number, lang: "bn" | "en") =>
  lang === "bn"
    ? `৳${String(Math.round(n)).replace(/\d/g, (d) => BN_DIGITS[Number(d)] ?? d)}`
    : `৳${Math.round(n)}`;
