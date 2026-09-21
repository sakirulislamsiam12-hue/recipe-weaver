/** Serving-scaler helpers: multiply the numeric part of a free-text quantity. */

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

const FRACTIONS: Record<string, number> = {
  "½": 0.5,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "¼": 0.25,
  "¾": 0.75,
};

function toAscii(text: string) {
  return text.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
}

function toBnDigits(text: string) {
  return text.replace(/\d/g, (d) => BN_DIGITS[Number(d)] ?? d);
}

function pretty(n: number) {
  const rounded = Math.round(n * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  if (Math.abs(rounded - Math.round(rounded * 2) / 2) < 0.001) {
    const whole = Math.floor(rounded);
    return `${whole ? `${whole} ` : ""}½`;
  }
  return rounded.toFixed(2).replace(/0$/, "");
}

/** Scales every number (including Bangla digits and vulgar fractions) in a quantity string. */
export function scaleQuantity(quantity: string, factor: number, lang: "bn" | "en" = "en") {
  if (!quantity || factor === 1) return quantity;
  const bengali = /[০-৯]/.test(quantity) || lang === "bn";
  let out = toAscii(quantity);

  out = out.replace(/[½⅓⅔¼¾]/g, (f) => String(FRACTIONS[f] ?? f));
  out = out.replace(/(\d+(?:\.\d+)?)(\s*\/\s*(\d+(?:\.\d+)?))?/g, (_m, a: string, _s, b?: string) => {
    const base = b ? Number(a) / Number(b) : Number(a);
    if (!Number.isFinite(base)) return String(a);
    return pretty(base * factor);
  });

  return bengali ? toBnDigits(out) : out;
}

export const SERVING_STEPS = [1, 2, 4, 6, 8, 12] as const;
